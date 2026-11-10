const {strict:assert}=require('node:assert');
const fs=require('node:fs'),vm=require('node:vm'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const store=new Map([
 ['word_candy_bgm_tracks_v1',JSON.stringify([
   {id:'builtin_music_box',title:'内置',isBuiltIn:true},
   {id:'song_a',title:'曲A',isBuiltIn:false},
   {id:'song_b',title:'曲B',isBuiltIn:false},
 ])],
 ['english_blocks_bgm_settings_v1',JSON.stringify({currentTrackId:'song_a',volume:0.35,mode:'list'})],
 ['english_blocks_speech_settings_v1',JSON.stringify({gender:'male',rate:1.0,autoReadOnSuccess:true,enabled:true})],
]);
const voices=[
 {voiceURI:'v-female',name:'Samantha',lang:'en-US',localService:true},
 {voiceURI:'v-male',name:'Daniel',lang:'en-GB',localService:true},
];
const utterances=[],speechEngine={ speaking:false,pending:false,paused:false,cancels:0,
 getVoices:()=>voices,
 addEventListener:()=>{},
 speak(u){utterances.push(u);},
 cancel(){this.cancels++;this.speaking=false;},resume(){this.paused=false;},
};
class Utterance {constructor(text){this.text=text;this.lang='';this.rate=0;this.voice=null;}}
let audios=[];
class FakeAudio {
 constructor(src){this.src=src;this.loop=false;this.preload='auto';this.volume=1;this.paused=true;this.ended=false;this.listeners={};audios.push(this);}
 async play(){this.paused=false;this.ended=false;}
 pause(){this.paused=true;}
 load(){}
 addEventListener(type,fn){this.listeners[type]=fn;}
 trigger(type){if(type==='ended')this.ended=true;this.listeners[type]?.();}
}
const moduleExports={};
const sandbox={ exports:moduleExports,
 require(name){if(name==='./audioStore')return {
  loadAudio:async id=> ['song_a','song_b'].includes(id)?new Blob([id],{type:'audio/mpeg'}):undefined,
  saveAudio:async()=>{},removeAudio:async()=>{},
 };throw Error('unknown import '+name)},
 window:{speechSynthesis:speechEngine,setTimeout,clearTimeout,setInterval,clearInterval},
 SpeechSynthesisUtterance:Utterance,
 Audio:FakeAudio,
 URL,Blob,console,setTimeout,clearTimeout,setInterval,clearInterval,
 localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},
};
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'english-blocks-audio-v15-'));
execFileSync('tsc',['src/utils/sound.ts','src/utils/audioStore.ts','src/types/game.ts','--module','commonjs','--target','es2020','--lib','es2020,dom','--skipLibCheck','--outDir',tmp],{stdio:'pipe'});
const compiled=fs.readFileSync(path.join(tmp,'utils/sound.js'),'utf8');
fs.rmSync(tmp,{recursive:true,force:true});
vm.runInNewContext(compiled,sandbox,{filename:'sound.cjs'});
const sound=moduleExports.sound;
const wait=()=>new Promise(r=>setTimeout(r,15));
(async()=>{
 await wait();
 assert.equal(sound.bgmMode,'list');
 assert.equal(sound.speechRate,1);
 assert.equal(sound.getSelectedVoiceLabel().includes('Daniel'),true,'male voice recognized');
 sound.speakText('one');
 assert.equal(utterances.length,1,'speech gets invoked immediately');
 assert.equal(utterances[0].voice.voiceURI,'v-male');
 assert.equal(speechEngine.cancels,0,'no needless cancellation of idle engine');
 sound.setSpeechGender('female');
 sound.speakText('two');
 assert.equal(utterances[1].voice.voiceURI,'v-female');
 assert.equal(sound.speechVoiceId,'');
 sound.setSpeechVoice('v-male');
 sound.speakText('three');
 assert.equal(utterances[2].voice.voiceURI,'v-male','manual voice selection overrides gender');
 sound.setSpeechRate(.8); sound.setAutoReadOnSuccess(false);
 let settings=JSON.parse(store.get('english_blocks_speech_settings_v1'));
 assert.equal(settings.rate,.8); assert.equal(settings.autoReadOnSuccess,false);
 sound.setBgmMode('single');
 await sound.startBgm();
 assert.equal(sound.bgmPlaying,true);
 assert.equal(sound.customAudio.loop,true);
 sound.setBgmMode('list');
 assert.equal(sound.customAudio.loop,false);
 const current=sound.customAudio;
 current.trigger('ended');
 await wait();
 assert.equal(sound.currentTrackId,'song_b','ended moves to next song');
 assert.equal(sound.bgmPlaying,true,'next track plays automatically');
 assert.equal(sound.customAudio.loop,false);
 sound.advanceBgm(-1);
 await wait();
 assert.equal(sound.currentTrackId,'song_a','previous track button works');
 sound.setBgmMode('single');
 sound.pauseBgm();
 assert.equal(sound.bgmPlaying,false);
 assert.equal(JSON.parse(store.get('english_blocks_bgm_settings_v1')).mode,'single','mode persisted');
 console.log('PASS: male/female voice, manual choice, no idle cancellation, persist speed/auto-read, single/list modes, ended-next, previous, pause');
})().catch(e=>{console.error(e);process.exitCode=1});
