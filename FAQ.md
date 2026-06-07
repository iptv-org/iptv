# Frequently Asked Questions

### My favorite channel is not on the playlist.
Make sure the channel is not [blocklisted](https://iptv-org.github.io/?q=is_blocked%3Atrue), see the [History of related issues](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) for details. Some channels or content may not be provided in this repository due to copyright or GitHub terms of service issues.
Start by asking our community for help via [Discussions](https://github.com/iptv-org/iptv/discussions). It is quite possible that someone already has a link to the channel you need and they just haven't added it to our playlists yet.

Keep in mind that not all TV channels have some publicly available source for viewing online, and in this case there is little we can do about it.

### My favorite channel has disappeared from the playlist. Would you add it back?
Make sure the channel wasn't [blocklisted](https://iptv-org.github.io/?q=is_blocked%3Atrue) recently and see the [History of related issues](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) for details.
The repository simply contains user-submitted links to publicly available video stream URLs, note that we have no control over the stream sources. Unfortunately, if there's no alternate source that has been intentionally made public there is little we can do about it.

### Why do I see a channel that is not intended for my country?
See the "Playlist Structure" section of the [Contributing Guide](https://github.com/iptv-org/iptv/blob/master/CONTRIBUTING.md#playlist-structure).
If you still believe this is an error, you can submit a request to update the channel info in our [Database](https://github.com/iptv-org/database/issues). Once the request is approved, the link will be automatically moved to a different playlist.

### Are you planning to include a Video On Demand (VOD) to the playlist?

No.

### Why is a channel available on iptv-org.github.io but missing from the playlist?

The site is an extensive database of all existing TV channels in the world, and does not represent a list of streams in our possession. Only channels for which we have working stream links are included in the playlists.
You may still check the site with the [streams:>0](https://iptv-org.github.io/?q=streams%3A%3E0) parameter in the search bar to see all available streams.

### Can I add a radio broadcast?

Yes, if it is a [visual radio](https://en.wikipedia.org/wiki/Visual_radio) in which a video and audio are shown at the same time.

### How do I find a new working link?

Find a publicly available stream using your favourite search engine or by searching GitHub. Just don't forget to carefully read the "Validation" section in the [Contributing Guide](https://github.com/iptv-org/iptv/blob/master/CONTRIBUTING.md#Validation) first.

### Why isn't my link accepted?

See the "Requirements" and "Validation" sections of the [Contributing Guide](https://github.com/iptv-org/iptv/blob/master/CONTRIBUTING.md#Requirements).

### Why do you not accept links that work in my player of choice or in a browser?

The goal of **iptv-org** is to provide reliable playlists that can be used with a variety of players, on every platform and every capable device.
We use [VLC media player](https://www.videolan.org/vlc/index.html) for playback and [FFmpeg](https://www.ffmpeg.org/) for testing and development, as they represent a practical sweet spot for cross-platform IPTV compatibility, including support for HTTP referrer and user-agent-based streams.
For this reason we only accept links that can be supplemented by #EXTVLCOPT:http-referrer and #EXTVLCOPT:http-user-agent arguments. Links that require CORS handling or browser spoofing are not accepted due to added complexity.
