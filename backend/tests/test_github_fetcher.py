import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from github_fetcher import fetch_github_code, inspect_github_repo

@pytest.mark.asyncio
async def test_fetch_blob_file_url():
    url = "https://github.com/octocat/Hello-World/blob/master/README"
    mock_content = "Hello World Raw File Content"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = mock_content

    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=mock_response)):
        content = await fetch_github_code(url)
        assert "=== File: README ===" in content
        assert "Hello World Raw File Content" in content

@pytest.mark.asyncio
async def test_fetch_pr_url():
    pr_url = "https://github.com/octocat/Hello-World/pull/1347"
    mock_files = [
        {"filename": "file1.py", "patch": "@@ -1,3 +1,3 @@\n-old\n+new"},
        {"filename": "file2.py", "patch": "@@ -10,2 +10,4 @@\n+added line"}
    ]

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json = MagicMock(return_value=mock_files)

    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=mock_response)):
        content = await fetch_github_code(pr_url)
        assert "=== File (PR Patch): file1.py ===" in content
        assert "+new" in content
        assert "=== File (PR Patch): file2.py ===" in content

@pytest.mark.asyncio
async def test_inspect_github_repo():
    repo_url = "https://github.com/SaurabhSinghR45/VibeSync"
    mock_repo_meta = {
        "description": "VibeSync music collaboration app",
        "stargazers_count": 42,
        "forks_count": 5,
        "language": "JavaScript",
        "default_branch": "main",
        "html_url": "https://github.com/SaurabhSinghR45/VibeSync"
    }
    mock_tree = {
        "tree": [
            {"path": "src/index.js", "type": "blob", "size": 1024},
            {"path": "src/App.jsx", "type": "blob", "size": 2048},
            {"path": "package.json", "type": "blob", "size": 512}
        ]
    }

    async def mock_get(url, *args, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        if "git/trees" in url:
            resp.json = MagicMock(return_value=mock_tree)
        else:
            resp.json = MagicMock(return_value=mock_repo_meta)
        return resp

    with patch("httpx.AsyncClient.get", new=AsyncMock(side_effect=mock_get)):
        data = await inspect_github_repo(repo_url)
        assert data["owner"] == "SaurabhSinghR45"
        assert data["repo"] == "VibeSync"
        assert data["language"] == "JavaScript"
        assert len(data["files"]) >= 2

@pytest.mark.asyncio
async def test_invalid_github_url():
    with pytest.raises(ValueError, match="Invalid GitHub URL format"):
        await fetch_github_code("https://google.com")
