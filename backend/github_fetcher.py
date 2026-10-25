import re
import os
import httpx
from typing import Dict, List, Optional
from urllib.parse import urlparse
from config import settings

# Strict regex anchors with safe character classes to prevent path traversal and SSRF
GITHUB_REPO_REGEX = r"^https?://github\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)/?$"
GITHUB_TREE_REGEX = r"^https?://github\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)/tree/([a-zA-Z0-9_.-]+)/?(.*)$"
GITHUB_BLOB_REGEX = r"^https?://github\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)/blob/([a-zA-Z0-9_.-]+)/(.*)$"
GITHUB_RAW_REGEX = r"^https?://raw\.githubusercontent\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)/(.*)$"
GITHUB_PR_REGEX = r"^https?://github\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)/pull/(\d+)/?$"
GITHUB_COMMIT_REGEX = r"^https?://github\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)/commit/([a-f0-9]+)/?$"

CODE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".rs", ".java", 
    ".cpp", ".c", ".h", ".hpp", ".sql", ".php", ".rb", ".cs", ".swift", ".kt"
}

IGNORED_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock", "cargo.lock", 
    "gemfile.lock", "composer.lock", "mix.lock", ".ds_store", "thumbs.db"
}

IGNORED_EXTENSIONS = {
    ".min.js", ".min.css", ".map", ".svg", ".png", ".jpg", ".jpeg", ".gif", 
    ".ico", ".webp", ".pdf", ".zip", ".tar", ".gz", ".db", ".sqlite", ".sqlite3", 
    ".exe", ".dll", ".so", ".dylib", ".woff", ".woff2", ".ttf", ".eot"
}

IGNORED_DIRS = {
    "node_modules", ".git", "venv", ".venv", "dist", "build", 
    "__pycache__", ".next", ".nuxt", "vendor", "target", ".pytest_cache"
}

MAX_TOTAL_CHARS = 16000

def is_noise_file(filepath: str) -> bool:
    """
    Identifies build artifacts, lockfiles, minified bundles, and binary assets
    that would waste tokens or trigger false syntax issues during review.
    """
    clean_path = filepath.lower().replace("\\", "/")
    segments = clean_path.split("/")
    basename = segments[-1]

    if any(ignored in segments for ignored in IGNORED_DIRS):
        return True
    if basename in IGNORED_FILES:
        return True
    _, ext = os.path.splitext(basename)
    if ext in IGNORED_EXTENSIONS:
        return True
    if basename.endswith(".min.js") or basename.endswith(".min.css"):
        return True
    return False

def get_headers() -> Dict[str, str]:
    headers = {
        "User-Agent": "MultiAgentCodeReviewAssistant/2.0",
        "Accept": "application/vnd.github.v3+json"
    }
    token = settings.GITHUB_TOKEN or os.getenv("GITHUB_TOKEN", "")
    if token and token not in ["optional_personal_access_token", "your_token_here"]:
        headers["Authorization"] = f"token {token}"
    return headers

def sanitize_exception(exc: Exception) -> ValueError:
    """Removes any confidential GitHub personal access tokens from exception messages."""
    msg = str(exc)
    token = settings.GITHUB_TOKEN or os.getenv("GITHUB_TOKEN", "")
    if token and token in msg:
        msg = msg.replace(token, "[REDACTED_TOKEN]")
    return ValueError(msg)

def validate_github_url(url: str) -> str:
    """Strictly validates GitHub URL host and disallows path traversal sequences."""
    if not url or not isinstance(url, str):
        raise ValueError("A valid GitHub URL string must be provided.")

    cleaned_url = url.strip().rstrip("/")
    if ".." in cleaned_url:
        raise ValueError("Path traversal sequence ('..') detected in URL.")

    parsed = urlparse(cleaned_url)
    if parsed.netloc.lower() not in ["github.com", "raw.githubusercontent.com"]:
        raise ValueError(f"Invalid host '{parsed.netloc}'. Only 'github.com' URLs are supported.")

    return cleaned_url

