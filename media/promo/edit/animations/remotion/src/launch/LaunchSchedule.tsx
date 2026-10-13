import React, { useEffect, useMemo } from "react";
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
import {
  Device3D,
  GlassTile3D,
  roundedShape,
  SCHEDULE_CROPS,
  Studio3D,
  type Vector3Tuple,
} from "./LaunchWorld";
import "../design";

const clamped = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const smooth = Easing.bezier(0.22, 1, 0.36, 1);
const reveal = Easing.bezier(0.65, 0, 0.35, 1);
const orbit: Vector3Tuple[] = [
  [-5.8, 2.38, 2.8],
  [5.7, 2.65, 2.1],
  [-3.9, -0.2, 3.2],
  [4.5, -0.08, 2.2],
  [-5.4, -2.76, 2],
  [5.4, -2.7, 2.8],
  [2.8, -2.9, 1.8],
];

const CourseLayer: React.FC<{ index: number; expansion: number }> = ({
  index,
  expansion,
}) => {
  const crop = SCHEDULE_CROPS[index];
  const source = useLoader(
    THREE.TextureLoader,
    staticFile("screens/schedule.png"),
  );
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 328;
    canvas.height = crop.height * 4;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Course texture context unavailable");
    ctx.drawImage(
      source.image as HTMLImageElement,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = 8;
    return result;
  }, [crop, source]);
  const geometry = useMemo(() => {
    const g = new THREE.ShapeGeometry(
      roundedShape(0.384, (crop.height / 1688) * 7.655, 0.115),
      18,
    );
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++)
      uv.setXY(
        i,
        p.getX(i) / 0.384 + 0.5,
        p.getY(i) / ((crop.height / 1688) * 7.655) + 0.5,
      );
    return g;
  }, [crop]);
  useEffect(
    () => () => {
      texture.dispose();
      geometry.dispose();
    },
    [geometry, texture],
  );

  const origin: Vector3Tuple = [
    ((crop.x + crop.width / 2) / 780) * 3.65 - 3.65 / 2,
    8.14 / 2 -
      ((104 + ((crop.y + crop.height / 2) / 1688) * 1638) / 1742) * 8.14,
    0.225,
  ];
  const position = origin.map(
    (value, axis) => value + (orbit[index][axis] - value) * expansion,
  ) as Vector3Tuple;
  const height = (crop.height / 1688) * 7.655;
  // Their exact screenshot pixels are the face; the colored bevel is actual 3D glass.
  return (
    <group
      position={position}
      rotation={[
        expansion * -0.035,
        expansion * (index % 2 ? -0.17 : 0.17),
        expansion * (index % 2 ? -0.075 : 0.075),
      ]}
      scale={1 + expansion * 0.9}
    >
      <GlassTile3D
        color={crop.color}
        width={0.384}
        height={height}
        position={[0, 0, -0.105]}
      />
      <mesh geometry={geometry} position={[0, 0, 0.025]}>
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** The existing weekly UI separates into physical layers, then returns in place. */
export const LaunchSchedule: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const expansion = interpolate(
    frame,
    [0.18 * fps, 1.45 * fps, 2.52 * fps, 4.72 * fps],
    [0, 1, 1, 0],
    { ...clamped, easing: reveal },
  );
  return (
    <AbsoluteFill
      style={{
        background: "#F5F5F7",
        fontFamily: "Campus, sans-serif",
        overflow: "hidden",
      }}
    >
      <Studio3D
        dark={false}
        cameraPosition={[
          interpolate(
            frame,
            [0, 1.8 * fps, 3.5 * fps, 6 * fps],
            [0, 1.05, -0.48, 0],
            { ...clamped, easing: smooth },
          ),
          interpolate(frame, [0, 3 * fps, 6 * fps], [0, 0.85, 0], {
            ...clamped,
            easing: smooth,
          }),
          interpolate(
            frame,
            [0, 1.5 * fps, 3.3 * fps, 5.7 * fps],
            [17.3, 20.4, 19.2, 17.8],
            { ...clamped, easing: smooth },
          ),
        ]}
        cameraLookAt={[0, -0.36, 0]}
        fov={38}
      >
        <group
          position={[0, -0.45, 0]}
          rotation={[
            interpolate(
              frame,
              [0, 2.7 * fps, 5.7 * fps],
              [-0.04, -0.08, 0],
              clamped,
            ),
            interpolate(
              frame,
              [0, 2.7 * fps, 5.7 * fps],
              [0.12, -0.11, 0],
              clamped,
            ),
            interpolate(frame, [0, 5.7 * fps], [-0.04, 0], clamped),
          ]}
        >
          <Device3D screen="schedule" color="#655E76" maskCourseTiles />
          {SCHEDULE_CROPS.map((_, index) => (
            <CourseLayer key={index} index={index} expansion={expansion} />
          ))}
        </group>
      </Studio3D>
      <div
        style={{
          position: "absolute",
          top: 67,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 100,
          fontWeight: 700,
          color: "#111115",
          lineHeight: 1.2,
          opacity: interpolate(
            frame,
            [0.7 * fps, 1.2 * fps, 5.1 * fps, 5.7 * fps],
            [0, 1, 1, 0],
            clamped,
          ),
          translate: `0 ${interpolate(frame, [0.7 * fps, 1.28 * fps], [22, 0], { ...clamped, easing: smooth })}px`,
        }}
      >
        一周一眼
      </div>
    </AbsoluteFill>
  );
};
