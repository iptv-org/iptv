# Frequently Asked Questions

### My favorite channel is not on the playlist.
Make sure the channel is not in the [blocklisted](https://iptv-org.github.io/?q=is_blocked%3Atrue) and see [History of related issues](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) for details. Some channels or content may not be provided in this repository due to copyright or GitHub terms of service issues.
Start by asking our community for help via [Discussions](https://github.com/orgs/iptv-org/discussions). It is quite possible that someone already has a link to the channel you need and they just haven't added it to our playlist yet.

Keep in mind that not all TV channels have some publicly available source for viewing online, and in this case there is little we can do about it.

### My favorite channel has disappeared from the playlist. Would you add it back?
Make sure the channel wasn't [blocklisted](https://iptv-org.github.io/?q=is_blocked%3Atrue) recently and see [History of related issues](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) for details.
The repository simply contains user-submitted links to publicly available video stream URLs, note that we have no control over the stream sources. Unfortunately, if there's no alternate source that have been intentionally made public there is little we can do about it.

### Are you planning to include a Video On Demand (VOD) to the playlist?

No.

### Why is the channel on the iptv-org.github.io but not in the playlist?

The site is an extensive database of all existing TV channels in the world, and does not represent a list of streams in our possession. Only those of them for which we have working stream links are included in the playlists.
You may still check [iptv-org.github.io with the "streams:>0" parameter](https://iptv-org.github.io/?q=streams%3A%3E0) in the search bar to check all available streams.

### Can I add a radio broadcast?

Yes, if it is a [visual radio](https://en.wikipedia.org/wiki/Visual_radio) in which a video and audio are shown at the same time.

### Why isn't my link accepted?

See the Requirements and Validation sections of [Contributing Guide.md](https://github.com/iptv-org/iptv/blob/master/CONTRIBUTING.md#Requirements)

### Why do you not accept links that work in my player of choice or in a browser?

The goal of IPTV-ORG is to provide reliable playlists that can be used with a variety of players, on every platform and every capable device.
We have a sweet spot in using [VLC media player](https://www.videolan.org/vlc/index.html) or [FFMPEG](https://www.ffmpeg.org/) as the most common cross platform players and basements for most IPTV player software.
At this point we do accept links that can be suplimented by #EXTVLCOPT:http-referrer and #EXTVLCOPT:http-user-agent arguments. Links that require proper CORS handling and browser impersonation are not accepted due to unwanted complexity.
