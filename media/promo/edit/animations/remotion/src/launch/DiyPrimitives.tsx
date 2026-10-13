import React, {type CSSProperties} from "react";
import {CanvasImage, staticFile, useVideoConfig} from "remotion";
import "../design";

export const DIY_WALLPAPERS = [
  {file:"diy-wallpapers/train-sky.jpg", name:"天空与海"},
  {file:"diy-wallpapers/howl.jpg", name:"哈尔"},
  {file:"diy-wallpapers/howl-sophie.jpg", name:"哈尔与苏菲"},
] as const;
export const DIY_COLORS = ["#655CE8", "#176BD8", "#168B72", "#1687C9", "#242428", "#DA5B68", "#7C5CE8"];
export function withAlpha(color:string,alpha:number) {
  const rgb=color.startsWith("#")
    ? [1,3,5].map(i=>parseInt(color.slice(i,i+2),16))
    : (color.match(/[\d.]+/g)??["0","0","0"]).slice(0,3).map(Number);
  return `rgba(${rgb.join(",")},${alpha})`;
}

export function DemoWallpaper({index, nextIndex=index, blend=0, opacity=0.76}: {
  index:number; nextIndex?:number; blend?:number; opacity?:number;
}) {
  const {fps}=useVideoConfig();
  return <div style={{position:"absolute",inset:0, background:"#DFE7F4"}}>
    <CanvasImage src={staticFile(DIY_WALLPAPERS[index].file)} premountFor={fps}
      style={{position:"absolute",width:"100%",height:"100%",objectFit:"cover",objectPosition:"50% 50%",opacity:opacity*(1-blend)}} />
    {nextIndex!==index ? <CanvasImage src={staticFile(DIY_WALLPAPERS[nextIndex].file)} premountFor={fps}
      style={{position:"absolute",width:"100%",height:"100%",objectFit:"cover",objectPosition:"50% 50%",opacity:opacity*blend}} /> : null}
    <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(255,255,255,.15),rgba(255,255,255,.04) 45%,rgba(255,255,255,.2))"}} />
  </div>;
}

/** Remade film-only UI surface. Wallpaper bends beneath it; lettering remains undistorted. */
export function OpticalSurface({x,y,w,h,r=22,clarity=1,enabled=1,tint="#FFFFFF",children,wallpaper=0,nextWallpaper=wallpaper,wallpaperBlend=0,wallpaperOpacity=.76}: {
  x:number;y:number;w:number;h:number;r?:number;clarity?:number;enabled?:number;tint?:string;
  children?:React.ReactNode;wallpaper?:number;nextWallpaper?:number;wallpaperBlend?:number;wallpaperOpacity?:number;
}) {
  const frost=1-clarity;
  const alpha=0.98*(1-enabled)+(0.72*frost+0.3)*enabled;
  return <div style={{position:"absolute",left:x,top:y,width:w,height:h,borderRadius:r,overflow:"hidden",
    background:"#FFFFFF",boxShadow:`0 ${2+4*clarity}px ${12+12*clarity}px rgba(20,30,70,${0.025+0.06*enabled})`}}>
    <div style={{position:"absolute",left:-x,top:-y,width:390,height:844,
      scale:1+0.024*clarity,filter:`blur(${17*frost+1.5}px) saturate(1.1)`,opacity:enabled}}>
      <DemoWallpaper index={wallpaper} nextIndex={nextWallpaper} blend={wallpaperBlend} opacity={wallpaperOpacity}/>
    </div>
    <div style={{position:"absolute",inset:0,background:tint,opacity:alpha}} />
    <div style={{position:"absolute",inset:0,borderRadius:r,
      border:`${0.7+0.65*enabled}px solid rgba(255,255,255,${0.2+0.65*enabled})`,
      boxShadow:`inset 0 ${1.2+enabled}px ${2+5*enabled}px rgba(255,255,255,.9), inset 0 -1.5px 4px rgba(46,65,110,${0.015+.09*enabled})`,
      background:`linear-gradient(135deg,rgba(255,255,255,${0.08*enabled}) 0%,transparent 25%,transparent 79%,rgba(255,255,255,${0.15*enabled}) 100%)`}} />
    <div style={{position:"relative",height:"100%",color:"#171B25"}}>{children}</div>
  </div>;
}

