# Contributing Guide

- [How to?](#how-to)
- [Stream Description Scheme](#stream-description-scheme)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Workflows](#workflows)

## How to?

### How to add a new stream link to a playlists?

You have several options:

1. Create a new request using this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams:add&projects=&template=1_streams_add.yml&title=Add%3A+) and if approved, the link will automatically be added to the playlist on the next update.

2. Add the link to the playlist directly using a [pull request](https://github.com/iptv-org/iptv/pulls).

Regardless of which option you choose, before posting your request please do the following:

- Make sure the link you want to add works stably. To check this, open it in one of the players (for example, [VLC player](https://www.videolan.org/vlc/index.html)) and watch the broadcast for at least a minute (some test streams are interrupted after 15-30 seconds).
- Make sure the link is not already in the playlist. This can be done by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- Make sure the link does not lead to the Xtream Codes server. [Why don't you accept links to Xtream Codes server?](FAQ.md#why-dont-you-accept-links-to-xtream-codes-server)
- Make sure that the link leads directly to the broadcast, without unnecessary redirects.
- Find the ID of the channel you want on [iptv-org.github.io](https://iptv-org.github.io/). If your desired channel is not on the list you can leave a request to add it [here](https://github.com/iptv-org/database/issues/new/choose).
- Make sure the channel is not blocklisted. It can also be done through [iptv-org.github.io](https://iptv-org.github.io/).
- If you know that the broadcast only works in certain countries or it is periodically interrupted, do not forget to indicate this in the request.

A requests without a valid stream ID or working link to the stream will be closed immediately.

Note all links in playlists are sorted automatically by scripts so there is no need to sort them manually. For more info, see [Scripts](#scripts).

### How to fix the stream description?

Most of the stream description (channel name, feed name, categories, languages, broadcast area, logo) we load from the [iptv-org/database](https://github.com/iptv-org/database) using the stream ID.

So first of all, make sure that the desired stream has the correct ID. A full list of all supported channels and their corresponding IDs can be found on [iptv-org.github.io](https://iptv-org.github.io/). To change the stream ID of any link in the playlist, just fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams%3Aedit&projects=&template=2_streams_edit.yml&title=Edit%3A+).

If, however, you have found an error in the database itself, this is the place to go: [How to edit channel description?](https://github.com/iptv-org/database/blob/master/CONTRIBUTING.md#how-to-edit-channel-description)

### How to distinguish a link to an Xtream Codes server from a regular one?

Most of them have this form:

`http(s)://{hostname}:{port}/{username}/{password}/{channelID}` (port is often `25461`)

To make sure that the link leads to the Xtream Codes server, copy the `hostname`, `port`, `username` and `password` into the link below and try to open it in a browser:

`http(s)://{hostname}:{port}/panel_api.php?username={username}&password={password}`

If the link answers, you're with an Xtream Codes server.

### How to report a broken stream?

Fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams:remove&projects=&template=3_streams_report.yml&title=Broken%3A+) and as soon as a working replacement appears, we will add it to the playlist or at least remove the non-working one.

The only thing before publishing your report is to make sure that:

- The link is still in our playlists. You can verify this by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- The link really doesn't work and is not just [geo-blocked](https://en.wikipedia.org/wiki/Geo-blocking). To check this, you can either use a [VPN](https://en.wikipedia.org/wiki/Virtual_private_network) or services such as [streamtest.in](https://streamtest.in/).

An issue without a valid link will be closed immediately.

### How to find a broken stream?

For starters, you can just try to open the playlist in [VLC player](https://www.videolan.org/vlc/). The player outputs all errors to the log (Tools -> Messages) so you'll be able to determine pretty accurately why a link isn't working.

Another way to test links is to use the NPM script. To do this, first make sure you have [Node.js](https://nodejs.org/en) installed on your system. Then go to the `iptv` folder using [Console](https://en.wikipedia.org/wiki/Windows_Console) (or [Terminal](<https://en.wikipedia.org/wiki/Terminal_(macOS)>) if you have macOS) and run the command:

```sh
npm run playlist:test path/to/playlist.m3u
```

This command will run an automatic check of all links in the playlist and display their status:

```sh
npm run playlist:test streams/fr.m3u

streams/fr.m3u
┌─────┬───────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────┬────────────────┬───────────────────────────┐
│     │ tvg-id                    │ url                                                                                                  │ label          │ status                    │
├─────┼───────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┼────────────────┼───────────────────────────┤
│  0  │ 6ter.fr                   │ https://origin-caf900c010ea8046.live.6cloud.fr/out/v1/29c7a579af3348b48230f76cd75699a5/dash_short... │                │ LOADING...                │
│  1  │ 20MinutesTV.fr            │ https://lives.digiteka.com/stream/86d3e867-a272-496b-8412-f59aa0104771/index.m3u8                    │                │ FFMPEG_STREAMS_NOT_FOUND  │
│  2  │                           │ https://video1.getstreamhosting.com:1936/8420/8420/playlist.m3u8                                     │                │ OK                        │
│  3  │ ADNTVPlus.fr              │ https://samsunguk-adn-samsung-fre-qfrlc.amagi.tv/playlist/samsunguk-adn-samsung-fre/playlist.m3u8    │ Geo-blocked    │ HTTP_FORBIDDEN            │
│  4  │ Africa24.fr               │ https://edge12.vedge.infomaniak.com/livecast/ik:africa24/manifest.m3u8                               │                │ OK                        │
│  5  │ Africa24English.fr        │ https://edge17.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8                          │                │ OK                        │
│  6  │ AfricanewsEnglish.fr      │ https://37c774660687468c821a51190046facf.mediatailor.us-east-1.amazonaws.com/v1/master/04fd913bb2... │                │ HTTP_GATEWAY_TIMEOUT      │
│  7  │ AlpedHuezTV.fr            │ https://edge.vedge.infomaniak.com/livecast/ik:adhtv/chunklist.m3u8                                   │ Not 24/7       │ HTTP_NOT_FOUND            │
```

Also, if you add the `--fix` option to the command, the script will automatically remove all broken streams it finds from your local copy of playlists:

```sh
npm run playlist:test streams/fr.m3u --- --fix
```

After that, all you need to do is report the broken streams you found via the [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams:remove&projects=&template=3_streams_report.yml&title=Broken%3A+) or create a [pull request](https://github.com/iptv-org/iptv/pulls) with updated playlists.

### How to remove my channel from playlist?

To request removal of a link to a channel from the repository, you need to fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=removal+request&projects=&template=6_copyright-claim.yml&title=Remove%3A+) and wait for the request to be reviewed (this usually takes no more than 1 business day). And if the request is approved, links to the channel will be immediately removed from the repository.

The channel will also be added to our [blocklist](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) to avoid its appearance in our playlists in the future.

Please note that we only accept removal requests from channel owners and their official representatives, all other requests will be closed immediately.

## Stream Description Scheme

For a stream to be approved, its description must follow this template:

```
#EXTINF:-1 tvg-id="STREAM_ID",STREAM_TITLE (QUALITY) [LABEL]
STREAM_URL
```

| Attribute      | Description                                                                                                                                                                | Required | Valid values                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| `STREAM_ID`    | Stream ID consisting of channel ID and feed ID. Full list of supported channels with corresponding ID could be found on [iptv-org.github.io](https://iptv-org.github.io/). | Optional | `<channel_id>` or `<channel_id>@<feed_id>`   |
| `STREAM_TITLE` | Stream title consisting of channel name and feed name. May contain any characters except: `,`, `[`, `]`.                                                                   | Required | -                                            |
| `QUALITY`      | Maximum stream quality.                                                                                                                                                    | Optional | `2160p`, `1080p`, `720p`, `480p`, `360p` etc |
| `LABEL`        | Specified in cases where the broadcast for some reason may not be available to some users.                                                                                 | Optional | `Geo-blocked` or `Not 24/7`                  |
| `STREAM_URL`   | Stream URL.                                                                                                                                                                | Required | -                                            |

Example:

```xml
#EXTINF:-1 tvg-id="ExampleTV.us@East",Example TV East (720p) [Not 24/7]
https://example.com/playlist.m3u8
```

Also, if necessary, you can specify custom [HTTP User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) and [HTTP Referrer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer) through `#EXTVLCOPT` directive:

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
  - `config.json`: config for the `markdown-include` package, which is used to compile everything into one `PLAYLISTS.md` file.
  - `preview.png`: image displayed in the `README.md`.
  - `template.md`: template for `PLAYLISTS.md`.
- `scripts/`: contains all scripts used in the repository.
- `streams/`: contains all streams broken down by the country from which they are broadcast.
- `tests/`: contains tests to check the scripts.
- `CONTRIBUTING.md`: file you are currently reading.
- `PLAYLISTS.md`: auto-updated list of available playlists.
- `README.md`: project description.

## Scripts

These scripts are created to automate routine processes in the repository and make it a bit easier to maintain.

For scripts to work, you must have [Node.js](https://nodejs.org/en) installed on your computer.

To run scripts use the `npm run <script-name>` command.

- `act:check`: allows to run the [check](https://github.com/iptv-org/iptv/blob/master/.github/workflows/check.yml) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).
- `act:format`: allows to test the [format](https://github.com/iptv-org/iptv/blob/master/.github/workflows/update.yml) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).
- `act:update`: allows to test the [update](https://github.com/iptv-org/iptv/blob/master/.github/workflows/update.yml) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).
- `api:load`: downloads the latest channel and stream data from the [iptv-org/api](https://github.com/iptv-org/api).
- `playlist:format`: formats internal playlists. The process includes [URL normalization](https://en.wikipedia.org/wiki/URI_normalization), duplicate removal, removing invalid id's and sorting links by channel name, quality, and label.
- `playlist:update`: triggers an update of internal playlists. The process involves processing approved requests from issues.
- `playlist:generate`: generates all public playlists.
- `playlist:validate`: сhecks ids and links in internal playlists for errors.
- `playlist:lint`: сhecks internal playlists for syntax errors.
- `playlist:test`: tests links in internal playlists.
- `playlist:edit`: utility for quick streams mapping.
- `playlist:export`: creates a JSON file with all streams for the [iptv-org/api](https://github.com/iptv-org/api) repository.
- `readme:update`: updates the list of playlists in [README.md](README.md).
- `report:create`: creates a report on current issues.
- `lint`: сhecks the scripts for syntax errors.
- `test`: runs a test of all the scripts described above.

## Workflows

To automate the run of the scripts described above, we use the [GitHub Actions workflows](https://docs.github.com/en/actions/using-workflows).

Each workflow includes its own set of scripts that can be run either manually or in response to an event.

- `check`: sequentially runs the `api:load`, `playlist:check` and `playlist:validate` scripts when a new pull request appears, and blocks the merge if it detects an error in it.
- `format`: sequentially runs `api:load`, `playlist:format`, `playlist:lint` and `playlist:validate` scripts.
- `update`: every day at 0:00 UTC sequentially runs `api:load`, `playlist:update`, `playlist:lint`, `playlist:validate`, `playlist:generate`, `playlist:export` and `readme:update` scripts and deploys the output files if successful.
