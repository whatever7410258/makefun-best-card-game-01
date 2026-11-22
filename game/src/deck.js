// Ember Pact — deck building, shuffling, drawing and discarding.
// A deck is 30 cards: two of each of the twelve cards, plus one extra of
// the six cheapest workhorses, so no single card dominates the draw.
import { CARDS } from './cards.js';
import { DECK_SIZE } from './config.js';

const EXTRA_COPIES = [
  'cinder-strike', 'coral-ward', 'zephyr-draft',
  'briar-snare', 'ember-burst', 'tidal-mend',
];

/** A fresh shuffled deck of card ids, using the caller's random source. */
export function buildDeck(random) {
  const ids = [];
  for (const card of CARDS) {
    ids.push(card.id, card.id);
  }
  for (const id of EXTRA_COPIES) ids.push(id);
  if (ids.length !== DECK_SIZE) throw new Error(`deck is ${ids.length}, want ${DECK_SIZE}`);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

/** Draw up to `count` cards from a side's deck into its hand (max 7). */
export function drawCards(side, count, random) {
  let drawn = 0;
  for (let n = 0; n < count; n += 1) {
    if (side.hand.length >= 7) break;
    if (side.deck.length === 0) {
      if (side.discard.length === 0) break;
      side.deck = side.discard;
      side.discard = [];
      for (let i = side.deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [side.deck[i], side.deck[j]] = [side.deck[j], side.deck[i]];
      }
    }
    side.hand.push(side.deck.pop());
    drawn += 1;
  }
  return drawn;
}

/** Move a played card id to the side's discard pile. */
export function discardCard(side, id) {
  side.discard.push(id);
}
