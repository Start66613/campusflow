import { interpolate, useCurrentFrame } from "remotion";
import {
  clamp,
  GlassPanel,
  Heading,
  palette,
  Stage,
  Symbol,
  useLayout,
} from "../design";
export const Life = () => {
  const frame = useCurrentFrame();
  const { portrait, fps } = useLayout();
  const x = portrait ? 80 : 860;
  const y = portrait ? 625 : 155;
  const w = portrait ? 920 : 940;
  const timer = frame > 3 * fps ? "24:58" : "25:00";
  const p = interpolate(frame, [0.3 * fps, 2.2 * fps], [0, 0.76], clamp);
  return (
    <Stage accent="#77BEB0">
      <Heading
        eyebrow="05 / DAILY RHYTHM"
        title={
          <>
            专注当下，
            <br />
            看见积累。
          </>
        }
        body={
          "番茄钟，把学习分成可完成的小段。\n消费、任务与周报，让每周都有回顾。"
        }
        style={{ width: portrait ? 920 : 705 }}
      />
      <GlassPanel
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: portrait ? 440 : 360,
          padding: 35,
          display: "flex",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div
          style={{
            width: portrait ? 280 : 270,
            height: portrait ? 280 : 270,
            position: "relative",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 280 280" width="100%" height="100%">
            <circle
              cx="140"
              cy="140"
              r="124"
              stroke="#BDB7CE24"
              strokeWidth="14"
              fill="none"
            />
            <circle
              cx="140"
              cy="140"
              r="124"
              stroke={palette.violet}
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={779}
              strokeDashoffset={779 * (1 - p)}
              style={{ rotate: "-90deg", transformOrigin: "center" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontSize: 62,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {timer}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 38, fontWeight: 700, marginBottom: 18 }}>
            沉浸 25 分钟
          </div>
          <div style={{ fontSize: 27, lineHeight: 1.7, color: "#888299" }}>
            开始一次专注
            <br />
            把提醒留在课余
          </div>
          <div
            style={{
              marginTop: 26,
              display: "inline-flex",
              gap: 14,
              alignItems: "center",
              padding: "16px 29px",
              background: palette.violet,
              color: "white",
              borderRadius: 99,
              fontSize: 26,
            }}
          >
            <Symbol kind="clock" size={29} />
            专注中
          </div>
        </div>
      </GlassPanel>
      <GlassPanel
        style={{
          position: "absolute",
          left: x,
          top: y + (portrait ? 476 : 396),
          width: (w - 24) / 2,
          padding: 32,
          height: 270,
        }}
      >
        <div style={{ fontSize: 25, color: "#888299" }}>本周消费</div>
        <div style={{ fontSize: 62, fontWeight: 700, marginTop: 16 }}>
          ¥268<span style={{ fontSize: 36 }}>.50</span>
        </div>
        <div
          style={{
            display: "flex",
            height: 12,
            borderRadius: 99,
            overflow: "hidden",
            marginTop: 29,
          }}
        >
          <div style={{ width: "57%", background: "#92C8B6" }} />
          <div style={{ width: "28%", background: "#A297F0" }} />
          <div style={{ flex: 1, background: "#E6BF90" }} />
        </div>
        <div style={{ fontSize: 22, color: "#89849A", marginTop: 21 }}>
          餐饮 · 交通 · 生活
        </div>
      </GlassPanel>
      <GlassPanel
        style={{
          position: "absolute",
          left: x + (w + 24) / 2,
          top: y + (portrait ? 476 : 396),
          width: (w - 24) / 2,
          padding: 32,
          height: 270,
        }}
      >
        <div style={{ fontSize: 25, color: "#888299" }}>每周回顾</div>
        <div style={{ fontSize: 57, fontWeight: 700, marginTop: 18 }}>
          8 / 10
        </div>
        <div style={{ fontSize: 24, color: "#89849A", marginTop: 14 }}>
          任务已完成
        </div>
        <div style={{ fontSize: 24, color: "#4E9D80", marginTop: 20 }}>
          专注 · 消费 · 出勤
        </div>
      </GlassPanel>
    </Stage>
  );
};
