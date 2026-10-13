import React, { use, useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { campusFontsReady } from "../design";
import { Device3D, roundedShape, Studio3D } from "./LaunchWorld";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const settle = Easing.bezier(0.16, 1, 0.3, 1);
const glide = Easing.bezier(0.45, 0, 0.25, 1);

/**
 * Local, authored product-demo action over the real focus screenshot.
 * This is a deterministic film visualization, not an iPhone screen recording.
 */
const FocusActionScreen: React.FC = () => {
  use(campusFontsReady);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const source = useLoader(THREE.TextureLoader, staticFile("screens/focus.png"));
  const started = frame >= 1.5 * fps;
  const elapsed = started ? Math.floor((frame - 1.5 * fps) / fps) : 0;
  const remaining = 25 * 60 - elapsed;
  const time = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const pointer = interpolate(frame, [1.15 * fps, 1.35 * fps, 1.48 * fps, 1.8 * fps], [0, 0.55, 0.55, 0], clamp);
  const press = interpolate(frame, [1.29 * fps, 1.47 * fps, 1.68 * fps], [0, 1, 0], { ...clamp, easing: settle });

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 780;
    canvas.height = 1742;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Focus product screen canvas unavailable");
    ctx.fillStyle = "#E8EFFB";
    ctx.fillRect(0, 0, 780, 1742);
    ctx.save();
    // Identical screenshot placement to Device3D: 52pt of status-bar safe space.
    ctx.translate(0, 104);
    ctx.scale(1, 1638 / 1688);
    ctx.drawImage(source.image as HTMLImageElement, 0, 0, 780, 1688);

    if (started) {
      // Keep the actual in-app dial. Replace only its numbers and status.
      ctx.fillStyle = "#F2F2F7";
      ctx.beginPath();
      ctx.arc(390, 620, 195, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#171719";
      ctx.font = '700 100px "Campus", sans-serif';
      ctx.fillText(time, 390, 612);
      ctx.fillStyle = "#655CE8";
      ctx.font = '700 26px "Campus", sans-serif';
      ctx.fillText("专注中", 390, 701);
    }

    if (started || press > 0) {
      const scale = 1 - press * 0.035;
      ctx.save();
      ctx.translate(472, 1014);
      ctx.scale(scale, scale);
      ctx.fillStyle = press > 0.3 ? "#5549D6" : "#655CE8";
      ctx.beginPath();
      ctx.roundRect(-92, -58, 184, 116, 38);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = '700 38px "Campus", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(started ? "暂停" : "开始", 0, 1);
      ctx.restore();
    }

    if (pointer > 0) {
      ctx.globalAlpha = pointer;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(511, 1044, 24 - press * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, [pointer, press, source, started, time]);
  const geometry = useMemo(() => {
    const result = new THREE.ShapeGeometry(roundedShape(3.65, 8.14, 0.46), 32);
    const position = result.attributes.position;
    const uv = result.attributes.uv;
    for (let index = 0; index < position.count; index++) {
      uv.setXY(index, position.getX(index) / 3.65 + 0.5, position.getY(index) / 8.14 + 0.5);
    }
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, 0, 0.215]}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
};

/** Six seconds of legible, real product interaction. No decorative optical ring. */
export const LaunchFocusRebuilt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const firstText = interpolate(frame, [0.15 * fps, 0.7 * fps, 2.35 * fps, 2.85 * fps], [0, 1, 1, 0], clamp);
  const secondText = interpolate(frame, [2.9 * fps, 3.45 * fps], [0, 1], clamp);
  const phoneY = interpolate(frame, [0, 0.95 * fps, 3.1 * fps, 6 * fps], [-0.22, 0, 0.025, 0], { ...clamp, easing: settle });
  return (
    <AbsoluteFill style={{ background: "#F5F7F6", overflow: "hidden", fontFamily: "Campus, sans-serif" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 79% 64%, #D8EAE2 0%, #EEF4F0 37%, transparent 70%)" }} />
      <Studio3D
        dark={false}
        cameraPosition={[
          interpolate(frame, [0, 2.8 * fps, 6 * fps], [0.08, -0.13, 0.08], { ...clamp, easing: glide }),
          0,
          interpolate(frame, [0, 1.5 * fps, 3.7 * fps, 6 * fps], [14.7, 14.3, 13.85, 14.2], { ...clamp, easing: glide }),
        ]}
        cameraLookAt={[0, 0, 0]}
        fov={38}
      >
        <group position={[3.14, phoneY, 0]} rotation={[
          0.014,
          interpolate(frame, [0, 2.1 * fps, 6 * fps], [-0.035, -0.09, -0.025], { ...clamp, easing: glide }),
          interpolate(frame, [0, 6 * fps], [0.018, -0.009], { ...clamp, easing: glide }),
        ]}>
          <Device3D screen="focus" color="#727F79" />
          <FocusActionScreen />
        </group>
      </Studio3D>
      <div style={{ position: "absolute", left: 166, top: 409, width: 750, color: "#111713", fontSize: 111, fontWeight: 700, lineHeight: 1.25 }}>
        <div style={{ opacity: firstText, translate: `0 ${interpolate(frame, [0.15 * fps, 0.9 * fps], [26, 0], { ...clamp, easing: settle })}px` }}>专注25分</div>
        <div style={{ position: "absolute", top: 0, opacity: secondText, translate: `0 ${interpolate(frame, [2.9 * fps, 3.65 * fps], [26, 0], { ...clamp, easing: settle })}px` }}>留给自己</div>
      </div>
    </AbsoluteFill>
  );
};
