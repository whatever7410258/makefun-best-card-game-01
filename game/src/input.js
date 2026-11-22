// Ember Pact — mouse and keyboard input. Mouse position is mapped from the
// canvas's CSS size back to the 1280x900 logical table, so clicks land on
// the same cards whatever the window size. Keys 1-7 play hand cards,
// Enter/Space confirms or ends the turn, M mutes, Escape returns to title.
import { TABLE_WIDTH, TABLE_HEIGHT } from './config.js';
import { handRects, endTurnRect, startRect } from './render.js';

export const ACTION_CONFIRM = 1;
export const ACTION_END_TURN = 2;
export const ACTION_MUTE = 4;
export const ACTION_ESCAPE = 8;

function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (TABLE_WIDTH / rect.width),
    y: (clientY - rect.top) * (TABLE_HEIGHT / rect.height),
  };
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

/** Which hand card (if any) sits under a logical point, topmost first. */
export function cardAt(point, handCount) {
  const rects = handRects(handCount);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    if (inside(point, rects[i])) return i;
  }
  return -1;
}

export function createInput(canvas) {
  let actions = 0;
  let mouse = { x: -1, y: -1 };
  let clickedEnd = false;
  let clickedStart = false;

  function onMove(event) {
    mouse = toLogical(canvas, event.clientX, event.clientY);
  }

  function onClick(event) {
    const point = toLogical(canvas, event.clientX, event.clientY);
    mouse = point;
    clickedEnd = inside(point, endTurnRect());
    clickedStart = inside(point, startRect());
    // The caller reads the point and decides; store it for takeClick().
    lastClick = point;
  }

  let lastClick = null;

  function onKey(event) {
    if (event.repeat) return;
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (key === 'Escape') {
      actions |= ACTION_ESCAPE;
    } else if (key === 'm' || key === 'M') {
      actions |= ACTION_MUTE;
    } else if (/^[1-7]$/.test(key)) {
      pendingKey = Number(key) - 1;
    }
  }

  let pendingKey = -1;

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return {
    /** Drain queued keyboard actions (bitmask). */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Drain a pending number-key card index, or -1. */
    takeKeyCard() {
      const taken = pendingKey;
      pendingKey = -1;
      return taken;
    },
    /** Current mouse position in logical coordinates. */
    mouse() {
      return mouse;
    },
    /** Drain the last click point, or null. */
    takeClick() {
      const taken = lastClick;
      lastClick = null;
      const end = clickedEnd;
      const start = clickedStart;
      clickedEnd = false;
      clickedStart = false;
      return taken === null ? null : { point: taken, end, start };
    },
  };
}
