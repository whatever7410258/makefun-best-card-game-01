// Ember Pact — the rules engine: turns, ember, damage, shield, poison and
// resonance. Pure state transitions, no rendering and no timers, so the
// screenshot stager can play real games forward deterministically.
import { START_LIFE, START_HAND, MAX_EMBER, START_EMBER_MAX, RESONANCE } from './config.js';
import { cardDef } from './cards.js';
import { buildDeck, drawCards, discardCard } from './deck.js';

/** A fresh side of the table: life, shield, poison, ember, deck, hand. */
export function newSide(random) {
  const side = {
    life: START_LIFE, maxLife: START_LIFE, shield: 0, poison: 0,
    ember: 0, emberMax: START_EMBER_MAX,
    deck: buildDeck(random), hand: [], discard: [],
  };
  drawCards(side, START_HAND, random);
  return side;
}

/** A fresh match. `random` is a () => [0,1) function (seeded for shots). */
export function newMatch(random) {
  return {
    random,
    round: 1,
    phase: 'title', // title | player | ai | over
    player: newSide(random),
    ai: newSide(random),
    winner: null,
    log: ['The Warden of Cinders accepts your pact.'],
    floats: [], // { x, y, text, color, born, lifeMs } — renderer drains these
    playedSuits: [], // suits played this turn, for resonance
    cardsPlayed: 0,
    startedAt: Date.now(),
  };
}

/** Append a line to the match log (kept to the last 4). */
export function addLog(match, line) {
  match.log.push(line);
  while (match.log.length > 4) match.log.shift();
}

/** A floating combat number the renderer shows over the table. */
export function addFloat(match, x, y, text, color) {
  match.floats.push({ x, y, text, color, born: Date.now(), lifeMs: 1200 });
}

/** "You" takes the base verb form; the Warden takes the third person. */
function verb(label, youForm, otherForm) {
  return label === 'You' ? youForm : otherForm;
}

function applyDamage(match, target, amount, sourceName) {
  if (amount <= 0) return 0;
  let left = amount;
  if (target.shield > 0) {
    const blocked = Math.min(target.shield, left);
    target.shield -= blocked;
    left -= blocked;
    if (blocked > 0) addLog(match, `Shield absorbs ${blocked}.`);
  }
  target.life = Math.max(0, target.life - left);
  if (left > 0) addLog(match, `${sourceName} ${verb(sourceName, 'take', 'takes')} ${left} damage.`);
  return left;
}

/** Start a side's turn: poison ticks, ember refills, two cards drawn. */
export function beginTurn(match, side, other, label) {
  if (side.poison > 0) {
    const tick = side.poison;
    side.life = Math.max(0, side.life - tick);
    addLog(match, `${label} ${verb(label, 'suffer', 'suffers')} ${tick} poison.`);
    addFloat(match, label === 'You' ? 640 : 640, label === 'You' ? 700 : 190, `-${tick} poison`, '#58c96b');
  }
  side.shield = 0;
  side.ember = side.emberMax;
  const drawn = drawCards(side, 2, match.random);
  addLog(match, `${label} ${verb(label, 'draw', 'draws')} ${drawn}.`);
  match.playedSuits = [];
}

/** Start the player's turn at the top of a new round. */
export function startPlayerTurn(match) {
  match.round += 0; // round counts up when the AI's turn ends
  match.phase = 'player';
  match.player.emberMax = Math.min(MAX_EMBER, START_EMBER_MAX + match.round - 1);
  beginTurn(match, match.player, match.ai, 'You');
  if (match.ai.life <= 0 || match.player.life <= 0) checkEnd(match);
}

/** Start the AI's turn; the caller executes the plan it returns. */
export function startAiTurn(match) {
  match.phase = 'ai';
  match.ai.emberMax = Math.min(MAX_EMBER, START_EMBER_MAX + match.round - 1);
  beginTurn(match, match.ai, match.player, 'The Warden');
  if (match.ai.life <= 0 || match.player.life <= 0) checkEnd(match);
}

