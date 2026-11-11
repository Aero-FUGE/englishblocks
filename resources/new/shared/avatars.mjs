const styles=[['樱花','月光','花冠','暖冬','书香','玫瑰','蝴蝶','金叶','音乐','夏日','秋梦','雪光'],['樱花','皇冠','星星','月光','书香','女仆','蝴蝶','好梦','音乐','夏日','飞行','雪光']];
export const AVATARS=Array.from({length:24},(_,index)=>({id:'cat-avatar-'+String(index+1).padStart(2,'0'),file:String(index+1).padStart(2,'0')+'.png',name:(index<12?'咪咪':'团长')+' · '+styles[Math.floor(index/12)][index%12],group:index<12?'mimi':'tuanzhang'}));
export function findAvatar(id){return AVATARS.find(avatar=>avatar.id===id)||null;}
