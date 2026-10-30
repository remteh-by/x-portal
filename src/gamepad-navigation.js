export function startGamepadNavigation(win, doc, onConnected, onBack) {
  let frame, disposed = false, lastAction = -Infinity, lastDirection = 0
  let confirmHeld = false, backHeld = false, connected = null
  const pressed = (pad, index) => Boolean(pad.buttons?.[index]?.pressed)
  function loop(now) {
    if (disposed) return
    frame = win.requestAnimationFrame(loop)
    const pad = Array.from(win.navigator.getGamepads?.() || []).find(p => p?.connected !== false && p)
    const present = Boolean(pad)
    if (present !== connected) { connected = present; onConnected(present) }
    if (!pad || doc.hidden || !doc.hasFocus()) {
      confirmHeld = backHeld = false; lastDirection = 0
      return
    }
    const root = doc.querySelector('[role="dialog"]') || doc
    const elements = Array.from(root.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]'))
      .filter(el => !el.hidden && el.getClientRects().length)
    const direction = pressed(pad,12) || pressed(pad,14) || pad.axes?.[1] < -.5 || pad.axes?.[0] < -.5 ? -1
      : pressed(pad,13) || pressed(pad,15) || pad.axes?.[1] > .5 || pad.axes?.[0] > .5 ? 1 : 0
    if (direction && elements.length && (direction !== lastDirection || now - lastAction >= 250)) {
      const index = elements.indexOf(doc.activeElement)
      elements[index < 0 ? 0 : (index + direction + elements.length) % elements.length].focus()
      lastAction = now
    }
    lastDirection = direction
    const confirm = pressed(pad,0), back = pressed(pad,1)
    if (confirm && !confirmHeld && elements.includes(doc.activeElement)) doc.activeElement.click()
    if (back && !backHeld) onBack()
    confirmHeld = confirm; backHeld = back
  }
  frame = win.requestAnimationFrame(loop)
  return () => { disposed = true; win.cancelAnimationFrame(frame) }
}
