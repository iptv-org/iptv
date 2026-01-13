#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_URL="https://iptv-org.github.io/iptv/index.m3u"
MY_PLAYLIST="custom2/my.m3u"
OUT_PLAYLIST="custom2/combined.m3u"

mkdir -p "$(dirname "$OUT_PLAYLIST")"

strip_extm3u_from_stdin() {
  # supprime seulement la 1re ligne si c'est #EXTM3U
  awk 'NR==1 && $0 ~ /^#EXTM3U/ {next} {print}'
}

strip_extm3u_file() {
  local f="$1"
  if [[ -f "$f" ]] && head -n 1 "$f" | grep -q '^#EXTM3U'; then
    tail -n +2 "$f"
  elif [[ -f "$f" ]]; then
    cat "$f"
  fi
}

{
  echo "#EXTM3U"
  # upstream (download)
  curl -fsSL "$UPSTREAM_URL" | strip_extm3u_from_stdin
  echo ""
  # tes ajouts
  if [[ -f "$MY_PLAYLIST" ]]; then
    strip_extm3u_file "$MY_PLAYLIST"
  fi
} > "$OUT_PLAYLIST"

echo "OK -> $OUT_PLAYLIST généré depuis $UPSTREAM_URL + $MY_PLAYLIST"
