import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../lib/game-engine.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {Engine,replay,speedForScore}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
for(const [score,speed] of [[0,1],[99,1],[100,1.1],[124,1.1],[125,1.2],[149,1.2],[150,1.3],[200,1.5],[350,2.1]])assert.equal(speedForScore(score),speed);
const slow=new Engine(10),fast=new Engine(10);fast.score=125;slow.advance(700);fast.advance(700);
assert.equal(slow.bricks[0].arrival-700,3600);assert.equal(fast.bricks[0].arrival-700,3000);
assert.ok(fast.next<slow.next);
for(const seed of [1,42,123456]){
 const e=new Engine(seed);
 for(let t=0;t<600000&&e.score<260;t+=10){
  const next=e.bricks.find(b=>b.state==='falling'&&b.arrival-145<=t);
  if(next)e.move(next.lane,t);else e.advance(t);
 }
 assert.equal(e.score,260);assert.equal(e.lives,3);
 assert.equal(e.speed,1.7);
 assert.ok(e.bricks.filter(b=>b.kind==='blue').length>40);
 for(const brick of e.bricks)assert.equal(brick.kind,brick.id%6===0?'blue':'red');
 const checked=replay(seed,e.t,e.moves);assert.equal(checked.score,e.score);assert.equal(checked.lives,e.lives);
 assert.deepEqual(checked.bricks,e.bricks);
}
console.log('PASS: speed boundaries, spawn cadence, 5 red + 1 blue, replay parity through 260 catches (3 seeds)');
