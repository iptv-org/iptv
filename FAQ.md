# Frequently Asked Questions

### My favorite channel is not on the playlist.

Start by asking our community for help via [Discussions](https://github.com/orgs/iptv-org/discussions). It is quite possible that someone already has a link to the channel you need and they just haven't added it to our playlist yet.

But keep in mind that not all TV channels are available for viewing online, and in this case there is little we can do about it.

### How can I add stream to playlists?

You have several options:

1. Create a new [issue](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams:add&projects=&template=-----streams_add.yml&title=Add%3A+) with a valid channel ID and a link to the stream. If the request is approved , the link will be added to the playlist in the next update. For or more info, see [Issue Reporting Guidelines](CONTRIBUTING.md#issue-reporting-guidelines).

2. Or you can add the link to the playlist directly via pull request. For more info, see [Pull Request Guidelines](CONTRIBUTING.md#pull-request-guidelines).

### How to report a broken stream?

Fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=broken+stream&projects=&template=---broken-stream.yml&title=Broken%3A+) and as soon as there is a working replacement, we will add it to the playlist or at least remove the non-working one.

### Does the playlist have a channel guide?

Yes. See [iptv-org/epg](https://github.com/iptv-org/epg) for more info.

### Are you planning to include a Video On Demand (VOD) to the playlist?

No.

### Why is the channel on the iptv-org.github.io but not in the playlist?

The site contains a list of all TV channels in the world and only those of them for which we have working stream links are included in the playlists.

### How can I add a link to YouTube live?

Since not all players allow you to open links to YouTube directly, we also cannot add them to playlists yet. However, some services like [abskmj/youtube-hls-m3u8](https://github.com/abskmj/youtube-hls-m3u8) allow you to get around this limitation by creating permalinks to the feed that can be played as normal. And these are the kind of links you can add to the playlist.

### Can I add a radio broadcast?

Yes, if it is a [visual radio](https://en.wikipedia.org/wiki/Visual_radio) in which a video and audio are shown at the same time.

### Why don't you accept links to Xtream Codes server?

Xtream Codes streams tend to be very unstable, and often links to them fail very quickly, so it's easier for us to initially exclude them from the playlist than to search for expired ones every day.

### How to distinguish a link to an Xtream Codes server from a regular one?

Most of them have this form:

`http(s)://{hostname}:{port}/{username}/{password}/{channelID}` (port is often `25461`)

To make sure that the link leads to the Xtream Codes server, copy the `hostname`, `port`, `username` and `password` into the link below and try to open it in a browser:

`http(s)://{hostname}:{port}/panel_api.php?username={username}&password={password}`

If the link answers, you're with an Xtream Codes server.
