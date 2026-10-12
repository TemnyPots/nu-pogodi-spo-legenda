import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['lib/vk-mini-app.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {startVk,vkAppId,profileFromVk,bounded}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function mock(fail=false){const calls=[],listeners=new Set();return{calls,listeners,send:async(method)=>{calls.push(method);if(method==='VKWebAppInit'&&fail)throw Error('not VK');if(method==='VKWebAppGetUserInfo')return{first_name:'Анна',last_name:'Легенда',photo_200:'https://example.com/photo.png'};if(method==='VKWebAppGetConfig')return{insets:{top:24,bottom:12,left:0,right:0}};return{result:true}},supportsAsync:async()=>true,subscribe:fn=>listeners.add(fn),unsubscribe:fn=>listeners.delete(fn)}}
const states=[],hidden=[],insets=[];const handlers={state:s=>states.push(s),hidden:v=>hidden.push(v),insets:v=>insets.push(v)};
const standalone=mock();const a=startVk(standalone,'',handlers);await tick();assert.equal(standalone.calls.length,0);a.dispose();
const bridge=mock();const b=startVk(bridge,'?vk_app_id=12345678&vk_platform=mobile_android',handlers);await tick();await tick();assert.equal(bridge.calls[0],'VKWebAppInit');assert.equal(states.at(-1).profile.nickname,'Анна Легенда');assert.equal(states.at(-1).canShare,true);assert.equal(insets[0].top,24);
for(const listener of bridge.listeners){listener({detail:{type:'VKWebAppViewHide',data:{}}});listener({detail:{type:'VKWebAppViewRestore',data:{}}})}assert.deepEqual(hidden,[true,false]);await b.share();assert.equal(bridge.calls.at(-1),'VKWebAppShare');b.dispose();assert.equal(bridge.listeners.size,0);
const broken=mock(true);const c=startVk(broken,'?vk_app_id=1234',handlers);await tick();assert.deepEqual(broken.calls,['VKWebAppInit']);assert.equal(states.at(-1).connected,false);c.dispose();
assert.equal(vkAppId('?vk_app_id=javascript:alert(1)'),null);assert.equal(profileFromVk({first_name:'<Имя>',photo_200:'javascript:alert(1)'}).photo,null);assert.equal(profileFromVk({first_name:'<Имя>'}).name,'Имя');await assert.rejects(bounded(new Promise(()=>{}),5),/timeout/);
console.log('PASS: standalone isolation, ordered VK init/profile, lifecycle, cleanup, failure, timeout, safe profile');
