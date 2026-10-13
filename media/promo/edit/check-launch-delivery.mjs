import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const input = path.resolve(process.argv[2] || path.join(root, 'CampusFlow-Launch-湘大篇.mp4'));
if (!existsSync(input)) throw new Error('Delivery file does not exist');
const bin = 'C:/Users/ASUS/.codex/skills/video-use/bin';
const ffmpeg = path.join(bin, 'ffmpeg.exe');
const ffprobe = path.join(bin, 'ffprobe.exe');
const out = path.join(root, 'verify', 'launch48-delivery');
mkdirSync(out, {recursive: true});
const run = (exe, args) => {
  const result = spawnSync(exe, args, {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024});
  if (result.status !== 0) throw new Error(result.stderr || `Failed: ${exe}`);
  return result;
};
const probe = JSON.parse(run(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', input]).stdout);
writeFileSync(path.join(out, 'probe.json'), JSON.stringify(probe, null, 2));
const video = probe.streams.find((s) => s.codec_type === 'video');
const audio = probe.streams.find((s) => s.codec_type === 'audio');
if (video.codec_name !== 'h264' || video.width !== 1920 || video.height !== 1080 || video.r_frame_rate !== '60/1' ||
    video.pix_fmt !== 'yuv420p' || video.color_range !== 'tv' || video.color_space !== 'bt709' ||
    video.color_primaries !== 'bt709' || video.color_transfer !== 'bt709') {
  throw new Error('Video color/size/framerate contract failed');
}
if (audio.codec_name !== 'aac' || audio.sample_rate !== '48000' || audio.channels !== 2 ||
    Math.abs(Number(probe.format.duration) - 48) > 0.08) {
  throw new Error('Audio/duration contract failed');
}
const loudness = run(ffmpeg, ['-hide_banner', '-i', input, '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-']);
writeFileSync(path.join(out, 'loudness.log'), loudness.stderr);
const black = run(ffmpeg, ['-hide_banner', '-i', input, '-vf', 'blackdetect=d=0.08:pix_th=0.08', '-an', '-f', 'null', '-']);
writeFileSync(path.join(out, 'blackdetect.log'), black.stderr);
const frames = [36, 111, 280, 488, 577, 841, 1115, 1181, 1535, 1736, 1908, 2184, 2361, 2576, 2651, 2803, 2879];
for (const frame of frames) {
  run(ffmpeg, ['-y', '-v', 'error', '-ss', String(frame / 60), '-i', input,
    '-frames:v', '1', path.join(out, `frame-${String(frame).padStart(4, '0')}.png`)]);
}
const levels = [];
for (const [start, duration] of [[0, 3], [18, 3], [27, 3], [42, 3], [45, 2.1]]) {
  const result = run(ffmpeg, ['-hide_banner', '-ss', String(start), '-t', String(duration), '-i', input,
    '-af', 'volumedetect', '-vn', '-f', 'null', '-']);
  levels.push({start, duration,
    meanDb: Number(result.stderr.match(/mean_volume: ([\-\d.]+) dB/)?.[1]),
    maxDb: Number(result.stderr.match(/max_volume: ([\-\d.]+) dB/)?.[1])});
}
writeFileSync(path.join(out, 'section-levels.json'), JSON.stringify(levels, null, 2));
const edl = JSON.parse(readFileSync(path.join(root, 'launch-edl.json'), 'utf8'));
if (edl.ranges.reduce((sum, range) => sum + range.duration, 0) !== 2880) throw new Error('EDL length failed');
console.log(JSON.stringify({input, duration: probe.format.duration, frames: video.nb_frames,
  video: '1920x1080 60fps H264 yuv420p limited BT709', audio: 'AAC 48k stereo', levels,
  blackEvents: black.stderr.match(/black_start:[^\r\n]+/g) || [],
  loudnessSummary: loudness.stderr.slice(loudness.stderr.lastIndexOf('Summary:')), out}, null, 2));