async def inspect_github_repo(url: str) -> Dict:
    """
    Inspects any GitHub repository URL and returns metadata, repository stats, and list of code files.
    """
    url = validate_github_url(url)
    headers = get_headers()

    owner = repo = branch = None

    repo_match = re.match(GITHUB_REPO_REGEX, url)
    tree_match = re.match(GITHUB_TREE_REGEX, url)
    blob_match = re.match(GITHUB_BLOB_REGEX, url)
    pr_match = re.match(GITHUB_PR_REGEX, url)

    if repo_match:
        owner, repo = repo_match.groups()
    elif tree_match:
        owner, repo, branch, _ = tree_match.groups()
    elif blob_match:
        owner, repo, branch, _ = blob_match.groups()
    elif pr_match:
        owner, repo, _ = pr_match.groups()
    else:
        parts = url.replace("https://github.com/", "").replace("http://github.com/", "").split("/")
        if len(parts) >= 2:
            owner, repo = parts[0], parts[1]
        else:
            raise ValueError("Invalid GitHub URL format.")

    if repo.endswith(".git"):
        repo = repo[:-4]

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
        repo_api_url = f"https://api.github.com/repos/{owner}/{repo}"
        try:
            repo_res = await client.get(repo_api_url, headers=headers)
            if repo_res.status_code == 404:
                raise ValueError(f"GitHub repository '{owner}/{repo}' not found. Please check spelling or access permissions.")
            elif repo_res.status_code in [403, 429]:
                raise ValueError("GitHub API rate limit exceeded. Configure GITHUB_TOKEN in backend/.env for higher limits.")
            repo_res.raise_for_status()
            repo_data = repo_res.json()
        except Exception as e:
            raise sanitize_exception(e)

        default_branch = branch or repo_data.get("default_branch", "main")

        tree_api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        files_list = []
        try:
            tree_res = await client.get(tree_api_url, headers=headers)
            if tree_res.status_code == 200:
                tree_data = tree_res.json()
                for item in tree_data.get("tree", []):
                    if item.get("type") == "blob":
                        path = item.get("path", "")
                        if is_noise_file(path):
                            continue
                        ext = os.path.splitext(path)[1].lower()
                        if ext in CODE_EXTENSIONS or path in ["Dockerfile", "docker-compose.yml"]:
                            files_list.append({
                                "path": path,
                                "size": item.get("size", 0),
                                "extension": ext,
                                "url": f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{path}"
                            })
        except Exception as e:
            raise sanitize_exception(e)

        return {
            "owner": owner,
            "repo": repo,
            "full_name": f"{owner}/{repo}",
            "description": repo_data.get("description", "No description provided"),
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "language": repo_data.get("language", "Unknown"),
            "default_branch": default_branch,
            "html_url": repo_data.get("html_url", url),
            "files": files_list[:100]
        }

