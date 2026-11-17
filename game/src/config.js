// Mothlight tuning: every number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales
// it to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

export const STEP = 1 / 60;

export const MOTH = {
  radius: 18,
  speed: 430,
  dashSpeed: 780,
  dashTime: 0.18,
  dashCooldown: 1.1,
  invulnerable: 1.6,
};

export const LIVES = 3;
export const NIGHTS = 3;
export const POLLEN_PER_NIGHT = 25;

export const POLLEN = {
  radius: 11,
  interval: 0.55,
  intervalJitter: 0.4,
  lifetime: 12,
  points: 10,
  drift: 14,
};

export const BAT = {
  radius: 20,
  speed: 185,
  speedPerNight: 38,
  interval: 1.7,
  intervalScale: 0.82,
  minInterval: 0.7,
};

export const PETAL = {
  radius: 13,
  interval: 13,
  points: 50,
  shieldTime: 5,
  fall: 46,
};

export const COMBO = { window: 3, max: 5 };

export const POOL_SIZE = 72;

export const PALETTE = {
  backdrop: '#0b0e1d',
  skyTop: '#131a3a',
  skyBottom: '#2b2350',
  moon: '#f6e8c9',
  moonGlow: '#f6e8c9',
  star: '#dfe6ff',
  flowerStem: '#2f7a4e',
  flowerPetal: '#e58fb1',
  flowerCentre: '#f2c94c',
  pollen: '#ffd94d',
  pollenGlow: '#ffdf6b',
  bat: '#1c1430',
  batEye: '#ff5a5a',
  mothBody: '#f3ead2',
  mothWing: '#cfe8c9',
  mothWingEdge: '#8fb8a8',
  panel: '#171c33',
  panelEdge: '#3a4470',
  text: '#f4f1e6',
  muted: '#b9bdd6',
  accent: '#ffd94d',
  danger: '#ff6b6b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const BEST_KEY = 'mothlight.best';
