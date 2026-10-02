"use client";
import {useEffect,useRef,useState} from 'react';
import './arcade-intro.css';
declare global { interface Window { legendaDesktop?:{smokeTest:boolean;quit:()=>void} } }
export default function ArcadeIntro({offline,onDone}:{offline:boolean;onDone:(context:AudioContext|null)=>void}){
 const [revealed,setRevealed]=useState(false),[waiting,setWaiting]=useState(false),[failed,setFailed]=useState(false);
 const done=useRef(onDone);done.current=onDone;
 const playRef=useRef<()=>void>(()=>{}),finishRef=useRef<()=>void>(()=>{});
 useEffect(()=>{
  let context:AudioContext|null=null,source:AudioBufferSourceNode|null=null,disposed=false,transferred=false,started=false,booted=false;
  const timers:ReturnType<typeof setTimeout>[]=[];
  const later=(fn:()=>void,ms:number)=>timers.push(setTimeout(fn,ms));
  const finish=()=>{if(disposed||transferred)return;transferred=true;source?.stop();done.current(context)};
  finishRef.current=finish;
  const boot=()=>{
   if(booted||(document.hidden&&!window.legendaDesktop?.smokeTest))return;booted=true;
   try{context=new AudioContext()}catch{setFailed(true);later(()=>setRevealed(true),2000);later(finish,6000);return}
   const audio=context;
   const buffer=fetch('/legenda-intro.wav').then(r=>{if(!r.ok)throw Error('Intro unavailable');return r.arrayBuffer()}).then(data=>audio.decodeAudioData(data)).catch(()=>{if(!disposed)setFailed(true);return null});
   const play=()=>{
    if(started||disposed)return;
    const resumed=audio.resume().catch(()=>{if(!disposed)setWaiting(true)});
    later(()=>{if(!disposed&&!started&&audio.state!=='running')setWaiting(true)},150);
    void Promise.all([buffer,resumed]).then(([decoded])=>{
     if(disposed||started)return;
     if(!decoded){setFailed(true);later(finish,2500);return}
     if(audio.state!=='running'){setWaiting(true);return}
     started=true;setWaiting(false);source=audio.createBufferSource();source.buffer=decoded;
     const gain=audio.createGain();gain.gain.value=.95;source.connect(gain);gain.connect(audio.destination);source.start();
     console.info('LEGENDA intro audio started');later(finish,(decoded.duration+.9)*1000);
    });
   };
   playRef.current=play;
   later(()=>setRevealed(true),2000);later(play,2850);
  };
  boot();document.addEventListener('visibilitychange',boot);
  const key=(event:KeyboardEvent)=>{if(event.code==='Enter'||event.code==='Space'){if((event.target as HTMLElement).closest('button'))return;event.preventDefault();finish()}};
  window.addEventListener('keydown',key);
  return()=>{disposed=true;timers.forEach(clearTimeout);source?.stop();if(!transferred)void context?.close();document.removeEventListener('visibilitychange',boot);window.removeEventListener('keydown',key)};
 },[]);
 return !revealed?<section className="console-black" aria-label="Запуск игры"/>:<section className="console-intro" aria-label="Заставка LEGENDA">
  <div className="intro-center"><div className="intro-brand" aria-label="LEGENDA">LEGENDA</div><p className="intro-caption">SPO LEGENDA PRESENTS</p></div>
  {(waiting||failed)&&<p className="intro-status" role="status">{failed?'Звук недоступен. Можно продолжить игру.':'Нажми, чтобы услышать заставку'}</p>}
  <div className="intro-actions">{waiting&&!failed&&<button className="intro-skip intro-sound" onClick={()=>playRef.current()}>▶ СО ЗВУКОМ</button>}<button className="intro-skip" onClick={()=>finishRef.current()}>ПРОПУСТИТЬ</button></div>
  <span className="intro-hint">{offline?'F11 — ПОЛНЫЙ ЭКРАН · ':''}ENTER — ПРОПУСТИТЬ</span>
 </section>;
}
