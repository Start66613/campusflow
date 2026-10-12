import {
  AbsoluteFill,
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
  LightSweep,
  Phone,
  Stage,
  useLayout,
} from "../design";
const DIYLayer = ({ jiahao }: { jiahao: boolean }) => {
  const frame = useCurrentFrame();
  const { portrait, fps } = useLayout();
  const current = Math.min(3, Math.floor(frame / (1.1 * fps)));
  return (
    <Stage
      dark={jiahao}
      accent={
        jiahao
          ? "#8247C2"
          : ["#655CE8", "#4696DF", "#70C3A2", "#74C7DB"][current]
      }
    >
      <Heading
        eyebrow={jiahao ? "06 / JIAHAO MODE" : "06 / MAKE IT YOURS"}
        title={
          jiahao ? (
            <>
              全体嘉豪，
              <br />
              往里豪。
            </>
          ) : (
            <>
              你的课表，
              <br />
              你的风格。
            </>
          )
        }
        body={
          jiahao
            ? "独立主题图标，雨夜紫色背景。\nAI 也能切换嘉豪语气。"
            : "颜色、壁纸、头像与个人信息。\n课程名称、地点、时间、图标，自由编辑。"
        }
        dark={jiahao}
        style={{ width: portrait ? 920 : 890 }}
      />
      <Phone
        screen={jiahao ? "jiahao" : "personalize"}
        scale={portrait ? 1 : 0.88}
        style={{
          transformOrigin: "top left",
          left: portrait ? 360 : 1230,
          top: portrait ? 660 : 90,
          rotate: `${interpolate(frame, [0, 1 * fps], [-4, 0], clamp)}deg`,
        }}
      />
      {!jiahao ? (
        <GlassPanel
          style={{
            position: "absolute",
            left: portrait ? 80 : 112,
            top: portrait ? 1530 : 810,
            padding: "20px 25px",
            display: "flex",
            gap: 18,
            borderRadius: 99,
          }}
        >
          {[
            "#655CE8",
            "#4696DF",
            "#70C3A2",
            "#74C7DB",
            "#202033",
            "#E99799",
          ].map((color, i) => (
            <div
              key={color}
              style={{
                width: 52,
                height: 52,
                borderRadius: 99,
                background: color,
                border:
                  current === i ? "4px solid white" : "4px solid transparent",
                boxShadow: current === i ? `0 0 0 2px ${color}` : undefined,
                scale: current === i ? 1.12 : 1,
              }}
            />
          ))}
        </GlassPanel>
      ) : (
        <div
          style={{
            position: "absolute",
            left: portrait ? 80 : 112,
            top: portrait ? 1520 : 730,
            display: "flex",
            gap: 23,
          }}
        >
          <CanvasImage
            src={staticFile("images/jiahao-home.png")}
            premountFor={fps}
            style={{ width: 105, height: 105, borderRadius: 27 }}
          />
          <CanvasImage
            src={staticFile("images/jiahao-assistant.png")}
            premountFor={fps}
            style={{ width: 105, height: 105, borderRadius: 27 }}
          />
          <CanvasImage
            src={staticFile("images/jiahao-course-code.png")}
            premountFor={fps}
            style={{ width: 105, height: 105, borderRadius: 27 }}
          />
        </div>
      )}
      <Chip
        dark={jiahao}
        style={{
          position: "absolute",
          left: portrait ? 80 : 112,
          top: portrait ? 1670 : 865,
          fontSize: 24,
        }}
      >
        液态玻璃 / 经典原生 · 随时切换
      </Chip>
      <LightSweep delay={4.7} />
    </Stage>
  );
};
export const DIY = () => {
  const frame = useCurrentFrame();
  const { fps } = useLayout();
  const theme = interpolate(frame, [4.9 * fps, 5.35 * fps], [0, 1], clamp);
  return (
    <>
      <AbsoluteFill style={{ opacity: 1 - theme }}>
        <DIYLayer jiahao={false} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: theme }}>
        <DIYLayer jiahao />
      </AbsoluteFill>
    </>
  );
};
