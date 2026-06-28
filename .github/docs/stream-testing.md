# Stream Testing

To make sure a stream link is working properly, just follow these simple steps:

1. Open it in a media player that supports [HLS](https://en.wikipedia.org/wiki/HTTP_Live_Streaming) or [DASH](https://en.wikipedia.org/wiki/Dynamic_Adaptive_Streaming_over_HTTP) streams. In the examples below, we will use [VLC media player](https://www.videolan.org/vlc/index.html).
2. Watch the broadcast for at least a minute. Make sure playback is stable and doesn't stop abruptly (some test streams cut off after 15–30 seconds).
3. Try restarting the stream. Make sure it isn't looping on a repeating segment and remains available.
4. Make sure the stream works for others too. You can verify this by using services like [check-host.net](https://check-host.net/) or a [VPN](https://en.wikipedia.org/wiki/Virtual_private_network).

If the stream isn't playing, try opening the player's error log. You can usually find the exact cause there. In VLC, it is located under `Tools -> Messages`.

If the stream won't play in your media player but works fine in a web browser, the issue is likely missing [HTTP User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) and/or [HTTP Referrer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer) headers.

In this case, open the stream in your browser. Press `F12`, go to the **Network** tab, and filter the requests for `m3u` or `mpd`:

<img width="338" height="256" alt="image" src="https://github.com/user-attachments/assets/2eec24df-21a4-4a77-8a96-4f967baf2548" />

Then switch to the **Headers** tab, scroll down, and copy the `User-Agent` and `Referer` values:

<img width="660" height="425" alt="image" src="https://github.com/user-attachments/assets/6e0c4453-3e56-4ad3-86a7-c9430c33c188" />

Next, open any text editor and paste the link along with the parameters you found, formatted like this:

```m3u
#EXTM3U
#EXTINF:-1,Example TV
#EXTVLCOPT:http-referrer=https://example.com
#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)
https://example.com/playlist.m3u8
```

Save the file with `.m3u` extension, then open it in your media player. In most cases, it should work immediately.

To test links that are already in the repository, you can simply run the [playlist:test](./scripts.md#playlisttest) script.
