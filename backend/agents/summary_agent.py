import json
from agents.base_agent import call_llm

SUMMARY_SYSTEM_PROMPT = """You are a Staff Software Engineer giving constructive code review feedback on a Pull Request.
You are given structured analysis findings from three automated review bots: Style Agent, Bug Agent, and Security Agent.

Your job:
1. Synthesize these agent outputs into a concise, professional executive review (3-5 sentences overall summary).
2. Followed by a short, bulleted "Prioritized Action Items" list (highlighting high-severity security issues and critical bugs first).
3. Adopt a encouraging, professional tone as a senior engineer performing a PR review.

Output plain markdown text directly (do NOT output JSON).
"""

async def generate_summary(style_output: dict, bug_output: dict, security_output: dict) -> str:
    combined_inputs = {
        "style_findings": style_output.get("issues", []),
        "bug_findings": bug_output.get("bugs", []),
        "security_findings": security_output.get("security", []),
    }

    # Add error notes if present in inputs
    errors = []
    for name, out in [("Style Agent", style_output), ("Bug Agent", bug_output), ("Security Agent", security_output)]:
        if "error" in out:
            errors.append(f"{name}: {out['error']}")
    if errors:
        combined_inputs["agent_execution_errors"] = errors

    user_prompt = f"Agent Findings JSON:\n```json\n{json.dumps(combined_inputs, indent=2)}\n```"

    try:
        raw_response = await call_llm(SUMMARY_SYSTEM_PROMPT, user_prompt, max_tokens=1000)
        return raw_response.strip() if raw_response else "Code review completed. No critical issues reported."
    except Exception as e:
        total_issues = len(style_output.get("issues", [])) + len(bug_output.get("bugs", [])) + len(security_output.get("security", []))
        return (
            f"### Executive Summary\n"
            f"The multi-agent code review completed and identified {total_issues} item(s) across style, logic, and security dimensions.\n\n"
            f"**Action Items:**\n"
            f"- Review identified security risks and critical bug findings highlighted in the detailed tabs below.\n"
            f"*(Note: Executive summary generator encountered notice: {str(e)})*"
        )
