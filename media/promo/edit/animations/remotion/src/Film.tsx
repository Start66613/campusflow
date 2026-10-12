import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { staticFile, useVideoConfig } from "remotion";
import { CaptionRail } from "./CaptionRail";
import { Intro } from "./scenes/Intro";
import { Hero } from "./scenes/Hero";
import { Schedule } from "./scenes/Schedule";
import { Import } from "./scenes/Import";
import { AI } from "./scenes/AI";
import { Grades } from "./scenes/Grades";
import { Life } from "./scenes/Life";
import { DIY } from "./scenes/DIY";
import { Ending } from "./scenes/Ending";
export const Film = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      <Audio src={staticFile("audio/master.wav")} premountFor={fps} />
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="Liquid opening · HyperFrames"
          durationInFrames={6.4 * fps}
          premountFor={fps}
        >
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 0.4 * fps })}
        />
        <TransitionSeries.Sequence
          name="Product home"
          durationInFrames={6.4 * fps}
          premountFor={fps}
        >
          <Hero />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 0.4 * fps })}
        />
        <TransitionSeries.Sequence
          name="Whole-week timetable"
          durationInFrames={9.4 * fps}
          premountFor={fps}
        >
          <Schedule />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: 0.4 * fps })}
        />
        <TransitionSeries.Sequence
          name="School, image and CSV import"
          durationInFrames={7.4 * fps}
          premountFor={fps}
        >
          <Import />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 0.4 * fps })}
        />
        <TransitionSeries.Sequence
          name="AI extraction, confirm and undo"
          durationInFrames={10.4 * fps}
          premountFor={fps}
        >
          <AI />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 0.4 * fps })}
        />
        <TransitionSeries.Sequence
          name="GPA and sourced research"
          durationInFrames={9.4 * fps}
          premountFor={fps}
        >
          <Grades />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 0.4 * fps })}
        />
        <TransitionSeries.Sequence
          name="Focus, expenses and weekly recap"
          durationInFrames={8.4 * fps}
          premountFor={fps}
        >
          <Life />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 0.4 * fps })}
        />
        <TransitionSeries.Sequence
          name="Personalization and Jiahao"
          durationInFrames={8.4 * fps}
          premountFor={fps}
        >
          <DIY />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 0.4 * fps })}
        />
        <TransitionSeries.Sequence
          name="Calendar, reminders, backup, end card"
          durationInFrames={7 * fps}
          premountFor={fps}
        >
          <Ending />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <CaptionRail />
    </>
  );
};
