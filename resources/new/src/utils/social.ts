import {cloudSync} from './cloudSync';
import type {CatId,OutfitSlot} from '../data/catShop';
import type {CatPose,CatExpression} from '../components/PoseDressedCat';
export type FriendPlayer={avatar?:string|null;id:string;name:string;cat:CatId;equipped:Partial<Record<OutfitSlot,string>>;pose:CatPose;expression:CatExpression;level:number;stage:string;currentLevel:number;completed:number;totalLevels:number;today:number;week:number;online:boolean;owned:{id:string;name:string}[]};
export type Wallet={balance:number;today:number;earnedToday:number;dailyMaximum:number;nextIn:number};
export type PrankNotice={id:string;senderId:string;senderName:string;item:string;sentAt:number;seen:boolean;handled:boolean;canCounter:boolean};
export type SocialData={self:FriendPlayer;code:string;wallet:Wallet;friends:FriendPlayer[];requests:{id:string;incoming:boolean;player:Pick<FriendPlayer,'id'|'name'|'cat'|'avatar'>;createdAt:number}[];inbox:PrankNotice[];pendingCount:number;weekStart:string};
export type FriendSpace={player:FriendPlayer;events:{id:string;kind:string;title:string;createdAt:number}[]};
export const socialRequest=<T,>(path:string,method='GET',body?:unknown)=>cloudSync.request<T>(path,method,body);
const keys=new Map<string,string>();
export async function throwPrank(receiverId:string){const key='throw:'+receiverId;let requestKey=keys.get(key);if(!requestKey){requestKey=crypto.randomUUID();keys.set(key,requestKey);}const result=await socialRequest<{id:string}>('/social/throw','POST',{receiverId,key:requestKey});keys.delete(key);window.dispatchEvent(new Event('englishblocks-social-refresh'));return result;}
export async function handlePrank(id:string,action:'handle'|'counter'|'seen'){
 const label='notice:'+id;let key=keys.get(label);if(!key){key=crypto.randomUUID();keys.set(label,key);}
 const result=await socialRequest('/social/pranks/'+id,'POST',{action,key});keys.delete(label);window.dispatchEvent(new Event('englishblocks-social-refresh'));return result;
}
