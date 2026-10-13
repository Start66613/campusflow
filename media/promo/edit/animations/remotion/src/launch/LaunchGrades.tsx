import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Device3D, Studio3D } from "./LaunchWorld";
import {
  launchClamp,
  launchGlide,
  launchSettle,
  LaunchLink3D,
  LaunchWord3D,
} from "./LaunchModels";

/** Macro of the actual required-course GPA; the curve is an abstract analysis motif. */
export const LaunchGrades: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pull = interpolate(frame, [0.3 * fps, 1.6 * fps], [0, 1], {
    ...launchClamp,
    easing: launchGlide,
  });
  const curve = interpolate(frame, [1.25 * fps, 2.65 * fps], [0, 1], {
    ...launchClamp,
    easing: launchSettle,
  });
  const title = interpolate(
    frame,
    [0.65 * fps, 0.95 * fps],
    [0, 1],
    launchClamp,
  );
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
        cameraPosition={[
          -2.2 * (1 - pull),
          1.25 * (1 - pull),
          8.7 + 12.2 * pull,
        ]}
        cameraLookAt={[-2.2 * (1 - pull), 1.1 * (1 - pull), 0]}
        fov={35}
      >
        <Device3D
          screen="insights"
          color="#655CE8"
          position={[-2.2, -0.38, 0]}
          rotation={[0, 0.075 * pull, 0]}
        />
        <group position={[3.5, 1.32, 1.1]} scale={Math.max(0.001, curve)}>
          <LaunchWord3D text="3.74" width={4.05} height={1.6} color="#655CE8" />
          <LaunchWord3D
            text="必修 GPA"
            width={2.65}
            height={0.49}
            color="#686878"
            position={[0, 1.15, 0.22]}
          />
        </group>
        <LaunchLink3D
          color="#655CE8"
          radius={0.064}
          progress={curve}
          points={[
            [1.1, -2.25, 1],
            [2.15, -1.55, 1.12],
            [3.1, -1.74, 1.2],
            [4.14, -0.85, 1.29],
            [5.35, -0.19, 1.38],
          ]}
        />
        <mesh position={[5.35, -0.19, 1.38]} scale={Math.max(0.001, curve)}>
          <sphereGeometry args={[0.12, 24, 16]} />
          <meshPhysicalMaterial
            color="#70C3A2"
            metalness={0.2}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>
      </Studio3D>
      <div
        style={{
          position: "absolute",
          top: 72,
          width: "100%",
          textAlign: "center",
          color: "#08080A",
          fontSize: 116,
          fontWeight: 700,
          opacity: title,
          translate: `0px ${interpolate(frame, [0.65 * fps, 1.2 * fps], [20, 0], { ...launchClamp, easing: launchSettle })}px`,
        }}
      >
        成绩不止数字
      </div>
    </AbsoluteFill>
  );
};
