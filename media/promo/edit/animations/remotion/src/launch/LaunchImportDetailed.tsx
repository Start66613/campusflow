import type {CSSProperties, ReactNode} from "react";
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import "../design";
import {ClosePhone, DiyScheduleScreen} from "./DiyPrimitives";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const fluid = Easing.bezier(0.4, 0, 0.2, 1);
const accent = "#655CE8";

function MaterialCard({children, style}: {children: ReactNode; style?: CSSProperties}) {
  return <div style={{background: "#FFFFFF", border: "1px solid #FFFFFF", borderRadius: 28,
    boxShadow: "0 8px 28px #22284B09", ...style}}>{children}</div>;
}

function Check({progress, size = 28}: {progress: number; size?: number}) {
  return <div style={{width: size, height: size, flexShrink: 0, position: "relative", borderRadius: size / 2,
    background: "#EEEFFC", color: accent}}>
    <div style={{position: "absolute", inset: 0, borderRadius: size / 2, background: accent, opacity: progress}} />
    <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#FFFFFF", fontSize: size * 0.62, fontWeight: 700, opacity: progress}}>✓</div>
    <div style={{position: "absolute", left: size * 0.35, top: size * 0.35, width: size * 0.3, height: size * 0.3,
      borderRadius: size / 2, background: accent, opacity: 1 - progress}} />
  </div>;
}

function ReadingRow({label, detail, start, end}: {label: string; detail: string; start: number; end: number}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = interpolate(frame, [start * fps, end * fps], [0, 1], {...clamp, easing: fluid});
  return <div style={{display: "flex", alignItems: "center", gap: 12, height: 59}}>
    <Check progress={progress} size={30} />
    <div style={{flex: 1}}>
      <div style={{fontSize: 19, fontWeight: 700}}>{label}</div>
      <div style={{fontSize: 13, color: "#717786", marginTop: 3}}>{detail}</div>
    </div>
    <div style={{fontSize: 12, fontWeight: 700, color: accent, opacity: progress}}>完成</div>
  </div>;
}

