export const DEFAULT_PROFILE = Object.freeze({
  schema: 1, name: 'Standard', mode: 'physical', sensitivity: 0.004,
  invertY: false, allowMicrophone: false,
  bindings: {up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',a:'Space',b:'KeyQ',
    x:'KeyE',y:'KeyR',lb:'KeyF',rb:'KeyG',view:'Tab',menu:'Enter',l3:'ShiftLeft',r3:'ControlLeft'},
})
const codes = /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Tab|Enter|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right))$/
export function validateProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schema !== 1)
    throw new Error('Unsupported controls profile')
  const allowed = Object.keys(DEFAULT_PROFILE)
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error('Unknown profile field')
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 60
      || [...value.name].some(char => char.charCodeAt(0) < 32)) throw new Error('Invalid profile name')
  if (!['physical','keyboard'].includes(value.mode)) throw new Error('Choose an input mode')
  if (typeof value.sensitivity !== 'number' || !Number.isFinite(value.sensitivity)
      || value.sensitivity < 0.001 || value.sensitivity > 0.02) throw new Error('Sensitivity must be 0.001–0.02')
  if (typeof value.invertY !== 'boolean' || typeof value.allowMicrophone !== 'boolean')
    throw new Error('Invalid controls option')
  const bindings = value.bindings
  const actions = Object.keys(DEFAULT_PROFILE.bindings)
  if (!bindings || typeof bindings !== 'object' || Array.isArray(bindings)
      || Object.keys(bindings).length !== actions.length
      || Object.keys(bindings).some(key => !actions.includes(key)))
    throw new Error('Invalid key bindings')
  for (const action of actions)
    if (typeof bindings[action] !== 'string' || !codes.test(bindings[action])) throw new Error('Invalid key code')
  if (new Set(Object.values(bindings)).size !== actions.length) throw new Error('Each action needs a different key')
  return {schema:1,name:value.name.trim(),mode:value.mode,sensitivity:value.sensitivity,
    invertY:value.invertY,allowMicrophone:value.allowMicrophone,bindings:{...bindings}}
}
