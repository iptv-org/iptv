import os
import requests

# URLs for the source and target playlists
source_url = "https://raw.githubusercontent.com/byte-capsule/FanCode-Hls-Fetcher/main/Fancode_Live.m3u"
target_url = "https://raw.githubusercontent.com/ums91/umsiptv/refs/heads/addinm3u/streams/index.m3u"

# Get GitHub token from environment variables
github_token = os.getenv("GITHUB_TOKEN")
if not github_token:
    print("Error: GITHUB_TOKEN is not set.")
    exit(1)

# GitHub repository details
repo_owner = "ums91"
repo_name = "umsiptv"
file_path = "streams/index.m3u"
branch = "addinm3u"
commit_message = "Update index.m3u with daily playlist"

# Fetch the source playlist
response = requests.get(source_url)
if response.status_code != 200:
    print(f"Failed to fetch source playlist: {response.status_code}")
    exit(1)
source_content = response.text

# Fetch the existing playlist
response = requests.get(target_url)
if response.status_code != 200:
    print(f"Failed to fetch target playlist: {response.status_code}")
    exit(1)
target_content = response.text

# Combine playlists (add source at the top)
updated_content = source_content + "\n" + target_content

# GitHub API endpoint for updating the file
api_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{file_path}"

# Fetch the current file's SHA
headers = {"Authorization": f"Bearer {github_token}"}
response = requests.get(api_url, headers=headers)
if response.status_code != 200:
    print(f"Failed to fetch file metadata: {response.status_code}")
    exit(1)
file_data = response.json()
file_sha = file_data["sha"]

# Update the file
payload = {
    "message": commit_message,
    "content": updated_content.encode("utf-8").decode("utf-8"),
    "sha": file_sha,
    "branch": branch,
}
response = requests.put(api_url, headers=headers, json=payload)
if response.status_code == 200:
    print("Playlist updated successfully!")
else:
    print(f"Failed to update playlist: {response.status_code}, {response.json()}")
