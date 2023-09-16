import { File, Collection } from './'
import * as path from 'path'
import fs from 'fs-extra'
import { glob } from 'glob'

export class Storage {
  rootDir: string

  constructor(rootDir?: string) {
    this.rootDir = path.normalize(rootDir || './')
  }

  list(pattern: string): Promise<string[]> {
    return glob(pattern, {
      cwd: this.rootDir
    })
  }

  async createDir(dir: string): Promise<void> {
    if (await fs.exists(dir)) return

    await fs.mkdir(dir, { recursive: true }).catch(console.error)
  }

  async load(filepath: string): Promise<any> {
    return this.read(filepath)
  }

  async read(filepath: string): Promise<any> {
    const absFilepath = path.join(this.rootDir, filepath)

    return await fs.readFile(absFilepath, { encoding: 'utf8' })
  }

  async json(filepath: string): Promise<any> {
    const absFilepath = path.join(this.rootDir, filepath)
    const content = await fs.readFile(absFilepath, { encoding: 'utf8' })

    return JSON.parse(content)
  }

  async exists(filepath: string): Promise<boolean> {
    const absFilepath = path.join(this.rootDir, filepath)

    return await fs.exists(absFilepath)
  }

  async write(filepath: string, data: string = ''): Promise<void> {
    const absFilepath = path.join(this.rootDir, filepath)
    const dir = path.dirname(absFilepath)

    await this.createDir(dir)
    await fs.writeFile(absFilepath, data, { encoding: 'utf8', flag: 'w' })
  }

  async append(filepath: string, data: string = ''): Promise<void> {
    const absFilepath = path.join(this.rootDir, filepath)

    await fs.appendFile(absFilepath, data, { encoding: 'utf8', flag: 'w' })
  }

  async clear(filepath: string): Promise<void> {
    await this.write(filepath)
  }

  async createStream(filepath: string): Promise<NodeJS.WriteStream> {
    const absFilepath = path.join(this.rootDir, filepath)
    const dir = path.dirname(absFilepath)

    await this.createDir(dir)

    return fs.createWriteStream(absFilepath) as unknown as NodeJS.WriteStream
  }

  async save(filepath: string, content: string): Promise<void> {
    await this.write(filepath, content)
  }

  async saveFile(file: File): Promise<void> {
    await this.write(file.filepath, file.content)
  }
}
