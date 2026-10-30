const navigationHosts = new Set(['www.xbox.com','xbox.com','login.live.com','account.live.com',
  'login.microsoftonline.com','account.microsoft.com','sisu.xboxlive.com'])
export function allowedNavigation(address) {
  try {
    const url = new URL(address)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && navigationHosts.has(url.hostname)
  } catch { return false }
}
export function gamePage(address) {
  try {
    const url = new URL(address)
    return allowedNavigation(address) && ['www.xbox.com','xbox.com'].includes(url.hostname)
      && /^\/(?:[a-z]{2}-[a-z]{2}\/)?play(?:\/|$)/i.test(url.pathname)
  } catch { return false }
}
