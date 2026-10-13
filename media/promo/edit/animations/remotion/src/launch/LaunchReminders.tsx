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
  LaunchWord3D,
} from "./LaunchModels";

/** A notification-time motif, deliberately not an Apple Clock / AlarmKit claim. */
export const LaunchReminders: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = interpolate(frame, [0.3 * fps, 1 * fps], [0, 1], {
    ...launchClamp,
    easing: launchSettle,
  });
  const clock = interpolate(frame, [1.42 * fps, 2.05 * fps], [0, 1], {
    ...launchClamp,
    easing: launchGlide,
  });
  const title = interpolate(
    frame,
    [0, 0.12 * fps, 0.58 * fps, 0.85 * fps],
    [0, 1, 1, 0],
    launchClamp,
  );
  const secondTitle = interpolate(
    frame,
    [1.7 * fps, 2.1 * fps],
    [0, 1],
    launchClamp,
  );
  const cameraX = interpolate(frame, [0, 3 * fps], [-0.4, 0.5], {
    ...launchClamp,
    easing: launchGlide,
  });
  return (
    <AbsoluteFill
      style={{
        background: "#08080A",
        fontFamily: "Campus, sans-serif",
        overflow: "hidden",
      }}
    >
      <Studio3D
        dark
        cameraPosition={[cameraX, 0.2, 20.5]}
        cameraLookAt={[0, 0, 0]}
        fov={35}
      >
        <Device3D
          screen="profile"
          color="#555767"
          position={[-2.8 * enter, -7 * (1 - enter), 0]}
          rotation={[0, 0.14, 0]}
        />
        <group
          position={[3.1 * enter, 0.42, 1.2]}
          rotation={[0.02, -0.08, 0.08 * (1 - clock)]}
          scale={Math.max(0.001, enter)}
        >
          <group scale={Math.max(0.001, 1 - clock)}>
            <GlassTile3D color="#A3DAC7" width={4.2} height={1.28} />
            <LaunchWord3D text="无课时间" width={3.8} height={0.9} />
          </group>
          <group scale={Math.max(0.001, clock)}>
            <mesh>
              <torusGeometry args={[2.1, 0.1, 18, 80]} />
              <meshPhysicalMaterial
                color="#A3A2F7"
                metalness={0.75}
                roughness={0.16}
                clearcoat={1}
              />
            </mesh>
            <mesh position={[0, 0, -0.1]}>
              <circleGeometry args={[2.04, 80]} />
              <meshPhysicalMaterial
                color="#191923"
                metalness={0.12}
                roughness={0.2}
                clearcoat={1}
              />
            </mesh>
            <LaunchWord3D
              text="07:00"
              width={3.7}
              height={1.44}
              color="#F5F5F7"
              position={[0, 0.19, 0.16]}
            />
            <LaunchWord3D
              text="早八提醒"
              width={2.65}
              height={0.55}
              color="#B9B7ED"
              position={[0, -0.92, 0.16]}
            />
            <mesh position={[0, 2.1, 0]}>
              <sphereGeometry args={[0.115, 24, 16]} />
              <meshStandardMaterial
                color="#70C3A2"
                emissive="#70C3A2"
                emissiveIntensity={0.5}
                metalness={0.3}
                roughness={0.15}
              />
            </mesh>
          </group>
        </group>
      </Studio3D>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          color: "#F5F5F7",
          fontSize: 154,
          fontWeight: 700,
          opacity: title,
        }}
      >
        智能提醒
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 790,
          width: 600,
          color: "#F5F5F7",
          textAlign: "center",
          fontSize: 105,
          fontWeight: 700,
          opacity: secondTitle,
          translate: `0px ${interpolate(frame, [1.7 * fps, 2.25 * fps], [20, 0], { ...launchClamp, easing: launchSettle })}px`,
        }}
      >
        早八不慌
      </div>
    </AbsoluteFill>
  );
};
