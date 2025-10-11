import path from 'path'
import fs from 'fs'

type MarkdownConfig = {
  build: string
  template: string
}

export class Markdown {
  build: string
  template: string

  constructor(config: MarkdownConfig) {
    this.build = config.build
    this.template = config.template
  }

  compile() {
    const workingDir = process.cwd()

    const templatePath = path.resolve(workingDir, this.template)
    const template = fs.readFileSync(templatePath, 'utf8')
    const processedContent = this.processIncludes(template, workingDir)

    if (this.build) {
      const outputPath = path.resolve(workingDir, this.build)
      fs.writeFileSync(outputPath, processedContent, 'utf8')
    }
  }

  private processIncludes(template: string, baseDir: string): string {
    const includeRegex = /#include\s+"([^"]+)"/g

    return template.replace(includeRegex, (match, includePath) => {
      try {
        const fullPath = path.resolve(baseDir, includePath)
        const includeContent = fs.readFileSync(fullPath, 'utf8')
        return this.processIncludes(includeContent, baseDir)
      } catch (error) {
        console.warn(`Warning: Could not include file ${includePath}: ${error}`)
        return match
      }
    })
  }
}
