import fs from 'fs'
import path from 'path'

export class Markdown {
  filepath: string

  constructor(filepath: string) {
    this.filepath = filepath
  }

  compile() {
    const config = JSON.parse(fs.readFileSync(this.filepath, 'utf8'))
    const workingDir = process.cwd() 
    
    config.files.forEach((templateFile: string) => {
      const templatePath = path.resolve(workingDir, templateFile)
      const content = fs.readFileSync(templatePath, 'utf8')
      const processedContent = this.processIncludes(content, workingDir)
      
      if (config.build) {
        const outputPath = path.resolve(workingDir, config.build)
        fs.writeFileSync(outputPath, processedContent, 'utf8')
      }
    })
  }

  private processIncludes(content: string, baseDir: string): string {
    const includeRegex = /#include\s+"([^"]+)"/g
    
    return content.replace(includeRegex, (match, includePath) => {
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
