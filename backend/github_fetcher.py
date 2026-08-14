import re
import os
import httpx
from typing import Dict, List, Optional
from config import settings

GITHUB_REPO_REGEX = r"^https?://github\.com/([^/]+)/([^/]+)/?$"
GITHUB_TREE_REGEX = r"^https?://github\.com/([^/]+)/([^/]+)/tree/([^/]+)/?(.*)$"
GITHUB_BLOB_REGEX = r"^https?://github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.*)$"
GITHUB_RAW_REGEX = r"^https?://raw\.githubusercontent\.com/([^/]+)/([^/]+)/(.*)$"
GITHUB_PR_REGEX = r"^https?://github\.com/([^/]+)/([^/]+)/pull/(\d+)/?$"
GITHUB_COMMIT_REGEX = r"^https?://github\.com/([^/]+)/([^/]+)/commit/([a-f0-9]+)/?$"

CODE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".rs", ".java", 
    ".cpp", ".c", ".h", ".hpp", ".sql", ".php", ".rb", ".cs", ".swift", ".kt"
}

IGNORED_DIRS = {
    "node_modules", ".git", "venv", ".venv", "dist", "build", 
    "__pycache__", ".next", ".nuxt", "vendor", "target"
}

def get_headers() -> Dict[str, str]:
    headers = {
        "User-Agent": "MultiAgentCodeReviewAssistant/2.0",
        "Accept": "application/vnd.github.v3+json"
    }
    token = settings.GITHUB_TOKEN or os.getenv("GITHUB_TOKEN", "")
    if token and token != "optional_personal_access_token":
        headers["Authorization"] = f"token {token}"
    return headers

async def inspect_github_repo(url: str) -> Dict:
    """
    Inspects any GitHub URL and returns metadata, repository stats, and list of source files.
    """
    if not url or not isinstance(url, str):
        raise ValueError("A valid GitHub URL string must be provided.")

    url = url.strip().rstrip("/")
    if not (url.startswith("https://github.com/") or url.startswith("http://github.com/") or url.startswith("https://raw.githubusercontent.com/")):
        raise ValueError("Invalid GitHub URL format. Expected github.com URL.")
    headers = get_headers()

    owner = repo = branch = None
    path_filter = ""

    # Parse URL
    repo_match = re.match(GITHUB_REPO_REGEX, url)
    tree_match = re.match(GITHUB_TREE_REGEX, url)
    blob_match = re.match(GITHUB_BLOB_REGEX, url)
    pr_match = re.match(GITHUB_PR_REGEX, url)

    if repo_match:
        owner, repo = repo_match.groups()
    elif tree_match:
        owner, repo, branch, path_filter = tree_match.groups()
    elif blob_match:
        owner, repo, branch, path_filter = blob_match.groups()
    elif pr_match:
        owner, repo, pr_number = pr_match.groups()
    else:
        # Fallback extract owner/repo
        parts = url.replace("https://github.com/", "").replace("http://github.com/", "").split("/")
        if len(parts) >= 2:
            owner, repo = parts[0], parts[1]
        else:
            raise ValueError("Invalid GitHub URL format.")

    # Remove any .git suffix
    if repo.endswith(".git"):
        repo = repo[:-4]

    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
        # 1. Fetch Repository Metadata
        repo_api_url = f"https://api.github.com/repos/{owner}/{repo}"
        repo_res = await client.get(repo_api_url, headers=headers)
        if repo_res.status_code == 404:
            raise ValueError(f"GitHub repository '{owner}/{repo}' not found. Please check spelling or token permissions.")
        elif repo_res.status_code in [403, 429]:
            raise ValueError("GitHub API rate limit exceeded. Add GITHUB_TOKEN in backend/.env.")
        repo_res.raise_for_status()
        repo_data = repo_res.json()

        default_branch = branch or repo_data.get("default_branch", "main")

        # 2. Fetch Git Tree recursively
        tree_api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        tree_res = await client.get(tree_api_url, headers=headers)
        
        files_list = []
        if tree_res.status_code == 200:
            tree_data = tree_res.json()
            for item in tree_data.get("tree", []):
                if item.get("type") == "blob":
                    path = item.get("path", "")
                    # Ignore unwanted dirs
                    if any(ignored in path.split("/") for ignored in IGNORED_DIRS):
                        continue
                    ext = os.path.splitext(path)[1].lower()
                    if ext in CODE_EXTENSIONS or path in ["Dockerfile", "docker-compose.yml"]:
                        files_list.append({
                            "path": path,
                            "size": item.get("size", 0),
                            "extension": ext,
                            "url": f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{path}"
                        })

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
            "files": files_list[:100]  # Return top 100 code files
        }

