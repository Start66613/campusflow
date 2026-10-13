import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Device3D, Studio3D } from "./LaunchWorld";
import "../design";

const smooth = Easing.bezier(0.22, 1, 0.36, 1);
const clamped = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Three-second macro-to-product dolly. Local frame, not a screen recording. */
export const LaunchProduct: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: "#08080A",
        overflow: "hidden",
        fontFamily: "Campus, sans-serif",
      }}
    >
      <Studio3D
        dark
        cameraPosition={[
          interpolate(frame, [0, 2.7 * fps], [3.2, 0], {
            ...clamped,
            easing: smooth,
          }),
          interpolate(frame, [0, 2.7 * fps], [2.2, 0], {
            ...clamped,
            easing: smooth,
          }),
          interpolate(frame, [0, 2.7 * fps], [4.4, 17.3], {
            ...clamped,
            easing: smooth,
          }),
        ]}
        cameraLookAt={[
          interpolate(frame, [0, 2.2 * fps], [1.3, 0], {
            ...clamped,
            easing: smooth,
          }),
          interpolate(frame, [0, 2.2 * fps], [2.3, 0], {
            ...clamped,
            easing: smooth,
          }),
          0,
        ]}
        fov={38}
      >
        <Device3D
          screen="schedule"
          color="#655E76"
          rotation={[
            interpolate(frame, [0, 2.7 * fps], [-0.34, -0.04], {
              ...clamped,
              easing: smooth,
            }),
            interpolate(frame, [0, 2.7 * fps], [1.19, 0.12], {
              ...clamped,
              easing: smooth,
            }),
            interpolate(frame, [0, 2.7 * fps], [-0.39, -0.04], {
              ...clamped,
              easing: smooth,
            }),
          ]}
        />
      </Studio3D>
      <div
        style={{
          position: "absolute",
          left: 137,
          bottom: 136,
          color: "#F5F5F7",
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: 0,
          opacity: interpolate(
            frame,
            [0.34 * fps, 0.8 * fps, 1.9 * fps, 2.4 * fps],
            [0, 1, 1, 0],
            clamped,
          ),
          translate: `0 ${interpolate(frame, [0.34 * fps, 0.92 * fps], [25, 0], { ...clamped, easing: smooth })}px`,
        }}
      >
        为湘大同学
      </div>
    </AbsoluteFill>
  );
};
