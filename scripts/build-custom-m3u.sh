#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_PLAYLIST="index.m3u"
MY_PLAYLIST="custom2/my.m3u"
OUT_PLAYLIST="custom.m3u"

if [[ ! -f "$UPSTREAM_PLAYLIST" ]]; then
  echo "Erreur: $UPSTREAM_PLAYLIST introuvable."
  exit 1
fi

strip_extm3u() {
  local f="$1"
  if [[ -f "$f" ]] && head -n 1 "$f" | grep -q '^#EXTM3U'; then
    tail -n +2 "$f"
  elif [[ -f "$f" ]]; then
    cat "$f"
  fi
}

mkdir -p "$(dirname "$MY_PLAYLIST")"

{
  echo "#EXTM3U"
  strip_extm3u "$UPSTREAM_PLAYLIST"
  echo ""
  if [[ -f "$MY_PLAYLIST" ]]; then
    strip_extm3u "$MY_PLAYLIST"
  fi
} > "$OUT_PLAYLIST"

echo "OK -> $OUT_PLAYLIST généré"
