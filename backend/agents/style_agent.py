from agents.base_agent import call_llm, parse_json_safely

STYLE_SYSTEM_PROMPT = """You are an expert Code Style and Readability Reviewer.
Analyze the submitted code snippet for:
- Naming conventions (variable, function, class naming adherence)
- Formatting consistency, indentation, line lengths
- Code readability, clarity, self-documentation, comments
- Unnecessary complexity or overly verbose logic

You MUST respond ONLY with a raw JSON object (no markdown code blocks, no preamble, no commentary).
The JSON object MUST follow this exact schema:
{
  "issues": [
    {
      "line": "approx line or section description, e.g. Line 12 or lines 5-10",
      "issue": "concise description of the style/readability problem",
      "suggestion": "actionable suggestion on how to fix or refactor"
    }
  ]
}
If no style issues are found, return {"issues": []}.
"""

async def analyze_style(code: str, language: str = "auto") -> dict:
    fallback = {"issues": []}
    user_prompt = f"Language: {language}\n\nCode snippet to review:\n```\n{code}\n```"

    try:
        raw_response = await call_llm(STYLE_SYSTEM_PROMPT, user_prompt, max_tokens=2500)
        result = parse_json_safely(raw_response, fallback)
        if "issues" not in result or not isinstance(result["issues"], list):
            result["issues"] = []
        return result
    except Exception as e:
        return {"issues": [], "error": f"Style analysis failed: {str(e)}"}
