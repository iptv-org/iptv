import requests
from github import Github
import os

# Set up GitHub authentication using the token stored in the environment variable
token = os.getenv('GITHUB_TOKEN')
g = Github(token)

# URLs for the M3U playlists
fancode_url = 'https://raw.githubusercontent.com/byte-capsule/FanCode-Hls-Fetcher/main/Fancode_Live.m3u'
index_url = 'https://raw.githubusercontent.com/ums91/umsiptv/addinm3u/streams/index.m3u'

# Fetch the M3U files
fancode_response = requests.get(fancode_url)
index_response = requests.get(index_url)

# Ensure the requests are successful
if fancode_response.status_code == 200 and index_response.status_code == 200:
    fancode_links = fancode_response.text
    index_links = index_response.text

    # Check if Fancode Live links already exist at the top of index.m3u
    if fancode_links.strip() in index_links:
        # If they exist, replace them with the new Fancode_Live.m3u content
        updated_playlist = fancode_links.strip() + '\n' + index_links[len(fancode_links.strip()):].strip()
    else:
        # If not, prepend the new Fancode_Live.m3u content at the top
        updated_playlist = fancode_links.strip() + '\n' + index_links.strip()

    # Set up GitHub repository and file path
    repo_name = 'ums91/umsiptv'
    file_path = 'streams/index.m3u'

    # Access the repository and the file
    repo = g.get_repo(repo_name)
    try:
        file = repo.get_contents(file_path, ref='addinm3u')
    except Exception as e:
        print(f"Error fetching file: {e}")
        exit()

    # Update the file with new contents (replace or prepend Fancode_Live.m3u links)
    try:
        commit_message = "Update Fancode Live m3u links in index.m3u"
        repo.update_file(file.path, commit_message, updated_playlist, file.sha, branch="addinm3u")
        print("Playlist updated successfully.")
    except Exception as e:
        print(f"Error updating file: {e}")
else:
    print(f"Error fetching M3U files. Status codes: {fancode_response.status_code}, {index_response.status_code}")
