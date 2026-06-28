# Scripts

The repository contains a few scripts created to automate routine processes and make it a bit easier to maintain.

For the scripts to work, you must have [Node.js](https://nodejs.org/en) installed on your computer.

- [act:check](#actcheck)
- [act:format](#actformat)
- [act:update](#actupdate)
- [api:load](#apiload)
- [playlist:format](#playlistformat)
- [playlist:update](#playlistupdate)
- [playlist:generate](#playlistgenerate)
- [playlist:validate](#playlistvalidate)
- [playlist:lint](#playlistlint)
- [playlist:test](#playlisttest)
- [playlist:edit](#playlistedit)
- [playlist:export](#playlistexport)
- [readme:update](#readmeupdate)
- [report:create](#reportcreate)
- [lint](#lint)
- [test](#test)

## act:check

Runs the [check](./workflows.md#check) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).

```sh
npm run act:check
```

## act:format

Runs the [format](./workflows.md#format) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).

```sh
npm run act:format
```

## act:update

Runs the [update](./workflows.md#update) workflow locally. Depends on [nektos/gh-act](https://github.com/nektos/gh-act).

```sh
npm run act:update
```

## api:load

Downloads the latest channel and stream data from the [iptv-org/api](https://github.com/iptv-org/api) repository.

```sh
npm run api:load
```

## playlist:format

Formats internal playlists. The process includes [URL normalization](https://en.wikipedia.org/wiki/URI_normalization), duplicate removal, removing invalid IDs, and sorting links by channel name, quality, and label.

```sh
# format all playlists in the streams/ directory
npm run playlist:format

# format a specific playlist
npm run playlist:format path/to/playlist.m3u
```

## playlist:update

Triggers an update of internal playlists. The process involves processing approved requests from issues.

```sh
npm run playlist:update
```

## playlist:generate

Generates all public playlists.

```sh
npm run playlist:generate
```

## playlist:validate

Checks IDs and links in internal playlists for errors.

```sh
# check all playlists in the streams/ directory
npm run playlist:validate

# check a specific playlist
npm run playlist:validate path/to/playlist.m3u
```

## playlist:lint

Checks internal playlists for syntax errors.

```sh
# check all playlists in the streams/ directory
npm run playlist:lint

# check a specific playlist
npm run playlist:lint path/to/playlist.m3u
```

## playlist:test

Tests links in internal playlists.

```sh
# check all playlists in the streams/ directory
npm run playlist:test

# check a specific playlist
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

Also, if you add the `--fix` option to the command, the script will automatically remove all broken streams it finds from your local copy of the playlists:

```sh
npm run playlist:test streams/fr.m3u -- --fix
```

## playlist:edit

A utility for quick streams mapping.

```sh
npm run playlist:edit path/to/playlist.m3u
```

## playlist:export

Creates a JSON file with all streams for the [iptv-org/api](https://github.com/iptv-org/api) repository.

```sh
npm run playlist:export
```

## readme:update

Updates the configuration and list of available streams in [PLAYLISTS.md](PLAYLISTS.md).

```sh
npm run readme:update
```

## report:create

Creates a report on current issues.

```sh
npm run report:create
```

## lint

Checks the utility scripts themselves for syntax errors.

```sh
npm run lint
```

## test

Runs a test of all the scripts described above.

```sh
npm test
```
