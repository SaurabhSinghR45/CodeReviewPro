import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from github_fetcher import fetch_github_code, inspect_github_repo, is_noise_file

def test_noise_file_detection():
    assert is_noise_file("package-lock.json") is True
    assert is_noise_file("poetry.lock") is True
    assert is_noise_file("bundle.min.js") is True
    assert is_noise_file("styles.min.css") is True
    assert is_noise_file("logo.svg") is True
    assert is_noise_file("data.db") is True
    assert is_noise_file("node_modules/express/index.js") is True
    assert is_noise_file("src/app.py") is False
    assert is_noise_file("components/Header.jsx") is False

@pytest.mark.asyncio
async def test_fetch_blob_file_url():
    url = "https://github.com/octocat/Hello-World/blob/master/README.py"
    mock_content = "def hello(): pass"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = mock_content

    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=mock_response)):
        content = await fetch_github_code(url)
        assert "=== File: README.py ===" in content
        assert "def hello(): pass" in content

@pytest.mark.asyncio
async def test_fetch_pr_url_filters_lockfiles_and_binaries():
    pr_url = "https://github.com/octocat/Hello-World/pull/1347"
    mock_files = [
        {"filename": "package-lock.json", "patch": "@@ -1,5 +1,5 @@\n-lock\n+lock"},
        {"filename": "asset.png", "patch": ""},
        {"filename": "src/main.py", "patch": "@@ -1,3 +1,3 @@\n-old\n+new"}
    ]

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json = MagicMock(return_value=mock_files)

    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=mock_response)):
        content = await fetch_github_code(pr_url)
        # Verify noise files were skipped
        assert "package-lock.json" not in content
        assert "asset.png" not in content
        assert "=== File (PR Patch): src/main.py ===" in content
        assert "+new" in content

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
            {"path": "package-lock.json", "type": "blob", "size": 512},
            {"path": "src/App.jsx", "type": "blob", "size": 2048}
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
        # package-lock.json should be filtered from code files list
        file_paths = [f["path"] for f in data["files"]]
        assert "package-lock.json" not in file_paths
        assert "src/index.js" in file_paths

@pytest.mark.asyncio
async def test_ssrf_and_path_traversal_rejection():
    # Non-github host
    with pytest.raises(ValueError, match="Invalid host"):
        await fetch_github_code("https://evil-attacker.com/repo/blob/main/exploit.py")

    # Path traversal sequence
    with pytest.raises(ValueError, match="Path traversal sequence"):
        await fetch_github_code("https://github.com/owner/repo/blob/main/../../etc/passwd")
