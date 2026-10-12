import { interpolate, useCurrentFrame } from "remotion";
import {
  Chip,
  clamp,
  GlassPanel,
  Heading,
  LightSweep,
  palette,
  Phone,
  Stage,
  Symbol,
  useLayout,
} from "../design";
export const AI = () => {
  const frame = useCurrentFrame();
  const { portrait, fps } = useLayout();
  const text = "午饭25元，明天下午3点图书馆复习两小时";
  const typed = text.slice(
    0,
    Math.floor(
      interpolate(frame, [0.6 * fps, 2.5 * fps], [0, text.length], clamp),
    ),
  );
  const panelLeft = portrait ? 80 : 870;
  const panelTop = portrait ? 610 : 240;
  const confirmed = frame > 7 * fps;
  return (
    <Stage dark>
      <Heading
        eyebrow="03 / AI QUICK NOTE"
        title={
          <>
            一句话，
            <br />
            记下来。
          </>
        }
        body={"日程、作业、消费与新课程。\n自然表达，清楚核对，轻松写入。"}
        dark
        style={{ width: portrait ? 920 : 710 }}
      />
      <Phone
        screen="assistant"
        style={{
          left: portrait ? 360 : 1360,
          top: portrait ? 780 : 70,
          width: 350,
          height: 752,
          opacity: 0.38,
          rotate: "5deg",
        }}
      />
      <GlassPanel
        dark
        style={{
          position: "absolute",
          left: panelLeft,
          top: panelTop,
          width: portrait ? 920 : 865,
          padding: "34px 39px",
          background: "linear-gradient(145deg,#353047f5,#282237f5)",
          fontSize: 33,
          fontWeight: 700,
          lineHeight: 1.6,
          minHeight: 133,
        }}
      >
        {typed}
        <span
          style={{
            color: "#BDB1FF",
            opacity: Math.floor(frame / (fps * 0.4)) % 2 === 0 ? 1 : 0,
          }}
        >
          |
        </span>
      </GlassPanel>
      <GlassPanel
        dark
        style={{
          position: "absolute",
          left: panelLeft,
          top: panelTop + 190,
          width: portrait ? 920 : 865,
          padding: 35,
          opacity: interpolate(frame, [3 * fps, 3.5 * fps], [0, 1], clamp),
          translate: `0 ${interpolate(frame, [3 * fps, 3.5 * fps], [25, 0], clamp)}px`,
          background: "linear-gradient(145deg,#38304bf5,#211d32f5)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 25,
            alignItems: "center",
            fontSize: 27,
            color: "#B9AED4",
            marginBottom: 26,
          }}
        >
          <Symbol kind="spark" color="#B8A5FF" />
          已识别 2 项，等你确认
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div
            style={{
              flex: 1,
              borderRadius: 26,
              padding: "26px 25px",
              background: "#A8DCCD20",
              border: "1px solid #A8DCCD38",
            }}
          >
            <div style={{ fontSize: 24, color: "#B5E9D7" }}>消费 · 餐饮</div>
            <div
              style={{
                fontSize: 60,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                marginTop: 17,
              }}
            >
              ¥25.00
            </div>
            <div style={{ fontSize: 27, color: "#C5BED4", marginTop: 14 }}>
              午饭
            </div>
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 26,
              padding: "26px 25px",
              background: "#B7A5FF1c",
              border: "1px solid #B7A5FF3c",
            }}
          >
            <div style={{ fontSize: 24, color: "#C9B8FF" }}>日程 · 学习</div>
            <div style={{ fontSize: 36, fontWeight: 700, marginTop: 22 }}>
              图书馆复习
            </div>
            <div style={{ fontSize: 26, color: "#C5BED4", marginTop: 19 }}>
              明天 15:00 — 17:00
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 27,
            borderRadius: 99,
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: confirmed ? "#80CBA3" : palette.violet,
            color: confirmed ? "#19352b" : "white",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          {confirmed ? (
            <>
              <Symbol size={32} /> 已确认写入
            </>
          ) : (
            "确认写入"
          )}
        </div>
      </GlassPanel>
      <Chip
        dark
        style={{
          position: "absolute",
          left: portrait ? 80 : 112,
          top: portrait ? 1455 : 812,
          opacity: interpolate(frame, [7.3 * fps, 7.7 * fps], [0, 1], clamp),
        }}
      >
        写错了？一键撤销
      </Chip>
      <LightSweep delay={7.2} />
    </Stage>
  );
};
