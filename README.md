# harambe.gay

ur #1 gorilla memorial shrine on the world wide web.

A deliberately maximalist, GeoCities-era tribute site for Harambe (1999–2016), live at
**[harambe.gay](https://harambe.gay)**.

## what it is

One self-contained HTML file. No framework, no build step, no backend. Everything —
the 8-bit Amazing Grace chiptune, the sparkle cursor trail, the spinning background
gorillas, the guestbook, the candle counter — is vanilla JS plus `localStorage`.

## stack

- Static assets served by a Cloudflare Worker (`wrangler.jsonc`, assets-only, no script entrypoint)
- Custom domains `harambe.gay` and `www.harambe.gay`

## develop

```bash
npm install
npx wrangler dev
```

## deploy

```bash
npx wrangler deploy
```

Heads up: the Worker custom-domain attach fails with a 409 if the hostname still has
A/AAAA/CNAME records in the Cloudflare zone (registrar parking records get imported
during zone setup). Delete them first.

## layout

```
public/
  index.html    the entire site
  404.html      harambe not found
  img/          shrine photo + top 8 friends
```

## credits

Harambe portrait by [Mark Dumont](https://www.flickr.com/photos/23661161@N02/17018925890) (CC BY-NC).
Meme images belong to their respective owners and appear here as fan tribute.

dicks out, hearts open, forever 🦍🌈
