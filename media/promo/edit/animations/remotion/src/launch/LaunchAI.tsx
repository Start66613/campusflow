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

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const settle = Easing.bezier(0.16, 1, 0.3, 1);
const glide = Easing.bezier(0.65, 0, 0.25, 1);

/** Typography is a real surface in the product scene, not a floating HTML card. */
const SurfaceText: React.FC<{
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  color?: string;
  compact?: boolean;
  position?: Vector3Tuple;
}> = ({
  title,
  subtitle,
  width,
  height,
  color = "#12121A",
  compact = false,
  position = [0, 0, 0.2],
}) => {
  use(campusFontsReady);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = Math.round((1400 * height) / width);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Launch text surface unavailable");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.font = `${compact ? 400 : 700} ${compact ? 91 : 310}px "Campus", sans-serif`;
    if (compact) {
      const measured = ctx.measureText(title).width;
      const fitted = Math.min(91, (91 * 1280) / Math.max(1, measured));
      ctx.font = `400 ${fitted}px "Campus", sans-serif`;
    }
    ctx.fillText(
      title,
      canvas.width / 2,
      canvas.height * (subtitle ? 0.42 : 0.5),
    );
    if (subtitle) {
      ctx.font = '400 90px "Campus", sans-serif';
      ctx.globalAlpha = 0.74;
      ctx.fillText(subtitle, canvas.width / 2, canvas.height * 0.78);
    }
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = 8;
    return result;
  }, [title, subtitle, color, compact, width, height]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <mesh position={position} renderOrder={3}>
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

const ResultSurface: React.FC<{
  title: string;
  subtitle: string;
  color: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: number;
}> = ({ title, subtitle, color, position, rotation, scale }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <GlassTile3D color={color} width={3.9} height={2.18} />
    <SurfaceText title={title} subtitle={subtitle} width={3.6} height={1.85} />
  </group>
);

/** Local 0–6 seconds. A macro-to-wide camera move becomes one visible AI action. */
export const LaunchAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const open = interpolate(
    frame,
    [1.7 * fps, 2.7 * fps, 3.55 * fps, 5.8 * fps],
    [0, 1, 1, 0.95],
    { ...clamp, easing: glide },
  );
  const typed = "午饭25元，明天15点图书馆复习2小时".slice(
    0,
    Math.floor(interpolate(frame, [0.82 * fps, 1.6 * fps], [0, 22], clamp)),
  );
  const wordOpacity = interpolate(
    frame,
    [0, 0.1 * fps, 0.55 * fps, 0.85 * fps],
    [0, 1, 1, 0],
    clamp,
  );
  const phoneY = interpolate(
    frame,
    [0.25 * fps, 0.9 * fps, 1.7 * fps, 2.65 * fps, 5.8 * fps],
    [-8, 0, 0, 0.08, 0],
    { ...clamp, easing: settle },
  );
  const cameraZ = interpolate(
    frame,
    [0.8 * fps, 1.7 * fps, 2.7 * fps, 4.65 * fps, 6 * fps],
    [9.8, 9.8, 20.8, 19, 17.8],
    { ...clamp, easing: glide },
  );
  const cameraY = interpolate(
    frame,
    [1.65 * fps, 2.7 * fps, 5.8 * fps],
    [-2.25, 0.1, 0],
    { ...clamp, easing: glide },
  );
  const phoneYaw = interpolate(
    frame,
    [0.9 * fps, 2.4 * fps, 4.6 * fps, 6 * fps],
    [-0.11, 0.09, -0.05, 0],
    { ...clamp, easing: glide },
  );
  const resultScale = interpolate(open, [0, 0.5, 1], [0.005, 0.86, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        background: "#F5F5F7",
        overflow: "hidden",
        fontFamily: "Campus, sans-serif",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 78%, #DCDCF220 0%, transparent 65%)",
        }}
      />
      <Studio3D
        dark={false}
        cameraPosition={[0, cameraY, cameraZ]}
        cameraLookAt={[0, cameraY, 0]}
        fov={35}
      >
        <group position={[0, phoneY, -0.1]} rotation={[0, phoneYaw, 0]}>
          <Device3D screen="assistant-input" color="#7D7BA6" />
          {t < 2.15 ? (
            <SurfaceText
              title={typed}
              width={3.08}
              height={0.38}
              position={[0, -2.17, 0.23]}
              compact
            />
          ) : null}
        </group>
        <ResultSurface
          title="15:00"
          subtitle="图书馆 · 2 小时"
          color="#A7A2F6"
          position={[-4.3 * open, 1.08 * open, 1.7 * open]}
          rotation={[0.04 * open, 0.12 * open, 0.065 * open]}
          scale={resultScale}
        />
        <ResultSurface
          title="¥25"
          subtitle="午餐"
          color="#9CDCC4"
          position={[4.3 * open, -0.95 * open, 1.7 * open]}
          rotation={[-0.03 * open, -0.14 * open, -0.065 * open]}
          scale={resultScale}
        />
      </Studio3D>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 174,
            fontWeight: 700,
            letterSpacing: 0,
            color: "#08080A",
            opacity: wordOpacity,
            translate: `0px ${interpolate(frame, [0, 0.65 * fps], [30, -8], { ...clamp, easing: settle })}px`,
          }}
        >
          说一句
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
