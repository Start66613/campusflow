import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const input = path.resolve(process.argv[2] || path.join(root, 'CampusFlow-Launch-连贯详解版.mp4'));
const edl = JSON.parse(readFileSync(path.resolve(process.argv[3] || path.join(root, 'launch-edl.json')), 'utf8'));
const seconds = edl.durationFrames / edl.fps;
let cursor = 0;
for (const range of edl.ranges) {
  if (range.from !== cursor || !Number.isInteger(range.duration) || range.duration <= 0) throw new Error('EDL gap, overlap or invalid duration');
  const overlap=range.transitionOutFrames??0;
  if (!Number.isInteger(overlap) || overlap<0 || overlap>=range.duration) throw new Error('EDL transition failed');
  cursor += range.duration-overlap;
}
if (cursor !== edl.durationFrames) throw new Error('EDL length failed');
if (!existsSync(input)) throw new Error('Delivery file does not exist');
const bin = 'C:/Users/ASUS/.codex/skills/video-use/bin';
const ffmpeg = path.join(bin, 'ffmpeg.exe');
const ffprobe = path.join(bin, 'ffprobe.exe');
const out = path.join(root, 'verify', `launch${seconds}-delivery`);
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
if (video.codec_name !== 'h264' || video.width !== edl.width || video.height !== edl.height || video.r_frame_rate !== `${edl.fps}/1` ||
    video.pix_fmt !== 'yuv420p' || video.color_range !== 'tv' || video.color_space !== 'bt709' ||
    video.color_primaries !== 'bt709' || video.color_transfer !== 'bt709') {
  throw new Error('Video color/size/framerate contract failed');
}
if (audio.codec_name !== 'aac' || audio.sample_rate !== '48000' || audio.channels !== 2 ||
    Number(video.nb_frames) !== edl.durationFrames || Math.abs(Number(probe.format.duration) - seconds) > 0.08) {
  throw new Error('Audio/duration contract failed');
}
const loudness = run(ffmpeg, ['-hide_banner', '-i', input, '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-']);
writeFileSync(path.join(out, 'loudness.log'), loudness.stderr);
const black = run(ffmpeg, ['-hide_banner', '-i', input, '-vf', 'blackdetect=d=0.08:pix_th=0.08', '-an', '-f', 'null', '-']);
writeFileSync(path.join(out, 'blackdetect.log'), black.stderr);
// Sample an otherwise empty stage corner to catch unexpected black/white background jumps.
// This checks continuity, not the subjective quality of motion or the entire frame's exposure.
const cornerRun=spawnSync(ffmpeg,['-v','error','-i',input,'-vf','fps=4,crop=2:2:1900:18',
  '-pix_fmt','gray','-f','rawvideo','pipe:1'],{maxBuffer:1024*1024});
if(cornerRun.status!==0)throw new Error(cornerRun.stderr.toString());
const corner=[];
for(let i=0;i<cornerRun.stdout.length;i+=4)corner.push([...cornerRun.stdout.subarray(i,i+4)].reduce((a,b)=>a+b,0)/4);
const stageContinuity={samples:corner.length,min:Math.min(...corner),max:Math.max(...corner),
  maxAdjacentChange:corner.reduce((largest,value,index)=>index?Math.max(largest,Math.abs(value-corner[index-1])):largest,0)};
writeFileSync(path.join(out,'stage-continuity.json'),JSON.stringify(stageContinuity,null,2));
const frames = [...new Set([
  36, 111, 280, edl.durationFrames - 1,
  ...edl.ranges.map((r) => r.from + Math.floor(r.duration * .66)),
  ...edl.ranges.filter((r) => /Rebuilt|Detailed|Cohesive/.test(r.scene)).flatMap((r) =>
    [.08, .22, .37, .52, .68, .86, .96].map((ratio) => r.from + Math.floor(r.duration * ratio))),
])].sort((a, b) => a - b);
for (const frame of frames) {
  run(ffmpeg, ['-y', '-v', 'error', '-ss', String(frame / edl.fps), '-i', input,
    '-frames:v', '1', path.join(out, `frame-${String(frame).padStart(4, '0')}.png`)]);
}
// Preserve the temporal order of each ±1.5s cut window in its own six-frame strip.
for (const range of edl.ranges.slice(1)) {
  run(ffmpeg, ['-y', '-v', 'error', '-ss', String(range.from / edl.fps - 1.5), '-i', input,
    '-t', '3', '-vf', 'fps=2,scale=480:270,tile=6x1', '-frames:v', '1',
    path.join(out, `cut-${String(range.from).padStart(4, '0')}.png`)]);
}
const levels = [];
for (const [start, duration] of [[0, 3], [seconds*.3, 3], [seconds*.5, 3], [seconds*.8, 3], [seconds-3, 2.1]]) {
  const result = run(ffmpeg, ['-hide_banner', '-ss', String(start), '-t', String(duration), '-i', input,
    '-af', 'volumedetect', '-vn', '-f', 'null', '-']);
  levels.push({start, duration,
    meanDb: Number(result.stderr.match(/mean_volume: ([\-\d.]+) dB/)?.[1]),
    maxDb: Number(result.stderr.match(/max_volume: ([\-\d.]+) dB/)?.[1])});
}
writeFileSync(path.join(out, 'section-levels.json'), JSON.stringify(levels, null, 2));
console.log(JSON.stringify({input, duration: probe.format.duration, frames: video.nb_frames,
  video: '1920x1080 60fps H264 yuv420p limited BT709', audio: 'AAC 48k stereo', levels,stageContinuity,
  blackEvents: black.stderr.match(/black_start:[^\r\n]+/g) || [],
  loudnessSummary: loudness.stderr.slice(loudness.stderr.lastIndexOf('Summary:')), out}, null, 2));