/** Synthetic school portal: the student has already completed the normal school login. */
function SchoolPortal() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{position: "relative", width: 390, height: 844, background: "#F4F5FA", color: "#181B23"}}>
    <div style={{position: "absolute", left: 24, top: 14, fontSize: 14, fontWeight: 700}}>09:41</div>
    <div style={{position: "absolute", right: 22, top: 15, fontSize: 12, fontWeight: 700}}>▮▮▮  ▰</div>
    <div style={{position: "absolute", left: 23, top: 67, display: "flex", alignItems: "center", gap: 12}}>
      <div style={{width: 42, height: 42, borderRadius: 14, background: accent, color: "white", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 25, fontWeight: 700}}>学</div>
      <div><div style={{fontSize: 24, fontWeight: 700}}>湘潭大学教务</div>
        <div style={{fontSize: 12, color: "#717786", marginTop: 3}}>学校网页 · 本人登录</div></div>
    </div>
    <MaterialCard style={{position: "absolute", left: 22, top: 139, width: 346, height: 130, padding: "20px 22px", boxSizing: "border-box"}}>
      <div style={{fontSize: 13, color: "#717786"}}>统一身份认证</div>
      <div style={{display: "flex", alignItems: "center", gap: 11, marginTop: 12}}>
        <Check progress={1} size={30} /><div style={{fontSize: 27, fontWeight: 700}}>登录已完成</div>
      </div>
      <div style={{fontSize: 14, color: "#717786", marginTop: 10}}>正在连接本学期教务数据</div>
    </MaterialCard>
    <div style={{position: "absolute", left: 25, top: 294, fontSize: 19, fontWeight: 700}}>2026 秋季学期</div>
    <MaterialCard style={{position: "absolute", left: 22, top: 328, width: 346, height: 107, padding: "20px 22px", boxSizing: "border-box"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{fontSize: 23, fontWeight: 700}}>本学期课表</div><div style={{color: accent, fontSize: 27}}>▦</div>
      </div>
      <div style={{fontSize: 14, color: "#717786", marginTop: 13}}>课程 · 时间 · 地点 · 周次</div>
    </MaterialCard>
    <MaterialCard style={{position: "absolute", left: 22, top: 447, width: 346, height: 91, padding: "18px 22px", boxSizing: "border-box"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{fontSize: 23, fontWeight: 700}}>课程成绩</div><div style={{color: accent, fontSize: 27}}>↗</div>
      </div>
      <div style={{fontSize: 14, color: "#717786", marginTop: 10}}>成绩 · 学分 · 课程性质</div>
    </MaterialCard>
    <div style={{position: "absolute", left: 22, top: 563, width: 346, height: 183, borderRadius: 25,
      background: "#FFFFFF", boxSizing: "border-box", padding: "3px 18px",
      opacity: interpolate(frame, [2.8 * fps, 3.2 * fps], [0, 1], {...clamp, easing: fluid})}}>
      <ReadingRow label="读取本学期课表" detail="课程与上课时间" start={3.1} end={3.85} />
      <ReadingRow label="读取课程成绩" detail="成绩与学分" start={4.0} end={4.75} />
      <ReadingRow label="核对课程字段" detail="教室 · 教师 · 周次" start={4.9} end={5.65} />
    </div>
    <div style={{position: "absolute", left: 22, top: 767, width: 346, height: 49, borderRadius: 18, background: accent,
      display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18, fontWeight: 700}}>
      <div style={{position: "absolute", opacity: interpolate(frame, [2.8 * fps, 3.2 * fps], [1, 0], {...clamp, easing: fluid})}}>登录之后 自动导入</div>
      <div style={{position: "absolute", opacity: interpolate(frame, [2.8 * fps, 3.2 * fps, 5.65 * fps, 5.95 * fps], [0, 1, 1, 0], {...clamp, easing: fluid})}}>正在导入到 CampusFlow</div>
      <div style={{position: "absolute", opacity: interpolate(frame, [5.65 * fps, 5.95 * fps], [0, 1], {...clamp, easing: fluid})}}>✓ 导入完成</div>
    </div>
  </div>;
}

/** 696 frames at 60 fps: 0–3 login, 3–6 read, 6–9 reveal, 9–11.6 hold. */
export const LaunchImportDetailed = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: "#F5F5F7", color: "#181B23", fontFamily: "Campus", overflow: "hidden"}}>
    <ClosePhone left={170} top={45} scale={1.13} rotate={0}>
      <DiyScheduleScreen accent="#655CE8" clarity={1} enabled={1} />
      <div style={{position: "absolute", inset: 0,
        opacity: interpolate(frame, [6 * fps, 7.4 * fps], [1, 0], {...clamp, easing: fluid}),
        translate: interpolate(frame, [6 * fps, 7.4 * fps], ["0px 0px", "0px -16px"], {...clamp, easing: fluid})}}>
        <SchoolPortal />
      </div>
      <div style={{position: "absolute", left: 49, top: 694, width: 292, height: 47, borderRadius: 20,
        background: "#FFFFFFF2", boxShadow: "0 4px 18px #26245415", color: accent, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 8, fontSize: 19, fontWeight: 700,
        opacity: interpolate(frame, [7.1 * fps, 7.6 * fps, 8.6 * fps, 9 * fps], [0, 1, 1, 0], {...clamp, easing: fluid})}}>
        ✓ 课表与成绩已导入
      </div>
    </ClosePhone>
    <Interactive.Div name="湘大课表 一键导入" premountFor={fps} style={{position: "absolute", left: 845, top: 115, width: 880,
      fontSize: 104, lineHeight: 1.23, fontWeight: 700, letterSpacing: 0,
      opacity: interpolate(frame, [2.6 * fps, 3 * fps], [1, 0], {...clamp, easing: fluid}),
      translate: interpolate(frame, [2.6 * fps, 3 * fps], ["0px 0px", "0px -12px"], {...clamp, easing: fluid})}}>
      湘大课表<br /><span style={{color: "#655CE8"}}>一键导入</span>
    </Interactive.Div>
    <Interactive.Div name="登录之后 课表成绩一起带来" premountFor={fps} style={{position: "absolute", left: 845, top: 115, width: 880,
      fontSize: 92, lineHeight: 1.28, fontWeight: 700, letterSpacing: 0,
      opacity: interpolate(frame, [3.05 * fps, 3.6 * fps], [0, 1], {...clamp, easing: fluid}),
      translate: interpolate(frame, [3.05 * fps, 3.6 * fps], ["0px 14px", "0px 0px"], {...clamp, easing: fluid})}}>
      登录之后<br /><span style={{color: "#655CE8"}}>课表成绩一起带来</span>
    </Interactive.Div>
    <Interactive.Div name="学校网页登录状态" premountFor={fps} style={{position: "absolute", left: 850, top: 439, width: 827,
      height: 274, borderRadius: 38, background: "#FFFFFF", padding: "35px 39px", boxSizing: "border-box", boxShadow: "0 12px 40px #20274707",
      opacity: interpolate(frame, [5.9 * fps, 6.5 * fps], [1, 0], {...clamp, easing: fluid})}}>
      <div style={{display: "flex", alignItems: "center", gap: 19}}><Check progress={1} size={47} />
        <div style={{fontSize: 43, fontWeight: 700}}>学校网页登录完成</div></div>
      <div style={{display: "flex", alignItems: "center", gap: 16, marginTop: 31}}>
        <div style={{padding: "11px 20px", borderRadius: 17, background: "#F0EFFC", color: accent, fontSize: 30, fontWeight: 700}}>课表</div>
        <div style={{padding: "11px 20px", borderRadius: 17, background: "#F0EFFC", color: accent, fontSize: 30, fontWeight: 700}}>成绩</div>
        <div style={{fontSize: 29, color: "#777C88", marginLeft: 5}}>同一次导入</div>
      </div>
      <div style={{height: 6, background: "#EEEFFA", borderRadius: 4, marginTop: 29, overflow: "hidden"}}>
        <div style={{height: "100%", background: accent, borderRadius: 4,
          width: interpolate(frame, [3 * fps, 5.8 * fps], ["0%", "100%"], {...clamp, easing: fluid})}} />
      </div>
    </Interactive.Div>
    <Interactive.Div name="导入结果 演示数据" premountFor={fps} style={{position: "absolute", left: 850, top: 429, width: 827,
      opacity: interpolate(frame, [6.15 * fps, 7.25 * fps], [0, 1], {...clamp, easing: fluid}),
      translate: interpolate(frame, [6.15 * fps, 7.25 * fps], ["0px 18px", "0px 0px"], {...clamp, easing: fluid})}}>
      <div style={{fontSize: 28, color: "#737987", marginBottom: 21}}>演示数据</div>
      <div style={{display: "flex", gap: 22}}>
        <MaterialCard style={{width: 402, height: 238, padding: "29px 32px", boxSizing: "border-box", borderRadius: 36}}>
          <div style={{fontSize: 29, color: "#737987"}}>本学期课程</div>
          <div style={{display: "flex", alignItems: "baseline", gap: 16, marginTop: 10}}>
            <div style={{fontSize: 101, color: accent, fontWeight: 700, lineHeight: 1}}>7</div><div style={{fontSize: 34}}>门</div>
          </div>
        </MaterialCard>
        <MaterialCard style={{width: 402, height: 238, padding: "29px 32px", boxSizing: "border-box", borderRadius: 36}}>
          <div style={{fontSize: 29, color: "#737987"}}>课程成绩</div>
          <div style={{display: "flex", alignItems: "baseline", gap: 16, marginTop: 10}}>
            <div style={{fontSize: 101, color: accent, fontWeight: 700, lineHeight: 1}}>12</div><div style={{fontSize: 34}}>门</div>
          </div>
        </MaterialCard>
      </div>
      <div style={{display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700, marginTop: 37}}>
        <Check progress={1} size={39} />完整一周 已经排好
      </div>
    </Interactive.Div>
  </AbsoluteFill>;
};

