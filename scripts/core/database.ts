import Datastore from '@seald-io/nedb'
import * as path from 'path'

export class Database {
  rootDir: string

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  async load(filepath: string) {
    const absFilepath = path.join(this.rootDir, filepath)

    return new Datastore({
      filename: path.resolve(absFilepath),
      autoload: true,
      onload: (error: Error): any => {
        if (error) console.error(error.message)
      }
    })
  }
}
