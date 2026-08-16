import asyncio
import re
from agents.style_agent import analyze_style
from agents.bug_agent import analyze_bugs
from agents.security_agent import analyze_security
from agents.performance_agent import analyze_performance
from agents.summary_agent import generate_summary
from agents.remediation_agent import generate_remediated_code

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

def sanitize_line_numbers(issues_list, total_lines: int):
    """Ensure line numbers strictly match the user's actual source code line count"""
    for item in issues_list:
        if isinstance(item, dict) and "line" in item and item["line"]:
            line_str = str(item["line"])
            nums = re.findall(r'\d+', line_str)
            if nums:
                val = int(nums[0])
                if val > total_lines:
                    # Clamp to last valid line
                    item["line"] = f"Line {total_lines}"
                elif val < 1:
                    item["line"] = "Line 1"

def deduplicate_findings(style_issues, bug_issues, sec_issues, perf_issues):
    """Deduplicate findings so user is not bombarded with repeated issues on the same line"""
    seen_lines = set()
    unique_bugs = []
    unique_sec = []
    unique_perf = []
    unique_style = []

    # Priority 1: Bugs (Real logic flaws)
    for b in bug_issues:
        line_key = str(b.get("line", "")).strip()
        if line_key and line_key in seen_lines:
            continue
        if line_key:
            seen_lines.add(line_key)
        unique_bugs.append(b)

    # Priority 2: Security vulnerabilities
    for s in sec_issues:
        line_key = str(s.get("line", "")).strip()
        if line_key and line_key in seen_lines:
            continue
        if line_key:
            seen_lines.add(line_key)
        unique_sec.append(s)

    # Priority 3: Performance bottlenecks
    for p in perf_issues:
        line_key = str(p.get("line", "")).strip()
        if line_key and line_key in seen_lines:
            continue
        if line_key:
            seen_lines.add(line_key)
        unique_perf.append(p)

    # Priority 4: Style (only if not already flagged by higher priority agents)
    for st in style_issues:
        line_key = str(st.get("line", "")).strip()
        if line_key and line_key in seen_lines:
            continue
        if line_key:
            seen_lines.add(line_key)
        unique_style.append(st)

    return unique_style, unique_bugs, unique_sec, unique_perf

async def run_orchestrator(
    code: str, 
    language: str = "auto", 
    agents_config: dict = None, 
    strictness: str = "standard",
    problem_context: str = None,
    constraints: str = None
) -> dict:
    if agents_config is None:
        agents_config = {"style": True, "bugs": True, "security": True, "performance": True}

    # Keep code strictly clean and line numbers pure
    combined_ctx = ""
    if problem_context or constraints:
        parts = []
        if problem_context:
            parts.append(problem_context)
        if constraints:
            parts.append(f"Constraints: {constraints}")
        combined_ctx = "\n".join(parts)

    tasks = []
    task_keys = []

    if agents_config.get("style", True):
        tasks.append(analyze_style(code, language, problem_context=combined_ctx))
        task_keys.append("style")
    if agents_config.get("bugs", True):
        tasks.append(analyze_bugs(code, language, problem_context=combined_ctx))
        task_keys.append("bugs")
    if agents_config.get("security", True):
        tasks.append(analyze_security(code, language, problem_context=combined_ctx))
        task_keys.append("security")
    if agents_config.get("performance", True):
        tasks.append(analyze_performance(code, language, problem_context=combined_ctx))
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

    raw_style = style_res.get("issues", [])
    raw_bugs = bug_res.get("bugs", [])
    raw_sec = sec_res.get("security", [])
    raw_perf = perf_res.get("performance", [])

    # Clamp line numbers so they NEVER exceed user's original line count
    total_lines = max(1, len(code.splitlines()))
    sanitize_line_numbers(raw_style, total_lines)
    sanitize_line_numbers(raw_bugs, total_lines)
    sanitize_line_numbers(raw_sec, total_lines)
    sanitize_line_numbers(raw_perf, total_lines)

    # Deduplicate findings so multiple agents don't create duplicate cards on the same line
    style_issues, bug_issues, sec_issues, perf_issues = deduplicate_findings(
        raw_style, raw_bugs, raw_sec, raw_perf
    )

    # Parallelize executive summary & 100% complete remediated code generation
    summary_task = generate_summary(style_res, bug_res, sec_res)
    remediation_task = generate_remediated_code(code, language, style_issues, bug_issues, sec_issues, perf_issues)
    summary_text, remediated_code_text = await asyncio.gather(summary_task, remediation_task)

    health_data = calculate_health_score(style_issues, bug_issues, sec_issues, perf_issues)

    return {
        "style": style_issues,
        "bugs": bug_issues,
        "security": sec_issues,
        "performance": perf_issues,
        "summary": summary_text,
        "health_score": health_data,
        "remediated_code": remediated_code_text
    }
