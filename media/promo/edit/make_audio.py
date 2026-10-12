"""Reproducible Chinese narration and original electronic score for CampusFlow."""
import argparse
import asyncio
import json
import io
import re
import subprocess
import wave
from pathlib import Path

import edge_tts
import numpy as np

ROOT = Path(__file__).resolve().parent
AUDIO = ROOT / 'audio'
PUBLIC = ROOT / 'animations' / 'remotion' / 'public' / 'audio'
SR = 48000
DURATION = 70
BEATS = [
    (0.8, 5.5, '大学生活，也该有自己的顺滑节奏。'),
    (6.5, 11.5, 'CampusFlow，把课表、待办和生活，放进一个校园助手。'),
    (12.6, 20.5, '一整周，一眼看清。长按拖动，快速调整课程；左右滑动，切换每一周。'),
    (21.6, 27.5, '登录湘大教务，导入课表和成绩。也能从表格或截图开始。'),
    (28.6, 37.5, '一句话，记下来。消费、日程、作业，AI帮你整理，核对后写入，还能立即撤销。'),
    (38.6, 46.5, '成绩有口径，方向有依据。必修绩点与选修学分分开看，联网建议附上网页来源。'),
    (47.6, 54.5, '专注二十五分钟，记录每一笔消费，在周报里看见自己的进步。'),
    (55.6, 62.5, '颜色、背景、头像，全都由你。想换个心情？全体嘉豪，往里豪。'),
    (63.6, 69.4, 'CampusFlow。你的大学节奏，由你掌握。'),
]

def write_wav(file, pcm):
    file.parent.mkdir(parents=True, exist_ok=True)
    data = np.asarray(np.clip(pcm, -1, 1) * 32767, dtype='<i2')
    with wave.open(str(file), 'wb') as w:
        w.setnchannels(1 if data.ndim == 1 else data.shape[1])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())

async def make_voices():
    AUDIO.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(3)
    async def one(index, text):
        target = AUDIO / f'voice-{index}.mp3'
        transcript = AUDIO / f'voice-{index}.txt'
        if target.exists() and target.stat().st_size > 1000 and transcript.exists() and transcript.read_text(encoding='utf-8') == text:
            return
        async with semaphore:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, voice='zh-CN-YunxiNeural', rate='+5%', pitch='-2Hz').save(str(target))
                    transcript.write_text(text, encoding='utf-8')
                    print(f'voice {index} ready', flush=True)
                    return
                except Exception as error:
                    if attempt == 2:
                        raise RuntimeError(f'Voice {index} failed: {error}') from error
                    await asyncio.sleep(2)
    await asyncio.gather(*(one(i, text) for i, (_, _, text) in enumerate(BEATS)))

