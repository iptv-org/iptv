## Playlists

There are several versions of playlists that differ in the way they are grouped. As of January 30th, 2024, we have stopped distributing NSFW channels. For more information, please look at [this issue](https://github.com/iptv-org/iptv/issues/15723).

### Grouped by category

Playlists in which channels are grouped by category.

<details>
<summary>Expand</summary>
<br>

```
https://iptv-org.github.io/iptv/index.category.m3u
```

Same thing, but split up into separate files:

<!-- prettier-ignore -->
#include "./.readme/_categories.md"

</details>

### Grouped by language

Playlists in which channels are grouped by the language in which they are broadcast.

<details>
<summary>Expand</summary>
<br>

```
https://iptv-org.github.io/iptv/index.language.m3u
```

Same thing, but split up into separate files:

<!-- prettier-ignore -->
#include "./.readme/_languages.md"

</details>

### Grouped by country

Playlists in which channels are grouped by country for which they are broadcasted.

<details>
<summary>Expand</summary>
<br>

```
https://iptv-org.github.io/iptv/index.country.m3u
```

Same thing, but split up into separate files:

<!-- prettier-ignore -->
#include "./.readme/_countries.md"

</details>

### Grouped by subdivision

Playlists in which channels are grouped by subdivision for which they are broadcasted.

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
#include "./.readme/_subdivisions.md"

</details>

### Grouped by region

Playlists in which channels are grouped by the region for which they are broadcasted.

<details>
<summary>Expand</summary>
<br>

```
https://iptv-org.github.io/iptv/index.region.m3u
```

Same thing, but split up into separate files:

<!-- prettier-ignore -->
#include "./.readme/_regions.md"

</details>

### Grouped by sources

Playlists in which channels are grouped by broadcast source.

<details>
<summary>Expand</summary>
<br>

To use the playlist, simply replace `<FILENAME>` in the link below with the name of one of the files in the [streams](streams) folder.

```
https://iptv-org.github.io/iptv/sources/<FILENAME>.m3u
```

</details>

Also, any of our internal playlists are available in raw form (without any filtering or sorting) at this link:

```
https://iptv-org.github.io/iptv/raw/<FILENAME>.m3u
```
