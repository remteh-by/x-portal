import {app,BrowserWindow,ipcMain,session,shell} from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {DEFAULT_PROFILE,validateProfile} from '../shared/profile.js';
import {validateLibrary,libraryFromProfile,activeProfile,updateActiveProfile} from '../shared/profile-library.js';
import {allowedNavigation,gamePage} from './navigation.js';
import {supportDestination} from '../shared/support.js';
const directory=path.dirname(fileURLToPath(import.meta.url));
const indexFile=path.join(directory,'../dist/index.html');
const indexURL=pathToFileURL(indexFile).href;
const remoteWindows=new Set(),windowProfiles=new Map();
let launcher,gameWindow,saveQueue=Promise.resolve(),profileWarning='';
// An explicit QA profile also isolates a packaged candidate from the owner's data.
if(process.env.XPLAY_TEST_PROFILE) app.setPath('userData',path.resolve(process.env.XPLAY_TEST_PROFILE));
const primaryInstance=app.requestSingleInstanceLock();
if(!primaryInstance)app.quit();
app.on('second-instance',()=>{if(launcher&&!launcher.isDestroyed()){if(launcher.isMinimized())launcher.restore();launcher.focus();}});
const profileFile=()=>path.join(app.getPath('userData'),'controls-v1.json');
const libraryFile=()=>path.join(app.getPath('userData'),'controls-library-v1.json');
let libraryCache=null,invalidLibrary=false,libraryRead=null;
async function readLibrary(){if(libraryRead)return libraryRead;libraryRead=readLibraryFile();try{return await libraryRead;}finally{libraryRead=null;}}
async function readLibraryFile(){
 try{
  const stats=await fs.stat(libraryFile());if(stats.size>1024*1024)throw new Error('Library is too large');
  libraryCache=validateLibrary(JSON.parse(await fs.readFile(libraryFile(),'utf8')));invalidLibrary=false;profileWarning='';return libraryCache;
 }catch(error){if(error.code!=='ENOENT'){invalidLibrary=true;profileWarning='Stored profile library could not be read. Its file is preserved.';}}
 if(libraryCache)return libraryCache;
 let profile=DEFAULT_PROFILE;
  try {
    const stats=await fs.stat(profileFile());
    if(stats.size>16384) throw new Error('Invalid profile size');
    profile=validateProfile(JSON.parse(await fs.readFile(profileFile(),'utf8')));
  } catch(error) {
    if(error.code!=='ENOENT')profileWarning='Stored profile could not be read. Standard controls are in use.';
  }
  libraryCache=libraryFromProfile(profile);return libraryCache;
}
async function readProfile(){return activeProfile(await readLibrary());}
function saveLibrary(input){
 const library=validateLibrary(input);
 const operation=saveQueue.catch(()=>{}).then(async()=>{
  await fs.mkdir(app.getPath('userData'),{recursive:true});
  if(invalidLibrary){const backup=libraryFile()+'.unreadable-'+Date.now();await fs.copyFile(libraryFile(),backup,1);await fs.chmod(backup,0o600);}
  const temporary=libraryFile()+'.tmp-'+crypto.randomUUID();
  try{await fs.writeFile(temporary,JSON.stringify(library,null,2),{mode:0o600,flag:'wx'});await fs.rename(temporary,libraryFile());}
  finally{await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
  libraryCache=library;invalidLibrary=false;profileWarning='';return {saved:true,applies:'next-game-window'};
 });
 saveQueue=operation;return operation;
}
function localSender(event) {
  return launcher && !launcher.isDestroyed() && event.sender===launcher.webContents && event.senderFrame?.url===indexURL;
}
function requireLocal(event) {if(!localSender(event)) throw new Error('Untrusted caller');}
function guardRemote(win,profile) {
  const contents=win.webContents;
  remoteWindows.add(contents);windowProfiles.set(contents,profile);
  win.on('closed',()=>{remoteWindows.delete(contents);windowProfiles.delete(contents);});
  const check=(event,url)=>{if(!allowedNavigation(url)) event.preventDefault();};
  win.webContents.on('will-navigate',check);
  win.webContents.on('will-redirect',check);
  win.webContents.setWindowOpenHandler(({url})=>allowedNavigation(url)?{
    action:'allow',overrideBrowserWindowOptions:{webPreferences:{sandbox:true,nodeIntegration:false,
      contextIsolation:true,preload:path.join(directory,'../build-preloads/game.cjs')}}
  }:{action:'deny'});
  win.webContents.on('did-create-window',child=>guardRemote(child,profile));
  contents.on('did-navigate-in-page',(_event,_url,isMainFrame)=>{if(isMainFrame)contents.send('xplay:route');});
}
async function openGame(mode) {
  const targets={remote:'https://www.xbox.com/play/remote',cloud:'https://www.xbox.com/play'};
  if(!Object.hasOwn(targets,mode)) throw new Error('Unknown game mode');
  if(gameWindow && !gameWindow.isDestroyed()) {gameWindow.focus();return {opened:true,reused:true};}
  const selected=await readProfile();
  gameWindow=new BrowserWindow({width:1280,height:720,minWidth:800,minHeight:500,backgroundColor:'#101410',
    webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,
      preload:path.join(directory,'../build-preloads/game.cjs')}});
  guardRemote(gameWindow,selected);
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
if(primaryInstance)app.whenReady().then(()=>{
  ipcMain.handle('xplay:profile',event=>{
    if(!localSender(event) && !(remoteWindows.has(event.sender) && gamePage(event.senderFrame?.url||'')))
      throw new Error('Untrusted caller');
    return localSender(event)?readProfile():windowProfiles.get(event.sender);
  });
  ipcMain.handle('xplay:info',async event=>{
    requireLocal(event);await readProfile();
    return {version:app.getVersion(),platform:process.platform,arch:process.arch,profileWarning};
  });
  ipcMain.handle('xplay:save-profile',(event,input)=>{
    requireLocal(event);const profile=validateProfile(input);
    return readLibrary().then(library=>saveLibrary(updateActiveProfile(library,profile)));
  });
  ipcMain.handle('xplay:library',event=>{requireLocal(event);return readLibrary();});
  ipcMain.handle('xplay:save-library',(event,input)=>{requireLocal(event);return saveLibrary(input);});
  ipcMain.handle('xplay:open-game',(event,mode)=>{requireLocal(event);return openGame(mode);});
  ipcMain.handle('xplay:support',(event,id)=>{requireLocal(event);return shell.openExternal(supportDestination(id));});
  session.defaultSession.setPermissionCheckHandler((contents,permission,_origin,details)=>{
    if(!remoteWindows.has(contents) || !gamePage(contents.getURL()) || !gamePage(details.requestingUrl||''))return false;
    if(permission==='fullscreen' || permission==='pointerLock')return true;
    return permission==='media' && details.mediaType==='audio' && windowProfiles.get(contents)?.allowMicrophone;
  });
  session.defaultSession.setPermissionRequestHandler(async(contents,permission,callback,details)=>{
    const trusted=remoteWindows.has(contents) && gamePage(contents.getURL()) && gamePage(details.requestingUrl||'');
    if(!trusted) {callback(false);return;}
    if(permission==='fullscreen' || permission==='pointerLock') {callback(true);return;}
    if(permission==='media' && details.mediaTypes?.length===1 && details.mediaTypes[0]==='audio') {
      callback(Boolean(windowProfiles.get(contents)?.allowMicrophone));return;
    }
    callback(false);
  });
  createWindow();
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0) createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin') app.quit();});
