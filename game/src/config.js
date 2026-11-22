// Ember Pact — shared constants: table size, suits, life and ember rules.
// Suits are told apart by colour AND shape, never by text alone: Flame is a
// red triangle, Tide a blue droplet, Thorn a green leaf, Gale a yellow bolt.
export const TABLE_WIDTH = 1280;
export const TABLE_HEIGHT = 900;

export const START_LIFE = 24;
export const START_HAND = 3;
export const MAX_HAND = 7;
export const MAX_EMBER = 10;
export const START_EMBER_MAX = 2;
export const DECK_SIZE = 30;

export const SUITS = {
  flame: { name: 'Flame', color: '#ff5a3c', dark: '#a12718', glow: '#ff9a6b', shape: 'triangle' },
  tide: { name: 'Tide', color: '#3fa9ff', dark: '#14558f', glow: '#8fd0ff', shape: 'droplet' },
  thorn: { name: 'Thorn', color: '#58c96b', dark: '#1f6b2e', glow: '#9be8a8', shape: 'leaf' },
  gale: { name: 'Gale', color: '#ffc93c', dark: '#8a6d12', glow: '#ffe89a', shape: 'bolt' },
};

// Playing a second card of the same suit in one turn fires that suit's
// resonance: a small bonus that rewards planning a hand around one suit.
export const RESONANCE = {
  flame: { label: 'Resonance: +2 damage', bonusDamage: 2 },
  tide: { label: 'Resonance: +3 shield', bonusShield: 3 },
  thorn: { label: 'Resonance: +2 poison', bonusPoison: 2 },
  gale: { label: 'Resonance: draw 1 card', bonusDraw: 1 },
};

// Card art is drawn with canvas paths, keyed by this string.
export const CARD_ART = {
  strike: 'flame-burst',
  wildfire: 'inferno',
  burst: 'twin-flame',
  mend: 'wave',
  ward: 'shell',
  current: 'whirlpool',
  snare: 'briar',
  spore: 'spores',
  grasp: 'wither',
  draft: 'wind',
  storm: 'storm',
  tailwind: 'sail',
};
