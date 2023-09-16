export type LogItem = {
  filepath: string
  count: number
}

export class LogParser {
  parse(content: string): any[] {
    if (!content) return []
    const lines = content.split('\n')

    return lines.map(line => (line ? JSON.parse(line) : null)).filter(l => l)
  }
}
