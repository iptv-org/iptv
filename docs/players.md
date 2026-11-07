# Using playlists in media players

This page shows how to open one of our playlists in a few common players. Menu names change between versions, so treat the steps as a guide. For a wider list of apps, see [awesome-iptv](https://github.com/iptv-org/awesome-iptv#apps).

First, pick a playlist link from [PLAYLISTS.md](../PLAYLISTS.md). The main one is:

`https://iptv-org.github.io/iptv/index.m3u`

## VLC

1. Open _Media_ → _Open Network Stream_ (`Ctrl+N`).
2. Paste the playlist link and press _Play_.
3. Open _View_ → _Playlist_ to browse the channels.

## Kodi (PVR IPTV Simple Client)

1. Go to _Settings_ → _Add-ons_ → _My add-ons_ → _PVR clients_ → _PVR IPTV Simple Client_ → _Configure_.
2. In the _General_ tab, set _Location_ to _Remote path (Internet address)_ and paste the link into _M3U playlist URL_.
3. Enable the add-on. The channels will appear in the _TV_ section.

## mpv

Pass the playlist link to the player: `mpv <playlist-url>`.

## Mobile and TV apps

Most IPTV apps have an _Add playlist_ (or _Add source_) option in their settings that asks for a playlist URL. Paste the link there.

## Header directives (`#EXTVLCOPT`)

Some streams only play with a specific referrer or user-agent. In our playlists these are written as `#EXTVLCOPT:http-referrer=` and `#EXTVLCOPT:http-user-agent=` lines (see the [stream description scheme](./stream-description-scheme.md)). A player that ignores these lines cannot play such streams, even if the link itself is valid.

- Reported to work (iptv-org discussions): VLC, OTT Navigator, OTT TV, TiviMate, yuki-iptv, Kodi.
- Reported to ignore them: AVPlayer, KSPlayer.
- Any other player, including mpv: not verified, to be confirmed.

If a stream does not play, see [Stream Testing](./stream-testing.md) and [Geo-blocking](./geo-blocking.md).
