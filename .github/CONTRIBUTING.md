# Contributing Guide

**Do you have an idea how to improve the project?**

Create an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=discussion&template=feature-request.md&title=Propose%3A+xxx) with a detailed description of your idea.

**Do you want to report a broadcast that is not working?**

Create an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=broken+stream&template=broken-stream.md&title=Fix%3A+xxx) with a description of the channel (**IMPORTANT:** an issue should contain a report for only one channel, otherwise it will be closed immediately).

**Do you want to replace the broken stream link?**

- make sure that the link you want to add works. It is recommended to use [VLC media player](https://www.videolan.org/vlc/index.html) for this.
- check if the channel is working outside your country. You can use services like [streamtest.in](https://streamtest.in/) to do this.
- find the file that contains the original link. You can use a [GitHub Search](https://github.com/search/advanced?q=CNN+repo%3Aiptv-org%2Fiptv+path%3A%2Fchannels&type=Code) to do this (**IMPORTANT:** the file must be in the `channels/` folder).
- replace the link
- commit all changes
- send a pull request

**Do you want to report a channel that is not on the playlist?**

Create an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=channel+request&template=channel-request.md&title=Add%3A+xxx) with a description of the channel (**IMPORTANT:** an issue should contain a request for only one channel, otherwise it will be closed immediately).

**Would you like to add a new channel to playlist?**

- make sure that the link you want to add works. It is recommended to use [VLC media player](https://www.videolan.org/vlc/index.html) for this
- check if the channel is working outside your country. You can use services like [streamtest.in](https://streamtest.in/) to do this
- find out the full name of the channel and from which country it is broadcasting. This information can usually be found on [lyngsat.com](https://www.lyngsat.com/search.html) or [wikipedia.org](https://www.wikipedia.org/)
- find the corresponding country code in [ISO_3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) table
- open the `channels/` folder and find a file with the same name as the country code
- at the very end of this file add a link to the channel with a description
- commit all changes
- send a pull request

In case you were unable to determine which country the channel belongs to, you can put a link to it in the `channels/unsorted.m3u`.

**Do you want to sort the channels from "channels/unsorted.m3u"?**

- find out the full name of the channel and from which country it is broadcasting. This information can usually be found on [lyngsat.com](https://www.lyngsat.com/search.html) or [wikipedia.org](https://www.wikipedia.org/)
- update the channel name if necessary
- find the corresponding country code in [ISO_3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) table
- open the `channels/` folder and find a file with the same name as the country code
- at the very end of this file add a link to the channel with a description
- commit all changes
- send a pull request

**Did you find a mistake in README.md?**

- open `.readme/template.md`
- make any necessary changes to the file
- commit all changes
- send a pull request

**Did you find a mistake in this guide?**

- open `.github/CONTRIBUTING.md`
- make any necessary changes to the file
- commit all changes
- send a pull request

**Would you like us to remove the link to the channel you own the rights to?**

- publish somethere DMCA notice
- create an issue using this [link](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=DMCA&template=remove-channel.md&title=Remove%3A+xxx) and add a link to the DMCA notice in it

## Project Structure

- `.github/`
  - `ISSUE_TEMPLATE/`
    - `broken-stream.md`: issue template for reporting a broken stream.
    - `channel-request.md`: template for channel request.
    - `feature-request.md`: template for feature request.
    - `remove-channel.md`: template for channel deletion request.
  - `workflows/`
    - `automerge.yml`: contain action that automatically merges all the changes created by other workflows.
    - `format.yml`: contain actions that automatically sorts channels and removes duplicates from each playlist.
    - `update.yml`: contain actions that automatically generates all additional playlists and updates the `README.md` file.
  - `CODE_OF_CONDUCT.md`: rules you shouldn't break if you don't want to get banned.
  - `CONTRIBUTING.md`: file you are currently reading.
- `.readme/`
  - `_categories.md`: automatically generated list of all categories and their corresponding playlists.
  - `_countries.md`: automatically generated list of all countries and their corresponding playlists.
  - `_languages.md`: automatically generated list of all languages and their corresponding playlists.
  - `config.json`: config for the `markdown-include` package, which is used to compile everything into one `README.md` file.
  - `preview.png`: image displayed in the `README.md`.
  - `template.md`: template for `README.md`.
- `channels/`
  - `ad.m3u`: country specific playlist.
  - ...
  - `int.m3u`: playlist for channels not belonging to any one particular country. These are usually channels that broadcast exclusively on the internet.
  - ...
  - `unsorted.m3u`: playlist with channels not yet sorted.
- `scripts/`
  - `format.js`: used within GitHub Action to sort channels and remove duplicates from each playlist.
  - `generate.js`: used within GitHub Action to generate all additional playlists.
  - `helper.js`: contains functions that are used in other scripts.
  - `test.js`: allows you to automatically test all channels in a playlist.
  - `update-readme.js`: used within GitHub Action to update the `README.md` file.
- `index.m3u`: main playlist that contains links to all playlists in the `channels/` folder.
- `README.md`: project description generated from the contents of the `.readme/` folder.

## Channel Description Scheme

```
#EXTINF:-1 tvg-id="EPG_ID" tvg-name="EPG_NAME" tvg-language="PRIMARY_LANGUAGE;SECONDARY_LANGUAGE" tvg-logo="LOGO_URL" group-title="CATEGORY",FULL_NAME TIME_SHIFT (ALTERNATIVE_NAME) (STREAM_RESOLUTION) [STREAM_STATUS]
STREAM_URL
```

| Attribute            | Description                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EPG_ID`             | Channel ID that is used to load EPG. Must match `id` from the EPG file specified in the playlist header. (optional)                                                                                                                                                                              |
| `EPG_NAME`           | Channel name that is also sometimes used to load EPG. Must match `<display-name>` from the EPG file specified in the playlist header. (optional)                                                                                                                                                 |
| `PRIMARY_LANGUAGE`   | Channel language. The name of the language must conform to the standard [ISO 639-3](https://iso639-3.sil.org/code_tables/639/data?title=&field_iso639_cd_st_mmbrshp_639_1_tid=94671&name_3=&field_iso639_element_scope_tid=All&field_iso639_language_type_tid=51&items_per_page=500). (optional) |
| `SECONDARY_LANGUAGE` | If the channel is broadcast in several languages. (optional)                                                                                                                                                                                                                                     |
| `LOGO_URL`           | The logo of the channel that will be displayed if the player supports it. (optional)                                                                                                                                                                                                             |
| `CATEGORY`           | The category to which the channel belongs. The list of currently supported categories can be found [here](https://github.com/iptv-org/iptv#playlists-by-category). (optional)                                                                                                                    |
| `FULL_NAME`          | Full name of the channel. It is recommended to use the name listed on [lyngsat](https://www.lyngsat.com/search.html) or [wikipedia](https://www.wikipedia.org/) if possible. May contain any characters except plus sign, minus sign, round and square brackets.                                 |
| `TIME_SHIFT`         | Must be specified if the channel is broadcast with a shift in time relative to the main stream. Should only contain a number and a sign. (optional)                                                                                                                                              |
| `ALTERNATIVE_NAME`   | Can be used to specify a short name or name in another language. May contain any characters except round and square brackets. (optional)                                                                                                                                                         |
| `RESOLUTION`         | The maximum height of the frame with a "p" at the end. In case of VLC Player this information can be found in `Window > Media Information... > Codec Details`. (optional)                                                                                                                        |
| `STATUS`             | Specified if the broadcast for some reason is interrupted or does not work in a particular application. May contain any characters except round and square brackets. (optional)                                                                                                                  |
| `STREAM_URL`         | Channel broadcast URL.                                                                                                                                                                                                                                                                           |

Example:

```xml
#EXTINF:-1 tvg-id="example.ua" tvg-name="Example TV" tvg-language="Ukrainian;Russian" tvg-logo="https://i.imgur.com/bu12f89.png" group-title="Kids",Example TV +3 (Пример ТВ) (720p) [not 24/7]
https://example.com/playlist.m3u8
```

Also, if necessary, you can specify custom HTTP User-Agent or Referrer via `#EXTVLCOPT` tag:

```xml
#EXTINF:-1 tvg-id="exampletv.us" tvg-name="Example TV" tvg-language="English" tvg-logo="http://example.com/channel-logo.png" group-title="News",Example TV
#EXTVLCOPT:http-referrer=http://example.com/
#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)
http://example.com/stream.m3u8
```
