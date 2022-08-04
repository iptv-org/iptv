# Frequently Asked Questions

- [Does the channel need to be FTA to be included in the playlists?](#Does-the-channel-need-to-be-FTA-to-be-included-in-the-playlists)
- [Can I add a FTA channel that broadcasts PPV events or pay programming?](#Can-I-add-a-FTA-channel-that-broadcasts-PPV-events-or-pay-programming)
- [Why is recommended the "playlist.m3u" or "index.m3u" at the end of the url?](#Why-is-recommended-the-playlistm3u-or-indexm3u-at-the-end-of-the-url)
- [Why don't we accept XStreamCode in streams?](#Why-dont-we-accept-xstreamcode-in-streams)
- [Is possible to add streams from Youtube, Dailymotion or Twitch?](#Is-possible-to-add-streams-from-youtube-dailymotion-or-twitch)
- [Is it possible to add audio-only streams, like FM radio?](#Is-it-possible-to-add-audio-only-streams-like-fm-radio)
- [Why are there some ids with call sign (WATB-TV.us) and others with alphanumeric id (Mychannel.us)?](#Why-are-there-some-ids-with-call-sign-watb-tvus-and-others-with-alphanumeric-id-mychannelus)
- [There are source for verify call sign and coverage area for some TV stations?](#There-are-source-for-verify-call-sign-and-coverage-area-for-some-tv-stations)
- [Why some stream have empty id?](#Why-some-stream-have-empty-id)
- [What is a "daily update" and why is benefit for this playlist?](#What-is-a-daily-update-and-why-is-benefit-for-this-playlist)
- [Is possible to view channels directly from the site?](#Is-possible-to-view-channels-directly-from-the-site)
- [Why don't we show NSFW channels in most playlists?](#Why-dont-we-show-nsfw-channels-in-most-playlists)
- [Do I have to pay to use this list?](#Do-i-have-to-pay-to-use-this-list)
- [Are you planning to include a VOD of the programs broadcast on this playlist?](#Are-you-planning-to-include-a-vod-of-the-programs-broadcast-on-this-playlist)

## Does the channel need to be publicly accessible to be included in the playlists?
Yes, we only need the links to be publicly accessible like FTA packages, online services or official websites. We recommend tagging [Geo-blocked] if it is only accessible in a certain country.

## Can I add a FTA channel that broadcasts PPV events or pay programming?
Maybe. Consider if the country where it is broadcasted allows fair use. Owners can ban the broadcast of PPV events, and even DCMA takedowns. Check the blocklist from the repository database for more info about specific events.

## I have a cable service and I want those channels to be on this IPTV. Is that possible?
No. This playlist does not replace traditional cable, also there are exclusive channels that may not be available on free-to-air. We recommend contacting your cable provider to offer legal alternatives to this service or visit the [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv) repository.

## Why is recommended the "playlist.m3u" or "index.m3u" at the end of the url?
These files use adaptive resolution, also the streams are permanent, that avoids dependence on tokens or temporal files.

## Why don't we accept XStreamCode in streams?
XStreamCode contains code that could be malicious to users.

## Is possible to add streams from Youtube, Dailymotion or Twitch?
Yes. Due to technical limitations is necessary add a Streamlink server link to view the content. 

## Is it possible to add audio-only streams, like FM radio?
No. Exceptions are the visual radios, in which a video and audio are shown at the same time.

## Why are there some ids with call sign (WATB-TV.us) and others with alphanumeric id (Mychannel.us)?
It's to differentiate the origin of the broadcast from the content. Call signs usually come from physical stations in the country of origin and their programming is subject to change.

## There are source for verify call sign and coverage area for some TV stations?
There are websites to consult the location and characteristics of the station. For example, [FCCData](https://fccdata.org/) for US, Canada, Mexico UK, Austrailia and Japan.

## Why some stream have empty id?
Because the stream does not have enough information available. If you know, let us know its official name, the language it broadcasts and the country where it originates.

## What is a "daily update" and why is benefit for this playlist?
A "daily update" is maintenance to check the status of the playlist operation, as well as to hide streams from the playlist if they have access problems.

## Is possible to view channels directly from the site?
No, to avoid possible abuse of the service.

## Why don't we show NSFW channels in most playlists?
To avoid content that may be inappropriate for work or display to the entire audience. We suggest using the corresponding playlist.

## Do I have to pay to use this list?
No. Also, the maintenance of this service is self-financed.

## Are you planning to include a VOD of the programs broadcast on this playlist?
No. This is not our purpose.
