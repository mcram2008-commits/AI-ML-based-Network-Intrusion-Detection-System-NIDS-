import os
import re
import uuid
import datetime
import hashlib
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SharedLink, User
from app.auth.jwt import get_password_hash, verify_password
from app.auth.deps import get_optional_user
from app.config import settings

router = APIRouter(prefix="/share", tags=["Secure Secret Data Sharing"])

UPLOAD_SHARE_DIR = os.path.join(settings.UPLOADS_DIR, "shared_files")
os.makedirs(UPLOAD_SHARE_DIR, exist_ok=True)


# PII Anonymization & Security Helpers
IP_REGEX = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')

def _anonymize_string(text: str) -> str:
    if not isinstance(text, str):
        return text
        
    def mask_ip(match):
        parts = match.group(0).split('.')
        return f"{parts[0]}.{parts[1]}.x.x"
        
    def mask_email(match):
        email = match.group(0)
        name, domain = email.split('@')
        if len(name) <= 2:
            masked_name = name[0] + "*"
        else:
            masked_name = name[0] + "***" + name[-1]
        return f"{masked_name}@{domain}"
        
    text = IP_REGEX.sub(mask_ip, text)
    text = EMAIL_REGEX.sub(mask_email, text)
    return text

def anonymize_payload(data: Any) -> Any:
    """Recursively mask sensitive IP addresses and email credentials in shared payloads."""
    if isinstance(data, dict):
        new_dict = {}
        for k, v in data.items():
            if k in ["source_ip", "destination_ip", "ip"] and isinstance(v, str):
                parts = v.split('.')
                new_dict[k] = f"{parts[0]}.{parts[1]}.x.x" if len(parts) == 4 else _anonymize_string(v)
            elif k in ["email", "user_email"] and isinstance(v, str):
                new_dict[k] = _anonymize_string(v)
            else:
                new_dict[k] = anonymize_payload(v)
        return new_dict
    elif isinstance(data, list):
        return [anonymize_payload(item) for item in data]
    elif isinstance(data, str):
        return _anonymize_string(data)
    else:
        return data


def _get_client_ip(request: Request) -> str:
    if not request:
        return "127.0.0.1"
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def _check_ip_lock(share_rec: SharedLink, request: Request):
    if share_rec.destination_ip_lock and share_rec.destination_ip_lock.strip():
        target_ip = share_rec.destination_ip_lock.strip()
        client_ip = _get_client_ip(request)
        if target_ip in ["127.0.0.1", "localhost"] and client_ip in ["127.0.0.1", "localhost", "::1"]:
            return
        if client_ip != target_ip:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: This secret share is locked to designated recipient IP ({target_ip}). Your request IP ({client_ip}) is not authorized."
            )


def _transform_chunk(chunk: bytes, key_bytes: bytes, offset: int = 0) -> bytes:
    key_len = len(key_bytes)
    return bytes([b ^ key_bytes[(i + offset) % key_len] for i, b in enumerate(chunk)])


# Pydantic Schemas
class CreateShareLinkRequest(BaseModel):
    title: Optional[str] = "SOC Security Audit Report"
    payload: Optional[Dict[str, Any]] = {}
    expiry_hours: Optional[int] = 24
    single_view: Optional[bool] = False
    passphrase: Optional[str] = None
    mask_pii: Optional[bool] = True
    destination_ip: Optional[str] = None


class VerifyPassphraseRequest(BaseModel):
    token: str
    passphrase: str


