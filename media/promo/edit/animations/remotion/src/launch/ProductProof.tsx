import React from "react";
import { Composition, registerRoot } from "remotion";
import { LaunchProduct } from "./LaunchProduct";
import { LaunchSchedule } from "./LaunchSchedule";

const ProductProof: React.FC = () => (
  <>
    <Composition
      id="ProductProof"
      component={LaunchProduct}
      durationInFrames={180}
      fps={60}
      width={1920}
      height={1080}
    />
    <Composition
      id="ScheduleProof"
      component={LaunchSchedule}
      durationInFrames={360}
      fps={60}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(ProductProof);
