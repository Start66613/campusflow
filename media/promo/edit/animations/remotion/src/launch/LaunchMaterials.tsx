import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Device3D, GlassTile3D, Studio3D } from "./LaunchWorld";

export const LaunchMaterials = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 50% 80%,#28222D,#08080A 60%)",
      }}
    >
      <Studio3D dark cameraPosition={[0, 0.3, 16]} fov={36}>
        <Device3D
          screen="schedule"
          rotation={[0.04, -0.24 + (frame / fps) * 0.04, 0.02]}
          color="#827694"
        />
        <GlassTile3D
          color="#655CE8"
          width={1.3}
          height={2.4}
          position={[-3.2, -0.8, 1]}
          rotation={[0.1, 0.35, 0.12]}
        />
        <GlassTile3D
          color="#70C3A2"
          width={1.3}
          height={2.4}
          position={[3.2, 0.8, 1]}
          rotation={[-0.1, -0.35, -0.12]}
        />
      </Studio3D>
    </AbsoluteFill>
  );
};
