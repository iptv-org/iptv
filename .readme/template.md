# IPTV

![auto-update](https://github.com/iptv-org/iptv/actions/workflows/auto-update.yml/badge.svg)
![clean](https://github.com/iptv-org/iptv/actions/workflows/clean.yml/badge.svg)

Collection of publicly available IPTV channels from all over the world.

Internet Protocol television (IPTV) is the delivery of television content over Internet Protocol (IP) networks.

## Available playlists

There are multiple playlists available for each of your desires :

*All channels*
- `https://iptv-org.github.io/iptv/index.m3u` contains all the links that we've gathered so far.
- `https://iptv-org.github.io/iptv/index.sfw.m3u` contains links we've classified as "safe for work", meaning no adult channels are in there.

*Note that if you find any adult channel that we did not classify as "XXX", please let us know by making an "Question" issue.*

Here is an example on how it works : 
![VLC Network Panel](.readme/preview.png)

*All channels, sorted by specific order*
- `https://iptv-org.github.io/iptv/index.country.m3u` contains all the links grouped by their country (of streaming origin, specific countries available below)
- `https://iptv-org.github.io/iptv/index.category.m3u` contains all the links grouped by their category (specific categories available below)
- `https://iptv-org.github.io/iptv/index.language.m3u` contains all the links grouped by their language (specific languages available below)

Are you interested into something more specific ? Use one of the playlists from the lists below :

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

**NOTE:** Add `.sfw` to the end of the filename for the lists without any adult channels (For example: `https://iptv-org.github.io/iptv/countries/fr.sfw.m3u`).

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
    "category": "News",
    "languages": [
      {
        "code": "eng",
        "name": "English"
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

## Resources

You can find links to various IPTV related resources in this repository [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv).

## Contribution

Please make sure to read the [Contributing Guide](CONTRIBUTING.md) before sending an issue or making a pull request.

## Legal

No video files are stored in this repository. The repository simply contains user-submitted links to publicly available video stream URLs, which to the best of our knowledge have been intentionally made publicly by the copyright holders. If any links in these playlists infringe on your rights as a copyright holder, they may be removed by sending a pull request or opening an issue. However, note that we have **no control** over the destination of the link, and just removing the link from the playlist will not remove its contents from the web. Note that linking does not directly infringe copyright because no copy is made on the site providing the link, and thus this is **not** a valid reason to send a DMCA notice to GitHub. To remove this content from the web, you should contact the web host that's actually hosting the content (**not** GitHub, nor the maintainers of this repository).
