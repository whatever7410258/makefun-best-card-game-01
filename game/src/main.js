// Ember Pact — boot and the one loop: input is read every frame, the match
// advances, and the renderer paints what is there. The game moves between
// three screens: title, play and over.
//
// ?seed=N fixes the shuffle. ?shot=title|play|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { TABLE_WIDTH, TABLE_HEIGHT } from './config.js';
import {
  newMatch, startMatch, startAiTurn, endAiTurn, playCard, checkEnd,
} from './engine.js';
import { planAiTurn, playAiPlanStep } from './ai.js';
import {
  createInput, cardAt, ACTION_CONFIRM, ACTION_MUTE, ACTION_ESCAPE,
} from './input.js';
import {
  drawGame, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, endTurnRect,
} from './render.js';
import { stageShot } from './shots.js';
import { sfx, toggleMute } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / TABLE_WIDTH, window.innerHeight / TABLE_HEIGHT);
  canvas.width = TABLE_WIDTH;
  canvas.height = TABLE_HEIGHT;
  canvas.style.width = `${Math.floor(TABLE_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(TABLE_HEIGHT * scale)}px`;
}

function seededRandom(seedValue) {
  let state = seedValue >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Screen readers (and anyone watching the page's text) hear the changes. */
function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const { match, screen } = stageShot(name, seed);
  fitCanvas();
  let painted = 0;
  function paint() {
    const ui = { hoverCard: -1, hoverEnd: false, playedFx: null };
    drawGame(ctx, match, screen, ui, performance.now());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let match = newMatch(seededRandom(seed));
  let screen = SCREEN_TITLE;
  let aiPlan = [];
  let aiNextAt = 0;
  let playedFx = null;
  let hoverCard = -1;
  let hoverEnd = false;

  function startNewMatch() {
    match = newMatch(seededRandom(Math.floor(Math.random() * 4294967296)));
    screen = SCREEN_PLAY;
    aiPlan = [];
    playedFx = null;
    startMatch(match);
    sfx.turn();
    announce('Playing. Round 1, your move.');
  }

  function endPlayerTurn() {
    if (match.phase !== 'player' || match.winner) return;
    sfx.click();
    startAiTurn(match);
    if (match.winner) {
      finishMatch();
      return;
    }
    aiPlan = planAiTurn(match);
    aiNextAt = performance.now() + 700;
    announce('The Warden is thinking.');
  }

  function finishMatch() {
    screen = SCREEN_OVER;
    if (match.winner === 'player') sfx.win();
    else sfx.lose();
    announce(match.winner === 'player'
      ? `Victory. The Warden's life reached zero in round ${match.round}.`
      : `Defeat. Your life reached zero in round ${match.round}.`);
  }

  function tryPlayCard(index) {
    if (screen !== SCREEN_PLAY || match.phase !== 'player' || match.winner) return;
    if (index < 0 || index >= match.player.hand.length) return;
    const cardId = match.player.hand[index];
    const result = playCard(match, match.player, match.ai, index, 'You');
    if (!result.ok) {
      announce(result.reason);
      return;
    }
    playedFx = { cardId, side: 'player', start: performance.now(), dur: 700 };
    if (result.resonance) sfx.resonance();
    else if (result.damage > 0) sfx.hit();
    else if (result.heal > 0) sfx.heal();
    else if (result.shield > 0) sfx.shield();
    else if (result.poison > 0) sfx.poison();
    else sfx.playCard();
    if (match.winner) finishMatch();
  }

  function handleInput() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_ESCAPE && screen === SCREEN_PLAY) {
      screen = SCREEN_TITLE;
      announce('Title screen.');
      return;
    }
    const keyCard = input.takeKeyCard();
    if (keyCard >= 0 && screen === SCREEN_PLAY) tryPlayCard(keyCard);
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE) startNewMatch();
      else if (screen === SCREEN_OVER) startNewMatch();
      else if (screen === SCREEN_PLAY) endPlayerTurn();
    }
    const click = input.takeClick();
    if (click) {
      if (screen === SCREEN_TITLE) startNewMatch();
      else if (screen === SCREEN_OVER) startNewMatch();
      else if (screen === SCREEN_PLAY) {
        if (click.end) endPlayerTurn();
        else {
          const index = cardAt(click.point, match.player.hand.length);
          if (index >= 0) tryPlayCard(index);
        }
      }
    }
    // Hover tracking for the hand and the End Turn button.
    const mouse = input.mouse();
    hoverCard = cardAt(mouse, match.player.hand.length);
    const btn = endTurnRect();
    hoverEnd = mouse.x >= btn.x && mouse.x <= btn.x + btn.w
      && mouse.y >= btn.y && mouse.y <= btn.y + btn.h;
  }

  function stepAi(now) {
    if (screen !== SCREEN_PLAY || match.phase !== 'ai' || match.winner) return;
    if (now < aiNextAt) return;
    if (aiPlan.length > 0) {
      const id = playAiPlanStep(match, aiPlan);
      if (id) {
        playedFx = { cardId: id, side: 'ai', start: now, dur: 700 };
        sfx.playCard();
      }
      aiNextAt = now + 750;
      if (match.winner) {
        finishMatch();
        return;
      }
    } else {
      endAiTurn(match);
      if (match.winner) {
        finishMatch();
        return;
      }
      sfx.turn();
      announce(`Round ${match.round} — your move.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    handleInput();
    stepAi(now);
    if (playedFx && now - playedFx.start > playedFx.dur) playedFx = null;
    const ui = { hoverCard, hoverEnd, playedFx };
    drawGame(ctx, match, screen, ui, now);
    checkEnd(match);
    if (match.winner && screen !== SCREEN_OVER) finishMatch();
  }

  window.addEventListener('resize', fitCanvas);
  fitCanvas();
  announce('Ember Pact. Press Enter to begin.');
  requestAnimationFrame(frame);
}

window.addEventListener('resize', fitCanvas);

if (shot) runShot(shot);
else runGame();
