import requests
from github import Github
import os

# Set up GitHub authentication using the token stored in the environment variable
token = os.getenv('GITHUB_TOKEN')
g = Github(token)

# URLs for the M3U playlists
fancode_url = 'https://raw.githubusercontent.com/Jitendraunatti/fancode/refs/heads/main/data/fancode.m3u'
index_url = 'https://raw.githubusercontent.com/ums91/umsiptv/addinm3u/streams/index.m3u'

# Fetch the M3U files
fancode_response = requests.get(fancode_url)
index_response = requests.get(index_url)

# Ensure the requests are successful
if fancode_response.status_code == 200 and index_response.status_code == 200:
    fancode_links = fancode_response.text.strip()
    index_links = index_response.text.strip()

    # Read local playlist.m3u content
    try:
        with open('playlist.m3u', 'r', encoding='utf-8') as f:
            local_playlist_links = f.read().strip()
    except Exception as e:
        print(f"Error reading local playlist.m3u file: {e}")
        exit()

    # Combine fancode links and local playlist links
    combined_links = fancode_links + '\n' + local_playlist_links

    # Split the index.m3u content based on markers #S1 and #S2
    if "#S1" in index_links and "#S2" in index_links:
        before_s1, rest = index_links.split("#S1", 1)
        between_s1_s2, after_s2 = rest.split("#S2", 1)

        # Replace content between #S1 and #S2 with combined links
        updated_playlist = (
            before_s1.strip() + "\n#S1\n" + combined_links + "\n#S2\n" + after_s2.strip()
        )
    else:
        # If markers are not found, raise an error
        print("Error: #S1 and/or #S2 markers are missing in index.m3u.")
        exit()

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

    # Update the file with new contents
    try:
        commit_message = "Update Fancode Live m3u links and add custom playlist links between #S1 and #S2"
        repo.update_file(file.path, commit_message, updated_playlist, file.sha, branch="addinm3u")
        print("Playlist updated successfully.")
    except Exception as e:
        print(f"Error updating file: {e}")
else:
    print(f"Error fetching M3U files. Status codes: {fancode_response.status_code}, {index_response.status_code}")
