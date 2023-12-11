import markdownInclude from 'markdown-include'

export class Markdown {
  filepath: string

  constructor(filepath: string) {
    this.filepath = filepath
  }

  compile() {
    markdownInclude.compileFiles(this.filepath)
  }
}
