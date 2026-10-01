const {app,BrowserWindow,protocol,session,dialog}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {createApi}=require('./local-api.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'legenda',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
const smoke=process.argv.includes('--smoke-test');
if(smoke)app.setPath('userData',path.join(app.getPath('temp'),'legenda-smoke'));
app.whenReady().then(async()=>{
 await fs.mkdir(app.getPath('userData'),{recursive:true});
 const api=createApi(path.join(app.getPath('userData'),'records.json'));
 const ui=path.join(__dirname,'ui');
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.wav':'audio/wav'};
 const loaded=[];
 protocol.handle('legenda',async request=>{
  const url=new URL(request.url);
  if(url.host!=='game')return new Response('Forbidden',{status:403});
  if(url.pathname.startsWith('/api/'))return api(request);
  const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  const file=path.resolve(ui,'.'+relative);
  if(!file.startsWith(ui+path.sep))return new Response('Forbidden',{status:403});
  try{const bytes=await fs.readFile(file);loaded.push(relative);return new Response(bytes,{headers:{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}})}catch{return new Response('Not found',{status:404})}
 });
 session.defaultSession.setPermissionRequestHandler((_web,_permission,callback)=>callback(false));
 const win=new BrowserWindow({width:1200,height:920,minWidth:600,minHeight:650,show:false,fullscreen:true,backgroundColor:'#000000',autoHideMenuBar:true,title:'Nu Pogodi SPO LEGENDA',webPreferences:{preload:path.join(__dirname,'preload.cjs'),additionalArguments:smoke?['--legenda-smoke']:[],nodeIntegration:false,contextIsolation:true,sandbox:true,autoplayPolicy:'no-user-gesture-required'}});
 win.once('ready-to-show',()=>{if(!smoke)win.show()});
 let exitMenuOpen=false;
 async function exitMenu(){
  if(exitMenuOpen)return;exitMenuOpen=true;win.webContents.send('exit-menu-state',true);
  try{const result=await dialog.showMessageBox(win,{type:'question',title:'Меню игры',message:'Продолжить игру или выйти?',buttons:['Продолжить','Выйти из игры'],defaultId:0,cancelId:0,noLink:true});if(result.response===1)app.quit()}
  finally{exitMenuOpen=false;if(!win.isDestroyed())win.webContents.send('exit-menu-state',false)}
 }
 win.webContents.on('before-input-event',(event,input)=>{
  if(input.type==='keyDown'&&!input.isAutoRepeat&&input.key==='Escape'){event.preventDefault();void exitMenu();return}
  if(input.type==='keyDown'&&!input.isAutoRepeat&&(input.key==='F11'||(input.alt&&input.key==='Enter'))){event.preventDefault();win.setFullScreen(!win.isFullScreen())}
 });
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==new URL('legenda://game').origin)event.preventDefault()});
 if(smoke){
  const errors=[];let introAudioStarted=false;
  win.webContents.on('console-message',(event,oldLevel,oldMessage)=>{const level=event.level??oldLevel,message=event.message??oldMessage;if(level===3||level==='error')errors.push(message);if(message==='LEGENDA intro audio started')introAudioStarted=true});
  win.webContents.on('did-finish-load',()=>setTimeout(async()=>{await fs.writeFile(path.join(app.getPath('temp'),'legenda-smoke-result.json'),JSON.stringify({loaded,errors,introAudioStarted,fullscreen:win.isFullScreen()}));app.exit(errors.length||!introAudioStarted?1:0)},8500));
 }
 await win.loadURL('legenda://game/index.html');
});
app.on('window-all-closed',()=>app.quit());
