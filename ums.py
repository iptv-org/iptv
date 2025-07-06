import os
import requests

# Fancode source URL (same as update_playlist.py)
fancode_url = 'https://raw.githubusercontent.com/byte-capsule/FanCode-Hls-Fetcher/main/Fancode_Live.m3u'
index_file_path = "streams/index.m3u"

# List local .m3u files (excluding index.m3u)
m3u_files = sorted([
    f for f in os.listdir("streams")
    if f.endswith(".m3u") and f != "index.m3u"
])

# Step 1: Try fetching Fancode content for optional top section
try:
    response = requests.get(fancode_url)
    response.raise_for_status()
    fancode_content_top = response.text.strip()
    print("✅ Fetched Fancode content for top of file.")
except Exception as e:
    print(f"⚠️ Could not fetch Fancode content for top: {e}")
    fancode_content_top = "#EXTM3U\n#EXTINF:-1,Fancode Top (Error)\nhttp://example.com/failed.m3u8"

# Step 2: Start writing index.m3u
with open(index_file_path, "w", encoding="utf-8") as index_file:
    # Write optional top Fancode section
    index_file.write(fancode_content_top + "\n\n")

    # ✅ Add S1/S2 markers (these must be present for update_playlist.py to work!)
    index_file.write("#S1\n")
    index_file.write("#EXTINF:-1,Fancode Placeholder\nhttp://placeholder.fancode/link.m3u8\n")
    index_file.write("#S2\n\n")

    # Add rest of the local playlists
    for m3u_file in m3u_files:
        title = m3u_file.split('.')[0].capitalize()
        file_path = os.path.join("streams", m3u_file)

        index_file.write(f"#EXTINF:-1, {title} Playlist\n")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                index_file.write(content + "\n\n")
                print(f"✅ Added: {m3u_file}")
        except Exception as e:
            print(f"⚠️ Failed to read {m3u_file}: {e}")

print("🎉 index.m3u created with top Fancode, and #S1/#S2 markers for later update.")
