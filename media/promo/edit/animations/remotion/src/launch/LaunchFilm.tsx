import { Audio } from "@remotion/media";
import { AbsoluteFill, Series, staticFile, useVideoConfig } from "remotion";
import { LaunchIntro } from "./LaunchIntro";
import { LaunchProduct } from "./LaunchProduct";
import { LaunchSchedule } from "./LaunchSchedule";
import { LaunchAI } from "./LaunchAI";
import { LaunchDiyRebuilt } from "./LaunchDiyRebuilt";
import { LaunchEnding } from "./LaunchEnding";
import { LaunchGlassRebuilt } from "./LaunchGlassRebuilt";
import { LaunchImport } from "./LaunchImport";
import { LaunchModels } from "./LaunchModels";
import { LaunchGrades } from "./LaunchGrades";
import { LaunchAdvice } from "./LaunchAdvice";
import { LaunchFocusRebuilt } from "./LaunchFocusRebuilt";
import { LaunchReminders } from "./LaunchReminders";

// Extend our restored 2026-10-12 author baseline, not the rejected external 39s cut.
// 66 seconds / 3960 frames. Glass / DIY / Focus are newly rebuilt, not reused designs.
export const LaunchFilm = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#08080A" }}>
      <Audio
        name="3 Strikes — user supplied reference excerpt"
        src={staticFile("audio/launch-3-strikes.wav")}
        durationInFrames={66 * fps}
        premountFor={fps}
      />
      <Series>
        <Series.Sequence
          name="重新定义课程表 — kinetic type"
          durationInFrames={180}
          premountFor={fps}
        >
          <LaunchIntro />
        </Series.Sequence>
        <Series.Sequence
          name="Device macro — continuous pullback"
          durationInFrames={179}
          premountFor={fps}
        >
          <LaunchProduct />
        </Series.Sequence>
        <Series.Sequence
          name="Rebuilt Glass — frosted to clear, toggle off/on"
          durationInFrames={535}
          premountFor={fps}
        >
          <LaunchGlassRebuilt />
        </Series.Sequence>
        <Series.Sequence
          name="湘大课表 — one-tap import"
          durationInFrames={179}
          premountFor={fps}
        >
          <LaunchImport />
        </Series.Sequence>
        <Series.Sequence
          name="A week unfolds — physical glass"
          durationInFrames={360}
          premountFor={fps}
        >
          <LaunchSchedule />
        </Series.Sequence>
        <Series.Sequence
          name="Your AI — connect your model"
          durationInFrames={177}
          premountFor={fps}
        >
          <LaunchModels />
        </Series.Sequence>
        <Series.Sequence
          name="Say it — AI world"
          durationInFrames={358}
          premountFor={fps}
        >
          <LaunchAI />
        </Series.Sequence>
        <Series.Sequence
          name="成绩不止数字 — AI analysis"
          durationInFrames={178}
          premountFor={fps}
        >
          <LaunchGrades />
        </Series.Sequence>
        <Series.Sequence
          name="下一步有方向 — study, graduate, career"
          durationInFrames={179}
          premountFor={fps}
        >
          <LaunchAdvice />
        </Series.Sequence>
        <Series.Sequence
          name="Free DIY — colors, anime wallpaper, visibility"
          durationInFrames={895}
          premountFor={fps}
        >
          <LaunchDiyRebuilt />
        </Series.Sequence>
        <Series.Sequence
          name="Rebuilt Focus — start to active countdown"
          durationInFrames={358}
          premountFor={fps}
        >
          <LaunchFocusRebuilt />
        </Series.Sequence>
        <Series.Sequence
          name="智能提醒 — early class"
          durationInFrames={223}
          premountFor={fps}
        >
          <LaunchReminders />
        </Series.Sequence>
        <Series.Sequence
          name="CampusFlow — 湘大学生专供"
          durationInFrames={159}
          premountFor={fps}
        >
          <LaunchEnding />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
