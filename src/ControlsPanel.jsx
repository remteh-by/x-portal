import {useEffect,useState} from 'react'
import {DEFAULT_PROFILE,validateProfile} from '../shared/profile.js'
import {activeProfile,addProfile,copyProfile,removeProfile,selectProfile,updateActiveProfile,validateLibrary,mergeLibrary} from '../shared/profile-library.js'

export default function ControlsPanel({library,onLibraryChange,onSave,onClose,language}) {
 const [draft,setDraft]=useState(()=>activeProfile(library)),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const [pending,setPending]=useState(null),[incoming,setIncoming]=useState(null),[confirmDelete,setConfirmDelete]=useState(false)
 const ru=language==='ru',dirty=JSON.stringify(draft)!==JSON.stringify(activeProfile(library))
 useEffect(()=>{const request=()=>{if(dirty)setPending({close:true});else onClose()};window.addEventListener('xplay:request-close',request);return()=>window.removeEventListener('xplay:request-close',request)},[dirty,onClose])
 async function apply(action,saveDraft=false) {
  setBusy(true);setMessage('')
  try {
   const base=saveDraft?updateActiveProfile(library,validateProfile(draft)):library
   const next=action(base);await onLibraryChange(next)
   setDraft(activeProfile(next));setPending(null);setIncoming(null);setConfirmDelete(false)
   setMessage(ru?'Библиотека сохранена. Выбранный профиль применяется в следующем игровом окне.':'Library saved. The selected profile applies to the next game window.')
  }catch(error){setMessage(error.message)}finally{setBusy(false)}
 }
 function request(action){if(dirty)setPending({action});else void apply(action)}
 function close(){if(dirty)setPending({close:true});else onClose()}
 async function proceed(saveDraft){
  if(!pending?.close){await apply(pending.action,saveDraft);return}
  if(saveDraft){setBusy(true);try{await onSave(validateProfile(draft));onClose()}catch(error){setMessage(error.message)}finally{setBusy(false)}}else onClose()
 }
 async function save(){setBusy(true);setMessage('');try{const checked=validateProfile(draft);await onSave(checked);setDraft(checked);setMessage(ru?'Сохранено. Применится при открытии следующего игрового окна.':'Saved. Applies to the next game window.')}catch(error){setMessage(error.message)}finally{setBusy(false)}}
 async function importFile(event){
  try{
   const file=event.target.files?.[0];if(!file)return
   if(file.size>1024*1024)throw new Error('Maximum library file size: 1 MB')
   const value=JSON.parse(await file.text())
   if(value&&typeof value==='object'&&!Array.isArray(value)&&'profiles' in value)setIncoming({kind:'library',value:validateLibrary(value)})
   else setIncoming({kind:'profile',value:validateProfile(value)})
  }catch(error){setMessage(error.message)}
  event.target.value=''
 }
 function exportFile(all=false){
  try{
   const value=all?updateActiveProfile(library,validateProfile(draft)):validateProfile(draft)
   const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),link=document.createElement('a')
   link.href=url;link.download=all?'xplay-profile-library.json':'xplay-controls.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }catch(error){setMessage(error.message)}
 }
 return <div className="donation-modal"><section className="modal-content controls-modal" role="dialog" aria-modal="true" aria-labelledby="controls-title" aria-busy={busy}><fieldset disabled={busy} className="controls-fields">
  <h2 id="controls-title">{ru?'Профили управления':'Controls profiles'}</h2>
  <p>{ru?'Клавиатура и мышь включаются отдельной кнопкой на игровом экране. Сохранённый выбор действует на следующее игровое окно.':'Enable keyboard and mouse with the button on the game page. Saved selection applies to the next game window.'}</p>
  <div className="profile-library"><label>{ru?'Сохранённые профили':'Saved profiles'}<select aria-label={ru?'Сохранённые профили':'Saved profiles'} disabled={busy} value={library.activeId} onChange={event=>{const id=event.target.value;request(base=>selectProfile(base,id))}}>{library.profiles.map(row=><option key={row.id} value={row.id}>{row.profile.name}</option>)}</select></label>
   <div className="profile-library-actions"><button disabled={busy||library.profiles.length>=50} onClick={()=>request(base=>addProfile(base,DEFAULT_PROFILE,ru?'Новый профиль':'New profile'))}>{ru?'Новый':'New'}</button><button disabled={busy||library.profiles.length>=50} onClick={()=>request(base=>copyProfile(base,ru?' — копия':' copy'))}>{ru?'Копия':'Copy'}</button><button disabled={busy||library.profiles.length<2} onClick={()=>setConfirmDelete(true)}>{ru?'Удалить':'Delete'}</button></div>
  </div>
  {pending&&<div className="profile-warning" role="alert"><p>{ru?'В черновике есть несохранённые изменения.':'The draft contains unsaved changes.'}</p><button disabled={busy} onClick={()=>void proceed(true)}>{ru?'Сохранить и продолжить':'Save and continue'}</button><button disabled={busy} onClick={()=>void proceed(false)}>{ru?'Отменить изменения':'Discard changes'}</button><button disabled={busy} onClick={()=>setPending(null)}>{ru?'Остаться':'Stay here'}</button></div>}
  {confirmDelete&&<div className="profile-warning" role="alert"><p>{ru?`Удалить профиль «${activeProfile(library).name}»?`:`Delete profile “${activeProfile(library).name}”?`}</p><button disabled={busy} onClick={()=>void apply(base=>removeProfile(base,base.activeId))}>{ru?'Подтвердить удаление':'Confirm deletion'}</button><button disabled={busy} onClick={()=>setConfirmDelete(false)}>{ru?'Отмена':'Cancel'}</button></div>}
  {incoming?.kind==='library'&&<div className="profile-warning" role="alert"><p>{ru?`В файле ${incoming.value.profiles.length} профилей. Они добавятся к вашим; существующие профили и активный выбор сохранятся.`:`The file contains ${incoming.value.profiles.length} profiles. Import adds them while keeping your profiles and active selection.`}</p><button disabled={busy} onClick={()=>request(base=>mergeLibrary(base,incoming.value))}>{ru?'Добавить профили':'Add profiles'}</button><button disabled={busy} onClick={()=>setIncoming(null)}>{ru?'Отмена':'Cancel'}</button></div>}
  {incoming?.kind==='profile'&&<div className="profile-warning" role="alert"><p>{ru?`Добавить профиль «${incoming.value.name}»? Режим: ${incoming.value.mode==='physical'?'геймпад':'клавиатура и мышь'}. Запрос микрофона: ${incoming.value.allowMicrophone?'разрешён':'запрещён'}. Выбор применится в следующем игровом окне.`:`Add profile “${incoming.value.name}”? Mode: ${incoming.value.mode}. Microphone requests: ${incoming.value.allowMicrophone?'allowed':'blocked'}. Applies to the next game window.`}</p><button disabled={busy} onClick={()=>request(base=>addProfile(base,incoming.value,incoming.value.name))}>{ru?'Добавить профиль':'Add profile'}</button><button disabled={busy} onClick={()=>setIncoming(null)}>{ru?'Отмена':'Cancel'}</button></div>}
  <label>{ru?'Название':'Name'}<input maxLength={60} value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})}/></label>
  <label>{ru?'Режим':'Mode'}<select aria-label={ru?'Режим':'Mode'} value={draft.mode} onChange={event=>setDraft({...draft,mode:event.target.value})}><option value="physical">{ru?'Физический геймпад':'Physical gamepad'}</option><option value="keyboard">{ru?'Клавиатура и мышь':'Keyboard and mouse'}</option></select></label>
  <label>{ru?'Чувствительность':'Sensitivity'}<input type="number" min=".001" max=".02" step=".001" value={draft.sensitivity} onChange={event=>setDraft({...draft,sensitivity:Number(event.target.value)})}/></label>
  <label><input type="checkbox" checked={draft.invertY} onChange={event=>setDraft({...draft,invertY:event.target.checked})}/>{ru?'Инверсия Y':'Invert Y'}</label>
  <label><input type="checkbox" checked={draft.allowMicrophone} onChange={event=>setDraft({...draft,allowMicrophone:event.target.checked})}/>{ru?'Разрешить запрос микрофона игровому сервису':'Allow the game service to request microphone access'}</label>
  <details className="bindings-details"><summary>{ru?'Назначение клавиш — WASD, кнопки и действия':'Key bindings — WASD, buttons and actions'}</summary><div className="bindings-grid">{Object.entries(draft.bindings).map(([action,code])=><label key={action}>{action}<input value={code} readOnly onKeyDown={event=>{if(event.key==='Tab'||event.key==='Escape')return;event.preventDefault();setDraft({...draft,bindings:{...draft.bindings,[action]:event.code}})}} aria-label={action+' key; focus and press a key'}/></label>)}</div></details>
  <p role="status">{message}</p><div className="controls-actions"><button disabled={busy} onClick={save}>{ru?'Сохранить':'Save'}</button><button onClick={()=>exportFile()}>{ru?'Экспорт профиля':'Export profile'}</button><button onClick={()=>exportFile(true)}>{ru?'Экспорт библиотеки':'Export library'}</button><label className="file-button">{ru?'Импорт JSON':'Import JSON'}<input type="file" accept=".json,application/json" onChange={importFile}/></label><button onClick={()=>{setDraft(validateProfile({...DEFAULT_PROFILE,name:draft.name}));setMessage('')}}>{ru?'По умолчанию':'Defaults'}</button><button onClick={close}>{ru?'Закрыть':'Close'}</button></div>
 </fieldset></section></div>
}
