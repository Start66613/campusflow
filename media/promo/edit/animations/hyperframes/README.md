# CampusFlow Liquid Intro

6.4-second, 1920×1080, 60 fps product intro. Three violet droplets converge and stretch into a rounded glass capsule. The actual CampusFlow app icon is revealed, followed by “大学生活，进入顺滑模式”. Palette and type follow the shared `DESIGN.md`. The material motion was designed from the shared Seedance prompt; this segment was rendered locally with HyperFrames and GSAP, not submitted to a generative video service.

## Files

- `index.html`: deterministic source, one paused registered GSAP timeline.
- `assets/icon-2026.png`: actual application icon, copied for the video.
- `assets/gsap.min.js`: GSAP 3.14.2, local to avoid render-time CDN fetching.
- `intro.mp4`: rendered H.264 BT.709 delivery file; no audio (master edit adds narration/music).
- `hero.png`: actual output frame at 4.25 seconds.
- `droplets.png`: actual output frame at 0.9 seconds.
- `render.ps1`: checks and pinned final render.
- `preview.ps1`: managed persistent Studio preview.

## Runtime and commands

HyperFrames CLI is pinned to **0.8.147**. Node v24.18.0. Microsoft Edge 155 used through `HYPERFRAMES_BROWSER_PATH`; NVIDIA hardware browser rendering. FFmpeg/FFprobe n7.1 are supplied by the sibling Remotion compositor package and added only to the process PATH.

```powershell
./render.ps1
./preview.ps1
npx.cmd --yes hyperframes@0.8.147 preview --stop
```

Studio preview: `http://localhost:3004/#project/hyperframes`.

Scaffold command: `npx.cmd --yes hyperframes init hyperframes --example blank --resolution landscape --non-interactive`. Final render command: `npx.cmd --yes hyperframes@0.8.147 render --output intro.mp4 --fps 60 --quality delivery --workers 2 --strict-all`.

## Verification

`npm run check` passed: 0 lint, runtime, layout and motion findings; 17/17 WCAG AA contrast checks passed. Separate `lint`, `validate` and `inspect` commands passed; explicit layout samples at 0.5, 1.5, 2.4, 3.4 and 5.8 seconds have zero issues. The hero and droplet frames were visually inspected. FFprobe confirms 1920×1080, 60/1 fps, 6.400000 seconds and 384 frames. Render took 23.5 seconds, output 1,849,703 bytes.

The installed plugin's legacy animation-map helper cannot import its unpublished `@hyperframes/producer` dependency. The current pinned CLI's full `check` command supplies motion verification. `init` attempted a GitHub skills freshness update but GitHub connection failed; the existing installed plugin skills were read and used successfully. The unnecessary Chrome download was stopped after the existing Edge runtime passed checks and rendering.
