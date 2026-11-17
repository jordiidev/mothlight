// The screenshot scenes behind ?shot=start|play|night|win. Each one
// plays the real rules forward from a fresh world for a fixed time,
// steered by a simple autopilot (fly toward the nearest pollen, keep
// clear of the nearest bat), so the frame is what a short game really
// looks like and the same seed always gives the same frame.
import { FIELD, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN, KIND_BAT, KIND_POLLEN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const NIGHT_SECONDS = 38;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

function nearest(state, kind) {
  let found = null;
  let best = Infinity;
  for (const item of state.items) {
    if (!item.active || item.kind !== kind) continue;
    const dx = item.x - state.moth.x;
    const dy = item.y - state.moth.y;
    const distance = dx * dx + dy * dy;
    if (distance < best) {
      best = distance;
      found = item;
    }
  }
  return found;
}

function autopilot(state) {
  const moth = state.moth;
  const bat = nearest(state, KIND_BAT);
  if (bat) {
    const dx = moth.x - bat.x;
    const dy = moth.y - bat.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 130) {
      const len = distance || 1;
      return { x: dx / len, y: dy / len, dash: false };
    }
  }
  const pollen = nearest(state, KIND_POLLEN);
  if (!pollen) return { x: 0, y: 0, dash: false };
  const dx = pollen.x - moth.x;
  const dy = pollen.y - moth.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len, dash: len > 260 };
}

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'night' && name !== 'win') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { x: 0, y: 0 }, false, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'win' ? END_LIMIT_SECONDS : name === 'night' ? NIGHT_SECONDS : PLAY_SECONDS;
  let events = 0;
  for (let index = 0; index < limit / STEP; index += 1) {
    const move = autopilot(world.state);
    events = world.step(STEP, move, move.dash, false);
    if (events & EVENT_OVER) break;
    if (events & EVENT_WIN) break;
  }
  if (world.state.won) return { screen: SCREEN_WIN, best: world.state.score };
  if (world.state.lives === 0) return { screen: SCREEN_OVER, best: world.state.score };
  return { screen: SCREEN_PLAY, best: world.state.score };
}
