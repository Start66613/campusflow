# CampusFlow 宣传片

70 秒中文产品介绍，横屏 1920×1080 和竖屏 1080×1920，均为 60 fps。

成片保存到 `edit/CampusFlow-宣传片-横屏.mp4` 与 `edit/CampusFlow-宣传片-竖屏.mp4`；可编辑的 Remotion 工程在 `edit/animations/remotion`，独立 HyperFrames 液态片头在 `edit/animations/hyperframes`。

## 本机安装

- Remotion 官方技能：`C:/Users/ASUS/.codex/skills/remotion-*`，本片运行时 4.0.534。
- HyperFrames：已安装 `hyperframes@openai-curated` 插件，并安装独立 `hyperframes`、`hyperframes-cli` 技能，项目 CLI 0.8.147。
- video-use：`C:/Users/ASUS/.codex/skills/video-use`，已补全整个仓库与 helpers，Python 虚拟环境位于 `.venv`。完整 FFmpeg/FFprobe 在 `bin`，已加入用户 PATH。
- Seedance Prompt Skill：`C:/Users/ASUS/.codex/skills/seedance`，镜头提示词在 `edit/seedance-prompts.md`。

Seedance 技能提供提示词设计，未接入 Seedance 在线生成服务。video-use 的 ElevenLabs 原始素材转写需使用者自己的 API Key；本片是新创作产品动效，无需原片 ASR，配音使用 Microsoft Yunxi，配乐由 `make_audio.py` 原创合成。

## 制作与重渲染

主片由 HyperFrames 片头 + Remotion 九场景组成，配音、字幕、演示数据与素材均保留在工程内。Studio 每个场景可单独编辑。此机器自动下载 Chromium 不稳定，因此渲染显式使用已安装的 Edge：

```powershell
cd edit/animations/remotion
npm.cmd install
npm.cmd run dev -- --port=3009
New-Item -ItemType Directory -Force ../../verify
npx.cmd remotion bundle src/index.ts --out-dir=build/promo-final
npx.cmd remotion render build/promo-final CampusFlow-Film ../../verify/render-landscape-fullrange.mp4 --browser-executable='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' --crf=18 --concurrency=3
npx.cmd remotion render build/promo-final CampusFlow-Vertical ../../verify/render-vertical-fullrange.mp4 --browser-executable='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' --crf=18 --concurrency=2
node ../../deliver-video.mjs ../../verify/render-landscape-fullrange.mp4 ../../CampusFlow-宣传片-横屏.mp4
node ../../deliver-video.mjs ../../verify/render-vertical-fullrange.mp4 ../../CampusFlow-宣传片-竖屏.mp4
```

配音与配乐可通过 `edit/make_audio.py` 重建。首次生成在线语音需联网，之后按脚本文本缓存；不会访问 App 的个人 API 密钥。`edit/capture-app.mjs` 在独立无痕浏览器中填入合成演示数据，采集 Web 兼容界面，不更改手机或已登录浏览器的数据。

重新混音后运行 `node edit/normalize-audio.mjs`，再渲染视频。脚本保留未归一化母带，并做两遍响度处理；目标 -14 LUFS、母带 -1.5 dBTP，为最终 AAC 留出余量。每次更改配音、音乐或时长，都要重新测量最终 MP4，不能沿用旧母带的测量结果。

渲染前先生成一次固定 bundle；两个版本读取同一份经过核对的素材包。制作中曾出现临时渲染服务器只对三张嘉豪图标返回 404、而源文件存在的情况，固定 bundle 的对应帧验证通过后才重试，不把失败的渲染当成可交付文件。

`deliver-video.mjs` 将 Remotion 默认 JPEG 输出的 full-range/BT.601 实际转换为 limited/BT.709，补齐 H.264 色彩标签、保留 AAC 原流并设置 faststart。不要仅给原片改标签而不转换矩阵。

## 验证

HyperFrames 的 lint、validate、inspect、contrast 均通过。Remotion 通过 TypeScript 和横竖屏代表帧检查。最终媒体参数、切点与响度记录保存在 `edit/qa-report.md`。画面包含源代码还原的操作演示，以清晰说明功能；不是 iPhone 原生材质的逐帧实机录屏。所有成绩和消费数字为演示数据。

影片源文件与开发记录同步 GitHub；大型成片及临时渲染缓存只保存在本机。

本机安装后的技能会在后续会话自动发现；本次制作已直接读取各技能。安装位置和工具依赖见 `edit/installed-tools.json`。
