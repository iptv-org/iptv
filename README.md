# IPTV Custom Curation

This branch is a curated IPTV fork focused on quality, organization, and maintainability.

The goal is to keep this repository useful for real users by organizing channels into intentional categories, documenting legal use, and improving the overall quality of the collection.

## What this branch adds

- curated channel categories
- clearer metadata and source organization
- improved documentation for maintainers
- a cleaner structure for future updates
- legal and usage guidance for public stream sources

## Repository structure

```text
.
├── README.md
├── docs/
│   ├── curation-rules.md
│   └── legal.md
├── custom/
│   └── collections/
│       ├── README.md
│       ├── news.m3u
│       └── sports.m3u
├── streams/
├── scripts/
├── tests/
├── package.json
├── LICENSE
└── CONTRIBUTING.md
```

## How to use

1. Browse the curated collections in `custom/collections/`.
2. Pick a playlist category that matches your interest.
3. Load the playlist into a compatible IPTV player.
4. Keep the source URLs updated and verify they still work.

## Curated collections

This branch focuses on categories such as:

- news
- sports
- entertainment
- movies
- kids
- documentaries
- regional/local channels

You can extend this structure as needed, but the goal is to keep the repo organized and maintainable.

## Maintenance rules

Please follow these rules before adding new content:

- confirm the stream source is active and valid
- avoid duplicate entries
- keep channel names consistent
- group channels by type or region
- prefer quality over quantity
- document any source-specific notes in the relevant collection file

## Legal note

This repository is intended for legally available public IPTV links and personal, lawful usage.

Do not add:

- pirated streams
- unauthorized re-broadcasts
- content without clear rights or permission

See the legal guide for more details: `docs/legal.md`

## Contribution

If you want to improve the project:

1. create a new branch
2. add or improve a collection
3. validate the playlist formatting
4. open a pull request with a clear description

## Recommended validation

```bash
npm install
npm run lint
npm run test
npm run playlist:validate
npm run playlist:lint
```

## License

This project remains under the repository license and follows the original project terms.

---

This custom branch is intentionally focused on IPTV organization and curation. If you later want a separate movies/series repository, that should be a separate project rather than mixed into this one.
