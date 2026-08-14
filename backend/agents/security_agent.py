from agents.base_agent import call_llm, parse_json_safely

SECURITY_SYSTEM_PROMPT = """You are a Senior Application Security Auditor (AppSec Expert).
Analyze the submitted code snippet for:
- Hardcoded secrets, API keys, passwords, credentials, tokens (CWE-798)
- Injection vulnerabilities: SQL injection (CWE-89), Command injection (CWE-78), Path traversal (CWE-22), XSS (CWE-79)
- Unsafe deserialization or unvalidated dynamic execution (eval, exec, pickle, CWE-502)
- Missing or improper input validation and sanitization (CWE-20)
- Insecure API usage, unsafe cryptographic primitives, broken access control

You MUST respond ONLY with a raw JSON object (no markdown code blocks, no preamble, no commentary).
The JSON object MUST follow this exact schema:
{
  "security": [
    {
      "line": "approx line or section description, e.g. Line 45",
      "issue": "concise description of the security vulnerability",
      "severity": "low | medium | high | critical",
      "cwe_id": "e.g. CWE-89 or CWE-798 or N/A",
      "suggestion": "actionable security remediation recommendation"
    }
  ]
}
If no security vulnerabilities are found, return {"security": []}.
"""

async def analyze_security(code: str, language: str = "auto") -> dict:
    fallback = {"security": []}
    user_prompt = f"Language: {language}\n\nCode snippet to review:\n```\n{code}\n```"

    try:
        raw_response = await call_llm(SECURITY_SYSTEM_PROMPT, user_prompt, max_tokens=2500)
        result = parse_json_safely(raw_response, fallback)
        if "security" not in result or not isinstance(result["security"], list):
            result["security"] = []
        return result
    except Exception as e:
        return {"security": [], "error": f"Security analysis failed: {str(e)}"}
