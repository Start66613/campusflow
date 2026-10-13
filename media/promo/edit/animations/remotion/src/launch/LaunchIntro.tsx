import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "../design";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

export const LaunchIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const second = t >= 1.45;
  const local = second ? t - 1.45 : t;
  return (
    <AbsoluteFill
      style={{
        background: "#08080A",
        color: "#F5F5F7",
        fontFamily: "Campus",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          opacity: interpolate(t, [0, 0.14, 2.35, 2.68], [0, 1, 1, 0], clamp),
          scale: interpolate(local, [0, 0.48, 1.2], [1.16, 1, 0.98], {
            ...clamp,
            easing: ease,
          }),
          translate: `0 ${interpolate(local, [0, 0.45], [75, 0], { ...clamp, easing: ease })}px`,
        }}
      >
        <div style={{ fontSize: 242, fontWeight: 600, letterSpacing: 0 }}>
          {second ? "课程表" : "重新定义"}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          opacity: interpolate(t, [2.3, 2.6], [0, 1], clamp),
          scale: interpolate(t, [2.35, 3.0], [0.38, 0.64], {
            ...clamp,
            easing: ease,
          }),
          rotate: `${interpolate(t, [2.35, 3.0], [-12, 0], { ...clamp, easing: ease })}deg`,
        }}
      >
        <CanvasImage
          src={staticFile("images/icon-2026.png")}
          premountFor={fps}
          style={{
            width: 310,
            height: 310,
            borderRadius: 78,
            boxShadow: "0 0 160px #706AFF40",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
