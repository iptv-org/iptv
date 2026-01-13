#!/usr/bin/env bash
set -euo pipefail

# === Entrées / sorties ===
MY_PLAYLIST="custom2/my.m3u"
OUT_PLAYLIST="custom2/combined.m3u"

# Playlist principale (générée côté iptv-org)
UPSTREAM_URLS=(
  "https://iptv-org.github.io/iptv/index.m3u"
  "https://iptv-org.gitlab.io/iptv/index.m3u"
)

# --- util: enlève la 1re ligne si c'est #EXTM3U (stdin) ---
strip_extm3u_from_stdin() {
  awk 'NR==1 && $0 ~ /^#EXTM3U/ {next} {print}'
}

# --- util: enlève la 1re ligne si c'est #EXTM3U (fichier) ---
strip_extm3u_file() {
  local f="$1"
  if [[ -f "$f" ]] && head -n 1 "$f" | grep -q '^#EXTM3U'; then
    tail -n +2 "$f"
  elif [[ -f "$f" ]]; then
    cat "$f"
  fi
}

mkdir -p "$(dirname "$OUT_PLAYLIST")"

# === Téléchargement upstream ===
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

ok=0
used_url=""
for url in "${UPSTREAM_URLS[@]}"; do
  # -f : fail on HTTP errors ; -sS : silent sauf erreurs ; -L : follow redirects
  if curl -fsSL "$url" -o "$TMP"; then
    used_url="$url"
    ok=1
    break
  fi
done

if [[ $ok -ne 1 ]]; then
  echo "Erreur: impossible de télécharger la playlist principale."
  echo "URLs testées:"
  for url in "${UPSTREAM_URLS[@]}"; do
    echo " - $url"
  done
  exit 1
fi

if [[ ! -s "$TMP" ]]; then
  echo "Erreur: téléchargement OK mais fichier vide depuis: $used_url"
  exit 1
fi

# === Génération combined ===
{
  echo "#EXTM3U"
  cat "$TMP" | strip_extm3u_from_stdin
  echo ""
  if [[ -f "$MY_PLAYLIST" ]]; then
    strip_extm3u_file "$MY_PLAYLIST"
  else
    echo "# NOTE: fichier perso absent ($MY_PLAYLIST)."
  fi
} > "$OUT_PLAYLIST"

echo "OK -> $OUT_PLAYLIST généré (upstream: $used_url + local: $MY_PLAYLIST)"
echo "Taille: $(wc -c < "$OUT_PLAYLIST") octets"
