import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Device3D, GlassTile3D, Studio3D } from "./LaunchWorld";
import "../design";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const glide = Easing.bezier(0.65, 0, 0.25, 1);
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const colors = ["#655CE8", "#4696DF", "#70C3A2", "#F4A577"];

/** The real import screen turns away and returns with the actual weekly timetable. */
export const LaunchImport: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const turn = interpolate(frame, [0.88 * fps, 1.37 * fps, 1.9 * fps, 2.72 * fps], [0.04, Math.PI, Math.PI * 1.55, Math.PI * 2], { ...clamp, easing: glide });
  const imported = frame >= 1.37 * fps;
  return (
    <AbsoluteFill style={{ background: "#F5F5F7", overflow: "hidden", fontFamily: "Campus, sans-serif" }}>
      <Studio3D
        dark={false}
        cameraPosition={[
          interpolate(frame, [0, 1.4 * fps, 3 * fps], [-0.55, 0.75, 0], { ...clamp, easing: glide }),
          interpolate(frame, [0, 3 * fps], [0.5, 0], { ...clamp, easing: ease }),
          interpolate(frame, [0, 1.45 * fps, 3 * fps], [16.3, 19.1, 17.8], { ...clamp, easing: glide }),
        ]}
        cameraLookAt={[0, -0.25, 0]}
        fov={38}
      >
        <Device3D screen={imported ? "schedule" : "import"} color="#655CE8" position={[0, -0.56, 0]} rotation={[-0.025, turn, -0.025 * (1 - frame / (3 * fps))]} />
        {colors.map((color, index) => {
          const progress = interpolate(frame, [(1.45 + index * 0.12) * fps, (2.15 + index * 0.12) * fps], [0, 1], { ...clamp, easing: glide });
          const visible = frame >= (1.45 + index * 0.12) * fps && progress < 0.99;
          return visible ? <GlassTile3D
            key={color} color={color} width={0.6} height={1.48}
            position={[-4.8 * (1 - progress), 1.5 - index * 0.92, 0.65 + Math.sin(progress * Math.PI) * 1.25]}
            rotation={[0.04, 0.32 * (1 - progress), 0.12 * (1 - progress)]}
            scale={1 - 0.62 * progress}
          /> : null;
        })}
      </Studio3D>
      <div style={{
        position: "absolute", top: 74, left: 0, right: 0, textAlign: "center",
        color: "#08080A", fontSize: 88, fontWeight: 700,
        opacity: interpolate(frame, [0.1 * fps, 0.45 * fps, 2.25 * fps, 2.8 * fps], [0, 1, 1, 0], clamp),
        translate: `0 ${interpolate(frame, [0.1 * fps, 0.65 * fps], [20, 0], { ...clamp, easing: ease })}px`,
      }}>湘大课表 一键导入</div>
    </AbsoluteFill>
  );
};
