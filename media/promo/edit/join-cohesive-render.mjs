import {spawnSync} from 'node:child_process';
import {existsSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const bin='C:/Users/ASUS/.codex/skills/video-use/bin';
const head=path.join(root,'verify/cohesive99-first4200.mp4');
const tail=path.join(root,'verify/cohesive99-last1740.mp4');
const music=path.join(root,'animations/remotion/public/audio/launch-3-strikes.wav');
const output=path.join(root,'verify/render-cohesive99-recovered-fullrange.mp4');
const run=(name,args)=>{
  const result=spawnSync(path.join(bin,name),args,{encoding:'utf8',maxBuffer:8*1024*1024});
  if(result.status!==0)throw Error(result.stderr||'Media command failed');
  return result.stdout;
};
for(const [file,count] of [[head,4200],[tail,1740]]){
  if(!existsSync(file))throw Error(`Missing chunk ${file}`);
  const data=JSON.parse(run('ffprobe.exe',['-v','error','-show_streams','-of','json',file]));
  const video=data.streams.find(s=>s.codec_type==='video');
  if(!video||video.codec_name!=='h264'||video.width!==1920||video.height!==1080||
    video.r_frame_rate!=='60/1'||Number(video.nb_frames)!==count)throw Error('Chunk frame contract failed');
}
const list=path.join(root,'verify/cohesive99-video-parts.ffconcat');
const escaped=p=>p.replace(/\\/g,'/').replace(/'/g,"'\\''");
writeFileSync(list,`ffconcat version 1.0\nfile '${escaped(head)}'\nfile '${escaped(tail)}'\n`);
// Only the picture is concatenated. Keep the single continuous master audio across the seam.
run('ffmpeg.exe',['-y','-v','error','-f','concat','-safe','0','-i',list,'-i',music,
  '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-ac','2',
  '-t','99','-movflags','+faststart',output]);
console.log(output);
