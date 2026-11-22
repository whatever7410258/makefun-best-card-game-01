# makefun-best-card-game-01

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/whatever7410258/makefun-best-card-game-01/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/whatever7410258/makefun-best-card-game-01/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Ember Pact — an original card battler for make.fun's "Make the best card game" bounty, $50 in USDC. A duel of flame, tide, thorn and gale: you are the Emberkeeper, across the table sits the Warden of Cinders. You both have 24 life; the first life to reach zero loses.

## Run it

```sh
node serve.ts
```

Static files, no build step, no network requests. `node serve.ts` serves `game/` at http://localhost:8080 — open `game/index.html` in desktop Chrome.

## How to play

- **Ember is your mana.** It refills to your maximum each turn, and your maximum grows by 1 every round, up to 10. Every card costs ember.
- **Play cards** by clicking them or pressing keys 1–7. **End Turn** with the button, Enter or Space. **M** mutes the sound, **Esc** returns to the title.
- **Four suits**, told apart by colour and shape:
  - **Flame** (red triangle) — direct damage.
  - **Tide** (blue droplet) — healing and shield.
  - **Thorn** (green leaf) — poison that ticks every turn.
  - **Gale** (yellow bolt) — drawing cards and extra ember.
- **Resonance:** play two cards of the same suit in one turn and the second one wakes a bonus — Flame deals +2 damage, Tide gains +3 shield, Thorn applies +2 poison, Gale draws an extra card. Plan your hand around a suit.
- **Shield** absorbs damage until your next turn. **Poison** ticks at the start of the afflicted side's turn. Your deck reshuffles its discard pile when it runs out, so no one loses to an empty deck.

The Warden plays by readable rules: it heals when hurt, shields when threatened, spends its ember on the biggest damage it can afford, and loves a resonance pair — track its suits and you can guess its next card.

## The cards

Twelve original cards, two of each in a 30-card deck:

| Card | Suit | Cost | Effect |
| --- | --- | --- | --- |
| Cinder Strike | Flame | 1 | Deal 3 damage. |
| Ember Burst | Flame | 2 | Deal 2 damage, twice. |
| Wildfire | Flame | 3 | Deal 7 damage. |
| Coral Ward | Tide | 1 | Gain 6 shield. |
| Tidal Mend | Tide | 2 | Restore 5 life. |
| Deep Current | Tide | 3 | Restore 4 life and gain 4 shield. |
| Spore Cloud | Thorn | 1 | Apply 4 poison. |
| Briar Snare | Thorn | 2 | Deal 2 damage and apply 3 poison. |
| Withering Grasp | Thorn | 3 | Deal 4 damage and apply 2 poison. |
| Tailwind | Gale | 0 | Gain 2 ember this turn. |
| Zephyr Draft | Gale | 1 | Draw 2 cards. |
| Stormcall | Gale | 2 | Deal damage equal to the cards in your hand. |

Screenshots are deterministic scenes of the game itself: `?shot=title|play|win|loss&seed=N` stages the title screen, a mid-game table, the win screen and the loss screen.

## Layout

- `game/index.html` — the page; `game/src/main.js` — boot and game loop.
- `game/src/config.js` — constants and suits; `game/src/cards.js` — the card catalogue; `game/src/deck.js` — deck, shuffle, draw, discard.
- `game/src/engine.js` — turns, ember, damage, shield, poison, resonance.
- `game/src/ai.js` — the Warden's planning and autopilot.
- `game/src/render.js` — canvas painting: title, table, cards, overlays.
- `game/src/input.js` — mouse and keyboard.
- `game/src/audio.js` — synthesized sound effects (WebAudio, no files).
- `game/src/shots.js` — deterministic screenshot scenes.
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with `vendor/makefun-game.ts`.

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=w9y8tk6d&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
