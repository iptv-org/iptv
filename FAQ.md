# Frequently Asked Questions

Basic:
- [I have a cable service and I want those channels to be on this IPTV. Is that possible?](#I-have-a-cable-service-and-i-want-those-channels-to-be-on-this-iptv-is-that-possible)
- [Is possible to view channels directly from the main website?](#Is-possible-to-view-channels-directly-from-the-main-website)
- [Why don't we show NSFW channels in most playlists?](#Why-dont-we-show-nsfw-channels-in-most-playlists)
- [Do I have to pay to use this list?](#Do-i-have-to-pay-to-use-this-list)
- [Are you planning to include a VOD of TV shows broadcasted on this playlist?](#Are-you-planning-to-include-a-vod-of-tv-shows-broadcasted-on-this-playlist)

Technical:
- [Does the channel need to be FTA to be included in the playlists?](#Does-the-channel-need-to-be-FTA-to-be-included-in-the-playlists)
- [Can I add a FTA channel that broadcasts PPV events or pay programming?](#Can-I-add-a-FTA-channel-that-broadcasts-PPV-events-or-pay-programming)
- [Why is recommended the "master.m3u8", "playlist.m3u8" or "index.m3u8" at the end of the url?](#Why-is-recommended-the-masterm3u8-playlistm3u8-or-indexm3u8-at-the-end-of-the-url)
- [Why don't we accept XStreamCode in streams?](#Why-dont-we-accept-xstreamcode-in-streams)
- [Is possible to add streams from Youtube, Dailymotion or Twitch?](#Is-possible-to-add-streams-from-youtube-dailymotion-or-twitch)
- [Is it possible to add audio-only streams, like FM radio?](#Is-it-possible-to-add-audio-only-streams-like-fm-radio)
- [Why are there some ids with call sign (WATB-TV.us) and others with alphanumeric id (Mychannel.us)?](#Why-are-there-some-ids-with-call-sign-watb-tvus-and-others-with-alphanumeric-id-mychannelus)
- [There are source for verify call sign and coverage area for some TV stations?](#There-are-source-for-verify-call-sign-and-coverage-area-for-some-tv-stations)
- [Why some streams have empty id?](#Why-some-streams-have-empty-id)
- [What is a "daily update" and why is benefit for this playlist?](#What-is-a-daily-update-and-why-is-benefit-for-this-playlist)

## Basic
### I have a cable service and I want those channels to be on this IPTV. Is that possible?
No. This playlist does not replace traditional cable, because this playlist can't include exclusive channels that may not be available on free-to-air. We recommend contacting your cable provider to offer legal alternatives to this service or visit the [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv) repository for find other providers.

### Is possible to view channels directly from the main website?
No, to avoid possible abuse of the service.

### Why don't we show NSFW channels in most playlists?
Because to avoid content that may be inappropriate for work or display to the entire audience. We suggest using the corresponding playlist.

### Do I have to pay to use this list?
No. Also, the maintenance of this service is self-financed.

### Are you planning to include a VOD of TV shows broadcasted on this playlist?
No. This is not our purpose.

## Technical
### Does the channel need to be publicly accessible to be included in the playlists?
Yes, we only need the links to be publicly accessible like FTA packages (free-to-air), online services or official websites. We recommend tagging [Geo-blocked] if it is only accessible in one or few countries.

### Can I add a FTA channel that broadcasts PPV events or pay programming?
Maybe. Consider if the country where it is broadcasted allows fair use. Owners can ban the broadcast of PPV events, and even DCMA takedowns. Check the blocklist from the repository database for more info about specific events.

### Why is recommended the "master.m3u8", "playlist.m3u8" or "index.m3u8" at the end of the url?
These files are adjust to your network or screen (adaptive resolution). Also the streams are permanent, without token, that avoids edit temporally there urls.

### Why don't we accept XStreamCode in streams?
XStreamCode contains code that could be malicious to users.

### Is possible to add streams from Youtube, Dailymotion or Twitch?
Yes. Due to technical limitations is necessary add a Streamlink server link to view the content. 

### Is it possible to add audio-only streams, like FM radio?
No. Exceptions are the visual radios, in which a video and audio are shown at the same time.

### Why are there some ids with call sign (WATB-TV.us) and others with alphanumeric id (Mychannel.us)?
It's to differentiate the origin of the broadcast from the content. Call signs usually come from physical stations in the country of origin and their programming is subject to change.

### There are source for verify call sign and coverage area for some TV stations?
There are websites to consult the location and characteristics of the station. For example, [FCCData](https://fccdata.org/) for US, Canada, Mexico UK, Austrailia and Japan.

### Why some streams have empty id?
Because the stream does not have enough information available. If you know, let us know its official name, the language it broadcasts and the country where it originates.

### What is a "daily update" and why is benefit for this playlist?
A "daily update" is maintenance to check the status of the playlist operation, as well as to hide streams from the playlist if they have access problems.