/** 396 frames at 60 fps, beginning with the identical fully populated device. */
export const LaunchScheduleDetailed = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: "#F5F5F7", color: "#181B23", fontFamily: "Campus", overflow: "hidden"}}>
    <ClosePhone left={170} top={45} scale={1.13} rotate={0}>
      <DiyScheduleScreen accent="#655CE8" clarity={1} enabled={1} />
      <div style={{position: "absolute", left: 44, top: 200, width: 45, height: 123, border: "2.5px solid #655CE8",
        borderRadius: 12, boxSizing: "border-box", boxShadow: "0 0 0 4px #655CE815",
        opacity: interpolate(frame, [1 * fps, 1.5 * fps, 2.5 * fps, 3 * fps], [0, 1, 1, 0], {...clamp, easing: fluid})}} />
      <div style={{position: "absolute", left: 136, top: 460, width: 45, height: 123, border: "2.5px solid #655CE8",
        borderRadius: 12, boxSizing: "border-box", boxShadow: "0 0 0 4px #655CE815",
        opacity: interpolate(frame, [2.6 * fps, 3.15 * fps], [0, 1], {...clamp, easing: fluid})}} />
      <div style={{position: "absolute", left: 142, top: 512, width: 32, height: 25, paddingTop: 1,
        background: "#E7A1B6", color: "#18303F", fontSize: 8, lineHeight: 1.4, boxSizing: "border-box",
        opacity: interpolate(frame, [5 * fps, 5.4 * fps], [0, 1], {...clamp, easing: fluid})}}>信息楼 312</div>
    </ClosePhone>
    <Interactive.Div name="完整一周课表" premountFor={fps} style={{position: "absolute", left: 845, top: 115, width: 880,
      fontSize: 103, fontWeight: 700, lineHeight: 1.23, letterSpacing: 0,
      opacity: interpolate(frame, [0.15 * fps, 0.75 * fps], [0, 1], {...clamp, easing: fluid}),
      translate: interpolate(frame, [0.15 * fps, 0.75 * fps], ["0px 12px", "0px 0px"], {...clamp, easing: fluid})}}>
      一整周<br /><span style={{color: "#655CE8"}}>尽在眼前</span>
    </Interactive.Div>
    <Interactive.Div name="七天视图" premountFor={fps} style={{position: "absolute", left: 850, top: 439, width: 827, height: 429,
      background: "#FFFFFF", borderRadius: 38, padding: "36px 38px", boxSizing: "border-box", boxShadow: "0 12px 40px #20274707",
      opacity: interpolate(frame, [0.25 * fps, 0.85 * fps, 2.5 * fps, 3.1 * fps], [0, 1, 1, 0], {...clamp, easing: fluid})}}>
      <div style={{fontSize: 44, fontWeight: 700}}>完整七天视图</div>
      <div style={{display: "flex", gap: 12, marginTop: 37}}>
        {["一", "二", "三", "四", "五", "六", "日"].map((day, index) => <div key={day} style={{width: 96, height: 87,
          borderRadius: 21, background: index < 5 ? "#F0EFFC" : "#F5F5F7", color: index < 5 ? accent : "#8C909A",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5}}>
          <div style={{fontSize: 19}}>周{day}</div><div style={{fontSize: 28, fontWeight: 700}}>{12 + index}</div>
        </div>)}
      </div>
      <div style={{marginTop: 36, fontSize: 34, fontWeight: 700}}>课程 时间 教室 一眼看清</div>
      <div style={{marginTop: 20, fontSize: 27, color: "#747B89"}}>点开课程 可以继续编辑</div>
    </Interactive.Div>
    <Interactive.Div name="编辑数据结构课程" premountFor={fps} style={{position: "absolute", left: 850, top: 420, width: 827, height: 513,
      borderRadius: 38, background: "#FFFFFF", boxShadow: "0 12px 40px #20274707", padding: "29px 38px", boxSizing: "border-box",
      opacity: interpolate(frame, [2.6 * fps, 3.2 * fps], [0, 1], {...clamp, easing: fluid}),
      translate: interpolate(frame, [2.6 * fps, 3.2 * fps], ["0px 14px", "0px 0px"], {...clamp, easing: fluid})}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{fontSize: 46, fontWeight: 700}}>数据结构</div>
        <div style={{borderRadius: 15, background: "#F0EFFC", color: accent, padding: "9px 15px", fontSize: 24, fontWeight: 700}}>编辑课程</div>
      </div>
      <div style={{display: "flex", gap: 24, marginTop: 27}}>
        <div style={{width: 340}}><div style={{fontSize: 23, color: "#747B89", marginBottom: 11}}>上课时间</div>
          <div style={{fontSize: 31, fontWeight: 700}}>周三 14:00—15:40</div></div>
        <div><div style={{fontSize: 23, color: "#747B89", marginBottom: 11}}>上课周次</div>
          <div style={{fontSize: 31, fontWeight: 700}}>第 1—18 周</div></div>
      </div>
      <div style={{fontSize: 23, color: "#747B89", marginTop: 25, marginBottom: 11}}>上课地点</div>
      <div style={{position: "relative", height: 85, borderRadius: 22, background: "#F8F8FD", border: "2px solid #655CE8",
        boxSizing: "border-box", padding: "18px 22px", fontSize: 36, fontWeight: 700}}>
        <div style={{position: "absolute", opacity: interpolate(frame, [4 * fps, 4.5 * fps], [1, 0], {...clamp, easing: fluid})}}>信息楼 310</div>
        <div style={{position: "absolute", opacity: interpolate(frame, [4 * fps, 4.5 * fps], [0, 1], {...clamp, easing: fluid})}}>信息楼 312</div>
        <div style={{position: "absolute", right: 23, top: 25, width: 3, height: 34, borderRadius: 2, background: accent,
          opacity: interpolate(frame, [4.7 * fps, 5 * fps], [1, 0], {...clamp, easing: fluid})}} />
      </div>
      <div style={{position: "relative", marginTop: 27, height: 67, borderRadius: 22, background: accent, color: "white",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700,
        scale: interpolate(frame, [4.8 * fps, 4.96 * fps, 5.15 * fps], [1, 0.985, 1], {...clamp, easing: fluid})}}>
        <div style={{position: "absolute", opacity: interpolate(frame, [5 * fps, 5.4 * fps], [1, 0], {...clamp, easing: fluid})}}>保存课程修改</div>
        <div style={{position: "absolute", opacity: interpolate(frame, [5 * fps, 5.4 * fps], [0, 1], {...clamp, easing: fluid})}}>✓ 修改已保存</div>
      </div>
    </Interactive.Div>
  </AbsoluteFill>;
};
