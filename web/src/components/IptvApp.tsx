"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight, CircleAlert, Globe2, MonitorPlay, Radio,
  RefreshCw, Search, Tv2, Wifi,
} from "lucide-react";
import type { Channel, Country } from "@/lib/channels";
import StreamPlayer from "@/components/StreamPlayer";

function formatName(channel: Channel) {
  return channel.name.replace(/\s*\((?:\d+p|\d+x\d+)\)/gi, "").trim();
}

export default function IptvApp() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountry] = useState("tz");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [query, setQuery] = useState("");
  const [onlyHls, setOnlyHls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/countries", { signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data: { countries: Country[] }) => setCountries(data.countries))
      .catch((err: unknown) => { if (!(err instanceof Error && err.name === "AbortError")) console.error("Country list unavailable"); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/channels?country=${encodeURIComponent(country)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json() as Promise<{ channels: Channel[] }>;
      })
      .then((data) => {
        setChannels(data.channels);
        setSelected(data.channels[0] ?? null);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Could not load channels. Verify the original streams/ directory is present.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [country, reload]);

  const visible = useMemo(() => channels.filter((channel) => {
    const matchesSearch = `${channel.name} ${channel.group ?? ""} ${channel.tvgId ?? ""}`
      .toLowerCase().includes(query.toLowerCase().trim());
    const matchesFormat = !onlyHls || /\.m3u8(?:$|[?#])/i.test(channel.url);
    return matchesSearch && matchesFormat;
  }), [channels, query, onlyHls]);

  const currentCountry = countries.find((item) => item.code === country)?.name ?? country.toUpperCase();

  return (
    <div className="min-h-screen bg-[#08090b] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0c0d0f]">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2 text-black"><Tv2 size={23} strokeWidth={2.4} /></div>
            <div><div className="text-lg font-black tracking-tight">IPTV<span className="text-zinc-400">/LIVE</span></div><div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Global television</div></div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300"><span className="h-2 w-2 rounded-full bg-rose-500" />Live channel directory</div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-5 pb-16 pt-9 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500"><Radio size={14} /> Real-time entertainment</div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Explore live television<span className="text-zinc-500">.</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Browse public stream listings by country, select a channel, and watch supported streams directly in your browser.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400"><Wifi size={16} /> From your existing M3U collection</div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
          <section className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111215] lg:h-[760px]" aria-label="Channel directory">
            <div className="border-b border-white/10 p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Channels</h2><button aria-label="Reload channels" title="Reload channels" className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white" onClick={() => { setLoading(true); setError(null); setReload((n) => n + 1); }}><RefreshCw size={17} /></button></div>
              <label className="mb-2 flex items-center gap-2 text-xs text-zinc-400" htmlFor="country"><Globe2 size={14} /> Country</label>
              <select id="country" value={country} onChange={(e) => { setCountry(e.target.value); setQuery(""); setLoading(true); setError(null); }} className="mb-4 w-full rounded-xl border border-white/10 bg-[#1c1d21] px-4 py-3 text-sm text-white outline-none focus:border-white/40">
                {countries.length === 0 && <option value="tz">Tanzania</option>}
                {countries.map((item) => <option key={item.code} value={item.code}>{item.name} ({item.code.toUpperCase()})</option>)}
              </select>
              <div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-zinc-500" /><input aria-label="Search channels" placeholder="Search a TV channel..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#1c1d21] py-3 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none" /></div>
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={onlyHls} onChange={(e) => setOnlyHls(e.target.checked)} className="accent-white" /> Show HLS streams only</label>
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500"><span>{currentCountry}</span><span>{visible.length} channels</span></div>
            </div>
            <div className="min-h-[350px] flex-1 space-y-1 overflow-y-auto p-2">
              {loading && <p className="p-5 text-sm text-zinc-400">Loading channel directory...</p>}
              {!loading && error && <p role="alert" className="flex gap-2 p-5 text-sm text-amber-200"><CircleAlert size={17} className="shrink-0" />{error}</p>}
              {!loading && !error && visible.length === 0 && <p className="p-5 text-sm text-zinc-400">No matching channels. Try a different country, search, or format filter.</p>}
              {!loading && !error && visible.map((channel) => (
                <button key={channel.id} onClick={() => setSelected(channel)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${selected?.id === channel.id ? "bg-white text-black" : "text-zinc-200 hover:bg-white/10"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${selected?.id === channel.id ? "bg-black/10" : "bg-white/10"}`}>{formatName(channel).slice(0, 2).toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{formatName(channel)}</span><span className={`block truncate text-[11px] ${selected?.id === channel.id ? "text-zinc-600" : "text-zinc-500"}`}>{channel.group || channel.tvgId || channel.sourceFile}</span></span>
                  <MonitorPlay size={17} className="shrink-0 opacity-60" />
                </button>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-white/10 bg-[#111215] p-3 sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-4 px-2 pt-1"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"><span className="h-2 w-2 rounded-full bg-rose-500" /> Now watching</div><h2 className="mt-2 text-xl font-semibold sm:text-2xl">{selected ? formatName(selected) : "Select a channel"}</h2></div><span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">LIVE TV</span></div>
            <StreamPlayer key={selected?.id ?? "none"} channel={selected} />
            <div className="mt-5 rounded-xl border border-white/10 bg-[#17181b] p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-semibold">Stream information</h3>
              <div className="grid gap-3 text-sm text-zinc-400 sm:grid-cols-2"><div>Country: <span className="text-white">{currentCountry}</span></div><div>Source: <span className="text-white">{selected?.sourceFile || "—"}</span></div></div>
              {selected && <a href={selected.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white underline decoration-zinc-600 underline-offset-4 hover:decoration-white">Open original stream URL <ArrowUpRight size={15} /></a>}
            </div>
            <p className="mt-5 px-2 text-xs leading-6 text-zinc-500">Some streams are unavailable, restricted to certain countries, or do not permit cross-origin browser playback. The app does not bypass provider restrictions or host the TV content.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
