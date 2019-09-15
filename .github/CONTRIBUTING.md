# Contributing Guide

If you want to help the project you can do this in several ways. Here are some options:

- [Add channel](#add-channel)
- [Sort channels by category](#sort-channels-by-category)
- [Sort channels by country](#sort-channels-by-country)
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
#EXTINF:-1 tvg-id="exampletv.us" tvg-name="Example TV" tvg-logo="http://example.com/channel-logo.png" group-title="News",Example TV
http://example.com/stream.m3u8
```

More details about each attribute:

| Attribute   | Description
| ----------- | ---
| tvg-id      | Channel ID that is used to load EPG (optional)
| tvg-name    | Channel name that is also sometimes used to load EPG (optional)
| tvg-logo    | The logo of the channel that will be displayed in the player if it supports it (optional)
| group-title | The category to which the channel belongs. These categories are also displayed in some players, and grouped playlists are also generated based on them. The list of currently supported categories can be found below (optional)


## Sort channels by category

To help sort channels by category, you need to add the corresponding category in the description of the channel, like this:

```xml
#EXTINF:-1 group-title="News",CNN
http://example.com/cnn.m3u8
```

For convenience, `https://raw.githubusercontent.com/freearhey/iptv/master/categories/other.m3u`  contains all the channels for which a category has not yet been specified. But be careful, changes can only be made in the playlists located in the `channels/` folder, since the other playlists are automatically generated.

A complete list of supported categories can be found [here](https://github.com/freearhey/iptv#playlists-by-category).

## Sort channels by country

You can help sorting channels by country by moving the link to the channel with the entire description from one playlist in the `channels/` folder to another. Be careful, any changes outside the `channels/` folder will not be accepted, since the rest of the playlists are generated automatically.

It should also be noted that the channels are not sorted by country of stream source, but by the country in which they are broadcast. If the same channel is broadcast in several countries at once, you can move it to the `channels/int.m3u`.

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
