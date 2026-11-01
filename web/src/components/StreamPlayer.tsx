"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { CircleAlert, Play } from "lucide-react";
import type { Channel } from "@/lib/channels";

type Props = { channel: Channel | null };

export default function StreamPlayer({ channel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const isDash = channel ? new URL(channel.url).pathname.toLowerCase().endsWith(".mpd") : false;

  useEffect(() => {
    const video = videoRef.current;
    if (!channel || !video) return;

    const pathname = (() => {
      try { return new URL(channel.url).pathname.toLowerCase(); }
      catch { return ""; }
    })();
    const onVideoError = () => setError("The browser could not play this stream.");
    let hls: Hls | undefined;
    video.addEventListener("error", onVideoError);

    if (isDash) {
      // MPEG-DASH playback is planned for a future phase.
    } else if (pathname.endsWith(".mp4")) {
      video.src = channel.url;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Stream failed. It may be offline, geo-restricted, or blocked by CORS.");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.url;
    } else {
      // A browser that supports neither MediaSource nor native HLS cannot play this source.
      // Leave the video controls visible rather than making unsupported requests.
    }

    return () => {
      video.removeEventListener("error", onVideoError);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [channel, isDash]);

  if (!channel) {
    return (
      <div className="flex aspect-video items-center justify-center bg-[#101114] text-zinc-500">
        <div className="text-center"><Play className="mx-auto mb-3 h-12 w-12" /><p>Choose a channel to begin</p></div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      <video ref={videoRef} controls playsInline preload="none" className="h-full w-full bg-black" />
      {(error || isDash) && (
        <div className="absolute inset-x-4 bottom-16 rounded-lg border border-amber-400/20 bg-black/90 p-4 text-sm text-amber-100" role="alert">
          <div className="flex items-start gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{isDash ? "MPEG-DASH is not yet supported. Choose an HLS stream." : error}</span></div>
        </div>
      )}
    </div>
  );
}
