// Procedural sound, no files: a tiny WebAudio chime kit. Every
// sound is an oscillator with an envelope, started only after the
// player has pressed something, so a browser never blocks it.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(frequency, seconds, type, gain) {
    const audio = ensure();
    if (!audio) return;
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, audio.currentTime);
    envelope.gain.linearRampToValueAtTime(gain, audio.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + seconds);
    oscillator.connect(envelope);
    envelope.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + seconds + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    pollen(combo) {
      const base = 523 + combo * 60;
      tone(base, 0.35, 'sine', 0.12);
      tone(base * 1.5, 0.4, 'sine', 0.07);
    },
    petal() {
      tone(392, 0.4, 'triangle', 0.12);
      tone(587, 0.5, 'triangle', 0.1);
      tone(784, 0.6, 'sine', 0.08);
    },
    hit() {
      tone(110, 0.3, 'sawtooth', 0.14);
      tone(82, 0.35, 'square', 0.08);
    },
    night() {
      [523, 659, 784, 1046].forEach((frequency, index) => {
        setTimeout(() => tone(frequency, 0.5, 'sine', 0.1), index * 90);
      });
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((frequency, index) => {
        setTimeout(() => tone(frequency, 0.7, 'sine', 0.11), index * 110);
      });
    },
  };
}