async def fetch_github_code(url: str, selected_files: Optional[List[str]] = None) -> str:
    """
    Fetches raw source code from a GitHub URL with noise filtering, SSRF protection,
    and clean file-boundary truncation.
    """
    url = validate_github_url(url)
    headers = get_headers()

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        # 1. Single File Blob URL
        blob_match = re.match(GITHUB_BLOB_REGEX, url)
        if blob_match:
            owner, repo, branch, path = blob_match.groups()
            if is_noise_file(path):
                raise ValueError(f"File '{path}' is a lockfile, minified asset, or binary and is not reviewable.")
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
            try:
                res = await client.get(raw_url, headers=headers)
                if res.status_code == 404:
                    raise ValueError(f"GitHub file not found (404) at: {url}")
                elif res.status_code in [403, 429]:
                    raise ValueError("GitHub API rate limit exceeded.")
                res.raise_for_status()
                return f"=== File: {path} ===\n" + res.text
            except Exception as e:
                raise sanitize_exception(e)

        # 2. Raw URL
        raw_match = re.match(GITHUB_RAW_REGEX, url)
        if raw_match:
            try:
                res = await client.get(url, headers=headers)
                if res.status_code == 404:
                    raise ValueError(f"Raw file not found (404) at: {url}")
                res.raise_for_status()
                return res.text
            except Exception as e:
                raise sanitize_exception(e)

        # 3. Pull Request URL
        pr_match = re.match(GITHUB_PR_REGEX, url)
        if pr_match:
            owner, repo, pr_number = pr_match.groups()
            api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files"
            try:
                res = await client.get(api_url, headers=headers)
                if res.status_code == 404:
                    raise ValueError(f"GitHub Pull Request #{pr_number} not found in repo {owner}/{repo}.")
                elif res.status_code in [403, 429]:
                    raise ValueError("GitHub API rate limit exceeded.")
                res.raise_for_status()
                files_data = res.json()
            except Exception as e:
                raise sanitize_exception(e)

            if not isinstance(files_data, list) or len(files_data) == 0:
                raise ValueError("No changed files found in the specified GitHub Pull Request.")

            content_pieces = []
            curr_len = 0
            for file_info in files_data:
                filename = file_info.get("filename", "unknown")
                if is_noise_file(filename):
                    continue

                patch = file_info.get("patch", "")
                if not patch.strip():
                    continue

                header = f"=== File (PR Patch): {filename} ===\n"
                piece = header + patch + "\n\n"

                if curr_len + len(piece) > MAX_TOTAL_CHARS:
                    # Clean file/hunk boundary truncation
                    remaining = MAX_TOTAL_CHARS - curr_len
                    if remaining > len(header) + 80:
                        trimmed = piece[:remaining]
                        last_newline = trimmed.rfind("\n")
                        if last_newline != -1:
                            trimmed = trimmed[:last_newline]
                        content_pieces.append(trimmed + "\n/* [TRUNCATED DUE TO MAX_FETCH_CHARS LIMIT] */\n")
                    else:
                        content_pieces.append("\n/* [TRUNCATED DUE TO MAX_FETCH_CHARS LIMIT] */\n")
                    break

                content_pieces.append(piece)
                curr_len += len(piece)

            if not content_pieces:
                raise ValueError("No reviewable code changes found in this Pull Request (lockfiles/binary assets excluded).")

            return "".join(content_pieces)

        # 4. Commit URL
        commit_match = re.match(GITHUB_COMMIT_REGEX, url)
        if commit_match:
            owner, repo, sha = commit_match.groups()
            api_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
            try:
                res = await client.get(api_url, headers=headers)
                if res.status_code == 404:
                    raise ValueError(f"Commit {sha} not found in {owner}/{repo}.")
                res.raise_for_status()
                data = res.json()
            except Exception as e:
                raise sanitize_exception(e)

            files_data = data.get("files", [])
            content_pieces = [f"=== Commit {sha[:8]}: {data.get('commit', {}).get('message', '')} ===\n\n"]
            curr_len = len(content_pieces[0])

            for f in files_data:
                filename = f.get("filename", "")
                if is_noise_file(filename):
                    continue
                patch = f.get("patch", "")
                if not patch:
                    continue
                piece = f"=== File: {filename} ===\n{patch}\n\n"
                if curr_len + len(piece) > MAX_TOTAL_CHARS:
                    content_pieces.append("\n/* [TRUNCATED DUE TO MAX_FETCH_CHARS LIMIT] */\n")
                    break
                content_pieces.append(piece)
                curr_len += len(piece)

            return "".join(content_pieces)

        # 5. Repository Root or Tree URL
        repo_info = await inspect_github_repo(url)
        files = repo_info.get("files", [])
        if not files:
            raise ValueError(f"No source code files found in repository {repo_info['full_name']}.")

        if selected_files:
            target_files = [f for f in files if f["path"] in selected_files and not is_noise_file(f["path"])]
        else:
            priority_names = ["main.", "app.", "index.", "server.", "route", "api", "model", "schema"]
            def file_priority(item):
                p = item["path"].lower()
                for idx, name in enumerate(priority_names):
                    if name in p:
                        return idx
                return 99
            valid_files = [f for f in files if not is_noise_file(f["path"])]
            target_files = sorted(valid_files, key=file_priority)[:6]

        collected_pieces = []
        current_length = 0

        for file_item in target_files:
            file_url = file_item["url"]
            try:
                f_res = await client.get(file_url, headers=headers)
                if f_res.status_code == 200:
                    header = f"=== File: {file_item['path']} ===\n"
                    body = f_res.text
                    piece = header + body + "\n\n"
                    if current_length + len(piece) > MAX_TOTAL_CHARS:
                        remaining = MAX_TOTAL_CHARS - current_length
                        if remaining > len(header) + 80:
                            trimmed = piece[:remaining]
                            last_newline = trimmed.rfind("\n")
                            if last_newline != -1:
                                trimmed = trimmed[:last_newline]
                            collected_pieces.append(trimmed + "\n/* [TRUNCATED DUE TO MAX_FETCH_CHARS LIMIT] */\n")
                        else:
                            collected_pieces.append("\n/* [TRUNCATED DUE TO MAX_FETCH_CHARS LIMIT] */\n")
                        break
                    collected_pieces.append(piece)
                    current_length += len(piece)
            except Exception:
                continue

        if not collected_pieces:
            raise ValueError(f"Could not fetch readable source content from {repo_info['full_name']}.")

        return "".join(collected_pieces)
