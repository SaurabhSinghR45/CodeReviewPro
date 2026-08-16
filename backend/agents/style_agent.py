from agents.base_agent import call_llm, parse_json_safely

STYLE_SYSTEM_PROMPT = """You are an expert Code Style and Readability Reviewer.
Analyze the submitted code snippet for:
- Naming conventions (variable, function, class naming adherence)
- Formatting consistency, indentation, line lengths
- Code readability, clarity, self-documentation, comments
- Unnecessary complexity or overly verbose logic

IMPORTANT: The code is provided with line numbers (e.g. 1 | code...). Use the EXACT line number shown in the left column for the "line" field.

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

async def analyze_style(code: str, language: str = "auto") -> dict:
    fallback = {"issues": []}
    numbered_lines = "\n".join([f"{i+1} | {line}" for i, line in enumerate(code.splitlines())])
    user_prompt = f"Language: {language}\n\nNumbered code to review (Use exact line numbers on the left):\n```\n{numbered_lines}\n```"

    try:
        raw_response = await call_llm(STYLE_SYSTEM_PROMPT, user_prompt, max_tokens=2500)
        result = parse_json_safely(raw_response, fallback)
        if "issues" not in result or not isinstance(result["issues"], list):
            result["issues"] = []
        return result
    except Exception as e:
        return {"issues": [], "error": f"Style analysis failed: {str(e)}"}
