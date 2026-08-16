from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_email = Column(String, nullable=True, default="guest@codereview.pro", index=True)
    source_url = Column(String, nullable=False, default="pasted code")
    language = Column(String, nullable=False, default="auto")
    code_snippet = Column(Text, nullable=False)
    health_score = Column(Integer, nullable=False, default=100)
    health_grade = Column(String, nullable=False, default="A")
    style_findings = Column(Text, nullable=False, default="[]")
    bug_findings = Column(Text, nullable=False, default="[]")
    security_findings = Column(Text, nullable=False, default="[]")
    performance_findings = Column(Text, nullable=False, default="[]")
    summary = Column(Text, nullable=False, default="")
    remediated_code = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
