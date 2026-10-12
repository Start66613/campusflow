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

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
