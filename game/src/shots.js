// Ember Pact — deterministic screenshot scenes behind ?shot=title|play|win|loss.
// Each scene plays the real rules forward from a fresh match with a seeded
// random source, so the same seed always gives the same frame. The win and
// loss scenes finish a real game: the table is played to a low-life state,
// then a real card is played through playCard and the end screen follows.
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';
import {
  newMatch, startMatch, startAiTurn, endAiTurn, playCard, checkEnd,
} from './engine.js';
import { planAiTurn, playAiPlanStep, autopilotPlay } from './ai.js';
import { cardDef } from './cards.js';

const PLAY_ROUNDS = 4;

/** Play one full round: the player's autopilot, then the AI's whole plan. */
function playRound(match) {
  if (match.winner) return;
  autopilotPlay(match, match.player, match.ai, 'You', 2);
  if (match.winner) return;
  startAiTurn(match);
  const plan = planAiTurn(match);
  while (plan.length > 0 && !match.winner) {
    playAiPlanStep(match, plan);
  }
  if (match.winner) return;
  endAiTurn(match);
}

/** First damage card in a hand, or -1. */
function firstDamageIndex(hand) {
  for (let i = 0; i < hand.length; i += 1) {
    const card = cardDef(hand[i]);
    if (card.dmg || card.handDamage) return i;
  }
  return -1;
}

/** Make sure a hand holds a damage card, adding one if it does not. */
function ensureDamageCard(hand) {
  if (firstDamageIndex(hand) < 0) hand.push('cinder-strike');
}

/**
 * Stage the named scene on a fresh match and return the screen to draw.
 * `seed` picks the match's random source; the caller passes it through.
 */
export function stageShot(name, seed) {
  let randomState = seed >>> 0 || 1;
  const random = () => {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const match = newMatch(random);
  if (name !== 'play' && name !== 'win' && name !== 'loss') {
    return { match, screen: SCREEN_TITLE };
  }
  startMatch(match);
  for (let round = 0; round < PLAY_ROUNDS && !match.winner; round += 1) {
    playRound(match);
  }
  if (match.winner) return { match, screen: SCREEN_OVER };

  if (name === 'play') {
    // A mid-game table: hands full, life totals dented, log lines alive.
    return { match, screen: SCREEN_PLAY };
  }

  if (name === 'win') {
    match.ai.life = 2;
    match.ai.shield = 0;
    ensureDamageCard(match.player.hand);
    const index = firstDamageIndex(match.player.hand);
    playCard(match, match.player, match.ai, index, 'You');
    checkEnd(match);
    return { match, screen: match.winner ? SCREEN_OVER : SCREEN_PLAY };
  }

  // loss
  match.player.life = 2;
  match.player.shield = 0;
  startAiTurn(match);
  ensureDamageCard(match.ai.hand);
  const index = firstDamageIndex(match.ai.hand);
  if (index >= 0) playCard(match, match.ai, match.player, index, 'The Warden');
  checkEnd(match);
  return { match, screen: match.winner ? SCREEN_OVER : SCREEN_PLAY };
}

/** A helper for tests: play rounds until someone wins (cap 40 rounds). */
export function playUntilEnd(seed, maxRounds = 40) {
  let randomState = seed >>> 0 || 1;
  const random = () => {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const match = newMatch(random);
  startMatch(match);
  for (let round = 0; round < maxRounds && !match.winner; round += 1) {
    playRound(match);
  }
  return match;
}
