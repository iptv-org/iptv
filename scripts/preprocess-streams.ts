import * as fs from 'fs';
import * as path from 'path';

// Define interfaces for our data structures
interface Stream {
  name: string;
  url: string;
  tvgId?: string;
  groupTitle?: string;
  countryCode?: string;
}

interface Group {
  name: string;
  streams: Stream[];
}

// Main function to preprocess the M3U file
async function preprocess() {
  console.log('Starting preprocessing of index.m3u...');

  const m3uPath = path.join(__dirname, '../../streams/index.m3u');
  const outputPath = path.join(__dirname, '../../web/public/streams.json');

  if (!fs.existsSync(m3uPath)) {
    console.error(`Error: M3U file not found at ${m3uPath}`);
    process.exit(1);
  }

  const m3uContent = fs.readFileSync(m3uPath, 'utf-8');
  const lines = m3uContent.split('\n');

  const streams: Stream[] = [];
  let currentStream: Partial<Stream> = {};

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const info = line.substring(line.indexOf(':') + 1).trim();
      const [attributes, name] = info.substring(info.indexOf(',') + 1).split(',');

      currentStream = { name: name ? name.trim() : 'Unnamed Stream' };

      const tvgIdMatch = attributes.match(/tvg-id="([^"]*)"/);
      if (tvgIdMatch) currentStream.tvgId = tvgIdMatch[1];

      const groupTitleMatch = attributes.match(/group-title="([^"]*)"/);
      if (groupTitleMatch) currentStream.groupTitle = groupTitleMatch[1];

      // Extract country code from tvg-id (e.g., "1TV.ge@SD")
      if (currentStream.tvgId) {
        const parts = currentStream.tvgId.split('.');
        if (parts.length > 1) {
          const countryPart = parts[parts.length - 1];
          const atIndex = countryPart.indexOf('@');
          const code = atIndex !== -1 ? countryPart.substring(0, atIndex) : countryPart;
          if (code.length === 2) {
            currentStream.countryCode = code.toLowerCase();
          }
        }
      }

    } else if (line.trim() && !line.startsWith('#')) {
      currentStream.url = line.trim();
      if (currentStream.name && currentStream.url) {
        streams.push(currentStream as Stream);
      }
      currentStream = {};
    }
  }

  console.log(`Found ${streams.length} streams.`);

  // Group streams by group-title
  const groups: { [key: string]: Group } = {};
  for (const stream of streams) {
    const groupName = stream.groupTitle || 'Undefined';
    if (!groups[groupName]) {
      groups[groupName] = { name: groupName, streams: [] };
    }
    groups[groupName].streams.push(stream);
  }

  const groupedData = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));

  // Create public directory if it doesn't exist
  const publicDir = path.join(__dirname, '../../web/public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(outputPath, JSON.stringify(groupedData, null, 2));

  console.log(`Successfully preprocessed streams and saved to ${outputPath}`);
  console.log(`Found ${groupedData.length} groups.`);
}

preprocess().catch(error => {
  console.error('An error occurred during preprocessing:', error);
  process.exit(1);
});

