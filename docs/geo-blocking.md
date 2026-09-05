# Geo-blocking

Sometimes providers block streams from being played in certain countries or regions.

To avoid confusing these links with broken ones, we mark them with the label `Geo-blocked`:

```m3u
#EXTINF:-1 tvg-id="ExampleTV.us@SD",Example TV (720p) [Geo-blocked]
https://example.com/playlist.m3u8
```

The easiest way to make sure the stream works outside your country is to use services like [check-host.net](https://check-host.net/check-http) or a [VPN](https://en.wikipedia.org/wiki/Virtual_private_network).
