import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Device3D, GlassTile3D, Studio3D } from "./LaunchWorld";
import {
  launchClamp,
  launchGlide,
  launchSettle,
  LaunchLink3D,
  LaunchWord3D,
} from "./LaunchModels";

export const LaunchAdvice: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = interpolate(frame, [0.65 * fps, 1.75 * fps], [0, 1], {
    ...launchClamp,
    easing: launchGlide,
  });
  const title = interpolate(
    frame,
    [0, 0.12 * fps, 0.5 * fps, 0.78 * fps],
    [0, 1, 1, 0],
    launchClamp,
  );
  const y = interpolate(frame, [0.24 * fps, 0.95 * fps], [-8, -0.72], {
    ...launchClamp,
    easing: launchSettle,
  });
  const cameraX = interpolate(frame, [0.75 * fps, 3 * fps], [-0.45, 0.6], {
    ...launchClamp,
    easing: launchGlide,
  });
  return (
    <AbsoluteFill
      style={{
        background: "#F5F5F7",
        fontFamily: "Campus, sans-serif",
        overflow: "hidden",
      }}
    >
      <Studio3D
        dark={false}
        cameraPosition={[cameraX, 0.1, 22]}
        cameraLookAt={[0, 0, 0]}
        fov={35}
      >
        <Device3D
          screen="insights"
          color="#655CE8"
          position={[0, y, 0]}
          rotation={[0, -0.035, 0]}
          scale={0.92}
        />
        <LaunchLink3D
          progress={open}
          points={[
            [0, 0.5, 0.4],
            [-1.5, 1.2, 0.7],
            [-4.35, 1.1, 1],
          ]}
        />
        <LaunchLink3D
          progress={open}
          color="#4696DF"
          points={[
            [0, 0.5, 0.4],
            [1.5, 1.2, 0.7],
            [4.35, 1.1, 1],
          ]}
        />
        <LaunchLink3D
          progress={open}
          color="#70C3A2"
          points={[
            [0, 0.5, 0.4],
            [0.15, 2, 1.1],
            [0, 3.55, 1.6],
          ]}
        />
        <group
          position={[-4.35 * open, 1.1 * open, 1.1]}
          rotation={[0, 0.12, 0.03]}
          scale={Math.max(0.001, open)}
        >
          <GlassTile3D color="#B6B1F6" width={2.65} height={1.1} />
          <LaunchWord3D text="学习" width={2.28} height={0.8} />
        </group>
        <group
          position={[4.35 * open, 1.1 * open, 1.1]}
          rotation={[0, -0.12, -0.03]}
          scale={Math.max(0.001, open)}
        >
          <GlassTile3D color="#A6CCEC" width={2.65} height={1.1} />
          <LaunchWord3D text="求职" width={2.28} height={0.8} />
        </group>
        <group
          position={[0, 3.55 * open, 1.6]}
          rotation={[0.02, 0, 0]}
          scale={Math.max(0.001, open)}
        >
          <GlassTile3D color="#A3DAC7" width={2.65} height={1.1} />
          <LaunchWord3D text="考研" width={2.28} height={0.8} />
        </group>
      </Studio3D>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: title,
          color: "#08080A",
          fontSize: 149,
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: "center",
          translate: `0px ${interpolate(frame, [0, 0.65 * fps], [25, -7], { ...launchClamp, easing: launchSettle })}px`,
        }}
      >
        <div>
          下一步
          <br />
          有方向
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
