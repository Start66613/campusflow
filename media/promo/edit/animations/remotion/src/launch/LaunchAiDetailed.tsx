import React, {use, type CSSProperties} from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {campusFontsReady, Symbol} from "../design";
import {ClosePhone} from "./DiyPrimitives";

const ink = "#181B23";
const purple = "#655CE8";
const muted = "#686D7B";
const green = "#288B70";
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const smooth = Easing.bezier(0.4, 0, 0.2, 1);
const phrase = "午饭25元，明天15点图书馆复习2小时";

/** Film-only reconstruction of the real confirmation flow, with readable demo data */
function AiStage({children}: {children: React.ReactNode}) {
  use(campusFontsReady);
  return <AbsoluteFill style={{background: "#F5F5F7", color: ink, fontFamily: "Campus, sans-serif", overflow: "hidden"}}>
    {children}
  </AbsoluteFill>;
}

/** Only the inner UI changes, so the same device remains in place throughout the AI group */
function AiPhone({title, children, tab = "AI记"}: {title: string; children: React.ReactNode; tab?: string}) {
  return <ClosePhone left={170} top={45} scale={1.13}>
    <div style={{position: "relative", width: 390, height: 844, background: "#F8F8FB", color: ink, fontFamily: "Campus, sans-serif"}}>
      <div style={{position: "absolute", left: 24, top: 15, fontSize: 14, fontWeight: 700}}>09:41</div>
      <div style={{position: "absolute", right: 22, top: 16, fontSize: 14, fontWeight: 700}}>▮▮▮ ▰</div>
      <div style={{position: "absolute", left: 22, top: 64, fontSize: 14, fontWeight: 700, color: purple, letterSpacing: 1}}>CAMPUS AI</div>
      <div style={{position: "absolute", left: 20, top: 91, fontSize: 29, lineHeight: 1.2, fontWeight: 700}}>{title}</div>
      <div style={{position: "absolute", right: 20, top: 91, padding: "7px 10px", borderRadius: 18, background: "#EEECFC", color: purple, fontSize: 14, fontWeight: 700}}>DeepSeek</div>
      {children}
      <div style={{position: "absolute", left: 10, right: 10, top: 754, height: 68, borderRadius: 29, background: "#FFFFFF", border: "1px solid #EAEAF1", display: "flex", alignItems: "center"}}>
        {["首页", "课表", "AI记", "数据", "我的"].map((label, index) => <div key={label} style={{width: 74, textAlign: "center", color: label === tab ? purple : muted, fontWeight: label === tab ? 700 : 400}}>
          <div style={{fontSize: 23, lineHeight: 1.25}}>{["⌂", "▦", "✦", "▥", "◉"][index]}</div>
          <div style={{fontSize: 14, marginTop: 3}}>{label}</div>
        </div>)}
      </div>
    </div>
  </ClosePhone>;
}

function Layer({from = 0, until, children, style}: {from?: number; until?: number; children: React.ReactNode; style?: CSSProperties}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = interpolate(frame, [from * fps, (from + 0.5) * fps], [0, 1], {...clamp, easing: smooth});
  const leave = until === undefined ? 1 : interpolate(frame, [(until - 0.35) * fps, until * fps], [1, 0], {...clamp, easing: smooth});
  return <div style={{position: "absolute", inset: 0, opacity: enter * leave, translate: `0px ${interpolate(frame, [from * fps, (from + 0.65) * fps], [12, 0], {...clamp, easing: smooth})}px`, ...style}}>{children}</div>;
}

function Reveal({from, children, style}: {from: number; children: React.ReactNode; style?: CSSProperties}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{opacity: interpolate(frame, [from * fps, (from + 0.4) * fps], [0, 1], {...clamp, easing: smooth}), translate: `0px ${interpolate(frame, [from * fps, (from + 0.4) * fps], [6, 0], {...clamp, easing: smooth})}px`, ...style}}>{children}</div>;
}

