import {
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  Chip,
  clamp,
  Heading,
  LightSweep,
  palette,
  Phone,
  Stage,
  Symbol,
  useLayout,
} from "../design";
export const Hero = () => {
  const frame = useCurrentFrame();
  const { portrait, fps } = useLayout();
  return (
    <Stage>
      <Heading
        eyebrow="YOUR CAMPUS. IN FLOW."
        title={
          <>
            课表之外，
            <br />
            生活之内。
          </>
        }
        body={"课程、日程、任务与消费\n在一个地方，安排妥当。"}
      />
      <Phone
        screen="home"
        scale={portrait ? 1 : 0.9}
        style={{
          transformOrigin: "top left",
          rotate: `${interpolate(frame, [0, 1.3 * fps], [-7, 0], clamp)}deg`,
          left: portrait ? 340 : 1220,
          top: portrait ? 630 : 75,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(150deg,#E8E6FB,#F5F5FA 58%,#EAF5F0)",
            padding: "65px 23px 25px",
            fontFamily: "Campus",
            color: palette.ink,
          }}
        >
          <div style={{ fontSize: 13, color: "#8F87A1", letterSpacing: 2 }}>
            CAMPUSFLOW
          </div>
          <div style={{ fontSize: 31, fontWeight: 700, margin: "14px 0 24px" }}>
            早上好，同学
          </div>
          <div
            style={{
              padding: "25px 22px",
              background: "linear-gradient(145deg,#7970F0,#655CE8)",
              borderRadius: 30,
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: 17, opacity: 0.85 }}>
              下一节课 <span style={{ float: "right" }}>第 3 周</span>
            </div>
            <div
              style={{ fontSize: 28, fontWeight: 700, margin: "31px 0 15px" }}
            >
              数据结构与算法
            </div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              今天 14:00 · 信息科技大楼北310
            </div>
            <div style={{ fontSize: 16, marginTop: 28 }}>
              王老师 <span style={{ float: "right" }}>›</span>
            </div>
            <div
              style={{
                position: "absolute",
                right: -55,
                bottom: -60,
                width: 210,
                height: 210,
                borderRadius: "50%",
                background: "#ffffff09",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "26px 0",
            }}
          >
            {[
              ["spark", "AI 快记"],
              ["calendar", "导入课表"],
              ["clock", "专注25分"],
              ["arrow", "成绩分析"],
            ].map(([icon, t]) => (
              <div key={t} style={{ width: 76, textAlign: "center" }}>
                <div
                  style={{
                    height: 55,
                    width: 55,
                    margin: "0 auto 10px",
                    background: "#FFFFFF70",
                    borderRadius: 19,
                    display: "grid",
                    placeItems: "center",
                    color: palette.violet,
                  }}
                >
                  <Symbol kind={icon} size={28} />
                </div>
                <div style={{ fontSize: 13 }}>{t}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 23, fontWeight: 700, marginBottom: 15 }}>
            今日概览
          </div>
          <div style={{ display: "flex", gap: 15 }}>
            <div
              style={{
                flex: 1,
                borderRadius: 24,
                background: "#ffffffbb",
                padding: 20,
              }}
            >
              <div style={{ fontSize: 13, color: "#A19AAF" }}>今日消费</div>
              <div style={{ fontSize: 32, fontWeight: 700, margin: "12px 0" }}>
                ¥39.5
              </div>
              <div style={{ fontSize: 12, color: "#65A996" }}>记录 2 笔</div>
            </div>
            <div
              style={{
                flex: 1,
                borderRadius: 24,
                background: "#ffffffbb",
                padding: 20,
              }}
            >
              <div style={{ fontSize: 13, color: "#A19AAF" }}>本周专注</div>
              <div style={{ fontSize: 30, fontWeight: 700, margin: "12px 0" }}>
                3h 5m
              </div>
              <div style={{ fontSize: 12, color: "#C49869" }}>继续保持</div>
            </div>
          </div>
          <div style={{ fontSize: 23, fontWeight: 700, margin: "26px 0 15px" }}>
            待办事项
          </div>
          <div
            style={{
              background: "#ffffffae",
              borderRadius: 25,
              padding: 21,
              fontSize: 16,
            }}
          >
            □{"\u3000"}完成高数习题 2.3
            <div
              style={{ height: 1, background: "#9288A513", margin: "20px 0" }}
            />
            □{"\u3000"}提交程序设计实验报告
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 25,
              left: 12,
              right: 12,
              borderRadius: 99,
              background: "#FFFFFFCC",
              height: 71,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              border: "1px solid #FFFFFF",
            }}
          >
            {[
              ["calendar", "首页"],
              ["calendar", "课表"],
              ["spark", "AI 记"],
              ["arrow", "数据"],
              ["lock", "我的"],
            ].map(([ic, t], i) => (
              <div
                key={t}
                style={{
                  width: 68,
                  textAlign: "center",
                  borderRadius: 50,
                  padding: "9px 0",
                  background: i === 0 ? "#C7C1F5A0" : undefined,
                  color: i === 0 ? palette.violet : "#99939F",
                }}
              >
                <Symbol kind={ic} size={24} />
                <div style={{ fontSize: 12, marginTop: 3 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </Phone>
      <CanvasImage
        src={staticFile("images/icon-2026.png")}
        premountFor={fps}
        style={{
          position: "absolute",
          width: portrait ? 100 : 86,
          height: portrait ? 100 : 86,
          left: portrait ? 850 : 112,
          top: portrait ? 106 : 74,
          borderRadius: 24,
          boxShadow: "0 15px 40px #655ce824",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: portrait ? 80 : 112,
          top: portrait ? 1650 : 790,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          maxWidth: portrait ? 920 : 790,
        }}
      >
        <Chip>
          <Symbol kind="calendar" size={31} />
          整周课表
        </Chip>
        <Chip>
          <Symbol kind="spark" size={31} />
          AI 快记
        </Chip>
        <Chip>iPhone · Android</Chip>
      </div>
      <LightSweep delay={3} />
    </Stage>
  );
};
