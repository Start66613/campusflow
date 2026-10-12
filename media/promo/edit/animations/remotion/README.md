# CampusFlow Product Film

70-second Chinese product film, 60 fps. `CampusFlow-Film` is 1920×1080; `CampusFlow-Vertical` is 1080×1920 with adaptive layout. Each of the nine scenes has its own Studio timeline. Preview: `npm run dev -- --port=3009`.

Assets: actual isolated app screenshots with synthetic data in `public/screens`; local icon/theme assets in `public/images`; HyperFrames material opening in `public/intro.mp4`; original audio mix in `public/audio/master.wav`; voiceover cues in `public/audio/captions.json` with `{start,end,text}` seconds.

Scene starts: 0, 6, 12, 21, 28, 38, 47, 55, 63 seconds. Transitions overlap 0.4s. Each scene is an authored JSX node. Animations are deterministic frame-driven values. Chinese fonts are local Microsoft YaHei copies for the Windows renderer.

The footage is a development preview. System calendar requires a development build; native iOS materials depend on operating-system support. It does not advertise App Store availability, available widgets, or automatic background payment capture. GPA/expenses are demonstration data.

Export: `npx remotion render src/index.ts CampusFlow-Film out/CampusFlow-1080p.mp4 --codec=h264 --crf=18 --concurrency=4`. Use `CampusFlow-Vertical` for the portrait version. Check with `npx tsc --noEmit`.

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i --loglevel=error
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
