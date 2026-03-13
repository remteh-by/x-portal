import { useState, useEffect, useRef } from 'react'
import { Browser } from '@capacitor/browser'
import './App.css'

const translations = {
  en: {
    title: "X Play macOS",
    subtitle: "Premium Gaming Edition",
    remotePlay: "Remote Play",
    remotePlayDesc: "Play from your console",
    cloudGaming: "Cloud Gaming",
    cloudGamingDesc: "Play from Xbox Game Pass",
    gamepad: "Gamepad",
    connected: "Connected",
    notFound: "Not Found",
    license: "License is free, but rights can be purchased",
    optimization: "System Optimization",
    detected: "Detected",
    perfMode: "Performance Mode",
    smooth: "Ultra Smooth",
    balanced: "Balanced",
    eco: "Max Performance (Lag-Free)",
    supportDev: "Support Developer ($1)",
    donateDesc: "Scan to support the project",
    close: "Close"
  },
  ru: {
    title: "X Play macOS",
    subtitle: "Главный игровой портал",
    remotePlay: "Удалённая игра",
    remotePlayDesc: "Играйте со своей консоли (DualSense + Кл/Мышь)",
    gamepad: "Геймпад",
    connected: "Подключен",
    notFound: "Не найден",
    license: "Лицензия бесплатно, но можно приобрести права",
    optimization: "Оптимизация системы",
    detected: "Определен",
    perfMode: "Режим работы",
    smooth: "Макс. плавность",
    balanced: "Сбалансированный",
    eco: "Макс. производительность",
    supportDev: "Поддержать проект (любая сумма)",
    donateDesc: "Отсканируйте для поддержки проекта",
    close: "Закрыть"
  },
  fr: {
    title: "X Play macOS", subtitle: "Édition Premium", remotePlay: "Jeu à distance", remotePlayDesc: "Jouez depuis votre console",
    cloudGaming: "Cloud Gaming", cloudGamingDesc: "Jouez via Xbox Game Pass", gamepad: "Manette", connected: "Connecté",
    notFound: "Non trouvé", license: "La licence est gratuite, mais les droits peuvent être achetés",
    optimization: "Optimisation du système", detected: "Détecté", perfMode: "Mode Performance", smooth: "Ultra Fluide", balanced: "Équilibré", eco: "Max Perf (Sans Lag)",
    supportDev: "Soutenir l'auteur ($1)", donateDesc: "Scanner pour soutenir", close: "Fermer"
  },
  zh: {
    title: "X Play macOS", subtitle: "旗舰版", remotePlay: "远程游玩", remotePlayDesc: "从您的主机游玩",
    cloudGaming: "云游戏", cloudGamingDesc: "从 Xbox Game Pass 游玩", gamepad: "手柄", connected: "已连接",
    notFound: "未找到", license: "许可证免费，但可以购买权利",
    optimization: "系统优化", detected: "已检测到", perfMode: "性能模式", smooth: "极速流畅", balanced: "均衡", eco: "最高性能 (无延迟)",
    supportDev: "支持开发者 ($1)", donateDesc: "扫描以支持", close: "关闭"
  },
  de: {
    title: "X Play macOS", subtitle: "Premium Edition", remotePlay: "Remote Play", remotePlayDesc: "Spielen von deiner Konsole",
    cloudGaming: "Cloud Gaming", cloudGamingDesc: "Spielen über Xbox Game Pass", gamepad: "Gamepad", connected: "Verbunden",
    notFound: "Nicht gefunden", license: "Die Lizenz ist kostenlos, aber Rechte können erworben werden",
    optimization: "Systemoptimierung", detected: "Erkannt", perfMode: "Leistungsmodus", smooth: "Ultra-Glatt", balanced: "Ausgeglichen", eco: "Max Performance",
    supportDev: "Entwickler unterstützen ($1)", donateDesc: "Scannen zum Unterstützen", close: "Schließen"
  },
  it: {
    title: "X Play macOS", subtitle: "Edizione Premium", remotePlay: "Riproduzione remota", remotePlayDesc: "Gioca dalla tua console",
    cloudGaming: "Cloud Gaming", cloudGamingDesc: "Gioca da Xbox Game Pass", gamepad: "Controller", connected: "Connesso",
    notFound: "Non trovato", license: "La licenza è gratuita, mа i diritti possono essere acquistati",
    optimization: "Ottimizzazione del sistema", detected: "Rilevato", perfMode: "Modalità Performance", smooth: "Ultra Fluido", balanced: "Bilanciato", eco: "Max Performance",
    supportDev: "Supporta l'autore ($1)", donateDesc: "Scansiona per supportare", close: "Chiudi"
  },
  es: {
    title: "X Play macOS", subtitle: "Edición Premium", remotePlay: "Juego remoto", remotePlayDesc: "Juega desde tu consola",
    cloudGaming: "Juego en la nube", cloudGamingDesc: "Juega desde Xbox Game Pass", gamepad: "Mando", connected: "Conectado",
    notFound: "No encontrado", license: "La лицензия бесплатна, но можно приобрести права",
    optimization: "Optimización del sistema", detected: "Detectado", perfMode: "Modo Rendimiento", smooth: "Ultra Fluido", balanced: "Equilibrado", eco: "Max Rendimiento",
    supportDev: "Apoyar al autor ($1)", donateDesc: "Escanear para apoyar", close: "Cerrar"
  }
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' }
]

