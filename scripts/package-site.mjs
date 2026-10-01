import {spawnSync} from "node:child_process";
import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
const archive=resolve(process.argv[2]??"work/brick-catcher-deploy.tar.gz");
for(const file of [".openai/hosting.json","drizzle/meta/_journal.json","dist/server/index.js","dist/client","dist/.openai/hosting.json"]){if(!existsSync(file))throw new Error("Missing publication input: "+file)}
const journal=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8"));
for(const entry of journal.entries){if(!existsSync("drizzle/"+entry.tag+".sql"))throw new Error("Missing migration "+entry.tag)}
// The publisher discovers D1 migrations at root drizzle/, not .openai/drizzle/.
const result=spawnSync("tar",["-czf",archive,".openai","drizzle","dist/server","dist/client","dist/.openai"],{stdio:"inherit"});
if(result.status!==0)process.exit(result.status??1);
console.log(JSON.stringify({archive,migrations:journal.entries.map(e=>e.tag)}));
