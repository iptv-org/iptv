# IPTV

[![auto-update](https://github.com/iptv-org/iptv/actions/workflows/auto-update.yml/badge.svg)](https://github.com/iptv-org/iptv/actions/workflows/auto-update.yml)

Collection of publicly available IPTV channels from all over the world.

Internet Protocol television (IPTV) is the delivery of television content over Internet Protocol (IP) networks.

## Usage

To watch IPTV you just need to paste this link `https://iptv-org.github.io/iptv/index.m3u` to any player which supports M3U-playlists.

![VLC Network Panel](.readme/preview.png)

Also you can instead use one of these playlists:

- `https://iptv-org.github.io/iptv/index.category.m3u` (grouped by category)
- `https://iptv-org.github.io/iptv/index.language.m3u` (grouped by language)
- `https://iptv-org.github.io/iptv/index.country.m3u` (grouped by country)
- `https://iptv-org.github.io/iptv/index.region.m3u` (grouped by region)
- `https://iptv-org.github.io/iptv/index.nsfw.m3u` (includes adult channels)

Or select one of the playlists from the list below.

### Playlists by category

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
<table>
  <thead>
    <tr><th align="left">Category</th><th align="right">Channels</th><th align="left">Playlist</th></tr>
  </thead>
  <tbody>
    <tr><td align="left">General</td><td align="right">1</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/categories/general.m3u</code></td></tr>
    <tr><td align="left">News</td><td align="right">1</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/categories/news.m3u</code></td></tr>
    <tr><td align="left">Other</td><td align="right">0</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/categories/other.m3u</code></td></tr>
  </tbody>
</table>

</details>

### Playlists by language

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
<table>
  <thead>
    <tr><th align="left">Language</th><th align="right">Channels</th><th align="left">Playlist</th></tr>
  </thead>
  <tbody>
    <tr><td align="left">Catalan</td><td align="right">0</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/languages/cat.m3u</code></td></tr>
    <tr><td align="left">English</td><td align="right">1</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/languages/eng.m3u</code></td></tr>
    <tr><td align="left">Russian</td><td align="right">1</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/languages/rus.m3u</code></td></tr>
    <tr><td align="left">Undefined</td><td align="right">0</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/languages/undefined.m3u</code></td></tr>
  </tbody>
</table>

</details>

### Playlists by region

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
<table>
  <thead>
    <tr><th align="left">Region</th><th align="right">Channels</th><th align="left">Playlist</th></tr>
  </thead>
  <tbody>
    <tr><td align="left">Asia</td><td align="right">1</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/regions/asia.m3u</code></td></tr>
    <tr><td align="left">Commonwealth of Independent States</td><td align="right">1</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/regions/cis.m3u</code></td></tr>
    <tr><td align="left">Europe</td><td align="right">2</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/regions/eur.m3u</code></td></tr>
    <tr><td align="left">Europe, the Middle East and Africa</td><td align="right">2</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/regions/emea.m3u</code></td></tr>
    <tr><td align="left">Worldwide</td><td align="right">1</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/regions/int.m3u</code></td></tr>
    <tr><td align="left">Undefined</td><td align="right">0</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/regions/undefined.m3u</code></td></tr>
  </tbody>
</table>

</details>

### Playlists by country

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
<table>
  <thead>
    <tr><th align="left">Country</th><th align="right">Channels</th><th align="left">Playlist</th></tr>
  </thead>
  <tbody>
    <tr><td align="left">🇦🇩 Andorra</td><td align="right">0</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/countries/ad.m3u</code></td></tr>
    <tr><td align="left">🇷🇺 Russia</td><td align="right">1</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/countries/ru.m3u</code></td></tr>
    <tr><td align="left">🇬🇧 United Kingdom</td><td align="right">1</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/countries/uk.m3u</code></td></tr>
    <tr><td align="left">Undefined</td><td align="right">0</td><td align="left" nowrap><code>https://iptv-org.github.io/iptv/countries/undefined.m3u</code></td></tr>
  </tbody>
</table>

</details>

## For Developers

In addition to the above methods, you can also get a list of all available channels in JSON format.

To do this, you just have to make a GET request to:

```
https://iptv-org.github.io/iptv/channels.json
```

If successful, you should get the following response:

<details>
<summary>Expand</summary>
<br>
  
```
[
  ...
  {
    "name": "CNN",
    "logo": "https://i.imgur.com/ilZJT5s.png",
    "url": "http://ott-cdn.ucom.am/s27/index.m3u8",
    "categories": [
      {
        "name": "News",
        "slug": "news"
      }
    ],
    "countries": [
      {
        "code": "us",
        "name": "United States"
      },
      {
        "code": "ca",
        "name": "Canada"
      }
    ],
    "languages": [
      {
        "code": "eng",
        "name": "English"
      }
    ],
    "tvg": {
      "id": "cnn.us",
      "name": "CNN",
      "url": "http://epg.streamstv.me/epg/guide-usa.xml.gz"
    }
  },
  ...
]
```
</details>

## EPG

Playlists already have a built-in list of EPG, so players that support the `url-tvg` tag should load it automatically. If not, you can find a list of available programs here:

https://github.com/iptv-org/epg

## Resources

You can find links to various IPTV related resources in this repository [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv).

## Contribution

Please make sure to read the [Contributing Guide](CONTRIBUTING.md) before sending an issue or making a pull request.

## Legal

No video files are stored in this repository. The repository simply contains user-submitted links to publicly available video stream URLs, which to the best of our knowledge have been intentionally made publicly by the copyright holders. If any links in these playlists infringe on your rights as a copyright holder, they may be removed by sending a pull request or opening an issue. However, note that we have **no control** over the destination of the link, and just removing the link from the playlist will not remove its contents from the web. Note that linking does not directly infringe copyright because no copy is made on the site providing the link, and thus this is **not** a valid reason to send a DMCA notice to GitHub. To remove this content from the web, you should contact the web host that's actually hosting the content (**not** GitHub, nor the maintainers of this repository).