/** End the AI's turn and hand the table back to the player. */
export function endAiTurn(match) {
  match.round += 1;
  startPlayerTurn(match);
  if (match.ai.life <= 0 || match.player.life <= 0) checkEnd(match);
}

/** Can this side afford to play this card right now? */
export function canPlay(match, side, cardId) {
  const card = cardDef(cardId);
  return side.ember >= card.cost;
}

/**
 * Play a card from a side's hand. Returns an object describing what happened
 * ({ ok, reason, resonance, damage, ... }) so the renderer can animate it.
 */
export function playCard(match, side, other, handIndex, sideLabel) {
  if (match.phase === 'over') return { ok: false, reason: 'The match is over.' };
  const cardId = side.hand[handIndex];
  if (cardId === undefined) return { ok: false, reason: 'No card there.' };
  const card = cardDef(cardId);
  if (side.ember < card.cost) return { ok: false, reason: 'Not enough ember.' };

  side.ember -= card.cost;
  side.hand.splice(handIndex, 1);
  discardCard(side, cardId);
  match.cardsPlayed += 1;

  const resonance = match.playedSuits.includes(card.suit);
  match.playedSuits.push(card.suit);
  const res = RESONANCE[card.suit];
  const result = { ok: true, card, resonance, damage: 0, heal: 0, shield: 0, poison: 0, draw: 0 };

  const hits = card.hits ?? 1;
  let damage = 0;
  if (card.handDamage) damage = side.hand.length;
  else if (card.dmg) damage = card.dmg * hits;
  if (resonance && res.bonusDamage) damage += res.bonusDamage;
  if (damage > 0) {
    result.damage = applyDamage(match, other, damage, sideLabel === 'You' ? 'The Warden' : 'You');
    addFloat(match, 640, sideLabel === 'You' ? 210 : 690, `-${result.damage}`, '#ff5a3c');
  }
  if (card.poison) {
    let poison = card.poison;
    if (resonance && res.bonusPoison) poison += res.bonusPoison;
    other.poison += poison;
    result.poison = poison;
    const targetLabel = sideLabel === 'You' ? 'The Warden' : 'You';
    addLog(match, `${targetLabel} ${verb(targetLabel, 'gain', 'gains')} ${poison} poison.`);
  }
  if (card.heal) {
    const healed = Math.min(side.maxLife - side.life, card.heal);
    side.life += healed;
    result.heal = healed;
    addFloat(match, 640, sideLabel === 'You' ? 690 : 210, `+${healed}`, '#3fa9ff');
  }
  if (card.shield) {
    let shield = card.shield;
    if (resonance && res.bonusShield) shield += res.bonusShield;
    side.shield += shield;
    result.shield = shield;
  }
  if (card.ember) {
    side.ember += card.ember;
    result.ember = card.ember;
  }
  if (card.draw) {
    let draw = card.draw;
    if (resonance && res.bonusDraw) draw += res.bonusDraw;
    result.draw = drawCards(side, draw, match.random);
  }
  if (resonance) addLog(match, `${res.label} — ${card.suit} sings twice.`);
  addLog(match, `${sideLabel} ${verb(sideLabel, 'play', 'plays')} ${card.name}.`);
  checkEnd(match);
  return result;
}

/** Set the winner when either side's life reaches zero. */
export function checkEnd(match) {
  if (match.winner) return;
  if (match.ai.life <= 0 && match.player.life <= 0) {
    match.winner = 'player'; // simultaneous fall: the challenger takes it
  } else if (match.ai.life <= 0) {
    match.winner = 'player';
  } else if (match.player.life <= 0) {
    match.winner = 'ai';
  }
  if (match.winner) {
    match.phase = 'over';
    addLog(match, match.winner === 'player'
      ? 'The Warden bows. The ember is yours.'
      : 'Your flame gutters out.');
  }
}

/** Begin a match from the title screen. */
export function startMatch(match) {
  match.phase = 'player';
  match.player.ember = match.player.emberMax;
  match.player.shield = 0;
  addLog(match, `Round 1 — your move.`);
}
