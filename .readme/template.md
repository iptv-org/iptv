# IPTV

Collection of publicly available IPTV (Internet Protocol television) channels from all over the world.

## Table of contents

- 🚀 [How to use?](#how-to-use)
- 📺 [Playlists](#playlists)
- 🗄 [Database](#database)
- 👨‍💻 [API](#api)
- 📚 [Resources](#resources)
- 💬 [Discussions](#discussions)
- ❓ [FAQ](#faq)
- 🛠 [Contribution](#contribution)
- ⚖ [Legal](#legal)
- © [License](#license)

## How to use?

Simply insert one of the links below into [any video player](https://github.com/iptv-org/awesome-iptv#apps) that supports live streaming and press _Open_.

![VLC Network Panel](https://github.com/iptv-org/iptv/raw/master/.readme/preview.png)

## Playlists

There are several versions of playlists that differ in the way they are grouped.

### Main playlist

Playlist includes all known channels except adult channels.

```
https://iptv-org.github.io/iptv/index.m3u
```

And here is the full version:

```
https://iptv-org.github.io/iptv/index.nsfw.m3u
```

### Grouped by category

<details>
<summary>Expand</summary>
<br>

Playlist in which each channel has its _category_ as a group title:

```
https://iptv-org.github.io/iptv/index.category.m3u
```

Same thing, but split up into separate files:

<!-- prettier-ignore -->
#include "./.readme/_categories.md"

</details>

### Grouped by language

<details>
<summary>Expand</summary>
<br>

Playlist in which each channel has its _language_ as a group title:

```
https://iptv-org.github.io/iptv/index.language.m3u
```

Same thing, but split up into separate files:

<!-- prettier-ignore -->
#include "./.readme/_languages.md"

</details>

### Grouped by country

<details>
<summary>Expand</summary>
<br>

Playlist in which each channel has its _country_ as a group title:

```
https://iptv-org.github.io/iptv/index.country.m3u
```

Same thing, but split up into separate files:

<!-- prettier-ignore -->
#include "./.readme/_countries.md"

</details>

### Grouped by region

<details>
<summary>Expand</summary>
<br>

Playlist in which each channel has its _region_ as a group title:

```
https://iptv-org.github.io/iptv/index.region.m3u
```

Same thing, but split up into separate files:

<!-- prettier-ignore -->
#include "./.readme/_regions.md"

</details>

## Database

All channel data is taken from the [iptv-org/database](https://github.com/iptv-org/database) repository. If you find any errors please open a new [issue](https://github.com/iptv-org/database/issues) there.

## API

The API documentation can be found in the [iptv-org/api](https://github.com/iptv-org/api) repository.

## Resources

Links to other useful IPTV-related resources can be found in the [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv) repository.

## Discussions

If you have a question or an idea, you can post it in the [Discussions](https://github.com/iptv-org/iptv/discussions) tab.

## FAQ

The answers to the most popular questions can be found in the [FAQ.md](FAQ.md) file.

## Contribution

Please make sure to read the [Contributing Guide](CONTRIBUTING.md) before sending an issue or making a pull request.

And thank you to everyone who has already contributed!

### Backers

<a href="https://opencollective.com/iptv-org"><img src="https://opencollective.com/iptv-org/backers.svg?width=890" /></a>

### Contributors

<a href="https://github.com/iptv-org/iptv/graphs/contributors"><img src="https://opencollective.com/iptv-org/contributors.svg?width=890" /></a>

## Legal

No video files are stored in this repository. The repository simply contains user-submitted links to publicly available video stream URLs, which to the best of our knowledge have been intentionally made publicly by the copyright holders. If any links in these playlists infringe on your rights as a copyright holder, they may be removed by sending a [pull request](https://github.com/iptv-org/iptv/pulls) or opening an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=freearhey&labels=removal+request&template=--removal-request.yml&title=Remove%3A+). However, note that we have **no control** over the destination of the link, and just removing the link from the playlist will not remove its contents from the web. Note that linking does not directly infringe copyright because no copy is made on the site providing the link, and thus this is **not** a valid reason to send a DMCA notice to GitHub. To remove this content from the web, you should contact the web host that's actually hosting the content (**not** GitHub, nor the maintainers of this repository).

## License

[![CC0](http://mirrors.creativecommons.org/presskit/buttons/88x31/svg/cc-zero.svg)](LICENSE)
