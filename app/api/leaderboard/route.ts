import {database} from "@/db";
export async function GET(){
 try{
 const result=await database().prepare("SELECT nickname, MAX(score) AS score FROM runs WHERE finished IS NOT NULL GROUP BY nickname ORDER BY score DESC, MIN(finished) ASC LIMIT 10").all();
 return Response.json({rows:result.results},{headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Leaderboard error",error);return Response.json({error:"Таблица временно недоступна. Попробуйте обновить."},{status:503})}
}
