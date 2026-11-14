import type {WordBlock} from '../types/game';
import {newRail,insertFromPool,takeBack,type RailState} from './railState.ts';
import {isMusicMovable,parseMusicQuestion} from '../../shared/music-history.mjs';
export type MusicMode='organize'|'retrieve';
export type MusicCategory='genres'|'composers'|'works';
export interface MusicSegment {id:string;kind:'score'|'language'|'punctuation'|'anchor';text:string;pos?:string;sourceRole?:'score'|'language';pointId?:string;pointStart?:boolean;pointEnd?:boolean}
export type MusicSemanticPart={role:'framework'|'knowledge';text:string};
export interface MusicQuestionEdit {paragraphs:MusicSemanticPart[][];updatedAt:number}
export interface MusicQuestion {id:string;category:MusicCategory;title:string;annotatedAnswer:string;rawAnswer:string;version:string;semanticParagraphs?:MusicSemanticPart[][];paragraphs:{id:string;segments:MusicSegment[]}[];scorePoints:MusicSegment[];skeleton:MusicSegment[];correctOrder:string[]}
export interface MusicDraft {version:string;paragraph:number;slots:(string|null)[][]}
export interface MusicAttempt {at:number;mode:MusicMode;correct:boolean;answer:string;version:string;paragraph?:number}
export interface MusicQuestionProgress {organizeComplete:boolean;retrieveComplete:boolean;lastStudiedAt:number;attempts:MusicAttempt[];drafts?:Partial<Record<MusicMode,MusicDraft>>}
export interface MusicHistoryProgress {version:1;questions:Record<string,MusicQuestionProgress>;edits?:Record<string,MusicQuestionEdit>}
export const emptyMusicProgress=():MusicHistoryProgress=>({version:1,questions:{}});
export const emptyMusicRecord=():MusicQuestionProgress=>({organizeComplete:false,retrieveComplete:false,lastStudiedAt:0,attempts:[]});
export const musicWords=(q:MusicQuestion,mode:MusicMode,paragraph:number):WordBlock[]=>q.paragraphs[paragraph].segments.filter(s=>isMusicMovable(s,mode)).map(s=>({id:s.id,text:s.text,cleanWord:s.text,pos:s.pos||'短语',phonetic:'',translation:'',sentenceMeaning:'',colorTheme:s.kind==='score'?'pink':'green'}));
export function shuffled<T>(items:T[]):T[]{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
export function restoreMusicBoards(q:MusicQuestion,mode:MusicMode,draft?:MusicDraft):RailState[]{return q.paragraphs.map((_,index)=>{const words=musicWords(q,mode,index),saved=draft?.version===q.version?draft.slots[index]:undefined;if(!saved||saved.length!==words.length)return newRail(words,shuffled);const ids=saved.filter((id):id is string=>id!==null),byId=new Map(words.map(w=>[w.id,w]));if(new Set(ids).size!==ids.length||ids.some(id=>!byId.has(id)))return newRail(words,shuffled);return {slots:saved.map(id=>id===null?null:byId.get(id)!),pool:shuffled(words.filter(w=>!ids.includes(w.id)))};});}
// Compare text at each source position; identical repeated phrases are interchangeable,
// while distinct block IDs still prevent duplication or loss during movement.
export function musicParagraphCorrect(q:MusicQuestion,mode:MusicMode,paragraph:number,board:RailState){const target=musicWords(q,mode,paragraph);return board.slots.length===target.length&&target.every((word,i)=>board.slots[i]?.text===word.text);}
export function musicAnswer(q:MusicQuestion,mode:MusicMode,boards:RailState[]){return q.paragraphs.map((paragraph,pi)=>{let slot=0;return paragraph.segments.map(s=>isMusicMovable(s,mode)?boards[pi]?.slots[slot++]?.text??'〔未填〕':s.text).join('');}).join('\n');}
export function packMusicDraft(q:MusicQuestion,paragraph:number,boards:RailState[]):MusicDraft{return {version:q.version,paragraph,slots:boards.map(b=>b.slots.map(w=>w?.id??null))};}

/** Fill the earliest empty slot; conserve IDs even if its answer was misplaced. */
export function hintMusicBlock(q:MusicQuestion,mode:MusicMode,paragraph:number,board:RailState):RailState {
 const index=board.slots.findIndex(word=>word===null);if(index<0)return board;
 const expected=musicWords(q,mode,paragraph),text=expected[index]?.text;if(!text)return board;
 const candidate=board.pool.find(word=>word.text===text);
 if(candidate)return insertFromPool(board,index,candidate.id);
 const from=board.slots.findIndex((word,i)=>word?.text===text&&word.text!==expected[i]?.text);
 if(from<0)return board;
 const word=board.slots[from]!;return insertFromPool(takeBack(board,from),index,word.id);
}

/** Recompile both modes together so an edited answer cannot diverge from its rail. */
export function compileMusicEdit(base:MusicQuestion,paragraphs:MusicSemanticPart[][]):MusicQuestion {
 if(paragraphs.length!==base.paragraphs.length)throw Error('请保留原来的段落数量');
 if(!base.semanticParagraphs||paragraphs.some((parts,i)=>parts.length!==base.semanticParagraphs![i].length||parts.some((part,j)=>part.role!==base.semanticParagraphs![i][j].role)))throw Error('请保留原来的知识词块和固定文字结构');
 if(paragraphs.some(parts=>parts.some(part=>!part.text.trim())))throw Error('文字不能为空，可以修改词语，但请保留每个词块');
 if(paragraphs.some(parts=>parts.some(part=>part.text.length>1000||/[\r\n]/u.test(part.text))))throw Error('每个词块请使用一行文字，长度不超过1000字');
 const rawAnswer=paragraphs.map(parts=>parts.map(p=>p.text).join('')).join('\n');if(rawAnswer.length>30000)throw Error('整道题目请控制在30000字以内');
 return parseMusicQuestion({id:base.id,title:base.title,rawAnswer,semanticParagraphs:paragraphs},base.category) as MusicQuestion;
}
export function resolveMusicQuestion(base:MusicQuestion,edit?:MusicQuestionEdit):MusicQuestion {
 if(!edit)return base;
 try{return compileMusicEdit(base,edit.paragraphs);}catch{return base;}
}
