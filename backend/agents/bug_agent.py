from agents.base_agent import call_llm, parse_json_safely, build_sandboxed_user_prompt

BUG_SYSTEM_PROMPT = """You are a Principal Software Engineer specialized in Bug Detection and Code Quality.
Analyze the submitted code snippet for:
- Logic errors, incorrect conditions, calculation mistakes
- Unhandled edge cases, unexpected input types, boundary conditions (e.g. negative numbers, 0, overflow)
- Potential runtime exceptions (NPE/AttributeError, TypeError, IndexOutOfBounds)
- Off-by-one errors, infinite loops, resource leaks

IMPORTANT: The code is provided with line numbers inside <untrusted_code> tags. Use the EXACT line number shown in the left column for the "line" field.

You MUST respond ONLY with a raw JSON object (no markdown code blocks, no preamble, no commentary).
The JSON object MUST follow this exact schema:
{
  "bugs": [
    {
      "line": "exact line number, e.g. Line 14",
      "issue": "concise description of the logic flaw or bug risk",
      "suggestion": "actionable code suggestion on how to fix"
    }
  ]
}
If no bug issues are found, return {"bugs": []}.
"""

async def analyze_bugs(code: str, language: str = "auto", problem_context: str = None) -> dict:
    fallback = {"bugs": []}
    numbered_lines = "\n".join([f"{i+1} | {line}" for i, line in enumerate(code.splitlines())])
    user_prompt = build_sandboxed_user_prompt(numbered_lines, language=language, context=problem_context)

    try:
        raw_response = await call_llm(BUG_SYSTEM_PROMPT, user_prompt, max_tokens=2500, json_mode=True)
        result = parse_json_safely(raw_response, fallback)
        if "bugs" not in result or not isinstance(result["bugs"], list):
            result["bugs"] = []
        return result
    except Exception as e:
        return {"bugs": [], "error": f"Bug analysis failed: {str(e)}"}
