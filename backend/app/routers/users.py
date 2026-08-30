from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, SystemLog
from app.schemas import UserOut, UserCreateAdmin, UserUpdateAdmin
from app.auth.jwt import get_password_hash
from app.auth.deps import require_admin

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).order_by(User.id.desc()).all()

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreateAdmin, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing_username = db.query(User).filter(User.username == data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
        
    role = data.role if data.role in ["Admin", "Security Analyst", "Viewer"] else "Viewer"
    hashed_pwd = get_password_hash(data.password)
    
    new_user = User(
        full_name=data.full_name,
        username=data.username,
        email=data.email.lower(),
        phone=data.phone,
        password_hash=hashed_pwd,
        role=role,
        is_active=True,
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log = SystemLog(user_id=current_user.id, action="ADMIN_CREATE_USER", details=f"Created user {new_user.username} with role {new_user.role}")
    db.add(log)
    db.commit()
    
    return new_user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdateAdmin, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if data.full_name:
        user.full_name = data.full_name
    if data.email:
        user.email = data.email.lower()
    if data.phone is not None:
        user.phone = data.phone
    if data.role and data.role in ["Admin", "Security Analyst", "Viewer"]:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
        
    db.commit()
    db.refresh(user)
    
    log = SystemLog(user_id=current_user.id, action="ADMIN_UPDATE_USER", details=f"Updated user {user.username}")
    db.add(log)
    db.commit()
    
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    
    log = SystemLog(user_id=current_user.id, action="ADMIN_DELETE_USER", details=f"Deleted user ID {user_id}")
    db.add(log)
    db.commit()
    
    return {"message": "User deleted successfully"}