def music():
    n = int(SR * DURATION)
    score = np.zeros((n, 2), dtype=np.float32)
    rng = np.random.default_rng(12012)
    def add(start, sound, gain=1, pan=0):
        offset = int(start * SR)
        if offset < 0 or offset >= n:
            return
        sound = sound[:n-offset]
        score[offset:offset+len(sound), 0] += sound * gain * np.sqrt((1-pan)/2)
        score[offset:offset+len(sound), 1] += sound * gain * np.sqrt((1+pan)/2)
    def tone(freq, dur, attack=.018, decay=1.0):
        t = np.arange(int(dur*SR), dtype=np.float32)/SR
        env = np.minimum(1, t/attack) * np.exp(-t/decay) * np.minimum(1, (dur-t)/.055)
        return (np.sin(2*np.pi*freq*t) + .15*np.sin(4*np.pi*freq*t)) * env
    chords = [(146.83,184.997,220),(123.47,146.83,184.997),(98,123.47,146.83),(110,138.59,164.81)]
    beat = 60/96
    for bar in range(28):
        start = bar * beat*4
        chord = chords[(bar//2)%4]
        for k, freq in enumerate(chord):
            add(start, tone(freq,3.2,.6,4),.042,[-.45,0,.45][k])
        for i in range(8):
            freq = chord[[0,1,2,1,0,2,1,2][i]] * (2 if i%3 else 4)
            add(start+i*beat/2,tone(freq,.65,.01,.2),.055,np.sin(i*1.8)*.55)
        if start >= 5.0 and start < 65:
            for i in range(4):
                t = np.arange(int(.22*SR),dtype=np.float32)/SR
                kick = np.sin(2*np.pi*(48*t + 40*.018*(1-np.exp(-t/.018)))) * np.exp(-t/.055)
                add(start+i*beat,kick,.10)
                hat = rng.normal(0,1,int(.055*SR)).astype(np.float32)
                hat = np.diff(hat,prepend=0)*np.exp(-np.arange(len(hat))/SR/.016)
                add(start+i*beat+beat/2,hat,.015,(-1)**i*.6)
            add(start+beat,tone(185,.18,.002,.036),.025)
            add(start+beat*3,tone(185,.18,.002,.036),.025)
    # Four quiet, event-linked accent sounds; no stock transition barrage.
    for start in [1.1, 21.1, 28.1, 55.1]:
        t=np.arange(int(.45*SR),dtype=np.float32)/SR
        drop=np.sin(2*np.pi*(920*t+350*t*t))*np.exp(-t/.075)*np.minimum(1,t/.006)
        add(start,drop,.08)
    t=np.arange(n)/SR
    envelope=np.minimum(1,t/1.5)*np.minimum(1,(DURATION-t)/2.2)
    # Duck the score under the complete spoken phrases.
    for start, end, _ in BEATS:
        envelope *= 1-.55*np.minimum(1,np.maximum(0,(t-start+.18)/.28))*np.minimum(1,np.maximum(0,(end+.15-t)/.32))
    score *= envelope[:,None]
    write_wav(AUDIO/'music-original.wav',score)
    return score

def mix(ffmpeg):
    PUBLIC.mkdir(parents=True, exist_ok=True)
    score=music()
    voice=np.zeros(len(score),dtype=np.float32)
    cues=[]
    for i,(start,end,text) in enumerate(BEATS):
        source=AUDIO/f'voice-{i}.mp3'
        raw=subprocess.check_output([ffmpeg,'-v','error','-i',str(source),'-f','wav','-c:a','pcm_s16le','-ac','1','-ar',str(SR),'-'])
        with wave.open(io.BytesIO(raw),'rb') as w:
            frames=w.readframes(w.getnframes())
        dur=len(frames)/2/SR
        speed=max(1,dur/(end-start))
        decoded=subprocess.check_output([ffmpeg,'-v','error','-i',str(source),'-af',f'atempo={speed:.4f},loudnorm=I=-17:TP=-2:LRA=7','-f','wav','-c:a','pcm_s16le','-ac','1','-ar',str(SR),'-'])
        with wave.open(io.BytesIO(decoded),'rb') as w:
            frames=w.readframes(w.getnframes())
        pcm=np.frombuffer(frames,dtype='<i2').astype(np.float32)/32768
        # Fades are applied to complete phrases; never cut a spoken word.
        fade=min(int(.03*SR),len(pcm)//2)
        pcm[:fade]*=np.linspace(0,1,fade)
        pcm[-fade:]*=np.linspace(1,0,fade)
        offset=int(start*SR)
        voice[offset:offset+len(pcm)] += pcm
        actual_end=start+len(pcm)/SR
        clauses=[s.strip() for s in re.split('(?<=[。！？；，])',text) if s.strip()]
        parts=[]
        for clause in clauses:
            if parts and len(parts[-1])+len(clause)<=22 and not parts[-1].endswith(('。','！','？')):
                parts[-1]+=clause
            else:
                parts.append(clause)
        total=sum(len(p) for p in parts)
        cursor=start
        for part in parts:
            length=(actual_end-start)*len(part)/total
            cues.append({'start':round(cursor,3),'end':round(cursor+length,3),'text':part})
            cursor+=length
        print(f'voice {i}: original {dur:.2f}s, placed {actual_end-start:.2f}s, speed {speed:.2f}',flush=True)
    write_wav(AUDIO/'narration.wav',voice)
    master=score+voice[:,None]*.707
    peak=float(np.max(np.abs(master)))
    if peak > .89: master*=.89/peak
    write_wav(PUBLIC/'master.wav',master)
    write_wav(AUDIO/'master-raw.wav',master)
    (PUBLIC/'captions.json').write_text(json.dumps(cues,ensure_ascii=False,indent=2),encoding='utf-8')
    (ROOT/'narration-script.json').write_text(json.dumps([{'start':s,'windowEnd':e,'text':t} for s,e,t in BEATS],ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Master ready: {PUBLIC / "master.wav"}; peak {float(np.max(np.abs(master))):.3f}',flush=True)

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--stage',choices=['voices','mix','all'],default='all')
    ap.add_argument('--ffmpeg',default='ffmpeg')
    args=ap.parse_args()
    if args.stage!='mix':asyncio.run(make_voices())
    if args.stage!='voices':mix(args.ffmpeg)
