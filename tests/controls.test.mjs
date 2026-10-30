import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import {DEFAULT_PROFILE,validateProfile} from '../shared/profile.js'
import {allowedNavigation,gamePage} from '../electron/navigation.js'
import {startGamepadNavigation} from '../src/gamepad-navigation.js'
import {installVirtualGamepad} from '../electron/virtual-gamepad.js'

test('profiles reject unsupported, ambiguous or injected configuration',()=>{
  assert.deepEqual(validateProfile(DEFAULT_PROFILE),DEFAULT_PROFILE)
  for(const change of [{schema:2},{mode:'mixed'},{sensitivity:NaN},{sensitivity:1},
    {name:''},{allowMicrophone:'yes'},{script:'alert(1)'},
    {bindings:{...DEFAULT_PROFILE.bindings,a:'Escape'}},
    {bindings:{...DEFAULT_PROFILE.bindings,a:'KeyW'}}])
    assert.throws(()=>validateProfile({...DEFAULT_PROFILE,...change}))
})
test('navigation allows only exact HTTPS origins and real game routes',()=>{
  for(const url of ['https://www.xbox.com/play/remote','https://login.live.com/oauth20_authorize.srf']) assert.equal(allowedNavigation(url),true)
  for(const url of ['http://www.xbox.com/play','https://www.xbox.com.evil.test/play','https://xbox.com@evil.test','file:///tmp/index.html','https://xbox.com:8080/play']) assert.equal(allowedNavigation(url),false)
  assert.equal(gamePage('https://www.xbox.com/ru-RU/play/remote'),true)
  assert.equal(gamePage('https://login.live.com/play'),false)
  assert.equal(gamePage('https://www.xbox.com/playground'),false)
})
function scheduler() {
  let id=0;const callbacks=new Map()
  return {requestAnimationFrame(fn){callbacks.set(++id,fn);return id},cancelAnimationFrame(id){callbacks.delete(id)},
    step(now=performance.now()){const entries=[...callbacks.values()];callbacks.clear();for(const callback of entries)callback(now)},get count(){return callbacks.size}}
}
test('navigation survives throttle, empty UI and remount without duplicate confirmations',()=>{
  const frames=scheduler(),pad={connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))}
  let clicks=0,elements=[]
  const doc={hidden:false,hasFocus:()=>true,querySelector:()=>null,querySelectorAll:()=>elements}
  const button={getClientRects:()=>[1],focus(){doc.activeElement=this},click(){clicks++}}
  const win={...frames,navigator:{getGamepads:()=>[pad]}}
  const connected=[];let stop=startGamepadNavigation(win,doc,value=>connected.push(value),()=>{})
  pad.axes[0]=1;frames.step(0);frames.step(16);assert.equal(frames.count,1)
  elements=[button];frames.step(32);assert.equal(doc.activeElement,button)
  pad.buttons[0].pressed=true;frames.step(48);frames.step(64);assert.equal(clicks,1)
  pad.buttons[0].pressed=false;frames.step(80);pad.buttons[0].pressed=true;frames.step(96);assert.equal(clicks,2)
  assert.deepEqual(connected,[true]);stop();assert.equal(frames.count,0)
  stop=startGamepadNavigation(win,doc,()=>{},()=>{});assert.equal(frames.count,1);stop();assert.equal(frames.count,0)
})
function target(extra={}) {
  const listeners=new Map()
  return {addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn)},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn)},
    emit(type,event={}){for(const fn of listeners.get(type)||[])fn({target:this,preventDefault(){},...event})},...extra}
}
test('virtual controller preserves physical pads and neutralizes focus/visibility transitions',()=>{
  const frames=scheduler(),physical={id:'Physical',index:0,axes:[.2,0],buttons:[]}
  const native=()=>[physical,null,null,null],navigator={getGamepads:native}
  const window=target(),body={appendChild(){},requestPointerLock(){document.pointerLockElement=body;document.emit('pointerlockchange')}}
  const document=target({body,hidden:false,hasFocus:()=>true,pointerLockElement:null,
    createElement:()=>target({style:{},remove(){}}),
    exitPointerLock(){this.pointerLockElement=null;this.emit('pointerlockchange')}})
  const context=vm.createContext({window,document,navigator,performance,...frames,profile:{...DEFAULT_PROFILE,mode:'keyboard'}})
  vm.runInContext('('+installVirtualGamepad.toString()+')(profile)',context)
  assert.equal(navigator.getGamepads()[0],physical)
  const virtual=navigator.getGamepads()[1];assert.equal(virtual.index,1)
  body.requestPointerLock();window.emit('keydown',{code:'KeyW'});window.emit('mousedown',{button:0});frames.step()
  assert.equal(virtual.axes[1],-1);assert.equal(virtual.buttons[7].pressed,true)
  window.emit('blur');assert.equal(virtual.axes[1],0);assert.equal(virtual.buttons[7].pressed,false)
  window.emit('keydown',{code:'KeyE',target:{isContentEditable:true}});frames.step();assert.equal(virtual.buttons[2].pressed,false)
  window.emit('keydown',{code:'KeyW'});frames.step();document.hidden=true;document.emit('visibilitychange');assert.equal(virtual.axes[1],0)
  document.hidden=false;document.emit('focusin',{target:{isContentEditable:true}});assert.equal(document.pointerLockElement,null)
  window.__xplayControls.destroy();assert.equal(frames.count,0);assert.equal(navigator.getGamepads,native)
})