function RightTitle({first, second, label, from = 0, until}: {first: string; second: string; label: string; from?: number; until?: number}) {
  // The previous headline exits before the next one enters; body cards can still dissolve.
  return <Layer from={from>0?from+.4:0} until={until}>
    <div style={{position: "absolute", left: 845, top: 115, width: 880}}>
      <div style={{fontSize: 30, fontWeight: 700, color: purple, marginBottom: 23}}>{label}</div>
      <div style={{fontSize: 104, fontWeight: 700, lineHeight: 1.19, letterSpacing: 0}}>{first}<br /><span style={{color: purple}}>{second}</span></div>
    </div>
  </Layer>;
}

function PhoneCard({children, style}: {children: React.ReactNode; style?: CSSProperties}) {
  return <div style={{position: "absolute", left: 20, width: 350, boxSizing: "border-box", borderRadius: 23, padding: 20, background: "#FFFFFF", border: "1px solid #E8E8F1", boxShadow: "0 5px 22px #20243B06", ...style}}>{children}</div>;
}

function RightCard({children, style}: {children: React.ReactNode; style?: CSSProperties}) {
  return <div style={{position: "absolute", left: 845, top: 490, width: 840, boxSizing: "border-box", borderRadius: 30, padding: "30px 36px", background: "#FFFFFF", border: "1px solid #E5E5EF", boxShadow: "0 18px 45px #292D4706", ...style}}>{children}</div>;
}

function PhoneButton({children, secondary = false, style}: {children: React.ReactNode; secondary?: boolean; style?: CSSProperties}) {
  return <div style={{height: 48, borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, boxSizing: "border-box", background: secondary ? "#FFFFFF" : purple, color: secondary ? purple : "#FFFFFF", border: secondary ? "1px solid #D9D5F5" : "1px solid transparent", ...style}}>{children}</div>;
}

function PhoneRow({label, value, style}: {label: string; value: string; style?: CSSProperties}) {
  return <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, fontSize: 17, lineHeight: 1.65, marginTop: 10, ...style}}>
    <span style={{color: muted, whiteSpace: "nowrap"}}>{label}</span><span style={{fontWeight: 700, textAlign: "right"}}>{value}</span>
  </div>;
}

function Tap({at, x, y}: {at: number; x: number; y: number}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{position: "absolute", left: x - 18, top: y - 18, width: 36, height: 36, borderRadius: "50%", border: "2px solid #FFFFFF", background: "#FFFFFFA0", boxShadow: "0 0 0 9px #655CE826", opacity: interpolate(frame, [(at - 0.15) * fps, at * fps, (at + 0.35) * fps, (at + 0.7) * fps], [0, 1, 1, 0], clamp), scale: interpolate(frame, [(at - 0.15) * fps, at * fps, (at + 0.7) * fps], [1.4, 1, 1.2], {...clamp, easing: smooth})}} />;
}

