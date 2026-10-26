import json
from agents.base_agent import call_llm

SUMMARY_SYSTEM_PROMPT = """You are a Staff Software Engineer giving constructive code review feedback on a Pull Request.
You are given structured analysis findings from four automated review bots: Style Agent, Bug Agent, Security Agent, and Performance Agent.

Your job:
1. Synthesize these agent outputs into a concise, professional executive review (3-5 sentences overall summary).
2. Followed by a short, bulleted "Prioritized Action Items" list (highlighting high-severity security issues and critical bugs first).
3. Adopt an encouraging, professional tone as a senior engineer performing a PR review.

Output plain markdown text directly (do NOT output JSON).
"""

async def generate_summary(style_output: dict, bug_output: dict, security_output: dict, perf_output: dict = None) -> str:
    combined_inputs = {
        "style_findings": style_output.get("issues", []) if isinstance(style_output, dict) else [],
        "bug_findings": bug_output.get("bugs", []) if isinstance(bug_output, dict) else [],
        "security_findings": security_output.get("security", []) if isinstance(security_output, dict) else [],
        "performance_findings": (perf_output.get("performance", []) if isinstance(perf_output, dict) else []) if perf_output else [],
    }

    # Add error/timeout notes if present in inputs
    errors = []
    agent_tuples = [
        ("Style Agent", style_output),
        ("Bug Agent", bug_output),
        ("Security Agent", security_output),
        ("Performance Agent", perf_output or {})
    ]
    for name, out in agent_tuples:
        if isinstance(out, dict) and "error" in out:
            errors.append(f"{name}: {out['error']}")
    if errors:
        combined_inputs["agent_execution_notices"] = errors

    user_prompt = f"Agent Findings JSON:\n```json\n{json.dumps(combined_inputs, indent=2)}\n```"

    try:
        raw_response = await call_llm(SUMMARY_SYSTEM_PROMPT, user_prompt, max_tokens=1000, json_mode=False)
        return raw_response.strip() if raw_response else "Code review completed. No critical issues reported."
    except Exception as e:
        total_issues = (
            len(combined_inputs["style_findings"]) +
            len(combined_inputs["bug_findings"]) +
            len(combined_inputs["security_findings"]) +
            len(combined_inputs["performance_findings"])
        )
        return (
            f"### Executive Summary\n"
            f"The multi-agent code review completed and identified {total_issues} item(s) across style, logic, security, and performance dimensions.\n\n"
            f"**Action Items:**\n"
            f"- Review identified security risks and critical bug findings highlighted in the detailed tabs below.\n"
            f"*(Note: Executive summary generator notice: {str(e)})*"
        )
