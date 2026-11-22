[![make.fun · news-image-20261121](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/aei0102030405/news-image-20261121/rank.svg)](https://make.fun/bounty/news-image-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/aei0102030405/news-image-20261121/reward.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)

# The World in One Day — 21 November 2026

A one-page newspaper front page that sums up the world's news of
Saturday 21 November 2026. The program draws the whole image
procedurally — a hand-made 5x7 bitmap font, flat-colour illustrations
and a newspaper layout — with Node 22 and the standard library only.
No network, no dependencies, fully deterministic: every run writes the
same bytes.

## The seven stories

1. **Mexico captures "El Chapo Isidro"** (lead) — Mexican forces seized
   FBI most-wanted cartel boss Fausto Isidro Meza Flores in Guasave,
   Sinaloa, with US intelligence help; violence flared after the raid.
   (AP / NPR, 21 Nov 2026)
2. **Kryvyi Rih missile strike** — A Russian ballistic strike on
   President Zelenskyy's hometown killed 2 and wounded 60 in a
   double-tap attack. (AP, 21 Nov 2026)
3. **COP31 runs into overtime** — The climate summit in Antalya passed
   its deadline with no deal; fossil fuels were absent from the draft.
   (AP / Reuters, 21 Nov 2026)
4. **AI sell-off sinks world stocks** — The S&P 500 fell 3.7% and
   Japan's Nikkei 5.1% as doubts grew over AI spending payoffs.
   (21 Nov 2026)
5. **BepiColombo reaches Mercury** — The ESA-JAXA probe entered orbit
   around Mercury after an eight-year journey. (ESA / Nature,
   21 Nov 2026)
6. **Strong quake shakes the Andes** — A magnitude 6.7 tremor centred
   near Junin, Peru, rattled Lima; no deaths reported. (AFP / USGS,
   21 Nov 2026)
7. **Mosquitoes that beat dengue** — Wolbachia mosquitoes cut dengue
   and chikungunya infections about 69% in a Brazil trial of more than
   5,700 children. (AP, 21 Nov 2026)

## How to run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png`: a 1024x1024 PNG, well under the 1 MiB
limit. Running it twice produces byte-identical output.

## License

MIT — see `LICENSE`.
