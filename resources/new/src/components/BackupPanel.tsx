import React,{useState} from 'react';
import {X,FileUp,FileDown,ShieldCheck,HelpCircle,ArchiveRestore} from 'lucide-react';
import {downloadBackup,restoreBackup} from '../utils/backup';
export function BackupPanel(){
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [pendingImport, setPendingImport] = useState<{file: File; kind: 'full'|'share'} | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError('');
    try {
      const data = JSON.parse(await file.text());
      if (data?.format !== 'english-blocks-backup' || ![1,2].includes(data?.version)) throw new Error('请选择从英语拼块导出的 JSON 备份');
      setPendingImport({file, kind: data.version===2&&data.kind==='share'?'share':'full'});
    } catch(error) { setImportError(error instanceof Error?error.message:'文件无法读取'); }
  };
  const confirmImport = async () => {
    if (!pendingImport || importing) return;
    setImporting(true);
    try { await restoreBackup(pendingImport.file); }
    catch(error) {setImporting(false);setPendingImport(null);setImportError(error instanceof Error?error.message:'导入失败');}
  };

return <>
          <div className="rounded-[24px] bg-gradient-to-br from-[var(--theme-muted-surface)] to-white border border-[var(--theme-border)] p-4 space-y-3 shadow-sm">
            <div className="flex gap-2 items-center"><span className="h-9 w-9 rounded-xl bg-white border border-[var(--theme-border)] grid place-items-center text-[var(--theme-muted)]"><ArchiveRestore className="w-5 h-5"/></span><div><h4 className="text-sm font-bold text-[var(--theme-text)]">保存与分享游戏数据</h4><p className="text-[11px] text-[var(--theme-muted)]">把喜爱的设置和成长记录妥善收藏</p></div></div>
            <p className="text-xs leading-relaxed text-[var(--theme-muted)]">音效、背景音乐、猫咪装扮和学习记录可以导出为 JSON 备份，在其他浏览器中恢复。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button className="text-left flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border border-[var(--theme-border)] bg-white text-[var(--theme-text)] text-xs font-bold hover:bg-[var(--theme-muted-surface)]" onClick={()=>downloadBackup('full').catch(e=>alert('导出失败：'+e.message))}><FileDown className="w-5 h-5 shrink-0"/><span>导出完整备份<small className="block font-normal text-[var(--theme-muted)] mt-0.5">含学习记录</small></span></button>
              <button className="text-left flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border border-[var(--theme-border)] bg-white text-[var(--theme-muted)] text-xs font-bold hover:bg-[var(--theme-muted-surface)]" onClick={()=>downloadBackup('share').catch(e=>alert('导出失败：'+e.message))}><FileDown className="w-5 h-5 shrink-0"/><span>导出设置备份<small className="block font-normal text-[var(--theme-muted)] mt-0.5">不含学习记录</small></span></button>
              <label data-ui-sound="on" className="cursor-pointer text-left flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] text-[var(--theme-text)] text-xs font-bold hover:bg-[var(--theme-muted-surface)]"><FileUp className="w-5 h-5 shrink-0"/><span>导入备份<small className="block font-normal text-[var(--theme-muted)] mt-0.5">选择 JSON 存档文件</small></span><input type="file" accept=".json,application/json" className="hidden" onChange={e=>{void handleImportFile(e.target.files?.[0]);e.target.value='';}}/></label>
              <button type="button" aria-expanded={showImportHelp} onClick={()=>setShowImportHelp(v=>!v)} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 border border-[var(--theme-border)] bg-white text-[var(--theme-muted)] text-xs font-bold hover:bg-[var(--theme-muted-surface)]"><HelpCircle className="w-5 h-5 shrink-0"/>如何导入？</button>
            </div>
            {showImportHelp&&<p className="rounded-2xl bg-white/90 border border-[var(--theme-border)] p-3 text-xs leading-relaxed text-[var(--theme-text)]">打开「导入备份」→ 选择之前导出的 JSON → 核对备份类型 → 点击「确认导入」。完整备份会替换学习记录与设置；设置备份只更新音乐、音效、装扮等，不会覆盖本人的学习进度。</p>}
            {importError&&<p role="alert" className="rounded-xl p-3 bg-[var(--theme-muted-surface)] text-[var(--theme-muted)] text-xs font-bold">导入失败：{importError}</p>}
          </div>
      {pendingImport && <div className="fixed inset-0 z-[90] bg-[var(--theme-text)]/50 backdrop-blur-[4px] flex items-center justify-center p-4" role="presentation">
        <div role="alertdialog" aria-modal="true" aria-labelledby="import-confirm-title" className="relative w-full max-w-[390px] bg-[var(--theme-surface)] border-[5px] border-white rounded-[32px] shadow-[0_28px_85px_rgb(var(--theme-shadow-rgb)/.28)] p-6 sm:p-7 text-center">
          <button disabled={importing} onClick={()=>setPendingImport(null)} aria-label="关闭导入确认" className="absolute right-4 top-4 text-[var(--theme-muted)] hover:text-[var(--theme-text)] w-7 h-7 rounded-full bg-[var(--theme-muted-surface)] grid place-items-center"><X className="w-4 h-4"/></button>
          <div className="mx-auto mt-2 w-[72px] h-[72px] rounded-[24px] bg-gradient-to-br from-[var(--theme-muted-surface)] to-[var(--theme-muted-surface)] border border-[var(--theme-border)] grid place-items-center shadow-inner"><FileUp className="w-8 h-8 text-[var(--theme-muted)]"/></div>
          <h3 id="import-confirm-title" className="mt-4 text-xl text-[var(--theme-text)] font-bold">确认导入备份？</h3>
          <p className="text-sm text-[var(--theme-muted)] leading-relaxed mt-2">{pendingImport.kind==='share'?'将更新音效、背景音乐、猫咪装扮与偏好设置。你自己的学习记录会保留。':'将恢复备份中的学习进度和设置，并替换本机现有记录。'}</p>
          <div className="mt-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-muted-surface)] p-3 flex items-center justify-center gap-2 text-[12px] text-[var(--theme-text)] font-semibold"><ShieldCheck className="w-4 h-4"/> {pendingImport.kind==='share'?'检测到：设置备份（不含学习记录）':'检测到：完整备份（含学习记录）'}</div>
          <p className="text-[11px] text-[var(--theme-muted)] mt-2 truncate" title={pendingImport.file.name}>{pendingImport.file.name}</p>
          <div className="grid grid-cols-2 gap-3 mt-6"><button disabled={importing} onClick={()=>setPendingImport(null)} className="rounded-2xl border border-[var(--theme-border)] bg-white text-[var(--theme-muted)] font-bold text-sm py-3 hover:bg-[var(--theme-muted-surface)]">取消</button><button disabled={importing} onClick={()=>void confirmImport()} className="rounded-2xl bg-[var(--theme-primary)] text-white font-bold text-sm py-3 hover:bg-[var(--theme-primary)] disabled:opacity-70">{importing?'正在恢复…':'确认导入'}</button></div>
        </div>
      </div>}
</>;
}
