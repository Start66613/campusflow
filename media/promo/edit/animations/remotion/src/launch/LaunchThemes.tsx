import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "../design";
import { Device3D, Studio3D } from "./LaunchWorld";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const glide = Easing.bezier(0.65, 0, 0.25, 1);
const settle = Easing.bezier(0.16, 1, 0.3, 1);

/** Local 0–6 seconds. Three finishes unfold, orbit and close into one product. */
export const LaunchThemes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spread = interpolate(
    frame,
    [0.12 * fps, 1.45 * fps, 4.3 * fps, 5.72 * fps],
    [0, 1, 1, 0],
    { ...clamp, easing: glide },
  );
  const yaw = interpolate(
    frame,
    [0, 2.2 * fps, 4.25 * fps, 6 * fps],
    [-0.05, 0.065, -0.07, 0],
    { ...clamp, easing: glide },
  );
  const stageColor = interpolateColors(
    frame,
    [1.85 * fps, 2.6 * fps],
    ["#F5F5F7", "#08080A"],
  );
  const textOpacity = interpolate(
    frame,
    [0.55 * fps, 0.8 * fps, 1.55 * fps, 1.85 * fps],
    [0, 1, 1, 0],
    clamp,
  );
  const cameraZ = interpolate(
    frame,
    [0, 1.55 * fps, 3.45 * fps, 5.1 * fps, 6 * fps],
    [17.8, 23.4, 21.8, 21, 18],
    { ...clamp, easing: glide },
  );
  const cameraX = interpolate(
    frame,
    [0.45 * fps, 2.7 * fps, 4.2 * fps, 6 * fps],
    [0, 1.1, -0.65, 0],
    { ...clamp, easing: glide },
  );
  const cameraY = interpolate(
    frame,
    [0, 2.4 * fps, 4.1 * fps, 6 * fps],
    [0, 0.55, 0.2, 0],
    { ...clamp, easing: glide },
  );
  // Swap finishes while the phone's opaque back faces the camera. The screen never pops.
  const finishTurn = interpolate(
    frame,
    [2.8 * fps, 3.075 * fps, 3.35 * fps, 4.05 * fps, 4.325 * fps, 4.6 * fps],
    [0, Math.PI, Math.PI * 2, Math.PI * 2, Math.PI * 3, Math.PI * 4],
    { ...clamp, easing: glide },
  );
  const jiahao = frame >= 3.075 * fps && frame < 4.325 * fps;
  return (
    <AbsoluteFill
      style={{
        background: stageColor,
        overflow: "hidden",
        fontFamily: "Campus, sans-serif",
      }}
    >
      <Studio3D
        dark
        cameraPosition={[cameraX, cameraY, cameraZ]}
        cameraLookAt={[0, 0, 0]}
        fov={35}
      >
        <group rotation={[0, yaw, 0]}>
          <Device3D
            screen="personalize"
            color="#70C3A2"
            position={[-4.22 * spread, -0.26 * spread, -1.15 - 0.8 * spread]}
            rotation={[0.035 * spread, 0.28 * spread, 0.075 * spread]}
            scale={0.91}
          />
          <Device3D
            screen={jiahao ? "jiahao" : "assistant-input"}
            color="#4696DF"
            position={[4.22 * spread, -0.26 * spread, -1.2 - 0.8 * spread]}
            rotation={[
              0.035 * spread,
              -0.28 * spread + finishTurn,
              -0.075 * spread,
            ]}
            scale={0.91}
          />
          <Device3D
            screen="schedule"
            color="#655CE8"
            position={[0, 0.17 * spread, 0.15]}
            rotation={[0, 0, 0]}
          />
        </group>
      </Studio3D>
      <div
        style={{
          position: "absolute",
          inset: "64px 0 auto",
          textAlign: "center",
          fontSize: 102,
          fontWeight: 700,
          color: "#08080A",
          opacity: textOpacity,
          translate: `0px ${interpolate(frame, [0.55 * fps, 1 * fps], [18, 0], { ...clamp, easing: settle })}px`,
        }}
      >
        换个心情
      </div>
    </AbsoluteFill>
  );
};
