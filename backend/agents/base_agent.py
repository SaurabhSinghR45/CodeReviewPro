import json
import re
import os
from pathlib import Path
import httpx
from dotenv import load_dotenv
from config import settings

# Load .env file explicitly
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

async def call_llm(system_prompt: str, user_prompt: str, max_tokens: int = 2500) -> str:
    """
    Calls Google Generative AI API with automatic multi-model fallback cascade across active models,
    or Anthropic Claude API based on configured keys.
    """
    load_dotenv(dotenv_path=ENV_PATH, override=True)

    gemini_key = (os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", "") or "").strip()
    anthropic_key = (os.getenv("ANTHROPIC_API_KEY") or getattr(settings, "ANTHROPIC_API_KEY", "") or "").strip()

    # 1. Prioritize Google Generative Models (with multi-model fallback cascade)
    if gemini_key and gemini_key not in ["your_gemini_api_key_here", "your_key_here"]:
        return await call_gemini(system_prompt, user_prompt, gemini_key, max_tokens)

    # 2. Fallback to Anthropic Claude API
    if anthropic_key and anthropic_key not in ["your_key_here", "optional_claude_key_here"]:
        return await call_anthropic(system_prompt, user_prompt, anthropic_key, max_tokens)

    raise ValueError("Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY is configured in backend/.env")

async def call_gemini(system_prompt: str, user_prompt: str, api_key: str, max_tokens: int = 2500) -> str:
    """
    Calls Google Generative Language API with intelligent cascading across verified active models.
    """
    models = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3-flash-preview",
        "gemma-4-31b-it",
        "gemini-3.7-flash",
        "gemini-flash-latest"
    ]
    
    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": max_tokens
        }
    }

    last_error = None
    async with httpx.AsyncClient(timeout=25.0) as client:
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text_list = [p.get("text", "") for p in parts if "text" in p]
                        if text_list:
                            return "".join(text_list)
                else:
                    last_error = f"Model {model} HTTP {res.status_code}: {res.text[:100]}"
            except Exception as e:
                last_error = str(e)
                continue

    raise ValueError(f"All Generative Engine models returned errors: {last_error}")

async def call_anthropic(system_prompt: str, user_prompt: str, api_key: str, max_tokens: int = 2500) -> str:
    """
    Calls Anthropic Messages API (Claude).
    """
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [
            {"role": "user", "content": user_prompt}
        ]
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        content_blocks = data.get("content", [])
        text_parts = [block.get("text", "") for block in content_blocks if block.get("type") == "text"]
        return "".join(text_parts)

def repair_json_string(text: str) -> str:
    """
    Attempts to close incomplete JSON objects and arrays if truncated.
    """
    s = text.strip()
    # Check open quotes
    in_str = False
    escape = False
    open_brackets = []
    
    for ch in s:
        if ch == '"' and not escape:
            in_str = not in_str
        elif not in_str:
            if ch in ['{', '[']:
                open_brackets.append(ch)
            elif ch in ['}', ']'] and open_brackets:
                open_brackets.pop()
        
        if ch == '\\' and not escape:
            escape = True
        else:
            escape = False

    if in_str:
        s += '"'
    
    for bracket in reversed(open_brackets):
        if bracket == '{':
            s += '}'
        elif bracket == '[':
            s += ']'
            
    return s

def parse_json_safely(text: str, default_structure: dict) -> dict:
    """
    Defensively extracts and parses JSON from LLM output.
    Strips markdown fences and repairs unclosed structures cleanly.
    """
    if not text:
        return default_structure

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE).strip()

    # 1. Direct parse attempt
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # 2. Regex search for complete json block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

    # 3. Attempt repair for truncated JSON
    try:
        repaired = repair_json_string(cleaned)
        parsed = json.loads(repaired)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    return default_structure
