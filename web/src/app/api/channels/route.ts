import { listChannels } from "@/lib/channels";

export async function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country")?.toLowerCase() ?? "tz";
  if (!/^[a-z]{2}$/.test(country)) {
    return Response.json({ error: "Country must be a two-letter code" }, { status: 400 });
  }
  try {
    const channels = await listChannels(country);
    return Response.json({ country, count: channels.length, channels });
  } catch (error) {
    console.error("Failed to read channel playlists", error);
    return Response.json({ error: "Could not load channels" }, { status: 500 });
  }
}
