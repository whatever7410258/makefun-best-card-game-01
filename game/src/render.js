// Ember Pact — canvas rendering: title screen, table, cards, overlays.
// One canvas, one logical table of 1280x900, scaled to fit the window.
// Cards are drawn, never images: every suit is a colour AND a shape.
import { TABLE_WIDTH, TABLE_HEIGHT, SUITS } from './config.js';
import { cardDef, cardPower, cardPowerLabel } from './cards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const CARD_W = 150;
export const CARD_H = 210;
export const BACK_W = 76;
export const BACK_H = 106;

/** Hand layout: fanned cards centred on the table. */
export function handRects(count) {
  const step = count <= 1 ? 0 : Math.min(132, (TABLE_WIDTH - 360) / (count - 1));
  const total = CARD_W + step * (count - 1);
  const x0 = (TABLE_WIDTH - total) / 2;
  const rects = [];
  for (let i = 0; i < count; i += 1) {
    rects.push({ x: x0 + i * step, y: TABLE_HEIGHT - CARD_H - 32, w: CARD_W, h: CARD_H });
  }
  return rects;
}

/** Opponent's face-down hand, top centre. */
export function foeHandRects(count) {
  const step = 62;
  const total = BACK_W + step * Math.max(0, count - 1);
  const x0 = (TABLE_WIDTH - total) / 2;
  const rects = [];
  for (let i = 0; i < count; i += 1) {
    rects.push({ x: x0 + i * step, y: 108, w: BACK_W, h: BACK_H });
  }
  return rects;
}

export function endTurnRect() {
  return { x: TABLE_WIDTH - 200, y: 556, w: 160, h: 52 };
}

export function startRect() {
  return { x: TABLE_WIDTH / 2 - 230, y: 640, w: 460, h: 64 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draw one suit's shape at (cx, cy) with size s, in its suit colour. */
export function drawSuitShape(ctx, suitKey, cx, cy, s, color) {
  const suit = SUITS[suitKey];
  ctx.save();
  ctx.fillStyle = color ?? suit.color;
  ctx.strokeStyle = color ?? suit.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (suit.shape === 'triangle') {
    // Flame: a triangle with a flicked tip.
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.85, cy + s * 0.7);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.35);
    ctx.lineTo(cx - s * 0.15, cy + s * 0.9);
    ctx.lineTo(cx - s * 0.85, cy + s * 0.7);
  } else if (suit.shape === 'droplet') {
    // Tide: a droplet.
    ctx.moveTo(cx, cy - s);
    ctx.bezierCurveTo(cx + s * 0.9, cy - s * 0.1, cx + s * 0.75, cy + s * 0.8, cx, cy + s * 0.8);
    ctx.bezierCurveTo(cx - s * 0.75, cy + s * 0.8, cx - s * 0.9, cy - s * 0.1, cx, cy - s);
  } else if (suit.shape === 'leaf') {
    // Thorn: a leaf with a centre vein.
    ctx.moveTo(cx, cy - s);
    ctx.bezierCurveTo(cx + s, cy - s * 0.3, cx + s * 0.7, cy + s * 0.9, cx, cy + s);
    ctx.bezierCurveTo(cx - s * 0.7, cy + s * 0.9, cx - s, cy - s * 0.3, cx, cy - s);
  } else {
    // Gale: a lightning bolt.
    ctx.moveTo(cx + s * 0.25, cy - s);
    ctx.lineTo(cx - s * 0.55, cy + s * 0.1);
    ctx.lineTo(cx - s * 0.05, cy + s * 0.1);
    ctx.lineTo(cx - s * 0.25, cy + s);
    ctx.lineTo(cx + s * 0.55, cy - s * 0.1);
    ctx.lineTo(cx + s * 0.05, cy - s * 0.1);
  }
  ctx.closePath();
  ctx.fill();
  if (suit.shape === 'leaf') {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.8);
    ctx.lineTo(cx, cy + s * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

/** A card back: dark ember sigil on deep red. */
function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 10);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#5a1f16');
  grad.addColorStop(1, '#2a0d08');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#ff9a6b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,154,107,0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 7);
  ctx.stroke();
  drawSuitShape(ctx, 'flame', x + w / 2, y + h / 2, Math.min(w, h) * 0.26, '#ff7a4d');
}

