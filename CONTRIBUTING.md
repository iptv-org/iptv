# Contributing Guide

- [How to?](#how-to)
- [Stream Description Scheme](#stream-description-scheme)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Workflows](#workflows)

## How to?

### How to add a new stream link to a playlists?

You have several options:

1. Create a new [issue](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams:add&projects=&template=-----streams_add.yml&title=Add%3A+) and provide all the required information. If the request is approved, the link will be added to the playlist in the next update.

2. Add the link to the playlist directly using a [pull request](https://github.com/iptv-org/iptv/pulls).

Regardless of which option you choose, before posting your request please do the following:

- Make sure the link you want to add works stably. To check this, open it in one of the players (for example, [VLC player](https://www.videolan.org/vlc/index.html)) and watch the broadcast for at least a minute (some test streams are interrupted after 15-30 seconds).
- Make sure the link is not already in the playlist. This can be done by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- Find the ID of the channel you want to add in our [database](https://iptv-org.github.io/). If this particular channel is not in the database, then leave a request to add it [here](https://github.com/iptv-org/database/issues/new/choose) and wait until it is approved before continuing.
- Make sure the channel is not blocklisted. This can be done by checking the [blocklist.csv](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) file.
- The link does not lead to the Xtream Codes server. [Why don't you accept links to Xtream Codes server?](FAQ.md#why-dont-you-accept-links-to-xtream-codes-server)
- If you know that the broadcast only works in certain countries or it is periodically interrupted, do not forget to indicate this in the request.

A requests without a valid channel ID or working link to the stream will be closed immediately.

Note all links in playlists are sorted automatically by scripts so there is no need to sort them manually. For more info, see [Scripts](#scripts).

### How to add a link to YouTube live?

You can use one of the services like [abskmj/youtube-hls-m3u8](https://github.com/abskmj/youtube-hls-m3u8) that allow you to create permanent link to the broadcast that can be opened in most players.

### How to distinguish a link to an Xtream Codes server from a regular one?

Most of them have this form:

`http(s)://{hostname}:{port}/{username}/{password}/{channelID}` (port is often `25461`)

To make sure that the link leads to the Xtream Codes server, copy the `hostname`, `port`, `username` and `password` into the link below and try to open it in a browser:

`http(s)://{hostname}:{port}/panel_api.php?username={username}&password={password}`

If the link answers, you're with an Xtream Codes server.

### How to report a broken stream?

Fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=broken+stream&projects=&template=---broken-stream.yml&title=Broken%3A+) and as soon as a working replacement appears, we will add it to the playlist or at least remove the non-working one.

The only thing before publishing your report is to make sure that:

- The link is still in our playlists. You can verify this by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- The link really doesn't work and is not just [geo-blocked](https://en.wikipedia.org/wiki/Geo-blocking). To check this, you can either use a [VPN](https://en.wikipedia.org/wiki/Virtual_private_network) or services such as [streamtest.in](https://streamtest.in/).

An issue without a valid link will be closed immediately.

### How do I remove my channel from playlist?

To request removal of a link to a channel from the repository, you need to fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=removal+request&projects=&template=-removal-request.yml&title=Remove%3A+) and wait for the request to be reviewed (this usually takes no more than 1 business day). And if the request is approved, links to the channel will be immediately removed from the repository.

The channel will also be added to our [blocklist](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) to avoid its appearance in our playlists in the future.

Please note that we only accept removal requests from channel owners and their official representatives, all other requests will be closed immediately.

## Stream Description Scheme

For a stream to be approved, its description must follow this template:

```
#EXTINF:-1 tvg-id="CHANNEL_ID" tvg-shift="TIMESHIFT",CHANNEL_NAME (RESOLUTION) [LABEL]
STREAM_URL
```

| Attribute      | Description                                                                                | Required | Valid values                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `CHANNEL_ID`   | Channel ID.                                                                                | Optional | Full list of supported channels with corresponding ID could be found on [iptv-org.github.io](https://iptv-org.github.io/). |
| `TIMESHIFT`    | Indicates the shift of the program schedule.                                               | Optional | `-2`, `-1`, `1`, `2` etc                                                                                                   |
| `CHANNEL_NAME` | Full name of the channel. May contain any characters except: `,`, `[`, `]`.                | Required | -                                                                                                                          |
| `RESOLUTION`   | Maximum stream resolution.                                                                 | Optional | `2160p`, `1080p`, `720p`, `480p`, `360p` etc                                                                               |
| `LABEL`        | Specified in cases where the broadcast for some reason may not be available to some users. | Optional | `Geo-blocked` or `Not 24/7`                                                                                                |
| `STREAM_URL`   | Stream URL.                                                                                | Required | -                                                                                                                          |

Example:

```xml
#EXTINF:-1 tvg-id="ExampleTV.ua" tvg-shift="4",Example TV (720p) [Not 24/7]
https://example.com/playlist.m3u8
```

Also, if necessary, you can specify custom [HTTP User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) and [Referrer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer) via the `#EXTVLCOPT` tag:

```xml
#EXTINF:-1 tvg-id="ExampleTV.us",Example TV
#EXTVLCOPT:http-referrer=http://example.com/
#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)
http://example.com/stream.m3u8
```

## Project Structure

- `.github/`
  - `ISSUE_TEMPLATE/`: issue templates for the repository.
  - `workflows`: contains [GitHub actions](https://docs.github.com/en/actions/quickstart) workflows.
  - `CODE_OF_CONDUCT.md`: rules you shouldn't break if you don't want to get banned.
- `.readme/`
  - `config.json`: config for the `markdown-include` package, which is used to compile everything into one `README.md` file.
  - `preview.png`: image displayed in the `README.md`.
  - `supported-categories.md`: list of supported categories.
  - `supported-regions.md`: list of supported regions.
  - `template.md`: template for `README.md`.
- `scripts/`: contains all scripts used in the repository.
- `streams/`: contains all streams broken down by the country from which they are broadcast.
- `tests/`: contains tests to check the scripts.
- `CONTRIBUTING.md`: file you are currently reading.
- `README.md`: project description generated from the contents of the `.readme/` folder.

## Scripts

These scripts are created to automate routine processes in the repository and make it a bit easier to maintain.

For scripts to work, you must have [Node.js](https://nodejs.org/en) installed on your computer.

To run scripts use the `npm run <script-name>` command.

- `act:check`: allows to run the [check](https://github.com/iptv-org/iptv/blob/master/.github/workflows/check.yml) workflow locally. Depends on [nektos/act](https://github.com/nektos/act).
- `act:format`: allows to test the [format](https://github.com/iptv-org/iptv/blob/master/.github/workflows/update.yml) workflow locally. Depends on [nektos/act](https://github.com/nektos/act).
- `act:update`: allows to test the [update](https://github.com/iptv-org/iptv/blob/master/.github/workflows/update.yml) workflow locally. Depends on [nektos/act](https://github.com/nektos/act).
- `api:load`: downloads the latest channel and stream data from the [iptv-org/api](https://github.com/iptv-org/api).
- `api:generate`: generates a JSON file with all streams for the [iptv-org/api](https://github.com/iptv-org/api) repository.
- `api:deploy`: allows to manually upload a JSON file created via `api:generate` to the [iptv-org/api](https://github.com/iptv-org/api) repository. To run the script you must provide your [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with write access to the repository.
- `playlist:format`: formats internal playlists. The process includes [URL normalization](https://en.wikipedia.org/wiki/URI_normalization), duplicate removal, removing invalid id's and sorting links by channel name, quality, and label.
- `playlist:update`: triggers an update of internal playlists. The process involves processing approved requests from issues.
- `playlist:generate`: generates all public playlists.
- `playlist:validate`: сhecks ids and links in internal playlists for errors.
- `playlist:lint`: сhecks internal playlists for syntax errors.
- `playlist:deploy`: allows to manually publish all generated via `playlist:generate` playlists. To run the script you must provide your [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with write access to the repository.
- `readme:update`: updates the list of playlists in [README.md](README.md).
- `report:create`: shows a list of all current requests and their status.
- `check`: (shorthand) sequentially runs the `playlist:lint` and `playlist:validate` scripts.
- `format`: (shorthand) runs the `playlist:format` script.
- `update`: (shorthand) sequentially runs the `playlist:generate`, `api:generate` and `readme:update` scripts.
- `deploy`: (shorthand) sequentially runs the `playlist:deploy` and `api:deploy` scripts.
- `lint`: сhecks the scripts for syntax errors.
- `test`: runs a test of all the scripts described above.

## Workflows

To automate the run of the scripts described above, we use the [GitHub Actions workflows](https://docs.github.com/en/actions/using-workflows).

Each workflow includes its own set of scripts that can be run either manually or in response to an event.

- `check`: sequentially runs the `api:load`, `playlist:check` and `playlist:validate` scripts when a new pull request appears, and blocks the merge if it detects an error in it.
- `format`: sequentially runs `api:load`, `playlist:format`, `playlist:lint` and `playlist:validate` scripts.
- `update`: every day at 0:00 UTC sequentially runs `api:load`, `playlist:update`, `playlist:lint`, `playlist:validate`, `playlist:generate`, `api:generate` and `readme:update` scripts and deploys the output files if successful.