/** 456 frames at 60 fps, including the parent timeline's 0.6 second overlap */
export const LaunchAiSetupDetailed: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const saved = frame >= 5.05 * fps;
  const keyLength = Math.floor(interpolate(frame, [0.75 * fps, 1.85 * fps], [0, 12], clamp));
  const modelLength = Math.floor(interpolate(frame, [2.15 * fps, 3.15 * fps], [0, "deepseek-flash".length], clamp));
  return <AiStage>
    <AiPhone title="个人 AI" tab="我的">
      <Layer>
        <PhoneCard style={{top: 152, height: 116}}>
          <div style={{fontSize: 16, color: muted}}>服务</div>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12}}>
            <div style={{fontSize: 28, fontWeight: 700}}>DeepSeek</div>
            <div style={{fontSize: 16, color: purple, fontWeight: 700}}>个人直连</div>
          </div>
        </PhoneCard>
        <PhoneCard style={{top: 285, height: 302}}>
          <div style={{fontSize: 16, fontWeight: 700, color: saved ? green : muted}}>{saved ? "✓ 已安全保存" : "配置你的密钥"}</div>
          <div style={{fontSize: 16, color: muted, marginTop: 18}}>DeepSeek API Key</div>
          <div style={{height: 48, marginTop: 8, borderRadius: 14, background: "#F3F2FA", display: "flex", alignItems: "center", padding: "0 13px", fontSize: 18, boxSizing: "border-box"}}>
            {saved ? "已保存 · 留空不更换" : `sk-${"•".repeat(keyLength)}`}
          </div>
          <div style={{fontSize: 16, color: muted, marginTop: 18}}>模型名称</div>
          <div style={{height: 48, marginTop: 8, borderRadius: 14, background: "#F3F2FA", border: frame > 2 * fps && frame < 3.7 * fps ? "1.5px solid #655CE8" : "1.5px solid transparent", display: "flex", alignItems: "center", padding: "0 13px", fontSize: 18, boxSizing: "border-box"}}>
            {"deepseek-flash".slice(0, modelLength)}
          </div>
          <PhoneButton style={{marginTop: 20}}>{saved ? "✓ 配置已保存" : frame >= 4.55 * fps ? "正在验证…" : "验证 DeepSeek 并保存"}</PhoneButton>
        </PhoneCard>
        <PhoneCard style={{top: 608, height: 112, background: "#EEECFC", borderColor: "#EEECFC"}}>
          <div style={{display: "flex", gap: 9, alignItems: "center", fontSize: 17, fontWeight: 700}}><Symbol kind="lock" size={23} color={purple} />密钥存储</div>
          <div style={{marginTop: 9, fontSize: 16, lineHeight: 1.55, color: muted}}>原生端保存在系统安全区<br />网页预览仅保存在当前内存</div>
        </PhoneCard>
      </Layer>
      <Tap at={4.55} x={248} y={539} />
    </AiPhone>
    <RightTitle first="你的AI" second="自己掌控" label="个人 AI · 01" until={3.5} />
    <RightTitle first="自带密钥" second="选择模型" label="个人 AI · 01" from={3.15} />
    <Layer from={0.55} until={3.5}>
      <RightCard style={{top: 495, height: 300}}>
        <div style={{fontSize: 32, color: muted}}>接入你的 DeepSeek Key</div>
        <div style={{fontSize: 48, fontWeight: 700, marginTop: 20}}>sk-••••••••••••</div>
        <div style={{fontSize: 30, color: purple, marginTop: 25}}>演示密钥已遮蔽</div>
      </RightCard>
    </Layer>
    <Layer from={3.15}>
      <RightCard style={{top: 495, height: 300}}>
        <div style={{display: "flex", justifyContent: "space-between", fontSize: 32, color: muted}}><span>模型名称</span><span style={{color: purple}}>可编辑</span></div>
        <div style={{fontSize: 48, fontWeight: 700, marginTop: 20}}>deepseek-flash</div>
        <div style={{fontSize: 30, color: purple, marginTop: 25}}>验证后保存配置</div>
      </RightCard>
    </Layer>
    <Layer from={5.05}>
      <div style={{position: "absolute", left: 850, top: 835, display: "flex", alignItems: "center", gap: 18, color: green, fontSize: 32, fontWeight: 700}}>
        <Symbol kind="lock" size={42} color={green} />原生端密钥保存在系统安全区
      </div>
    </Layer>
  </AiStage>;
};

function QuickInput() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const typed = phrase.slice(0, Math.floor(interpolate(frame, [0.3 * fps, 1.65 * fps], [0, phrase.length], clamp)));
  return <Layer until={2.85}>
    <PhoneCard style={{top: 160, height: 142}}>
      <div style={{fontSize: 21, fontWeight: 700}}>想记什么，直接告诉我</div>
      <div style={{fontSize: 17, color: muted, lineHeight: 1.7, marginTop: 13}}>日程、消费、作业和课程<br />整理好后由你确认</div>
    </PhoneCard>
    <PhoneCard style={{top: 329, minHeight: 126, background: "#EEECFC", borderColor: "#E7E3FA"}}>
      <div style={{fontSize: 19, lineHeight: 1.7, fontWeight: 700}}>{typed}<span style={{color: purple}}>▎</span></div>
    </PhoneCard>
    <PhoneCard style={{top: 602, height: 119}}>
      <div style={{fontSize: 16, color: muted}}>一句话，同时安排</div>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 15}}>
        <div style={{fontSize: 17, color: purple}}>＋ 照片</div>
        <PhoneButton style={{width: 123}}>发送 ↑</PhoneButton>
      </div>
    </PhoneCard>
  </Layer>;
}

