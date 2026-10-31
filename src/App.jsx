import {useEffect, useState} from 'react'
import {startGamepadNavigation} from './gamepad-navigation.js'
import {DEFAULT_PROFILE, validateProfile} from '../shared/profile.js'
import {libraryFromProfile,validateLibrary,activeProfile,updateActiveProfile} from '../shared/profile-library.js'
import ControlsPanel from './ControlsPanel.jsx'
import {copy, languages, initialLanguage} from './copy.js'
import './App.css'
const photo = new URL('../public/devices/xbox.webp', import.meta.url).href
export default function App() {
 const [lang,setLang] = useState(initialLanguage), [dialog,setDialog] = useState(null)
 const [connected,setConnected] = useState(false), [padName,setPadName] = useState('')
 const [info,setInfo] = useState({model:'Preview',version:'1.3.0'})
 const [library,setLibrary] = useState(()=>libraryFromProfile(DEFAULT_PROFILE))
 const [libraryReady,setLibraryReady]=useState(!window.xplay)
 const profile=activeProfile(library)
 const [notice,setNotice] = useState(''), [launching,setLaunching] = useState(false)
 const t = copy[lang]
 useEffect(()=>{
  let alive=true
  const requestClose=()=>{if(document.querySelector('.controls-modal'))window.dispatchEvent(new Event('xplay:request-close'));else setDialog(null)}
  const stop=startGamepadNavigation(window,document,present=>{
   setConnected(present);setPadName(Array.from(navigator.getGamepads?.()||[]).find(pad=>pad?.connected)?.id||'')
  },requestClose)
  const escape=event=>{if(event.key==='Escape')requestClose()}
  window.addEventListener('keydown',escape)
  if(window.xplay){
   const load=window.xplay.library?window.xplay.library():window.xplay.profile().then(libraryFromProfile)
   load.then(value=>{if(alive){setLibrary(validateLibrary(value));setLibraryReady(true)}}).catch(()=>{if(alive)setNotice(copy.en.profileError)})
   window.xplay.info().then(value=>{if(alive){setInfo({model:`${value.platform} · ${value.arch}`,version:value.version});if(value.profileWarning)setNotice(value.profileWarning)}}).catch(()=>{})
  }
  return()=>{alive=false;stop();window.removeEventListener('keydown',escape)}
 },[])
 useEffect(()=>{document.documentElement.lang=lang;try{localStorage.setItem('xplay-language-v1',lang)}catch{/* Selection still works. */}},[lang])
 useEffect(()=>{
  if(!dialog)return
  const previous=document.activeElement, element=document.querySelector('[role="dialog"]')
  if(!element)return
  const items=()=>[...element.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary')].filter(item=>item.getClientRects().length)
  items()[0]?.focus()
  const trap=event=>{
   if(event.key!=='Tab')return
   const elements=items(),index=elements.indexOf(document.activeElement)
   if(!elements.length){event.preventDefault();return}
   if(event.shiftKey&&index<=0){event.preventDefault();elements.at(-1).focus()}
   else if(!event.shiftKey&&(index<0||index===elements.length-1)){event.preventDefault();elements[0].focus()}
  }
  document.addEventListener('keydown',trap)
  return()=>{document.removeEventListener('keydown',trap);previous?.focus?.()}
 },[dialog])
 async function launch(){
  if(!window.xplay){setNotice(t.installed);return}
  setLaunching(true);setNotice('')
  try{await window.xplay.openGame('remote')}catch{setNotice(t.launchError)}finally{setLaunching(false)}
 }
 async function saveLibrary(value){if(!window.xplay?.saveLibrary)throw new Error(t.installed);const checked=validateLibrary(value);await window.xplay.saveLibrary(checked);setLibrary(checked)}
 async function saveProfile(value){await saveLibrary(updateActiveProfile(library,validateProfile(value)))}
 return <div className="dashboard">
  <header className="app-header"><div className="brand"><span className="brand-mark" aria-hidden="true">X</span><span>X Play</span></div><nav aria-label={t.settings}><button className="lang-selector" onClick={()=>setDialog('language')} aria-haspopup="dialog">{languages.find(item=>item.code===lang).name} <span aria-hidden="true">⌄</span></button><button className="controls-open" disabled={!libraryReady} onClick={()=>setDialog('controls')}>{t.controls}</button></nav></header>
  <main><section className="play-hero" aria-labelledby="play-title"><div className="hero-copy"><h1 id="play-title">{t.line1}<br/>{t.line2}</h1><p className="hero-description">{t.description}</p><button className="launch-button" onClick={launch} disabled={launching||!libraryReady}>{launching?t.opening:t.launch} <span aria-hidden="true">↗︎</span></button><button className="secondary-button" disabled={!libraryReady} onClick={()=>setDialog('controls')}>{t.configure}</button><p className="hero-note">{t.account}</p></div><figure className="device-photo"><img src={photo} alt="Xbox Series Wireless Controller · Carbon Black" width="1400" height="1050" fetchPriority="high"/><figcaption>Xbox Series Wireless Controller · Carbon Black <button className="text-button" onClick={()=>setDialog('credits')}>{t.photo}</button></figcaption></figure></section>
  {notice&&<p role="status" className="notice">{notice}<button onClick={()=>setNotice('')} aria-label={t.close}>×</button></p>}
  <section className="connection-rail" aria-label={t.connection}><div className="connection-item"><h2>{t.controller}</h2><strong><span className={`dot ${connected?'connected':''}`} aria-hidden="true"/>{connected?t.connected:t.disconnected}</strong><p>{connected?padName:t.connectHint}</p></div><div className="connection-item"><h2>{t.mode}</h2><strong>{profile.mode==='physical'?t.physical:t.keyboard}</strong><p>{profile.name}</p><button className="text-button" disabled={!libraryReady} onClick={()=>setDialog('controls')}>{t.change} →</button></div><div className="connection-item"><h2>{t.how}</h2><ol>{t.steps.map(step=><li key={step}>{step}</li>)}</ol></div></section></main>
  <footer className="app-footer"><span>RemTeh · X Play {info.version} <span className="platform">· {info.model}</span></span><button className="text-button" onClick={()=>setDialog('support')}>{t.support} ↗︎</button></footer>
  {dialog==='controls'&&<ControlsPanel library={library} onLibraryChange={saveLibrary} onSave={saveProfile} onClose={()=>setDialog(null)} language={lang}/>}
  {dialog&&dialog!=='controls'&&<div className="donation-modal" onClick={()=>setDialog(null)}><section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={event=>event.stopPropagation()}><div className="dialog-header"><h2 id="dialog-title">{dialog==='language'?t.language:dialog==='credits'?t.photo:t.support}</h2><button onClick={()=>setDialog(null)} aria-label={t.close}>×</button></div>
  {dialog==='language'&&<div className="lang-grid">{languages.map(item=><button key={item.code} lang={item.code} aria-pressed={lang===item.code} onClick={()=>{setLang(item.code);setDialog(null)}}>{item.name}</button>)}</div>}
  {dialog==='credits'&&<><p>Xbox Series Wireless Controller · Carbon Black</p><p>uKER · CC BY-SA 4.0</p><p>{t.photoNote}</p><p className="source-address">commons.wikimedia.org/wiki/File:Xbox_Series_Controller_Carbon_Black.jpg</p><p>creativecommons.org/licenses/by-sa/4.0/</p></>}
  {dialog==='support'&&<><p>{t.supportNote}</p><p className="source-address">ko-fi.com/pavelzayats</p><button className="launch-button" onClick={async()=>{try{if(!window.xplay?.support)throw new Error();await window.xplay.support()}catch{setNotice(t.installed);setDialog(null)}}}>{t.openSupport} ↗︎</button></>}
  <button className="close-btn" onClick={()=>setDialog(null)}>{t.close}</button></section></div>}
 </div>
}
