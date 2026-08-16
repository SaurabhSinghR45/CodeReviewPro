import re
from agents.base_agent import call_llm

REMEDIATION_SYSTEM_PROMPT = """You are a Principal Software Engineer and Competitive Programming (LeetCode / GFG) Master.
You are given user-submitted source code and findings from AppSec, Bug, Performance, and Style review agents.

Your job:
Generate the COMPLETE, 100% COMPILABLE, FULLY FIXED, AND OPTIMIZED source code that fixes:
- Any integer overflow or logic flaws
- Unnecessary copies or pass-by-value bugs (use const auto& / pass by value appropriately)
- Algorithm bottlenecks and edge cases (e.g. negative numbers, boundaries)
- Standard LeetCode / GFG formatting (class Solution, public:, 4-space method indentation)

CRITICAL RULES:
1. Return ONLY the raw code inside a single code block (e.g. ```cpp ... ``` or ```python ... ```).
2. DO NOT invent undeclared variables. Ensure every variable is declared with valid type before use.
3. DO NOT change user variable names unless they cause compile errors or bugs.
4. Ensure 100% syntax correctness with all matching braces `{ }` and semicolons `;`.
5. Do NOT include explanations, conversational filler, or preamble. Return ONLY the compilable code.
"""

async def generate_remediated_code(code: str, language: str, style_findings: list, bug_findings: list, sec_findings: list, perf_findings: list) -> str:
    combined_issues = []
    for b in bug_findings:
        combined_issues.append(f"- Bug [{b.get('line', '')}]: {b.get('issue', '')} -> {b.get('suggestion', '')}")
    for s in sec_findings:
        combined_issues.append(f"- Sec [{s.get('line', '')}]: {s.get('issue', '')} -> {s.get('suggestion', '')}")
    for p in perf_findings:
        combined_issues.append(f"- Perf [{p.get('line', '')}]: {p.get('issue', '')} -> {p.get('suggestion', '')}")

    issues_text = "\n".join(combined_issues) if combined_issues else "No major issues reported."

    user_prompt = f"""Language: {language}

Original User Code:
```{language}
{code}
```

Identified Review Findings to Remediate:
{issues_text}

Generate the complete, 100% working, compilable, and optimized remediated code:"""

    try:
        raw_response = await call_llm(REMEDIATION_SYSTEM_PROMPT, user_prompt, max_tokens=3000)
        # Extract code from markdown block
        match = re.search(r'```(?:[a-zA-Z0-9_+-]+)?\n([\s\S]*?)```', raw_response)
        if match:
            return match.group(1).strip()
        return raw_response.strip() if raw_response else code
    except Exception:
        return code
