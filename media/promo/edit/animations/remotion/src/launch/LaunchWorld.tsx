import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useLoader, useThree } from "@react-three/fiber";
import { staticFile, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type Vector3Tuple = [number, number, number];

export function roundedShape(width: number, height: number, radius: number) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

function roundedSolid(
  width: number,
  height: number,
  depth: number,
  radius: number,
) {
  const geometry = new THREE.ExtrudeGeometry(
    roundedShape(width, height, radius),
    {
      depth,
      bevelEnabled: true,
      bevelSegments: 5,
      bevelSize: Math.min(0.035, depth / 4),
      bevelThickness: Math.min(0.035, depth / 4),
      steps: 1,
      curveSegments: 18,
    },
  );
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function screenGeometry(width: number, height: number, radius: number) {
  const geometry = new THREE.ShapeGeometry(
    roundedShape(width, height, radius),
    32,
  );
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(
      i,
      positions.getX(i) / width + 0.5,
      positions.getY(i) / height + 0.5,
    );
  }
  uv.needsUpdate = true;
  return geometry;
}

const StudioEnvironment: React.FC<{
  dark: boolean;
  cameraPosition: Vector3Tuple;
  cameraLookAt: Vector3Tuple;
  fov: number;
}> = ({ dark, cameraPosition, cameraLookAt, fov }) => {
  const { gl, scene, camera } = useThree();
  useLayoutEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = dark ? 0.95 : 1.3;
    return () => {
      scene.environment = null;
      environment.dispose();
      generator.dispose();
      room.dispose();
    };
  }, [dark, gl, scene]);

  // React updates the camera for the exact Remotion frame. No RAF/useFrame loop.
  useLayoutEffect(() => {
    camera.position.set(...cameraPosition);
    camera.lookAt(...cameraLookAt);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, cameraPosition, cameraLookAt, fov]);
  return null;
};

