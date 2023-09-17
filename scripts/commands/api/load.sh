#!/bin/bash

mkdir -p temp/data 
curl -L -o temp/data/blocklist.json https://iptv-org.github.io/api/blocklist.json 
curl -L -o temp/data/categories.json https://iptv-org.github.io/api/categories.json 
curl -L -o temp/data/channels.json https://iptv-org.github.io/api/channels.json
curl -L -o temp/data/countries.json https://iptv-org.github.io/api/countries.json 
curl -L -o temp/data/languages.json https://iptv-org.github.io/api/languages.json 
curl -L -o temp/data/regions.json https://iptv-org.github.io/api/regions.json 
curl -L -o temp/data/subdivisions.json https://iptv-org.github.io/api/subdivisions.json