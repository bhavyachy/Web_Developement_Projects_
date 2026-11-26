/* ==========================================================================
   MERIDIAN NATIONAL BANK — ATM TERMINAL SIMULATOR ENGINE (app.js)
   Handles EMV card lifecycle, EPP keypad, soft-key routing, cassette
   dispensing logic, ISO-8583 audit telemetry, Web Audio synthesis, and state.
   ========================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'mnb_atm_simulator_v1';
  const TERMINAL_ID = 'MNB-4092';
  const MAX_CASSETTE_CAP = 50;
  const SESSION_TIMEOUT_SEC = 120;

  /* ------------------------------------------------------------------------
     TRANSLATIONS (EN / ES / FR / HI)
     ------------------------------------------------------------------------ */
  const I18N = {
    EN: {
      welcomeTitle: 'WELCOME TO MERIDIAN BANK',
      welcomeSub: 'Insert your EMV chip card or tap the contactless reader to begin.',
      insertPrompt: 'INSERT CARD OR SELECT FROM WALLET',
      tapNfc: 'TAP CONTACTLESS NFC',
      chipReading: 'READING EMV CHIP...',
      chipSub: 'Authenticating card cryptographic application (AID A0000000031010). Do not remove card.',
      pinTitle: 'ENTER YOUR 4-DIGIT PIN',
      pinSub: 'Use the encrypted keypad below or your keyboard. Shield your PIN from view.',
      menuTitle: 'SELECT TRANSACTION',
      menuSub: 'Choose a banking service using the screen buttons or side bezel keys.',
      withdraw: 'Cash Withdrawal',
      fastCash: 'Fast Cash',
      balance: 'Balance Inquiry',
      miniStmt: 'Mini Statement',
      deposit: 'Cash Deposit',
      transfer: 'Funds Transfer',
      changePin: 'Change PIN',
      ejectCard: 'Return Card',
      backMenu: 'Main Menu',
      cancel: 'Cancel',
      confirm: 'Confirm',
      printReceipt: 'Print Receipt',
      noReceipt: 'Continue (No Slip)',
      anotherTx: 'Another Transaction',
      takeCash: 'Collect Cash Below',
      sessionEnded: 'TRANSACTION COMPLETE',
      cardReturned: 'Please retrieve your card from the reader slot. Thank you for banking with Meridian.'
    },
    ES: {
      welcomeTitle: 'BIENVENIDO A MERIDIAN BANK',
      welcomeSub: 'Inserte su tarjeta con chip EMV o acerque al lector sin contacto.',
      insertPrompt: 'INSERTAR TARJETA DESDE CARTERA',
      tapNfc: 'PAGO SIN CONTACTO NFC',
      chipReading: 'LEYENDO CHIP EMV...',
      chipSub: 'Autenticando aplicación criptográfica. No retire su tarjeta.',
      pinTitle: 'INGRESE SU PIN DE 4 DÍGITOS',
      pinSub: 'Use el teclado cifrado o su teclado físico.',
      menuTitle: 'SELECCIONE OPERACIÓN',
      menuSub: 'Elija una opción con los botones o teclas laterales.',
      withdraw: 'Retiro de Efectivo',
      fastCash: 'Retiro Rápido',
      balance: 'Consulta de Saldo',
      miniStmt: 'Últimos Movimientos',
      deposit: 'Depósito en Efectivo',
      transfer: 'Transferencia',
      changePin: 'Cambiar PIN',
      ejectCard: 'Devolver Tarjeta',
      backMenu: 'Menú Principal',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      printReceipt: 'Imprimir Recibo',
      noReceipt: 'Continuar (Sin Recibo)',
      anotherTx: 'Otra Operación',
      takeCash: 'Retire su Efectivo',
      sessionEnded: 'OPERACIÓN COMPLETADA',
      cardReturned: 'Por favor retire su tarjeta de la ranura. Gracias por usar Meridian.'
    },
    FR: {
      welcomeTitle: 'BIENVENUE CHEZ MERIDIAN BANK',
      welcomeSub: 'Insérez votre carte à puce EMV ou utilisez le lecteur sans contact.',
      insertPrompt: 'INSÉRER UNE CARTE',
      tapNfc: 'LECTEUR SANS CONTACT NFC',
      chipReading: 'LECTURE PUCE EMV...',
      chipSub: 'Authentification cryptographique en cours. Ne retirez pas la carte.',
      pinTitle: 'SAISISSEZ VOTRE CODE PIN',
      pinSub: 'Utilisez le clavier chiffré ci-dessous ou votre clavier.',
      menuTitle: 'CHOISISSEZ UNE OPÉRATION',
      menuSub: 'Sélectionnez une option via les touches latérales.',
      withdraw: 'Retrait Espèces',
      fastCash: 'Retrait Rapide',
      balance: 'Consultation Solde',
      miniStmt: 'Mini Relevé',
      deposit: 'Dépôt Espèces',
      transfer: 'Virement',
      changePin: 'Changer le PIN',
      ejectCard: 'Restituer la Carte',
      backMenu: 'Menu Principal',
      cancel: 'Annuler',
      confirm: 'Valider',
      printReceipt: 'Imprimer Reçu',
      noReceipt: 'Continuer (Sans Reçu)',
      anotherTx: 'Autre Opération',
      takeCash: 'Prenez Vos Billets',
      sessionEnded: 'OPÉRATION TERMINÉE',
      cardReturned: 'Veuillez récupérer votre carte. Merci de votre confiance.'
    },
    HI: {
      welcomeTitle: 'मेरिडियन बैंक में आपका स्वागत है',
      welcomeSub: 'कृपया अपना EMV चिप कार्ड डालें या कॉन्टैक्टलेस रीडर पर टैप करें।',
      insertPrompt: 'वॉलेट से कार्ड डालें',
      tapNfc: 'NFC कॉन्टैक्टलेस टैप',
      chipReading: 'EMV चिप पढ़ी जा रही है...',
      chipSub: 'कार्ड सुरक्षा सत्यापन जारी है। कृपया कार्ड न निकालें।',
      pinTitle: 'अपना 4-अंकीय पिन दर्ज करें',
      pinSub: 'नीचे दिए गए एन्क्रिप्टेड कीपैड का उपयोग करें।',
      menuTitle: 'लेन-देन चुनें',
      menuSub: 'स्क्रीन या साइड बटन का उपयोग करके सेवा चुनें।',
      withdraw: 'नकद निकासी',
      fastCash: 'फास्ट कैश',
      balance: 'बैलेंस पूछताछ',
      miniStmt: 'मिनी स्टेटमेंट',
      deposit: 'नकद जमा',
      transfer: 'फंड ट्रांसफर',
      changePin: 'पिन बदलें',
      ejectCard: 'कार्ड वापस लें',
      backMenu: 'मुख्य मेनू',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      printReceipt: 'रसीद प्रिंट करें',
      noReceipt: 'बिना रसीद आगे बढ़ें',
      anotherTx: 'अन्य लेन-देन',
      takeCash: 'नीचे से नकदी प्राप्त करें',
      sessionEnded: 'लेन-देन पूर्ण हुआ',
      cardReturned: 'कृपया कार्ड स्लॉट से अपना कार्ड वापस लें। धन्यवाद।'
    }
  };

  /* ------------------------------------------------------------------------
     FACTORY DEFAULT DATA
     ------------------------------------------------------------------------ */
  function createDefaultData() {
    return {
      cassettes: {
        100: 25,
        50: 30,
        20: 40,
        10: 35
      },
      depositEscrow: 640,
      paperLevel: 94,
      receipts: [],
      cards: [
        {
          id: 'card-plat',
          tier: 'Meridian Platinum Debit',
          network: 'VISA',
          holder: 'ELENA VANCE',
          pan: '4532891044214821',
          last4: '4821',
          expiry: '09/29',
          pin: '1984',
          dailyLimit: 1000,
          dailyUsed: 120,
          failedAttempts: 0,
          locked: false,
          accounts: {
            checking: {
              number: 'CHK-8840-4821',
              label: 'Checking (•••• 4821)',
              balance: 4850.00,
              ledger: [
                { id: 'TXN94018', date: '2026-11-25 18:14', desc: 'POS WHOLE FOODS #104', type: 'DR', amount: 86.40, balance: 4850.00 },
                { id: 'TXN93982', date: '2026-11-24 09:00', desc: 'ACH PAYROLL DEPOSIT', type: 'CR', amount: 2450.00, balance: 4936.40 },
                { id: 'TXN93905', date: '2026-11-22 14:32', desc: 'ATM WDL MNB-1108', type: 'DR', amount: 120.00, balance: 2486.40 },
                { id: 'TXN93811', date: '2026-11-20 11:08', desc: 'CITY WATER UTILITY', type: 'DR', amount: 64.15, balance: 2606.40 },
                { id: 'TXN93740', date: '2026-11-18 16:45', desc: 'ONLINE XFER FROM SAV', type: 'CR', amount: 500.00, balance: 2670.55 }
              ]
            },
            savings: {
              number: 'SAV-3109-9034',
              label: 'Savings (•••• 9034)',
              balance: 18420.50,
              ledger: [
                { id: 'TXN93741', date: '2026-11-18 16:45', desc: 'ONLINE XFER TO CHK', type: 'DR', amount: 500.00, balance: 18420.50 },
                { id: 'TXN93501', date: '2026-11-01 00:05', desc: 'MONTHLY INTEREST CR', type: 'CR', amount: 48.20, balance: 18920.50 }
              ]
            }
          }
        },
        {
          id: 'card-biz',
          tier: 'Meridian Premier Business',
          network: 'MASTERCARD',
          holder: 'MARCUS CHEN',
          pan: '5412750039187710',
          last4: '7710',
          expiry: '04/30',
          pin: '4321',
          dailyLimit: 2500,
          dailyUsed: 0,
          failedAttempts: 0,
          locked: false,
          accounts: {
            checking: {
              number: 'BIZ-6021-7710',
              label: 'Biz Checking (•••• 7710)',
              balance: 12640.00,
              ledger: [
                { id: 'TXN88120', date: '2026-11-25 15:20', desc: 'CLIENT WIRE #4489', type: 'CR', amount: 4200.00, balance: 12640.00 },
                { id: 'TXN88054', date: '2026-11-23 10:12', desc: 'FEDEX LOGISTICS INV', type: 'DR', amount: 318.75, balance: 8440.00 },
                { id: 'TXN87990', date: '2026-11-21 17:04', desc: 'CLOUD HOSTING AUTOPAY', type: 'DR', amount: 189.00, balance: 8758.75 }
              ]
            },
            savings: {
              number: 'RES-9902-1180',
              label: 'Treasury Reserve (•••• 1180)',
              balance: 45000.00,
              ledger: [
                { id: 'TXN87500', date: '2026-11-01 00:05', desc: 'RESERVE YIELD CR', type: 'CR', amount: 142.50, balance: 45000.00 }
              ]
            }
          }
        },
        {
          id: 'card-stu',
          tier: 'Meridian Student Basic',
          network: 'VISA',
          holder: 'AARAV SHARMA',
          pan: '4111220098113092',
          last4: '3092',
          expiry: '08/28',
          pin: '2580',
          dailyLimit: 300,
          dailyUsed: 0,
          failedAttempts: 0,
          locked: false,
          accounts: {
            checking: {
              number: 'STU-2041-3092',
              label: 'Student Chk (•••• 3092)',
              balance: 145.00,
              ledger: [
                { id: 'TXN71044', date: '2026-11-25 12:40', desc: 'CAMPUS BOOKSTORE', type: 'DR', amount: 42.50, balance: 145.00 },
                { id: 'TXN71012', date: '2026-11-20 08:15', desc: 'P2P TRANSFER IN', type: 'CR', amount: 150.00, balance: 187.50 }
              ]
            },
            savings: {
              number: 'STU-5509-6614',
              label: 'Student Sav (•••• 6614)',
              balance: 320.00,
              ledger: [
                { id: 'TXN70900', date: '2026-11-01 00:05', desc: 'MONTHLY INTEREST CR', type: 'CR', amount: 0.85, balance: 320.00 }
              ]
            }
          }
        }
      ]
    };
  }

  /* ------------------------------------------------------------------------
     APPLICATION STATE
     ------------------------------------------------------------------------ */
  let db = loadState();
  let stanCounter = 410200;

  const runtime = {
    lang: 'EN',
    soundEnabled: true,
    audioCtx: null,
    screen: 'attract', // attract | chipRead | pinEntry | mainMenu | fastCash | withdrawAccount | withdrawAmount | depositAccount | depositNotes | balance | miniStmt | transfer | changePin | processing | dispenseCash | receiptPrompt | message | cardRetained
    activeCardId: null,
    entryMode: 'EMV_CHIP', // EMV_CHIP | NFC_TAP
    authenticated: false,
    sessionTimer: 0,
    sessionInterval: null,

    // Transient screen buffers
    pinInput: '',
    pinError: '',
    selectedAccount: 'checking',
    withdrawInput: '',
    preferSmallBills: false,
    withdrawError: '',
    depositBills: { 100: 0, 50: 0, 20: 0, 10: 0 },
    stmtAccount: 'checking',
    transfer: {
      from: 'checking',
      toType: 'internal', // internal | external
      toExternal: 'EXT-9012-4410 (Apex Mortgage)',
      customAcct: '',
      amount: '100'
    },
    transferError: '',
    pinChange: {
      step: 1, // 1: current, 2: new, 3: confirm
      current: '',
      next: '',
      confirm: '',
      error: ''
    },
    pendingDispense: null, // { amount, plan, accountKey, txResult }
    lastTxResult: null,    // receipt payload
    uncollectedReceipt: false,
    messageScreen: {
      title: '',
      body: '',
      variant: 'info', // info | error | success
      nextAction: 'attract'
    },
    softHandlers: {} // { L1..L4, R1..R4 }
  };

  /* ------------------------------------------------------------------------
     DOM REFERENCES
     ------------------------------------------------------------------------ */
  const el = {
    hwClock: document.getElementById('atm-hw-clock'),
    scrTitle: document.getElementById('scr-title'),
    scrBody: document.getElementById('scr-body'),
    scrHintLeft: document.getElementById('scr-hint-left'),
    scrLang: document.getElementById('scr-lang-indicator'),
    scrTimer: document.getElementById('scr-session-timer'),
    scrCardBadge: document.getElementById('scr-card-badge'),

    ledCard: document.getElementById('led-card'),
    ledCash: document.getElementById('led-cash'),
    ledDeposit: document.getElementById('led-deposit'),
    ledReceipt: document.getElementById('led-receipt'),

    hwInsertedCard: document.getElementById('hw-inserted-card'),
    hwCardPan: document.getElementById('hw-card-pan'),
    hwCardSlot: document.getElementById('hw-card-slot'),
    hwNfcPad: document.getElementById('hw-nfc-pad'),
    hwShutter: document.getElementById('hw-shutter'),
    hwCashBundle: document.getElementById('hw-cash-bundle'),
    hwBundleAmount: document.getElementById('hw-bundle-amount'),
    hwDepositSlot: document.getElementById('hw-deposit-slot'),
    hwReceiptPaper: document.getElementById('hw-receipt-paper'),
    hwReceiptType: document.getElementById('hw-receipt-type'),

    walletList: document.getElementById('wallet-cards-list'),
    cassetteList: document.getElementById('cassette-list'),
    vaultTotalCash: document.getElementById('vault-total-cash'),
    vaultDepositCash: document.getElementById('vault-deposit-cash'),
    paperPct: document.getElementById('paper-pct'),
    paperMeter: document.getElementById('paper-meter'),
    receiptCount: document.getElementById('receipt-count'),
    receiptViewer: document.getElementById('receipt-viewer'),
    receiptHistory: document.getElementById('receipt-history'),
    telemetryStream: document.getElementById('telemetry-stream'),

    btnSound: document.getElementById('btn-sound'),
    soundLabel: document.getElementById('sound-label'),
    btnFactoryReset: document.getElementById('btn-factory-reset'),
    btnReplenish: document.getElementById('btn-replenish'),
    btnEmptyEscrow: document.getElementById('btn-empty-escrow'),
    btnUnlockCards: document.getElementById('btn-unlock-cards'),
    btnClearLog: document.getElementById('btn-clear-log')
  };

  /* ------------------------------------------------------------------------
     PERSISTENCE & UTILITIES
     ------------------------------------------------------------------------ */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultData();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.cards) || !parsed.cassettes) {
        return createDefaultData();
      }
      return parsed;
    } catch {
      return createDefaultData();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Storage quota fallback ignored safely
    }
  }

  function t(key) {
    return (I18N[runtime.lang] && I18N[runtime.lang][key]) || I18N.EN[key] || key;
  }

  function fmtMoney(n) {
    return '$' + Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function fmtNow() {
    const d = new Date();
    const pad = (v) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function nextStan() {
    stanCounter += 1;
    return String(stanCounter);
  }

  function genAuthCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 6; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function getActiveCard() {
    return db.cards.find((c) => c.id === runtime.activeCardId) || null;
  }

  function getVaultTotal() {
    return (
      db.cassettes[100] * 100 +
      db.cassettes[50] * 50 +
      db.cassettes[20] * 20 +
      db.cassettes[10] * 10
    );
  }

  /* ------------------------------------------------------------------------
     TELEMETRY AUDIT LOG
     ------------------------------------------------------------------------ */
  function logBus(bus, msg, level = 'info') {
    const d = new Date();
    const ts = d.toTimeString().slice(0, 8);
    const line = document.createElement('div');
    line.className = 'log-line';
    const cls = level === 'ok' ? 'log-ok' : level === 'warn' ? 'log-warn' : level === 'err' ? 'log-err' : '';
    line.innerHTML = `<span class="log-ts">[${ts}]</span> <span class="log-bus">[${bus}]</span> <span class="${cls}">${escapeHtml(msg)}</span>`;
    el.telemetryStream.prepend(line);
    while (el.telemetryStream.children.length > 140) {
      el.telemetryStream.removeChild(el.telemetryStream.lastChild);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------------------
     WEB AUDIO API HARDWARE SOUND SYNTHESIZER
     ------------------------------------------------------------------------ */
  function ensureAudio() {
    if (!runtime.soundEnabled) return null;
    try {
      if (!runtime.audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) runtime.audioCtx = new Ctx();
      }
      if (runtime.audioCtx && runtime.audioCtx.state === 'suspended') {
        runtime.audioCtx.resume();
      }
      return runtime.audioCtx;
    } catch {
      return null;
    }
  }

  function playTone(freq, duration = 0.055, type = 'sine', gainVal = 0.05) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playBeepKey() { playTone(980, 0.045, 'triangle', 0.045); }
  function playBeepSoft() { playTone(760, 0.04, 'sine', 0.04); }
  function playBeepError() {
    playTone(260, 0.14, 'sawtooth', 0.05);
    setTimeout(() => playTone(210, 0.16, 'sawtooth', 0.05), 110);
  }
  function playBeepSuccess() {
    playTone(880, 0.07, 'sine', 0.045);
    setTimeout(() => playTone(1174, 0.11, 'sine', 0.05), 80);
  }
  function playDispenseSound() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(320 + i * 25, 0.04, 'square', 0.02), i * 85);
    }
  }

  /* ------------------------------------------------------------------------
     CASSETTE DISPENSING ALGORITHM (BOUNDED COIN/BILL PICKER)
     ------------------------------------------------------------------------ */
  function computeDispensePlan(amount, cassettes, preferSmall = false) {
    if (amount <= 0 || amount % 10 !== 0) return null;
    const denoms = preferSmall ? [20, 10, 50, 100] : [100, 50, 20, 10];

    // Bounded backtracking with greedy ordering for exact physical cassette satisfaction
    function search(idx, rem, picked) {
      if (rem === 0) return picked;
      if (idx >= denoms.length) return null;
      const d = denoms[idx];
      const maxUse = Math.min(cassettes[d] || 0, Math.floor(rem / d));
      for (let count = maxUse; count >= 0; count--) {
        const nextPicked = { ...picked };
        if (count > 0) nextPicked[d] = count;
        const res = search(idx + 1, rem - count * d, nextPicked);
        if (res) return res;
      }
      return null;
    }

    return search(0, amount, { 100: 0, 50: 0, 20: 0, 10: 0 });
  }

  function formatPlanBadges(plan) {
    if (!plan) return '';
    return [100, 50, 20, 10]
      .filter((d) => plan[d] > 0)
      .map((d) => `<span class="denom-pill">${plan[d]} &times; $${d}</span>`)
      .join('');
  }

  /* ------------------------------------------------------------------------
     SESSION TIMER MANAGEMENT
     ------------------------------------------------------------------------ */
  function resetSessionTimer() {
    if (!runtime.authenticated) return;
    runtime.sessionTimer = SESSION_TIMEOUT_SEC;
    updateTimerDisplay();
  }

  function startSessionTimer() {
    stopSessionTimer();
    runtime.sessionTimer = SESSION_TIMEOUT_SEC;
    el.scrTimer.classList.remove('hidden');
    updateTimerDisplay();
    runtime.sessionInterval = setInterval(() => {
      if (!runtime.authenticated) {
        stopSessionTimer();
        return;
      }
      runtime.sessionTimer -= 1;
      updateTimerDisplay();
      if (runtime.sessionTimer <= 0) {
        stopSessionTimer();
        logBus('SESSION', 'Idle timeout reached — auto-ejecting card', 'warn');
        ejectCard('Session timed out due to inactivity. Please take your card.');
      }
    }, 1000);
  }

  function stopSessionTimer() {
    if (runtime.sessionInterval) {
      clearInterval(runtime.sessionInterval);
      runtime.sessionInterval = null;
    }
    el.scrTimer.classList.add('hidden');
    el.scrTimer.classList.remove('warn');
  }

  function updateTimerDisplay() {
    const m = Math.floor(runtime.sessionTimer / 60);
    const s = runtime.sessionTimer % 60;
    el.scrTimer.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    el.scrTimer.classList.toggle('warn', runtime.sessionTimer <= 20);
  }

  /* ------------------------------------------------------------------------
     CARD LIFECYCLE (INSERT / NFC / EJECT / RETAIN)
     ------------------------------------------------------------------------ */
  function insertCard(cardId, mode = 'EMV_CHIP') {
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) return;
    if (card.locked) {
      playBeepError();
      logBus('CARD_RDR', `Rejected locked card •••• ${card.last4}`, 'err');
      showMessage('CARD LOCKED', 'This card is currently locked or retained by security. Unlock it in the Vault & Supplies tab.', 'error', 'attract');
      return;
    }
    if (runtime.activeCardId && runtime.screen !== 'attract') {
      playBeepError();
      logBus('CARD_RDR', 'Reader occupied — eject current card first', 'warn');
      return;
    }

    runtime.activeCardId = card.id;
    runtime.entryMode = mode;
    runtime.authenticated = false;
    runtime.pinInput = '';
    runtime.pinError = '';
    runtime.screen = 'chipRead';

    playBeepSoft();
    logBus('CARD_RDR', `${mode === 'NFC_TAP' ? 'Contactless NFC tap' : 'Card inserted'}: PAN •••• ${card.last4} (${card.network})`, 'ok');
    updateHardwareIndicators();
    render();

    setTimeout(() => {
      if (runtime.activeCardId === card.id && runtime.screen === 'chipRead') {
        logBus('EMV', 'ATR verified • Application cryptogram ARQC ready', 'ok');
        runtime.screen = 'pinEntry';
        render();
      }
    }, 850);
  }

  function ejectCard(customMsg = null) {
    const card = getActiveCard();
    stopSessionTimer();
    if (card) {
      logBus('CARD_RDR', `Card •••• ${card.last4} ejected to throat`, 'ok');
    }
    runtime.activeCardId = null;
    runtime.authenticated = false;
    runtime.pinInput = '';
    runtime.pinError = '';
    runtime.pendingDispense = null;
    playBeepSoft();
    updateHardwareIndicators();

    if (customMsg) {
      showMessage(t('sessionEnded'), customMsg, 'info', 'attract');
    } else {
      runtime.screen = 'attract';
      render();
    }
  }

  function retainCard(card) {
    stopSessionTimer();
    card.locked = true;
    saveState();
    logBus('SECURITY', `CAPTURE_CARD executed on •••• ${card.last4} after 3 failed PIN attempts`, 'err');
    runtime.activeCardId = null;
    runtime.authenticated = false;
    updateHardwareIndicators();
    renderConsole();
    showMessage(
      'CARD RETAINED FOR SECURITY',
      `Card ending in ${card.last4} exceeded 3 invalid PIN attempts and has been captured inside the terminal vault. Contact bank support or reset in Vault & Supplies.`,
      'error',
      'attract'
    );
  }

  /* ------------------------------------------------------------------------
     HARDWARE LED & ACTUATOR VISUAL SYNC
     ------------------------------------------------------------------------ */
  function updateHardwareIndicators() {
    const card = getActiveCard();
    const hasCard = Boolean(card);
    const cashWaiting = Boolean(runtime.pendingDispense);

    el.scrCardBadge.classList.toggle('hidden', !hasCard);
    if (card) {
      el.scrCardBadge.textContent = `${runtime.entryMode === 'NFC_TAP' ? 'NFC' : 'EMV'} •••• ${card.last4}`;
    }

    // Physical card slot graphic
    el.hwInsertedCard.classList.toggle('hidden', !hasCard || runtime.entryMode === 'NFC_TAP');
    if (card) {
      el.hwCardPan.textContent = card.last4;
    }

    // Card LED
    el.ledCard.className = 'hw-led ' + (hasCard ? 'led-solid-green' : 'led-blink-green');

    // Cash Dispenser Shutter & Bundle
    el.hwShutter.classList.toggle('open', cashWaiting);
    el.hwCashBundle.classList.toggle('hidden', !cashWaiting);
    if (cashWaiting) {
      el.hwBundleAmount.textContent = `$${runtime.pendingDispense.amount}`;
      el.ledCash.className = 'hw-led led-blink-green';
    } else {
      el.ledCash.className = 'hw-led';
    }

    // Deposit Slot LED
    const depositActive = runtime.screen === 'depositNotes';
    el.hwDepositSlot.classList.toggle('active', depositActive);
    el.ledDeposit.className = 'hw-led ' + (depositActive ? 'led-blink-green' : '');

    // Receipt Printer Slot
    el.hwReceiptPaper.classList.toggle('hidden', !runtime.uncollectedReceipt);
    el.ledReceipt.className = 'hw-led ' + (runtime.uncollectedReceipt ? 'led-active-amber' : '');
  }

  /* ------------------------------------------------------------------------
     RECEIPT GENERATOR
     ------------------------------------------------------------------------ */
  function generateReceipt(tx) {
    const card = getActiveCard();
    const stan = nextStan();
    const auth = genAuthCode();
    const rrn = `6330${stan}`;
    const timestamp = fmtNow();

    const lines = [
      '========================================',
      '        MERIDIAN NATIONAL BANK          ',
      `     TERMINAL ID: ${TERMINAL_ID}              `,
      '========================================',
      `DATE/TIME : ${timestamp}`,
      `CARD      : **** **** **** ${card ? card.last4 : 'XXXX'}`,
      `ENTRY     : ${runtime.entryMode}`,
      `STAN      : ${stan}     AUTH: ${auth}`,
      `RRN       : ${rrn}`,
      '----------------------------------------',
      `TRAN TYPE : ${tx.title}`,
      `ACCOUNT   : ${tx.accountLabel}`,
      tx.amount !== null ? `AMOUNT    : ${fmtMoney(tx.amount)}` : null,
      tx.fee ? `FEE       : ${fmtMoney(tx.fee)}` : null,
      tx.detail ? `DETAIL    : ${tx.detail}` : null,
      tx.availBalance !== null ? `AVAIL BAL : ${fmtMoney(tx.availBalance)}` : null,
      '----------------------------------------',
      tx.extraBlock ? tx.extraBlock : null,
      tx.extraBlock ? '----------------------------------------' : null,
      '   RESPONSE: 00 APPROVED                ',
      '   PLEASE RETAIN FOR YOUR RECORDS       ',
      '========================================'
    ].filter(Boolean);

    const record = {
      id: `RCP-${stan}`,
      timestamp,
      title: tx.title,
      amount: tx.amount,
      text: lines.join('\n')
    };

    runtime.lastTxResult = record;
    logBus('ISO-8583', `0210 APPROVED STAN=${stan} AUTH=${auth} TYPE=${tx.title}`, 'ok');
    return record;
  }

  function printLatestReceipt() {
    if (!runtime.lastTxResult) return;
    if (db.paperLevel <= 0) {
      playBeepError();
      logBus('PRINTER', 'Thermal paper roll depleted — cannot print', 'err');
      showMessage('RECEIPT PAPER OUT', 'The thermal paper roll is empty. Replenish supplies in Vault & Supplies or continue without receipt.', 'error', 'mainMenu');
      return;
    }

    db.paperLevel = Math.max(0, db.paperLevel - 2);
    db.receipts.unshift(runtime.lastTxResult);
    if (db.receipts.length > 20) db.receipts.pop();
    saveState();

    runtime.uncollectedReceipt = true;
    el.hwReceiptType.textContent = runtime.lastTxResult.title.slice(0, 14);
    playBeepSuccess();
    logBus('PRINTER', `Printed slip ${runtime.lastTxResult.id} (paper ${db.paperLevel}%)`, 'ok');
    updateHardwareIndicators();
    renderConsole();
  }

  /* ------------------------------------------------------------------------
     SCREEN HELPERS & SOFTKEY BINDING
     ------------------------------------------------------------------------ */
  function setSoftKeys(map) {
    runtime.softHandlers = map || {};
    ['L1', 'L2', 'L3', 'L4', 'R1', 'R2', 'R3', 'R4'].forEach((id) => {
      const btn = document.getElementById(`sk-${id}`);
      if (btn) btn.disabled = !runtime.softHandlers[id];
    });
  }

  function triggerSoftKey(id) {
    const fn = runtime.softHandlers[id];
    if (!fn) return;
    resetSessionTimer();
    playBeepSoft();
    const btn = document.getElementById(`sk-${id}`);
    if (btn) {
      btn.classList.add('is-pressed');
      setTimeout(() => btn.classList.remove('is-pressed'), 110);
    }
    fn();
  }

  function renderOptionButton(slotId, label, variant = '', disabled = false) {
    if (!label) return `<div class="scr-option-placeholder"></div>`;
    const cls = variant ? `scr-option scr-option-${variant}` : 'scr-option';
    const isLeft = slotId.startsWith('L');
    const tag = `<span class="scr-option-tag">${slotId}</span>`;
    return `<button type="button" class="${cls}" data-slot="${slotId}" ${disabled ? 'disabled' : ''}>
      ${isLeft ? `${tag}<span>${escapeHtml(label)}</span>` : `<span>${escapeHtml(label)}</span>${tag}`}
    </button>`;
  }

  function renderSoftMenuGrid(slots) {
    return `
      <div class="soft-menu-grid">
        <div class="soft-menu-col">
          ${renderOptionButton('L1', slots.L1?.label, slots.L1?.variant, slots.L1?.disabled)}
          ${renderOptionButton('L2', slots.L2?.label, slots.L2?.variant, slots.L2?.disabled)}
          ${renderOptionButton('L3', slots.L3?.label, slots.L3?.variant, slots.L3?.disabled)}
          ${renderOptionButton('L4', slots.L4?.label, slots.L4?.variant, slots.L4?.disabled)}
        </div>
        <div class="soft-menu-col">
          ${renderOptionButton('R1', slots.R1?.label, slots.R1?.variant, slots.R1?.disabled)}
          ${renderOptionButton('R2', slots.R2?.label, slots.R2?.variant, slots.R2?.disabled)}
          ${renderOptionButton('R3', slots.R3?.label, slots.R3?.variant, slots.R3?.disabled)}
          ${renderOptionButton('R4', slots.R4?.label, slots.R4?.variant, slots.R4?.disabled)}
        </div>
      </div>
    `;
  }

  function showMessage(title, body, variant = 'info', nextAction = 'mainMenu') {
    runtime.messageScreen = { title, body, variant, nextAction };
    runtime.screen = 'message';
    render();
  }

  /* ------------------------------------------------------------------------
     MAIN SCREEN RENDERER (FINITE STATE MACHINE)
     ------------------------------------------------------------------------ */
  function render() {
    el.scrLang.textContent = runtime.lang;
    updateHardwareIndicators();

    switch (runtime.screen) {
      case 'attract': renderAttract(); break;
      case 'chipRead': renderChipRead(); break;
      case 'pinEntry': renderPinEntry(); break;
      case 'mainMenu': renderMainMenu(); break;
      case 'fastCash': renderFastCash(); break;
      case 'withdrawAccount': renderWithdrawAccount(); break;
      case 'withdrawAmount': renderWithdrawAmount(); break;
      case 'depositAccount': renderDepositAccount(); break;
      case 'depositNotes': renderDepositNotes(); break;
      case 'balance': renderBalance(); break;
      case 'miniStmt': renderMiniStmt(); break;
      case 'transfer': renderTransfer(); break;
      case 'changePin': renderChangePin(); break;
      case 'processing': renderProcessing(); break;
      case 'dispenseCash': renderDispenseCash(); break;
      case 'receiptPrompt': renderReceiptPrompt(); break;
      case 'message': renderMessageScreen(); break;
      default: renderAttract();
    }

    // Bind in-screen soft option buttons directly to the active softHandlers
    el.scrBody.querySelectorAll('[data-slot]').forEach((btn) => {
      btn.addEventListener('click', () => triggerSoftKey(btn.dataset.slot));
    });
  }

  function renderAttract() {
    el.scrTitle.textContent = 'SELF-SERVICE TERMINAL';
    el.scrHintLeft.textContent = 'SELECT LANGUAGE OR INSERT EMV CARD';
    const vaultCash = getVaultTotal();
    const cashOk = vaultCash >= 20;

    const firstUnlocked = db.cards.find((c) => !c.locked);

    const slots = {
      L3: {
        label: t('tapNfc'),
        variant: 'primary',
        disabled: !firstUnlocked,
        action: () => firstUnlocked && insertCard(firstUnlocked.id, 'NFC_TAP')
      },
      L4: {
        label: 'Fast Demo (Elena •4821)',
        disabled: !db.cards[0] || db.cards[0].locked,
        action: () => insertCard(db.cards[0].id, 'EMV_CHIP')
      },
      R3: {
        label: t('insertPrompt'),
        variant: 'success',
        disabled: !firstUnlocked,
        action: () => firstUnlocked && insertCard(firstUnlocked.id, 'EMV_CHIP')
      },
      R4: {
        label: 'Student Card (••3092)',
        disabled: !db.cards[2] || db.cards[2].locked,
        action: () => insertCard(db.cards[2].id, 'EMV_CHIP')
      }
    };

    setSoftKeys({
      L3: slots.L3.disabled ? null : slots.L3.action,
      L4: slots.L4.disabled ? null : slots.L4.action,
      R3: slots.R3.disabled ? null : slots.R3.action,
      R4: slots.R4.disabled ? null : slots.R4.action
    });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>${escapeHtml(t('welcomeTitle'))}</h2>
        <p>${escapeHtml(t('welcomeSub'))}</p>
      </div>

      <div class="scr-status-strip">
        <div class="scr-stat-box">
          <span class="scr-stat-label">Cash Dispenser</span>
          <span class="scr-stat-val ${cashOk ? 'ok' : 'err'}">${cashOk ? 'AVAILABLE' : 'OUT OF CASH'}</span>
        </div>
        <div class="scr-stat-box">
          <span class="scr-stat-label">Receipt Printer</span>
          <span class="scr-stat-val ${db.paperLevel > 10 ? 'ok' : 'warn'}">${db.paperLevel > 0 ? `READY (${db.paperLevel}%)` : 'PAPER OUT'}</span>
        </div>
        <div class="scr-stat-box">
          <span class="scr-stat-label">Deposit Escrow</span>
          <span class="scr-stat-val ok">ACCEPTING NOTES</span>
        </div>
      </div>

      <div class="lang-pills" role="group" aria-label="Display Language">
        ${['EN', 'ES', 'FR', 'HI'].map((code) => `
          <button type="button" class="lang-pill ${runtime.lang === code ? 'active' : ''}" data-lang="${code}">
            ${code === 'EN' ? 'English' : code === 'ES' ? 'Español' : code === 'FR' ? 'Français' : 'हिन्दी'}
          </button>
        `).join('')}
      </div>

      <div class="network-logos">
        <span class="net-chip">VISA</span>
        <span class="net-chip">MASTERCARD</span>
        <span class="net-chip">PLUS</span>
        <span class="net-chip">CIRRUS</span>
        <span class="net-chip">EMV CONTACTLESS</span>
      </div>

      ${renderSoftMenuGrid(slots)}
    `;

    el.scrBody.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        playBeepSoft();
        runtime.lang = btn.dataset.lang;
        logBus('UI', `Display language switched to ${runtime.lang}`);
        render();
      });
    });
  }

  function renderChipRead() {
    el.scrTitle.textContent = 'EMV HANDSHAKE';
    el.scrHintLeft.textContent = 'COMMUNICATING WITH CARD CHIP';
    setSoftKeys({});
    el.scrBody.innerHTML = `
      <div class="scr-processing">
        <div class="spinner-ring"></div>
        <div>
          <h2 style="margin:0 0 6px;color:#0a2540;font-size:16px;">${escapeHtml(t('chipReading'))}</h2>
          <p style="margin:0;color:#4e5d6c;font-size:12.5px;max-width:400px;">${escapeHtml(t('chipSub'))}</p>
        </div>
      </div>
    `;
  }

  function renderPinEntry() {
    const card = getActiveCard();
    el.scrTitle.textContent = 'PIN AUTHENTICATION';
    el.scrHintLeft.textContent = 'ENTER 4 DIGITS AND PRESS ENTER';

    const slots = {
      L4: { label: t('cancel'), variant: 'danger', action: () => ejectCard('Transaction cancelled by customer.') },
      R4: { label: t('confirm'), variant: 'success', disabled: runtime.pinInput.length < 4, action: submitPin }
    };

    setSoftKeys({
      L4: slots.L4.action,
      R4: runtime.pinInput.length === 4 ? slots.R4.action : null
    });

    const dots = [0, 1, 2, 3].map((i) => {
      const filled = i < runtime.pinInput.length;
      return `<div class="pin-dot ${filled ? 'filled' : ''}">${filled ? '&#9679;' : ''}</div>`;
    }).join('');

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>${escapeHtml(t('pinTitle'))}</h2>
        <p>${escapeHtml(t('pinSub'))} &bull; Card: <strong class="mono">•••• ${card.last4}</strong></p>
      </div>

      <div class="pin-panel">
        <div style="font-size:11.5px;color:#56687a;font-weight:600;">DEMO PIN FOR THIS CARD: <span class="mono" style="color:#0a2540;">${card.pin}</span></div>
        <div class="pin-dots">${dots}</div>
        <div class="pin-alert">${escapeHtml(runtime.pinError)}</div>
      </div>

      ${renderSoftMenuGrid(slots)}
    `;
  }

  function submitPin() {
    const card = getActiveCard();
    if (!card || runtime.pinInput.length !== 4) return;

    if (runtime.pinInput === card.pin) {
      card.failedAttempts = 0;
      saveState();
      runtime.authenticated = true;
      runtime.pinInput = '';
      runtime.pinError = '';
      playBeepSuccess();
      logBus('EPP', `Encrypted PIN block verified (RC=00) for •••• ${card.last4}`, 'ok');
      startSessionTimer();
      runtime.screen = 'mainMenu';
      render();
    } else {
      card.failedAttempts += 1;
      saveState();
      playBeepError();
      const remaining = 3 - card.failedAttempts;
      logBus('ISO-8583', `0210 RC=55 INVALID_PIN (${card.failedAttempts}/3) on •••• ${card.last4}`, 'err');
      runtime.pinInput = '';
      if (remaining <= 0) {
        retainCard(card);
      } else {
        runtime.pinError = `Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before card capture.`;
        render();
      }
    }
  }

  function renderMainMenu() {
    const card = getActiveCard();
    el.scrTitle.textContent = 'MAIN MENU';
    el.scrHintLeft.textContent = `CARDHOLDER: ${card.holder}`;

    const slots = {
      L1: { label: t('withdraw'), variant: 'primary', action: () => { runtime.screen = 'withdrawAccount'; render(); } },
      L2: { label: t('fastCash'), action: () => { runtime.screen = 'fastCash'; render(); } },
      L3: { label: t('balance'), action: () => { runtime.screen = 'balance'; render(); } },
      L4: { label: t('miniStmt'), action: () => { runtime.stmtAccount = 'checking'; runtime.screen = 'miniStmt'; render(); } },
      R1: { label: t('deposit'), action: () => { runtime.depositBills = { 100: 0, 50: 0, 20: 0, 10: 0 }; runtime.screen = 'depositAccount'; render(); } },
      R2: { label: t('transfer'), action: () => { runtime.transferError = ''; runtime.screen = 'transfer'; render(); } },
      R3: { label: t('changePin'), action: () => { runtime.pinChange = { step: 1, current: '', next: '', confirm: '', error: '' }; runtime.screen = 'changePin'; render(); } },
      R4: { label: t('ejectCard'), variant: 'danger', action: () => ejectCard(t('cardReturned')) }
    };

    setSoftKeys({
      L1: slots.L1.action,
      L2: slots.L2.action,
      L3: slots.L3.action,
      L4: slots.L4.action,
      R1: slots.R1.action,
      R2: slots.R2.action,
      R3: slots.R3.action,
      R4: slots.R4.action
    });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>${escapeHtml(t('menuTitle'))}</h2>
        <p>${escapeHtml(t('menuSub'))}</p>
      </div>
      ${renderSoftMenuGrid(slots)}
    `;
  }

  /* ------------------------------------------------------------------------
     FAST CASH
     ------------------------------------------------------------------------ */
  function renderFastCash() {
    const card = getActiveCard();
    const chk = card.accounts.checking;
    el.scrTitle.textContent = 'FAST CASH (CHECKING)';
    el.scrHintLeft.textContent = `DAILY LIMIT REMAINING: ${fmtMoney(card.dailyLimit - card.dailyUsed)}`;

    const amounts = [40, 60, 100, 200, 300, 500];
    const makeSlot = (amt) => ({
      label: `$${amt}`,
      variant: 'primary',
      action: () => executeWithdrawal('checking', amt, false)
    });

    const slots = {
      L1: makeSlot(amounts[0]),
      L2: makeSlot(amounts[1]),
      L3: makeSlot(amounts[2]),
      L4: { label: t('backMenu'), action: () => { runtime.screen = 'mainMenu'; render(); } },
      R1: makeSlot(amounts[3]),
      R2: makeSlot(amounts[4]),
      R3: makeSlot(amounts[5]),
      R4: { label: t('cancel'), variant: 'danger', action: () => ejectCard(t('cardReturned')) }
    };

    setSoftKeys({
      L1: slots.L1.action, L2: slots.L2.action, L3: slots.L3.action, L4: slots.L4.action,
      R1: slots.R1.action, R2: slots.R2.action, R3: slots.R3.action, R4: slots.R4.action
    });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>Fast Cash Withdrawal — ${escapeHtml(chk.label)}</h2>
        <p>Available Balance: <strong class="mono">${fmtMoney(chk.balance)}</strong> &bull; Vault Cash: <strong class="mono">${fmtMoney(getVaultTotal())}</strong></p>
      </div>
      ${renderSoftMenuGrid(slots)}
    `;
  }

  /* ------------------------------------------------------------------------
     CASH WITHDRAWAL (ACCOUNT -> AMOUNT -> DISPENSE)
     ------------------------------------------------------------------------ */
  function renderWithdrawAccount() {
    const card = getActiveCard();
    el.scrTitle.textContent = 'WITHDRAWAL ACCOUNT';
    el.scrHintLeft.textContent = 'SELECT SOURCE ACCOUNT';

    const slots = {
      L1: {
        label: `Checking (${fmtMoney(card.accounts.checking.balance)})`,
        variant: 'primary',
        action: () => {
          runtime.selectedAccount = 'checking';
          runtime.withdrawInput = '';
          runtime.withdrawError = '';
          runtime.screen = 'withdrawAmount';
          render();
        }
      },
      L2: {
        label: `Savings (${fmtMoney(card.accounts.savings.balance)})`,
        variant: 'primary',
        action: () => {
          runtime.selectedAccount = 'savings';
          runtime.withdrawInput = '';
          runtime.withdrawError = '';
          runtime.screen = 'withdrawAmount';
          render();
        }
      },
      L4: { label: t('backMenu'), action: () => { runtime.screen = 'mainMenu'; render(); } },
      R4: { label: t('cancel'), variant: 'danger', action: () => ejectCard(t('cardReturned')) }
    };

    setSoftKeys({
      L1: slots.L1.action, L2: slots.L2.action, L4: slots.L4.action, R4: slots.R4.action
    });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>Select Account for Withdrawal</h2>
        <p>Daily ATM Withdrawal Limit Remaining: <strong class="mono">${fmtMoney(card.dailyLimit - card.dailyUsed)}</strong></p>
      </div>
      ${renderSoftMenuGrid(slots)}
    `;
  }

  function renderWithdrawAmount() {
    const card = getActiveCard();
    const acct = card.accounts[runtime.selectedAccount];
    const amt = Number(runtime.withdrawInput || 0);
    const plan = amt > 0 ? computeDispensePlan(amt, db.cassettes, runtime.preferSmallBills) : null;

    el.scrTitle.textContent = 'WITHDRAWAL AMOUNT';
    el.scrHintLeft.textContent = 'TYPE AMOUNT ON KEYPAD OR PICK PRESET ($10 MULTIPLES)';

    const pickPreset = (v) => {
      runtime.withdrawInput = String(v);
      runtime.withdrawError = '';
      render();
    };

    const slots = {
      L1: { label: '$20', action: () => pickPreset(20) },
      L2: { label: '$60', action: () => pickPreset(60) },
      L3: { label: '$100', action: () => pickPreset(100) },
      L4: { label: t('backMenu'), action: () => { runtime.screen = 'mainMenu'; render(); } },
      R1: { label: '$200', action: () => pickPreset(200) },
      R2: {
        label: runtime.preferSmallBills ? 'Bills: Smaller Mix' : 'Bills: Standard Mix',
        action: () => { runtime.preferSmallBills = !runtime.preferSmallBills; render(); }
      },
      R3: {
        label: 'Dispense Cash',
        variant: 'success',
        disabled: amt <= 0,
        action: () => executeWithdrawal(runtime.selectedAccount, amt, runtime.preferSmallBills)
      },
      R4: { label: t('cancel'), variant: 'danger', action: () => { runtime.screen = 'withdrawAccount'; render(); } }
    };

    setSoftKeys({
      L1: slots.L1.action, L2: slots.L2.action, L3: slots.L3.action, L4: slots.L4.action,
      R1: slots.R1.action, R2: slots.R2.action, R3: amt > 0 ? slots.R3.action : null, R4: slots.R4.action
    });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>Enter Withdrawal Amount &bull; ${escapeHtml(acct.label)}</h2>
        <p>Available: <strong class="mono">${fmtMoney(acct.balance)}</strong> &bull; Limit Left: <strong class="mono">${fmtMoney(card.dailyLimit - card.dailyUsed)}</strong></p>
      </div>

      <div class="amount-readout">
        <span class="amount-currency">USD ($10 MULTIPLES)</span>
        <span class="amount-digits">$${amt.toLocaleString('en-US')}</span>
      </div>

      <div class="denom-preview">
        <span>Cassette Mix:</span>
        ${plan ? formatPlanBadges(plan) : '<span style="color:#64748b;">Enter valid multiple of $10 within cassette supply</span>'}
      </div>

      ${runtime.withdrawError ? `<div class="pin-alert" style="text-align:left;">${escapeHtml(runtime.withdrawError)}</div>` : ''}

      ${renderSoftMenuGrid(slots)}
    `;
  }

  function executeWithdrawal(accountKey, amount, preferSmall) {
    const card = getActiveCard();
    const acct = card.accounts[accountKey];
    const remainingLimit = card.dailyLimit - card.dailyUsed;

    if (!amount || amount <= 0 || amount % 10 !== 0) {
      playBeepError();
      runtime.withdrawError = 'Amount must be a positive multiple of $10.';
      if (runtime.screen !== 'withdrawAmount') showMessage('INVALID AMOUNT', runtime.withdrawError, 'error', 'fastCash');
      else render();
      return;
    }

    if (amount > acct.balance) {
      playBeepError();
      logBus('ISO-8583', `0210 RC=51 INSUFFICIENT_FUNDS req=${fmtMoney(amount)} avail=${fmtMoney(acct.balance)}`, 'err');
      showMessage('INSUFFICIENT FUNDS', `Requested ${fmtMoney(amount)} exceeds available balance of ${fmtMoney(acct.balance)} in ${acct.label}.`, 'error', 'mainMenu');
      return;
    }

    if (amount > remainingLimit) {
      playBeepError();
      logBus('ISO-8583', `0210 RC=61 EXCEEDS_WITHDRAWAL_LIMIT req=${fmtMoney(amount)} rem=${fmtMoney(remainingLimit)}`, 'err');
      showMessage('DAILY LIMIT EXCEEDED', `Requested ${fmtMoney(amount)} exceeds your remaining daily ATM limit of ${fmtMoney(remainingLimit)}.`, 'error', 'mainMenu');
      return;
    }

    const plan = computeDispensePlan(amount, db.cassettes, preferSmall);
    if (!plan) {
      playBeepError();
      logBus('DISPENSER', `Cannot assemble ${fmtMoney(amount)} from current cassette inventory`, 'err');
      showMessage('CASSETTE DENOMINATION UNAVAILABLE', `The terminal vault cannot dispense exact bills for ${fmtMoney(amount)} right now. Try another amount or replenish cassettes.`, 'error', 'mainMenu');
      return;
    }

    // Show processing transition
    runtime.screen = 'processing';
    runtime.processingText = 'Authorizing with Meridian Core Host & Picking Notes...';
    render();
    logBus('ISO-8583', `0200 WDL ACCT=${acct.number} AMT=${fmtMoney(amount)}`, 'info');

    setTimeout(() => {
      // Deduct cash & update ledger
      acct.balance = Number((acct.balance - amount).toFixed(2));
      card.dailyUsed = Number((card.dailyUsed + amount).toFixed(2));
      [100, 50, 20, 10].forEach((d) => {
        db.cassettes[d] -= plan[d];
      });

      const txId = `TXN${Math.floor(10000 + Math.random() * 89999)}`;
      acct.ledger.unshift({
        id: txId,
        date: fmtNow().slice(0, 16),
        desc: `ATM WDL ${TERMINAL_ID}`,
        type: 'DR',
        amount,
        balance: acct.balance
      });

      const mixText = [100, 50, 20, 10].filter((d) => plan[d] > 0).map((d) => `${plan[d]}x$${d}`).join(' ');
      generateReceipt({
        title: 'CASH WITHDRAWAL',
        accountLabel: acct.label,
        amount,
        detail: `BILLS: ${mixText}`,
        availBalance: acct.balance
      });

      saveState();
      runtime.pendingDispense = { amount, plan, accountKey };
      logBus('DISPENSER', `Picked & presented ${fmtMoney(amount)} (${mixText})`, 'ok');
      playDispenseSound();
      renderConsole();

      runtime.screen = 'dispenseCash';
      render();
    }, 950);
  }

  function renderDispenseCash() {
    const pd = runtime.pendingDispense;
    el.scrTitle.textContent = 'COLLECT CASH';
    el.scrHintLeft.textContent = 'SHUTTER OPEN — PLEASE TAKE YOUR BANKNOTES';

    const slots = {
      R4: { label: t('takeCash'), variant: 'success', action: collectDispensedCash }
    };
    setSoftKeys({ R4: slots.R4.action });

    el.scrBody.innerHTML = `
      <div class="scr-banner" style="border-left-color:#0d7a5f;">
        <h2>Cash Ready in Dispenser Bay</h2>
        <p>Please remove your <strong class="mono">${fmtMoney(pd.amount)}</strong> bundle from the lower right cash shutter.</p>
      </div>

      <div class="pin-panel">
        <div style="font-size:12px;font-weight:700;color:#475569;">BILLS DISPENSED</div>
        <div style="font-family:var(--font-mono);font-size:28px;font-weight:800;color:#0d7a5f;margin:8px 0;">${fmtMoney(pd.amount)}</div>
        <div class="denom-preview" style="justify-content:center;">${formatPlanBadges(pd.plan)}</div>
      </div>

      ${renderSoftMenuGrid(slots)}
    `;
  }

  function collectDispensedCash() {
    if (!runtime.pendingDispense) return;
    logBus('DISPENSER', `Customer collected $${runtime.pendingDispense.amount} — shutter closed`, 'ok');
    runtime.pendingDispense = null;
    playBeepSuccess();
    runtime.screen = 'receiptPrompt';
    render();
  }

  /* ------------------------------------------------------------------------
     CASH DEPOSIT FLOW
     ------------------------------------------------------------------------ */
  function renderDepositAccount() {
    const card = getActiveCard();
    el.scrTitle.textContent = 'DEPOSIT TARGET';
    el.scrHintLeft.textContent = 'SELECT ACCOUNT TO CREDIT';

    const slots = {
      L1: {
        label: `Checking (${fmtMoney(card.accounts.checking.balance)})`,
        variant: 'primary',
        action: () => { runtime.selectedAccount = 'checking'; runtime.screen = 'depositNotes'; render(); }
      },
      L2: {
        label: `Savings (${fmtMoney(card.accounts.savings.balance)})`,
        variant: 'primary',
        action: () => { runtime.selectedAccount = 'savings'; runtime.screen = 'depositNotes'; render(); }
      },
      L4: { label: t('backMenu'), action: () => { runtime.screen = 'mainMenu'; render(); } },
      R4: { label: t('cancel'), variant: 'danger', action: () => ejectCard(t('cardReturned')) }
    };

    setSoftKeys({ L1: slots.L1.action, L2: slots.L2.action, L4: slots.L4.action, R4: slots.R4.action });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>Cash Deposit &mdash; Select Destination Account</h2>
        <p>Accepted bills: $10, $20, $50, $100 USD. Remove paperclips and rubber bands before inserting.</p>
      </div>
      ${renderSoftMenuGrid(slots)}
    `;
  }

  function getDepositTotal() {
    const b = runtime.depositBills;
    return b[100] * 100 + b[50] * 50 + b[20] * 20 + b[10] * 10;
  }

  function renderDepositNotes() {
    const card = getActiveCard();
    const acct = card.accounts[runtime.selectedAccount];
    const total = getDepositTotal();

    el.scrTitle.textContent = 'INSERT BANKNOTES';
    el.scrHintLeft.textContent = 'SIMULATE INSERTING BILLS INTO DEPOSIT SLOT';

    const slots = {
      L3: {
        label: 'Quick Bundle (+$250)',
        action: () => {
          runtime.depositBills[100] += 2;
          runtime.depositBills[50] += 1;
          playBeepSoft();
          render();
        }
      },
      L4: { label: t('backMenu'), action: () => { runtime.screen = 'mainMenu'; render(); } },
      R3: {
        label: 'Clear Notes',
        action: () => {
          runtime.depositBills = { 100: 0, 50: 0, 20: 0, 10: 0 };
          render();
        }
      },
      R4: {
        label: 'Confirm Deposit',
        variant: 'success',
        disabled: total <= 0,
        action: () => executeDeposit(total)
      }
    };

    setSoftKeys({
      L3: slots.L3.action,
      L4: slots.L4.action,
      R3: slots.R3.action,
      R4: total > 0 ? slots.R4.action : null
    });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>Insert Bills into Acceptor &bull; ${escapeHtml(acct.label)}</h2>
        <p>Escrow Total: <strong class="mono">${fmtMoney(total)}</strong></p>
      </div>

      <div class="deposit-counter-grid">
        ${[100, 50, 20, 10].map((d) => `
          <div class="bill-counter-card">
            <span class="bill-denom">$${d}</span>
            <div class="bill-qty-controls">
              <button type="button" class="bill-btn" data-denom="${d}" data-delta="-1">-</button>
              <span class="bill-qty">${runtime.depositBills[d]}</span>
              <button type="button" class="bill-btn" data-denom="${d}" data-delta="1">+</button>
            </div>
          </div>
        `).join('')}
      </div>

      ${renderSoftMenuGrid(slots)}
    `;

    el.scrBody.querySelectorAll('.bill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = Number(btn.dataset.denom);
        const delta = Number(btn.dataset.delta);
        runtime.depositBills[d] = Math.max(0, Math.min(30, runtime.depositBills[d] + delta));
        playBeepSoft();
        resetSessionTimer();
        render();
      });
    });
  }

  function executeDeposit(total) {
    if (total <= 0) return;
    const card = getActiveCard();
    const acct = card.accounts[runtime.selectedAccount];
    const b = { ...runtime.depositBills };

    runtime.screen = 'processing';
    runtime.processingText = 'Validating Optical & Magnetic Ink Signatures...';
    render();
    logBus('ACCEPTOR', `Counting bundle totaling ${fmtMoney(total)}`, 'info');

    setTimeout(() => {
      acct.balance = Number((acct.balance + total).toFixed(2));
      db.depositEscrow = Number((db.depositEscrow + total).toFixed(2));

      const txId = `TXN${Math.floor(10000 + Math.random() * 89999)}`;
      acct.ledger.unshift({
        id: txId,
        date: fmtNow().slice(0, 16),
        desc: `ATM CASH DEP ${TERMINAL_ID}`,
        type: 'CR',
        amount: total,
        balance: acct.balance
      });

      const mixText = [100, 50, 20, 10].filter((d) => b[d] > 0).map((d) => `${b[d]}x$${d}`).join(' ');
      generateReceipt({
        title: 'CASH DEPOSIT',
        accountLabel: acct.label,
        amount: total,
        detail: `ESCROW: ${mixText}`,
        availBalance: acct.balance
      });

      saveState();
      playBeepSuccess();
      logBus('ACCEPTOR', `Notes stored in escrow bin • Credited ${fmtMoney(total)} to ${acct.number}`, 'ok');
      renderConsole();

      runtime.screen = 'receiptPrompt';
      render();
    }, 950);
  }

  /* ------------------------------------------------------------------------
     BALANCE INQUIRY & MINI STATEMENT
     ------------------------------------------------------------------------ */
  function renderBalance() {
    const card = getActiveCard();
    const chk = card.accounts.checking;
    const sav = card.accounts.savings;
    el.scrTitle.textContent = 'BALANCE INQUIRY';
    el.scrHintLeft.textContent = 'REAL-TIME LEDGER BALANCES';

    const printBalanceSlip = () => {
      generateReceipt({
        title: 'BALANCE INQUIRY',
        accountLabel: chk.label,
        amount: null,
        availBalance: chk.balance,
        extraBlock: `SAVINGS (${sav.number.slice(-4)}): ${fmtMoney(sav.balance)}\nDAILY ATM LEFT : ${fmtMoney(card.dailyLimit - card.dailyUsed)}`
      });
      printLatestReceipt();
      showMessage('BALANCE SLIP PRINTED', 'Please collect your balance inquiry receipt from the printer slot.', 'success', 'mainMenu');
    };

    const slots = {
      L4: { label: t('backMenu'), variant: 'primary', action: () => { runtime.screen = 'mainMenu'; render(); } },
      R3: { label: t('printReceipt'), action: printBalanceSlip },
      R4: { label: t('ejectCard'), variant: 'danger', action: () => ejectCard(t('cardReturned')) }
    };

    setSoftKeys({ L4: slots.L4.action, R3: slots.R3.action, R4: slots.R4.action });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>Account Balances &bull; ${escapeHtml(card.holder)}</h2>
        <p>Daily ATM Withdrawal Allowance: <strong class="mono">${fmtMoney(card.dailyLimit - card.dailyUsed)}</strong> of ${fmtMoney(card.dailyLimit)} remaining</p>
      </div>

      <div class="scr-status-strip" style="grid-template-columns:1fr 1fr;">
        <div class="scr-stat-box">
          <span class="scr-stat-label">${escapeHtml(chk.label)}</span>
          <span class="scr-stat-val ok mono" style="font-size:18px;">${fmtMoney(chk.balance)}</span>
        </div>
        <div class="scr-stat-box">
          <span class="scr-stat-label">${escapeHtml(sav.label)}</span>
          <span class="scr-stat-val ok mono" style="font-size:18px;">${fmtMoney(sav.balance)}</span>
        </div>
      </div>

      ${renderSoftMenuGrid(slots)}
    `;
  }

  function renderMiniStmt() {
    const card = getActiveCard();
    const acct = card.accounts[runtime.stmtAccount];
    const rows = acct.ledger.slice(0, 6);

    el.scrTitle.textContent = 'MINI STATEMENT';
    el.scrHintLeft.textContent = `SHOWING LATEST ${rows.length} POSTED ENTRIES`;

    const printStmt = () => {
      const lines = rows.map((r) => `${r.date.slice(5, 10)} ${r.type} ${fmtMoney(r.amount).padStart(9)} ${r.desc.slice(0, 16)}`).join('\n');
      generateReceipt({
        title: 'MINI STATEMENT',
        accountLabel: acct.label,
        amount: null,
        availBalance: acct.balance,
        extraBlock: lines
      });
      printLatestReceipt();
      showMessage('STATEMENT PRINTED', 'Your mini statement slip has been printed at the receipt slot.', 'success', 'mainMenu');
    };

    const slots = {
      L4: { label: t('backMenu'), variant: 'primary', action: () => { runtime.screen = 'mainMenu'; render(); } },
      R2: {
        label: runtime.stmtAccount === 'checking' ? 'View Savings Ledger' : 'View Checking Ledger',
        action: () => {
          runtime.stmtAccount = runtime.stmtAccount === 'checking' ? 'savings' : 'checking';
          render();
        }
      },
      R3: { label: t('printReceipt'), action: printStmt },
      R4: { label: t('ejectCard'), variant: 'danger', action: () => ejectCard(t('cardReturned')) }
    };

    setSoftKeys({ L4: slots.L4.action, R2: slots.R2.action, R3: slots.R3.action, R4: slots.R4.action });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>Mini Statement &bull; ${escapeHtml(acct.label)}</h2>
        <p>Current Available Balance: <strong class="mono">${fmtMoney(acct.balance)}</strong></p>
      </div>

      <div class="scr-table-wrap">
        <table class="scr-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r) => `
              <tr>
                <td class="mono">${escapeHtml(r.date.slice(0, 10))}</td>
                <td>${escapeHtml(r.desc)}</td>
                <td class="mono">${r.type}</td>
                <td class="mono ${r.type === 'DR' ? 'amt-dr' : 'amt-cr'}" style="text-align:right;">
                  ${r.type === 'DR' ? '-' : '+'}${fmtMoney(r.amount)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${renderSoftMenuGrid(slots)}
    `;
  }

  /* ------------------------------------------------------------------------
     FUNDS TRANSFER
     ------------------------------------------------------------------------ */
  function renderTransfer() {
    const card = getActiveCard();
    const tr = runtime.transfer;
    el.scrTitle.textContent = 'FUNDS TRANSFER';
    el.scrHintLeft.textContent = tr.toType === 'internal' ? 'INTERNAL FEE: $0.00' : 'EXTERNAL ACH FEE: $1.50';

    const slots = {
      L4: { label: t('backMenu'), action: () => { runtime.screen = 'mainMenu'; render(); } },
      R3: { label: 'Execute Transfer', variant: 'success', action: executeTransfer },
      R4: { label: t('cancel'), variant: 'danger', action: () => ejectCard(t('cardReturned')) }
    };

    setSoftKeys({ L4: slots.L4.action, R3: slots.R3.action, R4: slots.R4.action });

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>Transfer Funds</h2>
        <p>Move money instantly between your accounts or to an external beneficiary.</p>
      </div>

      <div class="scr-form-grid">
        <div class="scr-field">
          <label for="tr-from">From Account</label>
          <select id="tr-from" class="scr-select">
            <option value="checking" ${tr.from === 'checking' ? 'selected' : ''}>Checking (${fmtMoney(card.accounts.checking.balance)})</option>
            <option value="savings" ${tr.from === 'savings' ? 'selected' : ''}>Savings (${fmtMoney(card.accounts.savings.balance)})</option>
          </select>
        </div>

        <div class="scr-field">
          <label for="tr-type">Destination</label>
          <select id="tr-type" class="scr-select">
            <option value="internal" ${tr.toType === 'internal' ? 'selected' : ''}>${tr.from === 'checking' ? 'Own Savings' : 'Own Checking'} ($0 Fee)</option>
            <option value="external" ${tr.toType === 'external' ? 'selected' : ''}>External Beneficiary ($1.50 Fee)</option>
          </select>
        </div>

        ${tr.toType === 'external' ? `
          <div class="scr-field">
            <label for="tr-ext">Beneficiary Account</label>
            <select id="tr-ext" class="scr-select">
              <option value="EXT-9012-4410 (Apex Mortgage)" ${tr.toExternal.includes('Apex') ? 'selected' : ''}>Apex Mortgage (•••• 4410)</option>
              <option value="EXT-3301-8892 (City Electric)" ${tr.toExternal.includes('Electric') ? 'selected' : ''}>City Electric Utility (•••• 8892)</option>
              <option value="CUSTOM" ${tr.toExternal === 'CUSTOM' ? 'selected' : ''}>Enter Custom Account #</option>
            </select>
          </div>
          ${tr.toExternal === 'CUSTOM' ? `
            <div class="scr-field">
              <label for="tr-custom">Custom Account Number</label>
              <input id="tr-custom" class="scr-input mono" type="text" maxlength="16" placeholder="e.g. 8840192011" value="${escapeHtml(tr.customAcct)}">
            </div>
          ` : ''}
        ` : ''}

        <div class="scr-field">
          <label for="tr-amount">Amount (USD)</label>
          <input id="tr-amount" class="scr-input mono" type="number" min="1" step="1" value="${escapeHtml(tr.amount)}">
        </div>
      </div>

      ${runtime.transferError ? `<div class="pin-alert" style="text-align:left;">${escapeHtml(runtime.transferError)}</div>` : ''}

      ${renderSoftMenuGrid(slots)}
    `;

    document.getElementById('tr-from').addEventListener('change', (e) => {
      tr.from = e.target.value;
      render();
    });
    document.getElementById('tr-type').addEventListener('change', (e) => {
      tr.toType = e.target.value;
      render();
    });
    const extEl = document.getElementById('tr-ext');
    if (extEl) {
      extEl.addEventListener('change', (e) => {
        tr.toExternal = e.target.value;
        render();
      });
    }
    const custEl = document.getElementById('tr-custom');
    if (custEl) {
      custEl.addEventListener('input', (e) => { tr.customAcct = e.target.value; });
    }
    document.getElementById('tr-amount').addEventListener('input', (e) => {
      tr.amount = e.target.value;
    });
  }

  function executeTransfer() {
    const card = getActiveCard();
    const tr = runtime.transfer;
    const amt = Number(tr.amount);
    const fee = tr.toType === 'external' ? 1.50 : 0;
    const src = card.accounts[tr.from];

    if (!Number.isFinite(amt) || amt <= 0) {
      playBeepError();
      runtime.transferError = 'Enter a valid positive transfer amount.';
      render();
      return;
    }

    if (tr.toType === 'external' && tr.toExternal === 'CUSTOM' && tr.customAcct.trim().length < 6) {
      playBeepError();
      runtime.transferError = 'Custom destination account must be at least 6 characters.';
      render();
      return;
    }

    if (amt + fee > src.balance) {
      playBeepError();
      runtime.transferError = `Insufficient funds in ${src.label} (need ${fmtMoney(amt + fee)} incl. fee).`;
      render();
      return;
    }

    runtime.transferError = '';
    runtime.screen = 'processing';
    runtime.processingText = 'Clearing Transfer Through Core Ledger...';
    render();

    setTimeout(() => {
      src.balance = Number((src.balance - amt - fee).toFixed(2));
      const now = fmtNow().slice(0, 16);
      const txId = `TXN${Math.floor(10000 + Math.random() * 89999)}`;
      let destLabel = '';

      if (tr.toType === 'internal') {
        const dstKey = tr.from === 'checking' ? 'savings' : 'checking';
        const dst = card.accounts[dstKey];
        dst.balance = Number((dst.balance + amt).toFixed(2));
        destLabel = dst.label;

        src.ledger.unshift({ id: txId, date: now, desc: `XFER TO ${dst.number.slice(-4)}`, type: 'DR', amount: amt, balance: src.balance });
        dst.ledger.unshift({ id: txId + 'C', date: now, desc: `XFER FROM ${src.number.slice(-4)}`, type: 'CR', amount: amt, balance: dst.balance });
      } else {
        destLabel = tr.toExternal === 'CUSTOM' ? `EXT-${tr.customAcct.trim()}` : tr.toExternal;
        src.ledger.unshift({ id: txId, date: now, desc: `ACH TO ${destLabel.slice(0, 14)}`, type: 'DR', amount: amt + fee, balance: src.balance });
      }

      generateReceipt({
        title: 'FUNDS TRANSFER',
        accountLabel: src.label,
        amount: amt,
        fee,
        detail: `TO: ${destLabel}`,
        availBalance: src.balance
      });

      saveState();
      playBeepSuccess();
      renderConsole();
      runtime.screen = 'receiptPrompt';
      render();
    }, 800);
  }

  /* ------------------------------------------------------------------------
     CHANGE PIN FLOW
     ------------------------------------------------------------------------ */
  function renderChangePin() {
    const pc = runtime.pinChange;
    const stepLabels = {
      1: 'Step 1 of 3: Enter your CURRENT 4-digit PIN',
      2: 'Step 2 of 3: Enter your NEW 4-digit PIN',
      3: 'Step 3 of 3: Re-enter NEW 4-digit PIN to confirm'
    };
    const activeVal = pc.step === 1 ? pc.current : pc.step === 2 ? pc.next : pc.confirm;

    el.scrTitle.textContent = 'CHANGE PIN';
    el.scrHintLeft.textContent = 'USE KEYPAD AND PRESS ENTER';

    const slots = {
      L4: { label: t('backMenu'), action: () => { runtime.screen = 'mainMenu'; render(); } },
      R4: { label: t('confirm'), variant: 'success', disabled: activeVal.length < 4, action: submitPinChangeStep }
    };

    setSoftKeys({
      L4: slots.L4.action,
      R4: activeVal.length === 4 ? slots.R4.action : null
    });

    const dots = [0, 1, 2, 3].map((i) => {
      const filled = i < activeVal.length;
      return `<div class="pin-dot ${filled ? 'filled' : ''}">${filled ? '&#9679;' : ''}</div>`;
    }).join('');

    el.scrBody.innerHTML = `
      <div class="scr-banner">
        <h2>Update Card PIN</h2>
        <p>${stepLabels[pc.step]}</p>
      </div>

      <div class="pin-panel">
        <div class="pin-dots">${dots}</div>
        <div class="pin-alert">${escapeHtml(pc.error)}</div>
      </div>

      ${renderSoftMenuGrid(slots)}
    `;
  }

  function submitPinChangeStep() {
    const card = getActiveCard();
    const pc = runtime.pinChange;
    const weakPins = new Set(['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321']);

    if (pc.step === 1) {
      if (pc.current !== card.pin) {
        playBeepError();
        pc.current = '';
        pc.error = 'Current PIN does not match.';
        render();
        return;
      }
      pc.error = '';
      pc.step = 2;
      playBeepSoft();
      render();
      return;
    }

    if (pc.step === 2) {
      if (weakPins.has(pc.next) || pc.next === card.pin) {
        playBeepError();
        pc.next = '';
        pc.error = 'Choose a stronger PIN different from your current PIN and common sequences.';
        render();
        return;
      }
      pc.error = '';
      pc.step = 3;
      playBeepSoft();
      render();
      return;
    }

    if (pc.step === 3) {
      if (pc.confirm !== pc.next) {
        playBeepError();
        pc.confirm = '';
        pc.error = 'Confirmation PIN did not match. Re-enter new PIN.';
        render();
        return;
      }

      card.pin = pc.next;
      saveState();
      playBeepSuccess();
      logBus('EPP', `PIN updated successfully for card •••• ${card.last4}`, 'ok');
      renderConsole();
      showMessage('PIN UPDATED', `Your PIN for card ending in ${card.last4} has been updated immediately.`, 'success', 'mainMenu');
    }
  }

  /* ------------------------------------------------------------------------
     PROCESSING, RECEIPT PROMPT & MESSAGE SCREENS
     ------------------------------------------------------------------------ */
  function renderProcessing() {
    el.scrTitle.textContent = 'PROCESSING';
    el.scrHintLeft.textContent = 'PLEASE WAIT — COMMUNICATING WITH HOST';
    setSoftKeys({});
    el.scrBody.innerHTML = `
      <div class="scr-processing">
        <div class="spinner-ring"></div>
        <div>
          <h2 style="margin:0 0 6px;color:#0a2540;font-size:16px;">Authorizing Transaction</h2>
          <p style="margin:0;color:#4e5d6c;font-size:12.5px;">${escapeHtml(runtime.processingText || 'Contacting Meridian Core Banking Switch...')}</p>
        </div>
      </div>
    `;
  }

  function renderReceiptPrompt() {
    const rcp = runtime.lastTxResult;
    el.scrTitle.textContent = 'TRANSACTION APPROVED';
    el.scrHintLeft.textContent = 'CHOOSE RECEIPT OPTION OR NEXT ACTION';

    const slots = {
      L3: {
        label: t('printReceipt'),
        variant: 'primary',
        action: () => {
          printLatestReceipt();
          showMessage('RECEIPT PRINTED', 'Please collect your thermal receipt below. Would you like another transaction?', 'success', 'mainMenu');
        }
      },
      L4: {
        label: t('anotherTx'),
        action: () => { runtime.screen = 'mainMenu'; render(); }
      },
      R4: {
        label: t('ejectCard'),
        variant: 'danger',
        action: () => ejectCard(t('cardReturned'))
      }
    };

    setSoftKeys({ L3: slots.L3.action, L4: slots.L4.action, R4: slots.R4.action });

    el.scrBody.innerHTML = `
      <div class="scr-banner" style="border-left-color:#0d7a5f;">
        <h2>Transaction Approved &mdash; ${escapeHtml(rcp ? rcp.title : 'COMPLETE')}</h2>
        <p>${rcp && rcp.amount !== null ? `Processed Amount: <strong class="mono">${fmtMoney(rcp.amount)}</strong>` : 'Your request has been completed.'}</p>
      </div>

      <div class="pin-panel" style="text-align:left;">
        <div style="font-size:11px;font-weight:700;color:#56687a;">REFERENCE ID</div>
        <div class="mono" style="font-size:15px;font-weight:700;color:#0a2540;margin-top:3px;">${escapeHtml(rcp ? rcp.id : 'RCP-000')}</div>
        <div style="font-size:12px;color:#475569;margin-top:4px;">Think before printing: you can also view your balance directly on screen.</div>
      </div>

      ${renderSoftMenuGrid(slots)}
    `;
  }

  function renderMessageScreen() {
    const m = runtime.messageScreen;
    const borderColor = m.variant === 'error' ? '#b91c1c' : m.variant === 'success' ? '#0d7a5f' : '#0a2540';
    el.scrTitle.textContent = m.variant === 'error' ? 'TERMINAL NOTICE' : 'INFORMATION';
    el.scrHintLeft.textContent = 'PRESS CONTINUE TO PROCEED';

    const proceed = () => {
      runtime.screen = m.nextAction === 'mainMenu' && !runtime.authenticated ? 'attract' : m.nextAction;
      render();
    };

    const slots = {
      R4: { label: 'Continue', variant: 'primary', action: proceed }
    };

    if (runtime.authenticated && m.nextAction !== 'attract') {
      slots.L4 = { label: t('ejectCard'), variant: 'danger', action: () => ejectCard(t('cardReturned')) };
    }

    setSoftKeys({ L4: slots.L4 ? slots.L4.action : null, R4: slots.R4.action });

    el.scrBody.innerHTML = `
      <div class="scr-banner" style="border-left-color:${borderColor};">
        <h2>${escapeHtml(m.title)}</h2>
        <p>${escapeHtml(m.body)}</p>
      </div>
      <div style="flex:1;"></div>
      ${renderSoftMenuGrid(slots)}
    `;
  }

  /* ------------------------------------------------------------------------
     EPP KEYPAD & KEYBOARD ROUTING
     ------------------------------------------------------------------------ */
  function handleKeypadDigit(digit) {
    resetSessionTimer();
    playBeepKey();

    if (runtime.screen === 'pinEntry') {
      if (digit === '00') return;
      if (runtime.pinInput.length < 4) {
        runtime.pinInput += digit;
        runtime.pinError = '';
        render();
      }
      return;
    }

    if (runtime.screen === 'withdrawAmount') {
      const next = (runtime.withdrawInput + digit).replace(/^0+/, '');
      if (next.length <= 4) {
        runtime.withdrawInput = next;
        runtime.withdrawError = '';
        render();
      }
      return;
    }

    if (runtime.screen === 'changePin') {
      if (digit === '00') return;
      const pc = runtime.pinChange;
      const field = pc.step === 1 ? 'current' : pc.step === 2 ? 'next' : 'confirm';
      if (pc[field].length < 4) {
        pc[field] += digit;
        pc.error = '';
        render();
      }
    }
  }

  function handleKeypadAction(action) {
    resetSessionTimer();

    if (action === 'CANCEL') {
      playBeepError();
      if (runtime.pendingDispense) return;
      if (runtime.activeCardId) ejectCard('Transaction cancelled by user.');
      return;
    }

    if (action === 'CLEAR' || action === 'BACK') {
      playBeepKey();
      const isBack = action === 'BACK';
      if (runtime.screen === 'pinEntry') {
        runtime.pinInput = isBack ? runtime.pinInput.slice(0, -1) : '';
        render();
      } else if (runtime.screen === 'withdrawAmount') {
        runtime.withdrawInput = isBack ? runtime.withdrawInput.slice(0, -1) : '';
        render();
      } else if (runtime.screen === 'changePin') {
        const pc = runtime.pinChange;
        const field = pc.step === 1 ? 'current' : pc.step === 2 ? 'next' : 'confirm';
        pc[field] = isBack ? pc[field].slice(0, -1) : '';
        render();
      }
      return;
    }

    if (action === 'ENTER') {
      playBeepKey();
      if (runtime.screen === 'pinEntry') submitPin();
      else if (runtime.screen === 'withdrawAmount') executeWithdrawal(runtime.selectedAccount, Number(runtime.withdrawInput || 0), runtime.preferSmallBills);
      else if (runtime.screen === 'changePin') submitPinChangeStep();
      else if (runtime.screen === 'transfer') executeTransfer();
      else if (runtime.screen === 'dispenseCash') collectDispensedCash();
      else if (runtime.screen === 'message' && runtime.softHandlers.R4) runtime.softHandlers.R4();
    }
  }

  /* ------------------------------------------------------------------------
     CONSOLE / DIAGNOSTICS RENDERER (WALLET, CASSETTES, RECEIPTS)
     ------------------------------------------------------------------------ */
  function renderConsole() {
    renderWallet();
    renderCassettes();
    renderReceiptsTab();
  }

  function renderWallet() {
    el.walletList.innerHTML = db.cards.map((card) => {
      const inserted = runtime.activeCardId === card.id;
      const badgeCls = card.locked ? 'locked' : inserted ? 'active' : '';
      const badgeText = card.locked ? 'LOCKED' : inserted ? 'IN READER' : card.network;
      return `
        <div class="wallet-card ${inserted ? 'is-inserted' : ''} ${card.locked ? 'is-locked' : ''}">
          <div class="wc-top">
            <div>
              <div class="wc-tier">${escapeHtml(card.tier)}</div>
              <div class="wc-holder">${escapeHtml(card.holder)} &bull; Exp ${card.expiry}</div>
            </div>
            <span class="wc-badge ${badgeCls}">${badgeText}</span>
          </div>
          <div class="wc-meta-row">
            <span class="wc-pan">•••• •••• •••• ${card.last4}</span>
            <span class="wc-pin">PIN: <strong>${card.pin}</strong></span>
          </div>
          <div class="wc-balances">
            <div class="wc-bal-box">
              <span>CHECKING</span>
              <strong>${fmtMoney(card.accounts.checking.balance)}</strong>
            </div>
            <div class="wc-bal-box">
              <span>SAVINGS</span>
              <strong>${fmtMoney(card.accounts.savings.balance)}</strong>
            </div>
          </div>
          <div class="wc-actions">
            <button type="button" class="wc-btn" data-insert="${card.id}" ${card.locked || Boolean(runtime.activeCardId) ? 'disabled' : ''}>
              ${inserted ? 'Card Active' : 'Insert Chip'}
            </button>
            <button type="button" class="wc-btn wc-btn-secondary" data-tap="${card.id}" ${card.locked || Boolean(runtime.activeCardId) ? 'disabled' : ''}>
              Tap NFC
            </button>
          </div>
        </div>
      `;
    }).join('');

    el.walletList.querySelectorAll('[data-insert]').forEach((btn) => {
      btn.addEventListener('click', () => insertCard(btn.dataset.insert, 'EMV_CHIP'));
    });
    el.walletList.querySelectorAll('[data-tap]').forEach((btn) => {
      btn.addEventListener('click', () => insertCard(btn.dataset.tap, 'NFC_TAP'));
    });
  }

  function renderCassettes() {
    el.vaultTotalCash.textContent = fmtMoney(getVaultTotal());
    el.vaultDepositCash.textContent = fmtMoney(db.depositEscrow);
    el.paperPct.textContent = `${db.paperLevel}%`;
    el.paperMeter.style.width = `${db.paperLevel}%`;
    el.paperMeter.className = 'meter-fill' + (db.paperLevel <= 0 ? ' empty' : db.paperLevel < 25 ? ' low' : '');

    el.cassetteList.innerHTML = [100, 50, 20, 10].map((d) => {
      const count = db.cassettes[d];
      const pct = Math.round((count / MAX_CASSETTE_CAP) * 100);
      const fillCls = count === 0 ? 'empty' : pct < 25 ? 'low' : '';
      return `
        <div class="cassette-row">
          <div class="cassette-head">
            <span>$${d} Cassette</span>
            <span class="mono">${count} / ${MAX_CASSETTE_CAP} notes (${fmtMoney(count * d)})</span>
          </div>
          <div class="meter-track">
            <div class="meter-fill ${fillCls}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderReceiptsTab(selectedId = null) {
    el.receiptCount.textContent = String(db.receipts.length);
    if (db.receipts.length === 0) {
      el.receiptViewer.innerHTML = `<div class="empty-state">No receipts printed yet. Complete a transaction and choose "Print Receipt".</div>`;
      el.receiptHistory.innerHTML = '';
      return;
    }

    const active = (selectedId && db.receipts.find((r) => r.id === selectedId)) || db.receipts[0];
    el.receiptViewer.innerHTML = `
      <div style="width:100%;max-width:310px;">
        <pre class="thermal-paper">${escapeHtml(active.text)}</pre>
        <div class="receipt-actions">
          <button type="button" class="svc-btn svc-sm" id="btn-download-rcp">Download .TXT</button>
        </div>
      </div>
    `;

    document.getElementById('btn-download-rcp').addEventListener('click', () => {
      const blob = new Blob([active.text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${active.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });

    el.receiptHistory.innerHTML = db.receipts.map((r) => `
      <button type="button" class="receipt-hist-item ${r.id === active.id ? 'active' : ''}" data-rcp="${r.id}">
        <span>${escapeHtml(r.title)}</span>
        <span class="mono">${escapeHtml(r.timestamp.slice(11))}</span>
      </button>
    `).join('');

    el.receiptHistory.querySelectorAll('[data-rcp]').forEach((btn) => {
      btn.addEventListener('click', () => renderReceiptsTab(btn.dataset.rcp));
    });
  }

  function switchConsoleTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach((b) => {
      const isTarget = b.dataset.tab === tabName;
      b.classList.toggle('active', isTarget);
      b.setAttribute('aria-selected', String(isTarget));
    });
    document.querySelectorAll('.tab-pane').forEach((p) => {
      p.classList.toggle('active', p.id === `pane-${tabName}`);
    });
  }

  /* ------------------------------------------------------------------------
     EVENT LISTENERS & INITIALIZATION
     ------------------------------------------------------------------------ */
  function bindEvents() {
    // Hardware soft-keys
    document.querySelectorAll('.softkey[data-softkey]').forEach((btn) => {
      btn.addEventListener('click', () => triggerSoftKey(btn.dataset.softkey));
    });

    // EPP PIN Pad buttons
    document.querySelectorAll('.epp-key[data-key]').forEach((btn) => {
      btn.addEventListener('click', () => handleKeypadDigit(btn.dataset.key));
    });
    document.querySelectorAll('.epp-key[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => handleKeypadAction(btn.dataset.action));
    });

    // Physical Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        if (e.key === 'Enter' && runtime.screen === 'transfer') {
          e.preventDefault();
          executeTransfer();
        }
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeypadAction('BACK');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleKeypadAction('CANCEL');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleKeypadAction('ENTER');
      }
    });

    // Physical Card Slot / Inserted Card click
    el.hwInsertedCard.addEventListener('click', () => {
      if (runtime.activeCardId && !runtime.pendingDispense) {
        ejectCard(t('cardReturned'));
      }
    });

    el.hwCardSlot.addEventListener('click', (e) => {
      if (e.target.closest('#hw-inserted-card')) return;
      if (!runtime.activeCardId && runtime.screen === 'attract') {
        const firstUnlocked = db.cards.find((c) => !c.locked);
        if (firstUnlocked) insertCard(firstUnlocked.id, 'EMV_CHIP');
      }
    });

    // Contactless NFC Pad click
    el.hwNfcPad.addEventListener('click', () => {
      if (!runtime.activeCardId && runtime.screen === 'attract') {
        const firstUnlocked = db.cards.find((c) => !c.locked);
        if (firstUnlocked) insertCard(firstUnlocked.id, 'NFC_TAP');
      }
    });

    // Collect Cash Bundle click
    el.hwCashBundle.addEventListener('click', collectDispensedCash);

    // Collect Receipt Slip click -> opens Receipts Tab
    el.hwReceiptPaper.addEventListener('click', () => {
      runtime.uncollectedReceipt = false;
      playBeepSoft();
      updateHardwareIndicators();
      switchConsoleTab('receipts');
      renderReceiptsTab();
      logBus('PRINTER', 'Customer collected printed thermal receipt');
    });

    // Console Tabs
    document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchConsoleTab(btn.dataset.tab));
    });

    // Sound Toggle
    el.btnSound.addEventListener('click', () => {
      runtime.soundEnabled = !runtime.soundEnabled;
      el.btnSound.setAttribute('aria-pressed', String(runtime.soundEnabled));
      el.soundLabel.textContent = `Audio: ${runtime.soundEnabled ? 'ON' : 'OFF'}`;
      if (runtime.soundEnabled) playBeepSoft();
    });

    // Service Actions
    el.btnReplenish.addEventListener('click', () => {
      db.cassettes = { 100: 40, 50: 40, 20: 50, 10: 50 };
      db.paperLevel = 100;
      saveState();
      playBeepSuccess();
      logBus('SERVICE', 'Technician replenished all cash cassettes and thermal paper (100%)', 'ok');
      renderConsole();
      if (runtime.screen === 'attract') render();
    });

    el.btnEmptyEscrow.addEventListener('click', () => {
      const prev = db.depositEscrow;
      db.depositEscrow = 0;
      saveState();
      playBeepSoft();
      logBus('SERVICE', `Cleared ${fmtMoney(prev)} from deposit escrow bin`, 'ok');
      renderConsole();
    });

    el.btnUnlockCards.addEventListener('click', () => {
      db.cards.forEach((c) => {
        c.locked = false;
        c.failedAttempts = 0;
      });
      saveState();
      playBeepSuccess();
      logBus('SERVICE', 'All retained/locked customer cards unlocked', 'ok');
      renderConsole();
      if (runtime.screen === 'attract') render();
    });

    el.btnFactoryReset.addEventListener('click', () => {
      stopSessionTimer();
      db = createDefaultData();
      saveState();
      runtime.activeCardId = null;
      runtime.authenticated = false;
      runtime.pendingDispense = null;
      runtime.uncollectedReceipt = false;
      runtime.lastTxResult = null;
      runtime.screen = 'attract';
      playBeepSoft();
      logBus('SYSTEM', 'Factory reset completed — default accounts & vault restored', 'warn');
      render();
      renderConsole();
    });

    el.btnClearLog.addEventListener('click', () => {
      el.telemetryStream.innerHTML = '';
      logBus('SYSTEM', 'Audit telemetry buffer cleared');
    });
  }

  function startHardwareClock() {
    const tick = () => {
      el.hwClock.textContent = new Date().toTimeString().slice(0, 8);
    };
    tick();
    setInterval(tick, 1000);
  }

  function init() {
    startHardwareClock();
    bindEvents();
    render();
    renderConsole();
    logBus('SYSTEM', `Terminal ${TERMINAL_ID} initialized • ISO-8583 switch connected`, 'ok');
    logBus('VAULT', `Loaded cash cassettes total=${fmtMoney(getVaultTotal())}, paper=${db.paperLevel}%`);
  }

  init();
})();