export const Studio3D: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
  cameraPosition?: Vector3Tuple;
  cameraLookAt?: Vector3Tuple;
  fov?: number;
}> = ({
  children,
  dark = true,
  cameraPosition = [0, 0, 17],
  cameraLookAt = [0, 0, 0],
  fov = 38,
}) => {
  const { width, height, fps } = useVideoConfig();
  return (
    <ThreeCanvas
      name="Product photography"
      width={width}
      height={height}
      premountFor={fps}
      dpr={1}
      camera={{ position: cameraPosition, fov, near: 0.1, far: 150 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = dark ? 1.05 : 1.15;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <StudioEnvironment
        dark={dark}
        cameraPosition={cameraPosition}
        cameraLookAt={cameraLookAt}
        fov={fov}
      />
      <ambientLight intensity={dark ? 0.22 : 0.48} />
      <directionalLight
        position={[5, 6, 7]}
        intensity={dark ? 2.5 : 2.1}
        color="#F8F4FF"
      />
      <directionalLight position={[-5, 2, 3]} intensity={1.4} color="#A0BFFA" />
      <directionalLight
        position={[0, -5, 5]}
        intensity={0.55}
        color="#DDD4FF"
      />
      <pointLight position={[0, 5, -2]} intensity={65} color="#C7B5FF" />
      {children}
    </ThreeCanvas>
  );
};

export const SCHEDULE_CROPS = [
  { x: 124, y: 387, width: 82, height: 254, color: "#7978F2" },
  { x: 298, y: 387, width: 82, height: 254, color: "#B177DA" },
  { x: 212, y: 651, width: 81, height: 254, color: "#F89C75" },
  { x: 473, y: 651, width: 82, height: 254, color: "#679FDA" },
  { x: 124, y: 915, width: 82, height: 254, color: "#49B2A8" },
  { x: 298, y: 915, width: 82, height: 254, color: "#E77B97" },
  { x: 386, y: 915, width: 82, height: 385, color: "#E77B97" },
] as const;

function useScreenTexture(screen: string, maskCourseTiles: boolean) {
  const source = useLoader(
    THREE.TextureLoader,
    staticFile(`screens/${screen}.png`),
  );
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 780;
    canvas.height = 1742;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Product screen canvas unavailable");
    ctx.fillStyle = screen === "jiahao" ? "#171223" : "#E8EFFB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Source screenshots do not contain an iOS status bar. Reserve 52pt above UI.
    const sourceImage = source.image as HTMLImageElement;
    ctx.drawImage(sourceImage, 0, 104, canvas.width, canvas.height - 104);
    if (maskCourseTiles && screen === "schedule") {
      // Separate the existing course pixels into real 3D layers, not duplicate UI.
      const imageScaleY = (canvas.height - 104) / sourceImage.height;
      for (const crop of SCHEDULE_CROPS) {
        ctx.fillStyle = "#F7F9FD";
        ctx.fillRect(
          crop.x,
          104 + crop.y * imageScaleY,
          crop.width,
          crop.height * imageScaleY,
        );
      }
    }
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = 8;
    return result;
  }, [maskCourseTiles, screen, source]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export const Device3D: React.FC<{
  screen: string;
  color?: string;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number;
  maskCourseTiles?: boolean;
}> = ({
  screen,
  color = "#4E4C57",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  maskCourseTiles = false,
}) => {
  const texture = useScreenTexture(screen, maskCourseTiles);
  const geometry = useMemo(
    () => ({
      frame: roundedSolid(3.9, 8.44, 0.26, 0.55),
      rim: roundedSolid(3.83, 8.36, 0.07, 0.52),
      screen: screenGeometry(3.65, 8.14, 0.46),
      island: roundedSolid(1.21, 0.29, 0.035, 0.145),
      sideButton: roundedSolid(0.045, 0.67, 0.12, 0.022),
      home: roundedSolid(1.18, 0.045, 0.016, 0.022),
    }),
    [],
  );
  useEffect(
    () => () => Object.values(geometry).forEach((part) => part.dispose()),
    [geometry],
  );
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry.frame}>
        <meshStandardMaterial color={color} metalness={1} roughness={0.23} />
      </mesh>
      <mesh geometry={geometry.rim} position={[0, 0, 0.147]}>
        <meshPhysicalMaterial
          color="#07070A"
          metalness={0.4}
          roughness={0.13}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh geometry={geometry.screen} position={[0, 0, 0.213]}>
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh geometry={geometry.island} position={[0, 3.71, 0.222]}>
        <meshBasicMaterial color="#060608" toneMapped={false} />
      </mesh>
      <mesh position={[0.43, 3.71, 0.249]}>
        <circleGeometry args={[0.068, 24]} />
        <meshBasicMaterial color="#152445" toneMapped={false} />
      </mesh>
      <mesh geometry={geometry.sideButton} position={[-1.979, 1.36, 0]}>
        <meshStandardMaterial color="#8C8A99" metalness={1} roughness={0.21} />
      </mesh>
      <mesh geometry={geometry.sideButton} position={[-1.979, 2.12, 0]}>
        <meshStandardMaterial color="#8C8A99" metalness={1} roughness={0.21} />
      </mesh>
      <mesh geometry={geometry.sideButton} position={[1.979, 1.5, 0]}>
        <meshStandardMaterial color="#8C8A99" metalness={1} roughness={0.21} />
      </mesh>
      <mesh geometry={geometry.home} position={[0, -3.87, 0.242]}>
        <meshBasicMaterial
          color={screen === "jiahao" ? "#FFFFFF" : "#252535"}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

export const GlassTile3D: React.FC<{
  color?: string;
  width?: number;
  height?: number;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number;
}> = ({
  color = "#655CE8",
  width = 1.3,
  height = 2,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) => {
  const geometry = useMemo(
    () => roundedSolid(width, height, 0.18, Math.min(0.23, width / 4)),
    [height, width],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.05}
          roughness={0.12}
          transmission={0.55}
          thickness={0.42}
          ior={1.47}
          clearcoat={1}
          clearcoatRoughness={0.07}
          attenuationColor={color}
          attenuationDistance={2.5}
          envMapIntensity={1.8}
        />
      </mesh>
    </group>
  );
};
