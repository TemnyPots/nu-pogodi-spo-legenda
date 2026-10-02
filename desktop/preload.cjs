const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('legendaDesktop',{smokeTest:process.argv.includes('--legenda-smoke'),quit:()=>ipcRenderer.send('quit-game')});
