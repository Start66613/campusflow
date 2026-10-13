import { Audio } from "@remotion/media";
import { AbsoluteFill, Series, staticFile, useVideoConfig } from "remotion";
import { LaunchIntro } from "./LaunchIntro";
import { LaunchProduct } from "./LaunchProduct";
import { LaunchSchedule } from "./LaunchSchedule";
import { LaunchAI } from "./LaunchAI";
import { LaunchThemes } from "./LaunchThemes";
import { LaunchEnding } from "./LaunchEnding";
import { LaunchGlass } from "./LaunchGlass";
import { LaunchImport } from "./LaunchImport";
import { LaunchModels } from "./LaunchModels";
import { LaunchGrades } from "./LaunchGrades";
import { LaunchAdvice } from "./LaunchAdvice";
import { LaunchFocus } from "./LaunchFocus";
import { LaunchReminders } from "./LaunchReminders";

// Extend our restored 2026-10-12 author baseline, not the rejected external 39s cut.
// 48 seconds / 2880 frames. Scene cuts follow the measured user-supplied music.
export const LaunchFilm = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#08080A" }}>
      <Audio
        name="3 Strikes — user supplied reference excerpt"
        src={staticFile("audio/launch-3-strikes.wav")}
        durationInFrames={48 * fps}
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
          name="Liquid Glass — optical material"
          durationInFrames={179}
          premountFor={fps}
        >
          <LaunchGlass />
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
          durationInFrames={356}
          premountFor={fps}
        >
          <LaunchSchedule />
        </Series.Sequence>
        <Series.Sequence
          name="Your AI — connect your model"
          durationInFrames={179}
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
          durationInFrames={180}
          premountFor={fps}
        >
          <LaunchAdvice />
        </Series.Sequence>
        <Series.Sequence
          name="Make it yours — three colors"
          durationInFrames={357}
          premountFor={fps}
        >
          <LaunchThemes />
        </Series.Sequence>
        <Series.Sequence
          name="番茄钟 — focus ring"
          durationInFrames={179}
          premountFor={fps}
        >
          <LaunchFocus />
        </Series.Sequence>
        <Series.Sequence
          name="智能提醒 — early class"
          durationInFrames={179}
          premountFor={fps}
        >
          <LaunchReminders />
        </Series.Sequence>
        <Series.Sequence
          name="CampusFlow — 湘大学生专供"
          durationInFrames={197}
          premountFor={fps}
        >
          <LaunchEnding />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
