export interface Stream {
  name: string;
  url: string;
  tvgId?: string;
  groupTitle?: string;
  countryCode?: string;
  logo?: string;
}

export interface Group {
  name: string;
  streams: Stream[];
}

/**
 * Fetch and parse the M3U playlist from the given URL
 */
export async function fetchGroups(url: string = 'https://iptv-org.github.io/iptv/index.m3u'): Promise<Group[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch streams: ${response.statusText}`);
  }
  const text = await response.text();
  return parseM3U(text);
}

function parseM3U(content: string): Group[] {
  const lines = content.split('\n');
  const groups: Map<string, Stream[]> = new Map();

  let currentStream: Partial<Stream> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line
      // Example: #EXTINF:-1 tvg-id="Channel.us" tvg-country="US" tvg-logo="..." group-title="News",Channel Name
      const stream: Partial<Stream> = {};
      
      // Extract metadata using regex
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      if (tvgIdMatch) stream.tvgId = tvgIdMatch[1];

      const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/);
      if (tvgCountryMatch) stream.countryCode = tvgCountryMatch[1].toLowerCase();

      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      if (tvgLogoMatch) stream.logo = tvgLogoMatch[1];

      const groupTitleMatch = line.match(/group-title="([^"]*)"/);
      if (groupTitleMatch) stream.groupTitle = groupTitleMatch[1];

      // Extract name (everything after the last comma)
      const nameParts = line.split(',');
      stream.name = nameParts[nameParts.length - 1].trim();

      currentStream = stream;
    } else if (line.startsWith('#')) {
      // Ignore other directives
      continue;
    } else if (line.length > 0) {
      // Assume this is the URL
      if (currentStream.name) {
        const stream: Stream = {
          name: currentStream.name,
          url: line,
          tvgId: currentStream.tvgId,
          groupTitle: currentStream.groupTitle,
          countryCode: currentStream.countryCode,
          logo: currentStream.logo
        };

        const groupName = stream.groupTitle || 'Ungrouped';
        
        if (!groups.has(groupName)) {
          groups.set(groupName, []);
        }
        groups.get(groupName)!.push(stream);
      }
      currentStream = {};
    }
  }

  // Convert Map to Group[] and sort
  const result: Group[] = [];
  
  // Sort groups alphabetically
  const sortedGroupNames = Array.from(groups.keys()).sort();
  
  for (const name of sortedGroupNames) {
    result.push({
      name,
      streams: groups.get(name)!
    });
  }

  return result;
}
