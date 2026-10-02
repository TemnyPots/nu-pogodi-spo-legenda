"use client";
import {useEffect,useRef,useState} from 'react';
import './arcade-intro.css';
declare global { interface Window { legendaDesktop?:{smokeTest:boolean;quit:()=>void} } }
export default function ArcadeIntro({onDone}:{offline:boolean;onDone:(context:AudioContext|null)=>void}){
 const [revealed,setRevealed]=useState(false);
 const done=useRef(onDone);done.current=onDone;
 useEffect(()=>{
  let context:AudioContext|null=null,source:AudioBufferSourceNode|null=null,disposed=false,transferred=false,started=false,booted=false,voiceDue=false;
  const timers:ReturnType<typeof setTimeout>[]=[];
  const later=(fn:()=>void,ms:number)=>timers.push(setTimeout(fn,ms));
  const finish=()=>{if(disposed||transferred)return;transferred=true;source?.stop();done.current(context)};
  let play=()=>{};
  const boot=()=>{
   if(booted||(document.hidden&&!window.legendaDesktop?.smokeTest))return;booted=true;
   later(()=>setRevealed(true),2000);later(finish,6500);
   try{context=new AudioContext()}catch{return}
   const audio=context;
   const buffer=fetch('/legenda-intro.wav').then(r=>{if(!r.ok)throw Error('Intro unavailable');return r.arrayBuffer()}).then(data=>audio.decodeAudioData(data)).catch(()=>null);
   play=()=>{
    if(started||disposed||transferred||!voiceDue)return;
    const resumed=audio.resume().catch(()=>{});
    void Promise.all([buffer,resumed]).then(([decoded])=>{
     if(disposed||transferred||started||!decoded||audio.state!=='running')return;
     started=true;source=audio.createBufferSource();source.buffer=decoded;
     const gain=audio.createGain();gain.gain.value=.95;source.connect(gain);gain.connect(audio.destination);source.start();
     console.info('LEGENDA intro audio started');
    });
   };
   later(()=>{voiceDue=true;play()},2850);
  };
  // A normal tap/key can unlock browser audio without interrupting the intro.
  const unlock=()=>{if(context)void context.resume().then(()=>play()).catch(()=>{})};
  boot();document.addEventListener('visibilitychange',boot);
  window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock);
  return()=>{disposed=true;timers.forEach(clearTimeout);source?.stop();if(!transferred)void context?.close();document.removeEventListener('visibilitychange',boot);window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock)};
 },[]);
 return !revealed?<section className="console-black" aria-label="Запуск игры"/>:<section className="console-intro" aria-label="Заставка LEGENDA"><div className="intro-center"><div className="intro-brand" aria-label="LEGENDA">LEGENDA</div><p className="intro-caption">SPO LEGENDA PRESENTS</p></div></section>;
}
