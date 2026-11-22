// Ember Pact — the card catalogue. Twelve original cards, four suits.
// A card's effect is data, not code: { dmg, hits, heal, shield, poison,
// draw, ember, handDamage } so the engine can apply any card the same way.
// handDamage means "deal damage equal to the cards in your hand".
export const CARDS = [
  {
    id: 'cinder-strike', name: 'Cinder Strike', suit: 'flame', cost: 1,
    text: 'Deal 3 damage.', art: 'strike', dmg: 3,
  },
  {
    id: 'ember-burst', name: 'Ember Burst', suit: 'flame', cost: 2,
    text: 'Deal 2 damage, twice.', art: 'burst', dmg: 2, hits: 2,
  },
  {
    id: 'wildfire', name: 'Wildfire', suit: 'flame', cost: 3,
    text: 'Deal 7 damage.', art: 'wildfire', dmg: 7,
  },
  {
    id: 'coral-ward', name: 'Coral Ward', suit: 'tide', cost: 1,
    text: 'Gain 6 shield.', art: 'ward', shield: 6,
  },
  {
    id: 'tidal-mend', name: 'Tidal Mend', suit: 'tide', cost: 2,
    text: 'Restore 5 life.', art: 'mend', heal: 5,
  },
  {
    id: 'deep-current', name: 'Deep Current', suit: 'tide', cost: 3,
    text: 'Restore 4 life and gain 4 shield.', art: 'current', heal: 4, shield: 4,
  },
  {
    id: 'spore-cloud', name: 'Spore Cloud', suit: 'thorn', cost: 1,
    text: 'Apply 4 poison.', art: 'spore', poison: 4,
  },
  {
    id: 'briar-snare', name: 'Briar Snare', suit: 'thorn', cost: 2,
    text: 'Deal 2 damage and apply 3 poison.', art: 'snare', dmg: 2, poison: 3,
  },
  {
    id: 'withering-grasp', name: 'Withering Grasp', suit: 'thorn', cost: 3,
    text: 'Deal 4 damage and apply 2 poison.', art: 'grasp', dmg: 4, poison: 2,
  },
  {
    id: 'tailwind', name: 'Tailwind', suit: 'gale', cost: 0,
    text: 'Gain 2 ember this turn.', art: 'tailwind', ember: 2,
  },
  {
    id: 'zephyr-draft', name: 'Zephyr Draft', suit: 'gale', cost: 1,
    text: 'Draw 2 cards.', art: 'draft', draw: 2,
  },
  {
    id: 'stormcall', name: 'Stormcall', suit: 'gale', cost: 2,
    text: 'Deal damage equal to the cards in your hand.', art: 'storm', handDamage: true,
  },
];

export const CARD_BY_ID = new Map(CARDS.map((card) => [card.id, card]));

/** Look a card definition up by id; throws on an unknown id. */
export function cardDef(id) {
  const card = CARD_BY_ID.get(id);
  if (!card) throw new Error(`unknown card ${id}`);
  return card;
}

/** The one-line effect text shown on a card face. */
export function cardText(card) {
  return card.text;
}

/** A card's headline number: damage, or shield, or heal, for the big numeral. */
export function cardPower(card) {
  if (card.handDamage) return '×';
  if (card.dmg) return String(card.dmg);
  if (card.shield) return String(card.shield);
  if (card.heal) return String(card.heal);
  if (card.poison) return String(card.poison);
  if (card.draw) return String(card.draw);
  if (card.ember) return String(card.ember);
  return '·';
}

/** What the big numeral means, for the label under it. */
export function cardPowerLabel(card) {
  if (card.handDamage) return 'per card';
  if (card.dmg) return 'damage';
  if (card.shield) return 'shield';
  if (card.heal) return 'heal';
  if (card.poison) return 'poison';
  if (card.draw) return 'draw';
  if (card.ember) return 'ember';
  return '';
}