function QuickPreview() {
  return <Layer from={2.45} until={6.05}>
    <PhoneCard style={{top: 157, height: 68, padding: "20px"}}>
      <div style={{fontSize: 18, fontWeight: 700, color: purple}}>已识别 2 项 · 请核对</div>
    </PhoneCard>
    <PhoneCard style={{top: 241, height: 138}}>
      <div style={{fontSize: 16, color: muted}}>消费预览</div>
      <div style={{display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "center"}}><span style={{fontSize: 24, fontWeight: 700}}>午饭</span><span style={{fontSize: 32, fontWeight: 700, color: green}}>¥25</span></div>
      <div style={{fontSize: 17, marginTop: 10, color: muted}}>餐饮 · 今天</div>
    </PhoneCard>
    <PhoneCard style={{top: 394, height: 158}}>
      <div style={{fontSize: 16, color: muted}}>日程预览</div>
      <div style={{fontSize: 24, fontWeight: 700, marginTop: 8}}>图书馆复习</div>
      <div style={{fontSize: 18, fontWeight: 700, marginTop: 12}}>明天 15:00–17:00</div>
      <div style={{fontSize: 17, color: muted, marginTop: 6}}>图书馆 · 2 小时</div>
    </PhoneCard>
    <PhoneCard style={{top: 572, height: 137}}>
      <div style={{fontSize: 17, color: muted, textAlign: "center"}}>确认后才会写入</div>
      <div style={{display: "flex", gap: 10, marginTop: 17}}><PhoneButton secondary style={{width: 94}}>取消</PhoneButton><PhoneButton style={{flex: 1}}>确认写入</PhoneButton></div>
    </PhoneCard>
  </Layer>;
}

function QuickConfirmed() {
  return <Layer from={5.65} until={8.75}>
    <PhoneCard style={{top: 171, height: 123, background: "#EAF6F1", borderColor: "#E0F0E8"}}>
      <div style={{display: "flex", alignItems: "center", gap: 10, color: green, fontSize: 25, fontWeight: 700}}><Symbol size={30} color={green} />已写入 2 项</div>
      <div style={{fontSize: 17, color: muted, marginTop: 15}}>已按你的确认完成写入</div>
    </PhoneCard>
    <PhoneCard style={{top: 314, height: 244}}>
      <div style={{fontSize: 16, color: muted}}>已记账</div>
      <div style={{fontSize: 23, fontWeight: 700, marginTop: 9}}>¥25 · 餐饮 · 午饭</div>
      <div style={{height: 1, background: "#EEEFF5", margin: "23px 0"}} />
      <div style={{fontSize: 16, color: muted}}>已加入日程</div>
      <div style={{fontSize: 23, fontWeight: 700, marginTop: 9}}>图书馆复习</div>
      <div style={{fontSize: 18, marginTop: 8}}>明天 15:00–17:00</div>
    </PhoneCard>
    <PhoneCard style={{top: 581, height: 105}}>
      <PhoneButton secondary>撤销刚才的写入</PhoneButton>
    </PhoneCard>
  </Layer>;
}

