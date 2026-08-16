from agents.base_agent import call_llm, parse_json_safely

STYLE_SYSTEM_PROMPT = """You are an expert Code Style and Readability Reviewer.
Analyze the submitted code snippet for:
- Meaningful naming clarity and code maintainability
- Dead code, redundant functions that are never called, unused imports
- Overly convoluted nesting, deep complexity
- Idiomatic language practices (e.g. range-for in C++, list comprehensions in Python)

CRITICAL RULES:
1. DO NOT flag trivial spacing, indentation or operator whitespace nits (e.g. do NOT complain about `if(n==0)` vs `if (n == 0)` or spacing around `*`, `+`, `/`).
2. DO NOT flag comment blocks or closing braces `};` as errors unless they have syntax bugs.
3. The code is provided with line numbers (e.g. 1 | code...). Use the EXACT line number shown in the left column for the "line" field.

You MUST respond ONLY with a raw JSON object (no markdown code blocks, no preamble, no commentary).
The JSON object MUST follow this exact schema:
{
  "issues": [
    {
      "line": "exact line number, e.g. Line 10",
      "issue": "concise description of the style/readability problem",
      "suggestion": "actionable code suggestion on how to fix"
    }
  ]
}
If no style issues are found, return {"issues": []}.
"""

async def analyze_style(code: str, language: str = "auto", problem_context: str = None) -> dict:
    fallback = {"issues": []}
    numbered_lines = "\n".join([f"{i+1} | {line}" for i, line in enumerate(code.splitlines())])
    ctx_section = f"\nDSA Problem Context & Constraints:\n{problem_context}\n" if problem_context else ""
    user_prompt = f"Language: {language}\n{ctx_section}\nNumbered code to review (Use exact line numbers on the left):\n```\n{numbered_lines}\n```"

    try:
        raw_response = await call_llm(STYLE_SYSTEM_PROMPT, user_prompt, max_tokens=2500)
        result = parse_json_safely(raw_response, fallback)
        if "issues" not in result or not isinstance(result["issues"], list):
            result["issues"] = []
        return result
    except Exception as e:
        return {"issues": [], "error": f"Style analysis failed: {str(e)}"}