const classes=[
  {name:"高等数学",room:"博学楼 A302",day:0,start:0,end:2,color:"#686CE3"},
  {name:"大学英语",room:"博雅楼 B210",day:1,start:2,end:4,color:"#DD8858"},
  {name:"大学物理",room:"致知楼 201",day:2,start:0,end:2,color:"#AD65C1"},
  {name:"数据结构",room:"信息楼 310",day:2,start:4,end:6,color:"#DD6684"},
  {name:"程序设计",room:"信息楼 405",day:0,start:4,end:6,color:"#3FAD9C"},
  {name:"物理实验",room:"实验中心",day:3,start:4,end:7,color:"#E17F83"},
  {name:"羽毛球",room:"东区体育馆",day:4,start:2,end:4,color:"#5899CD"},
];

/** A high-legibility conceptual close-up of the actual seven-column app, not a live capture. */
export function DiyScheduleScreen({accent="#655CE8",wallpaper=0,nextWallpaper=wallpaper,wallpaperBlend=0,
  clarity=1,enabled=1,wallpaperOpacity=.76,rainbow=false}: {
  accent?:string;wallpaper?:number;nextWallpaper?:number;wallpaperBlend?:number;
  clarity?:number;enabled?:number;wallpaperOpacity?:number;rainbow?:boolean;
}) {
  const material={clarity,enabled,wallpaper,nextWallpaper,wallpaperBlend,wallpaperOpacity};
  return <div style={{position:"relative",width:390,height:844,overflow:"hidden",fontFamily:"Campus",color:"#151B25"}}>
    <DemoWallpaper index={wallpaper} nextIndex={nextWallpaper} blend={wallpaperBlend} opacity={wallpaperOpacity} />
    {rainbow?<div style={{position:"absolute",inset:0,background:"linear-gradient(140deg,#BD75EB33,#5BC5E133,#84D3AA33)"}}/>:null}
    <div style={{position:"absolute",top:14,left:24,fontSize:14,fontWeight:700}}>09:41</div>
    <div style={{position:"absolute",top:15,right:21,fontSize:12,fontWeight:700}}>▮▮▮  ▰</div>
    <div style={{position:"absolute",top:58,left:20,fontSize:10,color:"#414A59",fontWeight:700}}>2026 秋季学期 · 10月12日—10月18日</div>
    <div style={{position:"absolute",top:78,left:18,fontSize:25,fontWeight:700}}>第 2 周课表</div>
    <OpticalSurface x={304} y={76} w={66} h={33} {...material} r={16}>
      <div style={{paddingTop:8,textAlign:"center",fontSize:12,fontWeight:700,color:accent}}>＋ 导入</div>
    </OpticalSurface>
    <OpticalSurface x={15} y={135} w={360} h={613} {...material} r={24}>
      <div style={{position:"absolute",left:27,right:8,top:15,display:"flex"}}>
        {["一","二","三","四","五","六","日"].map((day,i)=><div key={day} style={{width:46,textAlign:"center",fontSize:11,fontWeight:700,color:i===0?accent:"#4E5865"}}>
          {day}<div style={{marginTop:5,fontSize:12,background:i===0?accent:"transparent",color:i===0?"white":"#202938",width:23,height:23,lineHeight:"23px",borderRadius:12,marginLeft:11}}>{12+i}</div>
        </div>)}
      </div>
      {Array.from({length:8},(_,i)=><div key={i} style={{position:"absolute",left:5,right:8,top:63+i*65,height:65,borderTop:".5px solid rgba(25,40,65,.08)",fontSize:8,color:"#445363"}}>
        <div style={{position:"absolute",top:7,left:1,fontWeight:700}}>{i+1}</div><div style={{position:"absolute",left:1,top:24,fontSize:6.5}}>{["08:00","08:55","10:10","11:05","14:00","14:55","16:10","17:05"][i]}</div>
      </div>)}
      {Array.from({length:7},(_,i)=><div key={i} style={{position:"absolute",left:29+i*46,top:61,width:46,height:521,borderLeft:".5px solid rgba(25,40,65,.065)"}} />)}
      {classes.map((course,i)=><div key={course.name} style={{position:"absolute",left:30+course.day*46,top:66+course.start*65,width:43,height:(course.end-course.start)*65-9,
        borderRadius:11,padding:"9px 4px",overflow:"hidden",boxSizing:"border-box",background:course.color+Math.round(238-54*enabled).toString(16),
        border:`1px solid rgba(255,255,255,${.8*enabled})`,boxShadow:`inset 0 1px 3px rgba(255,255,255,${.66*enabled}), 0 2px 5px rgba(25,42,72,${.06*enabled})`}}>
        <div style={{fontSize:12,fontWeight:700,lineHeight:1.4}}>{course.name}</div>
        <div style={{fontSize:8,lineHeight:1.4,marginTop:7,color:"#18303F"}}>{course.room}</div>
        <div style={{fontSize:8,marginTop:7,color:"#18303F"}}>{["周老师","林老师","杨老师","王老师","陈老师","杨老师","李老师"][i]}</div>
      </div>)}
    </OpticalSurface>
    <OpticalSurface x={8} y={767} w={374} h={ sixtyEight } {...material} r={34}>
      <div style={{display:"flex",paddingTop:11}}>{["⌂","▦","✦","▥","◉"].map((icon,i)=><div key={icon} style={{width:74,textAlign:"center",fontSize:22,color:i===1?accent:"#344452",position:"relative"}}>
        {i===1?<div style={{position:"absolute",inset:"-4px 5px -4px",borderRadius:24,background:withAlpha(accent,.16),border:".8px solid #FFFFFFB0"}}/>:null}
        <span style={{position:"relative"}}>{icon}</span><div style={{position:"relative",fontSize:10,fontWeight:700}}>{["首页","课表","AI记","数据","我的"][i]}</div>
      </div>)}</div>
    </OpticalSurface>
  </div>;
}
const sixtyEight=68;