function ExperimentPhoto() {
  return <Layer from={8.4} until={10.7}>
    <PhoneCard style={{top: 159, height: 347, background: "#F1F0F5", padding: 17}}>
      <div style={{background: "#FFFFFF", borderRadius: 10, height: 270, padding: "21px 17px", boxSizing: "border-box", border: "1px solid #E5E3EB", rotate: "-1deg"}}>
        <div style={{fontSize: 23, fontWeight: 700}}>物理实验安排</div>
        <div style={{height: 2, background: ink, margin: "16px 0 12px"}} />
        <PhoneRow label="上课时间" value="周四 第 5–6 节" style={{fontSize: 16, lineHeight: 1.4, marginTop: 8}} />
        <PhoneRow label="具体时间" value="14:00–15:40" style={{fontSize: 16, lineHeight: 1.4, marginTop: 8}} />
        <PhoneRow label="上课周次" value="第 5–12 周" style={{fontSize: 16, lineHeight: 1.4, marginTop: 8}} />
        <PhoneRow label="上课地点" value="实验中心 201" style={{fontSize: 16, lineHeight: 1.4, marginTop: 8}} />
        <PhoneRow label="任课老师" value="杨老师" style={{fontSize: 16, lineHeight: 1.4, marginTop: 8}} />
      </div>
      <div style={{fontSize: 16, color: muted, textAlign: "center", marginTop: 15}}>已选择课程安排照片 · 演示</div>
    </PhoneCard>
    <PhoneCard style={{top: 527, height: 98, background: "#EEECFC"}}>
      <div style={{fontSize: 19, lineHeight: 1.6, fontWeight: 700}}>识别图片中的实验课安排</div>
    </PhoneCard>
    <PhoneCard style={{top: 645, height: 76, padding: 13}}><PhoneButton>识别安排</PhoneButton></PhoneCard>
  </Layer>;
}

function ExperimentPreview() {
  return <Layer from={10.3}>
    <PhoneCard style={{top: 161, height: 429}}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}><span style={{fontSize: 23, fontWeight: 700}}>AI课程预览</span><span style={{fontSize: 15, color: purple, fontWeight: 700}}>待确认</span></div>
      <div style={{fontSize: 27, fontWeight: 700, marginTop: 25}}>物理实验</div>
      <PhoneRow label="星期与节次" value="周四 第 5–6 节" style={{marginTop: 22}} />
      <PhoneRow label="时间" value="14:00–15:40" />
      <PhoneRow label="周次" value="第 5–12 周" />
      <PhoneRow label="地点" value="实验中心 201" />
      <PhoneRow label="教师" value="杨老师" />
      <div style={{borderRadius: 13, background: "#F4F2FE", padding: "13px 14px", color: purple, fontSize: 17, lineHeight: 1.5, marginTop: 21}}>已整理课程字段<br />请先核对，再确认写入</div>
    </PhoneCard>
    <PhoneCard style={{top: 610, height: 108}}>
      <PhoneButton>确认追加到课表</PhoneButton>
      <div style={{fontSize: 15, color: muted, textAlign: "center", marginTop: 11}}>等待你的确认</div>
    </PhoneCard>
  </Layer>;
}

