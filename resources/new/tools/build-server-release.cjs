// Run after npm run build. Release metadata comes from the matching installer.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),installer=fs.readFileSync(path.join(root,'deploy/server-update/update-server.sh'),'utf8');
const release=/^RELEASE='([\w.-]+)'/m.exec(installer)?.[1],source=/^SOURCE_SHA='([a-f0-9]+)'/m.exec(installer)?.[1];
if(!release||!source)throw Error('Installer release metadata is missing');
const out=path.resolve(root,'../../deployment',release),stage=path.join(out,'app');fs.mkdirSync(out,{recursive:true});fs.rmSync(stage,{recursive:true,force:true});fs.mkdirSync(stage);
fs.cpSync(path.join(root,'dist'),path.join(stage,'dist'),{recursive:true,filter:p=>!p.startsWith(path.join(root,'dist/assets/audio'))});
for(const name of ['server','shared'])fs.cpSync(path.join(root,name),path.join(stage,name),{recursive:true});
fs.copyFileSync(path.join(root,'deploy/server-update/Dockerfile'),path.join(stage,'Dockerfile.update'));
const bundle=/index-[\w-]+\.js/.exec(fs.readFileSync(path.join(stage,'dist/index.html'),'utf8'))?.[0];if(!bundle)throw Error('Build output is missing');
fs.writeFileSync(path.join(stage,'VERSION.json'),JSON.stringify({source,release,bundle},null,2)+'\n');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');const manifest={};
function audio(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())audio(p);else if(entry.isFile())manifest[path.relative(path.join(root,'dist'),p).split(path.sep).join('/')]=hash(p);}}
audio(path.join(root,'dist/assets/audio'));fs.writeFileSync(path.join(stage,'audio-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
execFileSync('tar',['-czf',path.join(out,'englishblocks-web.tar.gz'),'-C',stage,'dist','server','shared','Dockerfile.update','VERSION.json','audio-manifest.json']);
execFileSync('tar',['-czf',path.join(out,'englishblocks-audio.tar.gz'),'-C',root,'dist/assets/audio']);
fs.copyFileSync(path.join(root,'deploy/server-update/update-server.sh'),path.join(out,'update-server.sh'));
fs.writeFileSync(path.join(out,'SHA256SUMS'),['englishblocks-web.tar.gz','englishblocks-audio.tar.gz'].map(name=>hash(path.join(out,name))+'  '+name).join('\n')+'\n');
console.log(`Prepared ${release} (${bundle}), ${Object.keys(manifest).length} optional reusable audio files.`);
