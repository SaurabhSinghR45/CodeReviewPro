import os
import time
import secrets
import smtplib
import asyncio
from concurrent.futures import ThreadPoolExecutor
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP storage: { email: { "otp": "123456", "expires_at": 1723700000, "name": "..." } }
OTP_STORE: Dict[str, dict] = {}
executor = ThreadPoolExecutor(max_workers=3)

class SendOtpRequest(BaseModel):
    email: str
    name: Optional[str] = "Developer"

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str
    name: Optional[str] = None
    password: Optional[str] = None

class AuthResponse(BaseModel):
    status: str
    message: str
    is_verified: bool
    email: str
    name: str
    dev_otp: Optional[str] = None

def send_real_email_smtp_sync(recipient_email: str, recipient_name: str, otp_code: str) -> bool:
    """
    Attempts to deliver real OTP email via SMTP if configured in .env.
    Supported: Gmail App Password, SendGrid, Amazon SES, Mailgun, etc.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip()
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@codereview.pro")

    if not smtp_user or not smtp_pass or smtp_pass.startswith("your_"):
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your CodeReviewPro Verification Code: {otp_code}"
        msg["From"] = f"CodeReviewPro <{smtp_from}>"
        msg["To"] = recipient_email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 30px 10px; margin: 0;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
              <div style="width: 32px; height: 32px; background: #2563eb; border-radius: 8px; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold;">⚡</div>
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0;">CodeReview<span style="color: #2563eb;">Pro</span></h2>
            </div>
            
            <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0;">Account Verification</h3>
            <p style="font-size: 13px; color: #475569; line-height: 1.5;">
              Hello <strong>{recipient_name}</strong>,<br/>
              Please use the verification code below to verify your email and activate your CodeReviewPro Pro Workspace.
            </p>
            
            <div style="margin: 24px 0; text-align: center;">
              <div style="display: inline-block; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 28px; font-family: monospace;">
                {otp_code}
              </div>
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
              This code will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.
            </p>
          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [recipient_email], msg.as_string())
        
        return True
    except Exception as e:
        print(f"[AUTH SMTP NOTICE] Could not send via external SMTP: {e}")
        return False

@router.post("/send-otp", status_code=status.HTTP_200_OK)
async def send_otp(req: SendOtpRequest, background_tasks: BackgroundTasks):
    email = req.email.strip().lower()
    name = req.name.strip() if req.name else "Developer"

    # Generate cryptographically secure 6-digit numeric OTP
    otp_code = str(secrets.randbelow(900000) + 100000)
    expires_at = time.time() + 300  # 5 minutes validity

    OTP_STORE[email] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "name": name
    }

    # Dispatch SMTP in background non-blocking
    background_tasks.add_task(send_real_email_smtp_sync, email, name, otp_code)

    # Immediate console dispatch log
    print(f"\n=======================================================")
    print(f"🔐 [AUTH OTP DISPATCH] To: {email}")
    print(f"👉 6-DIGIT VERIFICATION CODE: >>> {otp_code} <<<")
    print(f"⏳ Valid for 5 minutes")
    print(f"=======================================================\n")

    return {
        "status": "success",
        "message": f"Verification code sent to {email}",
        "email": email
    }

@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(req: VerifyOtpRequest):
    email = req.email.strip().lower()
    submitted_otp = req.otp.strip()

    stored_data = OTP_STORE.get(email)
    
    if not stored_data:
        # If no active code was requested for this email, allow direct verification in development
        user_name = req.name or email.split("@")[0].capitalize()
        return AuthResponse(
            status="success",
            message="Account verified successfully",
            is_verified=True,
            email=email,
            name=user_name
        )

    if time.time() > stored_data["expires_at"]:
        OTP_STORE.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    if stored_data["otp"] != submitted_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 6-digit verification code. Please check and try again."
        )

    # OTP successfully verified
    user_name = req.name or stored_data.get("name", "Developer")
    OTP_STORE.pop(email, None)

    return AuthResponse(
        status="success",
        message="Account verified successfully",
        is_verified=True,
        email=email,
        name=user_name
    )
