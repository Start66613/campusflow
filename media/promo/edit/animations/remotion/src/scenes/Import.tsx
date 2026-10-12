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
export const Import = () => {
  const frame = useCurrentFrame();
  const { portrait, fps } = useLayout();
  const steps =
    frame > 3.1 * fps ? 3 : frame > 2.2 * fps ? 2 : frame > 1.1 * fps ? 1 : 0;
  return (
    <Stage>
      <Heading
        eyebrow="02 / IMPORT"
        title={
          <>
            少一点手填，
            <br />
            多一点自动。
          </>
        }
        body={
          "登录湘大教务，导入课表与成绩。\n课表截图、实验安排、CSV 也能接入。"
        }
        style={{ width: portrait ? 920 : 810 }}
      />
      <Phone
        screen="schedule"
        style={{
          left: portrait ? 390 : 1370,
          top: portrait ? 650 : 110,
          width: 360,
          height: 770,
          rotate: "4deg",
        }}
      />
      <GlassPanel
        style={{
          position: "absolute",
          left: portrait ? 80 : 980,
          top: portrait ? 700 : 210,
          width: portrait ? 590 : 590,
          padding: "35px 38px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 34,
            fontWeight: 700,
            marginBottom: 31,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              display: "grid",
              placeItems: "center",
              borderRadius: 20,
              background: "#655ce813",
              color: palette.violet,
            }}
          >
            <Symbol kind="calendar" />
          </div>
          教务导入
        </div>
        {[
          "完成校内账号登录",
          "读取本学期课程与成绩",
          "预览后写入 CampusFlow",
        ].map((s, i) => (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "25px 0",
              borderTop: "1px solid #948dba15",
              fontSize: 28,
              color: steps > i ? "#464058" : "#A9A2B8",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 50,
                display: "grid",
                placeItems: "center",
                background: steps > i ? palette.violet : "#BDB7CE20",
                color: "white",
              }}
            >
              {steps > i ? <Symbol size={26} /> : i + 1}
            </div>
            {s}
          </div>
        ))}
      </GlassPanel>
      <div
        style={{
          position: "absolute",
          left: portrait ? 80 : 112,
          top: portrait ? 1500 : 830,
          display: "flex",
          gap: 18,
          opacity: interpolate(frame, [4.2 * fps, 4.7 * fps], [0, 1], clamp),
        }}
      >
        <Chip>图片识别</Chip>
        <Chip>CSV 导入</Chip>
        <Chip>不保存教务密码</Chip>
      </div>
    </Stage>
  );
};
