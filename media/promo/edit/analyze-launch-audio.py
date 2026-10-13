"""Analyze the user-provided song reference; no transcription or generated voice."""
import json
import subprocess
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parent
FFMPEG = Path('C:/Users/ASUS/.codex/skills/video-use/bin/ffmpeg.exe')
source = ROOT / 'downloads/3-strikes-reference.m4a'
work = ROOT / 'audio'
work.mkdir(exist_ok=True)
sample = work / '3-strikes-analysis.wav'
subprocess.run([str(FFMPEG), '-y', '-v', 'error', '-i', str(source), '-t', '120',
                '-ac', '1', '-ar', '22050', str(sample)], check=True)
y, sr = librosa.load(sample, sr=22050)
onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset, sr=sr,
                                           hop_length=256, start_bpm=80, trim=False)
beats = librosa.frames_to_time(beat_frames, sr=sr, hop_length=256)
peaks = librosa.onset.onset_detect(onset_envelope=onset, sr=sr, hop_length=256,
                                 units='time')
result = {'source': 'User-supplied Bilibili BV1dBpRzsEsd',
          'estimatedBpm': float(np.asarray(tempo).reshape(-1)[0]),
          'beats': [round(float(t), 4) for t in beats],
          'onsets': [round(float(t), 4) for t in peaks],
          'note': 'Measured candidates, not manually listened or claimed exact musical bars.'}
(ROOT / 'launch-beats.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps({'bpm': result['estimatedBpm'], 'firstBeats': result['beats'][:16]}))
