import React, { use, useEffect, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as THREE from "three";
import { campusFontsReady } from "../design";
import { Device3D, GlassTile3D, Studio3D, Vector3Tuple } from "./LaunchWorld";

export const launchClamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export const launchGlide = Easing.bezier(0.65, 0, 0.25, 1);
export const launchSettle = Easing.bezier(0.16, 1, 0.3, 1);

/** Font-ready text is present on the first ThreeCanvas render, including cold seeks. */
export const LaunchWord3D: React.FC<{
  text: string;
  width: number;
  height: number;
  color?: string;
  position?: Vector3Tuple;
}> = ({ text, width, height, color = "#08080A", position = [0, 0, 0.22] }) => {
  use(campusFontsReady);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = Math.max(100, Math.round((1400 * height) / width));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Launch typography canvas unavailable");
    const units = Array.from(text).reduce(
      (sum, char) => sum + ((char.codePointAt(0) ?? 0) <= 0x7f ? 0.57 : 1),
      0,
    );
    const size = Math.min(canvas.height * 0.69, 1250 / Math.max(1, units));
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${size}px "Campus", sans-serif`;
    ctx.fillText(text, 700, canvas.height / 2);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = 8;
    return result;
  }, [text, width, height, color]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <mesh position={position} renderOrder={4}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
};

/** A physical light cable, drawn only to the exact current frame's progress. */
export const LaunchLink3D: React.FC<{
  points: Vector3Tuple[];
  progress: number;
  color?: string;
  radius?: number;
}> = ({ points, progress, color = "#655CE8", radius = 0.038 }) => {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(...point)),
    );
    const end = Math.max(0.0001, Math.min(1, progress));
    const partial = new THREE.CatmullRomCurve3(
      Array.from({ length: 33 }, (_, i) => curve.getPoint((end * i) / 32)),
    );
    return new THREE.TubeGeometry(partial, 48, radius, 10, false);
  }, [points, progress, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.55}
        roughness={0.2}
      />
    </mesh>
  );
};

export const LaunchModels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const connect = interpolate(frame, [0.8 * fps, 1.75 * fps], [0, 1], {
    ...launchClamp,
    easing: launchSettle,
  });
  const title = interpolate(
    frame,
    [0, 0.12 * fps, 0.57 * fps, 0.84 * fps],
    [0, 1, 1, 0],
    launchClamp,
  );
  const phoneY = interpolate(frame, [0.28 * fps, 1 * fps], [-8, -0.25], {
    ...launchClamp,
    easing: launchSettle,
  });
  const cameraZ = interpolate(
    frame,
    [0, 1 * fps, 2.9 * fps],
    [17.8, 20.8, 19.4],
    { ...launchClamp, easing: launchGlide },
  );
  const yaw = interpolate(
    frame,
    [0, 1.4 * fps, 3 * fps],
    [-0.12, 0.08, -0.04],
    { ...launchClamp, easing: launchGlide },
  );
  return (
    <AbsoluteFill
      style={{
        background: "#F5F5F7",
        overflow: "hidden",
        fontFamily: "Campus, sans-serif",
      }}
    >
      <Studio3D
        dark={false}
        cameraPosition={[0.15, 0, cameraZ]}
        cameraLookAt={[0, 0, 0]}
        fov={35}
      >
        <Device3D
          screen="ai-settings"
          color="#655CE8"
          position={[0, phoneY, 0]}
          rotation={[0, yaw, 0]}
        />
        <LaunchLink3D
          progress={connect}
          points={[
            [-1.8, 0.1, 0.4],
            [-2.5, 0.5, 0.6],
            [-4.3, 1.05, 0.7],
          ]}
        />
        <LaunchLink3D
          progress={connect}
          color="#4696DF"
          points={[
            [1.8, -0.45, 0.4],
            [2.4, -0.8, 0.6],
            [4.3, -1.15, 0.7],
          ]}
        />
        <group
          position={[-4.4 * connect, 1.05 * connect, 0.85]}
          rotation={[0, 0.09, 0.025]}
          scale={Math.max(0.001, connect)}
        >
          <GlassTile3D color="#B6B1F6" width={3.7} height={1.08} />
          <LaunchWord3D text="DeepSeek" width={3.35} height={0.78} />
        </group>
        <group
          position={[4.4 * connect, -1.15 * connect, 0.85]}
          rotation={[0, -0.09, -0.025]}
          scale={Math.max(0.001, connect)}
        >
          <GlassTile3D color="#A6CCEC" width={3.7} height={1.08} />
          <LaunchWord3D text="自带 API Key" width={3.35} height={0.78} />
        </group>
      </Studio3D>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: title,
          color: "#08080A",
          fontSize: 154,
          fontWeight: 700,
          lineHeight: 1.22,
          textAlign: "center",
          translate: `0px ${interpolate(frame, [0, 0.65 * fps], [24, -6], { ...launchClamp, easing: launchSettle })}px`,
        }}
      >
        <div>
          你的 AI
          <br />
          自己掌控
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
