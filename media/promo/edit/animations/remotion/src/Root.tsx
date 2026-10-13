import { Composition, Folder } from "remotion";
import { Film } from "./Film";
import { Intro } from "./scenes/Intro";
import { Hero } from "./scenes/Hero";
import { Schedule } from "./scenes/Schedule";
import { Import } from "./scenes/Import";
import { AI } from "./scenes/AI";
import { Grades } from "./scenes/Grades";
import { Life } from "./scenes/Life";
import { DIY } from "./scenes/DIY";
import { Ending } from "./scenes/Ending";
import { LaunchMaterials } from "./launch/LaunchMaterials";
import { LaunchFilm } from "./launch/LaunchFilm";
import { LaunchProduct } from "./launch/LaunchProduct";
import { LaunchSchedule } from "./launch/LaunchSchedule";
import { LaunchAI } from "./launch/LaunchAI";
import { LaunchImport } from "./launch/LaunchImport";
import { LaunchModels } from "./launch/LaunchModels";
import { LaunchGrades } from "./launch/LaunchGrades";
import { LaunchAdvice } from "./launch/LaunchAdvice";
import { LaunchReminders } from "./launch/LaunchReminders";
import { LaunchGlassRebuilt } from "./launch/LaunchGlassRebuilt";
import { LaunchDiyRebuilt } from "./launch/LaunchDiyRebuilt";
import { LaunchFocusRebuilt } from "./launch/LaunchFocusRebuilt";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CampusFlow-Launch"
        component={LaunchFilm}
        durationInFrames={3960}
        fps={60}
        width={1920}
        height={1080}
      />
      <Folder name="Launch-Scenes">
        <Composition
          id="Rebuilt-Glass"
          component={LaunchGlassRebuilt}
          durationInFrames={540}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Rebuilt-DIY"
          component={LaunchDiyRebuilt}
          durationInFrames={900}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Rebuilt-Focus"
          component={LaunchFocusRebuilt}
          durationInFrames={360}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Models"
          component={LaunchModels}
          durationInFrames={180}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Grades"
          component={LaunchGrades}
          durationInFrames={180}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Advice"
          component={LaunchAdvice}
          durationInFrames={180}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Reminders"
          component={LaunchReminders}
          durationInFrames={180}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Product"
          component={LaunchProduct}
          durationInFrames={180}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Schedule"
          component={LaunchSchedule}
          durationInFrames={360}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-AI"
          component={LaunchAI}
          durationInFrames={360}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Themes"
          component={LaunchDiyRebuilt}
          durationInFrames={900}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Glass"
          component={LaunchGlassRebuilt}
          durationInFrames={540}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Import"
          component={LaunchImport}
          durationInFrames={180}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Launch-Focus"
          component={LaunchFocusRebuilt}
          durationInFrames={360}
          fps={60}
          width={1920}
          height={1080}
        />
      </Folder>
      <Composition
        id="Launch-Materials"
        component={LaunchMaterials}
        durationInFrames={300}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="CampusFlow-Film"
        component={Film}
        durationInFrames={4200}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="CampusFlow-Vertical"
        component={Film}
        durationInFrames={4200}
        fps={60}
        width={1080}
        height={1920}
      />
      <Folder name="Scenes">
        <Composition
          id="Intro"
          component={Intro}
          durationInFrames={384}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Hero"
          component={Hero}
          durationInFrames={384}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Schedule"
          component={Schedule}
          durationInFrames={564}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Import"
          component={Import}
          durationInFrames={444}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="AI"
          component={AI}
          durationInFrames={624}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Grades"
          component={Grades}
          durationInFrames={564}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Life"
          component={Life}
          durationInFrames={504}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="DIY"
          component={DIY}
          durationInFrames={504}
          fps={60}
          width={1920}
          height={1080}
        />
        <Composition
          id="Ending"
          component={Ending}
          durationInFrames={420}
          fps={60}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