/** Large home cards make global accent changes unambiguous before wallpaper selection. */
export function DiyHomeScreen({accent="#655CE8",rainbow=false}: {accent?:string;rainbow?:boolean}) {
  const material={clarity:1,enabled:1,wallpaper:0};
  return <div style={{position:"relative",width:390,height:844,fontFamily:"Campus",overflow:"hidden",color:"#171C27"}}>
    <DemoWallpaper index={0} opacity={.28}/>
    <div style={{position:"absolute",top:14,left:24,fontSize:14,fontWeight:700}}>09:41</div>
    <div style={{position:"absolute",top:15,right:21,fontSize:12,fontWeight:700}}>▮▮▮  ▰</div>
    <div style={{position:"absolute",top:65,left:20,fontSize:28,fontWeight:700}}>早上好，同学</div>
    <div style={{position:"absolute",left:15,top:132,width:360,height:198,borderRadius:29,padding:"22px 22px",boxSizing:"border-box",color:"white",
      background:rainbow?"linear-gradient(125deg,#A670D4,#53ACCB,#60BCA6)":`linear-gradient(125deg,${accent},${withAlpha(accent,.83)})`}}>
      <div style={{fontSize:14,fontWeight:700}}>下一节课</div>
      <div style={{fontSize:30,fontWeight:700,marginTop:24}}>数据结构</div>
      <div style={{fontSize:13,marginTop:8}}>14:00 · 信息楼 310</div>
      <div style={{fontSize:12,marginTop:15}}>王老师</div>
      <div style={{position:"absolute",right:22,top:23,fontSize:12,padding:"5px 9px",borderRadius:14,background:"#FFFFFF2E"}}>第 2 周</div>
    </div>
    {["AI 快记","导入课表","专注25分","成绩分析"].map((label,i)=><div key={label} style={{position:"absolute",left:20+i*93,top:352,width:72,textAlign:"center"}}>
      <div style={{height:58,borderRadius:19,background:"#FFFFFFB0",border:"1px solid #FFFFFFC0",color:accent,fontSize:27,lineHeight:"58px"}}>{["✦","▦","◷","↗"][i]}</div>
      <div style={{marginTop:8,fontSize:10,fontWeight:700}}>{label}</div>
    </div>)}
    <div style={{position:"absolute",left:20,top:462,fontSize:22,fontWeight:700}}>今日概览</div>
    <OpticalSurface x={15} y={502} w={174} h={118} {...material}>
      <div style={{padding:"18px 18px",fontSize:12,color:"#505D6F"}}>今日消费<div style={{marginTop:10,fontSize:29,fontWeight:700,color:"#1A2230",fontVariantNumeric:"tabular-nums"}}>¥39.5</div></div>
    </OpticalSurface>
    <OpticalSurface x={201} y={502} w={174} h={118} {...material}>
      <div style={{padding:"18px 18px",fontSize:12,color:"#505D6F"}}>本周专注<div style={{marginTop:10,fontSize:29,fontWeight:700,color:"#1A2230"}}>1h 15m</div></div>
    </OpticalSurface>
    <OpticalSurface x={15} y={642} w={360} h={104} {...material}>
      <div style={{padding:"17px 19px",fontSize:14,fontWeight:700}}>待办事项</div>
      <div style={{marginLeft:20,fontSize:14}}><span style={{color:accent,marginRight:12}}>▢</span>完成高数习题 2.3</div>
    </OpticalSurface>
    <OpticalSurface x={8} y={767} w={374} h={68} {...material} r={34}>
      <div style={{display:"flex",paddingTop:11}}>{["⌂","▦","✦","▥","◉"].map((icon,i)=><div key={icon} style={{width:74,textAlign:"center",fontSize:22,color:i===0?accent:"#344452",position:"relative"}}>
        {i===0?<div style={{position:"absolute",inset:"-4px 5px -4px",borderRadius:24,background:withAlpha(accent,.16),border:".8px solid #FFFFFFB0"}}/>:null}
        <span style={{position:"relative"}}>{icon}</span><div style={{position:"relative",fontSize:10,fontWeight:700}}>{["首页","课表","AI记","数据","我的"][i]}</div>
      </div>)}</div>
    </OpticalSurface>
  </div>;
}

