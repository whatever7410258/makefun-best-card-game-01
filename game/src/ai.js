// Ember Pact — the Warden of Cinders, the AI opponent. It plans its whole
// turn up front (a list of hand indices), then the main loop plays them one
// at a time so the player can watch. Its choices are readable and
// counterable: it heals when hurt, shields when threatened, and otherwise
// spends its ember on the biggest damage it can afford — and it loves a
// resonance pair, so a player who tracks its suits can guess its next card.
import { cardDef } from './cards.js';
import { playCard } from './engine.js';

/** Score a card for the AI: how much it is worth playing right now. */
export function scoreCard(match, cardId) {
  const card = cardDef(cardId);
  const me = match.ai;
  const foe = match.player;
  let score = 0;
  if (card.dmg) {
    // Damage is worth more the closer the player is to dying.
    score += card.dmg * (foe.life <= 8 ? 2.2 : foe.life <= 14 ? 1.5 : 1.0);
    if (card.hits) score += card.dmg * 0.6;
  }
  if (card.handDamage) score += Math.min(6, me.hand.length) * 1.1;
  if (card.poison) score += card.poison * 0.9 + (foe.poison === 0 ? 1.5 : 0);
  if (card.heal) score += me.life < me.maxLife ? card.heal * (me.life <= 8 ? 2.0 : 1.2) : -5;
  if (card.shield) score += me.life <= 10 ? card.shield * 1.1 : card.shield * 0.4;
  if (card.draw) score += 2.5;
  if (card.ember) score += 2.0;
  // A resonance pair is worth chasing: a second card of a played suit.
  if (match.playedSuits.includes(card.suit)) score += 2.0;
  return score / Math.max(1, card.cost);
}

/**
 * Plan the AI's turn: pick cards greedily by score per ember until it can
 * afford nothing else. Returns hand indices in play order (indices refer to
 * the hand as it stands when the plan is made; the caller re-plans after
 * each play if a card leaves the hand out of order — see playAiPlan).
 */
export function planAiTurn(match) {
  const plan = [];
  let ember = match.ai.ember;
  const hand = [...match.ai.hand];
  const suits = [...match.playedSuits];
  while (true) {
    let best = -1;
    let bestScore = 0;
    for (let i = 0; i < hand.length; i += 1) {
      const card = cardDef(hand[i]);
      if (card.cost > ember) continue;
      const fake = { ...match, playedSuits: suits };
      const value = scoreCard(fake, hand[i]);
      if (value > bestScore) {
        bestScore = value;
        best = i;
      }
    }
    if (best < 0) break;
    const card = cardDef(hand[best]);
    ember -= card.cost;
    suits.push(card.suit);
    plan.push(hand[best]);
    hand.splice(best, 1);
  }
  return plan; // card ids, in play order
}

/**
 * Play the next card of a plan (card ids). Returns the played card id, or
 * null when the plan is spent. Plans hold ids, so drawing mid-turn cannot
 * shift an index out from under the next play.
 */
export function playAiPlanStep(match, plan) {
  if (plan.length === 0) return null;
  const id = plan.shift();
  const index = match.ai.hand.indexOf(id);
  if (index < 0) return playAiPlanStep(match, plan);
  playCard(match, match.ai, match.player, index, 'The Warden');
  return id;
}

/**
 * A simple autopilot for the screenshot stager: play the best affordable
 * card, up to two cards, then stop — so the play scene keeps a full hand.
 */
export function autopilotPlay(match, side, other, label, maxPlays = 2) {
  let played = 0;
  while (played < maxPlays) {
    let best = -1;
    let bestScore = 0;
    for (let i = 0; i < side.hand.length; i += 1) {
      const card = cardDef(side.hand[i]);
      if (card.cost > side.ember) continue;
      let value = (card.dmg ?? 0) + (card.poison ?? 0) * 0.8 + (card.shield ?? 0) * 0.5
        + (card.heal ?? 0) * 0.4 + (card.draw ?? 0) * 1.5 + (card.ember ?? 0) * 1.5;
      if (match.playedSuits.includes(card.suit)) value += 2;
      if (value > bestScore) {
        bestScore = value;
        best = i;
      }
    }
    if (best < 0) break;
    playCard(match, side, other, best, label);
    played += 1;
    if (match.winner) break;
  }
  return played;
}
