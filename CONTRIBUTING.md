# Contributing Guide

- [Introduction](#introduction)
- [Requirements](#requirements)
- [Validation](#validation)
  - [How do I know if the stream is eligible?](#how-do-i-know-if-the-stream-is-eligible)
  - [Examples](#examples)
  - [Testing](#testing)
- [Contribution](#contribution)
  - [Submitting a new stream](#how-to-submit-a-new-stream)
  - [Fixing descriptions](#how-to-fix-the-stream-description)
  - [Reporting of broken streams](#how-to-report-a-broken-stream)
  - [Finding of broken streams](#how-to-find-a-broken-stream)
  - [Removing infrighting content](#how-to-remove-my-channel-from-playlist)
- [Stream Description Scheme](#stream-description-scheme)
- [Playlist Structure](#playlist-structure)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Workflows](#workflows)

## Introduction

IPTV-ORG is more than just a repository for sharing currently available links in a playlist format. After years of commitment and moderation practices it has evolved into knowledge base for [streams](https://github.com/iptv-org/iptv/tree/master/streams), [feeds and it's descriptions](https://iptv-org.github.io/), [program guide sources](https://github.com/iptv-org/epg) and even the [API](https://github.com/iptv-org/api) updated daily for semi-automated distribution and moderation. Thus, to keep all available data in order strict structural requirements must be held and some contribution standards must be set.

## Requirements

Before submitting new streams you should verify the following:

- Make sure the link has not been submitted into the repository before. This can be done by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- Each submitted link must have a registered ID that is properly assigned for the provided feed. You can check available IDs in [IPTV-ORG Database](https://iptv-org.github.io). If it's not present yet please follow the [Database Contributing Guide](https://github.com/iptv-org/database/blob/master/CONTRIBUTING.md). Otherwise your stream links won't be delivered into automated playlists and won't be sorted out properly.
- User-submitted links to stream URLs shall be intended to be publicly available by it's host and the copyright holders.

🤚 A request without a valid stream ID or working link to the stream will be closed immediately.
- Channels falling under DMCA strikes or broadcasting copyright content (such as the Champions League) at any time will not be accepted, see the [Channel blocklist](https://iptv-org.github.io/?q=is_blocked%3Atrue) and the [History of related issues](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) for details.
- The same treatment goes for channels that are known to partially or fully broadcast NSFW content (nudity & extreme acts), see the [Channel blocklist](https://iptv-org.github.io/?q=is_nsfw%3Atrue), the [History of related issues](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) and https://github.com/iptv-org/iptv/issues/15723 for more details.
- User-submitted links must not have any effective restrictions that limit viewers by authorization, by viewer count or by designated IP.
- Test period links are not permitted.
- User-submitted links must open in VLC media player (see the [FAQ](https://github.com/iptv-org/iptv/blob/master/FAQ.md) for more details).
- If the host server requires a specific user-agent and/or a referer, is geo-blocked or may have downtimes, you should represent that in your contribution (see the [Stream Description Scheme](#stream-description-scheme)).
- If possible please provide an adaptive link that covers every available resolution for a broadcast.
- Follow the [Playlist Structure](#playlist-structure) in case of contributing by pull requests.

## Validation
### How do I know if the stream is eligible?

Make sure you can find the origin of the broadcast using your favourite search engine or by following the domain of broadcast. If you used to see the channel under paywalls or subscription offers, it may likely be a copyright infringement. If you see a service with a probe period and available plans or you have found an unrecognizable link in someone else's playlist, it's likely to expire soon. Streams or services that have publicly available videoplayers are likely to perform publicly-intended broadcasts. Odds are your link will still be session protected and will only be available to you.

### Examples

✅ Valid links usually have a format like so

- ```https://cdn.domain.com/channelname/chunks or playlist or any other name.m3u8 or mpd```
- ```https://cdn.domain.com.com/live?stream=channelname```
- ```http://10.113.179.1:port/udp/238.1.1.1:port```
- ```rtmp://10.113.179.1:port/prefix/channel```
- ```http://10.113.179.1:port/play/a16j```

❌ Links with expiring sessions may contain one or more arguments that will have a hash or random numeric value like so: 
- ```?nimblesessionid=21683442```
- ```&authid=```
- ```&key=txiptv```
- ```&ip=10.113.179.1```
- ```&secret=f8z1l7gk```
- ```&e=1783194414```
- ```&st=Lz1QtjfblUmkawUbk1Mx6w```

There might be notable examples when a session must be created but it doesn't impose any meaningful limits, eg. :

```https://bl.rutube.ru/livestream/id/index.m3u8?e=2070278263&s=sessiontoken&scheme=https```

where there only limitation is that the session will expire in 2035. You can check unix timestamps [here](https://www.epochconverter.com/).


❌ Links from subscription based services often be in a form like so:
- ```https://sketchydomain.xyz:port/username/password/channelID```
- ```http://cdn.domain.com/credentialhash/channelID/index.m3u8```
- ```http://cdn.domain.com/channelID/mpegts?token=CTkHfXdAqvPcwq```

If you can change ```channelID``` numeric value within range of hundreds or thousands channels and still have a stream then it comes from leaked account or trial period account.

### Testing

- Open [VLC media player](https://www.videolan.org/vlc/index.html) and make use of your link.
- If it doesn't launch, open your browser and press F12, go to the Network tab and filter the search for m3u or mpd.<img width="338" height="256" alt="image" src="https://github.com/user-attachments/assets/245bdb7a-534d-4bde-af38-3a81a766347e" />


Switch to Headers tab and scroll down to copy the user-agent and the referer if needed (see the [Stream Description Scheme](#stream-description-scheme)).
<img width="880" height="567" alt="image" src="https://github.com/user-attachments/assets/d9ea4ba0-82b1-4217-b851-bcfef94a1f38" />

- Watch the broadcast for at least a few minutes. Make sure playback is stable and not abrupting at some point.
- Attempt to relaunch a stream. Make sure it's not looping on a repeating segment.
- Attempt to launch a stream simultaneously on a different network (for example on mobile network or make use of proxy or VPN).
- Alternatively, you can use https://streamtest.in/tools/stream-test.
- To check if the stream link is geo-blocked you can use https://check-host.net/check-http and make sure the link provided is not returning errors globally.

## Contribution
### How to submit a new stream?
You have several options:

- Create a new request using this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams:add&projects=&template=1_streams_add.yml&title=Add%3A+) and if approved, the link will automatically be added to the playlist on the next update.
- Add the link to the playlist directly using a [pull request](https://github.com/iptv-org/iptv/pulls).
Follow the [Playlist Structure](#playlist-structure) if you have considered that way.
If you're adding an alternative link please do not replace any other link that might be working for some.

### How to fix the stream description?

Most of the stream description (channel name, feed name, categories, languages, broadcast area, logo) is loaded from [iptv-org/database](https://github.com/iptv-org/database) using the stream ID.

First of all, make sure that the desired stream has the correct ID. A full list of all supported channels and their corresponding IDs can be found on [iptv-org.github.io](https://iptv-org.github.io/). To change the stream ID of any link in the playlist, just fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams%3Aedit&projects=&template=2_streams_edit.yml&title=Edit%3A+).

If, however, you have found an error in the database itself, please refer to: [How to edit channel description?](https://github.com/iptv-org/database/blob/master/CONTRIBUTING.md#how-to-edit-channel-description)

### How to report a broken stream?

Fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams:remove&projects=&template=3_streams_report.yml&title=Broken%3A+) and as soon as a working replacement appears, we will add it to the playlist or at least remove the non-working one.

The only thing before publishing your report is to make sure that:

- The link is still in our playlists. You can verify this by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- The link really doesn't work and is not just [geo-blocked](https://en.wikipedia.org/wiki/Geo-blocking). To check this, you can either use a [VPN](https://en.wikipedia.org/wiki/Virtual_private_network) or services such as [streamtest.in](https://streamtest.in/).

An issue without a valid link will be closed immediately.

### How to find a broken stream?

Follow the [Testing](#testing) guide. [VLC media player](https://www.videolan.org/vlc/) outputs all errors to the log (Tools -> Messages) so you'll be able to determine pretty accurately why a link isn't working.

Another way to test links is to use the NPM script. To do this, first make sure you have [Node.js](https://nodejs.org/en) installed on your system. Clone this repository, then go to the `iptv` folder using [Console](https://en.wikipedia.org/wiki/Windows_Console) (or [Terminal](<https://en.wikipedia.org/wiki/Terminal_(macOS)>) if you have macOS) and run the command:

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
| `STREAM_URL`   | Stream URL. The following protocols are supported: `HTTPS`, `HTTP`, `MMS`, `MMSH`, `RTSP`, `RTMP`, `SRT`, `RTP`, `UDP`.                                                    | Required | -                                            |

Example:

```xml
#EXTINF:-1 tvg-id="ExampleTV.us@East",Example TV East (720p) [Geo-blocked] [Not 24/7]
https://example.com/playlist.m3u8
```

Also, if necessary, you can specify custom [HTTP User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) and [HTTP Referrer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer) through `#EXTVLCOPT` directive:

```xml
#EXTINF:-1 tvg-id="ExampleTV.us",Example TV
#EXTVLCOPT:http-referrer=http://example.com/
#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)
http://example.com/stream.m3u8
```

## Playlist Structure
There are two types of playlists that can be found in the [streams/](https://github.com/iptv-org/iptv/tree/master/streams) directory:
- Playlists by country of origin — indicate that the studio broadcasting the channel is headquartered in a particular country. This does not necessarily mean that the stream is intended for viewers in that same country.
- Playlists by source - imply that all the containing streams comes from the same server or infrastructure and broadcast on behalf of the same provider.
Please consider that both playlists are not meant to be used by viewers and intended to stay that way for the ease of maintanance.
All links in playlists are sorted automatically according to the information used from our [Database](https://iptv-org.github.io/) so there is no need to sort them manually. For more info, see [Scripts](#scripts).

Each playlist file must
- Have an .m3u extension
- Start with a ```#EXTM3U``` header
- Strictly follow the [Stream Description Scheme](#stream-description-scheme) and pass linter checks from [check workflow](https://github.com/iptv-org/iptv/blob/master/.github/workflows/check.yml)
- Use CRLF file endings and use UTF-8 encoding without BOM

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
- `streams/`: contains all streams broken down by country from which they are broadcasted.
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
- `playlist:format`: formats internal playlists. The process includes [URL normalization](https://en.wikipedia.org/wiki/URI_normalization), duplicate removal, removing invalid ids and sorting links by channel name, quality, and label.
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
