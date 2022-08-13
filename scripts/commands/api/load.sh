#!/bin/bash

mkdir -p scripts/data 
curl -L -o scripts/data/blocklist.json https://iptv-org.github.io/api/blocklist.json 
curl -L -o scripts/data/categories.json https://iptv-org.github.io/api/categories.json 
curl -L -o scripts/data/channels.json https://iptv-org.github.io/api/channels.json 
curl -L -o scripts/data/streams.json https://iptv-org.github.io/api/streams.json 
curl -L -o scripts/data/countries.json https://iptv-org.github.io/api/countries.json 
curl -L -o scripts/data/guides.json https://iptv-org.github.io/api/guides.json 
curl -L -o scripts/data/languages.json https://iptv-org.github.io/api/languages.json 
curl -L -o scripts/data/regions.json https://iptv-org.github.io/api/regions.json 
curl -L -o scripts/data/subdivisions.json https://iptv-org.github.io/api/subdivisions.json