/** 876 frames at 60 fps, including the parent timeline's 0.6 second overlap */
export const LaunchAiQuickDetailed: React.FC = () => <AiStage>
  <AiPhone title="AI 快记">
    <QuickInput />
    <QuickPreview />
    <QuickConfirmed />
    <ExperimentPhoto />
    <ExperimentPreview />
    <Tap at={2.2} x={300} y={676} />
    <Tap at={5.5} x={251} y={654} />
    <Tap at={9.7} x={245} y={681} />
  </AiPhone>
  <RightTitle first="说一句" second="分成两件事" label="AI 快记 · 02" until={2.85} />
  <RightTitle first="识别两项" second="先看预览" label="AI 快记 · 02" from={2.45} until={6.05} />
  <RightTitle first="确认后" second="才写入" label="AI 快记 · 02" from={5.65} until={8.75} />
  <RightTitle first="拍下安排" second="核对课程" label="AI 快记 · 02" from={8.4} />
  <Layer from={0.45} until={2.85}>
    <RightCard style={{top: 495, height: 285}}>
      <div style={{fontSize: 31, color: muted}}>把两件事放进一句话</div>
      <div style={{fontSize: 44, fontWeight: 700, lineHeight: 1.6, marginTop: 18}}>{phrase}</div>
    </RightCard>
  </Layer>
  <Layer from={2.45} until={6.05}>
    <RightCard style={{top: 485, height: 182}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}><div><div style={{fontSize: 30, color: muted}}>消费预览</div><div style={{fontSize: 42, fontWeight: 700, marginTop: 12}}>午饭 · 餐饮</div></div><div style={{fontSize: 68, fontWeight: 700, color: green}}>¥25</div></div>
    </RightCard>
    <RightCard style={{top: 690, height: 198}}>
      <div style={{fontSize: 30, color: muted}}>日程预览</div>
      <div style={{fontSize: 42, fontWeight: 700, marginTop: 12}}>图书馆复习</div>
      <div style={{fontSize: 32, color: purple, marginTop: 12}}>明天 15:00–17:00 · 2 小时</div>
    </RightCard>
    <div style={{position: "absolute", left: 850, top: 928, fontSize: 30, color: muted}}>核对金额与时间，再点确认写入</div>
  </Layer>
  <Layer from={5.65} until={8.75}>
    <RightCard style={{top: 495, height: 310}}>
      <div style={{display: "flex", alignItems: "center", gap: 22, color: green, fontSize: 56, fontWeight: 700}}><Symbol size={60} color={green} />已写入 2 项</div>
      <div style={{fontSize: 34, color: muted, marginTop: 25}}>消费与日程，各自归位</div>
      <div style={{display: "inline-flex", alignItems: "center", padding: "13px 23px", marginTop: 27, borderRadius: 16, border: "1.5px solid #D9D5F5", color: purple, fontSize: 32, fontWeight: 700}}>撤销刚才的写入</div>
    </RightCard>
  </Layer>
  <Layer from={8.4} until={10.7}>
    <RightCard style={{top: 495, height: 290}}>
      <div style={{fontSize: 31, color: muted}}>课程与实验安排照片</div>
      <div style={{fontSize: 48, fontWeight: 700, marginTop: 20}}>读出星期、节次与周次</div>
      <div style={{fontSize: 34, color: purple, marginTop: 25}}>整理为可核对的课程字段</div>
    </RightCard>
  </Layer>
  <Layer from={10.3}>
    <RightCard style={{top: 485, height: 416}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}><span style={{fontSize: 32, color: muted}}>AI课程预览</span><span style={{fontSize: 30, padding: "8px 20px", color: purple, background: "#EEECFC", borderRadius: 16}}>待确认</span></div>
      <div style={{fontSize: 52, fontWeight: 700, marginTop: 23}}>物理实验</div>
      <div style={{fontSize: 36, fontWeight: 700, marginTop: 19}}>周四 第 5–6 节 · 第 5–12 周</div>
      <div style={{fontSize: 32, color: muted, marginTop: 17}}>14:00–15:40 · 实验中心 201</div>
      <div style={{fontSize: 32, color: purple, marginTop: 28}}>由你确认后，追加到课表</div>
    </RightCard>
  </Layer>
</AiStage>;

function AnalysisInitial() {
  return <Layer until={3.3}>
    <PhoneCard style={{top: 154, height: 179, background: purple, borderColor: purple, color: "#FFFFFF"}}>
      <div style={{fontSize: 17, fontWeight: 700}}>必修课 GPA</div>
      <div style={{fontSize: 61, lineHeight: 1.2, marginTop: 8, fontWeight: 700, fontVariantNumeric: "tabular-nums"}}>3.74</div>
      <div style={{fontSize: 16, color: "#EBE8FF", marginTop: 9}}>教务导入 · 演示数据 · 4.0 满绩</div>
    </PhoneCard>
    <PhoneCard style={{top: 354, height: 206}}>
      <div style={{fontSize: 23, fontWeight: 700}}>AI 学业与未来方向</div>
      <div style={{fontSize: 17, color: muted, marginTop: 18, lineHeight: 1.8}}>专业：计算机科学与技术<br />目标：考研与开发岗位</div>
      <div style={{fontSize: 16, color: purple, marginTop: 14}}>依据已导入成绩生成建议</div>
    </PhoneCard>
    <PhoneCard style={{top: 581, height: 126}}>
      <PhoneButton>生成个性化分析</PhoneButton>
      <div style={{fontSize: 16, color: muted, marginTop: 15, textAlign: "center"}}>本次未联网 · 建议示例</div>
    </PhoneCard>
  </Layer>;
}

