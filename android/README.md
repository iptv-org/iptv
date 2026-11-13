# Android IPTV App

Android client for the **iptv-org/iptv** repository — live TV channels from around the world.

## What it does
- Browses channels **by country** (all ~300 country playlists from `streams/`)
- Browses channels **by category** (News, Sports, Movies, Music, …)
- Searches channels
- Adds/removes **favorites** (stored locally with Room)
- Plays HLS/M3U8 streams with **ExoPlayer**
- Pulls fresh playlists from `iptv-org.github.io/iptv/` — always in sync with the repository

## Source data
Playlists are fetched from the upstream mirror of this repo:
`https://iptv-org.github.io/iptv/`

So whenever the repository is updated (new channels, new countries), the app picks them up on refresh — no app update needed.

## Requirements
- Android Studio (Giraffe or newer)
- SDK: minSdk 24, compileSdk 34
- Java 1.8 / Kotlin 1.9

## Build
1. Open the `android/` folder in Android Studio.
2. Let Gradle sync and download dependencies.
3. Run on a device/emulator.

## Project structure
```
android/
  app/src/main/
    java/com/iptv/app/
      App.kt
      models/           Channel.kt, FavoriteChannel.kt, AppDatabase.kt, FavoriteDao.kt
      network/          PlaylistApi.kt, M3UParser.kt, PlaylistRepository.kt
      ui/adapters/      ChannelAdapter, CountryAdapter, CategoryAdapter
      MainActivity.kt
      ChannelListActivity.kt
      PlayerActivity.kt
    res/
      layout/, drawable/, values/, menu/
```

## License
Same as the parent repository (MIT) — see `LICENSE`.
