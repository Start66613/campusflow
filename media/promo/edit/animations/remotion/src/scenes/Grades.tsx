import { interpolate, useCurrentFrame } from "remotion";
import {
  Chip,
  clamp,
  GlassPanel,
  Heading,
  palette,
  Phone,
  Stage,
  Symbol,
  useLayout,
} from "../design";
export const Grades = () => {
  const frame = useCurrentFrame();
  const { portrait, fps } = useLayout();
  const x = portrait ? 80 : 870;
  const y = portrait ? 640 : 170;
  return (
    <Stage dark accent="#4E83C8">
      <Heading
        eyebrow="04 / ANALYZE"
        title={
          <>
            成绩背后，
            <br />
            看见方向。
          </>
        }
        body={
          "必修与选修分开看，GPA 口径更清楚。\n结合个人目标，让 AI 帮你整理下一步。"
        }
        dark
        style={{ width: portrait ? 920 : 700 }}
      />
      <Phone
        screen="insights"
        style={{
          left: portrait ? 590 : 1460,
          top: portrait ? 785 : 155,
          width: 290,
          height: 625,
          opacity: 0.27,
          rotate: "5deg",
        }}
      />
      <GlassPanel
        dark
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: portrait ? 920 : 890,
          padding: "40px 42px",
          background: "linear-gradient(145deg,#2E3049ee,#20223Bee)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 25 }}>
          <span style={{ fontSize: 28, color: "#B6B8CE" }}>必修加权 GPA</span>
          <span
            style={{
              fontSize: 108,
              fontWeight: 700,
              color: "#DDD9FF",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {interpolate(
              frame,
              [0.3 * fps, 1.7 * fps],
              [0, 3.68],
              clamp,
            ).toFixed(2)}
          </span>
        </div>
        <div
          style={{
            height: 178,
            display: "flex",
            alignItems: "flex-end",
            gap: 24,
            marginTop: 8,
          }}
        >
          {[0.59, 0.72, 0.66, 0.88, 0.92, 0.84].map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: interpolate(
                  frame,
                  [(0.7 + i * 0.08) * fps, (1.7 + i * 0.08) * fps],
                  [0, v * 165],
                  clamp,
                ),
                borderRadius: "14px 14px 4px 4px",
                background: `linear-gradient(#B9AEFF,${palette.violet})`,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 29, fontSize: 25 }}>
          <div
            style={{
              background: "#655CE837",
              padding: "15px 25px",
              borderRadius: 20,
            }}
          >
            必修 → GPA
          </div>
          <div
            style={{
              background: "#A8DCCD23",
              padding: "15px 25px",
              borderRadius: 20,
              color: "#B5E0D4",
            }}
          >
            选修 → 选修学分
          </div>
        </div>
      </GlassPanel>
      <GlassPanel
        dark
        style={{
          position: "absolute",
          left: x,
          top: y + 550,
          width: portrait ? 920 : 890,
          padding: "29px 38px",
          opacity: interpolate(frame, [4.3 * fps, 4.9 * fps], [0, 1], clamp),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 31,
            fontWeight: 700,
          }}
        >
          <Symbol kind="spark" color="#B8A5FF" />
          联网检索，带着来源回答
        </div>
        <div style={{ fontSize: 25, color: "#B9B6CB", marginTop: 15 }}>
          学习方法 · 考研政策 · 职业探索
        </div>
        <div style={{ fontSize: 22, color: "#A199CD", marginTop: 18 }}>
          ↗ 官方页面{"\u3000"}↗ 学校公告{"\u3000"}↗ 原始资料
        </div>
      </GlassPanel>
      <Chip
        dark
        style={{
          position: "absolute",
          left: portrait ? 80 : 112,
          top: portrait ? 1620 : 850,
        }}
      >
        未知课程性质，会提示核对
      </Chip>
    </Stage>
  );
};
