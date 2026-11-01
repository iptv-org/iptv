# Curation Rules

This document defines how the repository should be curated and maintained.

## Core principles

- Keep the repo focused on IPTV channels only.
- Prefer quality over quantity.
- Remove broken or duplicate links.
- Organize entries by category and region.
- Keep metadata consistent and understandable.

## Category organization

Use meaningful groups such as:

- News
- Sports
- Entertainment
- Movies
- Kids
- Documentary
- Local/Regional
- International

## File organization

Place curated collection files in the `custom/collections/` directory.

Example:

```text
custom/
  collections/
    news.m3u
    sports.m3u
    kids.m3u
```

## Entry quality standards

For every channel, check:

- the stream URL is active
- the channel name is readable and consistent
- the category matches the content
- duplicates are removed
- broken entries are removed or archived

## Maintenance workflow

1. Review the playlist entries.
2. Remove invalid links.
3. File duplicates together.
4. Reorganize by category if needed.
5. Validate the playlist file.
6. Commit in a clear, descriptive message.

## Contribution guideline

When submitting a contribution:

- keep one focused goal per change
- avoid mixing unrelated playlist categories in one update
- document why the entry was added
- ensure validation passes before merging

## Recommended validation

```bash
npm run playlist:validate
npm run playlist:lint
npm run test
```
