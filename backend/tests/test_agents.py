import pytest
from unittest.mock import patch, AsyncMock
from agents.style_agent import analyze_style
from agents.bug_agent import analyze_bugs
from agents.security_agent import analyze_security
from agents.performance_agent import analyze_performance
from agents.summary_agent import generate_summary
from agents.orchestrator import run_orchestrator, calculate_health_score

SAMPLE_CODE = """def add(a,b):
  return a+b
"""

@pytest.mark.asyncio
async def test_style_agent():
    mock_llm_response = '{"issues": [{"line": "Line 1", "issue": "Missing spaces around parameters", "suggestion": "Use def add(a, b):"}]}'
    with patch("agents.style_agent.call_llm", new=AsyncMock(return_value=mock_llm_response)):
        result = await analyze_style(SAMPLE_CODE)
        assert "issues" in result
        assert len(result["issues"]) == 1
        assert result["issues"][0]["issue"] == "Missing spaces around parameters"

@pytest.mark.asyncio
async def test_bug_agent():
    mock_llm_response = '{"bugs": [{"line": "Line 2", "issue": "No type checking", "suggestion": "Ensure parameters are numbers"}]}'
    with patch("agents.bug_agent.call_llm", new=AsyncMock(return_value=mock_llm_response)):
        result = await analyze_bugs(SAMPLE_CODE)
        assert "bugs" in result
        assert len(result["bugs"]) == 1
        assert result["bugs"][0]["issue"] == "No type checking"

@pytest.mark.asyncio
async def test_security_agent():
    mock_llm_response = '{"security": [{"line": "Line 1", "issue": "Unsanitized user input", "severity": "medium", "cwe_id": "CWE-89", "suggestion": "Validate inputs"}]}'
    with patch("agents.security_agent.call_llm", new=AsyncMock(return_value=mock_llm_response)):
        result = await analyze_security(SAMPLE_CODE)
        assert "security" in result
        assert len(result["security"]) == 1
        assert result["security"][0]["severity"] == "medium"
        assert result["security"][0]["cwe_id"] == "CWE-89"

@pytest.mark.asyncio
async def test_performance_agent():
    mock_llm_response = '{"performance": [{"line": "Line 2", "issue": "Nested O(n^2) loop", "impact": "high", "suggestion": "Use set lookups"}]}'
    with patch("agents.performance_agent.call_llm", new=AsyncMock(return_value=mock_llm_response)):
        result = await analyze_performance(SAMPLE_CODE)
        assert "performance" in result
        assert len(result["performance"]) == 1
        assert result["performance"][0]["impact"] == "high"

@pytest.mark.asyncio
async def test_summary_agent():
    style = {"issues": [{"line": "1", "issue": "Spacing", "suggestion": "Fix space"}]}
    bugs = {"bugs": []}
    sec = {"security": []}
    mock_summary = "Overall code looks good. Fix the single spacing issue."

    with patch("agents.summary_agent.call_llm", new=AsyncMock(return_value=mock_summary)):
        summary = await generate_summary(style, bugs, sec)
        assert "Overall code looks good" in summary

def test_health_score_calculation():
    health = calculate_health_score([], [], [], [])
    assert health["score"] == 100
    assert health["grade"] == "A+"

    flawed_health = calculate_health_score(
        [{"line": "1"}], 
        [{"line": "2"}], 
        [{"line": "3", "severity": "high"}], 
        [{"line": "4"}]
    )
    assert flawed_health["score"] < 100

@pytest.mark.asyncio
async def test_orchestrator():
    with patch("agents.orchestrator.analyze_style", new=AsyncMock(return_value={"issues": []})), \
         patch("agents.orchestrator.analyze_bugs", new=AsyncMock(return_value={"bugs": []})), \
         patch("agents.orchestrator.analyze_security", new=AsyncMock(return_value={"security": []})), \
         patch("agents.orchestrator.analyze_performance", new=AsyncMock(return_value={"performance": []})), \
         patch("agents.orchestrator.generate_summary", new=AsyncMock(return_value="Clean code.")):
        
        result = await run_orchestrator(SAMPLE_CODE)
        assert "style" in result
        assert "bugs" in result
        assert "security" in result
        assert "performance" in result
        assert "health_score" in result
        assert result["health_score"]["score"] == 100
        assert result["summary"] == "Clean code."
