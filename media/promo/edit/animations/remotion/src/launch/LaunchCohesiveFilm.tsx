import {Audio} from "@remotion/media";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {AbsoluteFill, Easing, staticFile, useVideoConfig} from "remotion";
import {LaunchImportDetailed, LaunchScheduleDetailed} from "./LaunchImportDetailed";
import {LaunchAiSetupDetailed, LaunchAiQuickDetailed, LaunchAiAnalysisDetailed} from "./LaunchAiDetailed";
import {LaunchOpeningCohesive, LaunchFocusCohesive, LaunchRemindersCohesive, LaunchClosingCohesive} from "./LaunchCohesiveScenes";
import {LaunchDiyRebuilt} from "./LaunchDiyRebuilt";
import {LaunchGlassRebuilt} from "./LaunchGlassRebuilt";

/** 99 seconds, grouped narrative. Every handoff overlaps for 0.6s on a light stage. */
export function LaunchCohesiveFilm() {
  const {fps}=useVideoConfig();
  const timing=linearTiming({durationInFrames:36,easing:Easing.bezier(.4,0,.2,1)});
  const presentation=fade({shouldFadeOutExitingScene:false});
  return <AbsoluteFill style={{background:"#F5F5F7"}}>
    <Audio src={staticFile("audio/launch-3-strikes.wav")} durationInFrames={99*fps} premountFor={fps}/>
    <TransitionSeries>
      <TransitionSeries.Sequence name="湘大学生专供 — audience first" durationInFrames={276} premountFor={fps}><LaunchOpeningCohesive/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="教务导入 — login, read, timetable and grades" durationInFrames={696} premountFor={fps}><LaunchImportDetailed/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="课表 — weekly view and course editing" durationInFrames={396} premountFor={fps}><LaunchScheduleDetailed/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="AI — personal key and model" durationInFrames={456} premountFor={fps}><LaunchAiSetupDetailed/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="AI — chat, previews, confirm, image courses" durationInFrames={876} premountFor={fps}><LaunchAiQuickDetailed/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="AI — required GPA, priorities, next steps" durationInFrames={876} premountFor={fps}><LaunchAiAnalysisDetailed/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="专注 — a readable start-to-active interaction" durationInFrames={456} premountFor={fps}><LaunchFocusCohesive/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="提醒 — free time, then early class" durationInFrames={456} premountFor={fps}><LaunchRemindersCohesive/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="外观 — theme colors, wallpapers, visibility" durationInFrames={996} premountFor={fps}><LaunchDiyRebuilt pace={16/15}/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="外观 — frosted to clear, glass off and on" durationInFrames={576} premountFor={fps}><LaunchGlassRebuilt/></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation}/>
      <TransitionSeries.Sequence name="湘大学生专供 — final product signature" durationInFrames={240} premountFor={fps}><LaunchClosingCohesive/></TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>;
}
