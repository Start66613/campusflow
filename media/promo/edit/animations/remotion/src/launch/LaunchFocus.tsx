import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Device3D, Studio3D } from "./LaunchWorld";
import "../design";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const glide = Easing.bezier(0.65, 0, 0.25, 1);

/** The actual 25:00 interface sits inside a floating optical timer ring. */
export const LaunchFocus: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const orbit = interpolate(frame, [0, 1.4 * fps, 3 * fps], [0.6, -0.06, -0.26], { ...clamp, easing: glide });
  const ringScale = interpolate(frame, [0, 1.25 * fps, 3 * fps], [0.56, 1, 0.78], { ...clamp, easing: glide });
  return (
    <AbsoluteFill style={{ background: "#08080A", overflow: "hidden", fontFamily: "Campus, sans-serif" }}>
      <Studio3D
        dark
        cameraPosition={[
          interpolate(frame, [0, 1.7 * fps, 3 * fps], [0.8, -0.65, 0], { ...clamp, easing: glide }),
          interpolate(frame, [0, 1.7 * fps, 3 * fps], [0.85, 0.7, 0], { ...clamp, easing: glide }),
          interpolate(frame, [0, 1.5 * fps, 3 * fps], [18.2, 13.3, 18.2], { ...clamp, easing: glide }),
        ]}
        cameraLookAt={[0, 0.2, 0]}
        fov={38}
      >
        <Device3D screen="focus" color="#655CE8" position={[0, -0.38, 0]} rotation={[0.02, -0.065 + frame / fps * 0.035, 0]} />
        <group position={[0, 0.53, 1.25]} rotation={[0.11, orbit, frame / fps * -0.1]} scale={ringScale}>
          <mesh>
            <torusGeometry args={[2.46, 0.095, 24, 100]} />
            <meshPhysicalMaterial color="#A5A0F4" transmission={0.72} thickness={0.45} roughness={0.055} ior={1.47} clearcoat={1} envMapIntensity={1.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2 - frame / fps * 0.38]}>
            <torusGeometry args={[2.46, 0.104, 20, 70, Math.PI * 0.67]} />
            <meshPhysicalMaterial color="#655CE8" metalness={0.25} roughness={0.15} clearcoat={1} envMapIntensity={1.6} />
          </mesh>
          <mesh position={[Math.cos(Math.PI / 2 - frame / fps * 0.38) * 2.46, Math.sin(Math.PI / 2 - frame / fps * 0.38) * 2.46, 0]}>
            <sphereGeometry args={[0.13, 24, 20]} />
            <meshPhysicalMaterial color="#D2CFFF" metalness={0.25} roughness={0.08} clearcoat={1} />
          </mesh>
        </group>
      </Studio3D>
      <div style={{
        position: "absolute", top: 330, left: 130, textAlign: "left",
        color: "#F5F5F7", fontSize: 104, fontWeight: 600,
        opacity: interpolate(frame, [0.08 * fps, 0.4 * fps, 1.02 * fps, 1.42 * fps], [0, 1, 1, 0], clamp),
        translate: `0 ${interpolate(frame, [0.08 * fps, 0.6 * fps], [18, 0], { ...clamp, easing: glide })}px`,
      }}>番茄钟</div>
    </AbsoluteFill>
  );
};
