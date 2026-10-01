import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';
import './intro.css';
import introSound from './assets/legenda-intro.wav';
function Desktop(){
 const [intro,setIntro]=useState(true);
 const [revealed,setRevealed]=useState(false);
 const [muted]=useState(()=>localStorage.getItem('brick-muted')==='true');
 useEffect(()=>{
  if(!intro)return;
  const audio=new Audio(introSound);audio.volume=.95;audio.muted=muted;
  const reveal=setTimeout(()=>setRevealed(true),2000);
  const start=setTimeout(()=>{void audio.play().catch(()=>{})},2850);
  const end=setTimeout(()=>setIntro(false),7000);
  const skip=(event:KeyboardEvent)=>{if(['Enter',' ','Escape'].includes(event.key)){event.preventDefault();setIntro(false)}};
  window.addEventListener('keydown',skip);
  return()=>{clearTimeout(reveal);clearTimeout(start);clearTimeout(end);audio.pause();audio.src='';window.removeEventListener('keydown',skip)};
 },[intro,muted]);
 return intro&&!revealed?<section className="console-black" aria-label="Запуск игры"/>:intro?<section className="console-intro" aria-label="Заставка LEGENDA">
  <div className="intro-center"><div className="intro-brand" aria-label="LEGENDA">LEGENDA</div><p className="intro-caption">SPO LEGENDA PRESENTS</p></div>
  <button className="intro-skip" onClick={()=>setIntro(false)}>ENTER / ПРОПУСТИТЬ</button>
  <span className="intro-hint">F11 — ПОЛНЫЙ ЭКРАН · ALT + F4 — ВЫХОД</span>
 </section>:<><div className="desktop-hint">F11 / ALT + ENTER — ПОЛНЫЙ ЭКРАН · ALT + F4 — ВЫХОД</div><Home offline/></>;
}
createRoot(document.getElementById('root')!).render(<Desktop/>);
