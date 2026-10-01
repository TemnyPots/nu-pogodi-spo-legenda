import {database} from "@/db";
import {replay, type Move} from "@/lib/game-engine";
export async function POST(request:Request){
 try{
  const input=await request.json() as {action?:string;nickname?:string;id?:string;duration?:number;moves?:Move[]};const db=database();
  if(input.action==="start"){
   const nickname=typeof input.nickname==="string"?input.nickname.trim():"";
   if(nickname.length<1||nickname.length>20||/[\x00-\x1f<>]/.test(nickname))return Response.json({error:"Введите ник: от 1 до 20 символов."},{status:400});
   const id=crypto.randomUUID(),seed=crypto.getRandomValues(new Uint32Array(1))[0]||1;
   await db.prepare("INSERT INTO runs(id,nickname,seed,started) VALUES(?,?,?,?)").bind(id,nickname,seed,Date.now()).run();
   return Response.json({id,seed});
  }
  if(input.action!=="finish"||typeof input.id!=="string")return Response.json({error:"Неизвестная команда."},{status:400});
  const run=await db.prepare("SELECT * FROM runs WHERE id=?").bind(input.id).first<{id:string;nickname:string;seed:number;started:number;finished:number|null;score:number}>();
  if(!run)return Response.json({error:"Смена не найдена."},{status:404});
  if(run.finished)return Response.json({score:run.score,saved:true});
  const duration=input.duration,moves=input.moves;
  if(typeof duration!=="number"||!Number.isFinite(duration)||duration<0||duration>1800000||duration>Date.now()-run.started+1500||!Array.isArray(moves)||moves.length>18000)return Response.json({error:"Не удалось проверить результат."},{status:400});
  let last=-1;for(const m of moves){if(!Number.isFinite(m.t)||m.t<last||m.t<0||m.t>duration||!Number.isInteger(m.lane)||m.lane<0||m.lane>3)return Response.json({error:"Некорректная запись игры."},{status:400});last=m.t}
  const result=replay(run.seed,duration,moves as Move[]);
  if(!result.over&&duration<1799000)return Response.json({error:"Смена ещё не завершена."},{status:400});
  await db.prepare("UPDATE runs SET score=?,duration=?,finished=? WHERE id=? AND finished IS NULL").bind(result.score,Math.round(duration),Date.now(),run.id).run();
  return Response.json({score:result.score,saved:true});
 }catch(error){console.error("Run error",error);return Response.json({error:"Не удалось связаться с таблицей рекордов. Попробуйте ещё раз."},{status:503})}
}

