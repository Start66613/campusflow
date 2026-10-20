import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Original periodic, band-limited ambient sounds; no downloaded recordings.
const directory = new URL('../assets/audio/', import.meta.url);
mkdirSync(directory, { recursive: true });
const rate = 16000;
const seconds = 20;
const count = rate * seconds;
for (const [name, slope] of [['soft-rain', 0.3], ['soft-breeze', 0.9]]) {
  let seed = 191026;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const tones = Array.from({ length: 120 }, () => {
    const bin = Math.round((60 + 6000 * random() ** 2) * seconds);
    return { hz: bin / seconds, phase: random() * Math.PI * 2, amplitude: 1 / (bin / seconds) ** slope };
  });
  const samples = new Float32Array(count);
  let peak = 0;
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    let value = tones.reduce((sum, tone) => sum + Math.sin(2 * Math.PI * tone.hz * t + tone.phase) * tone.amplitude, 0);
    value *= 0.78 + 0.13 * Math.sin(2 * Math.PI * t / seconds) + 0.09 * Math.cos(2 * Math.PI * t / (seconds / 3));
    samples[i] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const wav = Buffer.alloc(44 + count * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) wav.writeInt16LE(Math.round(samples[i] / peak * 0.48 * 32767), 44 + i * 2);
  writeFileSync(new URL(`${name}.wav`, directory), wav);
  console.log(`${name}.wav — ${seconds}s, ${wav.length} bytes, ${fileURLToPath(directory)}`);
}