async def fetch_github_code(url: str, selected_files: Optional[List[str]] = None) -> str:
    """
    Fetches raw source code from any GitHub URL:
    - Root repository (e.g. github.com/owner/repo)
    - Tree folder (e.g. github.com/owner/repo/tree/main/src)
    - File blob (e.g. github.com/owner/repo/blob/main/app.py)
    - Pull Request (e.g. github.com/owner/repo/pull/12)
    - Commit (e.g. github.com/owner/repo/commit/abc1234)
    - Raw URL
    """
    if not url or not isinstance(url, str):
        raise ValueError("A valid GitHub URL string must be provided.")

    url = url.strip().rstrip("/")
    if not (url.startswith("https://github.com/") or url.startswith("http://github.com/") or url.startswith("https://raw.githubusercontent.com/")):
        raise ValueError("Invalid GitHub URL format. Expected github.com URL.")
    headers = get_headers()
    MAX_TOTAL_CHARS = 16000

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        # 1. Handle Single File Blob URL
        blob_match = re.match(GITHUB_BLOB_REGEX, url)
        if blob_match:
            owner, repo, branch, path = blob_match.groups()
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
            res = await client.get(raw_url, headers=headers)
            if res.status_code == 404:
                raise ValueError(f"GitHub file not found (404) at: {url}")
            elif res.status_code in [403, 429]:
                raise ValueError("GitHub API rate limit exceeded.")
            res.raise_for_status()
            return f"=== File: {path} ===\n" + res.text

        # 2. Handle Raw URL
        raw_match = re.match(GITHUB_RAW_REGEX, url)
        if raw_match:
            res = await client.get(url, headers=headers)
            if res.status_code == 404:
                raise ValueError(f"Raw file not found (404) at: {url}")
            res.raise_for_status()
            return res.text

        # 3. Handle Pull Request URL
        pr_match = re.match(GITHUB_PR_REGEX, url)
        if pr_match:
            owner, repo, pr_number = pr_match.groups()
            api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files"
            res = await client.get(api_url, headers=headers)
            if res.status_code == 404:
                raise ValueError(f"GitHub Pull Request #{pr_number} not found in repo {owner}/{repo}.")
            elif res.status_code in [403, 429]:
                raise ValueError("GitHub API rate limit exceeded.")
            res.raise_for_status()

            files_data = res.json()
            if not isinstance(files_data, list) or len(files_data) == 0:
                raise ValueError("No changed files found in the specified GitHub Pull Request.")

            content_pieces = []
            curr_len = 0
            for file_info in files_data:
                filename = file_info.get("filename", "unknown")
                patch = file_info.get("patch", "")
                header = f"=== File (PR Patch): {filename} ===\n"
                piece = header + patch + "\n\n"
                if curr_len + len(piece) > MAX_TOTAL_CHARS:
                    content_pieces.append(piece[:MAX_TOTAL_CHARS - curr_len] + "\n... [PR TRUNCATED DUE TO SIZE LIMIT] ...\n")
                    break
                content_pieces.append(piece)
                curr_len += len(piece)
            return "".join(content_pieces)

        # 4. Handle Commit URL
        commit_match = re.match(GITHUB_COMMIT_REGEX, url)
        if commit_match:
            owner, repo, sha = commit_match.groups()
            api_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
            res = await client.get(api_url, headers=headers)
            if res.status_code == 404:
                raise ValueError(f"Commit {sha} not found in {owner}/{repo}.")
            res.raise_for_status()
            data = res.json()
            files_data = data.get("files", [])
            content_pieces = [f"=== Commit {sha[:8]}: {data.get('commit', {}).get('message', '')} ===\n\n"]
            for f in files_data:
                patch = f.get("patch", "")
                content_pieces.append(f"=== File: {f.get('filename')} ===\n{patch}\n\n")
            return "".join(content_pieces)[:MAX_TOTAL_CHARS]

        # 5. Handle Repository Root or Tree URL
        repo_info = await inspect_github_repo(url)
        files = repo_info.get("files", [])
        if not files:
            raise ValueError(f"No source code files found in repository {repo_info['full_name']}.")

        # If specific files were selected by user, filter by those
        if selected_files:
            target_files = [f for f in files if f["path"] in selected_files]
        else:
            # Prioritize entry/main files
            priority_names = ["main.", "app.", "index.", "server.", "route", "api", "model", "schema"]
            def file_priority(item):
                p = item["path"].lower()
                for idx, name in enumerate(priority_names):
                    if name in p:
                        return idx
                return 99
            target_files = sorted(files, key=file_priority)[:6]  # top 6 files

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
                        if remaining > len(header) + 50:
                            collected_pieces.append(piece[:remaining] + "\n... [TRUNCATED] ...\n")
                        break
                    collected_pieces.append(piece)
                    current_length += len(piece)
            except Exception:
                continue

        if not collected_pieces:
            raise ValueError(f"Could not fetch readable source content from {repo_info['full_name']}.")

        return "".join(collected_pieces)
