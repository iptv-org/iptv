# Frequently Asked Questions

Basic:
- [What is IPTV?](#What-is-iptv)
- [I have a cable service and I want those channels to be on this IPTV. Is that possible?](#I-have-a-cable-service-and-i-want-those-channels-to-be-on-this-iptv-is-that-possible)
- [Is it possible to view channels directly from the main website?](#Is-it-possible-to-view-channels-directly-from-the-main-website)
- [Does the playlist have a channel guide?](#Does-the-playlist-have-a-channel-guide)
- [Are you planning to include a VOD of TV shows broadcasted on this playlist?](#Are-you-planning-to-include-a-vod-of-tv-shows-broadcasted-on-this-playlist)
- [Why don't we show NSFW channels in most playlists?](#Why-dont-we-show-nsfw-channels-in-most-playlists)
- [Do I have to pay to use this list?](#Do-i-have-to-pay-to-use-this-list)

Channels:
- [Does the channel need to be FTA to be included in the playlists?](#Does-the-channel-need-to-be-FTA-to-be-included-in-the-playlists)
- [Can I add a FTA channel that broadcasts PPV events or pay programming?](#Can-I-add-a-FTA-channel-that-broadcasts-PPV-events-or-pay-programming)
- [I've created my channel and I want to add it to this playlist. What should I do?](#Ive-created-my-channel-and-i-want-to-add-it-to-this-playlist-what-should-i-do)

Technical:
- [Why am I asked to provide an adaptive playlist like "master.m3u8", "playlist.m3u8" or "index.m3u8"?](#Why-am-i-asked-to-provide-an-adaptive-playlist-like-masterm3u8-playlistm3u8-or-indexm3u8)
- [Why don't we accept XStreamCode in streams?](#Why-dont-we-accept-xstreamcode-in-streams)
- [Is it possible to add streams from Youtube, Dailymotion or Twitch?](#Is-it-possible-to-add-streams-from-youtube-dailymotion-or-twitch)
- [Is it possible to add audio-only streams, like FM radio?](#Is-it-possible-to-add-audio-only-streams-like-fm-radio)
- [Why are there some ids with call sign (WATB-TV.us) and others with alphanumeric id (Mychannel.us)?](#Why-are-there-some-ids-with-call-sign-watb-tvus-and-others-with-alphanumeric-id-mychannelus)
- [There are source for verify call sign and coverage area for some TV stations?](#There-are-source-for-verify-call-sign-and-coverage-area-for-some-tv-stations)
- [Why some streams have empty id?](#Why-some-streams-have-empty-id)
- [What is a "daily update" and what are the benefits for this playlist?](#What-is-a-daily-update-and-what-are-the-benefits-for-this-playlist)

## Basic
### What is IPTV?
In non-technical words, IPTV (Internet Protocol television) stations have web addresses that *are obtained from official sources or authorized services for easier access to the end user who has any media player that supports streaming*.

See [Internet Protocol television](https://en.wikipedia.org/wiki/Internet_Protocol_television) from Wikipedia article. This article is important, because newcomers do not understand how playlists work.

### Do I need a good Internet connection to watch an available stream?
A lot of channels are ready for main public because of adaptive resolution. If you have a slow connection, play again at another time, becuase you may experience short stuttering and/or signal low.

Some TV stations have a maximum of simultaneous users. So if this stream does not display correctly (becuase of bandwidth limit), you will have to play at another time.

### I have a cable service and I want those channels to be on this IPTV. Is that possible?
No. This playlist does not replace traditional cable, because this playlist can't include exclusive channels that may not be available on free-to-air. We recommend contacting your cable provider to offer legal alternatives to this service or visit the [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv) repository for find other providers.

### Does the playlist have a channel guide?
Yes. However, not all channels have their EPG available. See [EPG](https://github.com/iptv-org/epg) for more info. Please note that the guide is not perfect and some channels (like international feeds) may interrupt programming without you knowing.

### Is it possible to view channels directly from the main website?
No, to avoid possible abuse of the service.

### Why don't we show NSFW channels in most playlists?
NSFW content are not suitable for the main public. To avoid issues with these kind of programmings, we've created a separate NSFW playlist available for everyone. If you want to see this type of channel, please use the NSFW playlist.

### Do I have to pay to use this list?
No. Also, the maintenance of this service is self-financed.

### Are you planning to include a VOD of TV shows broadcasted on this playlist?
No. This is not our purpose.

Based on [#175](https://github.com/iptv-org/iptv/issues/175), [#3290](https://github.com/iptv-org/iptv/discussions/3290), [#7852](https://github.com/iptv-org/iptv/discussions/7852).

## Channels
### Does the channel need to be publicly accessible to be included in the playlists?
Yes, we only need the links to be publicly accessible like FTA packages (free-to-air), online services or official websites. We recommend tagging [Geo-blocked] if it is only accessible in one or few countries.

### Can I add a FTA channel that broadcasts PPV events or pay programming?
Maybe. Consider if the country where it is broadcasted allows fair use. Owners can ban the broadcast of PPV events, and even DCMA takedowns. Check the blocklist from the repository database for more info about specific events.

### I've created my channel and I want to add it to this playlist. What should I do?
We are a community initiative and you don't need to pay anything to stay on this playlist. Feel free to create a channel with few resources:
* Camera with a tripod (recommended for your own studio).
* A PC with Internet, video editor and recording/broadcasting app under RTMP protocol (e.g. OBS).
* And a live streaming service with multibitrate (if possible).

After you have your m3u8 link, add your channel information onto the [Database](https://github.com/iptv-org/database) repository, and submit an [issue](https://github.com/iptv-org/iptv/issues/new) to propose it to us.

### Is there any way to add my channel other than via git repository?
No, there is no such option.

## Technical
### Why am I asked to provide an adaptive playlist like "master.m3u8", "playlist.m3u8" or "index.m3u8"?
These files are useful to see perfectly the channel based in your network or screen (adaptive resolution). Also the streams are permanent, without token, that avoids edit temporally their urls.

### Why don't we accept XStream-Codes in streams?
Xtream-Codes streams are, most of the times, pirated streams created by some people that can get satellite and/or PPV streams and that propose it to everyone for a fairer price. These types of servers are illegal and also highly unstable, since it depends either from the user who bought it and the server that hosts it.

In short, they are poor quality streams created by unauthorized people.

Based on [#5401](https://github.com/iptv-org/iptv/pull/5401).

### Is possible to add streams from Youtube, Dailymotion or Twitch?
Yes. Due to technical limitations is necessary add a [Streamlink](https://streamlink.github.io/) server link to view the content.

### Is it possible to add audio-only streams, like FM radio?
No. Exceptions are the visual radios, in which a video and audio are shown at the same time.

### Why are there some call sign (KJLA-DT1.us) as ids and alphanumeric names as ids (Mychannel.us)?
It's to differentiate the origin of the broadcast from the content. Call signs usually come from physical stations in the country of origin and their programming is subject to change. If the channel is not from a television station, the brand name will be used.

An example of a call sign used as id is `KJLA-DT1.us`: [KJLA](https://en.wikipedia.org/wiki/KJLA) is a digital television station, DT is a suffix, 1 is a subchannel number and ".us" is the country code (United States). This station broadcasts the Visión Latina channel, whose id is `VisionLatina.us`.

### There are source for verify call sign and coverage area for some TV stations?
There are websites to consult the location and characteristics of the station. For example, [FCCData](https://fccdata.org/) for US, Canada, Mexico UK, Austrailia and Japan.

### Why attributes of channels of this playlist like "tvg-country", "tvg-language", "tvg-logo" are missing?
The reason is to reduce the workload when adding streams in the list. Since "tvg-id" links to [Database](https://github.com/iptv-org/database) repository, each channel has unique attributes like: image, name (in English and local speak), category and language.

You can add multiple streams with a single id (in the "tvg-id" parameter), instead of adding information from scratch. For example:

```
#EXTINF:-1 tvg-id="CCTV3.cn" status="online",CCTV-3综艺 (1080p)
```
Based on [#6516](https://github.com/iptv-org/iptv/issues/6516).

### Why some streams have empty id?
Because the stream does not have enough information available. If you know, let us know its official name, the language it broadcasts and the country where it originates.

This also applies to the undefined.m3u file. The streams in this file are from channels whose country of origin is unknown.

Based on [#2440](https://github.com/iptv-org/iptv/issues/2440).

### What is a "daily update" and why are the benefits for this playlist?
A "daily update" is a pull request made for maintenance purposes. It checks the status of the playlist operation, and reclassifies the streams internally. This will be useful on playlist recreation, as it's gonna hide streams from the playlist if they have access problems.
