# Contributing Guide

If you want to help the project you can do this in several ways. Here are some options:

- [Add channel](#add-channel)
- [Sort channels by category](#sort-channels-by-category)
- [Sort channels by language](#sort-channels-by-language)
- [Sort channels by country](#sort-channels-by-country)
- [Remove broken broadcasts](#remove-broken-broadcasts)
- [Add EPG source](#add-epg-source)

## Add channel

To add a channel to one of the playlists, you first need to make sure that the channel broadcast is working stably. Otherwise, we just have to delete the channel you just added. 

To do this, start the broadcast in one of the players (preferably a VLC player) and keep it on for at least a minute. The fact is that some broadcasts are configured to automatically turn off after 10-15 seconds or sometimes after a couple of minutes. 

You should also make sure that this is a live broadcast and not a looped video (this also happens). The easiest way is to start the broadcast several times in a row after a short period of time and compare the beginning. 

If everything is fine, then you can proceed to add the channel to the playlist. 

If you know exactly in which country this channel is broadcast, then simply select the appropriate playlist from the `channels/` folder and add the channel to it.

If you are not sure which playlist to add this channel to, you can add it to the `channels/unsorted.m3u` file. It was created specifically for such cases.

Further on the format of links in the playlist. For the broadcast to work in the playlist, you need to add at least minimal information about the channel, like so:

```xml
#EXTINF:-1,Example TV
http://example.com/stream.m3u8
```

But of course, the more channel information you add, the better. Here's an example of what a full version of a link in a playlist might look like:

```xml
#EXTINF:-1 tvg-id="exampletv.us" tvg-name="Example TV" tvg-language="English" tvg-logo="http://example.com/channel-logo.png" group-title="News",Example TV
http://example.com/stream.m3u8
```

More details about each attribute:

| Attribute    | Description
| ------------ | ---
| tvg-id       | Channel ID that is used to load EPG. Must match `id` from the EPG file. (optional)
| tvg-name     | Channel name that is also sometimes used to load EPG. Must match `display-name` from the EPG file. (optional)
| tvg-language | Channel language. If the channel is broadcast in several languages, you can specify other languages via semicolon, like so: `tvg-language="English;Chinese"`. The name of the language must conform to the standard [ISO 639-3](https://iso639-3.sil.org/code_tables/639/data?title=&field_iso639_cd_st_mmbrshp_639_1_tid=94671&name_3=&field_iso639_element_scope_tid=All&field_iso639_language_type_tid=51&items_per_page=500). (optional)
| tvg-logo     | The logo of the channel that will be displayed in the player if it supports it (optional)
| group-title  | The category to which the channel belongs. These categories are also displayed in some players, and grouped playlists are also generated based on them. The list of currently supported categories can be found [here](https://github.com/iptv-org/iptv#playlists-by-category) (optional)

Also, if necessary, you can specify custom HTTP User-Agent or Referrer via `#EXTVLCOPT` tag:

```xml
#EXTINF:-1 tvg-id="exampletv.us" tvg-name="Example TV" tvg-language="English" tvg-logo="http://example.com/channel-logo.png" group-title="News",Example TV
#EXTVLCOPT:http-referrer=http://example.com/
#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)
http://example.com/stream.m3u8
```

## Sort channels by category

To help sort channels by category, you need to add the corresponding category in the description of the channel, like this:

```xml
#EXTINF:-1 group-title="News",CNN
http://example.com/cnn.m3u8
```

For convenience, `https://iptv-org.github.io/iptv/categories/other.m3u` contains all the channels for which a category has not yet been specified. But be careful, changes can only be made in the playlists located in the `channels/` folder, since the other playlists are automatically generated.

A complete list of supported categories can be found [here](https://github.com/iptv-org/iptv#playlists-by-category).

## Sort channels by language

To sort the channel by language, you only need to specify the appropriate language in `tvg-language` attribute in the channel description. For example:

```xml
#EXTINF:-1 tvg-language="Arabic",Abu Dhabi Drama
http://example.com/ad-drama.m3u8
```

And at the next update the channel will automatically get to the necessary playlist, in this case it is `languages/ara.m3u`.

Importantly, the name of the language must comply with [ISO 639-3](https://iso639-3.sil.org/code_tables/639/data?title=&field_iso639_cd_st_mmbrshp_639_1_tid=94671&name_3=&field_iso639_element_scope_tid=All&field_iso639_language_type_tid=51&items_per_page=500) standart otherwise it will simply be ignored during the playlist update.

If a channel is broadcast in several languages at once, you can specify them all through a semicolon, like this:

```xml
#EXTINF:-1 tvg-language="English;Chinese",CCTV
http://example.com/cctv.m3u8
```

In case you do not know exactly which language the given channel is broadcast in, you can leave the field `tvg-language` empty. In this case, the channel will be automatically saved in `languages/undefined.m3u` file and someone from the community will be able to specify the correct language later.

## Sort channels by country

You can help sorting channels by country by moving the link to the channel with the entire description from one playlist in the `channels/` folder to another. Be careful, any changes outside the `channels/` folder will not be accepted, since the rest of the playlists are generated automatically.

To determine which country the channel belongs to you can search for it on the [LyngSat](https://www.lyngsat.com/search.html). This site contains a short description for most satellite TV channels, but in this case we are only interested in the country name written under the channel logo, as here: https://www.lyngsat.com/radiochannels/us/CNN-USA.html

Also you can try searching for a channel on [Wikipedia](https://www.wikipedia.org/). Usually channels have a separate raw in the description indicating the country. You can see what it looks like on this page - https://en.wikipedia.org/wiki/CNN

It also happens that a channel belongs to more than one country. In this case, it should be saved to all relevant playlists.

However, there are situations when the channel is literally not assigned to any country (for example, DJing or Red Bull TV). In this case, you can simply move the link to a special international playlist - `channels/int.m3u`.

## Remove broken broadcasts

To make sure that the broadcast works you need to run it in two main applications: VLC player (https://www.videolan.org/) and Kodi (https://kodi.tv/). After starting, do not forget to wait at least a minute, as some broadcasts are started with a delay due to the location of the source.

If it turns out that the broadcast still does not start, this means that it can be safely deleted from the playlist. At the same time, you should delete not only the link to the channel but also the description for it. 

It would also be nice if you indicated in the description of the PR the reason for the removal of the channel, so that other members of the community could also double-check the channel for their part.

It is also possible to automatically find broken broadcasts. To do this, you first need to install [Node.js](https://nodejs.org/en/) and [ffmpeg](https://www.ffmpeg.org) on your computer.

After that copy this repository to your computer, open it in the console and install all the dependencies from it by running this command:

```sh
npm install
```

And as soon as everything is installed, you can run tests, like this:

```sh
npm test
```

And be prepared test may take a long time. 

If you want to test the playlist of a particular country, you can specify the [ISO 3166 code](https://en.wikipedia.org/wiki/ISO_3166) of the country as an argument when running the test.

```sh
npm test --country=uk
```

Another option to exclude specific playlists from tests:

```sh
npm test --exclude=cn,int
```

After the test is over all broken links will be saved to the file `error.log`.

## Add EPG source

To add a new source of EPG (Electronic Program Guide), you must add the `x-tvg-url` attribute to the beginning of the corresponding playlist, like this:

```xml
#EXTM3U x-tvg-url="http://example.com/epg.xml.gz"
```

The next step is to copy the corresponding `tvg-id` and `tvg-name` from EPG into the description of the channels. To do this, we need to open the EPG file in a browser or any text editor, find the list of channels. Usually it looks like this:

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

Copy `id` and `display-name` from it and paste it to the channel description, like this:

```xml
#EXTINF:-1 tvg-id="cnn" tvg-name="CNN",CNN
http://example.com/cnn.m3u8
```

And if you did everything right, then by opening a playlist in a player that supports EPG, you should see the program guide for all updated channels. In some cases, it may also be necessary to manually specify the source of EPG in the player itself.
