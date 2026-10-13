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

export const LaunchRhythm = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const index = Math.min(3, Math.floor(t / 0.75));
  const local = t - index * 0.75;
  const words = ["上课", "记下", "专注", "尽兴"];
  const colors = ["#655CE8", "#4696DF", "#70C3A2", "#08080A"];
  return (
    <AbsoluteFill
      style={{
        background: "#F5F5F7",
        fontFamily: "Campus",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          color: colors[index],
          fontSize: 226,
          fontWeight: 600,
          letterSpacing: 0,
          translate: `0 ${interpolate(local, [0, 0.32], [100, 0], { ...clamp, easing: ease })}px`,
          scale: interpolate(local, [0, 0.36], [0.93, 1], {
            ...clamp,
            easing: ease,
          }),
        }}
      >
        {words[index]}
      </div>
    </AbsoluteFill>
  );
};

export const LaunchEnding = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill
      style={{
        background: "#F5F5F7",
        fontFamily: "Campus",
        color: "#1D1D1F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <CanvasImage
        src={staticFile("images/icon-2026.png")}
        premountFor={fps}
        style={{
          width: 156,
          height: 156,
          borderRadius: 39,
          marginBottom: 35,
          scale: interpolate(t, [0, 0.7], [0.7, 1], { ...clamp, easing: ease }),
          translate: `0 ${interpolate(t, [0, 0.7], [24, 0], { ...clamp, easing: ease })}px`,
        }}
      />
      <div
        style={{
          fontSize: 126,
          fontWeight: 600,
          letterSpacing: -3,
          opacity: interpolate(t, [0.15, 0.65], [0, 1], clamp),
        }}
      >
        CampusFlow
      </div>
      <div
        style={{
          fontSize: 78,
          fontWeight: 600,
          letterSpacing: 0,
          marginTop: 25,
          opacity: interpolate(t, [0.7, 1.1], [0, 1], clamp),
          translate: `0 ${interpolate(t, [0.7, 1.2], [20, 0], { ...clamp, easing: ease })}px`,
        }}
      >
        湘大学生专供
      </div>
      <div
        style={{
          fontSize: 42,
          color: "#66666E",
          marginTop: 20,
          opacity: interpolate(t, [1.05, 1.45], [0, 1], clamp),
        }}
      >
        重新定义课程表
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 55,
          fontSize: 20,
          color: "#8D8D93",
          opacity: interpolate(t, [1, 1.3], [0, 1], clamp),
        }}
      >
        独立开发 · 非学校官方应用 · 开发预览 · 演示数据
      </div>
    </AbsoluteFill>
  );
};
