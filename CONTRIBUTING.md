# Contributing Guide

Before submitting your contribution, please make sure to take a moment and read through the following guidelines:

- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Stream Description Scheme](#stream-description-scheme)
- [Project Structure](#project-structure)

## Issue Reporting Guidelines

### Request a Channel

To request a channel, create an [issue](https://github.com/iptv-org/iptv/issues/new?labels=channel+request&template=------channel-request.yml&title=Add%3A+) and complete all details requested. Understand that our community of volunteers will try to help you, but if a public link cannot be found, there is little we can do. (**IMPORTANT:** the issue should contain a request for only one channel, otherwise it will be closed immediately)

### Report a Broken Stream

To report a broadcast that is not working, create an [issue](https://github.com/iptv-org/iptv/issues/new?labels=broken+stream&template=-----broken-stream.yml&title=Replace%3A+) with a description of the channel. (**IMPORTANT:** an issue should contain a report for only one channel, otherwise it will be closed immediately)

### Content Removal Request

If you find any content in the repository that you own and you would like us to remove, please create an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=freearhey&labels=removal+request&template=--removal-request.yml&title=Remove%3A+) and provide all necessary information. If the request is granted, the specified content will be removed from the repository within one business day.

## Pull Request Guidelines

### Add or Replace a Stream

If you would like to replace a broken stream or add a new one, please do the following:

- make sure that the link you want to add works by using a program like [VLC media player](https://www.videolan.org/vlc/index.html)
- check if the channel is working outside your country by using a VPN or use a service like [streamtest.in](https://streamtest.in/)
- find out from which country the channel is being broadcasted. This information can usually be found on [lyngsat.com](https://www.lyngsat.com/search.html) or [wikipedia.org](https://www.wikipedia.org/). If you are unable to determine which country the channel belongs to, add the channel onto the `channels/unsorted.m3u` playlist
- find the corresponding [ISO_3166-2 code](https://en.wikipedia.org/wiki/ISO_3166-2) for the country
- open the `/streams` folder and find the file that has the same code in its name and open it
- if broken, find the broken link in this file and replace it with working one
- if new, at the very end of this file add a link to the channel with a description
- if the broadcast is not available outside of a certain country, add the label `[Geo-blocked]` to the end of the channel name and list these countries in the `tvg-country` attribute
- if the broadcast is not available 24 hours a day, add the label `[Not 24/7]`
- commit all changes and send a pull request

### Update README.md

- open `.readme/template.md`
- make the necessary changes
- commit all changes and send a pull request

### Update this Guide

- open `.github/CONTRIBUTING.md`
- make the necessary changes
- commit all changes and send a pull request

## Stream Description Scheme

For a stream to be approved, its description must follow this template:

```
#EXTINF:-1 tvg-id="CHANNEL_ID",CHANNEL_NAME (RESOLUTION) [LABEL]
STREAM_URL
```

| Attribute      | Description                                                                                                                                                                                                                              | Required | Valid values                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `CHANNEL_ID`   | Channel ID.                                                                                                                                                                                                                              | Optional | Full list of supported channels could be found on [iptv-org.github.io](https://iptv-org.github.io/) |
| `CHANNEL_NAME` | Full name of the channel. May contain any characters except: `,`, `(`, `)`, `[`, `]`. It is recommended to use the name listed on [lyngsat](https://www.lyngsat.com/search.html) or [wikipedia](https://www.wikipedia.org/) if possible. | Required | -                                                                                                   |
| `RESOLUTION`   | Maximum stream resolution.                                                                                                                                                                                                               | Optional | `2160p`, `1080p`, `720p`, `480p`, `360p` etc                                                        |
| `LABEL`        | Specified in cases where the broadcast for some reason may not be available to some users.                                                                                                                                               | Optional | `Geo-blocked` or `Not 24/7`                                                                         |
| `STREAM_URL`   | Stream URL.                                                                                                                                                                                                                              | Required | -                                                                                                   |

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

Each stream also have a `status` attribute which is updated daily by the [iptv-bot](https://github.com/apps/iptv-bot). The attribute can have one of the following values:

- `online` - stream was successfully loaded
- `blocked` - server returned HTTP code [403 Forbidden](https://en.wikipedia.org/wiki/HTTP_403)
- `timeout` - request time exceeded 60 seconds
- `error` - stream could not be loaded for some other reason

## Project Structure

- `.github/`
  - `ISSUE_TEMPLATE/`: issue templates for the repository.
  - `workflows/`
    - `auto-update.yml`: GitHub workflow that launches daily playlist updates (at 0:00 and 12:00 UTC).
    - `check.yml`: GitHub workflow that checks every pull request for syntax errors and blocked channels.
  - `CODE_OF_CONDUCT.md`: rules you shouldn't break if you don't want to get banned.
- `.readme/`
  - `config.json`: config for the `markdown-include` package, which is used to compile everything into one `README.md` file.
  - `preview.png`: image displayed in the `README.md`.
  - `supported-categories.md`: list of supported categories.
  - `supported-regions.md`: list of supported regions.
  - `template.md`: template for `README.md`.
- `scripts/`: contains all the scripts used in GitHub workflows.
- `streams/`: contains all streams broken down by the country from which they are broadcast.
  - ...
  - `unsorted.m3u`: playlist with channels not yet sorted.
- `tests/`: contains tests to check the scripts.
- `CONTRIBUTING.md`: file you are currently reading.
- `README.md`: project description generated from the contents of the `.readme/` folder.
