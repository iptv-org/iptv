# Frequently Asked Questions

Basic:
- [What is IPTV?](#What-is-iptv)
- [Do I need a good Internet connection to watch an available stream?](#Do-i-need-a-good-internet-connection-to-watch-an-available-stream)
- [I have a cable service and I want those channels to be on this IPTV. Is that possible?](#I-have-a-cable-service-and-i-want-those-channels-to-be-on-this-iptv-is-that-possible)
- [Does the playlist have a channel guide?](#Does-the-playlist-have-a-channel-guide)
- [Why don't we show NSFW channels in most playlists?](#Why-dont-we-show-nsfw-channels-in-most-playlists)
- [Do I have to pay to use this playlist?](#Do-i-have-to-pay-to-use-this-playlist)
- [Are you planning to include a VOD of TV shows broadcasted on this playlist?](#Are-you-planning-to-include-a-vod-of-tv-shows-broadcasted-on-this-playlist)

Channels:
- [Does the channel need to be publicly accessible to be included in the playlists?](#Does-the-channel-need-to-be-publicly-accessible-to-be-included-in-the-playlists)
- [Can I even add channels that can only be accessed in their country of origin?](#Can-i-even-add-channels-that-can-only-be-accessed-in-their-country-of-origin)
- [Can I set a FTA channel that is broadcasted in specific cities or countries?](#Can-i-set-a-fta-channel-that-is-broadcasted-in-specific-cities-or-countries)
- [Can I safely add an FTA channel that broadcasts PPV events or pay programming?](#Can-i-safely-add-an-fta-channel-that-broadcasts-ppv-events-or-pay-programming)
- [I've created my channel and I want to add it to this playlist. What should I do?](#Ive-created-my-channel-and-i-want-to-add-it-to-this-playlist-what-should-i-do)
- [Is there any way to add my channel other than via this git repository?](#Is-there-any-way-to-add-my-channel-other-than-via-this-git-repository)

Website:
- [I've seen this channel on the website/the EPG, though it is not seen in the playlists, why?](#Ive-seen-this-channel-on-the-websitethe-epg-though-it-is-not-seen-in-the-playlists-why)

Technical:
- [Why am I asked to provide an adaptive playlist like "master.m3u8", "playlist.m3u8" or "index.m3u8"?](#Why-am-i-asked-to-provide-an-adaptive-playlist-like-masterm3u8-playlistm3u8-or-indexm3u8)
- [Why don't we accept Xtream-Codes servers inside our playlists?](#Why-dont-we-accept-xtream-codes-servers-inside-our-playlists)
- [Is it possible to add streams from Youtube, Dailymotion or Twitch?](#Is-it-possible-to-add-streams-from-youtube-dailymotion-or-twitch)
- [Is it possible to add audio-only streams, like FM radio?](#Is-it-possible-to-add-audio-only-streams-like-fm-radio)
- [Why are there some call sign (KJLA-DT1.us) as ids and alphanumeric names as ids (Mychannel.us)?](#Why-are-there-some-call-sign-kjla-dt1us-as-ids-and-alphanumeric-names-as-ids-mychannelus)
- [There are source for verify call sign and coverage area for some TV stations?](#There-are-source-for-verify-call-sign-and-coverage-area-for-some-tv-stations)
- [Why attributes of channels of this playlist like "tvg-country", "tvg-language", "tvg-logo" are missing?](#Why-attributes-of-channels-of-this-playlist-like-tvg-country-tvg-language-tvg-logo-are-missing)
- [Why some streams have an empty id?](#Why-some-streams-have-an-empty-id)
- [What is a "daily update" and why is useful for this playlist?](#What-is-a-daily-update-and-why-is-useful-for-this-playlist)

## Basic
### What is IPTV?
In non-technical words, IPTV (Internet Protocol television) stations have web addresses that *are obtained from official sources or authorized services for easier access to the end user who has any media player that supports streaming*.

Based on "[Internet Protocol television](https://en.wikipedia.org/wiki/Internet_Protocol_television)" from Wikipedia article. This article is important, because newcomers do not understand how playlists work.

### Do I need a good Internet connection to watch an available stream?
A lot of channels are ready for main public because of adaptive resolution. If you have a slow connection, play again at another time, because you may experience short stuttering and/or signal loss.

Some TV stations have a maximum of simultaneous users. So if this stream does not display correctly (becuase of bandwidth limit), you will have to play at another time.

Based on [#6791](https://github.com/iptv-org/iptv/discussions/6791).

### I have a cable service and I want those channels to be on this IPTV. Is that possible?
No. This playlist does not replace traditional cable, a pay service, because this playlist can't include exclusive channels that may not be available on free-to-air. In other words, you will not have all the channels in the world. We recommend contacting your cable provider to offer legal alternatives to this service or visit the [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv) repository for find other providers.

Based on [#859](https://github.com/iptv-org/iptv/issues/859) (about difference between this repository and providers), [#7205](https://github.com/iptv-org/iptv/issues/7205), [#7914](https://github.com/iptv-org/iptv/discussions/7914) and [#8102](https://github.com/iptv-org/iptv/discussions/8102).

### Does the playlist have a channel guide?
Yes, because an id of each channel is used to link to program guide because they are obtained from third party websites. However, not all channels have their EPG available. See [EPG](https://github.com/iptv-org/epg) for more info. Please note that the guide is not perfect and some channels (like international feeds) may interrupt programming without you knowing.

Note: For storage space reasons, the programming guide is only available in gz compressed format. See [discussion](https://github.com/iptv-org/iptv/discussions/8255).

Based on [#1797](https://github.com/iptv-org/iptv/issues/1797), [#2438](https://github.com/iptv-org/iptv/issues/2438), [#4537](https://github.com/iptv-org/iptv/discussions/4537) and [#7043](https://github.com/iptv-org/iptv/discussions/7043).

### Why don't we show NSFW channels in most playlists?
NSFW content are not suitable for the main public. To avoid issues with these kind of programmings, we've created a separate NSFW playlist available for everyone. If you want to see this type of channel, please use the NSFW playlist.

If in the general playlist, you see NSFW channels displayed by mistake, we suggest that you report via an issue or edit their entries from the [Database](https://github.com/iptv-org/database) repository.

Based on [#1416](https://github.com/iptv-org/iptv/pull/1416), [#2126](https://github.com/iptv-org/iptv/issues/2126), [#9104](https://github.com/iptv-org/iptv/issues/9104), [#2234](https://github.com/iptv-org/iptv/issues/2234) and [#7245](https://github.com/iptv-org/iptv/pull/7245) (requests of hide NSFW channels in general playlist).

### Do I have to pay to use this playlist?
No. Also, the maintenance of this service is self-financed. If a stranger asks to pay to access the playlist, we suggest not to follow it.

Based on [#81](https://github.com/iptv-org/iptv/issues/81) and [#3865](https://github.com/iptv-org/iptv/discussions/3865).

### Are you planning to include a VOD of TV shows broadcasted on this playlist?
No. This is not our purpose.

Based on [#175](https://github.com/iptv-org/iptv/issues/175), [#3290](https://github.com/iptv-org/iptv/discussions/3290), [#5466](https://github.com/iptv-org/iptv/issues/5466) and [#7852](https://github.com/iptv-org/iptv/discussions/7852).

## Channels
### Does the channel need to be publicly accessible to be included in the playlists?
Yes, we need the links to be publicly accessible like FTA packages (free-to-air), online services or official websites.

Note: In the daily updates, playlists of each country will be generated automatically, which will also include local and international broadcasts.

Based on [#1432](https://github.com/iptv-org/iptv/issues/1432) (about over-the-air channels) and [#2732](https://github.com/iptv-org/iptv/issues/2732).

### Can I even add channels that can only be accessed in their country of origin?
Yes. Even if the channel does not want to be broadcasted worldwide for legal reasons, we recommend using the [Geo-blocked] tag for its stream.

Based on [#1843](https://github.com/iptv-org/iptv/issues/1843) (request of geo-blocked channels), [#2191](https://github.com/iptv-org/iptv/issues/2191) and [#6558](https://github.com/iptv-org/iptv/issues/6558) (example of geo-blocked channel).

### Can I set a FTA channel that is broadcasted in specific cities or countries?
Yes. If the channel broadcasted in other cities or countries, please edit its entry onto the [Database](https://github.com/iptv-org/database) repository. It will be updated to the corresponding playlists.

When setting the city where the channel is broadcasted, set its timezone is not necessary because it is not relevant.

Based on [#747](https://github.com/iptv-org/iptv/issues/747) (first request), [#5802](https://github.com/iptv-org/iptv/discussions/5802) and [#6415](https://github.com/iptv-org/iptv/issues/6415).

### Can I safely add an FTA channel that broadcasts PPV events or pay programming?
Maybe, this may change in future answers. Consider if the country where it is broadcasted allows fair use. Owners can ban the broadcast of PPV events, and even issue a DMCA takedown. Check the [blocklist](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) for more info about specific events, and this [counternotice](https://github.com/github/dmca/blob/3ce1c9402c6b7e46dcbbea6ff866d6a44e75c72a/2020/10/2020-10-08-dfl-counternotice.md) indicating that a DMCA takedown is invalid if only one FTA channel infringes copyright.

Please remember that by sharing a link to a FTA channel (or more), you are **indexing** the link, not **restreaming** its content. This subtility makes most of the DMCA takedowns false and invalid under law.
A good example of this would be [Perfect 10 v. Google](https://www.eff.org/fr/cases/perfect-10-v-google). 
Some [valid takedowns](https://github.com/iptv-org/iptv/issues/6486) do occur when a Pull Request is made to notify us that we should not index their channels.

Based on [#440](https://github.com/iptv-org/iptv/issues/440) and [#7212](https://github.com/iptv-org/iptv/issues/7212).

### I've created my channel and I want to add it to this playlist. What should I do?
We are a community initiative and you don't need to pay anything to stay on this playlist. Feel free to create a channel with few resources:
* Camera with a tripod (recommended for your own studio).
* A PC with Internet, video editor and recording/broadcasting app under RTMP protocol (e.g. OBS).
* And a live streaming service with multibitrate (if possible).

After you have your m3u8 link, add your channel information by creating or editing the id (identifier) onto the [Database](https://github.com/iptv-org/database) repository. Then, submit an [issue](https://github.com/iptv-org/iptv/issues/new/choose) to propose it to us.

Notes:
* Because this is an community repository, we need the approval from two maintainers to accept your new additions. See [discussion](https://github.com/iptv-org/iptv/discussions/8412) for further explanations.
* If your television station broadcasts from other television stations, please read the *[Can I safely add an FTA channel that broadcasts PPV events or pay programming?](#Can-i-safely-add-an-fta-channel-that-broadcasts-ppv-events-or-pay-programming)* section.
* The same id can only be used if a mirror stream is also proposed. Please do not set the same id for two different channels. See [PR](https://github.com/iptv-org/iptv/pull/9572).
* If for some reason you need to edit the name of your channel, the id from the Database will be changed. We suggest that you update the new id from the playlist as soon as possible because the streams of your channel with modified name will not be automatically linked. See [PR](https://github.com/iptv-org/iptv/pull/9632).

Based on [#650](https://github.com/iptv-org/iptv/issues/650) and [#6654](https://github.com/iptv-org/iptv/discussions/6654) (basic information).

### Is there any way to add my channel other than via this git repository?
No, there is no such option.

Based on [#2392](https://github.com/iptv-org/iptv/issues/2392).

## Website
### I've seen this channel on the website/the EPG, though it is not seen in the playlists, why?
The website is a database of channels that are available worldwide, and the EPG repo scrapes the guides for various channels available on different websites.

Both these different scopes do not represent a list of streams that are available in the playlists, as they're entirely different repositories and serve different purposes. 

How to check if the playlist stream is available on the web: In our website, you will see an extensive list of channels and their respective information, when you can also search their name or filter by type (like `country:UK` for UK channels). On the right side of the channel, when the link is indexed in our database, there's a "Streams" option (but you can not play it). If you want add the missing stream, please respect the [contribution guide](https://github.com/iptv-org/iptv/blob/master/CONTRIBUTING.md) before doing so. 

Based on [#1002](https://github.com/iptv-org/iptv/issues/1002), [#7415](https://github.com/iptv-org/iptv/issues/7415), [#7509](https://github.com/iptv-org/iptv/discussions/7509), [#10242](https://github.com/iptv-org/iptv/discussions/10242) and [#11927](https://github.com/iptv-org/iptv/discussions/11927).

## Technical
### Why am I asked to provide an adaptive playlist like "master.m3u8", "playlist.m3u8" or "index.m3u8"?
An adaptive playlist is a m3u8 file that contains certain informations: the bandwidth, the quality, the type of codec used to read the channel. The player then reads the channel playlist based on your bandwidth and screen (hence the name "adaptive"). This permits you to watch your channel on perfect conditions.

In the "daily update", the stream with the best supported resolution will be considered "priority" over other lower resolution streams of the same channel.

Note: We do not accept the use of tokens, because they only work for a short time, which will end up in permanent offline (see [discussion](https://github.com/iptv-org/iptv/discussions/8838)). We also do not recommend using "chunks.m3u8", a other file type, for consistency reasons.

Based on [#1916](https://github.com/iptv-org/iptv/issues/1916) and [#5952](https://github.com/iptv-org/iptv/discussions/5952).

### Why don't we accept Xtream-Codes servers inside our playlists?
Xtream-Codes streams are, most of the times, pirated streams created by some people that can get satellite and/or PPV streams and that propose it to everyone for a fairer price. These types of servers are illegal and also highly unstable, since it depends either from the user who bought it or the server that hosts it.

In short, they are poor quality streams created by unauthorized people.

If you're unsure about if your link is from an Xtream-Codes server, you may:
* Look at the structure of the URL. Most of them have this form : http(s)://*hostname*:25461/*username*/*password*/*channelID* (port is often 25461)
* Remove the rest of the URL after the password mention and add either "panel_api.php?" or "player_api.php?" after the port. Replace the slashes between the username and password with "username=" and "password=". 

If the link matches or answers after changing the URL, you're with an Xtream-Codes server.

Based on [#5236](https://github.com/iptv-org/iptv/pull/5236), [#5401](https://github.com/iptv-org/iptv/pull/5401) and [#7576](https://github.com/iptv-org/iptv/discussions/7576) (about username and password of Xtream-Codes server).

### Is it possible to add streams from Youtube, Dailymotion or Twitch?
Yes. Due to technical limitations, it is necessary to add a [Streamlink](https://streamlink.github.io/) server link to view the content. This does not work with all streams, so it will give an "error" status if this stream is not freely accessible.

As an example, here's the scheme for adding a YouTube stream:

```
http://streamlink.example.org/iptv-query?streaming-ip=https://www.youtube.com/c/MyChannel/live
```

Based on [#3017](https://github.com/iptv-org/iptv/discussions/3017) (about geo-blocked channel), [#4112](https://github.com/iptv-org/iptv/discussions/4412), [#4456](https://github.com/iptv-org/iptv/discussions/4456) and [#10246](https://github.com/iptv-org/iptv/discussions/10246).

### Is it possible to add audio-only streams, like FM radio?
No. Exceptions are the visual radios, in which a video and audio are shown at the same time. A WIP repository made by one member of iptv-org, [LaneSh4d0w](https://github.com/LaneSh4d0w) aims to collect radio streams, on the [IPRD](https://github.com/LaneSh4d0w/IPRD) repository.

Based on [#1196](https://github.com/iptv-org/iptv/pull/1196) (first pull request about this) [#2758](https://github.com/iptv-org/iptv/pull/2758) (visual radio example), [#5794](https://github.com/iptv-org/iptv/discussions/5794), [#6044](https://github.com/iptv-org/iptv/discussions/6044) and [#8788](https://github.com/iptv-org/iptv/discussions/8788).

### Why are there some call sign (KJLA-DT1.us) as ids and alphanumeric names as ids (Mychannel.us)?
It's to differentiate the origin of the broadcast from the content. Call signs (or call letters in some countries) usually come from physical stations in the country of origin and their programming is subject to change. This type of ids is widely used in the United States, and [this article from Wikipedia](https://en.wikipedia.org/wiki/Call_signs_in_the_United_States) explains in more detail. However, if the channel does not officially carry the identification of the local television station, the brand name will be used as id.

An example of a call sign used as id is `KJLA-DT1.us`: [KJLA](https://en.wikipedia.org/wiki/KJLA) is a digital television station, DT is a suffix, 1 is a subchannel number and ".us" is the country code (United States). This station broadcasts the Visión Latina channel.

```
#EXTINF:-1 tvg-id="KJLA-DT1.us",Visión Latina Los Angeles (KJLA-DT1)
```

If the channel has a another stream and this is broadcasting as an international feed or under an online website without georestriction, consider using the alphanumeric name instead, whose id is `VisionLatina.us`.

```
#EXTINF:-1 tvg-id="VisionLatina.us",Visión Latina
```

Based on [#5818](https://github.com/iptv-org/iptv/discussions/5818).

### There are source for verify call sign and coverage area for some TV stations?
There are websites to consult the location and characteristics of the station. FCC has [complete official information](https://www.fcc.gov/media/television/tv-service-contour-data-points) about call letters in the United States. You can also consult other websites such as [FCCData](https://fccdata.org/) for US, Canada, Mexico, UK, Australia and Japan.

Based on [#9312](https://github.com/iptv-org/iptv/discussions/9312).

### Why attributes of channels of this playlist like "tvg-country", "tvg-language", "tvg-logo" are missing?
The reason is to reduce the workload when adding streams in the list. Since "tvg-id" links to the [Database](https://github.com/iptv-org/database) repository, each channel has unique attributes like image, name (in English and local speak), country (or countries) broadcasted, category and language.

You can add multiple streams with a single id (in the "tvg-id" parameter), instead of adding information from scratch. For example:

```
#EXTINF:-1 tvg-id="CCTV3.cn",CCTV-3综艺 (1080p)
```
Based on [#2086](https://github.com/iptv-org/iptv/issues/2086) (countries), [#3490](https://github.com/iptv-org/iptv/discussions/3490) (duplicated tvg-id) and [#6516](https://github.com/iptv-org/iptv/issues/6516) (use of Database).

### Why some streams have an empty id?
Because the stream does not have enough information available. If you appear to know additional data on these, let us know its official name, the language it broadcasts and the country where it originates.

This also applies to the undefined.m3u file. The streams in this file are from channels whose country of origin is unknown.

Based on [#2440](https://github.com/iptv-org/iptv/issues/2440).

### What is a "daily update" and why is useful for this playlist?
A "daily update" is a pull request made for maintenance purposes. It checks the status of the playlist operation, and reclassifies the streams internally. This will be useful on playlist recreation, as it's gonna hide streams from the playlist if they have access problems.

Initially, a version release was indicated in the daily updates, but it was not useful.

Based on [#645](https://github.com/iptv-org/iptv/issues/645) (about package relases), [#6524](https://github.com/iptv-org/iptv/discussions/6524) and [#6855](https://github.com/iptv-org/iptv/issues/6855).
