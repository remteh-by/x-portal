import {_electron} from 'playwright';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.QA_DIR||path.join(root,'output/native');fs.mkdirSync(out,{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xplay-qa-')),results=[];
try{
 const app=await _electron.launch({executablePath:process.env.XPLAY_TEST_EXECUTABLE||require('electron'),args:process.env.XPLAY_TEST_EXECUTABLE?[]:[root],env:{...process.env,XPLAY_TEST_PROFILE:temporary}});
 try{
  const window=await app.firstWindow();await window.waitForLoadState('domcontentloaded');await window.evaluate(()=>localStorage.setItem('xplay-language-v1','en'));await window.reload();await window.getByRole('button',{name:'Controls settings'}).waitFor();await window.screenshot({path:out+'/xplay-launcher.png'});
  const info=await window.evaluate(()=>window.xplay.info());assert.equal(info.version,'1.2.0');
  assert.equal(await window.evaluate(()=>typeof window.require),'undefined');
  await window.getByRole('button',{name:'Controls settings'}).click();await window.getByLabel('Name',{exact:true}).fill('QA profile');await window.getByLabel('Mode',{exact:true}).selectOption('keyboard');await window.getByRole('button',{name:'Save',exact:true}).click();await window.getByRole('status').filter({hasText:'Saved'}).waitFor();
  assert.equal((await window.evaluate(()=>window.xplay.profile())).name,'QA profile');await window.screenshot({path:out+'/xplay-controls.png'});
  await app.context().route('https://www.xbox.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body><h1>Controlled Xbox origin fixture</h1><input aria-label="Chat"></body></html>'}));
  const remoteEvent=app.waitForEvent('window');await window.evaluate(()=>window.xplay.openGame('remote'));const remote=await remoteEvent;
  await remote.waitForFunction(()=>Boolean(window.__xplayControls));
  assert.equal(await remote.evaluate(()=>typeof window.require),'undefined');assert.equal(await remote.evaluate(()=>typeof window.xplay),'undefined');
  assert.equal(await remote.evaluate(()=>Array.from(navigator.getGamepads()).some(pad=>pad?.id==='X Play keyboard and mouse')),true);
  await remote.evaluate(()=>history.pushState({},'', '/auth/example'));await remote.waitForFunction(()=>!window.__xplayControls);
  await remote.evaluate(()=>history.pushState({},'', '/play/remote'));await remote.waitForFunction(()=>Boolean(window.__xplayControls));
  await remote.close();
  results.push({app:'xplay',scenarios:['real-sandbox-preload-on-controlled-origin','no-remote-node-or-IPC','virtual-pad-in-browser','SPA-route-cleanup'],passed:true});
  await window.getByRole('button',{name:'Close',exact:true}).click();await window.keyboard.press('Enter');await window.waitForTimeout(100);
  results.push({app:'xplay',version:info.version,scenarios:['native-launch','isolated-preload','profile-save'],passed:true});
 }finally{await app.close();}
}finally{fs.rmSync(temporary,{recursive:true,force:true});fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));}
console.log('X Play native launcher and sandbox fixture passed');
