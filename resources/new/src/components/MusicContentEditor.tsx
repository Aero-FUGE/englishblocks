import React,{useEffect,useMemo,useRef,useState} from 'react';
import {X,RotateCcw,Save} from 'lucide-react';
import {ModalOverlay} from './ModalOverlay';
import {compileMusicEdit,type MusicQuestion,type MusicSemanticPart} from '../utils/musicHistory';
type Props={question:MusicQuestion;original:MusicQuestion;paragraph:number;onSave:(parts:MusicSemanticPart[][])=>void;onClose:()=>void};
export function MusicContentEditor({question,original,paragraph,onSave,onClose}:Props){
 const[parts,setParts]=useState<MusicSemanticPart[][]>(()=>structuredClone(question.semanticParagraphs||[]));
 const[current,setCurrent]=useState(paragraph);
 const panel=useRef<HTMLElement>(null);
 const validation=useMemo(()=>{try{return {question:compileMusicEdit(original,parts),error:''};}catch(error){return {question:null,error:error instanceof Error?error.message:'请检查修改的文字'};}},[original,parts]);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;panel.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key==='Tab'){const controls=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),textarea')||[]),first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus();};},[onClose]);
 const change=(index:number,text:string)=>setParts(old=>old.map((row,pi)=>pi===current?row.map((part,i)=>i===index?{...part,text}:part):row));
 return <ModalOverlay className="eb-season-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={panel} className="eb-music-editor" role="dialog" aria-modal="true" aria-labelledby="music-editor-title">
  <header><div><small>给知识修修小细节</small><h2 id="music-editor-title">修改内容 · {question.title}</h2></div><button type="button" aria-label="关闭修改内容" onClick={onClose}><X size={19}/></button></header>
  <p className="eb-music-editor-note">知识词块和固定文字都可以修改，保存在你的学习存档中，随账号同步。保存后本题拼块重新开始，通关记录保留。</p>
  <nav className="eb-music-paragraphs" aria-label="选择修改段落">{parts.map((_,i)=><button type="button" key={i} aria-pressed={current===i} onClick={()=>setCurrent(i)}>第 {i+1} 段</button>)}</nav>
  <div className="eb-music-editor-fields">{parts[current]?.map((part,i)=><label key={`${current}-${i}`} data-edit-role={part.role}><span>{part.role==='knowledge'?'知识词块':'固定文字'}</span><textarea rows={part.text.length>35?3:1} aria-label={`${part.role==='knowledge'?'知识词块':'固定文字'} ${i+1}`} value={part.text} maxLength={1000} onChange={e=>change(i,e.target.value)}/></label>)}</div>
  <div className="eb-music-editor-preview"><strong>修改后整段</strong><p>{parts[current]?.map(p=>p.text).join('')}</p></div>
  {validation.error&&<p role="alert" className="eb-music-editor-error">{validation.error}</p>}
  <footer><button type="button" onClick={()=>setParts(structuredClone(original.semanticParagraphs||[]))}><RotateCcw size={15}/>恢复原版</button><button type="button" onClick={onClose}>取消</button><button type="button" className="eb-music-primary" disabled={!validation.question} onClick={()=>onSave(parts)}><Save size={15}/>保存修改</button></footer>
 </section></ModalOverlay>;
}