function AnalysisOverview() {
  return <Layer from={2.95} until={6.5}>
    <PhoneCard style={{top: 157, height: 82, padding: "19px 20px"}}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}><span style={{fontSize: 18, fontWeight: 700}}>必修课 GPA</span><span style={{fontSize: 34, color: purple, fontWeight: 700}}>3.74</span></div>
    </PhoneCard>
    <PhoneCard style={{top: 259, height: 425}}>
      <div style={{fontSize: 24, fontWeight: 700}}>你的学业画像</div>
      <div style={{fontSize: 16, color: muted, marginTop: 10}}>基于这份演示成绩的建议</div>
      <Reveal from={3.05} style={{marginTop: 26}}><div style={{fontSize: 18, color: green, fontWeight: 700}}>你的优势</div><div style={{fontSize: 18, lineHeight: 1.6, marginTop: 8}}>程序设计基础较稳</div></Reveal>
      <Reveal from={3.5} style={{marginTop: 26}}><div style={{fontSize: 18, color: purple, fontWeight: 700}}>优先补强</div><div style={{fontSize: 18, lineHeight: 1.6, marginTop: 8}}>高数应用题，按专题练习</div></Reveal>
      <Reveal from={3.95} style={{marginTop: 26}}><div style={{fontSize: 18, color: purple, fontWeight: 700}}>接下来怎么做</div><div style={{fontSize: 18, lineHeight: 1.6, marginTop: 8}}>错题分类，周末重新做一遍</div></Reveal>
    </PhoneCard>
    <div style={{position: "absolute", left: 28, top: 710, color: muted, fontSize: 16}}>本次未联网 · 根据个人目标调整</div>
  </Layer>;
}

function AnalysisStep({from, until, label, title, first, second, third}: {from: number; until?: number; label: string; title: string; first: string; second: string; third: string}) {
  return <Layer from={from} until={until}>
    <PhoneCard style={{top: 157, height: 82, padding: "19px 20px"}}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}><span style={{fontSize: 18, fontWeight: 700}}>必修课 GPA</span><span style={{fontSize: 34, color: purple, fontWeight: 700}}>3.74</span></div>
    </PhoneCard>
    <PhoneCard style={{top: 259, height: 349}}>
      <div style={{fontSize: 17, color: purple, fontWeight: 700}}>下一步 · {label}</div>
      <div style={{fontSize: 27, fontWeight: 700, lineHeight: 1.4, marginTop: 22}}>{title}</div>
      <div style={{fontSize: 18, lineHeight: 1.7, marginTop: 25}}>{first}</div>
      <div style={{fontSize: 18, lineHeight: 1.7, marginTop: 16}}>{second}</div>
      <div style={{fontSize: 17, color: muted, lineHeight: 1.7, marginTop: 16}}>{third}</div>
    </PhoneCard>
    <PhoneCard style={{top: 629, height: 88, padding: "18px 20px"}}>
      <div style={{fontSize: 16, color: muted, lineHeight: 1.65}}>本次未联网 · 建议示例<br />结合你的专业与目标再调整</div>
    </PhoneCard>
  </Layer>;
}

function RightAnalysisStep({from, until, label, title, first, second}: {from: number; until?: number; label: string; title: string; first: string; second: string}) {
  return <Layer from={from} until={until}>
    <RightCard style={{top: 495, height: 367}}>
      <div style={{fontSize: 31, color: purple, fontWeight: 700}}>下一步 · {label}</div>
      <div style={{fontSize: 52, fontWeight: 700, lineHeight: 1.35, marginTop: 23}}>{title}</div>
      <div style={{fontSize: 36, color: ink, marginTop: 27}}>{first}</div>
      <div style={{fontSize: 32, color: muted, marginTop: 19}}>{second}</div>
    </RightCard>
    <div style={{position: "absolute", left: 850, top: 902, color: muted, fontSize: 30}}>建议示例 · 结合个人目标调整</div>
  </Layer>;
}

