# IPTV

Collection of 8000+ publicly available IPTV channels from all over the world. 

Internet Protocol television (IPTV) is the delivery of television content over Internet Protocol (IP) networks. 

## Usage

To watch IPTV you just need to paste this link `https://iptv-org.github.io/iptv/index.m3u` to any player with support M3U-playlists.

![VLC Network Panel](preview.png)

Also you can instead use one of these playlists:

- `https://iptv-org.github.io/iptv/index.country.m3u` (grouped by country)
- `https://iptv-org.github.io/iptv/index.category.m3u` (grouped by category)
- `https://iptv-org.github.io/iptv/index.language.m3u` (grouped by language)

Or select one of the playlists from the list below.

## Playlists by category

#include "./.readme/_categories.md"

## Playlists by language

#include "./.readme/_languages.md"

## Playlists by country

#include "./.readme/_countries.md"


## For Developers

In addition to the above methods, you can also get a list of all available channels in JSON format.

To do this, you just have to make a GET request to:

```
https://iptv-org.github.io/iptv/channels.json
```

If successful, you should get the following response:

```
[
  ...
  {
    "name": "CNN",
    "logo": "https://i.imgur.com/ilZJT5s.png",
    "url": "http://ott-cdn.ucom.am/s27/index.m3u8",
    "category": "News",
    "language": [
      {
        "code": "eng",
        "name": "English"
      }
    ],
    "country": {
      "code": "us",
      "name": "United States"
    },
    "tvg": {
      "id": "cnn.us",
      "name": "CNN",
      "url": "http://epg.streamstv.me/epg/guide-usa.xml.gz"
    }
  },
  ...
]
```

## Resources

You can find links to various IPTV related resources in this repository [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv).

## Contribution

Please make sure to read the [Contributing Guide](.github/CONTRIBUTING.md) before making a pull request.

If you find an error or have any suggestions on how to organize a playlist, please send an [issue](https://github.com/iptv-org/iptv/issues).
