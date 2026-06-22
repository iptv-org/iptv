# Contributing Guide

- [Introduction](#introduction)
- [How to?](#how-to)
- [Project Structure](#project-structure)

## Introduction

**iptv-org** is more than just a repository for sharing links to live streams. After years of commitment and moderation practices, it has evolved into a knowledge base for [channels](https://github.com/iptv-org/database), [streams](https://github.com/iptv-org/iptv), and [program guides](https://github.com/iptv-org/epg). To keep all this data organized, we must follow strict structural requirements and set certain standards for participants.

## How to?

### How to add a new stream link to a playlist?

You have several options:

1. Create a new request using this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams:add&projects=&template=1_streams_add.yml&title=Add%3A+) and, if approved, the link will automatically be added to the playlist on the next update.
2. Add the link to the playlist directly using a [pull request](https://github.com/iptv-org/iptv/pulls). See [Playlist Structure](./.github/docs/playlist-structure.md).

Regardless of which option you choose, please perform the following checks before posting your request:

- Make sure the link is not already in the playlist by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- Make sure the link you want to add is stable and works properly. See [Stream Testing](./.github/docs/stream-testing.md).
- Make sure the link does not lead to a [Xtream Codes](./.github/docs/xtream-codes.md) server. [Why don't you accept links to Xtream Codes servers?](./FAQ.md#why-dont-you-accept-links-to-xtream-codes-servers).
- Make sure the link is not [tokenized](./.github/docs/tokenized-links.md).
- Make sure the link leads directly to the broadcast without unnecessary redirects.
- Make sure the channel is in our database. This can be verified through [iptv-org.github.io](https://iptv-org.github.io/). If your desired channel is not on the list, you first must add it via a [request](https://github.com/iptv-org/database/issues/new?template=01_channels_add.yml).
- Make sure the channel isn't on our blocklist. This can also be verified through [iptv-org.github.io](https://iptv-org.github.io/).

If the broadcast only works in certain countries or is periodically interrupted, please indicate this in your request.

**IMPORTANT:** A request without a valid stream ID or a working stream link will be closed immediately.

### How to fix the stream description?

Most of the stream description (channel name, feed name, categories, languages, broadcast area, logo) is loaded from [iptv-org/database](https://github.com/iptv-org/database) using the stream ID.

So there are usually only two reasons for an incorrect description:

- **The stream has an incorrect ID:** In that case, all you need is to update the stream ID in the playlist using this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams%3Aedit&projects=&template=2_streams_edit.yml&title=Edit%3A+). A full list of all supported channels and their corresponding IDs can be found on [iptv-org.github.io](https://iptv-org.github.io/).
- **Our database contains incorrect channel information:** You can verify this on [iptv-org.github.io](https://iptv-org.github.io/). If this is the case, please refer to: [How to edit a database entry?](https://github.com/iptv-org/database/blob/master/CONTRIBUTING.md#how-to-edit-a-database-entry).

Once the changes are approved, the stream description will automatically update across all repositories.

### How to report a broken stream?

Fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=streams:remove&projects=&template=3_streams_report.yml&title=Broken%3A+) and as soon as a working replacement appears, we will add it to the playlist or at least remove the non-working one.

The only thing before publishing your report is to make sure that:

- The link is still in our playlists. You can verify this by [searching](https://github.com/search?q=repo%3Aiptv-org%2Fiptv+http%3A%2F%2Fexample.com&type=code) the repository.
- The link is completely broken and is not just [geo-blocked](https://en.wikipedia.org/wiki/Geo-blocking). See [Stream Testing](./.github/docs/stream-testing.md).

**IMPORTANT:** An issue without a valid stream link will be closed immediately.

### How to remove my channel from the playlist?

To request the removal of a channel link from the repository, please fill out this [form](https://github.com/iptv-org/iptv/issues/new?assignees=&labels=removal+request&projects=&template=6_copyright-claim.yml&title=Remove%3A+) and wait for the request to be reviewed (this usually takes less than 1 business day). If approved, links to the channel will be immediately removed from the repository.

The channel will also be added to our [blocklist](https://github.com/iptv-org/database/blob/master/data/blocklist.csv) to prevent it from reappearing in our playlists in the future.

**IMPORTANT:** We only accept removal requests from channel owners and their official representatives. All other requests will be closed immediately.

## Project Structure

- `.github/`
  - `DISCUSSION_TEMPLATE/`: Contains discussion templates for the repository.
  - `ISSUE_TEMPLATE/`: Contains issue templates for the repository.
  - `workflows/`: Contains [GitHub Actions](https://docs.github.com/en/actions/quickstart) workflows. See [Workflows](./.github/docs/workflows.md).
  - `CODE_OF_CONDUCT.md`: Rules you shouldn't break if you don't want to get banned.
- `.readme/`
  - `preview.png`: Image displayed in the `README.md`.
  - `template.md`: Template configuration for `PLAYLISTS.md`.
- `scripts/`: Contains internal utility scripts used in the repository. See [Scripts](./.github/docs/scripts.md).
- `streams/`: Contains internal playlists with all streams. See [Playlist Structure](./.github/docs/playlist-structure.md).
- `tests/`: Contains test suites to validate project scripts.
- `CONTRIBUTING.md`: The file you are currently reading.
- `PLAYLISTS.md`: Automatically updated list of available playlists.
- `README.md`: Project description and documentation overview.
