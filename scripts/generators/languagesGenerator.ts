import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Playlist, Stream } from '../models'
import { Collection } from '@freearhey/core'
import { Generator } from './generator'
import * as sdk from '@iptv-org/sdk'

type LanguagesGeneratorProps = { streams: Collection<Stream>; logFile: File }

export class LanguagesGenerator implements Generator {
  streams: Collection<Stream>
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: LanguagesGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const streams: Collection<Stream> = this.streams
      .sortBy((stream: Stream) => stream.title)
      .filter((stream: Stream) => stream.isSFW())

    const languages = new Collection<sdk.Models.Language>()
    streams.forEach((stream: Stream) => {
      stream.getLanguages().forEach((language: sdk.Models.Language) => {
        languages.add(language)
      })
    })

    languages
      .filter(Boolean)
      .uniqBy((language: sdk.Models.Language) => language.code)
      .sortBy((language: sdk.Models.Language) => language.name)
      .forEach(async (language: sdk.Models.Language) => {
        const languageStreams = streams.filter((stream: Stream) => stream.hasLanguage(language))

        if (languageStreams.isEmpty()) return

        const playlist = new Playlist(languageStreams, { public: true })
        const filepath = `languages/${language.code}.m3u`
        await this.storage.save(filepath, playlist.toString())
        this.logFile.append(
          JSON.stringify({ type: 'language', filepath, count: playlist.streams.count() }) + EOL
        )
      })

    const undefinedStreams = streams.filter((stream: Stream) => stream.getLanguages().isEmpty())
    if (undefinedStreams.isEmpty()) return

    const playlist = new Playlist(undefinedStreams, { public: true })
    const filepath = 'languages/undefined.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logFile.append(
      JSON.stringify({ type: 'language', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
