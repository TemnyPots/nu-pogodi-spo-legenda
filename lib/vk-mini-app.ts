import type {VKBridge, VKBridgeSubscribeHandler} from '@vkontakte/vk-bridge';
export type VkProfile={name:string;nickname:string;photo:string|null};
export type VkState={active:boolean;connected:boolean;profile:VkProfile|null;canShare:boolean;canFavorite:boolean};
export const emptyVkState:VkState={active:false,connected:false,profile:null,canShare:false,canFavorite:false};
// Launch parameters select presentation only. They are NOT server authentication.
export function vkAppId(search:string){const id=new URLSearchParams(search).get('vk_app_id');return id&&/^[1-9]\d{0,11}$/.test(id)?id:null}
export function safeAvatar(value:unknown){if(typeof value!=='string')return null;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
export function profileFromVk(value:unknown):VkProfile|null{
 if(!value||typeof value!=='object')return null;
 const user=value as Record<string,unknown>;
 const name=[user.first_name,user.last_name].filter(v=>typeof v==='string').join(' ').replace(/[\x00-\x1f<>]/g,'').trim();
 return name?{name,nickname:name.slice(0,20),photo:safeAvatar(user.photo_200??user.photo_100)}:null;
}
export function bounded<T>(promise:Promise<T>,ms=4000):Promise<T>{return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('VK timeout')),ms);promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})})}
export function startVk(bridge:VKBridge,search:string,handlers:{state:(state:VkState)=>void;hidden:(hidden:boolean)=>void;insets:(value:unknown)=>void}){
 const appId=vkAppId(search);let disposed=false;
 let state:VkState={...emptyVkState,active:Boolean(appId)};
 const emit=(part:Partial<VkState>)=>{state={...state,...part};if(!disposed)handlers.state(state)};
 const listener:VKBridgeSubscribeHandler=event=>{
  if(disposed)return;
  if(event.detail.type==='VKWebAppViewHide')handlers.hidden(true);
  if(event.detail.type==='VKWebAppViewRestore')handlers.hidden(false);
  if(event.detail.type==='VKWebAppUpdateConfig'||event.detail.type==='VKWebAppUpdateInsets'){
   const data=event.detail.data;if('insets' in data)handlers.insets(data.insets);
  }
 };
 if(appId){
  emit({});bridge.subscribe(listener);
  void bounded(bridge.send('VKWebAppInit')).then(async()=>{
   if(disposed)return;emit({connected:true});
   void bounded(bridge.send('VKWebAppGetUserInfo')).then(user=>emit({profile:profileFromVk(user)})).catch(()=>{});
   void bounded(bridge.send('VKWebAppGetConfig')).then(data=>{if(!disposed&&'insets' in data)handlers.insets(data.insets)}).catch(()=>{});
   void bounded(bridge.send('VKWebAppSetViewSettings',{status_bar_style:'light',action_bar_color:'#101716',navigation_bar_color:'#101716'})).catch(()=>{});
   void bounded(bridge.supportsAsync('VKWebAppShare')).then(canShare=>emit({canShare})).catch(()=>{});
   void bounded(bridge.supportsAsync('VKWebAppAddToFavorites')).then(canFavorite=>emit({canFavorite})).catch(()=>{});
  }).catch(()=>emit({connected:false}));
 }
 return {dispose(){disposed=true;if(appId)bridge.unsubscribe(listener)},
  share:()=>bounded(bridge.send('VKWebAppShare',{link:`https://vk.com/app${appId}`})),
  favorite:()=>bounded(bridge.send('VKWebAppAddToFavorites'))};
}
