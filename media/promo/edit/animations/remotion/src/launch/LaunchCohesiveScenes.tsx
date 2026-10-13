import type {ReactNode} from "react";
import {AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ClosePhone, DiyScheduleScreen} from "./DiyPrimitives";
import "../design";

const clamp={extrapolateLeft:"clamp",extrapolateRight:"clamp"} as const;
const settle=Easing.bezier(.22,1,.36,1);
const fluid=Easing.bezier(.4,0,.2,1);
const accent="#655CE8";

export function NarrativeStage({children}: {children:ReactNode}) {
  return <AbsoluteFill style={{background:"#F5F5F7",color:"#181B23",fontFamily:"Campus",overflow:"hidden"}}>
    <AbsoluteFill style={{background:"radial-gradient(ellipse at 30% 52%,#E4E8F680,transparent 68%)"}}/>
    {children}
  </AbsoluteFill>;
}

function StatusBar() {
  return <><div style={{position:"absolute",left:24,top:14,fontSize:14,fontWeight:700}}>09:41</div>
    <div style={{position:"absolute",right:21,top:15,fontSize:12,fontWeight:700}}>▮▮▮ ▰</div></>;
}

/** Scope comes first, before the product thesis. No generic “for students” shot. */
export function LaunchOpeningCohesive() {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const scope=interpolate(t,[.35,1.15],[0,1],{...clamp,easing:settle});
  const thesis=interpolate(t,[1.25,2.1],[0,1],{...clamp,easing:settle});
  return <NarrativeStage>
    <ClosePhone left={170+interpolate(t,[0,1.1],[23,0],{...clamp,easing:settle})} top={45}
      scale={interpolate(t,[0,1.5],[1.08,1.13],{...clamp,easing:settle})}
      rotate={interpolate(t,[0,1.6],[-1.2,0],{...clamp,easing:settle})}>
      <DiyScheduleScreen wallpaperOpacity={.18}/>
    </ClosePhone>
    <div style={{position:"absolute",left:845,top:139,width:900}}>
      <div style={{fontSize:39,fontWeight:700,color:accent,opacity:interpolate(t,[0,.7],[0,1],clamp)}}>CampusFlow</div>
      <div style={{fontSize:106,fontWeight:700,lineHeight:1.2,marginTop:54,opacity:scope,
        translate:`0 ${interpolate(t,[.35,1.15],[25,0],{...clamp,easing:settle})}px`,
        clipPath:`inset(0 ${100*(1-scope)}% 0 0)`}}><span style={{color:accent}}>湘大</span>学生专供</div>
      <div style={{marginTop:77,fontSize:75,fontWeight:700,lineHeight:1.35,opacity:thesis,
        translate:`0 ${interpolate(t,[1.25,2.1],[22,0],{...clamp,easing:settle})}px`}}>重新定义<br/>课程表</div>
    </div>
  </NarrativeStage>;
}

