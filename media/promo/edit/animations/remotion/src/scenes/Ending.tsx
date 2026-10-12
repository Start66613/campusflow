import {
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  Chip,
  clamp,
  GlassPanel,
  Heading,
  palette,
  Stage,
  Symbol,
  useLayout,
} from "../design";
export const Ending = () => {
  const frame = useCurrentFrame();
  const { portrait, fps } = useLayout();
  const late = frame > 3.25 * fps;
  return (
    <Stage>
      <div
        style={{
          opacity: interpolate(frame, [3.1 * fps, 3.6 * fps], [1, 0], clamp),
        }}
      >
        <Heading
          eyebrow="07 / WITH YOU"
          title={
            <>
              安排好了，
              <br />
              就放心去做。
            </>
          }
          body={
            "系统日历、课前提醒、早八与空闲学习。\n离线记录、本机备份，个人密钥安全保存。"
          }
          style={{ width: portrait ? 920 : 880 }}
        />
        <div
          style={{
            position: "absolute",
            left: portrait ? 80 : 1050,
            top: portrait ? 690 : 210,
            width: portrait ? 920 : 650,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 25,
          }}
        >
          {[
            ["calendar", "日历同步"],
            ["clock", "智能提醒"],
            ["lock", "密钥保护"],
            ["check", "本机备份"],
          ].map(([icon, t], i) => (
            <GlassPanel
              key={t}
              style={{
                padding: "39px 30px",
                height: portrait ? 220 : 190,
                opacity: interpolate(
                  frame,
                  [(0.4 + i * 0.12) * fps, (0.85 + i * 0.12) * fps],
                  [0, 1],
                  clamp,
                ),
              }}
            >
              <div style={{ color: palette.violet, marginBottom: 24 }}>
                <Symbol kind={icon} size={48} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{t}</div>
            </GlassPanel>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: portrait ? 80 : 112,
            top: portrait ? 1260 : 790,
            fontSize: portrait ? 29 : 25,
            color: "#928AA3",
            lineHeight: 1.6,
          }}
        >
          系统日历需开发构建；原生 iOS 材质依系统支持。
          <br />
          Android 提供兼容材质。
        </div>
      </div>
      {late ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            opacity: interpolate(frame, [3.25 * fps, 3.8 * fps], [0, 1], clamp),
            translate: `0 ${interpolate(frame, [3.25 * fps, 4.1 * fps], [25, 0], clamp)}px`,
          }}
        >
          <CanvasImage
            src={staticFile("images/icon-2026.png")}
            premountFor={fps}
            style={{
              width: portrait ? 235 : 165,
              height: portrait ? 235 : 165,
              borderRadius: portrait ? 57 : 40,
              boxShadow: "0 22px 70px #655CE82c",
            }}
          />
          <div
            style={{
              fontSize: portrait ? 102 : 120,
              fontWeight: 700,
              letterSpacing: -3,
              marginTop: 30,
            }}
          >
            CampusFlow
          </div>
          <div
            style={{
              fontSize: portrait ? 41 : 44,
              color: "#8A809D",
              marginTop: 16,
            }}
          >
            大学生活，顺着你的节奏。
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 48 }}>
            <Chip>iPhone</Chip>
            <Chip>Android</Chip>
            <Chip>持续开发中</Chip>
          </div>
        </div>
      ) : null}
    </Stage>
  );
};
