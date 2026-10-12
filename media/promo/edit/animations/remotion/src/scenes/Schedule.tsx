import { interpolate, useCurrentFrame } from "remotion";
import {
  Chip,
  clamp,
  Finger,
  GlassPanel,
  Heading,
  palette,
  Stage,
  Symbol,
  useLayout,
} from "../design";
const courses = [
  { d: 0, r: 0, n: "高等数学", t: "周老师 · A302", c: "#D8D1FF" },
  { d: 2, r: 0, n: "数字电子技术", t: "吴老师 · 北302", c: "#FFCDE0" },
  { d: 3, r: 0, n: "体育 · 健身", t: "体育馆", c: "#E0CBF8" },
  { d: 3, r: 2, n: "数据结构与算法", t: "王老师 · 北310", c: "#FFCFCF" },
  { d: 0, r: 4, n: "程序设计实验", t: "实验楼 A204", c: "#BDE3ED" },
  { d: 1, r: 4, n: "大学物理", t: "李老师 · 理学楼", c: "#D9D2FF" },
  { d: 4, r: 4, n: "信号与系统", t: "彭老师 · 北204", c: "#C5DFFD" },
  { d: 2, r: 6, n: "英语听说", t: "外语楼 C101", c: "#C4EAD8" },
];
const WeekGrid = ({
  col,
  row,
  move,
  next,
}: {
  col: number;
  row: number;
  move: number;
  next?: boolean;
}) => (
  <div style={{ width: col * 7, height: row * 8, position: "absolute" }}>
    {Array.from({ length: 7 }, (_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: i * col,
          top: 0,
          bottom: 0,
          width: col,
          borderLeft: "1px solid #88839c15",
          background: i === 3 ? "#655CE807" : undefined,
        }}
      />
    ))}
    {Array.from({ length: 8 }, (_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          top: i * row,
          left: 0,
          right: 0,
          borderTop: "1px solid #88839c18",
        }}
      />
    ))}
    {courses.map((c, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left:
            (next && i === 2 ? 5 : c.d) * col + 5 + (i === 3 ? move * col : 0),
          top: c.r * row + 5,
          width: col - 10,
          height: 2 * row - 10,
          padding: "13px 11px",
          boxSizing: "border-box",
          overflow: "hidden",
          background: `linear-gradient(145deg,${c.c},${c.c}BD)`,
          border: "1px solid #ffffff",
          borderRadius: 22,
          boxShadow:
            i === 3 && move > 0 && move < 1
              ? "0 14px 25px #554b8420"
              : "0 4px 10px #554b840a",
          scale: i === 3 && move > 0 && move < 1 ? 1.022 : 1,
          color: "#37314D",
          zIndex: i === 3 ? 3 : 1,
        }}
      >
        <div
          style={{
            width: 21,
            height: 21,
            borderRadius: 50,
            background: "#ffffff60",
            marginBottom: 8,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Symbol kind="calendar" size={14} />
        </div>
        <div
          style={{
            fontSize: 21,
            fontWeight: 700,
            lineHeight: 1.35,
            maxHeight: 85,
            overflow: "hidden",
          }}
        >
          {c.n}
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            marginTop: 8,
            color: "#6B6380",
          }}
        >
          {c.t}
        </div>
      </div>
    ))}
  </div>
);
export const Schedule = () => {
  const frame = useCurrentFrame();
  const { portrait, fps } = useLayout();
  const w = portrait ? 920 : 1030;
  const h = portrait ? 1030 : 780;
  const left = portrait ? 80 : 830;
  const top = portrait ? 670 : 160;
  const col = (w - 84) / 7;
  const row = (h - 98) / 8;
  const move = interpolate(frame, [3 * fps, 4.5 * fps], [0, 1], clamp);
  const swipe = interpolate(frame, [6.6 * fps, 7.5 * fps], [0, -(w - 84)], {
    ...clamp,
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const week = frame > 7.1 * fps ? 4 : 3;
  return (
    <Stage>
      <Heading
        eyebrow="01 / SCHEDULE"
        title={
          <>
            一整周，
            <br />
            一眼看清。
          </>
        }
        body={"200ms 长按，轻抬移动\n拖到哪儿，落点先看见。"}
        style={{ width: portrait ? 920 : 620 }}
      />
      <GlassPanel
        style={{
          position: "absolute",
          left,
          top,
          width: w,
          height: h,
          borderRadius: 48,
          padding: 0,
        }}
      >
        <div
          style={{
            height: 50,
            display: "flex",
            alignItems: "center",
            paddingLeft: 34,
            gap: 16,
            fontSize: 28,
            fontWeight: 700,
            color: palette.violet,
          }}
        >
          第 {week} 周{" "}
          <span style={{ fontSize: 19, color: "#8D89A0", marginLeft: 25 }}>
            10 月 {week === 3 ? "12 — 18" : "19 — 25"} 日
          </span>
        </div>
        {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map(
          (d, i) => (
            <div
              key={d}
              style={{
                position: "absolute",
                left: 84 + i * col,
                top: 65,
                width: col,
                textAlign: "center",
                fontSize: 21,
                fontWeight: 700,
                color: i === 3 ? palette.violet : "#8D89A0",
              }}
            >
              {d}
            </div>
          ),
        )}
        <div
          style={{
            position: "absolute",
            left: 84,
            right: 0,
            top: 98,
            bottom: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              position: "relative",
              translate: `${swipe}px 0`,
            }}
          >
            <WeekGrid col={col} row={row} move={move} />
            <div style={{ position: "absolute", left: w - 84, top: 0 }}>
              <WeekGrid col={col} row={row} move={1} next />
            </div>
            {frame > 2.8 * fps && frame < 5.4 * fps ? (
              <div
                style={{
                  position: "absolute",
                  left: 4 * col + 5,
                  top: 2 * row + 5,
                  width: col - 10,
                  height: 2 * row - 10,
                  border: "3px dashed #655CE8",
                  borderRadius: 22,
                  background: "#655CE817",
                  pointerEvents: "none",
                }}
              />
            ) : null}
          </div>
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 98 + i * row + 22,
              left: 21,
              width: 54,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 25, color: "#797388", fontWeight: 700 }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 15, color: "#ADA6BD", marginTop: 8 }}>
              {
                [
                  "08:00",
                  "08:55",
                  "10:10",
                  "11:05",
                  "14:00",
                  "14:55",
                  "16:10",
                  "17:05",
                ][i]
              }
            </div>
          </div>
        ))}
        {frame > 2.6 * fps && frame < 5.4 * fps ? (
          <Finger
            x={84 + 3.5 * col + move * col}
            y={98 + 2.55 * row}
            opacity={interpolate(
              frame,
              [2.6 * fps, 2.85 * fps, 5.15 * fps, 5.4 * fps],
              [0, 1, 1, 0],
              clamp,
            )}
          />
        ) : null}
      </GlassPanel>
      <Chip
        style={{
          position: "absolute",
          left: portrait ? 80 : 112,
          top: portrait ? 530 : 730,
        }}
      >
        <Symbol kind="arrow" size={30} />
        左右滑动，平滑换周
      </Chip>
    </Stage>
  );
};
