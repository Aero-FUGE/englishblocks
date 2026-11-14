import type {CatCollection} from '../components/CatWardrobeModal';
export const DEFAULT_AVATAR='cat-avatar-05';
export const THEME_PRICE=500, AVATAR_PRICE=100;
export function ownsCosmetic(c:CatCollection,kind:'theme'|'avatar',id:string){return kind==='theme'?id==='summer'||!!c.unlockedThemes?.includes(id):id===DEFAULT_AVATAR||!!c.unlockedAvatars?.includes(id);}
export function unlockCosmetic(c:CatCollection,kind:'theme'|'avatar',id:string):CatCollection{
 if(ownsCosmetic(c,kind,id))return c;
 if(!(kind==='theme'?['spring','autumn','winter'].includes(id):/^cat-avatar-(0[1-9]|1[0-9]|2[0-4])$/.test(id)))return c;
 const price=kind==='theme'?THEME_PRICE:AVATAR_PRICE;if(c.fish<price)return c;
 const key=kind==='theme'?'unlockedThemes':'unlockedAvatars';
 return {...c,fish:c.fish-price,[key]:[...new Set([...(c[key]||[]),id])]};
}
