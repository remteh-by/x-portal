import {startGamepadNavigation} from './gamepad-navigation.js'
import {DEFAULT_PROFILE,validateProfile} from '../shared/profile.js'
import ControlsPanel from './ControlsPanel.jsx'
import { useState, useEffect } from 'react'
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
  const [deviceInfo, setDeviceInfo] = useState({ model: 'macOS', perf: 'balanced', version:'1.1.0' })
  const [profile,setProfile]=useState(()=>validateProfile(DEFAULT_PROFILE))
  const [showControls,setShowControls]=useState(false)
  const [notice,setNotice]=useState('')

  const t = translations[lang]
  const donationUrl = "https://www.paypal.com/donate/?business=simplydestroy@gmail.com&no_recurring=0&currency_code=USD"
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(donationUrl)}`

  useEffect(() => {
    let alive=true
    const stop=startGamepadNavigation(window,document,setGamepadConnected,()=>{
      setShowDonation(false);setShowLanguagePicker(false);setShowControls(false)
    })
    const escape=event=>{if(event.key==='Escape') {
      setShowDonation(false);setShowLanguagePicker(false);setShowControls(false)
    }}
    window.addEventListener('keydown',escape)
    if(window.xplay) {
      window.xplay.profile().then(value=>{if(alive)setProfile(validateProfile(value))}).catch(()=>{if(alive)setNotice('Controls could not be loaded')})
      window.xplay.info().then(info=>{if(alive) {
        setDeviceInfo({model:info.platform+' · '+info.arch,perf:'balanced',version:info.version})
        if(info.profileWarning)setNotice(info.profileWarning)
      }}).catch(()=>{})
    }
    return ()=>{alive=false;stop();window.removeEventListener('keydown',escape)}
  }, [])

  useEffect(() => {
    if (!showDonation && !showLanguagePicker && !showControls) return
    const previous = document.activeElement
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return
    const elements = () => [...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled)')].filter(el=>el.getClientRects().length)
    elements()[0]?.focus()
    const trap = event => {
      if (event.key !== 'Tab') return
      const items = elements()
      const index = items.indexOf(document.activeElement)
      if (!items.length) { event.preventDefault(); return }
      if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus() }
      else if (!event.shiftKey && (index === items.length - 1 || index < 0)) { event.preventDefault(); items[0].focus() }
    }
    document.addEventListener('keydown', trap)
    return () => { document.removeEventListener('keydown',trap); previous?.focus?.() }
  }, [showDonation,showLanguagePicker,showControls])

  const launch = async () => {
    try {
      if(!window.xplay) {setNotice('Open the installed X Play app to start a game.');return}
      await window.xplay.openGame('remote')
    } catch {setNotice('The Xbox page could not be opened. Check your connection and try again.')}
  }
  const saveProfile = async value => {
    if(!window.xplay) throw new Error('Open the installed X Play app to save controls')
    await window.xplay.saveProfile(value);setProfile(value)
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
        <p className="subtitle">{deviceInfo.model} · {deviceInfo.version}</p>
      </header>

      <main className="button-container single-focus">
        <button type="button"
          className="portal-card"
          tabIndex="0"
          onClick={launch}
        >
          <div className="card-icon">🎮</div>
          <h2>{t.remotePlay}</h2>
          <p>{t.remotePlayDesc}</p>
          <div className="selection-indicator"></div>
        </button>
      </main>

      {notice && <p role="status">{notice}</p>}
      <button className="controls-open" onClick={()=>setShowControls(true)}>{lang==='ru'?'Настроить управление':'Controls settings'}</button>
      <footer className="status-bar">
        <div className="status-item">
          <div className={`dot ${gamepadConnected ? 'connected' : ''}`}></div>
          <span className="status-text">{t.gamepad}: {gamepadConnected ? t.connected : t.notFound}</span>
        </div>

        <div className="status-item optimization">
            <div className="dot connected"></div>
            <span className="status-text">{profile.mode === 'physical' ? (lang==='ru'?'Физический геймпад':'Physical gamepad') : (lang==='ru'?'Клавиатура / мышь':'Keyboard / mouse')}</span>
        </div>

        <button type="button"
            className="lang-selector"
            tabIndex="0"
            onClick={toggleLang}
        >
            🌐 {languages.find(l => l.code === lang).name}
        </button>

        <button type="button"
            className="support-btn"
            tabIndex="0"
            onClick={() => setShowDonation(true)}
        >
            ☕ {t.supportDev}
        </button>
      </footer>

      {showLanguagePicker && (
          <div className="donation-modal" onClick={() => setShowLanguagePicker(false)}>
              <div className="modal-content lang-modal" role="dialog" aria-modal="true" aria-label="Language" onClick={(e) => e.stopPropagation()}>
                  <h2>{t.optimization} - {languages.find(l => l.code === lang).name}</h2>
                  <div className="lang-grid">
                      {languages.map((l) => (
                          <button type="button"
                              key={l.code}
                              className={`lang-card ${lang === l.code ? 'active' : ''}`}
                              tabIndex={0}
                              onClick={() => selectLang(l.code)}
                          >
                              {l.name}
                          </button>
                      ))}
                  </div>
                  <button className="close-btn" onClick={() => setShowLanguagePicker(false)}>{t.close}</button>
              </div>
          </div>
      )}

      {showDonation && (
          <div className="donation-modal" onClick={() => setShowDonation(false)}>
              <div className="modal-content" role="dialog" aria-modal="true" aria-label="Support" onClick={(e) => e.stopPropagation()}>
                  <h2>{t.supportDev}</h2>
                  <img src={qrCodeUrl} alt="Donation QR Code" className="qr-code" />
                  <p className="donate-url">paypal.me/simplydestroy</p>
                  <p>{t.donateDesc}</p>
                  <button className="close-btn" onClick={() => setShowDonation(false)}>{t.close}</button>
              </div>
          </div>
      )}

      {showControls && <ControlsPanel profile={profile} onSave={saveProfile} onClose={()=>setShowControls(false)} language={lang}/>}
      <div className="license-bar">
          <p>MIT · X Play {deviceInfo.version}</p>
      </div>
    </div>
  )
}

export default App
