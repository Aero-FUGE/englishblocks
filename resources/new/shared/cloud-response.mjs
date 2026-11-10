import { validSnapshot } from './snapshot.mjs';

// Only a well-formed API authentication error may invalidate a saved session.
// Proxy errors, login redirects and incomplete bodies must keep local data intact.
export class CloudApiError extends Error {
  constructor(message, status, data) { super(message); this.status=status; this.data=data; }
}
function protocolError(response, detail) {
  return new Error(`${detail}（HTTP ${response.status}）。请确认预览/云服务正在运行后重试，本机记录已保留。`);
}
function validRemote(data) {
  return data && Number.isSafeInteger(data.revision) && data.revision>=0 &&
    (data.revision===0 ? data.snapshot===null : validSnapshot(data.snapshot));
}
export async function readCloudResponse(response, path) {
  let text;
  try { text=await response.text(); }
  catch { throw protocolError(response,'云接口响应中断'); }
  if(!text.trim())throw protocolError(response,'云接口返回了空内容');
  const type=response.headers.get('content-type')||'';
  if(response.redirected || !/^application\/(?:json|[\w.-]+\+json)(?:\s*;|$)/i.test(type)) {
    throw protocolError(response,'收到的不是云接口数据，可能进入了登录页或错误页面');
  }
  let data;
  try { data=JSON.parse(text); }
  catch { throw protocolError(response,'云接口响应不完整或格式异常'); }
  if(!data || typeof data!=='object' || Array.isArray(data))throw protocolError(response,'云接口返回的数据无效');
  if(!response.ok){
    if(path==='/save' && response.status===409 && validRemote(data))throw new CloudApiError('云端记录已更新，请选择同步方向',409,data);
    if(typeof data.error==='string' && data.error.trim())throw new CloudApiError(data.error,response.status,data);
    throw protocolError(response,'云服务暂时不可用');
  }
  if(path==='/login'||path==='/register'){
    if(!/^[A-Za-z0-9_-]{43}$/.test(data.token)||!Number.isSafeInteger(data.expiresAt)||data.expiresAt<=0||typeof data.user?.id!=='string'||!data.user.id||typeof data.user?.username!=='string'||!data.user.username)throw protocolError(response,'登录响应不完整，尚未保存登录状态');
  }else if(path==='/save' && !validRemote(data))throw protocolError(response,'云端存档响应不完整，未替换本机记录');
  else if(path==='/logout' && data.ok!==true)throw protocolError(response,'退出响应不完整');
  return data;
}
