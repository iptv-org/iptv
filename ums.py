import os
import requests

fancode_url = 'https://raw.githubusercontent.com/byte-capsule/FanCode-Hls-Fetcher/main/Fancode_Live.m3u'
index_file_path = "streams/index.m3u"

# Get local .m3u files, excluding index.m3u
m3u_files = sorted([
    f for f in os.listdir("streams")
    if f.endswith(".m3u") and f != "index.m3u"
])

# Step 1: Fetch Fancode content
print(f"📡 Fetching Fancode playlist from: {fancode_url}")
try:
    response = requests.get(fancode_url)
    response.raise_for_status()
    fancode_content = response.text.strip()
    print("✅ Successfully fetched Fancode links.")
except Exception as e:
    print(f"❌ Failed to fetch Fancode links: {e}")
    fancode_content = "#EXTM3U\n#EXTINF:-1,Fancode Unavailable\nhttp://example.com/fail.m3u8"

# Step 2: Write index.m3u
print(f"📝 Writing to: {index_file_path}")
with open(index_file_path, "w", encoding="utf-8") as index_file:
    # Write Fancode content on top
    index_file.write(fancode_content + "\n\n")

    # Write #S1 marker
    index_file.write("#S1\n")
    index_file.write(f"#EXTINF:-1, Placeholder for Fancode Replacement\n")
    index_file.write("http://placeholder.m3u8\n")
    index_file.write("#S2\n\n")

    # Now write remaining .m3u content
    for m3u_file in m3u_files:
        title = m3u_file.split('.')[0].capitalize()
        file_path = os.path.join("streams", m3u_file)

        # Skip placeholder file if added manually
        if m3u_file.lower() in ["index.m3u"]:
            continue

        print(f"📂 Processing file: {m3u_file}")
        index_file.write(f"#EXTINF:-1, {title} Playlist\n")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                index_file.write(content + "\n\n")
                print(f"✅ Added content from: {m3u_file}")
        except Exception as e:
            print(f"⚠️ Skipped {m3u_file} due to error: {e}")

print("🎉 index.m3u created successfully with top Fancode and #S1/#S2 markers for later replacement.")
