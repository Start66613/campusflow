import React from "react";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

loadFont({
  family: "Campus",
  url: staticFile("fonts/msyh.ttc"),
  weight: "400",
  format: "truetype",
});
loadFont({
  family: "Campus",
  url: staticFile("fonts/msyhbd.ttc"),
  weight: "700",
  format: "truetype",
});
export const palette = {
  pearl: "#F4F3FA",
  ink: "#202033",
  violet: "#655CE8",
  mint: "#A8DCCD",
  midnight: "#111022",
};
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export function useLayout() {
  const { width, height, fps } = useVideoConfig();
  return { width, height, fps, portrait: height > width };
}

export const Stage: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
  accent?: string;
}> = ({ children, dark = false, accent = palette.violet }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        fontFamily: "Campus, sans-serif",
        background: dark ? palette.midnight : palette.pearl,
        color: dark ? "#F6F5FF" : palette.ink,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${50 + Math.sin(frame / fps / 6) * 10}% 26%, ${accent}${dark ? "48" : "24"}, transparent 62%), radial-gradient(ellipse at 12% 90%, ${dark ? "#58A0BB26" : "#B9E4DE55"}, transparent 52%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 28,
          border: "1px solid " + (dark ? "#ffffff12" : "#ffffffaa"),
          borderRadius: 54,
        }}
      />
      {children}
      <div
        style={{
          position: "absolute",
          left: 64,
          bottom: 31,
          fontSize: 20,
          letterSpacing: 1.4,
          color: dark ? "#BAB6D2" : "#77748B",
        }}
      >
        CAMPUSFLOW · 开发预览 / 演示数据
      </div>
    </AbsoluteFill>
  );
};

export const Heading: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  body?: string;
  dark?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ eyebrow, title, body, dark, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { portrait, fps } = useLayout();
  return (
    <div
      style={{
        position: "absolute",
        left: portrait ? 80 : 112,
        top: portrait ? 136 : 190,
        width: portrait ? 920 : 730,
        opacity: interpolate(
          frame,
          [delay * fps, (delay + 0.55) * fps],
          [0, 1],
          clamp,
        ),
        translate: `0px ${interpolate(frame, [delay * fps, (delay + 0.65) * fps], [28, 0], { ...clamp, easing: ease })}px`,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: portrait ? 28 : 25,
          letterSpacing: 6,
          fontWeight: 700,
          color: dark ? "#B7AEFF" : palette.violet,
          marginBottom: 24,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: portrait ? 92 : 98,
          lineHeight: 1.21,
          fontWeight: 700,
          letterSpacing: 0,
          whiteSpace: "pre-line",
        }}
      >
        {title}
      </div>
      {body ? (
        <div
          style={{
            fontSize: portrait ? 38 : 36,
            lineHeight: 1.6,
            color: dark ? "#BDB8D2" : "#78748D",
            marginTop: 32,
            whiteSpace: "pre-line",
          }}
        >
          {body}
        </div>
      ) : null}
    </div>
  );
};

export const GlassPanel: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
}> = ({ children, style, dark = false }) => (
  <div
    style={{
      borderRadius: 36,
      background: dark
        ? "linear-gradient(145deg,#ffffff16,#ffffff08)"
        : "linear-gradient(145deg,#ffffffed,#ffffff9c)",
      border: "1px solid " + (dark ? "#ffffff2c" : "#ffffff"),
      boxShadow: dark ? "0 24px 80px #00000028" : "0 24px 70px #33334f0f",
      backdropFilter: "blur(18px)",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Phone: React.FC<{
  screen: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  scroll?: number;
  scale?: number;
}> = ({ screen, style, children, scroll = 0, scale = 1 }) => {
  const { portrait, fps } = useLayout();
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: portrait ? 310 : 1190,
        top: portrait ? 515 : 90,
        width: 430,
        height: 920,
        background: "#191923",
        borderRadius: 66,
        padding: 11,
        boxShadow: "0 40px 75px #29264f30, inset 0 0 0 2px #ffffff4a",
        scale,
        translate: `0px ${interpolate(frame, [0, 0.8 * fps], [40, 0], { ...clamp, easing: ease })}px`,
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
          borderRadius: 55,
          overflow: "hidden",
          background: screen === "jiahao" ? "#151126" : "#F0EFF8",
        }}
      >
        <CanvasImage
          src={staticFile(`screens/${screen}.png`)}
          premountFor={fps}
          style={{
            position: "absolute",
            top: children ? 0 : 52,
            width: "100%",
            height: children ? "100%" : "calc(100% - 52px)",
            objectFit: children ? "cover" : "contain",
            objectPosition: `50% ${scroll}%`,
          }}
        />
        {children}
        <div
          style={{
            position: "absolute",
            top: 15,
            left: "50%",
            translate: "-50% 0",
            width: 132,
            height: 32,
            borderRadius: 26,
            background: "#17171d",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            translate: "-50% 0",
            width: 132,
            height: 5,
            borderRadius: 6,
            background: "#22222880",
          }}
        />
      </div>
    </div>
  );
};

export const Chip: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
  style?: React.CSSProperties;
}> = ({ children, dark, style }) => (
  <GlassPanel
    dark={dark}
    style={{
      padding: "17px 28px",
      fontSize: 29,
      fontWeight: 700,
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      gap: 13,
      ...style,
    }}
  >
    {children}
  </GlassPanel>
);
export const Finger: React.FC<{ x: number; y: number; opacity?: number }> = ({
  x,
  y,
  opacity = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - 22,
      top: y - 22,
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: "#ffffffa8",
      border: "3px solid #ffffff",
      boxShadow: "0 0 0 13px #655CE82a, 0 10px 24px #443b6730",
      opacity,
    }}
  />
);
export const LightSweep: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background:
          "linear-gradient(105deg,transparent 35%,#ffffff1a 47%,#ffffff66 50%,#ffffff1a 53%,transparent 65%)",
        translate: `${interpolate(f, [(delay + 0.2) * fps, (delay + 1.9) * fps], [-100, 100], clamp)}% 0`,
      }}
    />
  );
};

export const Symbol: React.FC<{
  kind?: string;
  size?: number;
  color?: string;
}> = ({ kind = "check", size = 42, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    stroke={color}
    strokeWidth="3.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {kind === "check" ? (
      <path d="M10 24l9 9 19-20" />
    ) : kind === "calendar" ? (
      <>
        <rect x="7" y="10" width="34" height="32" rx="7" />
        <path d="M7 20h34M16 6v9M32 6v9M16 28h2M24 28h2M32 28h2M16 35h2M24 35h2" />
      </>
    ) : kind === "spark" ? (
      <path d="M24 5l5 13 14 6-14 5-5 14-6-14-13-5 13-6z" />
    ) : kind === "lock" ? (
      <>
        <rect x="10" y="21" width="28" height="22" rx="6" />
        <path d="M16 21v-8a8 8 0 0116 0v8M24 30v5" />
      </>
    ) : kind === "arrow" ? (
      <path d="M8 24h32M28 12l12 12-12 12" />
    ) : kind === "clock" ? (
      <>
        <circle cx="24" cy="24" r="18" />
        <path d="M24 13v12l8 5" />
      </>
    ) : (
      <>
        <rect x="7" y="7" width="34" height="34" rx="9" />
        <path d="M16 25h16M24 17v16" />
      </>
    )}
  </svg>
);
