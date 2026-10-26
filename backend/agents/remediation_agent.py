import re
from agents.base_agent import call_llm

REMEDIATION_SYSTEM_PROMPT = """You are a Principal Software Engineer and Competitive Programming (LeetCode / GFG) Master.
You are given user-submitted source code inside <untrusted_code> tags and findings from AppSec, Bug, Performance, and Style review agents.

Your job:
Generate the COMPLETE, 100% COMPILABLE, FULLY FIXED, AND OPTIMIZED source code that fixes:
- Any integer overflow or logic flaws
- Unnecessary copies or pass-by-value bugs (use const auto& / pass by value appropriately)
- Algorithm bottlenecks and edge cases (e.g. negative numbers, boundaries)
- Standard formatting and best practices

CRITICAL LEETCODE / GFG PLATFORM RULES:
1. PLATFORM HEADERS ARE ALREADY INCLUDED: Platforms like LeetCode and GFG automatically include standard headers (<vector>, <unordered_map>, <iostream>, <algorithm>, and 'using namespace std;'). DO NOT add `#include <...>` or `using namespace std;` if the user's original code did not explicitly include them! Start directly with `class Solution` or the user's starting structure so line numbers align with their submission.
2. Return ONLY the raw code inside a single code block (e.g. ```cpp ... ``` or ```python ... ```).
3. DO NOT add conversational markdown headers, commentary, or text outside the code block.
4. DO NOT invent undeclared variables. Ensure every variable is declared with valid type before use.
5. DO NOT change user variable names unless they cause compile errors or bugs.
6. Ensure 100% syntax correctness with all matching braces `{ }` and semicolons `;`.
"""

async def generate_remediated_code(
    code: str, 
    language: str, 
    style_findings: list, 
    bug_findings: list, 
    sec_findings: list, 
    perf_findings: list
) -> str:
    combined_issues = []
    for b in (bug_findings or []):
        if isinstance(b, dict):
            combined_issues.append(f"- Bug [{b.get('line', '')}]: {b.get('issue', '')} -> {b.get('suggestion', '')}")
    for s in (sec_findings or []):
        if isinstance(s, dict):
            combined_issues.append(f"- Sec [{s.get('line', '')}]: {s.get('issue', '')} -> {s.get('suggestion', '')}")
    for p in (perf_findings or []):
        if isinstance(p, dict):
            combined_issues.append(f"- Perf [{p.get('line', '')}]: {p.get('issue', '')} -> {p.get('suggestion', '')}")
    for st in (style_findings or []):
        if isinstance(st, dict):
            combined_issues.append(f"- Style [{st.get('line', '')}]: {st.get('issue', '')} -> {st.get('suggestion', '')}")

    issues_text = "\n".join(combined_issues) if combined_issues else "No major issues reported."

    user_prompt = f"""Language: {language}

Original User Code:
<untrusted_code>
{code}
</untrusted_code>

Identified Review Findings to Remediate:
{issues_text}

Generate the complete, 100% working, compilable, and optimized remediated code:"""

    try:
        raw_response = await call_llm(REMEDIATION_SYSTEM_PROMPT, user_prompt, max_tokens=3000, json_mode=False)
        # Extract code from markdown block
        match = re.search(r'```(?:[a-zA-Z0-9_+-]+)?\n([\s\S]*?)```', raw_response)
        clean_code = match.group(1).strip() if match else raw_response.strip()

        # Sanitize any stray markdown headers like '# class Solution' or '#class Solution' without mangling real includes
        clean_code = re.sub(r'^\s*#\s*(class\b|def\b|public\b|int\b|void\b|struct\b)', r'\1', clean_code, flags=re.MULTILINE)
        clean_code = clean_code.replace('#class', 'class')

        # If user's original code did not explicitly have includes / using namespace std, strip them so line numbers align
        orig_has_includes = bool(re.search(r'^\s*#?\s*include\b', code, re.MULTILINE))
        orig_has_using_std = bool(re.search(r'^\s*using\s+namespace\s+std\s*;', code, re.MULTILINE))

        if not orig_has_includes:
            clean_code = re.sub(r'^\s*#?\s*include\s*<[^>]+>\s*$', '', clean_code, flags=re.MULTILINE)
        if not orig_has_using_std:
            clean_code = re.sub(r'^\s*using\s+namespace\s+std\s*;\s*$', '', clean_code, flags=re.MULTILINE)

        clean_code = clean_code.strip()
        return clean_code if clean_code else code
    except Exception:
        return code
