import os
import requests

# External M3U URLs
fancode_url = 'https://raw.githubusercontent.com/Jitendraunatti/fancode/refs/heads/main/data/fancode.m3u'
sonyliv_url = 'https://raw.githubusercontent.com/SArun61/IPTV/refs/heads/main/SonyLiv.m3u'

index_file_path = "streams/index.m3u"

# Get local .m3u files (excluding index.m3u)
m3u_files = sorted([
    f for f in os.listdir("streams")
    if f.endswith(".m3u") and f != "index.m3u"
])

# ---- Fetch remote content safely ----
def fetch_m3u(name, url):
    try:
        print(f"📡 Fetching {name} from {url}")
        r = requests.get(url)
        r.raise_for_status()
        print(f"✅ Fetched {name}")
        return r.text.strip()
    except Exception as e:
        print(f"❌ Failed to fetch {name}: {e}")
        return f"#EXTINF:-1,{name} Unavailable\nhttp://example.com/fail.m3u8"

fancode_content = fetch_m3u("Fancode", fancode_url)
sonyliv_content = fetch_m3u("SonyLiv", sonyliv_url)

# ---- Write index.m3u ----
with open(index_file_path, "w", encoding="utf-8") as index_file:
    print(f"📝 Writing to {index_file_path}")

    # Step 1: Fancode on top
    index_file.write(f"#EXTM3U\n\n")
    index_file.write("#EXTINF:-1, Fancode Playlist\n")
    index_file.write(fancode_content + "\n\n")

    # Step 2: SonyLiv next
    index_file.write("#EXTINF:-1, SonyLiv Playlist\n")
    index_file.write(sonyliv_content + "\n\n")

    # Step 2.5: Insert playlist.m3u content from repo root here
    playlist_path = "playlist.m3u"
    try:
        print(f"📂 Adding: {playlist_path}")
        with open(playlist_path, "r", encoding="utf-8") as f:
            playlist_content = f.read().strip()
        index_file.write("#EXTINF:-1, Playlist Root File\n")
        index_file.write(playlist_content + "\n\n")
    except Exception as e:
        print(f"⚠️ Error reading {playlist_path}: {e}")

    # Step 3: S1/S2 marker block for live Fancode updates
    index_file.write("#S1\n")
    index_file.write("#EXTINF:-1, Fancode Placeholder for update\nhttp://placeholder.fancode/stream.m3u8\n")
    index_file.write("#S2\n\n")

    # Step 4: Local .m3u files inside streams/
    for m3u_file in m3u_files:
        title = m3u_file.split('.')[0].capitalize()
        file_path = os.path.join("streams", m3u_file)

        print(f"📂 Adding: {m3u_file}")
        index_file.write(f"#EXTINF:-1, {title} Playlist\n")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                index_file.write(f.read().strip() + "\n\n")
        except Exception as e:
            print(f"⚠️ Error reading {m3u_file}: {e}")

print("🎉 index.m3u created with Fancode, SonyLiv, playlist.m3u, #S1/#S2, and local playlists.")
