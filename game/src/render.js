// Drawing only: the world's state and the current screen in, pixels
// out. The 1280x720 playfield is scaled to fit the window and centred,
// the margin filled with the backdrop colour. Night garden: a gradient
// sky, twinkling stars, a glowing moon, flowers along the ground, a
// luna moth with flapping wings, glowing pollen, dark bats and a
// moonpetal. Canvas text for the HUD and the panels.
import { FIELD, FONT, LIVES, NIGHTS, PALETTE, POLLEN_PER_NIGHT } from './config.js';
import { KIND_BAT, KIND_PETAL, KIND_POLLEN } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const PANEL = { width: 640, top: 138, line: 34, bottom: 74 };

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const nightLabel = cachedLabel('Night ');
  const pollenLabel = cachedLabel('Pollen ');
  const finalLabel = cachedLabel('Score ');
  const bestLabel = cachedLabel('Best ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawSky(state) {
    const gradient = context.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.skyTop);
    gradient.addColorStop(1, PALETTE.skyBottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    for (const star of state.stars) {
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(state.elapsed * 1.4 + star.phase));
      context.globalAlpha = twinkle;
      context.fillStyle = PALETTE.star;
      context.fillRect(star.x, star.y, star.size, star.size);
    }
    context.globalAlpha = 1;
    context.fillStyle = PALETTE.moonGlow;
    context.globalAlpha = 0.18;
    context.beginPath();
    context.arc(1120, 96, 62, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = PALETTE.moon;
    context.beginPath();
    context.arc(1120, 96, 38, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.skyBottom;
    context.beginPath();
    context.arc(1106, 88, 7, 0, Math.PI * 2);
    context.arc(1132, 108, 5, 0, Math.PI * 2);
    context.fill();
  }

  function drawFlowers(state) {
    for (const flower of state.flowers) {
      const sway = Math.sin(state.elapsed * 0.9 + flower.sway) * 6;
      const topX = flower.x + sway;
      const topY = FIELD.height - flower.height;
      context.strokeStyle = PALETTE.flowerStem;
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(flower.x, FIELD.height);
      context.quadraticCurveTo(flower.x + sway / 2, FIELD.height - flower.height / 2, topX, topY);
      context.stroke();
      context.fillStyle = PALETTE.flowerPetal;
      for (let petal = 0; petal < 5; petal += 1) {
        const angle = (petal / 5) * Math.PI * 2 + flower.sway;
        context.beginPath();
        context.arc(topX + Math.cos(angle) * 11, topY + Math.sin(angle) * 11, 8, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = PALETTE.flowerCentre;
      context.beginPath();
      context.arc(topX, topY, 7, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = '#1d2b1a';
    context.fillRect(0, FIELD.height - 14, FIELD.width, 14);
  }

  function drawPollen(item, state) {
    const pulse = 0.7 + 0.3 * Math.sin(state.elapsed * 4 + item.phase);
    context.globalAlpha = 0.25 * pulse;
    context.fillStyle = PALETTE.pollenGlow;
    context.beginPath();
    context.arc(item.x, item.y, item.radius * 2.1, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = PALETTE.pollen;
    context.beginPath();
    context.arc(item.x, item.y, item.radius * pulse, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#fff6c9';
    context.beginPath();
    context.arc(item.x - 3, item.y - 3, 3.5, 0, Math.PI * 2);
    context.fill();
  }

  function drawBat(item) {
    const flap = Math.sin(item.age * 10 + item.phase) * 0.6;
    context.fillStyle = PALETTE.bat;
    context.beginPath();
    context.ellipse(item.x - 18, item.y - flap * 10, 20, 9, -0.5 - flap * 0.3, 0, Math.PI * 2);
    context.ellipse(item.x + 18, item.y - flap * 10, 20, 9, 0.5 + flap * 0.3, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(item.x, item.y, 13, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.batEye;
    context.beginPath();
    context.arc(item.x - 5, item.y - 2, 2.5, 0, Math.PI * 2);
    context.arc(item.x + 5, item.y - 2, 2.5, 0, Math.PI * 2);
    context.fill();
  }

  function drawMoth(state) {
    const moth = state.moth;
    if (moth.invulnerable > 0 && Math.floor(moth.invulnerable * 10) % 2 === 0) return;
    const flap = Math.sin(moth.flap) * 0.55;
    const glow = moth.shield > 0 ? 0.35 : 0.12;
    context.globalAlpha = glow;
    context.fillStyle = PALETTE.pollenGlow;
    context.beginPath();
    context.arc(moth.x, moth.y, 44, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    context.save();
    context.translate(moth.x, moth.y);
    context.fillStyle = PALETTE.mothWing;
    context.beginPath();
    context.ellipse(-16, -8 - flap * 14, 20, 11, -0.6 - flap, 0, Math.PI * 2);
    context.ellipse(16, -8 - flap * 14, 20, 11, 0.6 + flap, 0, Math.PI * 2);
    context.ellipse(-14, 10 + flap * 8, 14, 8, -0.4, 0, Math.PI * 2);
    context.ellipse(14, 10 + flap * 8, 14, 8, 0.4, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = PALETTE.mothWingEdge;
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = PALETTE.mothBody;
    context.beginPath();
    context.ellipse(0, 0, 6, 17, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#2b2350';
    context.beginPath();
    context.arc(-3, -14, 2.5, 0, Math.PI * 2);
    context.arc(3, -14, 2.5, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawField(state) {
    drawSky(state);
    drawFlowers(state);
    for (const item of state.items) {
      if (!item.active) continue;
      if (item.kind === KIND_POLLEN) drawPollen(item, state);
      else if (item.kind === KIND_BAT) drawBat(item);
      else if (item.kind === KIND_PETAL) {
        context.fillStyle = '#f7c6e0';
        context.beginPath();
        context.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = PALETTE.accent;
        context.beginPath();
        context.arc(item.x, item.y, 5, 0, Math.PI * 2);
        context.fill();
      }
    }
    drawMoth(state);
  }

  function drawHud(state) {
    context.textBaseline = 'top';
    text(scoreLabel(state.score), 24, 18, 28, PALETTE.text, 'left');
    text(pollenLabel(`${state.pollenNight}/${POLLEN_PER_NIGHT}`), 250, 18, 28, PALETTE.accent, 'left');
    text(nightLabel(`${state.night}/${NIGHTS}`), FIELD.width / 2, 18, 28, PALETTE.text, 'center');
    if (state.combo > 1) text(`Combo x${state.combo}`, FIELD.width - 210, 18, 28, PALETTE.accent, 'right');
    const firstWing = FIELD.width - 24 - LIVES * 34;
    text('Lives', firstWing - 14, 18, 24, PALETTE.text, 'right');
    for (let life = 0; life < LIVES; life += 1) {
      context.fillStyle = life < state.lives ? PALETTE.mothWing : '#3a4470';
      context.beginPath();
      context.ellipse(firstWing + life * 34 + 10, 30, 12, 7, -0.5, 0, Math.PI * 2);
      context.ellipse(firstWing + life * 34 + 22, 30, 12, 7, 0.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 52, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 22, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 24, PALETTE.accent, 'center');
  }

  const TITLE_LINES = [
    'Guide the luna moth through the night garden.',
    'Collect pollen to light the lantern: 25 a night,',
    '3 nights to dawn. Moonpetals give a shield.',
    'Fly with WASD or arrows, steer with the mouse,',
    'dash with Shift. Avoid the bats.  Pause with P.',
    '',
  ];
  const PAUSED_LINES = ['The bats will wait for you.'];
  const OVER_LINES = ['', ''];
  const WIN_LINES = ['', '', ''];

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[5] = bestLabel(best);
      drawPanel('MOTHLIGHT', TITLE_LINES, 'Press Space or click to start');
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) drawPanel('Paused', PAUSED_LINES, 'Press P to resume');
    else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = finalLabel(state.score);
      OVER_LINES[1] = bestLabel(best);
      drawPanel('Night falls', OVER_LINES, 'Press Space or click to fly again');
    } else if (screen === SCREEN_WIN) {
      WIN_LINES[0] = finalLabel(state.score);
      WIN_LINES[1] = `Pollen ${state.pollen}  ·  Best ${best}`;
      WIN_LINES[2] = 'All three nights lit. Dawn breaks.';
      drawPanel('Dawn breaks — you win!', WIN_LINES, 'Press Space or click to play again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