@router.post("/create")
def create_share_link(
    req: CreateShareLinkRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    token = f"SEC-SHARE-{uuid.uuid4().hex[:10].upper()}"
    
    expires_at = None
    if req.expiry_hours and req.expiry_hours > 0:
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=req.expiry_hours)
        
    max_views = 1 if req.single_view else None
    
    passphrase_hash = None
    if req.passphrase and req.passphrase.strip():
        passphrase_hash = get_password_hash(req.passphrase.strip())
        
    payload_data = req.payload
    if req.mask_pii:
        payload_data = anonymize_payload(payload_data)
        
    share_rec = SharedLink(
        token=token,
        title=req.title,
        payload_json=payload_data,
        passphrase_hash=passphrase_hash,
        mask_pii=req.mask_pii,
        expires_at=expires_at,
        max_views=max_views,
        view_count=0,
        destination_ip_lock=req.destination_ip.strip() if (req.destination_ip and req.destination_ip.strip()) else None,
        created_at=datetime.datetime.utcnow()
    )
    
    db.add(share_rec)
    db.commit()
    db.refresh(share_rec)
    
    return {
        "status": "success",
        "token": token,
        "share_url": f"/share/{token}",
        "expires_at": share_rec.expires_at,
        "is_single_view": req.single_view,
        "is_passphrase_protected": bool(passphrase_hash),
        "is_pii_masked": req.mask_pii,
        "destination_ip_lock": share_rec.destination_ip_lock
    }


@router.post("/upload-file")
async def upload_share_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form("Bulk Encrypted File Share"),
    expiry_hours: Optional[int] = Form(24),
    single_view: Optional[bool] = Form(False),
    passphrase: Optional[str] = Form(None),
    mask_pii: Optional[bool] = Form(True),
    destination_ip: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    token = f"SEC-SHARE-{uuid.uuid4().hex[:10].upper()}"
    os.makedirs(UPLOAD_SHARE_DIR, exist_ok=True)
    
    file_path = os.path.join(UPLOAD_SHARE_DIR, f"{token}_{file.filename}.enc")
    key_bytes = hashlib.sha256(token.encode('utf-8')).digest()
    file_size = 0
    
    with open(file_path, "wb") as f:
        while chunk := await file.read(64 * 1024):
            encrypted_chunk = _transform_chunk(chunk, key_bytes, file_size)
            f.write(encrypted_chunk)
            file_size += len(chunk)
            
    expires_at = None
    if expiry_hours and expiry_hours > 0:
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=expiry_hours)
        
    max_views = 1 if single_view else None
    passphrase_hash = get_password_hash(passphrase.strip()) if (passphrase and passphrase.strip()) else None
    
    dest_ip = destination_ip.strip() if (destination_ip and destination_ip.strip()) else None
    
    payload_data = {
        "title": title or file.filename,
        "file_name": file.filename,
        "file_size_bytes": file_size,
        "is_encrypted_file": True,
        "data_type": "2GB Encrypted Bulk Network Capture / File Payload",
        "destination_ip_lock": dest_ip
    }
    
    share_rec = SharedLink(
        token=token,
        title=title or file.filename,
        payload_json=payload_data,
        passphrase_hash=passphrase_hash,
        mask_pii=mask_pii,
        expires_at=expires_at,
        max_views=max_views,
        view_count=0,
        file_path=file_path,
        file_name=file.filename,
        file_size_bytes=file_size,
        destination_ip_lock=dest_ip,
        created_at=datetime.datetime.utcnow()
    )
    
    db.add(share_rec)
    db.commit()
    
    return {
        "status": "success",
        "token": token,
        "share_url": f"/share/{token}",
        "file_name": file.filename,
        "file_size_bytes": file_size,
        "destination_ip_lock": dest_ip
    }


