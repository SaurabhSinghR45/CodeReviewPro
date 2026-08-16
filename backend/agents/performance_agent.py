from agents.base_agent import call_llm, parse_json_safely

PERFORMANCE_SYSTEM_PROMPT = """You are a Senior Performance & Systems Reliability Engineer.
Analyze the submitted code snippet for:
- Algorithmic inefficiency (e.g. O(n^2) nested loops, redundant iterations)
- Memory leaks, excessive object allocations
- Inefficient pass-by-value / copying large containers
- Uncached expensive computations or duplicate computations

IMPORTANT: The code is provided with line numbers (e.g. 1 | code...). Use the EXACT line number shown in the left column for the "line" field.

You MUST respond ONLY with a raw JSON object (no markdown code blocks, no preamble, no commentary).
The JSON object MUST follow this exact schema:
{
  "performance": [
    {
      "line": "exact line number, e.g. Line 15",
      "issue": "concise description of performance flaw or bottleneck",
      "impact": "low | medium | high",
      "suggestion": "actionable optimization suggestion"
    }
  ]
}
If no performance issues are found, return {"performance": []}.
"""

async def analyze_performance(code: str, language: str = "auto", problem_context: str = None) -> dict:
    fallback = {"performance": []}
    numbered_lines = "\n".join([f"{i+1} | {line}" for i, line in enumerate(code.splitlines())])
    ctx_section = f"\nDSA Problem Context & Constraints:\n{problem_context}\n" if problem_context else ""
    user_prompt = f"Language: {language}\n{ctx_section}\nNumbered code to review (Use exact line numbers on the left):\n```\n{numbered_lines}\n```"

    try:
        raw_response = await call_llm(PERFORMANCE_SYSTEM_PROMPT, user_prompt, max_tokens=2500)
        result = parse_json_safely(raw_response, fallback)
        if "performance" not in result or not isinstance(result["performance"], list):
            result["performance"] = []
        return result
    except Exception as e:
        return {"performance": [], "error": f"Performance analysis failed: {str(e)}"}