/** One face-up card. `lift` raises it (hover), `dim` greys it (unaffordable). */
export function drawCard(ctx, cardId, x, y, w, h, opts = {}) {
  const card = cardDef(cardId);
  const suit = SUITS[card.suit];
  const lift = opts.lift ?? 0;
  const yy = y - lift;
  const scale = w / CARD_W;
  ctx.save();
  if (opts.dim) ctx.globalAlpha = 0.55;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = lift > 0 ? 18 : 8;
  ctx.shadowOffsetY = lift > 0 ? 8 : 4;
  roundRect(ctx, x, yy, w, h, 12 * scale);
  const grad = ctx.createLinearGradient(x, yy, x, yy + h);
  grad.addColorStop(0, '#fff8e8');
  grad.addColorStop(1, '#f3e2c2');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = suit.color;
  ctx.lineWidth = 3 * scale;
  ctx.stroke();

  // Cost gem, top left.
  ctx.beginPath();
  ctx.arc(x + 22 * scale, yy + 22 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#2b1d3a';
  ctx.fill();
  ctx.strokeStyle = '#ffd76b';
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
  ctx.fillStyle = '#ffe89a';
  ctx.font = `bold ${20 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), x + 22 * scale, yy + 23 * scale);

  // Suit shape, top right.
  drawSuitShape(ctx, card.suit, x + w - 24 * scale, yy + 22 * scale, 11 * scale);

  // Art: the suit shape large, over a tinted panel.
  roundRect(ctx, x + 10 * scale, yy + 42 * scale, w - 20 * scale, 74 * scale, 8 * scale);
  ctx.fillStyle = suit.dark;
  ctx.fill();
  drawSuitShape(ctx, card.suit, x + w / 2, yy + 79 * scale, 26 * scale, suit.glow);
  ctx.globalAlpha = (opts.dim ? 0.55 : 1) * 0.25;
  drawSuitShape(ctx, card.suit, x + w / 2 + 34 * scale, yy + 62 * scale, 12 * scale, suit.color);
  drawSuitShape(ctx, card.suit, x + w / 2 - 36 * scale, yy + 96 * scale, 10 * scale, suit.color);
  ctx.globalAlpha = opts.dim ? 0.55 : 1;

  // Big power numeral.
  ctx.fillStyle = '#2b1d3a';
  ctx.font = `bold ${34 * scale}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.fillText(cardPower(card), x + 12 * scale, yy + 152 * scale);
  ctx.font = `italic ${12 * scale}px Georgia, serif`;
  ctx.fillStyle = '#6b5a3e';
  ctx.fillText(cardPowerLabel(card), x + 12 * scale, yy + 168 * scale);

  // Name.
  ctx.fillStyle = '#2b1d3a';
  ctx.font = `bold ${15 * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(card.name, x + w / 2, yy + 134 * scale);

  // Effect text.
  ctx.font = `${12.5 * scale}px Georgia, serif`;
  ctx.fillStyle = '#4a3a26';
  const lines = wrapText(ctx, card.text, w - 20 * scale);
  lines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, x + w / 2, yy + 184 * scale + i * 14 * scale);
  });
  ctx.restore();
}

function drawLifeBar(ctx, x, y, w, life, maxLife, align = 'left') {
  ctx.save();
  roundRect(ctx, x, y, w, 20, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
  const frac = Math.max(0, life / maxLife);
  if (frac > 0) {
    roundRect(ctx, x + 2, y + 2, (w - 4) * frac, 16, 8);
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, '#ff5a3c');
    grad.addColorStop(1, '#ff8a5c');
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = align === 'left' ? 'left' : 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${life} / ${maxLife}`, align === 'left' ? x + w + 10 : x - 10, y + 10);
  ctx.restore();
}

function drawEmberRow(ctx, x, y, ember, emberMax) {
  for (let i = 0; i < emberMax; i += 1) {
    const cx = x + i * 26;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, y, 9, 0, Math.PI * 2);
    if (i < ember) {
      ctx.fillStyle = '#ff9a3c';
      ctx.shadowColor = '#ff7a1a';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
    }
    ctx.fill();
    ctx.strokeStyle = i < ember ? '#ffd76b' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#ffd76b';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Ember ${ember}/${emberMax}`, x + emberMax * 26 + 8, y);
}

