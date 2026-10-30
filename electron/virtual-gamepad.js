// This self-contained function is serialized into a trusted Xbox game page.
// It exposes no Electron APIs and never replaces a physical controller.
export function installVirtualGamepad(profile) {
  window.__xplayControls?.destroy()
  if (profile.mode !== 'keyboard') return {mode:'physical'}
  const nativeDescriptor = Object.getOwnPropertyDescriptor(navigator, 'getGamepads')
  const nativeGetGamepads = navigator.getGamepads.bind(navigator)
  const keys = new Set(), buttons = Array.from({length:17}, () => ({pressed:false,touched:false,value:0}))
  const axes = [0,0,0,0], listeners = []
  let frame, stopped = false, deltaX = 0, deltaY = 0, stamp = performance.now()
  let slot = 0, locked = false
  const pad = {axes,buttons,connected:true,mapping:'standard',id:'X Play keyboard and mouse',
    get index(){return slot},get timestamp(){return stamp}}
  const buttonMap = {a:0,b:1,x:2,y:3,lb:4,rb:5,view:8,menu:9,l3:10,r3:11}
  function reset() {
    keys.clear(); axes.fill(0); deltaX = deltaY = 0
    for (const button of buttons) {button.pressed = button.touched = false;button.value = 0}
    stamp = performance.now()
  }
  function editable(target) {
    return target?.isContentEditable || Boolean(target?.closest?.('input,textarea,select,[role="textbox"],[contenteditable="true"]'))
  }
  function listen(target, name, handler) {
    target.addEventListener(name, handler);listeners.push([target,name,handler])
  }
  function setButton(index, value) {
    buttons[index].pressed = buttons[index].touched = value
    buttons[index].value = value ? 1 : 0
  }
  const activate = document.createElement('button')
  activate.textContent = 'X Play: enable keyboard / mouse'
  activate.type = 'button'
  activate.style.cssText = 'position:fixed;right:12px;top:12px;z-index:2147483647;padding:12px;border:1px solid #83d84c;border-radius:8px;background:#121a10;color:white;font:14px system-ui;cursor:pointer'
  activate.addEventListener('click', () => {
    try {
      const result = document.body.requestPointerLock()
      result?.catch?.(() => {activate.textContent='Mouse capture unavailable. Click to retry.'})
    } catch {activate.textContent='Mouse capture unavailable. Click to retry.'}
  })
  document.body.appendChild(activate)
  listen(window,'keydown', event => {
    if (!locked || editable(event.target)) return
    if (Object.values(profile.bindings).includes(event.code)) {keys.add(event.code);event.preventDefault()}
  })
  listen(window,'keyup', event => {keys.delete(event.code)})
  listen(window,'mousedown', event => {
    if (!locked || editable(event.target)) return
    if (event.button === 0) setButton(7,true)
    if (event.button === 2) setButton(6,true)
  })
  listen(window,'mouseup', event => {
    if (event.button === 0) setButton(7,false)
    if (event.button === 2) setButton(6,false)
  })
  listen(window,'mousemove', event => {
    if (locked) {deltaX += event.movementX;deltaY += event.movementY}
  })
  listen(window,'contextmenu', event => {if(locked) event.preventDefault()})
  listen(window,'blur', reset)
  listen(window,'pagehide', reset)
  listen(document,'focusin', event => {
    if(editable(event.target)) {
      reset()
      if(document.pointerLockElement === document.body) document.exitPointerLock()
    }
  })
  listen(document,'visibilitychange', () => {if(document.hidden) reset()})
  listen(document,'pointerlockchange', () => {
    locked = document.pointerLockElement === document.body
    activate.hidden = locked
    if (!locked) reset()
  })
  Object.defineProperty(navigator,'getGamepads',{configurable:true,value() {
    const physical = Array.from(nativeGetGamepads())
    slot = physical.findIndex(value => !value)
    if (slot < 0) slot = physical.length
    physical[slot] = pad
    return physical
  }})
  function loop() {
    if(stopped) return
    frame = requestAnimationFrame(loop)
    if (!locked || document.hidden || !document.hasFocus()) {reset();return}
    const down = action => keys.has(profile.bindings[action])
    axes[0] = Number(down('right')) - Number(down('left'))
    axes[1] = Number(down('down')) - Number(down('up'))
    axes[2] = Math.max(-1,Math.min(1,deltaX * profile.sensitivity))
    axes[3] = Math.max(-1,Math.min(1,deltaY * profile.sensitivity * (profile.invertY ? -1 : 1)))
    deltaX = deltaY = 0
    for (const [action,index] of Object.entries(buttonMap)) setButton(index,down(action))
    stamp = performance.now()
  }
  frame = requestAnimationFrame(loop)
  window.__xplayControls = {
    reset,
    destroy() {
      stopped = true;cancelAnimationFrame(frame);reset();activate.remove()
      if(document.pointerLockElement === document.body) document.exitPointerLock()
      for(const [target,name,handler] of listeners) target.removeEventListener(name,handler)
      if(nativeDescriptor) Object.defineProperty(navigator,'getGamepads',nativeDescriptor)
      else delete navigator.getGamepads
      delete window.__xplayControls
    },
  }
  return {mode:'keyboard',physicalControllersPreserved:true}
}
