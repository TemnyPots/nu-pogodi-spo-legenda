"use client";
import {useEffect,useRef,useState} from 'react';
import {emptyVkState,startVk,vkAppId,type VkState} from '@/lib/vk-mini-app';
export function useVkMiniApp(offline:boolean){
 const [state,setState]=useState<VkState>(emptyVkState);
 const session=useRef<ReturnType<typeof startVk>|null>(null);
 useEffect(()=>{
  if(offline||!vkAppId(location.search))return;
  let disposed=false;document.documentElement.classList.add('vk-mini-app');
  setState({...emptyVkState,active:true});
  void import('@vkontakte/vk-bridge').then(({default:bridge})=>{
   if(disposed)return;
   session.current=startVk(bridge,location.search,{state:setState,
    hidden:hidden=>window.dispatchEvent(new CustomEvent('legenda-visibility',{detail:{hidden}})),
    insets:value=>{if(!value||typeof value!=='object')return;for(const edge of ['top','bottom','left','right']){const v=(value as Record<string,unknown>)[edge];if(typeof v==='number'&&Number.isFinite(v))document.documentElement.style.setProperty('--vk-inset-'+edge,Math.min(160,Math.max(0,v))+'px')}}});
  }).catch(()=>{});
  return()=>{disposed=true;session.current?.dispose();session.current=null;document.documentElement.classList.remove('vk-mini-app');for(const edge of ['top','bottom','left','right'])document.documentElement.style.removeProperty('--vk-inset-'+edge)};
 },[offline]);
 return {...state,share:()=>session.current?.share(),favorite:()=>session.current?.favorite()};
}
export type VkSession=ReturnType<typeof useVkMiniApp>;
