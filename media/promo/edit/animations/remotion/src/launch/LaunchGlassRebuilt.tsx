import {AbsoluteFill,CanvasImage,Easing,interpolate,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import {ClosePhone,DemoSwitch,DiyScheduleScreen,DIY_WALLPAPERS} from "./DiyPrimitives";

const clamp={extrapolateLeft:"clamp",extrapolateRight:"clamp"} as const;
const fluid=Easing.bezier(.45,0,.2,1);

/** Entirely new close-up material demo. No floating plates from the rejected shot. */
export const LaunchGlassRebuilt=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  const clarity=interpolate(t,[1.15,3.65],[0,1],{...clamp,easing:fluid});
  const enabled=interpolate(t,[0,5.0,5.7,6.55,7.25,9],[1,1,0,0,1,1],{...clamp,easing:fluid});
  const phase=t<1.3?"磨砂材质":t<4.9?"透亮玻璃":t<6.75?"经典原生":"随时开启";
  const title=interpolate(t,[0,.6],[0,1],clamp);
  return <AbsoluteFill style={{background:"#F5F5F7",fontFamily:"Campus",overflow:"hidden",color:"#181B23"}}>
    <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 34% 48%,#E2EAF7 0%,transparent 68%)"}}/>
    <ClosePhone left={170+interpolate(t,[0,1.1],[30,0],{...clamp,easing:fluid})} top={45} scale={1.13}
      rotate={interpolate(t,[0,3.8,9],[-2.3,0,-.6],{...clamp,easing:fluid})}>
      <DiyScheduleScreen clarity={clarity} enabled={enabled}/>
    </ClosePhone>
    <div style={{position:"absolute",left:845,top:115,opacity:title,translate:`0 ${interpolate(t,[0,.7],[25,0],{...clamp,easing:fluid})}px`}}>
      <div style={{fontSize:109,fontWeight:700,lineHeight:1.21}}>液态玻璃<br/>全面覆盖</div>
    </div>
    <div style={{position:"absolute",left:851,top:405,width:880,height:304,borderRadius:47,overflow:"hidden",boxShadow:"0 18px 34px #1B355C14"}}>
      <CanvasImage src={staticFile(DIY_WALLPAPERS[0].file)} premountFor={fps} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      <div style={{position:"absolute",left:87,top:33,width:605,height:234,borderRadius:45,overflow:"hidden",background:"white",
        boxShadow:`inset 0 2px 8px #FFFFFF, 0 8px 15px rgba(25,40,80,${.035+.05*enabled})`}}>
        <CanvasImage src={staticFile(DIY_WALLPAPERS[0].file)} premountFor={fps}
          style={{position:"absolute",left:-87,top:-33,width:880,height:304,objectFit:"cover",filter:`blur(${19*(1-clarity)+.8}px)`,scale:1+.026*clarity,opacity:enabled}}/>
        <div style={{position:"absolute",inset:0,background:"#ECEFFF",opacity:(1-enabled)*.98+enabled*(.94-.76*clarity)}}/>
        <div style={{position:"absolute",inset:0,borderRadius:45,border:"1.6px solid #FFFFFFD9",boxShadow:`inset 0 3px 8px #FFFFFFDD,inset 0 -2px 5px rgba(30,60,100,${enabled*.15})`}}/>
        <div style={{position:"relative",padding:"34px 41px",color:"#161A2C"}}>
          <div style={{fontSize:42,fontWeight:700}}>下一节课</div>
          <div style={{fontSize:27,fontWeight:700,marginTop:12}}>数据结构 · 14:00</div>
          <div style={{fontSize:20,marginTop:11,color:"#343D52"}}>信息楼 310 · 王老师</div>
        </div>
      </div>
    </div>
    <div style={{position:"absolute",left:859,top:746,width:870,display:"flex",alignItems:"center",gap:40}}>
      <div style={{fontSize:34,fontWeight:700,minWidth:190}}>{phase}</div>
      <div style={{height:5,width:360,borderRadius:5,background:"#CDD3E0",position:"relative"}}>
        <div style={{width:`${clarity*100}%`,height:5,borderRadius:5,background:"#655CE8"}}/>
        <div style={{position:"absolute",left:clarity*334,top:-10,width:26,height:26,borderRadius:14,background:"white",boxShadow:"0 2px 8px #27345C40"}}/>
      </div>
    </div>
    <div style={{position:"absolute",left:861,top:872,width:750,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{fontSize:43,fontWeight:700}}>想开就开 想关就关</div>
      <DemoSwitch value={enabled}/>
    </div>
  </AbsoluteFill>;
};
