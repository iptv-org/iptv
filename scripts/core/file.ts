import * as path from 'path'

export class File {
  filepath: string
  content: string

  constructor(filepath: string, content?: string) {
    this.filepath = path.normalize(filepath)
    this.content = content || ''
  }

  getFilename() {
    return path.parse(this.filepath).name
  }

  dirname() {
    return path.dirname(this.filepath)
  }

  basename() {
    return path.basename(this.filepath)
  }

  append(data: string) {
    this.content = this.content + data
  }

  extension() {
    return this.filepath.split('.').pop()
  }
}
