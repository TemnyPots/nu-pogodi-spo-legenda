"use client";
import {useState,useRef,useEffect,useCallback} from "react";
import {Trophy,Volume2,VolumeX,Pause,Heart,ArrowUpLeft,ArrowUpRight,ArrowDownLeft,ArrowDownRight} from "lucide-react";
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from "@/components/ui/table";
import GameCanvas from "./game-canvas";
import {Engine} from "@/lib/game-engine";
import {ChipAudio} from "@/lib/chip-audio";
type Stage="menu"|"game"|"paused"|"over"|"leaderboard";
type Row={nickname:string;score:number};
export default function Home({offline=false,desktopPaused=false}:{offline?:boolean;desktopPaused?:boolean}){
 const [nick,setNick]=useState(""),[stage,setStage]=useState<Stage>("menu"),[muted,setMuted]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[rows,setRows]=useState<Row[]>([]),[saved,setSaved]=useState(false),[soundReady,setSoundReady]=useState(false),[,refresh]=useState(0);
 const audio=useRef<ChipAudio|null>(null),engine=useRef<Engine|null>(null),run=useRef(""),ended=useRef(false),activeStage=useRef(stage);activeStage.current=stage;
 const getAudio=()=>{if(!audio.current)audio.current=new ChipAudio();return audio.current};
 const unlock=async()=>{const a=getAudio();try{await a.unlock();setSoundReady(true)}catch{}return a};
 useEffect(()=>{try{setNick(localStorage.getItem("brick-nickname")??"");const off=offline?false:localStorage.getItem("brick-muted")==="true";setMuted(off);getAudio().enabled=!off;if(offline){void getAudio().unlock().then(()=>setSoundReady(true));localStorage.setItem("brick-muted","false")}}catch{}return()=>{audio.current?.stop();void audio.current?.ctx?.close()}},[]);
 useEffect(()=>{const a=getAudio();a.play(stage==="game"?"game":stage==="paused"?"paused":"menu")},[stage]);
 const resumeAfterDesktopMenu=useRef(false);
 useEffect(()=>{if(desktopPaused){resumeAfterDesktopMenu.current=activeStage.current==="game";if(resumeAfterDesktopMenu.current)setStage("paused")}else if(resumeAfterDesktopMenu.current){resumeAfterDesktopMenu.current=false;setStage("game")}},[desktopPaused]);
 const move=useCallback((lane:number)=>{const e=engine.current;if(activeStage.current!=="game"||!e)return;const score=e.score;e.move(lane,e.t);if(e.score>score)audio.current?.catch();refresh(v=>v+1)},[]);
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{if((event.target as HTMLElement).matches("input,textarea"))return;
   if(event.code==="Escape"||event.code==="Space"){if(activeStage.current==="game"||activeStage.current==="paused"){event.preventDefault();setStage(s=>s==="game"?"paused":"game")}return}
   const keys:Record<string,number>={KeyQ:0,KeyE:1,KeyA:2,KeyD:3,Numpad7:0,Numpad9:1,Numpad1:2,Numpad3:3};
   if(event.code in keys){event.preventDefault();move(keys[event.code])}
   const e=engine.current;if(e&&activeStage.current==="game"&&event.code.startsWith("Arrow")){event.preventDefault();move(event.code==="ArrowLeft"?e.lane-e.lane%2:event.code==="ArrowRight"?e.lane-e.lane%2+1:event.code==="ArrowUp"?e.lane%2:e.lane%2+2)}
  };
  const hide=()=>{if(document.hidden&&activeStage.current==="game")setStage("paused")};
  window.addEventListener("keydown",key);document.addEventListener("visibilitychange",hide);return()=>{window.removeEventListener("keydown",key);document.removeEventListener("visibilitychange",hide)};
 },[move]);
 const start=async()=>{
  if(!nick.trim()){setError("Введи никнейм, чтобы записать свой рекорд.");document.getElementById("nickname")?.focus();return}
  setBusy(true);setError("");await unlock();
  try{const response=await fetch("/api/runs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start",nickname:nick.trim()})});const result=await response.json() as {id:string;seed:number;error?:string;rows:Row[]};if(!response.ok)throw new Error(result.error);run.current=result.id;engine.current=new Engine(result.seed);ended.current=false;setSaved(false);try{localStorage.setItem("brick-nickname",nick.trim())}catch{}setStage("game")}
  catch(e){setError(e instanceof Error?e.message:"Не удалось начать смену. Попробуй ещё раз.")}
  finally{setBusy(false)}
 };
 const save=async()=>{
  const e=engine.current;if(!e)return;setBusy(true);setError("");
  try{const response=await fetch("/api/runs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"finish",id:run.current,duration:e.t,moves:e.moves})});const result=await response.json() as {id:string;seed:number;error?:string;rows:Row[]};if(!response.ok)throw new Error(result.error);setSaved(true)}
  catch(e){setError(e instanceof Error?e.message:"Не удалось сохранить результат.")}
  finally{setBusy(false)}
 };
 const end=()=>{if(ended.current)return;ended.current=true;setStage("over");void save()};
 const leaderboard=async()=>{setStage("leaderboard");setBusy(true);setError("");await unlock();try{const response=await fetch("/api/leaderboard");const result=await response.json() as {id:string;seed:number;error?:string;rows:Row[]};if(!response.ok)throw new Error(result.error);setRows(result.rows)}catch(e){setError(e instanceof Error?e.message:"Не удалось загрузить таблицу.")}finally{setBusy(false)}};
 const sound=async()=>{const a=await unlock();const next=soundReady?!muted:false;setMuted(next);a.enabled=!next;try{localStorage.setItem("brick-muted",String(next))}catch{}};
 useEffect(()=>{
  const context=(document as unknown as {modelContext?:{registerTool:(tool:unknown,options?:unknown)=>Promise<void>}}).modelContext;
  if(!context?.registerTool)return;const controller=new AbortController();
  try{void Promise.resolve(context.registerTool({name:"read_arcade_state",description:"Read the current arcade screen, score and lives.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:(input:unknown)=>{if(input&&Object.keys(input as object).length)throw new Error("No parameters expected");return{screen:activeStage.current,score:engine.current?.score??0,lives:engine.current?.lives??3}}},{signal:controller.signal})).catch(()=>{})}catch{}
  return()=>controller.abort();
 },[]);
 const e=engine.current;
 return <main className="arcade"><header className="masthead"><a className="brand" href="/" onClick={event=>{event.preventDefault();if(stage==="game")setStage("paused");else if(stage!=="paused")setStage("menu")}}><svg className="brand-emblem" viewBox="520 500 1550 1600" role="img" aria-label="Эмблема СПО Легенда"><defs><clipPath id="emblem-frame"><rect x="520" y="500" width="1550" height="1600"/></clipPath></defs><image href="/legenda-emblem.png" width="2560" height="2560" clipPath="url(#emblem-frame)"/></svg> ОТРЯДЫ СПБСО <small>ARCADE CLUB</small></a><span className="edition">ЭЛЕКТРОНИКА · 01</span><button className="sound" onClick={sound} aria-label={muted||!soundReady?"Включить звук":"Выключить звук"}>{muted||!soundReady?<VolumeX size={18}/>:<Volume2 size={18}/>} {muted||!soundReady?"ЗВУК ВЫКЛ":"ЗВУК ВКЛ"}</button></header>
 <section className="cabinet"><div className="cabinet-top"><span>НУ, КИРПИЧИ!</span><span>● 8-BIT EDITION</span></div>
 {stage==="menu"&&<div className="screen menu-screen"><form className="menu-copy" onSubmit={event=>{event.preventDefault();void start()}}><div className="eyebrow">СТАРАЯ ШКОЛА. НОВАЯ СТРОЙКА.</div><h1>НУ,<br/><em>КИРПИЧИ!</em></h1><p>Четыре желоба. Одна корзинка.<br/>Ни одного лишнего кирпича на земле.</p><label htmlFor="nickname">НИКНЕЙМ ИГРОКА</label><input id="nickname" placeholder="Как тебя зовут?" autoComplete="nickname" maxLength={20} value={nick} onFocus={()=>void unlock()} onChange={event=>setNick(event.target.value)}/><button className="primary" disabled={busy}>{busy?"ГОТОВИМ СМЕНУ…":"▶ НАЧАТЬ ИГРУ"}</button><button type="button" className="secondary" onClick={()=>void leaderboard()}><Trophy size={17}/> ТАБЛИЦА ЛИДЕРОВ</button>{error&&<p role="alert" className="notice">{error}</p>}</form><div className="menu-art"><div className="orbit"/><span className="art-caption">ТВОЁ ЛУЧШЕЕ ЛЕТО!</span><svg className="hero-wolf" viewBox="0 135 512 889" role="img" aria-label="Волк-строитель держит плетёную корзину двумя руками"><defs><clipPath id="menu-wolf-frame"><rect x="0" y="135" width="512" height="889"/></clipPath></defs><image href="/wolf-basket-poses.png" width="1536" height="1024" clipPath="url(#menu-wolf-frame)"/></svg><img className="hero-brick brick-a" src="/brick.webp" alt="Кирпич — значок стройотряда"/><img className="hero-brick brick-b" src="/brick-blue.png" alt=""/><span className="score-stamp">+1<br/><small>КИРПИЧ</small></span></div></div>}
 {(stage==="game"||stage==="paused"||stage==="over")&&e&&<div className="screen play-screen"><div className="hud"><div><small>ИГРОК</small><b className="player-name">{nick}</b></div><div className="hud-score"><small>КИРПИЧЕЙ ПОЙМАНО</small><strong>{String(e.score).padStart(4,"0")}</strong></div><div className="hud-right"><span className="hearts" aria-label={"Жизни: "+e.lives}>{[0,1,2].map(i=><Heart key={i} size={21} fill={i<e.lives?"currentColor":"none"} style={{opacity:i<e.lives?1:.25}}/>)}</span><button className="icon-button" aria-label="Пауза" disabled={stage!=="game"} onClick={()=>setStage("paused")}><Pause size={21}/></button></div></div><GameCanvas engine={e} audio={getAudio()} paused={stage!=="game"} onUpdate={()=>refresh(v=>v+1)} onEnd={end}/><div className="game-level"><span>СКОРОСТЬ ×{e.speed.toFixed(1)}</span><span>+1 ЗА КИРПИЧ · 3 ПРОМАХА — КОНЕЦ СМЕНЫ</span></div><div className="game-controls">{[ArrowUpLeft,ArrowUpRight,ArrowDownLeft,ArrowDownRight].map((Icon,lane)=><button key={lane} className={e.lane===lane?"lane-button active":"lane-button"} aria-label={["Слева сверху","Справа сверху","Слева на уровне рук","Справа на уровне рук"][lane]} aria-pressed={e.lane===lane} disabled={stage!=="game"} onPointerDown={event=>{event.preventDefault();move(lane)}} onClick={event=>{if(event.detail===0)move(lane)}}><Icon size={21}/><kbd>{["Q","E","A","D"][lane]}</kbd><span>{lane<2?"ВЫШЕ":"НИЖЕ"}</span></button>)}</div>
 {stage==="paused"&&<div className="game-overlay"><div className="result-box"><span className="eyebrow">КИРПИЧИ ПОДОЖДУТ</span><h2>ПЕРЕДЫШКА</h2><p>Смена на паузе. Все кирпичи на месте.</p><button autoFocus className="primary" onClick={()=>{void unlock();setStage("game")}}>ПРОДОЛЖИТЬ</button><button className="secondary" onClick={()=>{setError("");setStage("menu")}}>ЗАВЕРШИТЬ БЕЗ РЕКОРДА</button></div></div>}
 {stage==="over"&&<div className="game-overlay"><div className="result-box"><span className="eyebrow">СМЕНА ЗАВЕРШЕНА</span><h2>НЕПЛОХАЯ<br/>РАБОТА!</h2><div className="result-score">{e.score}<small>КИРПИЧЕЙ ПОЙМАНО</small></div><p role="status">{busy?"Записываем результат…":saved?"Результат в таблице. Ещё одну смену?":"Результат пока не сохранён."}</p>{error&&<p role="alert" className="notice">{error}</p>}{!saved&&!busy&&<button className="secondary" onClick={()=>void save()}>ПОВТОРИТЬ СОХРАНЕНИЕ</button>}<button autoFocus className="primary" disabled={busy} onClick={()=>void start()}>ЕЩЁ СМЕНУ</button><button className="secondary" disabled={busy} onClick={()=>void leaderboard()}><Trophy size={16}/> ТАБЛИЦА ЛИДЕРОВ</button><button className="text-button" disabled={busy} onClick={()=>{setError("");setStage("menu")}}>В ГЛАВНОЕ МЕНЮ</button></div></div>}
 </div>}
 {stage==="leaderboard"&&<div className="screen leaderboard"><div className="eyebrow">ДОСКА ПОЧЁТА</div><h2>ЛУЧШИЕ<br/><em>ЛОВЦЫ</em></h2><p>{offline?"Рекорды на этом компьютере. Один ник — лучший результат.":"Десятка лучших. Один ник — лучший результат."}</p>{busy?<p role="status">Загружаем рекорды…</p>:error?<div><p role="alert" className="notice">{error}</p><button className="secondary" onClick={()=>void leaderboard()}>ОБНОВИТЬ</button></div>:rows.length?<Table><TableHeader><TableRow><TableHead>МЕСТО</TableHead><TableHead>ИГРОК</TableHead><TableHead className="score-cell">КИРПИЧИ</TableHead></TableRow></TableHeader><TableBody>{rows.map((row,i)=><TableRow key={row.nickname} className={i===0?"champion":""}><TableCell>{String(i+1).padStart(2,"0")}</TableCell><TableCell>{row.nickname}</TableCell><TableCell className="score-cell">{row.score}</TableCell></TableRow>)}</TableBody></Table>:<div className="empty-scores"><Trophy size={36}/><h3>Первый рекорд за тобой</h3><p>Пока ни одной завершённой смены.</p></div>}<button className="primary" onClick={()=>{setError("");setStage("menu")}}>В ГЛАВНОЕ МЕНЮ</button></div>}
 <div className="cabinet-bottom"><span>▪ {stage==="game"?"СМЕНА ИДЁТ":stage==="paused"?"ПАУЗА":"ГОТОВ К СМЕНЕ"}</span><span>ЛОВИ РИТМ. ЛОВИ КИРПИЧ.</span></div></section>
 <footer className="instructions"><div><span className="control-keys"><kbd>Q</kbd><kbd>E</kbd><kbd>A</kbd><kbd>D</kbd></span><span><b>ЧЕТЫРЕ ПОЗИЦИИ</b><small>Q / E — выше · A / D — на уровне рук</small></span></div><div><kbd>ESC</kbd><span><b>ПЕРЕДЫШКА</b><small>Пауза в любой момент</small></span></div><div><span className="touch-icon">✥</span><span><b>ИГРАЙ ГДЕ УДОБНО</b><small>Клавиатура или кнопки на экране</small></span></div></footer></main>;
}




