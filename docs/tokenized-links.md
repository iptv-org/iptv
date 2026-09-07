# Tokenized Links

Tokenized links are personalized hyperlinks that contain a unique, machine-generated string of characters (a token) to grant access to an IPTV stream.

Examples:

- `https://example.com/index.m3u8?token=9f192891-eca5-2435-b9cb-147f376cdc1e`
- `https://example.com/index.m3u8?s=aWE0maGFzaF92YWx1`
- `https://example.com/index.m3u8?wmsAuthSign=c2bWU9Ni8yMC8yMDIVydmVyX3Rp2IDc6MDk6MjAgUmFsaWRtaWE0maGFzaF92YWx1ZTE5SkNSQkhqUG5JZVRRPT0md51dGVzPTMwJmlkPTZhMzZlNT1lRzlsZG4rOXYwZTIzNDk`

The tokens in these links are periodically updated by the provider, causing the link to stop working shortly after.

In some cases, the link also includes an expiration date in [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) format, which indicates exactly when the link will stop working:

`https://example.com/index.m3u8?token=2IDc6MDk6MjAgUmF&e=1813661332` _(`1813661332` => `2027-06-22T10:48:52.000Z`)_