/** 876 frames at 60 fps, with three grounded next-step suggestions shown one at a time */
export const LaunchAiAnalysisDetailed: React.FC = () => <AiStage>
  <AiPhone title="成绩分析" tab="数据">
    <AnalysisInitial />
    <AnalysisOverview />
    <AnalysisStep from={6.15} until={8.95} label="学习" title="高数专题练习" first="每周两次，每次 30 分钟" second="错题按主题整理，周末复做" third="从这周最薄弱的一类题开始" />
    <AnalysisStep from={8.6} until={11.7} label="考研" title="先核对目标院校" first="查看招生简章与考试科目" second="按基础课列出复习清单" third="招生要求以最新官方公告为准" />
    <AnalysisStep from={11.35} label="求职" title="整理项目作品集" first="选一项课程项目，补齐演示" second="写清功能、技术选择与成果" third="结合岗位要求补充项目经验" />
    <Tap at={2.65} x={247} y={625} />
  </AiPhone>
  <RightTitle first="成绩背后" second="找到下一步" label="AI 成绩分析 · 03" until={6.5} />
  <RightTitle first="学习方法" second="落到行动" label="AI 成绩分析 · 03" from={6.15} until={8.95} />
  <RightTitle first="考研准备" second="分步推进" label="AI 成绩分析 · 03" from={8.6} until={11.7} />
  <RightTitle first="求职方向" second="做成作品" label="AI 成绩分析 · 03" from={11.35} />
  <Layer from={0.45} until={3.3}>
    <RightCard style={{top: 495, height: 324}}>
      <div style={{fontSize: 32, color: muted}}>已导入的必修课成绩</div>
      <div style={{display: "flex", alignItems: "baseline", gap: 29, marginTop: 9}}><span style={{fontSize: 112, lineHeight: 1.2, color: purple, fontWeight: 700, fontVariantNumeric: "tabular-nums"}}>3.74</span><span style={{fontSize: 36, fontWeight: 700}}>必修课 GPA</span></div>
      <div style={{fontSize: 30, color: muted, marginTop: 19}}>教务导入 · 演示数据</div>
    </RightCard>
  </Layer>
  <Layer from={2.95} until={6.5}>
    <RightCard style={{top: 495, height: 363}}>
      <div style={{fontSize: 30, color: muted}}>从成绩到可执行的建议</div>
      <div style={{display: "grid", gap: 19, marginTop: 27}}>
        <Reveal from={3.05} style={{fontSize: 38, lineHeight: 1.45}}><span style={{fontSize: 30, color: green, display: "inline-block", width: 130}}>优势</span>程序设计基础较稳</Reveal>
        <Reveal from={3.5} style={{fontSize: 38, lineHeight: 1.45}}><span style={{fontSize: 30, color: purple, display: "inline-block", width: 130}}>补强</span>高数应用题专题练习</Reveal>
        <Reveal from={3.95} style={{fontSize: 38, lineHeight: 1.45}}><span style={{fontSize: 30, color: purple, display: "inline-block", width: 130}}>方法</span>错题分类，每周复做</Reveal>
      </div>
    </RightCard>
  </Layer>
  <RightAnalysisStep from={6.15} until={8.95} label="学习" title="高数专题练习" first="每周两次 · 每次30分钟" second="错题分主题整理，周末复做" />
  <RightAnalysisStep from={8.6} until={11.7} label="考研" title="先核对目标院校" first="查看招生简章与考试科目" second="按基础课列出复习清单" />
  <RightAnalysisStep from={11.35} label="求职" title="整理项目作品集" first="选一项课程项目，补齐演示" second="写清功能、技术选择与成果" />
</AiStage>;
