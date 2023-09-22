import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Playlist, Language, Stream } from '../models'
import { PUBLIC_DIR } from '../constants'

type LanguagesGeneratorProps = { streams: Collection; logger: Logger }

export class LanguagesGenerator implements Generator {
  streams: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, logger }: LanguagesGeneratorProps) {
    this.streams = streams
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .orderBy(stream => stream.getTitle())
      .filter(stream => stream.isSFW())

    let languages = new Collection()
    streams.forEach((stream: Stream) => {
      languages = languages.concat(stream.languages)
    })

    languages
      .uniqBy((language: Language) => language.code)
      .orderBy((language: Language) => language.name)
      .forEach(async (language: Language) => {
        const languageStreams = streams.filter(stream => stream.hasLanguage(language))

        if (languageStreams.isEmpty()) return

        const playlist = new Playlist(languageStreams, { public: true })
        const filepath = `languages/${language.code}.m3u`
        await this.storage.save(filepath, playlist.toString())
        this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
      })

    const undefinedStreams = streams.filter(stream => stream.noLanguages())

    if (undefinedStreams.isEmpty()) return

    const playlist = new Playlist(undefinedStreams, { public: true })
    const filepath = 'languages/undefined.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
  }
}
