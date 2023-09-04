# Contributing Guide

- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Stream Description Scheme](#stream-description-scheme)
- [Project Structure](#project-structure)

## Issue Reporting Guidelines

### Add stream link

Before posting your request, make sure that:

- Channel ID is valid. A complete list of all supported channels and their IDs can be found on [iptv-org.github.io](https://iptv-org.github.io/).
- The link you want to add works stably. To check this, open it in one of the players (for example, [VLC player](https://www.videolan.org/vlc/index.html)) and watch the broadcast for at least a minute (some test streams are interrupted after 15-30 seconds).
- The link is not already in the playlist. This can be done by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- The link does not lead to Xtream Codes server. [Why don't you accept links to Xtream Codes server?](FAQ.md#why-dont-you-accept-links-to-xtream-codes-server)
- If you know that the broadcast only works in certain countries or it is periodically interrupted, do not forget to indicate this in the request.

An issue without a valid channel ID or working link to the stream will be closed immediately.

### Edit stream description

Before posting your request, make sure that:

- The link is still in our playlists. This can be verified by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.

An issue without a valid link will be closed immediately.

### Report broken link

Before posting your report, make sure that:

- The link is still in our playlists. This can be verified by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- The link is not blocked in your country. To check this, you can use either a [VPN](https://en.wikipedia.org/wiki/Virtual_private_network) or services such as [streamtest.in](https://streamtest.in/).

An issue should contain a report for only one channel, otherwise it will be closed immediately.

### Bug report

Please use this form only if you have found a bug in one of the scripts or the repository as a whole. To report broken link or an error in the stream description, use one of the methods described above.

### Removal request

To request the removal of a link to a channel from repository, you need to fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=removal+request&projects=&template=-removal-request.yml&title=Remove%3A+) and if your request is approved the link will be removed within 1 business day. The channel will also be added to our [blocklist](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) to avoid its appearance in our playlists in the future.

Please keep in mind that we only accept removal requests from channel copyright holders and their official representatives, any other requests will be closed immediately.

## Pull Request Guidelines

### Add stream link

If you want to add a new stream link to playlists, please do the following:

- Make sure that the link you want to add works stably. To do this, open it in one of the players (for example, [VLC player](https://www.videolan.org/vlc/index.html)) and watch the broadcast for at least a minute (some test streams are interrupted after 15-30 seconds).
- Make sure the link does not lead to Xtream Codes server. [How to distinguish a link to an Xtream Codes server from a regular one?](FAQ.md#how-to-distinguish-a-link-to-an-xtream-codes-server-from-a-regular-one)
- Find in our [database](https://iptv-org.github.io/) the ID of the channel you want to add. If this particular channel is not in the database, then first leave a request to add it [here](https://github.com/iptv-org/database/issues/new/choose) and once the request is approved, you can proceed further.
- Then open the [/streams](/streams) folder and select the file corresponding to the country of this channel (for example, for `TF1.fr` it will be `fr.m3u`) and then insert the description of the stream and a link to it at the very end of the file. For more info, see [Stream Description Scheme](#stream-description-scheme).
- If you know that the broadcast only works in certain countries, do not forget to add the `[Geo-blocked]` label to the stream description.
- For broadcasts that may be periodically interrupted, there is the label `[Not 24/7]`.
- Finally, commit all changes and submit a pull request.

If the request is approved by other community members, then the link will appear in the playlist on the next update.

### Remove broken link

If you find a link in the playlist that does not work, follow the steps below:

- Verify that the link is indeed not working and has not just been [geo-blocked](https://en.wikipedia.org/wiki/Geo-blocking). To do this, you can either use a [VPN](https://en.wikipedia.org/wiki/Virtual_private_network) or services such as [streamtest.in](https://streamtest.in/).
- If the link works, but only when using a VPN, then tag it with [Geo-blocked]. For more info, see [Stream Description Scheme](#stream-description-scheme)
- If it turns out that the link works but not 24/7, then add the [Not 24/7] label to it.
- If the link is still not working, then continue.
- Use a [search](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) to find which file this link is stored in, open it and delete the link along with the description.
- Commit the changes and make a pull request.

### Update README.md

- Open `.readme/template.md`.
- Make the necessary changes.
- Commit all changes and send a pull request.

### Update this Guide

- Open `.github/CONTRIBUTING.md`.
- Make the necessary changes.
- Commit all changes and send a pull request.

## Stream Description Scheme

For a stream to be approved, its description must follow this template:

```
#EXTINF:-1 tvg-id="CHANNEL_ID",CHANNEL_NAME (RESOLUTION) [LABEL]
STREAM_URL
```

| Attribute      | Description                                                                                | Required | Valid values                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `CHANNEL_ID`   | Channel ID.                                                                                | Optional | Full list of supported channels with corresponding ID could be found on [iptv-org.github.io](https://iptv-org.github.io/). |
| `CHANNEL_NAME` | Full name of the channel. May contain any characters except: `,`, `(`, `)`, `[`, `]`.      | Required | -                                                                                                                          |
| `RESOLUTION`   | Maximum stream resolution                                                                  | Optional | `2160p`, `1080p`, `720p`, `480p`, `360p` etc                                                                               |
| `LABEL`        | Specified in cases where the broadcast for some reason may not be available to some users. | Optional | `Geo-blocked` or `Not 24/7`                                                                                                |
| `STREAM_URL`   | Stream URL.                                                                                | Required | -                                                                                                                          |

Example:

```xml
#EXTINF:-1 tvg-id="ExampleTV.ua",Example TV (720p) [Not 24/7]
https://example.com/playlist.m3u8
```

Also, if necessary, you can specify custom HTTP User-Agent and Referrer via the `#EXTVLCOPT` tag:

```xml
#EXTINF:-1 tvg-id="ExampleTV.us",Example TV
#EXTVLCOPT:http-referrer=http://example.com/
#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)
http://example.com/stream.m3u8
```

## Project Structure

- `.github/`
  - `ISSUE_TEMPLATE/`: issue templates for the repository.
  - `CODE_OF_CONDUCT.md`: rules you shouldn't break if you don't want to get banned.
- `.readme/`
  - `config.json`: config for the `markdown-include` package, which is used to compile everything into one `README.md` file.
  - `preview.png`: image displayed in the `README.md`.
  - `supported-categories.md`: list of supported categories.
  - `supported-regions.md`: list of supported regions.
  - `template.md`: template for `README.md`.
- `scripts/`: contains all the scripts used in GitHub workflows.
- `streams/`: contains all streams broken down by the country from which they are broadcast.
- `tests/`: contains tests to check the scripts.
- `CONTRIBUTING.md`: file you are currently reading.
- `README.md`: project description generated from the contents of the `.readme/` folder.
