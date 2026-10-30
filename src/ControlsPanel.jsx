import {useState} from 'react'
import {DEFAULT_PROFILE,validateProfile} from '../shared/profile.js'

export default function ControlsPanel({profile,onSave,onClose,language}) {
  const [draft,setDraft]=useState(profile)
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const ru=language==='ru'
  async function save() {
    setBusy(true);setMessage('')
    try {
      const checked=validateProfile(draft)
      await onSave(checked)
      setMessage(ru?'Сохранено. Применится при открытии следующего игрового окна.':'Saved. Applies to the next game window.')
    } catch(error) {setMessage(error.message)}
    finally {setBusy(false)}
  }
  async function importFile(event) {
    try {
      const file=event.target.files?.[0]
      if(!file) return
      if(file.size>16384) throw new Error('Profile is too large (maximum 16 KB)')
      setDraft(validateProfile(JSON.parse(await file.text())));setMessage('')
    } catch(error) {setMessage(error.message)}
    event.target.value=''
  }
  function exportFile() {
    try {
      const blob=new Blob([JSON.stringify(validateProfile(draft),null,2)],{type:'application/json'})
      const url=URL.createObjectURL(blob),link=document.createElement('a')
      link.href=url;link.download='xplay-controls.json';link.click()
      setTimeout(()=>URL.revokeObjectURL(url),1000)
    } catch(error) {setMessage(error.message)}
  }
  return <div className="donation-modal">
    <section className="modal-content controls-modal" role="dialog" aria-modal="true" aria-labelledby="controls-title">
      <h2 id="controls-title">{ru?'Профиль управления':'Controls profile'}</h2>
      <p>{ru?'Клавиатура и мышь включаются отдельной кнопкой на игровом экране. Настоящие геймпады сохраняются.':'Enable keyboard and mouse with the button on the game page. Physical controllers stay available.'}</p>
      <label>{ru?'Название':'Name'}<input maxLength={60} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
      <label>{ru?'Режим':'Mode'}<select aria-label={ru?"Режим":"Mode"} value={draft.mode} onChange={e=>setDraft({...draft,mode:e.target.value})}>
        <option value="physical">{ru?'Физический геймпад':'Physical gamepad'}</option>
        <option value="keyboard">{ru?'Клавиатура и мышь':'Keyboard and mouse'}</option>
      </select></label>
      <label>{ru?'Чувствительность':'Sensitivity'}<input type="number" min=".001" max=".02" step=".001" value={draft.sensitivity} onChange={e=>setDraft({...draft,sensitivity:Number(e.target.value)})}/></label>
      <label><input type="checkbox" checked={draft.invertY} onChange={e=>setDraft({...draft,invertY:e.target.checked})}/>{ru?'Инверсия Y':'Invert Y'}</label>
      <label><input type="checkbox" checked={draft.allowMicrophone} onChange={e=>setDraft({...draft,allowMicrophone:e.target.checked})}/>{ru?'Разрешить запрос микрофона игровому сервису':'Allow the game service to request microphone access'}</label>
      <div className="bindings-grid">{Object.entries(draft.bindings).map(([action,code])=><label key={action}>{action}
        <input value={code} readOnly onKeyDown={event=>{
          if(event.key==='Tab' || event.key==='Escape') return
          event.preventDefault();setDraft({...draft,bindings:{...draft.bindings,[action]:event.code}})
        }} aria-label={action+' key; focus and press a key'}/>
      </label>)}</div>
      <p role="status">{message}</p>
      <div className="controls-actions">
        <button disabled={busy} onClick={save}>{ru?'Сохранить':'Save'}</button>
        <button onClick={exportFile}>{ru?'Экспорт':'Export'}</button>
        <label className="file-button">{ru?'Импорт':'Import'}<input type="file" accept=".json,application/json" onChange={importFile}/></label>
        <button onClick={()=>{setDraft(validateProfile(DEFAULT_PROFILE));setMessage('')}}>{ru?'По умолчанию':'Defaults'}</button>
        <button onClick={onClose}>{ru?'Закрыть':'Close'}</button>
      </div>
    </section>
  </div>
}