function App() {
  const [gamepadConnected, setGamepadConnected] = useState(false)
  const [lang, setLang] = useState('en')
  const [showLanguagePicker, setShowLanguagePicker] = useState(false)
  const [showDonation, setShowDonation] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState({ model: 'Android TV', perf: 'balanced' })
  const focusedIndex = useRef(0)

  const t = translations[lang]
  const donationUrl = "https://www.paypal.com/donate/?business=simplydestroy@gmail.com&no_recurring=0&currency_code=USD"
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(donationUrl)}`

  useEffect(() => {
    // Global Hard Key Listener for Remote Control
    const hardKeyHandler = (e) => {
        const key = e.key || e.keyCode
        
        if (key === 'Enter' || e.keyCode === 13 || e.keyCode === 167) {
            const active = document.activeElement
            if (active && active.click) {
                active.click()
            }
        }
        
        if (key === 'Escape' || e.keyCode === 27 || e.keyCode === 4 || e.keyCode === 10009) {
            setShowDonation(false)
            setShowLanguagePicker(false)
        }
    }
    
    window.addEventListener('keydown', hardKeyHandler)

    // Initial device detection
    const ua = navigator.userAgent
    let model = "MacBook M4 (Pro Mode)"
    let perf = "smooth"

    setDeviceInfo({ model, perf })

    const handleConnected = () => setGamepadConnected(true)
    const handleDisconnected = () => setGamepadConnected(false)
    window.addEventListener("gamepadconnected", handleConnected)
    window.addEventListener("gamepaddisconnected", handleDisconnected)

    // GAMEPAD NAVIGATION ENGINE
    let lastButtonPress = 0
    const gamepadLoop = () => {
      const gpas = navigator.getGamepads()
      const gp = gpas.find(g => g !== null && g.id.includes("Xbox")) // Prefer Xbox/Emulated
      
      if (gp) {
        setGamepadConnected(true)
        const now = Date.now()
        if (now - lastButtonPress < 250) return

        const axes = gp.axes
        const buttons = gp.buttons

        let delta = 0
        if (buttons[12].pressed || axes[1] < -0.5) delta = -1 
        if (buttons[13].pressed || axes[1] > 0.5) delta = 1   
        if (buttons[14].pressed || axes[0] < -0.5) delta = -1 
        if (buttons[15].pressed || axes[0] > 0.5) delta = 1  

        if (delta !== 0) {
            const focusables = Array.from(document.querySelectorAll('[tabindex]'))
            const currentFocused = document.activeElement
            const currentIndex = focusables.indexOf(currentFocused)
            
            focusedIndex.current = currentIndex === -1 ? 0 : (currentIndex + delta + focusables.length) % focusables.length
            focusables[focusedIndex.current].focus()
            lastButtonPress = now
        }

        if (buttons[0].pressed) {
            document.activeElement.click()
            lastButtonPress = now
        }

        if (buttons[1].pressed) {
            setShowDonation(false)
            setShowLanguagePicker(false)
            lastButtonPress = now
        }
      }
      requestAnimationFrame(gamepadLoop)
    }
    
    requestAnimationFrame(gamepadLoop)

    setTimeout(() => {
        const first = document.querySelector('.portal-card')
        if (first) first.focus()
    }, 500)

    return () => {
      window.removeEventListener('keydown', hardKeyHandler)
      window.removeEventListener("gamepadconnected", handleConnected)
      window.removeEventListener("gamepaddisconnected", handleDisconnected)
    }
  }, [])

  const launch = (url) => {
    // In Electron, we prefer window.open to trigger the preload script via main.js handler
    window.open(url, '_blank', 'width=1280,height=720')
  }

  const toggleLang = () => {
      setShowLanguagePicker(!showLanguagePicker)
  }
  const selectLang = (code) => {
      setLang(code)
      setShowLanguagePicker(false)
      setTimeout(() => {
        const sel = document.querySelector('.lang-selector')
        if (sel) sel.focus()
      }, 150)
  }

  return (
    <div className={`dashboard perf-${deviceInfo.perf}`}>
      <header>
        <div className="logo-container">
            <div className="xbox-sphere"></div>
            <h1 className="main-title">{t.title}</h1>
        </div>
        <p className="subtitle">{t.subtitle} / {deviceInfo.model}</p>
      </header>

      <main className="button-container single-focus">
        <div 
          className="portal-card" 
          tabIndex="0"
          onClick={() => launch('https://www.xbox.com/play/remote')}
          onKeyDown={(e) => (e.key === 'Enter' || e.keyCode === 13) && launch('https://www.xbox.com/play/remote')}
        >
          <div className="card-icon">🎮</div>
          <h2>{t.remotePlay}</h2>
          <p>{t.remotePlayDesc}</p>
          <div className="selection-indicator"></div>
        </div>
      </main>

      <footer className="status-bar">
        <div className="status-item">
          <div className={`dot ${gamepadConnected ? 'connected' : ''}`}></div>
          <span className="status-text">{t.gamepad}: {gamepadConnected ? t.connected : t.notFound}</span>
        </div>
        
        <div className="status-item optimization">
            <div className="dot connected"></div>
            <span className="status-text">{t.perfMode}: {t[deviceInfo.perf]}</span>
        </div>

        <div 
            className="lang-selector" 
            tabIndex="2"
            onClick={toggleLang}
            onKeyDown={(e) => (e.key === 'Enter' || e.keyCode === 13) && toggleLang()}
        >
            🌐 {languages.find(l => l.code === lang).name}
        </div>

        <div 
            className="support-btn" 
            tabIndex="3" 
            onClick={() => setShowDonation(true)}
            onKeyDown={(e) => (e.key === 'Enter' || e.keyCode === 13) && setShowDonation(true)}
        >
            ☕ {t.supportDev}
        </div>
      </footer>

      {showLanguagePicker && (
          <div className="donation-modal" onClick={() => setShowLanguagePicker(false)}>
              <div className="modal-content lang-modal" onClick={(e) => e.stopPropagation()}>
                  <h2>{t.optimization} - {languages.find(l => l.code === lang).name}</h2>
                  <div className="lang-grid">
                      {languages.map((l, idx) => (
                          <div 
                              key={l.code} 
                              className={`lang-card ${lang === l.code ? 'active' : ''}`}
                              tabIndex={10 + idx}
                              onClick={() => selectLang(l.code)}
                              onKeyDown={(e) => (e.key === 'Enter' || e.keyCode === 13) && selectLang(l.code)}
                          >
                              {l.name}
                          </div>
                      ))}
                  </div>
                  <button className="close-btn" onClick={() => setShowLanguagePicker(false)}>{t.close}</button>
              </div>
          </div>
      )}

      {showDonation && (
          <div className="donation-modal" onClick={() => setShowDonation(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>{t.supportDev}</h2>
                  <img src={qrCodeUrl} alt="Donation QR Code" className="qr-code" />
                  <p className="donate-url">paypal.me/simplydestroy</p>
                  <p>{t.donateDesc}</p>
                  <button className="close-btn" onClick={() => setShowDonation(false)}>{t.close}</button>
              </div>
          </div>
      )}

      <div className="license-bar">
          <p>{t.license}</p>
      </div>
    </div>
  )
}

export default App
