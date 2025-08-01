import { Collection, Storage, File } from '@freearhey/core'
import { Playlist, Language, Stream } from '../models'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type LanguagesGeneratorProps = { streams: Collection; logFile: File }

export class LanguagesGenerator implements Generator {
  streams: Collection
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: LanguagesGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .orderBy((stream: Stream) => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())

    let languages = new Collection()
    streams.forEach((stream: Stream) => {
      languages = languages.concat(stream.getLanguages())
    })

    languages
      .filter(Boolean)
      .uniqBy((language: Language) => language.code)
      .orderBy((language: Language) => language.name)
      .forEach(async (language: Language) => {
        const languageStreams = streams.filter((stream: Stream) => stream.hasLanguage(language))

        if (languageStreams.isEmpty()) return

        const playlist = new Playlist(languageStreams, { public: true })
        const filepath = `languages/${language.code}.m3u`
        await this.storage.save(filepath, playlist.toString())
        this.logFile.append(
          JSON.stringify({ type: 'language', filepath, count: playlist.streams.count() }) + EOL
        )
      })

    const undefinedStreams = streams.filter((stream: Stream) => !stream.hasLanguages())

    if (undefinedStreams.isEmpty()) return

    const playlist = new Playlist(undefinedStreams, { public: true })
    const filepath = 'languages/undefined.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logFile.append(
      JSON.stringify({ type: 'language', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
