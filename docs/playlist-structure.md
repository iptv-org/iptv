# Playlist Structure

All links in the repository are stored in the [streams/](../../streams) folder as [M3U](https://en.wikipedia.org/wiki/M3U) playlists, grouped by the sources from which they are broadcast. They are arranged this way solely for the convenience of moderating links and are not intended for use by end users.

All links undergo automatic filtering and are sorted according to data in our [database](https://github.com/iptv-org/database), so there is no need to sort anything manually. For more info, see [Scripts](./scripts.md).

In order for the scripts to process these files correctly, you must follow a strict structure:

- All files must have the `.m3u` extension
- The playlist must begin with the header `#EXTM3U`
- Each link must comply with the [Stream Description Scheme](./stream-description-scheme.md)
- Lines must end with [CRLF](https://developer.mozilla.org/en-US/docs/Glossary/CRLF)
- The file encoding must be UTF-8 without BOM
