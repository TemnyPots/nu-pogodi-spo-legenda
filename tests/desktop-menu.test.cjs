const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
(async()=>{
const sent=[],events={};let quit=false,response=0,dialogs=0,fullscreen=true;
const app={whenReady:()=>Promise.resolve(),getPath:()=>'.',on(){},quit(){quit=true}};
class Window{constructor(){this.webContents={send:(...args)=>sent.push(args),on:(event,fn)=>{events[event]=fn},setWindowOpenHandler(){}}}once(){}isDestroyed(){return false}isFullScreen(){return fullscreen}setFullScreen(value){fullscreen=value}async loadURL(){}}
const electron={app,BrowserWindow:Window,protocol:{registerSchemesAsPrivileged(){},handle(){}},session:{defaultSession:{setPermissionRequestHandler(){}}},dialog:{async showMessageBox(_window,options){dialogs++;assert.deepEqual(Array.from(options.buttons),['Продолжить','Выйти из игры']);return{response}}}};
vm.runInNewContext(fs.readFileSync('desktop/main.cjs','utf8'),{require:(id)=>id==='electron'?electron:id==='node:fs/promises'?{mkdir:async()=>{}}:id==='./local-api.cjs'?{createApi:()=>()=>{}}:require(id),__dirname:path.resolve('desktop'),process:{argv:[]},console,setTimeout});
await new Promise(setImmediate);
let prevented=0;const event={preventDefault(){prevented++}};
events['before-input-event'](event,{type:'keyDown',key:'Escape'});await new Promise(setImmediate);
assert.equal(prevented,1);assert.equal(dialogs,1);assert.equal(quit,false);assert.deepEqual(sent,[['exit-menu-state',true],['exit-menu-state',false]]);
response=1;events['before-input-event'](event,{type:'keyDown',key:'Escape'});await new Promise(setImmediate);assert.equal(quit,true);
events['before-input-event'](event,{type:'keyDown',key:'F11'});assert.equal(fullscreen,false);
console.log('PASS: Escape opens menu, pauses/resumes, exit quits, F11 toggles fullscreen');
})();
