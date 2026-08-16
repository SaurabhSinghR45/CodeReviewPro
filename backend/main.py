from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes.review import router as review_router
from routes.auth import router as auth_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Multi-Agent Code Review Assistant API",
    description="Automated multi-agent code analysis service powering AI code reviews.",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(review_router)
app.include_router(auth_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
