import {app,BrowserWindow,ipcMain,session,shell} from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {DEFAULT_PROFILE,validateProfile} from '../shared/profile.js';
import {allowedNavigation,gamePage} from './navigation.js';
const directory=path.dirname(fileURLToPath(import.meta.url));
const indexFile=path.join(directory,'../dist/index.html');
const indexURL=pathToFileURL(indexFile).href;
const remoteWindows=new Set();
let launcher,gameWindow,saveQueue=Promise.resolve(),profileWarning='',currentProfile=DEFAULT_PROFILE;
// An explicit QA profile also isolates a packaged candidate from the owner's data.
if(process.env.XPLAY_TEST_PROFILE) app.setPath('userData',path.resolve(process.env.XPLAY_TEST_PROFILE));
const profileFile=()=>path.join(app.getPath('userData'),'controls-v1.json');
async function readProfile() {
  try {
    const stats=await fs.stat(profileFile());
    if(stats.size>16384) throw new Error('Invalid profile size');
    const profile=validateProfile(JSON.parse(await fs.readFile(profileFile(),'utf8')));
    profileWarning='';currentProfile=profile;return profile;
  } catch(error) {
    profileWarning=error.code==='ENOENT'?'':'Stored profile could not be read. Standard controls are in use.';
    currentProfile=validateProfile(DEFAULT_PROFILE);return currentProfile;
  }
}
function localSender(event) {
  return launcher && !launcher.isDestroyed() && event.sender===launcher.webContents && event.senderFrame?.url===indexURL;
}
function requireLocal(event) {if(!localSender(event)) throw new Error('Untrusted caller');}
function guardRemote(win) {
  const contents=win.webContents;
  remoteWindows.add(contents);
  win.on('closed',()=>remoteWindows.delete(contents));
  const check=(event,url)=>{if(!allowedNavigation(url)) event.preventDefault();};
  win.webContents.on('will-navigate',check);
  win.webContents.on('will-redirect',check);
  win.webContents.setWindowOpenHandler(({url})=>allowedNavigation(url)?{
    action:'allow',overrideBrowserWindowOptions:{webPreferences:{sandbox:true,nodeIntegration:false,
      contextIsolation:true,preload:path.join(directory,'../build-preloads/game.cjs')}}
  }:{action:'deny'});
  win.webContents.on('did-create-window',child=>guardRemote(child));
  contents.on('did-navigate-in-page',(_event,_url,isMainFrame)=>{if(isMainFrame)contents.send('xplay:route');});
}
async function openGame(mode) {
  const targets={remote:'https://www.xbox.com/play/remote',cloud:'https://www.xbox.com/play'};
  if(!Object.hasOwn(targets,mode)) throw new Error('Unknown game mode');
  if(gameWindow && !gameWindow.isDestroyed()) {gameWindow.focus();return {opened:true,reused:true};}
  gameWindow=new BrowserWindow({width:1280,height:720,minWidth:800,minHeight:500,backgroundColor:'#101410',
    webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,
      preload:path.join(directory,'../build-preloads/game.cjs')}});
  guardRemote(gameWindow);
  gameWindow.on('closed',()=>{gameWindow=null;});
  const openedWindow=gameWindow;
  try {await openedWindow.loadURL(targets[mode]);}
  catch(error) {
    // A later navigation can cancel the initial load during sign-in.
    if(error.code!=='ERR_ABORTED') {
      if(!openedWindow.isDestroyed())openedWindow.close();
      throw new Error('The Xbox page could not be loaded. Check the connection and try again.');
    }
  }
  return {opened:true,reused:false};
}
function createWindow() {
  launcher=new BrowserWindow({width:1280,height:760,minWidth:720,minHeight:520,backgroundColor:'#101410',
    webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,
      preload:path.join(directory,'../build-preloads/app.cjs')}});
  launcher.webContents.on('will-navigate',event=>event.preventDefault());
  launcher.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  launcher.loadFile(indexFile);
}
app.whenReady().then(()=>{
  ipcMain.handle('xplay:profile',event=>{
    if(!localSender(event) && !(remoteWindows.has(event.sender) && gamePage(event.senderFrame?.url||'')))
      throw new Error('Untrusted caller');
    return readProfile();
  });
  ipcMain.handle('xplay:info',async event=>{
    requireLocal(event);await readProfile();
    return {version:app.getVersion(),platform:process.platform,arch:process.arch,profileWarning};
  });
  ipcMain.handle('xplay:save-profile',(event,input)=>{
    requireLocal(event);const profile=validateProfile(input);
    const operation=saveQueue.catch(()=>{}).then(async()=>{
      await fs.mkdir(app.getPath('userData'),{recursive:true});
      await fs.writeFile(profileFile()+'.tmp',JSON.stringify(profile,null,2),{mode:0o600});
      await fs.rename(profileFile()+'.tmp',profileFile());
      profileWarning='';currentProfile=profile;return {saved:true,applies:'next-game-window'};
    });
    saveQueue=operation;return operation;
  });
  ipcMain.handle('xplay:open-game',(event,mode)=>{requireLocal(event);return openGame(mode);});
  ipcMain.handle('xplay:support',event=>{requireLocal(event);return shell.openExternal('https://ko-fi.com/pavelzayats');});
  session.defaultSession.setPermissionCheckHandler((contents,permission,_origin,details)=>{
    if(!remoteWindows.has(contents) || !gamePage(contents.getURL()) || !gamePage(details.requestingUrl||''))return false;
    if(permission==='fullscreen' || permission==='pointerLock')return true;
    return permission==='media' && details.mediaType==='audio' && currentProfile.allowMicrophone;
  });
  session.defaultSession.setPermissionRequestHandler(async(contents,permission,callback,details)=>{
    const trusted=remoteWindows.has(contents) && gamePage(contents.getURL()) && gamePage(details.requestingUrl||'');
    if(!trusted) {callback(false);return;}
    if(permission==='fullscreen' || permission==='pointerLock') {callback(true);return;}
    if(permission==='media' && details.mediaTypes?.length===1 && details.mediaTypes[0]==='audio') {
      const profile=await readProfile();callback(profile.allowMicrophone);return;
    }
    callback(false);
  });
  createWindow();
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0) createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin') app.quit();});
