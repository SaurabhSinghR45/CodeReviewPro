from agents.base_agent import call_llm, parse_json_safely

PERFORMANCE_SYSTEM_PROMPT = """You are a Senior Performance & Systems Reliability Engineer.
Analyze the submitted code snippet for:
- Algorithmic inefficiency (e.g. O(n^2) nested loops, redundant iterations)
- Memory leaks, unclosed file/connection handles, excessive memory allocations
- Inefficient database query patterns (N+1 queries, unindexed filters, select *)
- Blocking operations on async/main threads
- Uncached expensive computations or duplicate computations

You MUST respond ONLY with a raw JSON object (no markdown code blocks, no preamble, no commentary).
The JSON object MUST follow this exact schema:
{
  "performance": [
    {
      "line": "approx line or section description, e.g. Line 15",
      "issue": "concise description of performance flaw or bottleneck",
      "impact": "low | medium | high",
      "suggestion": "actionable optimization suggestion"
    }
  ]
}
If no performance issues are found, return {"performance": []}.
"""

async def analyze_performance(code: str, language: str = "auto") -> dict:
    fallback = {"performance": []}
    user_prompt = f"Language: {language}\n\nCode snippet to review:\n```\n{code}\n```"

    try:
        raw_response = await call_llm(PERFORMANCE_SYSTEM_PROMPT, user_prompt, max_tokens=2500)
        result = parse_json_safely(raw_response, fallback)
        if "performance" not in result or not isinstance(result["performance"], list):
            result["performance"] = []
        return result
    except Exception as e:
        return {"performance": [], "error": f"Performance analysis failed: {str(e)}"}
