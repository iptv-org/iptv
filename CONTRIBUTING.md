# Contributing Guide

## Table of Contents

- [Feature Requests](#feature-requests)
- [Request a Channel](#request-a-channel)
- [Report a Broken Stream](#report-a-broken-stream)
- [Add or Replace a Stream](#add-or-replace-a-stream)
- [Add a Category to a Сhannel](#add-a-category-to-a-channel)
- [Add a Country to a Сhannel](#add-a-country-to-a-channel)
- [Add a Language to a Channel](#add-a-language-to-a-channel)
- [Add an EPG (Electronic Program Guide) source](#add-an-epg-electronic-program-guide-source)
- [Setting up a Сhannel to use an EPG](#setting-up-a-channel-to-use-an-epg)
- [Sort сhannels from `channels/unsorted.m3u`](#sort-channels-from-channelsunsortedm3u)
- [Request Channel Removal](#request-channel-removal)
- [Make changes to README.md](#make-changes-to-readmemd)
- [Make changes to this Guide](#make-changes-to-this-guide)
- [Channel Description Scheme](#channel-description-scheme)
- [Supported Region Codes](#supported-region-codes)
- [Project Structure](#project-structure)

## Feature Requests

If you have an idea how to improve the project create an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=discussion&template=----feature-request.md&title=Propose%3A+xxx) with a detailed description of your idea.

## Request a Channel

To request a channel, create an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=channel+request&template=------channel-request.md&title=Add%3A+xxx) and complete all details requested. (**IMPORTANT:** the issue should contain a request for only one channel, otherwise it will be closed immediately). Understand that our community of volunteers will try to help you, but if a public link cannot be found, there is little we can do.

## Report a Broken Stream

To report a broadcast that is not working, create an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=broken+stream&template=----broken-stream.md&title=Fix%3A+xxx) with a description of the channel (**IMPORTANT:** an issue should contain a report for only one channel, otherwise it will be closed immediately).

## Add or Replace a Stream

If you would like to replace a broken stream or add a new one, please do the following:

- make sure that the link you want to add works by using a program like [VLC media player](https://www.videolan.org/vlc/index.html)
- check if the channel is working outside your country by using a VPN or use a service like [streamtest.in](https://streamtest.in/)
- if the broadcast is not available outside of a certain country, add the label `[Geo-blocked]` to the end of the channel name
- find out from which country the channel is being broadcasted. This information can usually be found on [lyngsat.com](https://www.lyngsat.com/search.html) or [wikipedia.org](https://www.wikipedia.org/). If you are unable to determine which country the channel belongs to, add the channel onto the `channels/unsorted.m3u` playlist
- find the corresponding [ISO_3166-2 code](https://en.wikipedia.org/wiki/ISO_3166-2) for the country
- open the `/channels` folder and find the file that has the same code in its name and open it
- if broken, find the broken link in this file and replace it with working one
- if new, at the very end of this file add a link to the channel with a description
- commit all changes and send a pull request

## Add a Category to a channel

- find the file that contains the channel. You can use a [GitHub Search](https://github.com/search/advanced?q=CHANNEL_NAME+repo%3Aiptv-org%2Fiptv+path%3A%2Fchannels&type=Code) to do this
- open the file
- find the channel description
- specify the appropriate category in the `group-title` attribute. A complete list of supported categories can be found [here](https://github.com/iptv-org/iptv#playlists-by-category)
- commit all changes and send a pull request

## Add a Country to a channel

- make sure the channel is broadcast in the country. This information can usually be found in the channel description on Wikipedia
- find the corresponding [ISO_3166-2 code](https://en.wikipedia.org/wiki/ISO_3166-2) for the country
- find the file that contains the channel. You can use a [GitHub Search](https://github.com/search/advanced?q=CHANNEL_NAME+repo%3Aiptv-org%2Fiptv+path%3A%2Fchannels&type=Code) to do this.
- open the file
- find the channel in the list
- paste the country code into `tvg-country` attribute of the channel description
- commit all changes and send a pull request

If a channel is broadcasted in several countries at once, you can specify them all through a semicolon, like this:

```xml
#EXTINF:-1 tvg-country="US;CA",CNN
http://example.com/cnn.m3u8
```

If a channel is broadcast for an entire region, you can use one of the [supported region code](#supported-region-codes) to avoid listing all countries. In this case the channel will be added to the playlists of all countries from that region.

In case the channel is broadcast worldwide you can use the code `INT`:

```xml
#EXTINF:-1 tvg-country="INT",CNN
http://example.com/cnn.m3u8
```

## Add a Language to a Channel

- find the file that contains the channel. You can use a [GitHub Search](https://github.com/search/advanced?q=CHANNEL_NAME+repo%3Aiptv-org%2Fiptv+path%3A%2Fchannels&type=Code) to do this.
- open the file
- find the channel description
- specify the appropriate language in the `tvg-language` attribute. The name of the language must comply with the [ISO 639-3](https://iso639-3.sil.org/code_tables/639/data?title=&field_iso639_cd_st_mmbrshp_639_1_tid=94671&name_3=&field_iso639_element_scope_tid=All&field_iso639_language_type_tid=51&items_per_page=500) standard.
- commit all changes and send a pull request

If a channel is broadcasted in several languages at once, you can specify them all through a semicolon, like this:

```xml
#EXTINF:-1 tvg-language="English;Chinese",CCTV
http://example.com/cctv.m3u8
```

## Add an EPG (Electronic Program Guide) source

- check which country the EPG is intended for
- check that this source is not already listed in the playlist. To do this, find the country in this [table](https://github.com/iptv-org/iptv#playlists-by-country) and see if there is any other link. If not, continue.
- find the corresponding [ISO_3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) country code.
- open the `channels/` folder and find a file with the same name as the country code
- in the header of the playlist, next to `#EXTM3U`, add an `x-tvg-url` attribute with a link to the EPG source

The result should be something like this:

```xml
#EXTM3U x-tvg-url="https://example.com/epg.xml.gz"
```

## Setting up a channel to use an EPG

- find out which country the channel belongs to. This information can usually be found on [lyngsat.com](https://www.lyngsat.com/search.html) or [wikipedia.org](https://www.wikipedia.org/)
- find the corresponding [ISO_3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) country code
- open the `/channels` folder and find the file that has the same code in its name and open it
- check that the EPG source is specified in the file. To do this, just look at the header of the playlist. If the `x-tvg-url` attribute is present and has a link in it, everything is fine
- open the file specified in the `x-tvg-url`
- find the channel list in the file. Usually it looks like this:

  ```xml
  <tv>
    <channel id="cnn">
      <display-name>CNN</display-name>
    </channel>
    <channel id="nbc">
      <display-name>NBC</display-name>
    </channel>
    ...
  </tv>
  ```

- find the channel you are interested in
- copy the `id` and paste it into the `tvg-id` attribute of the channel description
- copy the `<display-name>` tag value and paste it into the `tvg-name` attribute of the channel description. The result should be something like this:

  ```xml
  #EXTINF:-1 tvg-id="cnn" tvg-name="CNN",CNN
  http://example.com/cnn.m3u8
  ```

- commit all changes and send a pull request

If you did everything right, then by opening a playlist in a player that supports EPG, you should see the program guide for all updated channels. In some cases, it may also be necessary to manually specify the EPG source in the player itself. Note: playlists are updated only once per 24 hours.

## Sort channels from `channels/unsorted.m3u`

- find out the full name of the channel and from which country it is being broadcasted. This information can usually be found on [lyngsat.com](https://www.lyngsat.com/search.html) or [wikipedia.org](https://www.wikipedia.org/)
- update the channel name if necessary
- find the corresponding [ISO_3166-2 code](https://en.wikipedia.org/wiki/ISO_3166-2) for the country
- open the `channels/` folder and find a file with the same name as the country code
- at the very end of this file add a link to the channel with a description
- commit all changes and send a pull request

## Request Channel Removal

- publish your DMCA notice somewhere
- create an issue using this [link](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=DMCA&template=--remove-channel.md&title=Remove%3A+xxx) and add a link to the DMCA notice in it

## Make changes to README.md

- open `.readme/template.md`
- make the necessary changes
- commit all changes and send a pull request

## Make changes to this Guide

- open `.github/CONTRIBUTING.md`
- make the necessary changes
- commit all changes and send a pull request

## Channel Description Scheme

Channels should be added to playlists using the following template.

```
#EXTINF:-1 tvg-id="EPG_ID" tvg-name="EPG_NAME" tvg-country="COUNTRY" tvg-language="LANGUAGE" tvg-logo="LOGO_URL" group-title="CATEGORY",FULL_NAME STREAM_TIME_SHIFT (ALTERNATIVE_NAME) (STREAM_RESOLUTION) [STREAM_STATUS]
STREAM_URL
```

| Attribute           | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EPG_ID`            | Channel ID that is used to load EPG. Must match `id` from the EPG file specified in the playlist header. (optional)                                                                                                                                                                                                                                                                           |
| `EPG_NAME`          | Channel name that is also sometimes used to load EPG. Must match `<display-name>` from the EPG file specified in the playlist header. (optional)                                                                                                                                                                                                                                              |
| `COUNTRY`           | The code of the country in which the channel is broadcast. The code of the country must conform to the standard [ISO_3166-2](https://en.wikipedia.org/wiki/ISO_3166-2). If the channel is broadcast in several countries you can list them separated by a semicolon. You can also use one of these [region codes](#supported-region-codes). (optional)                                        |
| `LANGUAGE`          | Channel language. The name of the language must conform to the standard [ISO 639-3](https://iso639-3.sil.org/code_tables/639/data?title=&field_iso639_cd_st_mmbrshp_639_1_tid=94671&name_3=&field_iso639_element_scope_tid=All&field_iso639_language_type_tid=51&items_per_page=500). If the channel is broadcast in several languages you can list them separated by a semicolon. (optional) |
| `LOGO_URL`          | The logo of the channel that will be displayed if the player supports it. Supports files in png, jpeg and gif format. (optional)                                                                                                                                                                                                                                                              |
| `CATEGORY`          | The category to which the channel belongs. The list of currently supported categories can be found [here](https://github.com/iptv-org/iptv#playlists-by-category). (optional)                                                                                                                                                                                                                 |
| `FULL_NAME`         | Full name of the channel. It is recommended to use the name listed on [lyngsat](https://www.lyngsat.com/search.html) or [wikipedia](https://www.wikipedia.org/) if possible. May contain any characters except plus sign, minus sign, round and square brackets.                                                                                                                              |
| `STREAM_TIME_SHIFT` | Must be specified if the channel is broadcast with a shift in time relative to the main stream. Should only contain a number and a sign. (optional)                                                                                                                                                                                                                                           |
| `ALTERNATIVE_NAME`  | Can be used to specify a short name or name in another language. May contain any characters except round and square brackets. (optional)                                                                                                                                                                                                                                                      |
| `STREAM_RESOLUTION` | The maximum height of the frame with a "p" at the end. In case of VLC Player this information can be found in `Window > Media Information... > Codec Details`. (optional)                                                                                                                                                                                                                     |
| `STREAM_STATUS`     | Specified if the broadcast for some reason is interrupted or does not work in a particular application. May contain any characters except round and square brackets. (optional)                                                                                                                                                                                                               |
| `STREAM_URL`        | Channel broadcast URL.                                                                                                                                                                                                                                                                                                                                                                        |

Example:

```xml
#EXTINF:-1 tvg-id="example.ua" tvg-name="Example TV" tvg-country="UA" tvg-language="Ukrainian;Russian" tvg-logo="https://i.imgur.com/bu12f89.png" group-title="Kids",Example TV +3 (Пример ТВ) (720p) [not 24/7]
https://example.com/playlist.m3u8
```

Also, if necessary, you can specify custom HTTP User-Agent or Referrer via the `#EXTVLCOPT` tag:

```xml
#EXTINF:-1 tvg-id="exampletv.us" tvg-name="Example TV" tvg-country="US" tvg-language="English" tvg-logo="http://example.com/channel-logo.png" group-title="News",Example TV
#EXTVLCOPT:http-referrer=http://example.com/
#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)
http://example.com/stream.m3u8
```

## Supported Region Codes

| Code                                                                     | Description                    |
| ------------------------------------------------------------------------ | ------------------------------ |
| [AFR](https://en.wikipedia.org/wiki/Africa)                              | Africa                         |
| [AMER](https://en.wikipedia.org/wiki/Americas)                           | Americas                       |
| [APAC](https://en.wikipedia.org/wiki/Asia-Pacific)                       | Asia-Pacific                   |
| [ARAB](https://en.wikipedia.org/wiki/Arab_world)                         | Arab world                     |
| [ASIA](https://en.wikipedia.org/wiki/Asia)                               | Asia                           |
| [CARIB](https://en.wikipedia.org/wiki/Caribbean)                         | Caribbean                      |
| [EMEA](https://en.wikipedia.org/wiki/Europe,_the_Middle_East_and_Africa) | Europe, Middle East and Africa |
| [EUR](https://en.wikipedia.org/wiki/Europe)                              | Europe                         |
| [LATAM](https://en.wikipedia.org/wiki/Latin_America)                     | Latin America                  |
| [MAGHRIB](https://en.wikipedia.org/wiki/Maghreb)                         | Maghrib                        |
| [MENA](https://en.wikipedia.org/wiki/MENA)                               | Middle East and North Africa   |
| [MIDEAST](https://en.wikipedia.org/wiki/Middle_East)                     | Middle East                    |
| [NORAM](https://en.wikipedia.org/wiki/North_America)                     | North America                  |
| [NORD](https://en.wikipedia.org/wiki/Nordic_countries)                   | Nordics                        |
| [OCE](https://en.wikipedia.org/wiki/Oceania)                             | Oceania                        |
| [SAS](https://en.wikipedia.org/wiki/South_Asia)                          | South Asia                     |
| [SSA](https://en.wikipedia.org/wiki/Sub-Saharan_Africa)                  | Sub-Saharan Africa             |
| [WAFR](https://en.wikipedia.org/wiki/West_Africa)                        | West Africa                    |

## Project Structure

- `.github/`
  - `ISSUE_TEMPLATE/`: issue templates for this repository.
  - `workflows/`
    - `auto-update.yml`: contain actions that automatically updates all playlists every day.
  - `CODE_OF_CONDUCT.md`: rules you shouldn't break if you don't want to get banned.
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
  - `unsorted.m3u`: playlist with channels not yet sorted.
- `scripts/`
  - `blacklist.json`: list of channels banned for addition to the repository.
  - `categories.json`: list of supported categories.
  - `db.js`: contains functions for retrieving and managing the channel list.
  - `format.js`: used within GitHub Action to sort channels and remove duplicates from each playlist.
  - `generate.js`: used within GitHub Action to generate all additional playlists.
  - `parser.js`: contains functions for parsing playlists.
  - `regions.json`: list of supported region codes.
  - `test.js`: script for channel testing.
  - `update-readme.js`: used within GitHub Action to update the `README.md` file.
  - `utils.js`: contains functions that are used in other scripts.
- `CONTRIBUTING.md`: file you are currently reading.
- `index.m3u`: main playlist that contains links to all playlists in the `channels/` folder.
- `README.md`: project description generated from the contents of the `.readme/` folder.
