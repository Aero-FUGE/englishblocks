import type {MusicQuestion} from '../../utils/musicHistory';
// Every imported category bank is discovered automatically; no question counts here.
const banks=import.meta.glob<{default:MusicQuestion[]}>('./*.json',{eager:true});
export const MUSIC_QUESTIONS=Object.values(banks).flatMap(bank=>bank.default);
if(new Set(MUSIC_QUESTIONS.map(q=>q.id)).size!==MUSIC_QUESTIONS.length)throw Error('音乐史题库 ID 重复');
