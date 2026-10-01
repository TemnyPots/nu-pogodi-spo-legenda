"use client";
import {useEffect,useRef} from "react";
import {Engine} from "@/lib/game-engine";
import {ChipAudio} from "@/lib/chip-audio";

type Motion={x:number;lift:number;facing:number;time:number};
const SPRITE_SCALE=320/1024;
const POSES=[{rimX:380,rimY:550},{rimX:380,rimY:380},{rimX:302,rimY:65}];
const TOP=222;
const basketY=(upper:boolean)=>TOP+POSES[upper?2:0].rimY*SPRITE_SCALE;

export function drawGame(c:CanvasRenderingContext2D,e:Engine,wolf:HTMLImageElement,brick:HTMLImageElement,blueBrick:HTMLImageElement,camp:HTMLImageElement,motion:Motion){
 const W=960,H=570;c.clearRect(0,0,W,H);c.fillStyle="#0a110e";c.fillRect(0,0,W,H);
 if(camp.complete&&camp.naturalWidth){c.drawImage(camp,0,0,W,H);c.fillStyle="#06130dcc";c.fillRect(0,0,W,H)}
 c.strokeStyle="#a8c57814";c.lineWidth=1;
 for(let x=0;x<W;x+=48){for(let y=78;y<535;y+=28)c.strokeRect(x+((y/28)%2?24:0),y,48,28)}
 c.strokeStyle="#53643b";c.lineWidth=3;c.beginPath();c.moveTo(50,510);c.lineTo(50,95);c.lineTo(255,95);c.moveTo(910,510);c.lineTo(910,95);c.lineTo(705,95);c.stroke();
 c.fillStyle="#273a25";for(const x of [38,898]){c.fillRect(x,100,24,420);c.fillStyle="#4b6132";for(let y=110;y<500;y+=38)c.fillRect(x+3,y,18,6);c.fillStyle="#273a25"}
 for(let lane=0;lane<4;lane++){
  const right=lane%2===1,upper=lane<2,sx=right?930:30,ex=right?685:275,sy=upper?110:265,ey=basketY(upper)-8;
  c.lineWidth=18;c.strokeStyle="#37432c";c.beginPath();c.moveTo(sx,sy);c.lineTo(ex,ey);c.stroke();
  c.lineWidth=3;c.strokeStyle="#a3ae6a";c.beginPath();c.moveTo(sx,sy-7);c.lineTo(ex,ey-7);c.stroke();
  for(let i=0;i<8;i++){const t=i/8,x=sx+(ex-sx)*t,y=sy+(ey-sy)*t;c.fillStyle="#71824a";c.fillRect(x-3,y-2,6,6)}
  c.fillStyle=e.lane===lane?"#d4fa78":"#60734f";c.font="bold 16px monospace";c.textAlign="center";c.fillText(["Q","E","A","D"][lane],right?880:80,sy-27);
 }
 // Every pose is a complete, anatomically connected drawing: two hands hold the rim.
 // Source frames have the same foot baseline; only arms and basket rise.
 const pose=Math.max(0,Math.min(2,Math.round(motion.lift*2))),anchor=POSES[pose];
 const caught=e.bricks.findLast(b=>b.state==="caught");
 const catchAge=caught?e.t-(caught.resolved??0):1000;
 const bounce=catchAge<230?Math.sin(catchAge/230*Math.PI)*3:0;
 const direction=motion.facing;
 const bodyX=motion.x+direction*(245-anchor.rimX)*SPRITE_SCALE;
 c.fillStyle="#0007";c.beginPath();c.ellipse(bodyX,537,58,6,0,0,Math.PI*2);c.fill();
 if(wolf.complete&&wolf.naturalWidth){
  const sw=wolf.naturalWidth/3,sh=wolf.naturalHeight;
  c.save();c.translate(motion.x,TOP+bounce);c.scale(direction,1);
  c.drawImage(wolf,pose*sw,0,sw,sh,-anchor.rimX*SPRITE_SCALE,0,512*SPRITE_SCALE,1024*SPRITE_SCALE);
  c.restore();
 }
 for(const b of e.bricks){
  if(b.state==="falling"){
   const p=Math.min(1.08,(e.t-b.spawn)/(b.arrival-b.spawn)),right=b.lane%2===1,upper=b.lane<2;
   const x=(right?930:30)+((right?658:302)-(right?930:30))*p;
   const startY=upper?92:247,y=startY+(basketY(upper)-startY-8)*p;
   c.save();c.translate(x,y);c.rotate((right?-1:1)*.22);const sprite=b.kind==="blue"?blueBrick:brick;if(sprite.complete&&sprite.naturalWidth)c.drawImage(sprite,-32,-16,64,32);c.restore();
  }else if(e.t-(b.resolved??0)<550){
   const x=b.lane%2===1?658:302,y=basketY(b.lane<2)-25-(e.t-(b.resolved??0))*.07;
   c.fillStyle=b.state==="caught"?"#d4fa78":"#ff8667";c.textAlign="center";c.font="bold 25px monospace";c.fillText(b.state==="caught"?"+1":"−1 ♥",x,y);
  }
 }
 c.fillStyle="#26331f";c.fillRect(0,544,W,26);c.fillStyle="#69834c";for(let x=0;x<W;x+=32)c.fillRect(x,544,18,4);
 c.textAlign="left";c.font="12px monospace";c.fillStyle="#748563";c.fillText("ОБЪЕКТ № 01 / КИРПИЧНЫЙ УЧАСТОК",25,566);
 c.textAlign="right";c.fillText("СТРОЙОТРЯД",935,566);
}
export default function GameCanvas({engine,audio,paused,onUpdate,onEnd}:{engine:Engine;audio:ChipAudio;paused:boolean;onUpdate:()=>void;onEnd:()=>void}){
 const ref=useRef<HTMLCanvasElement>(null);const callbacks=useRef({onUpdate,onEnd});callbacks.current={onUpdate,onEnd};
 const animation=useRef<Motion>({x:engine.lane%2?658:302,lift:engine.lane<2?1:0,facing:engine.lane%2?1:-1,time:0});
 useEffect(()=>{
  const canvas=ref.current!,c=canvas.getContext("2d")!;const wolf=new Image(),brick=new Image(),blueBrick=new Image(),camp=new Image();blueBrick.src="/brick-blue.png";camp.src="/camp-pixel.png";wolf.src="/wolf-basket-poses.png";brick.src="/brick.webp";let raf=0,last=0,acc=0,finished=false;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frame=(now:number)=>{if(!last)last=now;const dt=Math.min(now-last,100);last=now;
   if(!paused&&!engine.over){
    acc+=dt;while(acc>=10&&!engine.over){const score=engine.score,lives=engine.lives;engine.advance(engine.t+10);acc-=10;if(score!==engine.score){audio.catch();callbacks.current.onUpdate()}if(lives!==engine.lives){audio.miss();callbacks.current.onUpdate()}if(engine.t>=1800000){engine.over=true;engine.endedAt=engine.t}}
    const m=animation.current,targetLift=engine.lane<2?1:0,targetX=engine.lane%2?658:302;
    m.time+=dt;m.facing=engine.lane%2?1:-1;
    m.x=reduced?targetX:m.x+(targetX-m.x)*(1-Math.exp(-dt/45));
    const step=dt/220;m.lift=reduced?targetLift:m.lift+Math.sign(targetLift-m.lift)*Math.min(Math.abs(targetLift-m.lift),step);
   }
   drawGame(c,engine,wolf,brick,blueBrick,camp,animation.current);
   if(engine.over&&!finished){finished=true;callbacks.current.onEnd()}
   raf=requestAnimationFrame(frame);
  };raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);
 },[engine,audio,paused]);
 return <canvas ref={ref} width={960} height={570} className="game-canvas" aria-label="Волк держит корзину двумя руками и поднимает её над головой. Управление Q, E, A, D."/>;
}

