import { listCountries } from "@/lib/channels";

export async function GET() {
  try {
    return Response.json({ countries: await listCountries() });
  } catch (error) {
    console.error("Failed to read countries", error);
    return Response.json({ error: "Could not load country playlists" }, { status: 500 });
  }
}
