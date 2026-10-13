import {AbsoluteFill,CanvasImage,Easing,interpolate,interpolateColors,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import {ClosePhone,DIY_COLORS,DIY_WALLPAPERS,DiyScheduleScreen,DiyHomeScreen,withAlpha} from "./DiyPrimitives";

const clamp={extrapolateLeft:"clamp",extrapolateRight:"clamp"} as const;
const fluid=Easing.bezier(.45,0,.2,1);
const colorTimes=[0,1.1,1.95,2.8,3.65,4.5,5.35,6.1];
const colorIds=[0,1,2,3,5,4,6,0];
const colorNames=["紫色","蓝色","浅绿","浅蓝","珊瑚","黑色","炫彩"];

/** One large phone, actual choices, clear results. Replaces the old three-phone fan. */
export const LaunchDiyRebuilt=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;
  // Hold each named color; blend only during the final 0.26s before the next choice.
  // A continuous interpolation across the whole chapter showed pink while “浅蓝” was selected.
  const currentChoice=colorTimes.reduce((latest,time,i)=>t>=time?i:latest,0);
  const nextChoice=Math.min(currentChoice+1,colorIds.length-1);
  const transition=nextChoice===currentChoice?0:interpolate(t,[colorTimes[nextChoice]-.26,colorTimes[nextChoice]],[0,1],{...clamp,easing:fluid});
  const accent=interpolateColors(transition,[0,1],[DIY_COLORS[colorIds[currentChoice]],DIY_COLORS[colorIds[nextChoice]]]);
  const selected=transition>.5?colorIds[nextChoice]:colorIds[currentChoice];
  const rainbow=t>=5.35&&t<6.1;
  const firstBlend=interpolate(t,[7,7.75],[0,1],{...clamp,easing:fluid});
  const secondBlend=interpolate(t,[9,9.75],[0,1],{...clamp,easing:fluid});
  const lastBlend=interpolate(t,[11.1,11.85],[0,1],{...clamp,easing:fluid});
  const wallpaper=t<9?0:t<11.1?1:2;
  const nextWallpaper=t<9?1:t<11.1?2:0;
  const blend=t<9?firstBlend:t<11.1?secondBlend:lastBlend;
  const photoOpacity=interpolate(t,[0,12.3,13.25,14.1],[.76,.76,.28,.8],{...clamp,easing:fluid});
  const step=t<6.4?0:t<12.1?1:2;
  const switchPage=interpolate(t,[6.04,6.48],[0,1],{...clamp,easing:fluid});
  const headline=step===0?<>主题色<br/>随你切换</>:step===1?<>喜欢的角色<br/>就是你的背景</>:<>自由 DIY<br/>由你定义</>;
  const enter=interpolate(t,[0,.8],[0,1],clamp);
  return <AbsoluteFill style={{background:"#F5F5F7",color:"#151820",fontFamily:"Campus",overflow:"hidden"}}>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 31% 46%,${withAlpha(accent,.1)} 0%,transparent 60%)`}}/>
    <ClosePhone left={176} top={40} scale={1.14} rotate={interpolate(t,[0,3,6,10,15],[-1.5,0,-.5,.4,0],{...clamp,easing:fluid})}>
      <div style={{position:"absolute",inset:0,translate:`${-390*switchPage}px 0`}}><DiyHomeScreen accent={accent} rainbow={rainbow}/></div>
      <div style={{position:"absolute",inset:0,translate:`${390*(1-switchPage)}px 0`}}><DiyScheduleScreen accent={accent} rainbow={rainbow} wallpaper={wallpaper} nextWallpaper={nextWallpaper} wallpaperBlend={blend} wallpaperOpacity={photoOpacity}/></div>
    </ClosePhone>
    <div style={{position:"absolute",left:858,top:116,width:900,fontSize:step===1?87:103,fontWeight:700,lineHeight:1.22,opacity:enter,
      translate:`0 ${interpolate(t,[0,.9],[27,0],{...clamp,easing:fluid})}px`}}>{headline}</div>
    <div style={{position:"absolute",left:863,top:420,display:"flex",gap:17}}>
      {colorIds.slice(0,7).map((i,j)=><div key={i} style={{width:86,textAlign:"center",opacity:step===0?1:.65}}>
        <div style={{width:72,height:72,borderRadius:40,padding:5,border:selected===i?`2px solid ${accent}`:"2px solid transparent",boxSizing:"border-box"}}>
          <div style={{width:"100%",height:"100%",borderRadius:36,background:i===6?"linear-gradient(135deg,#B46AE8,#56B7E6,#79CEA5)":DIY_COLORS[i],boxShadow:"inset 0 1px 3px #FFFFFF65",scale:selected===i?1.05:1}} />
        </div>
        <div style={{fontSize:19,fontWeight:700,marginTop:10,color:step===0&&selected===i?accent:"#686B76"}}>{colorNames[j]}</div>
      </div>)}
    </div>
    <div style={{position:"absolute",left:864,top:572,width:754,display:"flex",gap:22,opacity:interpolate(t,[5.9,6.45],[.15,1],clamp)}}>
      {DIY_WALLPAPERS.map((item,i)=>{
        const active=t<7.35?0:t<9.35?1:t<11.45?2:0;
        return <div key={item.file} style={{width:231,borderRadius:29,overflow:"hidden",border:active===i?`3px solid ${accent}`:"3px solid white",boxShadow:"0 10px 20px #28345712",scale:active===i?1.025:.98}}>
          <CanvasImage src={staticFile(item.file)} premountFor={fps} style={{width:231,height:192,objectFit:"cover",display:"block"}}/>
          <div style={{background:"white",padding:"15px 0",textAlign:"center",fontSize:23,fontWeight:700}}>{item.name}</div>
        </div>;
      })}
    </div>
    <div style={{position:"absolute",left:866,top:903,width:758,display:"flex",gap:26,alignItems:"center",opacity:interpolate(t,[11.8,12.3],[0,1],clamp)}}>
      <div style={{fontSize:26,fontWeight:700}}>背景可见度</div>
      <div style={{height:6,width:410,borderRadius:4,background:"#D5D7E0",position:"relative"}}>
        <div style={{width:`${photoOpacity/0.82*100}%`,height:6,borderRadius:4,background:accent}}/>
        <div style={{position:"absolute",left:photoOpacity/0.82*380,top:-12,width:30,height:30,borderRadius:16,background:"white",boxShadow:"0 2px 9px #2330543B"}}/>
      </div>
      <div style={{fontSize:23,color:"#626675",fontVariantNumeric:"tabular-nums"}}>{Math.round(photoOpacity*100)}%</div>
    </div>
  </AbsoluteFill>;
};
