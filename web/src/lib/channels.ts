import { promises as fs } from "node:fs";
import * as path from "node:path";

export type Channel = {
  id: string;
  name: string;
  country: string;
  url: string;
  tvgId: string | null;
  logo: string | null;
  group: string | null;
  sourceFile: string;
};

export type Country = { code: string; name: string };

// Next.js is started from /iptv/web, while original playlists live in /iptv/streams.
const streamsDirectory = path.resolve(process.cwd(), "..", "streams");
const playlistPattern = /^([a-z]{2})(?:_[a-z0-9_-]+)?\.m3u$/i;

function getAttribute(line: string, key: string): string | null {
  // All keys passed by this module are constant names (not user input).
  return new RegExp(`${key}="([^"]*)"`, "i").exec(line)?.[1] ?? null;
}

function isPlayableWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export async function listCountries(): Promise<Country[]> {
  const files = await fs.readdir(streamsDirectory);
  const codes = new Set<string>();
  for (const file of files) {
    const match = file.match(playlistPattern);
    if (match) codes.add(match[1].toLowerCase());
  }
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  return [...codes]
    .map((code) => ({ code, name: displayNames.of(code.toUpperCase()) ?? code.toUpperCase() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listChannels(country: string): Promise<Channel[]> {
  // Only country codes are accepted. Never allow client-provided filesystem paths.
  if (!/^[a-z]{2}$/.test(country)) return [];

  const filenames = (await fs.readdir(streamsDirectory)).filter((filename) => {
    const match = filename.match(playlistPattern);
    return match?.[1].toLowerCase() === country;
  });

  const channels: Channel[] = [];
  for (const filename of filenames) {
    const content = await fs.readFile(path.join(streamsDirectory, filename), "utf8");
    const lines = content.split(/\r?\n/);
    let pending: Omit<Channel, "id" | "url"> | null = null;

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      const line = lines[lineNumber].trim();
      if (line.startsWith("#EXTINF:")) {
        const delimiter = line.lastIndexOf(",");
        if (delimiter < 0) {
          pending = null;
          continue;
        }
        pending = {
          name: line.slice(delimiter + 1).trim() || "Unnamed channel",
          country,
          tvgId: getAttribute(line, "tvg-id"),
          logo: getAttribute(line, "tvg-logo"),
          group: getAttribute(line, "group-title"),
          sourceFile: filename,
        };
      } else if (line && !line.startsWith("#")) {
        if (pending && isPlayableWebUrl(line)) {
          channels.push({ ...pending, id: `${filename}:${lineNumber}`, url: line });
        }
        pending = null;
      }
    }
  }

  return channels.sort((a, b) => a.name.localeCompare(b.name));
}
