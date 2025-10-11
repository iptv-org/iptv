export type LogItem = {
  type: string
  filepath: string
  count: number
}

export class LogParser {
  parse(content: string): LogItem[] {
    if (!content) return []
    const lines = content.split('\n')

    return lines.map(line => (line ? JSON.parse(line) : null)).filter(l => l)
  }
}
