import {_electron} from 'playwright';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {DEFAULT_PROFILE} from '../shared/profile.js';
import {validateLibrary,activeProfile,libraryFromProfile} from '../shared/profile-library.js';
const require=createRequire(import.meta.url),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.QA_DIR||path.join(root,'output/native');fs.mkdirSync(out,{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xplay-qa-')),results=[];
const legacy=path.join(temporary,'controls-v1.json'),libraryPath=path.join(temporary,'controls-library-v1.json');
const legacyBytes=JSON.stringify({...DEFAULT_PROFILE,name:'Existing controls',mode:'keyboard'});fs.writeFileSync(legacy,legacyBytes);fs.writeFileSync(path.join(temporary,'owner-file'),'preserve');
let app,window;
async function boot(){
 app=await _electron.launch({executablePath:process.env.XPLAY_TEST_EXECUTABLE||require('electron'),args:process.env.XPLAY_TEST_EXECUTABLE?[]:[root],env:{...process.env,XPLAY_TEST_PROFILE:temporary}});
 window=await app.firstWindow();await window.waitForLoadState('domcontentloaded');
 await window.evaluate(()=>localStorage.setItem('xplay-language-v1','en'));await window.reload();await window.getByRole('button',{name:'Controls settings'}).waitFor();
}
async function close(){if(app){await app.close();app=null;}}
async function library(){return validateLibrary(await window.evaluate(()=>window.xplay.library()));}
async function saved(){await window.getByRole('status').filter({hasText:/Saved|Library saved/}).waitFor();}
async function controls(){await window.getByRole('button',{name:'Controls settings'}).click();await window.getByRole('dialog',{name:'Controls profiles'}).waitFor();}
try{
 await boot();const info=await window.evaluate(()=>window.xplay.info());assert.equal(info.version,JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version);
 assert.equal(await window.evaluate(()=>typeof window.require),'undefined');assert.equal(activeProfile(await library()).name,'Existing controls');
 await window.screenshot({path:out+'/xplay-launcher.png'});await controls();
 await window.getByRole('button',{name:'New',exact:true}).click();await saved();assert.equal((await library()).profiles.length,2);
 await window.getByLabel('Name',{exact:true}).fill('Racing');await window.getByLabel('Mode',{exact:true}).selectOption('keyboard');await window.getByLabel('Sensitivity',{exact:true}).fill('0.009');await window.getByRole('button',{name:'Save',exact:true}).click();await saved();
 const racing=(await library()).activeId;await window.getByRole('button',{name:'Copy',exact:true}).click();await saved();
 await window.getByLabel('Name',{exact:true}).fill('Precision');await window.getByLabel('Sensitivity',{exact:true}).fill('0.012');await window.getByRole('button',{name:'Save',exact:true}).click();await saved();
 await window.getByLabel('Saved profiles',{exact:true}).selectOption(racing);await saved();assert.equal(activeProfile(await library()).sensitivity,.009);
 await window.getByLabel('Name',{exact:true}).fill('Unsaved draft');await window.keyboard.press('Escape');await window.getByRole('alert').filter({hasText:'unsaved changes'}).waitFor();assert.equal(await window.getByLabel('Name',{exact:true}).inputValue(),'Unsaved draft');
 await window.getByRole('button',{name:'Stay here',exact:true}).click();await window.getByRole('button',{name:'Close',exact:true}).click();await window.getByRole('button',{name:'Discard changes',exact:true}).click();await window.getByRole('dialog').waitFor({state:'detached'});assert.equal(activeProfile(await library()).name,'Racing');
 await controls();const before=await library();await window.locator('input[type=file]').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await window.getByRole('status').filter({hasText:/JSON|Unexpected|property/i}).waitFor();assert.deepEqual(await library(),before);
 const imported={...DEFAULT_PROFILE,name:'Imported controls',mode:'keyboard',allowMicrophone:true};
 await window.locator('input[type=file]').setInputFiles({name:'profile.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});await window.getByRole('alert').filter({hasText:'Microphone requests: allowed'}).waitFor();assert.deepEqual(await library(),before);
 await window.getByRole('button',{name:'Add profile',exact:true}).click();await saved();assert.equal(activeProfile(await library()).allowMicrophone,true);
 const activeBeforeImport=(await library()).activeId;const incoming=libraryFromProfile({...DEFAULT_PROFILE,name:'Physical pad'});
 await window.locator('input[type=file]').setInputFiles({name:'library.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});await window.getByRole('button',{name:'Add profiles',exact:true}).click();await saved();assert.equal((await library()).activeId,activeBeforeImport);
 await app.evaluate(({session},file)=>{globalThis.__exportDone=new Promise(resolve=>session.defaultSession.once('will-download',(_event,item)=>{item.setSavePath(file);item.once('done',(_event,state)=>resolve(state));}));},out+'/profile-library.json');await window.getByRole('button',{name:'Export library',exact:true}).click();assert.equal(await app.evaluate(()=>globalThis.__exportDone),'completed');assert.deepEqual(validateLibrary(JSON.parse(fs.readFileSync(out+'/profile-library.json','utf8'))),await library());
 await window.screenshot({path:out+'/xplay-controls.png'});
 await window.getByRole('button',{name:'Delete',exact:true}).click();await window.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal((await library()).activeId,activeBeforeImport);
 await window.getByRole('button',{name:'Close',exact:true}).click();
 await app.context().route('https://www.xbox.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body><h1>Controlled Xbox origin fixture</h1><input aria-label="Chat"></body></html>'}));
 let remoteEvent=app.waitForEvent('window');await window.evaluate(()=>window.xplay.openGame('remote'));let remote=await remoteEvent;await remote.waitForFunction(()=>Boolean(window.__xplayControls));
 assert.equal(await remote.evaluate(()=>typeof window.require),'undefined');assert.equal(await remote.evaluate(()=>typeof window.xplay),'undefined');
 assert.equal(await remote.evaluate(()=>Array.from(navigator.getGamepads()).some(pad=>pad?.id==='X Play keyboard and mouse')),true);
 const liveLibrary=await library(),physical=liveLibrary.profiles.find(row=>row.profile.name==='Physical pad');
 await window.evaluate(async value=>window.xplay.saveLibrary(value),{...liveLibrary,activeId:physical.id});
 await remote.evaluate(()=>history.pushState({},'', '/auth/example'));await remote.waitForFunction(()=>!window.__xplayControls);
 await remote.evaluate(()=>history.pushState({},'', '/play/remote'));await remote.waitForFunction(()=>Boolean(window.__xplayControls));
 assert.equal(await remote.evaluate(()=>Array.from(navigator.getGamepads()).some(pad=>pad?.id==='X Play keyboard and mouse')),true,'Open game keeps its chosen profile');await remote.close();
 remoteEvent=app.waitForEvent('window');await window.evaluate(()=>window.xplay.openGame('remote'));remote=await remoteEvent;await remote.getByRole('heading',{name:'Controlled Xbox origin fixture'}).waitFor();assert.equal(await remote.evaluate(()=>Boolean(window.__xplayControls)),false);assert.equal(await remote.evaluate(()=>Array.from(navigator.getGamepads()).some(pad=>pad?.id==='X Play keyboard and mouse')),false,'Next game adopts new selection');await remote.close();
 results.push({app:'xplay',scenarios:['real-sandbox-preload-on-controlled-origin','no-remote-node-or-IPC','per-game-profile-snapshot','SPA-route-cleanup'],passed:true});
 const persisted=await library();await close();await boot();assert.deepEqual(await library(),persisted);assert.equal(fs.readFileSync(legacy,'utf8'),legacyBytes);
 const good=fs.readFileSync(libraryPath),bad=Buffer.from('{invalid original');fs.writeFileSync(libraryPath,bad);await close();await boot();await window.getByRole('status').filter({hasText:'could not be read'}).waitFor();assert(fs.readFileSync(libraryPath).equals(bad));
 await controls();await window.getByLabel('Name',{exact:true}).fill('Recovered controls');await window.getByRole('button',{name:'Save',exact:true}).click();await saved();
 const backups=fs.readdirSync(temporary).filter(name=>name.startsWith('controls-library-v1.json.unreadable-'));assert.equal(backups.length,1);assert(fs.readFileSync(path.join(temporary,backups[0])).equals(bad));
 assert.equal(fs.readFileSync(path.join(temporary,'owner-file'),'utf8'),'preserve');assert.equal(fs.readFileSync(legacy,'utf8'),legacyBytes);assert.equal(fs.readdirSync(temporary).filter(name=>name.startsWith('controls-library-v1.json.tmp')).length,0);
 results.push({app:'xplay',version:info.version,scenarios:['legacy-migration-preserved','named-create-copy-edit-select','unsaved-Escape-and-close-guard','malformed-import-preserves-data','review-microphone-before-import','merge-retains-active-choice','export-roundtrip','restart-persistence','corrupt-original-private-backup'],passed:true});
 // Exercise a blocked write without using the owner's profile or changing machine permissions.
 fs.writeFileSync(libraryPath,good);fs.renameSync(libraryPath,libraryPath+'.qa-preserved');fs.mkdirSync(libraryPath);await window.getByLabel('Name',{exact:true}).fill('Keep failed draft');await window.getByRole('button',{name:'Save',exact:true}).click();await window.getByRole('status').filter({hasText:/EISDIR|directory/i}).waitFor();assert.equal(await window.getByLabel('Name',{exact:true}).inputValue(),'Keep failed draft');assert(fs.statSync(libraryPath).isDirectory());assert(fs.readFileSync(libraryPath+'.qa-preserved').equals(good));
 results.push({app:'xplay',scenarios:['blocked-destination-keeps-draft-and-original'],passed:true});
}finally{await close();fs.rmSync(temporary,{recursive:true,force:true});fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));}
console.log('X Play native library, migration, failure preservation and sandbox fixture passed');
