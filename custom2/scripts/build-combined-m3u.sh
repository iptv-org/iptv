#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_PLAYLIST="index.m3u"
CUSTOM_PLAYLIST="custom2/my.m3u"
OUT_PLAYLIST="custom2/combined.m3u"

if [[ ! -f "$UPSTREAM_PLAYLIST" ]]; then
  echo "Erreur: $UPSTREAM_PLAYLIST introuvable. (Le merge upstream a-t-il eu lieu ?)"
  exit 1
fi

mkdir -p "$(dirname "$OUT_PLAYLIST")"

# Fonction: enlève uniquement la 1re ligne si c'est #EXTM3U
strip_extm3u() {
  local f="$1"
  if [[ -f "$f" ]] && head -n 1 "$f" | grep -q '^#EXTM3U'; then
    tail -n +2 "$f"
  elif [[ -f "$f" ]]; then
    cat "$f"
  fi
}

{
  echo "#EXTM3U"
  strip_extm3u "$UPSTREAM_PLAYLIST"
  echo ""
  # Si ton fichier perso n’existe pas encore, on ne casse pas le build
  if [[ -f "$CUSTOM_PLAYLIST" ]]; then
    strip_extm3u "$CUSTOM_PLAYLIST"
  fi
} > "$OUT_PLAYLIST"

echo "OK -> $OUT_PLAYLIST généré"
