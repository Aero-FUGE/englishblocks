import {BackupPanel} from './BackupPanel';
import React, { useState, useSyncExternalStore } from 'react';
import { Cloud, X } from 'lucide-react';
import { ModalOverlay } from './ModalOverlay';
import { cloudSync, CLOUD_ENDPOINT, type CloudSnapshot } from '../utils/cloudSync';

export function CloudSyncModal({open,onClose,local}:{open:boolean;onClose:()=>void;local:CloudSnapshot}){
  const state=useSyncExternalStore(cloudSync.subscribe,cloudSync.getState);
  const [register,setRegister]=useState(false),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[fileError,setFileError]=useState('');
  if(!open)return null;
  const remote=state.conflict?.remote;
  const summary=(s:CloudSnapshot|null|undefined)=>s?`昵称 ${s.profile.name} · 已通关 ${s.profile.completedLevelIds.length} 关 · ${s.collection.fish} 小鱼干 · ${s.collection.owned.length} 件装扮`:'暂无云端存档';
  return <ModalOverlay className="fixed inset-0 flex items-center justify-center bg-[var(--theme-text)]/45 backdrop-blur-[3px]">
    <section role="dialog" aria-modal="true" aria-label="账号同步" className="eb-modal-panel eb-modal-cloud flex flex-col bg-[var(--theme-surface)] border-2 border-white shadow-2xl text-[var(--theme-text)]">
      <header className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--theme-border)]"><h2 className="font-bold flex gap-2 items-center"><Cloud size={22}/>账号同步</h2><button type="button" aria-label="关闭云同步" onClick={onClose} className="p-2 rounded-full bg-white"><X size={18}/></button></header>
      <div className="eb-modal-body py-3 space-y-4">
        <p role="status" className="text-sm font-semibold">{state.status}</p>
        {state.needsReload&&<button className="eb-cloud-primary w-full" onClick={()=>location.reload()}>刷新并读取最新记录</button>}
        {!CLOUD_ENDPOINT&&<p className="text-sm">此安装包尚未配置云服务，请安装配置正式云地址后的 Windows 版本。当前记录仍保存在本机。</p>}
        {!state.user?<form className="space-y-3" onSubmit={e=>{e.preventDefault();void cloudSync.authenticate(username,password,register).then(()=>setPassword(''));}}>
          <p className="text-xs leading-relaxed">手机、电脑登录同一个账号即可同步。首次登录会让你选择使用哪份记录。</p>
          <label className="block text-sm">账号<input aria-label="云账号" autoComplete="username" required pattern="[a-zA-Z0-9_]{4,32}" minLength={4} maxLength={32} value={username} onChange={e=>setUsername(e.target.value)} placeholder="4–32 位字母、数字或下划线" className="mt-1 block w-full rounded-xl border border-[var(--theme-border)] bg-white p-3"/></label>
          <label className="block text-sm">密码<input aria-label="云密码" type="password" autoComplete={register?'new-password':'current-password'} required minLength={10} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} placeholder="至少 10 位" className="mt-1 block w-full rounded-xl border border-[var(--theme-border)] bg-white p-3"/></label>
          <button disabled={state.busy||!CLOUD_ENDPOINT} className="eb-cloud-primary w-full">{state.busy?'正在连接…':register?'注册并登录':'登录云账号'}</button>
          <button type="button" disabled={state.busy} onClick={()=>setRegister(v=>!v)} className="w-full py-2 text-sm underline">{register?'已有账号，去登录':'还没有账号，创建一个'}</button>
        </form>:<>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><strong>账号：{state.user.username}</strong><button disabled={state.busy} onClick={()=>void cloudSync.logout()} className="rounded-full border px-3 py-1">退出账号</button></div>
          {state.updatedAt&&<p className="text-xs">云端更新：{new Date(state.updatedAt).toLocaleString()}</p>}
          {state.conflict?<div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] p-3 space-y-3">
            <h3 className="font-bold">{state.conflict.reason==='initial'?'选择首次同步方式':state.conflict.reason==='restore'?'备份已恢复，请选择下一步':'本机和云端都有不同记录'}</h3>
            <p className="text-xs leading-relaxed">记录不会自动合并，小鱼干不会相加。使用云端前会保留本机回退备份；上传本机将把它作为云端当前记录。</p>
            <div className="text-xs space-y-2"><p><strong>本机：</strong>{summary(local)}</p><p><strong>云端：</strong>{summary(remote?.snapshot)}</p></div>
            <button disabled={state.busy} onClick={()=>void cloudSync.resolve('local')} className="eb-cloud-primary w-full">{state.busy?'正在同步…':'使用本机记录，上传到云端'}</button>
            <button disabled={state.busy||(!remote?.snapshot&&state.conflict.reason==='initial')} onClick={()=>void cloudSync.resolve('cloud')} className="eb-cloud-secondary w-full">使用云端记录，替换本机记录</button>
            <p className="text-xs">也可以先关闭此窗口，继续本机游玩，自动同步会保持暂停。</p>
          </div>:<button disabled={state.busy} onClick={()=>void cloudSync.sync()} className="eb-cloud-primary w-full">立即同步</button>}
        </>}
        {(state.error||fileError)&&<p role="alert" className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] p-3 text-xs break-words">{fileError||state.error}</p>}
        <BackupPanel/>
        <div className="border-t border-[var(--theme-border)] pt-3 space-y-2 text-xs">
          <p className="font-bold">本机回退备份</p><p>同步覆盖前保留最近 3 份记录。恢复备份后会暂停自动上传。</p>
          {state.backups.map((b,index)=><div key={b.at+index} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2"><span>{new Date(b.at).toLocaleString()} · {b.snapshot.profile.completedLevelIds.length} 关</span><button disabled={state.busy} onClick={()=>{try{cloudSync.restore(index);setFileError('');}catch{setFileError('备份恢复失败，请检查浏览器存储空间');}}} className="rounded-lg border bg-white px-2 py-1">恢复到本机</button></div>)}
          <div className="flex flex-wrap gap-3 pt-1"><button onClick={()=>cloudSync.downloadLocal()} className="underline">下载本机同步备份</button><label className="underline cursor-pointer">导入同步备份<input type="file" accept="application/json,.json" className="hidden" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>2_000_000)throw Error('备份超过 2MB');const data=JSON.parse(await file.text());if(data.format!=='englishblocks-cloud-local'||data.version!==1)throw Error('请选择从云同步窗口下载的备份');cloudSync.importLocal(data.snapshot);setFileError('');}catch(error){setFileError(error instanceof Error?error.message:'文件无法读取');}}}/></label></div>
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--theme-muted)]">同步学习进度、错题、生词、小鱼干、装扮与通用音频偏好。自定义上传的音频文件和设备专属语音保留在各设备。</p>
      </div>
    </section>
  </ModalOverlay>;
}