/** Same front-facing device anchor as the AI and import chapters. */
export function LaunchFocusCohesive() {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const started=t>=2.3;
  const remaining=1500-(started?Math.floor(t-2.3):0);
  const time=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`;
  const touch=interpolate(t,[1.9,2.15,2.3,2.65],[0,.75,.75,0],clamp);
  const secondary=interpolate(t,[3.2,4.1],[0,1],{...clamp,easing:settle});
  return <NarrativeStage>
    <ClosePhone left={170} top={45} scale={1.13}>
      <div style={{position:"absolute",inset:0,background:"#E8EFFB",color:"#171719"}}>
        <CanvasImage src={staticFile("screens/focus.png")} premountFor={fps}
          style={{position:"absolute",left:0,top:52,width:390,height:792}}/>
        <StatusBar/>
        {started?<>
          <div style={{position:"absolute",left:98,top:251,width:194,height:183,borderRadius:100,background:"#F2F2F7"}}/>
          <div style={{position:"absolute",left:80,top:312,width:230,lineHeight:"56px",fontSize:50,fontWeight:700,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{time}</div>
          <div style={{position:"absolute",left:115,top:375,width:160,fontSize:13,fontWeight:700,textAlign:"center",color:accent}}>专注中</div>
          <div style={{position:"absolute",left:190,top:500,width:92,height:55,borderRadius:19,background:accent,color:"white",fontSize:19,fontWeight:700,lineHeight:"55px",textAlign:"center"}}>暂停</div>
        </>:null}
        <div style={{position:"absolute",left:241,top:534,width:25,height:25,borderRadius:14,background:"#FFFFFF",boxShadow:"0 1px 8px #34405930",opacity:touch}}/>
      </div>
    </ClosePhone>
    <div style={{position:"absolute",left:845,top:135,width:880}}>
      <div style={{fontSize:101,fontWeight:700,lineHeight:1.24}}>专注25分<br/>留给自己</div>
      <div style={{marginTop:83,fontSize:34,fontWeight:700,color:"#5D6272",opacity:secondary}}>一次只做一件事</div>
      <div style={{marginTop:37,width:660,borderRadius:32,background:"#FFFFFFC9",border:"1px solid white",padding:"33px 36px",opacity:secondary,
        translate:`0 ${interpolate(t,[3.2,4.1],[17,0],{...clamp,easing:settle})}px`}}>
        <div style={{fontSize:27,color:accent,fontWeight:700}}>本次目标</div>
        <div style={{fontSize:35,fontWeight:700,marginTop:20}}>完成高数习题 2.3</div>
        <div style={{fontSize:27,color:"#606775",marginTop:17}}>少一点分心 多一点完成</div>
      </div>
    </div>
  </NarrativeStage>;
}

function SettingsRow({label,detail,on=false,action}: {label:string;detail:string;on?:boolean;action?:string}) {
  return <div style={{padding:"23px 21px",borderBottom:".5px solid #E6E8EE",position:"relative"}}>
    <div style={{fontSize:17,fontWeight:700,paddingRight:62}}>{label}</div>
    <div style={{fontSize:12,color:"#677080",marginTop:9}}>{detail}</div>
    {action?<div style={{position:"absolute",right:18,top:24,padding:"7px 9px",borderRadius:13,fontSize:11,fontWeight:700,color:accent,background:"#E9E7FB"}}>{action}</div>:<div style={{position:"absolute",right:18,top:24,width:48,height:29,borderRadius:15,background:on?accent:"#C8CDD7"}}>
      <div style={{position:"absolute",top:3,left:on?22:3,width:23,height:23,borderRadius:12,background:"white"}}/>
    </div>}
  </div>;
}

/** Functional notifications, not a claim of integration with the native Clock alarm. */
export function LaunchRemindersCohesive() {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const early=interpolate(t,[3.5,4.1],[0,1],{...clamp,easing:fluid});
  const note=interpolate(t,[1,1.8],[0,1],{...clamp,easing:settle});
  return <NarrativeStage>
    <ClosePhone left={170} top={45} scale={1.13}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(155deg,#EBEEFC,#F6F8FB)",color:"#181B23"}}>
        <StatusBar/>
        <div style={{position:"absolute",left:20,top:80,fontSize:28,fontWeight:700}}>智能提醒</div>
        <div style={{position:"absolute",left:17,top:147,width:356,borderRadius:25,background:"#FFFFFFD9",overflow:"hidden"}}>
          <SettingsRow label="空闲学习提醒" detail="根据课表寻找无课时间" on={t>1}/>
          <SettingsRow label="早八起床提醒" detail="07:00 · 明早有课" action={t>4?"已安排":"设置"}/>
        </div>
        <div style={{position:"absolute",left:18,top:375,width:354,height:263,borderRadius:29,background:"#FFFFFFD9",padding:"25px 24px",boxSizing:"border-box",opacity:note}}>
          <div style={{fontSize:12,fontWeight:700,color:accent}}>CAMPUSFLOW 提醒</div>
          <div style={{position:"absolute",left:24,top:67,opacity:1-early}}>
            <div style={{fontSize:23,fontWeight:700}}>明天有一段空闲时间</div>
            <div style={{fontSize:16,marginTop:20}}>19:00—19:25</div>
            <div style={{fontSize:14,color:"#657084",marginTop:15}}>复习高数 开始25分钟专注</div>
          </div>
          <div style={{position:"absolute",left:24,top:66,opacity:early}}>
            <div style={{fontSize:53,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>07:00</div>
            <div style={{fontSize:20,fontWeight:700,marginTop:12}}>早八提醒已安排</div>
            <div style={{fontSize:14,color:"#657084",marginTop:14}}>明早08:00 高等数学</div>
          </div>
        </div>
      </div>
    </ClosePhone>
    <div style={{position:"absolute",left:845,top:135,width:880}}>
      <div style={{position:"absolute",opacity:1-early,fontSize:101,fontWeight:700,lineHeight:1.24}}>智能提醒<br/>找准空闲时间</div>
      <div style={{position:"absolute",opacity:early,fontSize:101,fontWeight:700,lineHeight:1.24}}>早八不慌<br/>提醒先安排</div>
      <div style={{position:"absolute",top:360,opacity:note,width:720,borderRadius:35,background:"#FFFFFFC9",padding:"36px 40px",border:"1px solid white"}}>
        <div style={{fontSize:32,fontWeight:700,color:accent}}>{early>.5?"明天的第一节课":"把空闲留给成长"}</div>
        <div style={{fontSize:47,fontWeight:700,marginTop:28,fontVariantNumeric:"tabular-nums"}}>{early>.5?"08:00 高等数学":"19:00—19:25"}</div>
        <div style={{fontSize:28,color:"#606775",marginTop:22}}>{early>.5?"07:00 起床提醒":"课表里的空档 变成你的专注时间"}</div>
      </div>
    </div>
  </NarrativeStage>;
}

export function LaunchClosingCohesive() {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  return <NarrativeStage>
    <CanvasImage src={staticFile("images/icon-2026.png")} premountFor={fps}
      style={{position:"absolute",left:878,top:162,width:164,height:164,borderRadius:38,
        scale:interpolate(t,[0,1],[.91,1],{...clamp,easing:settle})}}/>
    <div style={{position:"absolute",left:0,right:0,top:396,textAlign:"center",fontSize:123,fontWeight:700,
      opacity:interpolate(t,[.15,.9],[0,1],{...clamp,easing:settle})}}>CampusFlow</div>
    <div style={{position:"absolute",left:0,right:0,top:596,textAlign:"center",fontSize:80,fontWeight:700,
      opacity:interpolate(t,[.65,1.35],[0,1],{...clamp,easing:settle})}}>湘大学生专供</div>
    <div style={{position:"absolute",left:0,right:0,top:739,textAlign:"center",fontSize:45,color:"#646B78",
      opacity:interpolate(t,[1.1,1.8],[0,1],{...clamp,easing:settle})}}>重新定义课程表</div>
    <div style={{position:"absolute",left:0,right:0,bottom:53,textAlign:"center",fontSize:19,color:"#7C828D"}}>独立开发 · 非学校官方应用 · 开发预览 · 演示数据</div>
  </NarrativeStage>;
}
