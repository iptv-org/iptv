# Stream Description Scheme

For a stream to be approved, its description must follow this template:

```m3u
#EXTINF:-1 tvg-id="STREAM_ID",STREAM_TITLE (QUALITY) [LABEL]
STREAM_URL
```

| Attribute      | Description                                                                                                                                                                     | Required | Valid values                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| `STREAM_ID`    | Stream ID consisting of a channel ID and a feed ID. A full list of supported channels with corresponding IDs can be found on [iptv-org.github.io](https://iptv-org.github.io/). | Optional | `<channel_id>` or `<channel_id>@<feed_id>`   |
| `STREAM_TITLE` | Stream title consisting of a channel name and a feed name. May contain any characters except `,`, `[`, or `]`.                                                                  | Required | -                                            |
| `QUALITY`      | Maximum stream quality.                                                                                                                                                         | Optional | `2160p`, `1080p`, `720p`, `480p`, `360p` etc |
| `LABEL`        | Specified in cases where the broadcast for some reason may not be available to some users.                                                                                      | Optional | `Geo-blocked` or `Not 24/7`                  |
| `STREAM_URL`   | Stream URL. The following protocols are supported: `HTTPS`, `HTTP`, `MMS`, `MMSH`, `RTSP`, `RTMP`, `SRT`, `RTP`, `UDP`.                                                         | Required | -                                            |

Example:

```m3u
#EXTINF:-1 tvg-id="ExampleTV.us@East",Example TV East (720p) [Geo-blocked]
https://example.com/playlist.m3u8
```

Also, if necessary, you can specify a custom [HTTP User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) and [HTTP Referrer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer) through the `#EXTVLCOPT` directive:

```m3u
#EXTINF:-1 tvg-id="ExampleTV.us",Example TV
#EXTVLCOPT:http-referrer=http://example.com/
#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)
http://example.com/stream.m3u8
```
