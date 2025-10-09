import { URL } from 'node:url'

interface ProxyParserResult {
  protocol: string | null
  auth?: {
    username?: string
    password?: string
  }
  host: string
  port: number | null
}

export class ProxyParser {
  parse(_url: string): ProxyParserResult {
    const parsed = new URL(_url)

    const result: ProxyParserResult = {
      protocol: parsed.protocol.replace(':', '') || null,
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : null
    }

    if (parsed.username || parsed.password) {
      result.auth = {}
      if (parsed.username) result.auth.username = parsed.username
      if (parsed.password) result.auth.password = parsed.password
    }

    return result
  }
}
