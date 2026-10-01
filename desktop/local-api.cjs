const fs=require('node:fs');
const crypto=require('node:crypto');
const {replay}=require('./engine.cjs');
function createApi(filename){
 const runs=new Map();
 const read=()=>{try{return JSON.parse(fs.readFileSync(filename,'utf8'))}catch(e){if(e.code==='ENOENT')return [];throw e}};
 return async function api(request){
  const pathname=new URL(request.url).pathname;
  try{
   if(pathname==='/api/leaderboard')return Response.json({rows:read().slice(0,10)});
   if(pathname!=='/api/runs'||request.method!=='POST')return new Response('Not found',{status:404});
   const input=await request.json();
   if(input.action==='start'){
    const nickname=typeof input.nickname==='string'?input.nickname.trim():'';
    if(!nickname||nickname.length>20||/[\x00-\x1f<>]/.test(nickname))return Response.json({error:'Введите ник: от 1 до 20 символов.'},{status:400});
    const id=crypto.randomUUID(),seed=crypto.randomBytes(4).readUInt32LE()||1;
    runs.clear();runs.set(id,{nickname,seed,saved:false});return Response.json({id,seed});
   }
   const run=runs.get(input.id);
   if(!run||input.action!=='finish')return Response.json({error:'Смена не найдена.'},{status:404});
   if(run.saved)return Response.json({saved:true});
   if(!Number.isFinite(input.duration)||input.duration<0||input.duration>1800000||!Array.isArray(input.moves)||input.moves.length>18000)throw Error('Invalid replay');
   let last=-1;for(const m of input.moves){if(!Number.isFinite(m.t)||m.t<last||m.t<0||m.t>input.duration||!Number.isInteger(m.lane)||m.lane<0||m.lane>3)throw Error('Invalid move');last=m.t}
   const result=replay(run.seed,input.duration,input.moves);
   if(!result.over&&input.duration<1799000)return Response.json({error:'Смена ещё не завершена.'},{status:400});
   const rows=read(),old=rows.find(r=>r.nickname===run.nickname);
   if(old)old.score=Math.max(old.score,result.score);else rows.push({nickname:run.nickname,score:result.score});
   rows.sort((a,b)=>b.score-a.score||a.nickname.localeCompare(b.nickname));
   fs.writeFileSync(filename+'.tmp',JSON.stringify(rows.slice(0,1000)));fs.renameSync(filename+'.tmp',filename);run.saved=true;
   return Response.json({saved:true,score:result.score});
  }catch{return Response.json({error:'Не удалось сохранить рекорд на компьютере.'},{status:503})}
 };
}
module.exports={createApi};