function drawStatusBadges(ctx, x, y, side) {
  let cx = x;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (side.shield > 0) {
    ctx.fillStyle = '#3fa9ff';
    roundRect(ctx, cx, y - 11, 74, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(`Shield ${side.shield}`, cx + 37, y);
    cx += 82;
  }
  if (side.poison > 0) {
    ctx.fillStyle = '#58c96b';
    roundRect(ctx, cx, y - 11, 74, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(`Poison ${side.poison}`, cx + 37, y);
    cx += 82;
  }
}

/** The felt table, ember motes and vignette behind everything. */
function drawTable(ctx, now) {
  const grad = ctx.createRadialGradient(640, 430, 80, 640, 450, 760);
  grad.addColorStop(0, '#3d2b1e');
  grad.addColorStop(0.6, '#2a1c12');
  grad.addColorStop(1, '#150d08');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  // Felt ellipse.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(640, 470, 560, 330, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(46,94,52,0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,107,0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  // Drifting ember motes.
  for (let i = 0; i < 26; i += 1) {
    const seed = i * 137.5;
    const speed = 12 + (i % 5) * 6;
    const x = (seed * 7.3 + now * 0.004 * speed * 0.2) % TABLE_WIDTH;
    const y = TABLE_HEIGHT - ((now * 0.02 * speed + seed) % (TABLE_HEIGHT + 40)) + 20;
    ctx.globalAlpha = 0.12 + (i % 4) * 0.06;
    ctx.fillStyle = i % 3 === 0 ? '#ff9a3c' : '#ffd76b';
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, now) {
  drawTable(ctx, now);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76b';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.shadowColor = '#ff5a1a';
  ctx.shadowBlur = 34;
  ctx.fillText('EMBER PACT', 640, 300);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'italic 30px Georgia, serif';
  ctx.fillText('A duel of flame, tide, thorn and gale', 640, 356);
  // The four suits, in a row.
  const suits = ['flame', 'tide', 'thorn', 'gale'];
  suits.forEach((suit, i) => {
    drawSuitShape(ctx, suit, 520 + i * 80, 430, 22);
  });
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('You have 24 life. The Warden has 24 life.', 640, 500);
  ctx.fillText('Play cards with ember. Two of a suit in one turn', 640, 532);
  ctx.fillText('wakes its Resonance. First life to zero loses.', 640, 564);
  const pulse = 0.65 + 0.35 * Math.sin(now / 350);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd76b';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText('Click or press ENTER to begin', 640, 672);
  ctx.globalAlpha = 1;
  const r = startRect();
  ctx.strokeStyle = 'rgba(255,215,107,0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Keys 1–7 play cards · Enter ends your turn · M mutes', 640, 800);
  ctx.restore();
}

function drawOver(ctx, match, now) {
  const won = match.winner === 'player';
  ctx.save();
  ctx.fillStyle = won ? 'rgba(20,16,4,0.82)' : 'rgba(8,4,4,0.86)';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd76b' : '#c9c2b8';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.shadowColor = won ? '#ff9a1a' : '#000';
  ctx.shadowBlur = 30;
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, 330);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'italic 28px Georgia, serif';
  ctx.fillText(
    won ? 'The Warden bows. The ember is yours.' : 'Your flame gutters out. The Warden keeps the pact.',
    640, 396,
  );
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '22px Georgia, serif';
  ctx.fillText(`Rounds played: ${match.round}    Cards played: ${match.cardsPlayed}`, 640, 470);
  ctx.fillText(`Your life: ${match.player.life}    Warden's life: ${match.ai.life}`, 640, 506);
  const pulse = 0.65 + 0.35 * Math.sin(now / 350);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd76b';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Press ENTER to play again', 640, 600);
  ctx.globalAlpha = 1;
  ctx.restore();
  if (won) {
    // A flourish of embers on a win.
    for (let i = 0; i < 40; i += 1) {
      const seed = i * 91.7;
      const x = (seed * 3.1 + now * 0.05 * (1 + (i % 4))) % TABLE_WIDTH;
      const y = (TABLE_HEIGHT - ((now * 0.09 * (1 + (i % 3)) + seed) % (TABLE_HEIGHT + 60))) + 30;
      ctx.globalAlpha = 0.5 + (i % 3) * 0.2;
      ctx.fillStyle = i % 2 ? '#ffd76b' : '#ff5a3c';
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** Floating damage / heal numbers. */
function drawFloats(ctx, match, now) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px Georgia, serif';
  match.floats = match.floats.filter((f) => now - f.born < f.lifeMs);
  for (const f of match.floats) {
    const age = (now - f.born) / f.lifeMs;
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - age * 46);
  }
  ctx.restore();
}

/**
 * Paint the whole table.
 * `ui` carries hover state: { hoverCard, hoverEnd, aiThinking, playedFx }.
 * `playedFx` is { cardId, side, start, dur } for the card-play animation.
 */
export function drawGame(ctx, match, screen, ui, now) {
  ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  if (screen === SCREEN_TITLE) {
    drawTitle(ctx, now);
    return;
  }
  drawTable(ctx, now);

  // Opponent row.
  ctx.save();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('WARDEN OF CINDERS', 40, 48);
  drawLifeBar(ctx, 40, 60, 380, match.ai.life, match.ai.maxLife, 'left');
  drawEmberRow(ctx, 700, 70, match.ai.ember, match.ai.emberMax);
  drawStatusBadges(ctx, 40, 100, match.ai);
  ctx.fillStyle = 'rgba(255,243,214,0.75)';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Deck ${match.ai.deck.length} · Discard ${match.ai.discard.length}`, 1080, 48);
  ctx.restore();

  // Opponent's face-down hand.
  for (const rect of foeHandRects(match.ai.hand.length)) {
    drawCardBack(ctx, rect.x, rect.y, rect.w, rect.h);
  }

  // Turn banner.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = match.phase === 'player' ? '#ffd76b' : '#c9a0ff';
  const banner = match.phase === 'player'
    ? `YOUR TURN — Round ${match.round}`
    : match.phase === 'ai' ? 'THE WARDEN IS THINKING…' : `ROUND ${match.round}`;
  ctx.fillText(banner, 640, 250);
  // Resonance reminder: suits played this turn.
  if (match.playedSuits.length > 0) {
    ctx.font = '15px Georgia, serif';
    ctx.fillStyle = '#e8dcc0';
    ctx.fillText(`Suits played this turn: ${[...new Set(match.playedSuits)].map((s) => SUITS[s].name).join(', ')} — a second ${SUITS[match.playedSuits[match.playedSuits.length - 1]].name} wakes Resonance`, 640, 276);
  }
  ctx.restore();

  // Match log.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = 'rgba(232,220,192,0.85)';
  match.log.slice(-3).forEach((line, i) => {
    ctx.fillText(line, 640, 540 + i * 20);
  });
  ctx.restore();

  // Player row: name, life, ember, deck counts.
  ctx.save();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('YOU — EMBERKEEPER', 40, 618);
  drawLifeBar(ctx, 40, 630, 380, match.player.life, match.player.maxLife, 'left');
  drawEmberRow(ctx, 700, 640, match.player.ember, match.player.emberMax);
  drawStatusBadges(ctx, 40, 670, match.player);
  ctx.fillStyle = 'rgba(255,243,214,0.75)';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Deck ${match.player.deck.length} · Discard ${match.player.discard.length}`, 1080, 618);
  ctx.restore();

  // End Turn button.
  const btn = endTurnRect();
  const canEnd = match.phase === 'player' && !match.winner;
  ctx.save();
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 12);
  ctx.fillStyle = canEnd ? (ui.hoverEnd ? '#ff8a3c' : '#c95a1a') : '#4a4038';
  ctx.fill();
  ctx.strokeStyle = '#ffd76b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END TURN', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
  ctx.restore();

  // Player's hand.
  const rects = handRects(match.player.hand.length);
  match.player.hand.forEach((cardId, i) => {
    const rect = rects[i];
    const card = cardDef(cardId);
    const affordable = match.player.ember >= card.cost && match.phase === 'player';
    const lift = ui.hoverCard === i ? 26 : 0;
    drawCard(ctx, cardId, rect.x, rect.y, rect.w, rect.h, { lift, dim: !affordable });
    if (ui.hoverCard === i) {
      ctx.save();
      ctx.strokeStyle = '#ffd76b';
      ctx.lineWidth = 3;
      roundRect(ctx, rect.x - 2, rect.y - lift - 2, rect.w + 4, rect.h + 4, 14);
      ctx.stroke();
      ctx.restore();
    }
    // Key hint.
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), rect.x + rect.w / 2, rect.y + rect.h - lift + 16);
    ctx.restore();
  });

  // Played-card flourish: the card just played, large at the centre.
  if (ui.playedFx) {
    const { cardId, side, start, dur } = ui.playedFx;
    const age = Math.min(1, (now - start) / dur);
    if (age < 1) {
      const scale = 1 + 0.35 * Math.sin(age * Math.PI);
      const w = CARD_W * scale;
      const h = CARD_H * scale;
      const fromY = side === 'player' ? TABLE_HEIGHT - 120 : 120;
      const y = fromY + (430 - fromY) * Math.min(1, age * 1.6);
      ctx.save();
      ctx.globalAlpha = age > 0.75 ? 1 - (age - 0.75) / 0.25 : 1;
      drawCard(ctx, cardId, 640 - w / 2, y - h / 2, w, h, {});
      ctx.restore();
    }
  }

  drawFloats(ctx, match, now);

  if (screen === SCREEN_OVER) drawOver(ctx, match, now);
}
