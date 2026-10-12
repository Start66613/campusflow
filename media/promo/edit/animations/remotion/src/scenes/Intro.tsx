import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clamp } from "../design";
export const Intro = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  return (
    <AbsoluteFill style={{ background: "#F4F3FA", fontFamily: "Campus" }}>
      <Video
        src={staticFile("intro.mp4")}
        muted
        premountFor={fps}
        objectFit={portrait ? "contain" : "cover"}
        style={{
          position: "absolute",
          top: portrait ? 420 : 0,
          width: "100%",
          height: portrait ? 608 : "100%",
          objectPosition: "center",
        }}
      />
      {portrait ? (
        <div
          style={{
            position: "absolute",
            top: portrait ? height * 0.66 : height * 0.72,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: interpolate(frame, [2.7 * fps, 3.3 * fps], [0, 1], clamp),
            translate: `0 ${interpolate(frame, [2.7 * fps, 3.4 * fps], [26, 0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })}px`,
          }}
        >
          <div
            style={{
              fontSize: portrait ? 98 : 90,
              fontWeight: 700,
              letterSpacing: -2,
              color: "#292341",
            }}
          >
            CampusFlow
          </div>
          <div
            style={{
              fontSize: portrait ? 39 : 34,
              marginTop: 14,
              color: "#797389",
            }}
          >
            让大学生活，顺着你的节奏。
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
