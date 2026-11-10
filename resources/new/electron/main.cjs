const { app, BrowserWindow, shell, protocol, net, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// A stable, isolated origin ensures localStorage persists between launches.
protocol.registerSchemesAsPrivileged([{
  scheme: 'englishblocks',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
}]);

// A separate disk snapshot protects saves even if Chromium origin storage is reset.
// Keep appId/productName stable across upgrades so app.getPath('userData') stays stable.
const savePath = () => path.join(app.getPath('userData'), 'englishblocks-save-v1.json');
function readSave() {
  try { const data = JSON.parse(fs.readFileSync(savePath(), 'utf8')); return data && typeof data === 'object' ? data : null; }
  catch { return null; }
}
function writeSave(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const target = savePath();
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const tmp = target + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data), 'utf8');
    fs.renameSync(tmp, target);
    return true;
  } catch (err) { console.error('[save] Failed to write disk snapshot:', err); return false; }
}
// Cloud sync uses the build-time VITE_CLOUD_URL over HTTPS, with account tokens.
ipcMain.on('englishblocks:save-read', (event) => { event.returnValue = readSave(); });
ipcMain.on('englishblocks:save-write', (event, data) => { event.returnValue = writeSave(data); });
// Developer-only preview: same Electron session/origin, independent narrow viewport.
ipcMain.handle('englishblocks:mobile-preview', () => {
  const existing = BrowserWindow.getAllWindows().find(w => w.__ebMobilePreview);
  if (existing) { existing.focus(); return true; }
  const preview = new BrowserWindow({width: 420,height: 820,minWidth: 340,minHeight: 560,
    title: '英语拼块 · 手机布局预览',autoHideMenuBar:true,backgroundColor:'#F3F7EF',
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(__dirname,'preload.cjs')}
  });
  preview.__ebMobilePreview = true;
  preview.loadURL('englishblocks://app/?layoutDev=1&mobilePreview=1');
  return true;
});

const root = path.resolve(__dirname, '..', 'dist');

app.whenReady().then(async () => {
  protocol.handle('englishblocks', (request) => {
    const url = new URL(request.url);
    if (url.hostname !== 'app') return new Response('Not found', { status: 404 });
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { return new Response('Bad request', { status: 400 }); }
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) return new Response('Forbidden', { status: 403 });
    const target = file === root || pathname.endsWith('/') ? path.join(file, 'index.html') : file;
    try {
      if (!fs.statSync(target).isFile()) return new Response('Not found', { status: 404 });
    } catch { return new Response('Not found', { status: 404 }); }
    return net.fetch(pathToFileURL(target).toString());
  });
  const win = new BrowserWindow({
    width: 1360, height: 850, minWidth: 960, minHeight: 640,
    autoHideMenuBar: true, backgroundColor: '#F3F7EF', icon: path.join(__dirname, 'icon.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.cjs') }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  await win.loadURL('englishblocks://app/?layoutDev=1');
}).catch(err => { console.error(err); app.quit(); });
app.on('window-all-closed', () => app.quit());
