# IPTV

[![auto-update](https://github.com/iptv-org/iptv/actions/workflows/auto-update.yml/badge.svg)](https://github.com/iptv-org/iptv/actions/workflows/auto-update.yml)

Collection of publicly available IPTV (Internet Protocol television) channels from all over the world.

## Usage

![VLC Network Panel](https://github.com/iptv-org/iptv/raw/master/.readme/preview.png)

To watch IPTV, simply insert one of the links below into any player that supports M3U playlists:

- `https://iptv-org.github.io/iptv/index.m3u`
- `https://iptv-org.github.io/iptv/index.nsfw.m3u` (includes adult channels)
- `https://iptv-org.github.io/iptv/index.category.m3u` (grouped by category)
- `https://iptv-org.github.io/iptv/index.country.m3u` (grouped by country)
- `https://iptv-org.github.io/iptv/index.language.m3u` (grouped by language)
- `https://iptv-org.github.io/iptv/index.region.m3u` (grouped by region)

### Playlists by category

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
#include "./.readme/_categories.md"

</details>

### Playlists by language

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
#include "./.readme/_languages.md"

</details>

### Playlists by country

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
#include "./.readme/_countries.md"

</details>

### Playlists by region

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
#include "./.readme/_regions.md"

</details>

## EPG

The playlists already contain links to all guides, so players with support the `x-tvg-url` tag should load it automatically. Otherwise, you can choose one of the guides featured in the [iptv-org/epg](https://github.com/iptv-org/epg) repository.

## Database

All channel data is taken from the [iptv-org/database](https://github.com/iptv-org/database) repository. If you find any errors please open a new [issue](https://github.com/iptv-org/database/issues) there.

## API

The API documentation can be found in the [iptv-org/api](https://github.com/iptv-org/api) repository.

## Resources

Links to other useful IPTV-related resources can be found in the [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv) repository.

## Contribution

Please make sure to read the [Contributing Guide](CONTRIBUTING.md) before sending an issue or making a pull request.

## Legal

No video files are stored in this repository. The repository simply contains user-submitted links to publicly available video stream URLs, which to the best of our knowledge have been intentionally made publicly by the copyright holders. If any links in these playlists infringe on your rights as a copyright holder, they may be removed by sending a [pull request](https://github.com/iptv-org/iptv/pulls) or opening an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=freearhey&labels=removal+request&template=--removal-request.yml&title=Remove%3A+). However, note that we have **no control** over the destination of the link, and just removing the link from the playlist will not remove its contents from the web. Note that linking does not directly infringe copyright because no copy is made on the site providing the link, and thus this is **not** a valid reason to send a DMCA notice to GitHub. To remove this content from the web, you should contact the web host that's actually hosting the content (**not** GitHub, nor the maintainers of this repository).

## License

[![CC0](http://mirrors.creativecommons.org/presskit/buttons/88x31/svg/cc-zero.svg)](LICENSE)
