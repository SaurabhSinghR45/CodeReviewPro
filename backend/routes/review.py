import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Review
from schemas import (
    ReviewRequest, 
    ReviewResponse, 
    ReviewListItem, 
    HealthScore, 
    InspectRepoRequest, 
    InspectRepoResponse
)
from github_fetcher import fetch_github_code, inspect_github_repo
from agents.orchestrator import run_orchestrator

router = APIRouter(prefix="", tags=["Reviews"])

MAX_CODE_CHARS = 20000

@router.post("/github/inspect", response_model=InspectRepoResponse)
async def inspect_repo_endpoint(req: InspectRepoRequest):
    """
    Inspects a GitHub repository or URL and returns repository metadata and code file tree.
    """
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub URL is required.")
    try:
        data = await inspect_github_repo(req.url.strip())
        return data
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to inspect GitHub repository: {str(e)}")

@router.post("/review", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_review(req: ReviewRequest, db: Session = Depends(get_db)):
    # 1. Input Validation: exactly one of github_url or raw_code must be provided
    has_url = bool(req.github_url and req.github_url.strip())
    has_code = bool(req.raw_code and req.raw_code.strip())

    if has_url and has_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide either 'github_url' or 'raw_code', but not both."
        )
    if not has_url and not has_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'github_url' or 'raw_code' must be provided."
        )

    code_to_review = ""
    source_url = "pasted code"

    # 2. Fetch code if URL provided
    if has_url:
        source_url = req.github_url.strip()
        try:
            code_to_review = await fetch_github_code(source_url, selected_files=req.selected_files)
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch GitHub code: {str(e)}")
    else:
        code_to_review = req.raw_code

    # 3. Size and empty check
    if not code_to_review or not code_to_review.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submitted code is empty."
        )

    if len(code_to_review) > MAX_CODE_CHARS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Submitted code exceeds character limit of {MAX_CODE_CHARS} characters (got {len(code_to_review)} characters)."
        )

    # 4. Run multi-agent orchestrator
    language = req.language or "auto"
    agents_cfg = req.agents_config.model_dump() if req.agents_config else {"style": True, "bugs": True, "security": True, "performance": True}
    strictness = req.strictness or "standard"
    orchestrator_res = await run_orchestrator(
        code_to_review, 
        language, 
        agents_config=agents_cfg, 
        strictness=strictness,
        problem_context=req.problem_context,
        constraints=req.constraints
    )

    health_data = orchestrator_res.get("health_score", {
        "score": 100, "grade": "A+", "style_score": 100, "bug_score": 100, "security_score": 100, "performance_score": 100
    })

    # 5. Save to database with user_email isolation
    user_email = req.user_email.strip() if req.user_email and req.user_email.strip() else "guest@codereview.pro"
    db_review = Review(
        user_email=user_email,
        source_url=source_url,
        language=language,
        code_snippet=code_to_review,
        health_score=health_data.get("score", 100),
        health_grade=health_data.get("grade", "A+"),
        style_findings=json.dumps(orchestrator_res["style"]),
        bug_findings=json.dumps(orchestrator_res["bugs"]),
        security_findings=json.dumps(orchestrator_res["security"]),
        performance_findings=json.dumps(orchestrator_res.get("performance", [])),
        summary=orchestrator_res["summary"],
        remediated_code=orchestrator_res.get("remediated_code", "")
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    return ReviewResponse(
        id=db_review.id,
        source_url=db_review.source_url,
        language=db_review.language,
        code_snippet=db_review.code_snippet,
        health_score=HealthScore(**health_data),
        style=orchestrator_res["style"],
        bugs=orchestrator_res["bugs"],
        security=orchestrator_res["security"],
        performance=orchestrator_res.get("performance", []),
        summary=db_review.summary,
        remediated_code=db_review.remediated_code or orchestrator_res.get("remediated_code", ""),
        created_at=db_review.created_at.isoformat()
    )

@router.get("/reviews", response_model=List[ReviewListItem])
def list_reviews(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Review)
    if user_email and user_email.strip() and user_email.strip() != "all":
        query = query.filter(Review.user_email == user_email.strip())
    reviews = query.order_by(Review.created_at.desc()).all()
    return [
        ReviewListItem(
            id=r.id,
            source_url=r.source_url,
            language=getattr(r, "language", "auto") or "auto",
            health_score=getattr(r, "health_score", 100) or 100,
            health_grade=getattr(r, "health_grade", "A") or "A",
            summary=r.summary,
            created_at=r.created_at.isoformat()
        )
        for r in reviews
    ]

@router.get("/reviews/{review_id}", response_model=ReviewResponse)
def get_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review with ID {review_id} not found."
        )

    style = json.loads(review.style_findings) if review.style_findings else []
    bugs = json.loads(review.bug_findings) if review.bug_findings else []
    security = json.loads(review.security_findings) if review.security_findings else []
    performance = json.loads(getattr(review, "performance_findings", "[]") or "[]")

    from agents.orchestrator import calculate_health_score
    health_data = calculate_health_score(style, bugs, security, performance)
    if hasattr(review, "health_score") and review.health_score:
        health_data["score"] = review.health_score
    if hasattr(review, "health_grade") and review.health_grade:
        health_data["grade"] = review.health_grade

    return ReviewResponse(
        id=review.id,
        source_url=review.source_url,
        language=getattr(review, "language", "auto") or "auto",
        code_snippet=review.code_snippet or "",
        health_score=HealthScore(**health_data),
        style=style,
        bugs=bugs,
        security=security,
        performance=performance,
        summary=review.summary,
        created_at=review.created_at.isoformat()
    )