@router.get("/view/{token}")
def view_shared_link(token: str, request: Request, db: Session = Depends(get_db)):
    share_rec = db.query(SharedLink).filter(SharedLink.token == token).first()
    if not share_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared link not found or has been removed."
        )
        
    if share_rec.expires_at and datetime.datetime.utcnow() > share_rec.expires_at:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This secret share link has expired and is no longer accessible."
        )
        
    if share_rec.max_views and share_rec.view_count >= share_rec.max_views:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This single-view secret link has already been viewed and self-destructed."
        )
        
    _check_ip_lock(share_rec, request)
    
    if share_rec.passphrase_hash:
        return {
            "token": token,
            "title": share_rec.title,
            "is_protected": True,
            "created_at": share_rec.created_at,
            "expires_at": share_rec.expires_at,
            "mask_pii": share_rec.mask_pii,
            "file_name": share_rec.file_name,
            "file_size_bytes": share_rec.file_size_bytes,
            "destination_ip_lock": share_rec.destination_ip_lock,
            "has_file": bool(share_rec.file_path)
        }
        
    share_rec.view_count += 1
    db.commit()
    
    return {
        "token": token,
        "title": share_rec.title,
        "is_protected": False,
        "payload": share_rec.payload_json,
        "created_at": share_rec.created_at,
        "expires_at": share_rec.expires_at,
        "mask_pii": share_rec.mask_pii,
        "view_count": share_rec.view_count,
        "file_name": share_rec.file_name,
        "file_size_bytes": share_rec.file_size_bytes,
        "destination_ip_lock": share_rec.destination_ip_lock,
        "has_file": bool(share_rec.file_path)
    }


@router.post("/verify-passphrase")
def verify_share_passphrase(req: VerifyPassphraseRequest, request: Request, db: Session = Depends(get_db)):
    share_rec = db.query(SharedLink).filter(SharedLink.token == req.token).first()
    if not share_rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found.")
        
    if share_rec.expires_at and datetime.datetime.utcnow() > share_rec.expires_at:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Link expired.")
        
    if share_rec.max_views and share_rec.view_count >= share_rec.max_views:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Link self-destructed after view.")
        
    _check_ip_lock(share_rec, request)
    
    if not share_rec.passphrase_hash or not verify_password(req.passphrase, share_rec.passphrase_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect secret passcode. Access denied."
        )
        
    share_rec.view_count += 1
    db.commit()
    
    return {
        "token": req.token,
        "title": share_rec.title,
        "is_protected": True,
        "payload": share_rec.payload_json,
        "created_at": share_rec.created_at,
        "expires_at": share_rec.expires_at,
        "mask_pii": share_rec.mask_pii,
        "view_count": share_rec.view_count,
        "file_name": share_rec.file_name,
        "file_size_bytes": share_rec.file_size_bytes,
        "destination_ip_lock": share_rec.destination_ip_lock,
        "has_file": bool(share_rec.file_path)
    }


@router.get("/download-file/{token}")
def download_shared_file(token: str, passphrase: Optional[str] = None, request: Request = None, db: Session = Depends(get_db)):
    share_rec = db.query(SharedLink).filter(SharedLink.token == token).first()
    if not share_rec or not share_rec.file_path or not os.path.exists(share_rec.file_path):
        raise HTTPException(status_code=404, detail="Shared encrypted file not found.")
        
    if share_rec.expires_at and datetime.datetime.utcnow() > share_rec.expires_at:
        raise HTTPException(status_code=410, detail="This shared file link has expired.")
    if share_rec.max_views and share_rec.view_count >= share_rec.max_views:
        raise HTTPException(status_code=410, detail="This single-view file link has already self-destructed.")
        
    _check_ip_lock(share_rec, request)
    
    if share_rec.passphrase_hash:
        if not passphrase or not verify_password(passphrase, share_rec.passphrase_hash):
            raise HTTPException(status_code=401, detail="Passcode required to decrypt file download.")
            
    key_bytes = hashlib.sha256(token.encode('utf-8')).digest()
    
    def file_iterator():
        with open(share_rec.file_path, "rb") as f:
            offset = 0
            while chunk := f.read(64 * 1024):
                decrypted_chunk = _transform_chunk(chunk, key_bytes, offset)
                offset += len(chunk)
                yield decrypted_chunk
                
    return StreamingResponse(
        file_iterator(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{share_rec.file_name}"'}
    )


@router.get("/{token}")
def redirect_to_frontend_share(token: str):
    return RedirectResponse(url=f"http://localhost:5173/share/{token}")
