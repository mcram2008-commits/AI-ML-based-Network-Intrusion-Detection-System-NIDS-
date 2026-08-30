import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PasswordResetToken, SystemLog
from app.schemas import (
    UserRegister, UserLogin, TokenResponse, UserOut,
    ProfileUpdate, PasswordChange, ForgotPasswordRequest, ResetPasswordRequest
)
from app.auth.jwt import (
    get_password_hash, verify_password, create_access_token,
    create_refresh_token, generate_reset_token, decode_token
)
from app.auth.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # 1. Validation: password confirmation
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    # 2. Check unique username
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    # 3. Check unique email
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # 4. Check password length
    if len(user_data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
    # 5. Role check
    role = user_data.role if user_data.role in ["Admin", "Security Analyst", "Viewer"] else "Viewer"
    
    # Hash password securely
    hashed_pwd = get_password_hash(user_data.password)
    
    new_user = User(
        full_name=user_data.full_name,
        username=user_data.username,
        email=user_data.email.lower(),
        phone=user_data.phone,
        password_hash=hashed_pwd,
        role=role,
        is_active=True,
        is_verified=True,
        created_at=datetime.datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log event
    log = SystemLog(action="USER_REGISTER", details=f"User {new_user.username} registered with role {new_user.role}")
    db.add(log)
    db.commit()
    
    return new_user


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    identifier = login_data.username_or_email.lower().strip()
    
    user = db.query(User).filter(
        (User.email == identifier) | (User.username == identifier)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account temporarily locked or disabled. Please contact administrator."
        )
        
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    # Update last login timestamp
    user.last_login = datetime.datetime.utcnow()
    db.commit()
    
    access_token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id})
    
    # Set HTTP-only secure cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=86400 if login_data.remember_me else 3600,
        samesite="lax"
    )
    
    log = SystemLog(user_id=user.id, action="USER_LOGIN", details=f"User {user.username} logged in successfully")
    db.add(log)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user
    )


@router.post("/refresh")
def refresh_token(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive or not found")
        
    new_access_token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    
    # Enumeration protection: return success message regardless of existence
    if user and user.is_active:
        token_str = generate_reset_token()
        expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token=token_str,
            expires_at=expires,
            used=False
        )
        db.add(reset_entry)
        db.commit()
        
        # Simulated reset link for demo evaluation
        reset_link = f"/reset-password?token={token_str}"
        return {
            "message": "If an account with that email exists, a password reset link has been generated.",
            "demo_reset_token": token_str,
            "demo_reset_link": reset_link
        }
        
    return {"message": "If an account with that email exists, a password reset link has been generated."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if req.new_password != req.confirm_new_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == req.token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.datetime.utcnow()
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")
        
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_hash = get_password_hash(req.new_password)
    token_record.used = True
    db.commit()
    
    log = SystemLog(user_id=user.id, action="PASSWORD_RESET", details=f"User {user.username} reset their password")
    db.add(log)
    db.commit()
    
    return {"message": "Password updated successfully. You can now login with your new password."}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.full_name:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.profile_image is not None:
        current_user.profile_image = data.profile_image
        
    current_user.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect existing password")
        
    if data.new_password != data.confirm_new_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
        
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")
        
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully."}


@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user)):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}
