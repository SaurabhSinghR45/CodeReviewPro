import asyncio
from agents.style_agent import analyze_style
from agents.bug_agent import analyze_bugs
from agents.security_agent import analyze_security
from agents.performance_agent import analyze_performance
from agents.summary_agent import generate_summary

def calculate_health_score(style_issues, bug_issues, sec_issues, perf_issues):
    # Category sub-scores starting at 100
    style_sub = max(0, 100 - len(style_issues) * 5)
    bug_sub = max(0, 100 - len(bug_issues) * 12)
    perf_sub = max(0, 100 - len(perf_issues) * 10)

    sec_penalty = 0
    for s in sec_issues:
        sev = str(s.get("severity", "medium")).lower()
        if sev == "critical":
            sec_penalty += 30
        elif sev == "high":
            sec_penalty += 20
        elif sev == "medium":
            sec_penalty += 10
        else:
            sec_penalty += 5

    sec_sub = max(0, 100 - sec_penalty)

    # Weighted overall score (Security 35%, Bugs 30%, Performance 20%, Style 15%)
    overall = int(round(
        (sec_sub * 0.35) + (bug_sub * 0.30) + (perf_sub * 0.20) + (style_sub * 0.15)
    ))
    overall = max(0, min(100, overall))

    # Grade assignment
    if overall >= 95:
        grade = "A+"
    elif overall >= 88:
        grade = "A"
    elif overall >= 78:
        grade = "B"
    elif overall >= 68:
        grade = "C"
    elif overall >= 55:
        grade = "D"
    else:
        grade = "F"

    return {
        "score": overall,
        "grade": grade,
        "style_score": style_sub,
        "bug_score": bug_sub,
        "security_score": sec_sub,
        "performance_score": perf_sub
    }

async def run_orchestrator(code: str, language: str = "auto", agents_config: dict = None, strictness: str = "standard") -> dict:
    if agents_config is None:
        agents_config = {"style": True, "bugs": True, "security": True, "performance": True}

    tasks = []
    task_keys = []

    if agents_config.get("style", True):
        tasks.append(analyze_style(code, language))
        task_keys.append("style")
    if agents_config.get("bugs", True):
        tasks.append(analyze_bugs(code, language))
        task_keys.append("bugs")
    if agents_config.get("security", True):
        tasks.append(analyze_security(code, language))
        task_keys.append("security")
    if agents_config.get("performance", True):
        tasks.append(analyze_performance(code, language))
        task_keys.append("performance")

    results_list = await asyncio.gather(*tasks, return_exceptions=True)

    style_res = {"issues": []}
    bug_res = {"bugs": []}
    sec_res = {"security": []}
    perf_res = {"performance": []}

    for key, res in zip(task_keys, results_list):
        if isinstance(res, Exception):
            res = {"error": str(res)}

        if key == "style":
            style_res = res if isinstance(res, dict) else {"issues": [], "error": str(res)}
        elif key == "bugs":
            bug_res = res if isinstance(res, dict) else {"bugs": [], "error": str(res)}
        elif key == "security":
            sec_res = res if isinstance(res, dict) else {"security": [], "error": str(res)}
        elif key == "performance":
            perf_res = res if isinstance(res, dict) else {"performance": [], "error": str(res)}

    # Generate staff engineer summary
    summary_text = await generate_summary(style_res, bug_res, sec_res)

    # Compute Health Score
    style_issues = style_res.get("issues", [])
    bug_issues = bug_res.get("bugs", [])
    sec_issues = sec_res.get("security", [])
    perf_issues = perf_res.get("performance", [])

    health_data = calculate_health_score(style_issues, bug_issues, sec_issues, perf_issues)

    return {
        "style": style_issues,
        "bugs": bug_issues,
        "security": sec_issues,
        "performance": perf_issues,
        "summary": summary_text,
        "health_score": health_data
    }
