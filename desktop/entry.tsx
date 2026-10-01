import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';
import './intro.css';
import introSound from './assets/legenda-intro.wav';
declare global { interface Window { legendaDesktop?:{smokeTest:boolean;onExitMenu:(callback:(open:boolean)=>void)=>()=>void} } }
function Desktop(){
 const [intro,setIntro]=useState(true);
 const [revealed,setRevealed]=useState(false);
 const [visible,setVisible]=useState(!document.hidden||Boolean(window.legendaDesktop?.smokeTest));
 const [exitOpen,setExitOpen]=useState(false);
 useEffect(()=>{const show=()=>{if(!document.hidden)setVisible(true)};document.addEventListener('visibilitychange',show);const off=window.legendaDesktop?.onExitMenu(setExitOpen);return()=>{document.removeEventListener('visibilitychange',show);off?.()}},[]);
 useEffect(()=>{
  if(!intro||!visible)return;
  const audio=new AudioContext();let source:AudioBufferSourceNode|null=null,disposed=false;
  const buffer=fetch(introSound).then(r=>{if(!r.ok)throw Error('Intro sound unavailable');return r.arrayBuffer()}).then(data=>audio.decodeAudioData(data));
  const play=async()=>{try{await audio.resume();const decoded=await buffer;if(disposed)return;source=audio.createBufferSource();source.buffer=decoded;const gain=audio.createGain();gain.gain.value=.95;source.connect(gain);gain.connect(audio.destination);source.start();console.info('LEGENDA intro audio started')}catch(error){console.error('LEGENDA intro audio failed',error)}};
  const reveal=setTimeout(()=>setRevealed(true),2000);
  const start=setTimeout(()=>{void play()},2850);
  const end=setTimeout(()=>setIntro(false),7000);
  const skip=(event:KeyboardEvent)=>{if(['Enter',' '].includes(event.key)){event.preventDefault();setIntro(false)}};
  window.addEventListener('keydown',skip);
  return()=>{clearTimeout(reveal);clearTimeout(start);clearTimeout(end);disposed=true;source?.stop();void audio.close();window.removeEventListener('keydown',skip)};
 },[intro,visible]);
 return intro&&!revealed?<section className="console-black" aria-label="Запуск игры"/>:intro?<section className="console-intro" aria-label="Заставка LEGENDA">
  <div className="intro-center"><div className="intro-brand" aria-label="LEGENDA">LEGENDA</div><p className="intro-caption">SPO LEGENDA PRESENTS</p></div>
  <button className="intro-skip" onClick={()=>setIntro(false)}>ENTER / ПРОПУСТИТЬ</button>
  <span className="intro-hint">F11 — ПОЛНЫЙ ЭКРАН · ESC — МЕНЮ ВЫХОДА</span>
 </section>:<><div className="desktop-hint">F11 / ALT + ENTER — ПОЛНЫЙ ЭКРАН · ESC — МЕНЮ ВЫХОДА</div><Home offline desktopPaused={exitOpen}/></>;
}
createRoot(document.getElementById('root')!).render(<Desktop/>);
