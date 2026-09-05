# Playlists

The repository uses two types of playlists: internal and public.

## Internal

These playlists are located in the [streams/](../streams) folder and contain all links currently available in the repository.

The links in these playlists are grouped by country and by the service from which the stream is broadcast. They are arranged this way solely for the convenience of moderating links.

In its simplest form, an internal playlist looks like this:

```
#EXTM3U
#EXTINF:-1 tvg-id="ExampleTV.us@SD",Example TV (720p)
https://example.com/playlist.m3u8
```

If there is a guide for one of the channels in the playlist in our [EPG](https://github.com/iptv-org/epg/blob/master/GUIDES.md) repository, the header will also include a link to it:

```
#EXTM3U x-tvg-url="https://example.com/guide.xml"
```

Since these playlists are processed primarily using scripts, we need to follow a few rules when editing them:

- All files must have the `.m3u` extension
- The playlist must begin with the header `#EXTM3U`
- Each link must comply with the [Stream Description Scheme](./stream-description-scheme.md)
- Lines must end with [CRLF](https://developer.mozilla.org/en-US/docs/Glossary/CRLF)
- The file encoding must be UTF-8 without BOM

## Public

Unlike internal playlists, these playlists are created specifically for regular users.

They are generated automatically using the [playlist:generate](./scripts.md#playlistgenerate) script every day at 00:00 UTC and then placed in a separate branch of [gh-pages](https://github.com/iptv-org/iptv/tree/gh-pages).

The links in these playlists are organized solely based on the channel's description in our [database](https://github.com/iptv-org/database). For example, if a channel's broadcast area is listed as `c/IT`, the link to its stream will automatically be placed in the `countries/it.m3u` file.

Another difference from internal playlists is that public playlists include only the best available option for each channel, based on stream quality and labels. The exception is playlists in the `raw/` folder.

Additionally, if the link includes a valid [stream ID](./stream-id.md), the channel logo, category, broadcast country and language will be added to the description. For example:

```
#EXTM3U x-tvg-url="https://example.com/guide.xml”
#EXTINF:-1 tvg-id="ExampleTV.us@SD” tvg-logo="https://example.com/logo.png” group-title="Movies”,Example TV (720p)
https://example.com/playlist.m3u8
```

A complete list of public playlists can always be found in [PLAYLISTS.md](../PLAYLISTS.md).
