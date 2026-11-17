// Mothlight rules and state, with no drawing and no browser in it:
// the moth, the pollen, the bats and the moonpetals, spawning,
// collisions, score and combo, lives and nights. step() advances one
// fixed step and returns what happened as bit flags, so the caller can
// react without the world knowing about screens or sound. Nothing here
// allocates after createWorld returns.
import {
  BAT,
  COMBO,
  FIELD,
  LIVES,
  MOTH,
  NIGHTS,
  PETAL,
  POLLEN,
  POLLEN_PER_NIGHT,
  POOL_SIZE,
} from './config.js';

export const KIND_POLLEN = 0;
export const KIND_BAT = 1;
export const KIND_PETAL = 2;

export const EVENT_POLLEN = 1;
export const EVENT_HIT = 2;
export const EVENT_OVER = 4;
export const EVENT_NIGHT = 8;
export const EVENT_WIN = 16;
export const EVENT_PETAL = 32;

function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function createWorld(random) {
  const moth = {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    invulnerable: 0,
    shield: 0,
    dashTime: 0,
    dashCooldown: 0,
    dashX: 0,
    dashY: 0,
    flap: 0,
  };
  const items = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    items.push({
      active: false, kind: KIND_POLLEN, x: 0, y: 0, radius: 0,
      vx: 0, vy: 0, age: 0, phase: 0,
    });
  }
  const stars = [];
  for (let index = 0; index < 70; index += 1) {
    stars.push({
      x: random() * FIELD.width,
      y: random() * FIELD.height * 0.7,
      size: 1 + random() * 2,
      phase: random() * Math.PI * 2,
    });
  }
  const flowers = [];
  for (let index = 0; index < 9; index += 1) {
    flowers.push({
      x: 70 + index * 140 + random() * 60,
      y: FIELD.height - 24 - random() * 18,
      height: 52 + random() * 46,
      sway: random() * Math.PI * 2,
    });
  }
  const state = {
    moth, items, stars, flowers,
    score: 0, pollen: 0, pollenNight: 0, lives: LIVES,
    night: 1, elapsed: 0, combo: 0, comboTimer: 0,
    pollenTimer: POLLEN.interval, batTimer: BAT.interval,
    petalTimer: PETAL.interval, won: false,
  };

  function reset() {
    moth.x = FIELD.width / 2;
    moth.y = FIELD.height * 0.55;
    moth.invulnerable = 0;
    moth.shield = 0;
    moth.dashTime = 0;
    moth.dashCooldown = 0;
    moth.flap = 0;
    for (const item of items) item.active = false;
    state.score = 0;
    state.pollen = 0;
    state.pollenNight = 0;
    state.lives = LIVES;
    state.night = 1;
    state.elapsed = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.pollenTimer = 0.4;
    state.batTimer = 1.4;
    state.petalTimer = PETAL.interval;
    state.won = false;
  }

  function freeItem() {
    for (let index = 0; index < items.length; index += 1) {
      if (!items[index].active) return items[index];
    }
    return null;
  }

  function spawnPollen() {
    const item = freeItem();
    if (item === null) return;
    item.active = true;
    item.kind = KIND_POLLEN;
    item.radius = POLLEN.radius;
    item.x = 50 + random() * (FIELD.width - 100);
    item.y = 70 + random() * (FIELD.height - 190);
    item.vx = (random() - 0.5) * POLLEN.drift;
    item.vy = (random() - 0.5) * POLLEN.drift;
    item.age = 0;
    item.phase = random() * Math.PI * 2;
  }

  function spawnBat() {
    const item = freeItem();
    if (item === null) return;
    const fromLeft = random() < 0.5;
    item.active = true;
    item.kind = KIND_BAT;
    item.radius = BAT.radius;
    item.x = fromLeft ? -30 : FIELD.width + 30;
    item.y = 60 + random() * (FIELD.height - 180);
    item.vx = (fromLeft ? 1 : -1) * (BAT.speed + BAT.speedPerNight * (state.night - 1) + random() * 60);
    item.vy = 0;
    item.age = 0;
    item.phase = random() * Math.PI * 2;
  }

  function spawnPetal() {
    const item = freeItem();
    if (item === null) return;
    item.active = true;
    item.kind = KIND_PETAL;
    item.radius = PETAL.radius;
    item.x = 60 + random() * (FIELD.width - 120);
    item.y = -20;
    item.vx = 0;
    item.vy = PETAL.fall;
    item.age = 0;
    item.phase = random() * Math.PI * 2;
  }

  function batInterval() {
    return Math.max(BAT.minInterval, BAT.interval * Math.pow(BAT.intervalScale, state.night - 1));
  }

  function collectPollen() {
    if (state.comboTimer > 0) state.combo = Math.min(COMBO.max, state.combo + 1);
    else state.combo = 1;
    state.comboTimer = COMBO.window;
    const gained = POLLEN.points * state.combo;
    state.score += gained;
    state.pollen += 1;
    state.pollenNight += 1;
    return gained;
  }

  // One fixed step. move is {x, y} in -1..1, dash starts a dash in
  // that direction. With harmless set (the title screen's backdrop)
  // things drift but nothing touches the moth and nothing scores.
  function step(dt, move, dash, harmless) {
    let events = 0;
    state.elapsed += dt;
    moth.flap += dt * 14;
    if (moth.invulnerable > 0) moth.invulnerable = Math.max(0, moth.invulnerable - dt);
    if (moth.shield > 0) moth.shield = Math.max(0, moth.shield - dt);
    if (moth.dashCooldown > 0) moth.dashCooldown = Math.max(0, moth.dashCooldown - dt);
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    if (dash && moth.dashCooldown === 0 && (move.x !== 0 || move.y !== 0)) {
      moth.dashTime = MOTH.dashTime;
      moth.dashCooldown = MOTH.dashCooldown;
      const len = Math.sqrt(move.x * move.x + move.y * move.y) || 1;
      moth.dashX = move.x / len;
      moth.dashY = move.y / len;
    }
    let speed = MOTH.speed;
    let mx = move.x;
    let my = move.y;
    if (moth.dashTime > 0) {
      moth.dashTime -= dt;
      speed = MOTH.dashSpeed;
      mx = moth.dashX;
      my = moth.dashY;
    }
    const len = Math.sqrt(mx * mx + my * my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    moth.x = Math.min(FIELD.width - MOTH.radius, Math.max(MOTH.radius, moth.x + mx * speed * dt));
    moth.y = Math.min(FIELD.height - MOTH.radius, Math.max(MOTH.radius, moth.y + my * speed * dt));

    if (!harmless) {
      state.pollenTimer -= dt;
      if (state.pollenTimer <= 0) {
        spawnPollen();
        state.pollenTimer += POLLEN.interval + random() * POLLEN.intervalJitter;
      }
      state.batTimer -= dt;
      if (state.batTimer <= 0) {
        spawnBat();
        state.batTimer += batInterval();
      }
      state.petalTimer -= dt;
      if (state.petalTimer <= 0) {
        spawnPetal();
        state.petalTimer += PETAL.interval;
      }
    }

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.active) continue;
      item.age += dt;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      if (item.kind === KIND_BAT) {
        item.y += Math.sin(item.age * 3 + item.phase) * 40 * dt;
        if (item.x < -60 || item.x > FIELD.width + 60) item.active = false;
        continue;
      }
      if (item.kind === KIND_POLLEN && item.age > POLLEN.lifetime) {
        item.active = false;
        continue;
      }
      if (item.kind === KIND_PETAL && item.y > FIELD.height + 30) {
        item.active = false;
        continue;
      }
      if (harmless) continue;
      const reach = MOTH.radius + item.radius;
      if (distance(moth.x, moth.y, item.x, item.y) > reach) continue;
      if (item.kind === KIND_POLLEN) {
        item.active = false;
        collectPollen();
        events |= EVENT_POLLEN;
        if (state.pollenNight >= POLLEN_PER_NIGHT) {
          if (state.night >= NIGHTS) {
            state.won = true;
            events |= EVENT_WIN;
          } else {
            state.night += 1;
            state.pollenNight = 0;
            state.petalTimer = PETAL.interval;
            events |= EVENT_NIGHT;
          }
        }
      } else if (item.kind === KIND_PETAL) {
        item.active = false;
        state.score += PETAL.points;
        moth.shield = PETAL.shieldTime;
        events |= EVENT_PETAL;
      } else if (moth.invulnerable === 0) {
        if (moth.shield > 0) {
          item.active = false;
          events |= EVENT_HIT;
        } else {
          item.active = false;
          state.lives -= 1;
          state.combo = 0;
          state.comboTimer = 0;
          moth.invulnerable = MOTH.invulnerable;
          events |= EVENT_HIT;
          if (state.lives === 0) {
            events |= EVENT_OVER;
            break;
          }
        }
      }
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
