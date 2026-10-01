export type Move={t:number;lane:number};
export type Brick={id:number;kind:"red"|"blue";lane:number;arrival:number;spawn:number;state:"falling"|"caught"|"missed";resolved?:number};
export const WINDOW=145;
export function speedForScore(score:number){return score<100?1:(11+Math.floor((score-100)/25))/10}
export function random(seed:number){let s=seed>>>0;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
export class Engine{
 t=0; lane=2; score=0; lives=3; over=false; endedAt=0; bricks:Brick[]=[]; moves:Move[]=[]; next=700; rng:()=>number; id=0;
 constructor(seed:number){this.rng=random(seed)}
 get speed(){return speedForScore(this.score)}
 advance(t:number){
  if(this.over)return;this.t=Math.max(this.t,t);
  while(this.next<=this.t){const speed=this.speed,id=++this.id;this.bricks.push({id,kind:id%6===0?"blue":"red",lane:Math.floor(this.rng()*4),spawn:this.next,arrival:this.next+3600/speed,state:"falling"});this.next+=(1450+this.rng()*180)/speed}
  const pending=this.bricks.filter(b=>b.state==="falling").sort((a,b)=>a.arrival-b.arrival);
  for(const b of pending){
   if(this.lane===b.lane&&this.t>=b.arrival-WINDOW&&this.t<=b.arrival+WINDOW){b.state="caught";b.resolved=this.t;this.score++}
   else if(this.t>b.arrival+WINDOW){b.state="missed";b.resolved=this.t;this.lives--;if(!this.lives){this.over=true;this.endedAt=b.arrival+WINDOW;break}}
  }
 }
 move(lane:number,t:number){this.advance(t);if(this.over)return;if(lane!==this.lane){this.lane=lane;this.moves.push({t:this.t,lane});this.advance(t)}}
}
export function replay(seed:number,duration:number,moves:Move[]){
 const e=new Engine(seed);let i=0;
 // Same clock resolution as the live engine; include every input at its exact timestamp.
 for(let t=0;t<=duration+10&&!e.over;t+=10){while(i<moves.length&&moves[i].t<=t){e.move(moves[i].lane,moves[i].t);i++}e.advance(Math.min(t,duration))}
 return e;
}
