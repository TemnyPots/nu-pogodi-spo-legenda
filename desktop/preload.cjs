const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('legendaDesktop',{
 smokeTest:process.argv.includes('--legenda-smoke'),
 onExitMenu(callback){const listener=(_event,open)=>callback(Boolean(open));ipcRenderer.on('exit-menu-state',listener);return()=>ipcRenderer.removeListener('exit-menu-state',listener)}
});
