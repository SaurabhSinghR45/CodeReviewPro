from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class AgentConfig(BaseModel):
    style: bool = True
    bugs: bool = True
    security: bool = True
    performance: bool = True

class ReviewRequest(BaseModel):
    github_url: Optional[str] = None
    raw_code: Optional[str] = None
    language: Optional[str] = "auto"
    selected_files: Optional[List[str]] = None
    agents_config: Optional[AgentConfig] = Field(default_factory=AgentConfig)
    strictness: Optional[str] = "standard"  # lenient, standard, strict
    user_email: Optional[str] = "guest@codereview.pro"
    problem_context: Optional[str] = None
    constraints: Optional[str] = None

class RepoFileItem(BaseModel):
    path: str
    size: int = 0
    extension: str = ""
    url: str = ""

class InspectRepoRequest(BaseModel):
    url: str

class InspectRepoResponse(BaseModel):
    owner: str
    repo: str
    full_name: str
    description: Optional[str] = ""
    stars: int = 0
    forks: int = 0
    language: str = "Unknown"
    default_branch: str = "main"
    html_url: str = ""
    files: List[RepoFileItem] = []

class FindingItem(BaseModel):
    line: Optional[str] = "N/A"
    issue: str
    suggestion: str
    code_snippet: Optional[str] = None

class SecurityFindingItem(BaseModel):
    line: Optional[str] = "N/A"
    issue: str
    severity: str = "medium"  # low, medium, high, critical
    cwe_id: Optional[str] = None
    suggestion: str
    remediation_code: Optional[str] = None

class PerformanceFindingItem(BaseModel):
    line: Optional[str] = "N/A"
    issue: str
    impact: str = "medium"  # low, medium, high
    suggestion: str

class HealthScore(BaseModel):
    score: int = 100
    grade: str = "A+"
    style_score: int = 100
    bug_score: int = 100
    security_score: int = 100
    performance_score: int = 100

class ReviewResponse(BaseModel):
    id: int
    source_url: str
    language: str = "auto"
    code_snippet: str = ""
    health_score: HealthScore
    style: List[FindingItem] = []
    bugs: List[FindingItem] = []
    security: List[SecurityFindingItem] = []
    performance: List[PerformanceFindingItem] = []
    summary: str
    remediated_code: Optional[str] = ""
    created_at: str

class ReviewListItem(BaseModel):
    id: int
    source_url: str
    language: str = "auto"
    health_score: int = 100
    health_grade: str = "A"
    summary: str
    created_at: str
