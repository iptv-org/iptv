name: ➕ Add stream link
description: Request to add a new stream link into the playlist
title: 'Add: '
labels: ['streams:add']

body:
  - type: input
    attributes:
      label: Channel ID (required)
      description: Unique channel ID from [iptv-org.github.io](https://iptv-org.github.io/). If you can't find the channel you want in the list, please let us know through this [form](https://github.com/iptv-org/database/issues/new?assignees=&labels=channels%3Aadd&projects=&template=channels_add.yml&title=Add%3A+) before posting your request.
      placeholder: 'BBCAmericaEast.us'
    validations:
      required: true

  - type: input
    attributes:
      label: Channel Name
      description: "Full name of the channel. May contain any characters except: `,`, `[`, `]`."
      placeholder: 'BBC America East'

  - type: input
    attributes:
      label: Stream URL (required)
      description: Link to the stream
      placeholder: 'https://example.com/playlist.m3u8'
    validations:
      required: true

  - type: dropdown
    attributes:
      label: Quality
      description: Maximum video resolution available on the link
      options:
        - 2160p
        - 1280p
        - 1080p
        - 720p
        - 576p
        - 480p
        - 360p

  - type: dropdown
    attributes:
      label: Label
      description: Is there any reason why the broadcast may not work?
      options:
        - 'Not 24/7'
        - 'Geo-blocked'

  - type: input
    attributes:
      label: Timeshift
      placeholder: '0'

  - type: input
    attributes:
      label: HTTP User Agent
      placeholder: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36 Edge/12.246'

  - type: input
    attributes:
      label: HTTP Referrer
      placeholder: 'https://example.com/'

  - type: textarea
    attributes:
      label: Notes
      description: 'Anything else we should know about this broadcast?'

  - type: checkboxes
    attributes:
      label: Contributing Guide
      description: 'Please read this guide before posting your request'
      options:
        - label: I have read [Contributing Guide](https://github.com/iptv-org/iptv/blob/master/CONTRIBUTING.md)
          required: true
