import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassTile3D, Studio3D } from "./LaunchWorld";
import "../design";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const glide = Easing.bezier(0.65, 0, 0.25, 1);
const colors = ["#655CE8", "#4696DF", "#70C3A2", "#DD8BC3"];

/** A macro examination of colored glass, then a continuous fan-out of course capsules. */
export const LaunchGlass: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spread = interpolate(frame, [0.55 * fps, 2.75 * fps], [0.03, 1], { ...clamp, easing: glide });
  return (
    <AbsoluteFill style={{ background: "#08080A", overflow: "hidden", fontFamily: "Campus, sans-serif" }}>
      <Studio3D
        dark
        cameraPosition={[
          interpolate(frame, [0, 3 * fps], [2.5, -0.2], { ...clamp, easing: glide }),
          interpolate(frame, [0, 3 * fps], [1.3, 0], { ...clamp, easing: glide }),
          interpolate(frame, [0, 3 * fps], [5.4, 15.4], { ...clamp, easing: glide }),
        ]}
        cameraLookAt={[0, -0.28, 0]}
        fov={38}
      >
        <group rotation={[
          interpolate(frame, [0, 3 * fps], [0.17, -0.08], { ...clamp, easing: glide }),
          interpolate(frame, [0, 3 * fps], [0.94, -0.18], { ...clamp, easing: glide }),
          interpolate(frame, [0, 3 * fps], [-0.28, 0.06], { ...clamp, easing: glide }),
        ]}>
          {colors.map((color, index) => <GlassTile3D
            key={color}
            color={color}
            width={1.65}
            height={4.1 - (index % 2) * 0.75}
            position={[(index - 1.5) * 2.08 * spread, -0.25 + (index % 2) * 0.45 * spread, index * 0.12 + (1 - spread) * index * -0.42]}
            rotation={[0.07 * Math.sin(index + frame / fps), (index - 1.5) * -0.12 * spread, (index - 1.5) * -0.1 * spread]}
          />)}
          <mesh position={[
            interpolate(frame, [0, 3 * fps], [0.8, 4.8], { ...clamp, easing: glide }),
            interpolate(frame, [0, 3 * fps], [-1.6, -2.2], { ...clamp, easing: glide }),
            0.5,
          ]} scale={[0.66, 0.86, 0.58]}>
            <sphereGeometry args={[0.65, 40, 32]} />
            <meshPhysicalMaterial color="#A5C7FB" transmission={0.94} thickness={1} roughness={0.035} ior={1.46} clearcoat={1} envMapIntensity={1.5} />
          </mesh>
        </group>
      </Studio3D>
      <div style={{
        position: "absolute", top: 94, left: 0, right: 0, textAlign: "center",
        color: "#F5F5F7", fontSize: 94, fontWeight: 700,
        opacity: interpolate(frame, [0.12 * fps, 0.5 * fps, 1.95 * fps, 2.52 * fps], [0, 1, 1, 0], clamp),
        translate: `0 ${interpolate(frame, [0.12 * fps, 0.65 * fps], [18, 0], { ...clamp, easing: glide })}px`,
      }}>液态玻璃</div>
    </AbsoluteFill>
  );
};