/** New readable front-facing device, deliberately not the previous fan-out phones. */
export function ClosePhone({children,left=230,top=42,scale=1.13,rotate=0}: {
  children:React.ReactNode;left?:number;top?:number;scale?:number;rotate?:number;
}) {
  return <div style={{position:"absolute",left,top,width:414,height:868,scale,rotate:`${rotate}deg`,transformOrigin:"top left",
    borderRadius:61,background:"linear-gradient(125deg,#FCFCFF,#9CA1AF 21%,#F6F8FC 48%,#777D8A 76%,#DDE2EA)",padding:4,
    boxShadow:"0 30px 55px rgba(13,23,50,.16), inset 0 0 0 1px #FFFFFFC8",boxSizing:"border-box"}}>
    <div style={{position:"absolute",inset:5,borderRadius:57,background:"#141419"}} />
    <div style={{position:"absolute",left:12,top:12,width:390,height:844,borderRadius:49,overflow:"hidden"}}>{children}</div>
    <div style={{position:"absolute",left:146,top:21,width:122,height:29,borderRadius:18,background:"#060608"}} />
    <div style={{position:"absolute",left:249,top:30,width:8,height:8,borderRadius:4,background:"#13263D"}} />
    <div style={{position:"absolute",bottom:21,left:147,width:120,height:4,borderRadius:3,background:"#202735"}} />
  </div>;
}

export function DemoSwitch({value,accent="#655CE8",style}: {value:number;accent?:string;style?:CSSProperties}) {
  return <div style={{width:114,height:65,borderRadius:34,position:"relative",background:value>.5?accent:"#B5BBC4",...style}}>
    <div style={{position:"absolute",left:5+49*value,top:5,width:55,height:55,borderRadius:29,background:"white",boxShadow:"0 3px 7px #17263D26"}} />
  </div>;
}
