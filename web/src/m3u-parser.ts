/**
 * Stream interface representing an IPTV stream
 */
export interface Stream {
  id: string
  name: string
  url: string
  tvgId?: string
  quality?: string
}

/**
 * Country file info for loading streams
 */
export interface CountryFile {
  code: string
  name: string
  filename: string
}

/**
 * Parse M3U playlist content into an array of Stream objects
 */
export function parseM3U(content: string): Stream[] {
  const streams: Stream[] = []
  const lines = content.split('\n')
  
  let currentStream: Partial<Stream> | null = null
  let streamId = 0
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.startsWith('#EXTINF:')) {
      // Parse EXTINF line
      const match = trimmedLine.match(/#EXTINF:-?\d+\s*(.*?),(.*)/)
      if (match) {
        const attributes = match[1]
        const name = match[2].trim()
        
        // Extract tvg-id if present
        const tvgIdMatch = attributes.match(/tvg-id="([^"]*)"/)
        const tvgId = tvgIdMatch ? tvgIdMatch[1] : undefined
        
        // Extract quality from name if present (e.g., "(720p)", "(1080p)")
        const qualityMatch = name.match(/\((\d+p)\)/)
        const quality = qualityMatch ? qualityMatch[1] : undefined
        
        currentStream = {
          id: `stream-${streamId++}`,
          name,
          tvgId,
          quality
        }
      }
    } else if (trimmedLine && !trimmedLine.startsWith('#') && currentStream) {
      // This is the URL line
      currentStream.url = trimmedLine
      streams.push(currentStream as Stream)
      currentStream = null
    }
  }
  
  return streams
}

/**
 * Get the list of available country M3U files
 */
export function getCountryList(): CountryFile[] {
  // This is a static list of common countries
  // In a real implementation, this could be fetched from the repository
  return [
    { code: 'us', name: 'United States', filename: 'us.m3u' },
    { code: 'uk', name: 'United Kingdom', filename: 'uk.m3u' },
    { code: 'de', name: 'Germany', filename: 'de.m3u' },
    { code: 'fr', name: 'France', filename: 'fr.m3u' },
    { code: 'es', name: 'Spain', filename: 'es.m3u' },
    { code: 'it', name: 'Italy', filename: 'it.m3u' },
    { code: 'br', name: 'Brazil', filename: 'br.m3u' },
    { code: 'mx', name: 'Mexico', filename: 'mx.m3u' },
    { code: 'ca', name: 'Canada', filename: 'ca.m3u' },
    { code: 'au', name: 'Australia', filename: 'au.m3u' },
    { code: 'jp', name: 'Japan', filename: 'jp.m3u' },
    { code: 'kr', name: 'South Korea', filename: 'kr.m3u' },
    { code: 'in', name: 'India', filename: 'in.m3u' },
    { code: 'ru', name: 'Russia', filename: 'ru.m3u' },
    { code: 'cn', name: 'China', filename: 'cn.m3u' }
  ]
}

/**
 * Fetch and parse an M3U file from a URL
 */
export async function fetchM3U(url: string): Promise<Stream[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch M3U: ${response.statusText}`)
  }
  const content = await response.text()
  return parseM3U(content)
}
