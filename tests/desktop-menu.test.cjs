const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
(async()=>{
const events={},ipc={};let quit=false,fullscreen=true,web;
const app={whenReady:()=>Promise.resolve(),getPath:()=>'.',on(){},quit(){quit=true}};
class Window{constructor(){web=this.webContents={mainFrame:{url:'legenda://game/index.html'},on:(event,fn)=>{events[event]=fn},setWindowOpenHandler(){}}}once(){}isFullScreen(){return fullscreen}setFullScreen(value){fullscreen=value}async loadURL(){}}
const electron={app,BrowserWindow:Window,ipcMain:{on:(event,fn)=>{ipc[event]=fn}},protocol:{registerSchemesAsPrivileged(){},handle(){}},session:{defaultSession:{setPermissionRequestHandler(){}}}};
vm.runInNewContext(fs.readFileSync('desktop/main.cjs','utf8'),{require:(id)=>id==='electron'?electron:id==='node:fs/promises'?{mkdir:async()=>{}}:id==='./local-api.cjs'?{createApi:()=>()=>{}}:require(id),__dirname:path.resolve('desktop'),process:{argv:[]},console,setTimeout,URL});
await new Promise(setImmediate);
let prevented=0;const event={preventDefault(){prevented++}};
events['before-input-event'](event,{type:'keyDown',key:'Escape'});assert.equal(prevented,0);assert.equal(quit,false);
events['before-input-event'](event,{type:'keyDown',key:'F11'});assert.equal(fullscreen,false);
ipc['quit-game']({sender:{},senderFrame:web.mainFrame});assert.equal(quit,false);
ipc['quit-game']({sender:web,senderFrame:{url:'legenda://game/index.html'}});assert.equal(quit,false);
web.mainFrame.url='https://example.com';ipc['quit-game']({sender:web,senderFrame:web.mainFrame});assert.equal(quit,false);
web.mainFrame.url='legenda://game/index.html';ipc['quit-game']({sender:web,senderFrame:web.mainFrame});assert.equal(quit,true);
console.log('PASS: Escape reaches game, F11 fullscreen, only trusted main frame can quit');
})();
