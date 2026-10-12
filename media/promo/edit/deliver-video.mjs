import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';

const [input, output] = process.argv.slice(2);
if (!input || !output || !existsSync(input)) {
  throw new Error('Usage: node deliver-video.mjs <rendered.mp4> <delivery.mp4>');
}
if (path.resolve(input) === path.resolve(output)) {
  throw new Error('Input and output must differ; preserve the rendered original.');
}
const binary = process.env.PROMO_FFMPEG_PATH || 'C:/Users/ASUS/.codex/skills/video-use/bin/ffmpeg.exe';
const probe = path.join(path.dirname(binary), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
const metadata = spawnSync(probe, ['-v', 'error', '-show_streams', '-of', 'json', input], {encoding: 'utf8'});
if (metadata.status !== 0) throw new Error(metadata.stderr);
const video = JSON.parse(metadata.stdout).streams.find((stream) => stream.codec_type === 'video');
if (!video) throw new Error('Input contains no video.');
const full601 = (video.color_range === 'pc' || video.pix_fmt?.startsWith('yuvj'))
  && ['bt470bg', 'smpte170m'].includes(video.color_space);
const limited709 = video.color_range === 'tv' && video.color_space === 'bt709';
if (!full601 && !limited709) {
  throw new Error(`Unsupported input color contract: ${video.color_range}/${video.color_space}; do not guess.`);
}
const args = ['-y', '-hide_banner', '-i', input, '-map', '0:v:0', '-map', '0:a:0'];
if (full601) {
  args.push('-vf', 'scale=in_range=full:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-threads', '4',
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709');
} else {
  args.push('-c:v', 'copy');
}
args.push('-c:a', 'copy', '-bsf:v',
  'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
  '-movflags', '+faststart', output);
const result = spawnSync(binary, args, {stdio: 'inherit'});
if (result.status !== 0) throw new Error('Delivery export failed; rendered original is unchanged.');
