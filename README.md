# Telegram Drop

Obsidian plugin that sends the current note to a Telegram chat **as a `.md` file**, in one action. Built for capturing notes on a phone or tablet and dropping them into a chat that something else picks up from.

A file, not a message: Telegram turns `**bold**` in message text into formatting and drops the markers, and caps a message at 4096 characters. A document arrives byte for byte.

## Use

- Command palette: **Telegram Drop: Send current note** — bind it to a hotkey in *Settings → Hotkeys*.
- Ribbon icon (paper plane), or **Send to Telegram** in a note's file menu.

A notice confirms delivery or shows Telegram's error.

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) and add it to the target chat.
2. In the plugin settings fill in:
   - **Bot token** — from BotFather.
   - **Chat ID** — numeric, e.g. `-100…` for a supergroup.
   - **Topic ID** — optional; the forum topic to post into.

The token is stored in the vault's plugin data (`.obsidian/plugins/tg-drop/data.json`). Anyone with the vault can post as the bot, so keep that vault private, and revoke the token in BotFather if it leaks.

## Install

Not in the community catalogue. Install with [BRAT](https://github.com/TfTHacker/obsidian42-brat): *Add beta plugin* → `sanchpet/obsidian-tg-drop`.

## Develop

```sh
mise install
npm ci
npm test && npm run lint && npm run typecheck && npm run build
```

Releases are cut by release-please from conventional commits; the release workflow attaches `main.js` and `manifest.json`.
