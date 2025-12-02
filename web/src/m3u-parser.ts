export interface Stream {
  name: string;
  url: string;
  tvgId?: string;
  groupTitle?: string;
  countryCode?: string;
}

export interface Group {
  name: string;
  streams: Stream[];
}

/**
 * Fetch and parse the preprocessed streams.json file
 */
export async function fetchGroups(url: string = '/streams.json'): Promise<Group[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch streams: ${response.statusText}`);
  }
  return response.json();
}


