# Plate Indexer

Describe a microplate layer by layer (siRNA, treatment, dose…), then export one row per well.

**Open it:** https://clamk-tools.github.io/PlateIndexer/

Runs in your browser: nothing to install, nothing sent anywhere.

## Status

Being built. Today you can choose a plate format (6 to 1536 wells), select wells as in a spreadsheet, and describe
the plate in layers (text, or numbers with a unit) by typing into the selected wells; each value gets a colour. Copy,
paste (also from Excel), the fill handle and undo work as in a spreadsheet. The CSV export comes next: see [`doc/ROADMAP.md`](doc/ROADMAP.md).

## For developers

```
npm install
npm run dev        # http://localhost:5185
npm test           # rules
npm run lint
npm run build
npm run e2e        # built site in real browsers
```

How it is made: [`doc/ARCHITECTURE.md`](doc/ARCHITECTURE.md). Look: [`doc/LLM feed for visual/`](doc/LLM%20feed%20for%20visual/).

## Privacy

This repo is public, so nothing personal may reach it. `.githooks/check-privacy.sh` blocks a commit or push that
carries a personal email address, a private local path, a token or key, or a term listed in `~/.git-privacy-terms` or
`.git/privacy-terms`. Turn the hooks on once per clone: `git config core.hooksPath .githooks`. CI runs the same check.
