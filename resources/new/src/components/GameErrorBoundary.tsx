import React from 'react';

/** Keep one bad render from turning the whole game into a blank white page. */
export class GameErrorBoundary extends React.Component<React.PropsWithChildren, {error: string | null; detail: string}> {
  state = {error: null as string | null, detail: ''};
  static getDerivedStateFromError(error: Error) {return {error: error?.message ?? String(error)};}
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const detail = `${error?.stack || error}\n${info.componentStack || ''}`;
    this.setState({detail});
    console.error('English Blocks game render error:', error, info);
    try {localStorage.setItem('english_blocks_last_error_v4', detail);} catch {}
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#F3F7EF] text-[#344735]">
        <section className="max-w-xl w-full bg-white border border-emerald-100 rounded-3xl p-7 shadow-lg">
          <h1 className="text-xl font-bold mb-3">小猫遇到一个程序错误</h1>
          <p className="mb-3 text-sm">学习记录仍保存在浏览器里。可以先复制下面的错误信息，我们就能更准确地修复。</p>
          <pre className="bg-slate-50 rounded-xl p-3 text-xs overflow-auto max-h-44 whitespace-pre-wrap break-words">{this.state.error}</pre>
          <div className="flex flex-wrap gap-3 mt-4">
            <button className="px-4 py-2 rounded-full bg-[#789D6C] text-white" onClick={() => window.location.reload()}>重新打开游戏</button>
            <button className="px-4 py-2 rounded-full border border-[#789D6C]" onClick={() => {
              const detail = this.state.detail || this.state.error || '';
              void navigator.clipboard?.writeText(detail).catch(() => {});
            }}>复制错误信息</button>
          </div>
        </section>
      </main>
    );
  }
}
