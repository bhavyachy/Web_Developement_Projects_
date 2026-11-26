/* ==========================================================================
   KeyForge — Cryptographic Password & Entropy Workstation
   Pure Vanilla JavaScript (ES6+) using Web Crypto API (CSPRNG)
   ========================================================================== */

(() => {
  "use strict";

  // ------------------------------------------------------------------------
  // 1. Constants & Curated 256-Word Diceware-Style Wordlist (8 bits/word)
  // ------------------------------------------------------------------------
  const CHAR_SETS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    digits: "0123456789",
    ambiguous: new Set(["0", "O", "1", "l", "I", "|", "`", "'", '"']),
    recoveryAlphabet: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
    hexAlphabet: "0123456789ABCDEF",
  };

  // Exactly 256 distinct, easy-to-type English words (log2(256) = 8.00 bits/word)
  const WORDLIST = [
    "acorn", "adobe", "agate", "amber", "anchor", "angel", "angle", "ankle",
    "apple", "apron", "arbor", "arena", "armor", "arrow", "aspen", "atlas",
    "attic", "audio", "augur", "avocado", "badge", "bagel", "baker", "bamboo",
    "banjo", "barge", "barley", "basin", "basket", "beacon", "beaver", "belfry",
    "berry", "bevel", "birch", "bison", "blade", "blanket", "blazer", "blossom",
    "bobcat", "boiler", "bonnet", "border", "boulder", "branch", "brass", "breeze",
    "briar", "brick", "bridge", "bronze", "brook", "bucket", "buckle", "budget",
    "buffer", "bugle", "bullet", "bundle", "bunker", "burden", "butter", "button",
    "cabin", "cable", "cactus", "cadet", "calico", "camel", "camera", "canary",
    "candle", "canyon", "canvas", "carbon", "cargo", "carpet", "carrot", "carton",
    "castle", "cedar", "cellar", "cement", "chalk", "chapel", "charger", "cherry",
    "chisel", "cider", "cinder", "circle", "citron", "clamp", "clasp", "clover",
    "cobalt", "cobble", "coffee", "collar", "colony", "column", "comet", "compass",
    "copper", "coral", "corner", "cornet", "cotton", "cougar", "cradle", "craft",
    "crater", "crayon", "creek", "cricket", "crimson", "crocus", "crown", "crystal",
    "cupboard", "curtain", "cushion", "custom", "cypress", "dagger", "daisy", "dancer",
    "dapple", "dawn", "decade", "delta", "denim", "depot", "desert", "detail",
    "device", "diamond", "diesel", "digest", "dimple", "dinner", "doctor", "dollar",
    "dolphin", "domain", "domino", "donkey", "doodle", "dormer", "double", "dragon",
    "drawer", "drift", "drizzle", "drum", "duplex", "dusk", "eagle", "earring",
    "easel", "echo", "eclipse", "editor", "elbow", "elder", "ember", "emerald",
    "empire", "engine", "enigma", "epoch", "ermine", "errand", "estate", "evening",
    "fabric", "facade", "factor", "falcon", "fathom", "feather", "fender", "ferret",
    "fiddle", "filter", "finger", "finish", "flannel", "flint", "floral", "flute",
    "folder", "forest", "forger", "fossil", "fountain", "fresco", "friday", "frost",
    "funnel", "furnace", "gadget", "galaxy", "galley", "gallon", "garden", "garlic",
    "garnet", "gavel", "gazebo", "geyser", "ginger", "glacier", "glider", "globe",
    "gopher", "gorge", "gospel", "gravel", "griddle", "griffin", "groove", "grotto",
    "guitar", "gutter", "hammer", "hammock", "hamper", "harbor", "harvest", "hatchet",
    "haven", "hazard", "heather", "helmet", "hemlock", "herald", "heron", "hickory",
    "highway", "hinge", "hollow", "honey", "horizon", "hornet", "hostel", "humble",
    "hunter", "icicle", "indigo", "island", "ivory", "jacket", "jasper", "jigsaw"
  ];

  const COMMON_WEAK_TOKENS = [
    "password", "passw0rd", "admin", "administrator", "welcome", "letmein",
    "qwerty", "asdfgh", "zxcvbn", "123456", "12345678", "iloveyou", "monkey",
    "dragon", "football", "baseball", "sunshine", "princess", "trustno1"
  ];

  const KEYBOARD_ROWS = ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

  // ------------------------------------------------------------------------
  // 2. Application State & DOM References
  // ------------------------------------------------------------------------
  const state = {
    mode: "random", // 'random' | 'passphrase' | 'pin' | 'audit'
    currentCredential: "",
    lastMeta: { poolSize: 94, theoreticalBits: 0, modeLabel: "Random" },
    masked: false,
    history: [],
    batchItems: [],
  };

  const els = {
    themeToggle: document.getElementById("themeToggle"),
    themeIconSun: document.getElementById("themeIconSun"),
    themeIconMoon: document.getElementById("themeIconMoon"),
    themeLabel: document.getElementById("themeLabel"),

    modeTabs: document.querySelectorAll(".mode-tab"),
    presetsCard: document.getElementById("presetsCard"),
    presetBtns: document.querySelectorAll(".preset-btn"),

    passwordFormatted: document.getElementById("passwordFormatted"),
    customAuditInput: document.getElementById("customAuditInput"),
    charCountChip: document.getElementById("charCountChip"),
    entropyChip: document.getElementById("entropyChip"),
    strengthBadge: document.getElementById("strengthBadge"),
    strengthFill: document.getElementById("strengthFill"),

    toggleMaskBtn: document.getElementById("toggleMaskBtn"),
    copyBtn: document.getElementById("copyBtn"),
    regenerateBtn: document.getElementById("regenerateBtn"),

    // Config Panels
    randomConfig: document.getElementById("randomConfig"),
    passphraseConfig: document.getElementById("passphraseConfig"),
    pinConfig: document.getElementById("pinConfig"),
    auditConfig: document.getElementById("auditConfig"),

    // Random controls
    poolSizeLabel: document.getElementById("poolSizeLabel"),
    lengthRange: document.getElementById("lengthRange"),
    lengthNumber: document.getElementById("lengthNumber"),
    lengthDecBtn: document.getElementById("lengthDecBtn"),
    lengthIncBtn: document.getElementById("lengthIncBtn"),
    optUpper: document.getElementById("optUpper"),
    optLower: document.getElementById("optLower"),
    optDigits: document.getElementById("optDigits"),
    optSymbols: document.getElementById("optSymbols"),
    optExcludeAmbiguous: document.getElementById("optExcludeAmbiguous"),
    optStrictPolicy: document.getElementById("optStrictPolicy"),
    optNoRepeats: document.getElementById("optNoRepeats"),
    customSymbolSet: document.getElementById("customSymbolSet"),

    // Passphrase controls
    wordlistSizeLabel: document.getElementById("wordlistSizeLabel"),
    wordCountRange: document.getElementById("wordCountRange"),
    wordCountValue: document.getElementById("wordCountValue"),
    wordSeparator: document.getElementById("wordSeparator"),
    wordCasing: document.getElementById("wordCasing"),
    optPhraseNumber: document.getElementById("optPhraseNumber"),
    optPhraseSymbol: document.getElementById("optPhraseSymbol"),

    // PIN / Recovery controls
    pinFormatLabel: document.getElementById("pinFormatLabel"),
    pinType: document.getElementById("pinType"),
    pinLength: document.getElementById("pinLength"),
    optPinNoSequential: document.getElementById("optPinNoSequential"),

    // Audit controls
    clearAuditBtn: document.getElementById("clearAuditBtn"),
    sampleWeakBtn: document.getElementById("sampleWeakBtn"),
    sampleStrongBtn: document.getElementById("sampleStrongBtn"),

    // Batch
    batchCard: document.getElementById("batchCard"),
    batchCountSelect: document.getElementById("batchCountSelect"),
    generateBatchBtn: document.getElementById("generateBatchBtn"),
    copyBatchBtn: document.getElementById("copyBatchBtn"),
    exportBatchBtn: document.getElementById("exportBatchBtn"),
    batchList: document.getElementById("batchList"),

    // Analysis & Threat Models
    effectiveEntropyTag: document.getElementById("effectiveEntropyTag"),
    kpiTheoretical: document.getElementById("kpiTheoretical"),
    kpiFormula: document.getElementById("kpiFormula"),
    kpiEffective: document.getElementById("kpiEffective"),
    kpiPenalty: document.getElementById("kpiPenalty"),

    barUpper: document.getElementById("barUpper"),
    barLower: document.getElementById("barLower"),
    barDigits: document.getElementById("barDigits"),
    barSymbols: document.getElementById("barSymbols"),
    countUpper: document.getElementById("countUpper"),
    countLower: document.getElementById("countLower"),
    countDigits: document.getElementById("countDigits"),
    countSymbols: document.getElementById("countSymbols"),

    crackOnlineSlow: document.getElementById("crackOnlineSlow"),
    crackOnlineFast: document.getElementById("crackOnlineFast"),
    crackOfflineSlow: document.getElementById("crackOfflineSlow"),
    crackOfflineFast: document.getElementById("crackOfflineFast"),

    policyChecklist: document.getElementById("policyChecklist"),

    // History & Toast
    historyList: document.getElementById("historyList"),
    clearHistoryBtn: document.getElementById("clearHistoryBtn"),
    toast: document.getElementById("toast"),
  };

  // ------------------------------------------------------------------------
  // 3. Cryptographic Primitives (Unbiased CSPRNG)
  // ------------------------------------------------------------------------

  /**
   * Generates a uniformly distributed random integer in [0, maxExclusive)
   * using window.crypto.getRandomValues() with rejection sampling to eliminate
   * modulo bias.
   */
  function cryptoRandomInt(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError("maxExclusive must be a positive integer.");
    }
    if (maxExclusive === 1) return 0;

    const range = 0x100000000; // 2^32
    const limit = Math.floor(range / maxExclusive) * maxExclusive;
    const buffer = new Uint32Array(1);

    while (true) {
      window.crypto.getRandomValues(buffer);
      if (buffer[0] < limit) {
        return buffer[0] % maxExclusive;
      }
    }
  }

  /**
   * Unbiased in-place Fisher-Yates shuffle driven by CSPRNG.
   */
  function shuffleArray(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = cryptoRandomInt(i + 1);
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function pickRandomChar(charPool, disallowChar = null) {
    if (!charPool || charPool.length === 0) return "";
    if (!disallowChar || charPool.length === 1) {
      return charPool[cryptoRandomInt(charPool.length)];
    }
    let candidate = "";
    for (let attempt = 0; attempt < 24; attempt++) {
      candidate = charPool[cryptoRandomInt(charPool.length)];
      if (candidate !== disallowChar) return candidate;
    }
    return candidate;
  }

  // ------------------------------------------------------------------------
  // 4. Credential Generators
  // ------------------------------------------------------------------------

  function filterAmbiguous(str, shouldExclude) {
    if (!shouldExclude) return str;
    return Array.from(str)
      .filter((ch) => !CHAR_SETS.ambiguous.has(ch))
      .join("");
  }

  function uniqueChars(str) {
    return Array.from(new Set(Array.from(str))).join("");
  }

  function buildRandomCharacterClasses() {
    const excludeAmb = els.optExcludeAmbiguous.checked;
    const classes = [];

    if (els.optUpper.checked) {
      const pool = filterAmbiguous(CHAR_SETS.upper, excludeAmb);
      if (pool.length) classes.push(pool);
    }
    if (els.optLower.checked) {
      const pool = filterAmbiguous(CHAR_SETS.lower, excludeAmb);
      if (pool.length) classes.push(pool);
    }
    if (els.optDigits.checked) {
      const pool = filterAmbiguous(CHAR_SETS.digits, excludeAmb);
      if (pool.length) classes.push(pool);
    }
    if (els.optSymbols.checked) {
      const rawSymbols = uniqueChars(els.customSymbolSet.value.replace(/\s+/g, ""));
      const pool = filterAmbiguous(rawSymbols, excludeAmb);
      if (pool.length) classes.push(pool);
    }

    const combinedPool = uniqueChars(classes.join(""));
    return { classes, combinedPool };
  }

  function generateRandomPassword() {
    const length = clampInt(parseInt(els.lengthNumber.value, 10) || 16, 6, 128);
    const { classes, combinedPool } = buildRandomCharacterClasses();

    if (combinedPool.length === 0) {
      // Fallback safety: re-enable lowercase if user unchecked everything
      els.optLower.checked = true;
      return generateRandomPassword();
    }

    els.poolSizeLabel.textContent = `Pool: ${combinedPool.length} chars`;

    const strictPolicy = els.optStrictPolicy.checked;
    const noRepeats = els.optNoRepeats.checked;
    const chars = [];

    if (strictPolicy && length >= classes.length) {
      for (const cls of classes) {
        chars.push(pickRandomChar(cls));
      }
    }

    while (chars.length < length) {
      const prev = noRepeats && chars.length > 0 ? chars[chars.length - 1] : null;
      chars.push(pickRandomChar(combinedPool, prev));
    }

    let resultArr = shuffleArray(chars);

    // If noRepeats is active and shuffling created adjacent duplicates, fix locally
    if (noRepeats && combinedPool.length > 1) {
      for (let i = 1; i < resultArr.length; i++) {
        if (resultArr[i] === resultArr[i - 1]) {
          const nextChar = i + 1 < resultArr.length ? resultArr[i + 1] : null;
          let replacement = pickRandomChar(combinedPool, resultArr[i - 1]);
          let guard = 0;
          while ((replacement === resultArr[i - 1] || replacement === nextChar) && guard < 20) {
            replacement = pickRandomChar(combinedPool, resultArr[i - 1]);
            guard++;
          }
          resultArr[i] = replacement;
        }
      }
    }

    const password = resultArr.join("");
    const theoreticalBits = length * Math.log2(combinedPool.length);

    return {
      value: password,
      meta: {
        poolSize: combinedPool.length,
        theoreticalBits,
        formula: `${length} × log₂(${combinedPool.length})`,
        modeLabel: "Random",
      },
    };
  }

  function formatWord(word, casing) {
    if (casing === "upper") return word.toUpperCase();
    if (casing === "title") return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    return word.toLowerCase();
  }

  function generatePassphrase() {
    const wordCount = clampInt(parseInt(els.wordCountRange.value, 10) || 5, 3, 10);
    const separator = els.wordSeparator.value;
    const casing = els.wordCasing.value;
    const addNumber = els.optPhraseNumber.checked;
    const addSymbol = els.optPhraseSymbol.checked;

    const words = [];
    for (let i = 0; i < wordCount; i++) {
      const idx = cryptoRandomInt(WORDLIST.length);
      words.push(formatWord(WORDLIST[idx], casing));
    }

    let extraBits = 0;
    if (addNumber) {
      const targetIdx = cryptoRandomInt(words.length);
      const twoDigit = 10 + cryptoRandomInt(90); // 10..99
      words[targetIdx] += String(twoDigit);
      extraBits += Math.log2(90);
    }

    let phrase = words.join(separator);

    if (addSymbol) {
      const symPool = "!@#$%^&*?-_=+";
      phrase += pickRandomChar(symPool);
      extraBits += Math.log2(symPool.length);
    }

    const wordBits = wordCount * Math.log2(WORDLIST.length);
    const theoreticalBits = wordBits + extraBits;

    return {
      value: phrase,
      meta: {
        poolSize: WORDLIST.length,
        theoreticalBits,
        formula: `${wordCount} × log₂(${WORDLIST.length})${extraBits > 0 ? " + extras" : ""}`,
        modeLabel: "Passphrase",
      },
    };
  }

  function hasTrivialSequenceOrRepeat(digits) {
    if (digits.length < 3) return false;
    const allSame = digits.split("").every((c) => c === digits[0]);
    if (allSame) return true;

    let asc = true;
    let desc = true;
    for (let i = 1; i < digits.length; i++) {
      const diff = digits.charCodeAt(i) - digits.charCodeAt(i - 1);
      if (diff !== 1) asc = false;
      if (diff !== -1) desc = false;
    }
    return asc || desc;
  }

  function generatePinOrRecovery() {
    const pinType = els.pinType.value;
    const length = parseInt(els.pinLength.value, 10) || 6;
    const rejectSequential = els.optPinNoSequential.checked;

    let raw = "";
    let alphabet = CHAR_SETS.digits;
    let formatted = "";

    if (pinType === "hex") {
      alphabet = CHAR_SETS.hexAlphabet;
    } else if (pinType === "recovery") {
      alphabet = CHAR_SETS.recoveryAlphabet;
    }

    for (let attempt = 0; attempt < 25; attempt++) {
      let buf = "";
      for (let i = 0; i < length; i++) {
        buf += pickRandomChar(alphabet);
      }
      if (!rejectSequential || !hasTrivialSequenceOrRepeat(buf)) {
        raw = buf;
        break;
      }
      raw = buf;
    }

    if (pinType === "recovery") {
      formatted = raw.match(/.{1,4}/g).join("-");
    } else if (pinType === "hex" && length >= 16) {
      formatted = raw.match(/.{1,4}/g).join("-");
    } else {
      formatted = raw;
    }

    const theoreticalBits = length * Math.log2(alphabet.length);
    const modeLabel =
      pinType === "numeric" ? "PIN" : pinType === "hex" ? "Hex Key" : "Recovery Key";

    return {
      value: formatted,
      meta: {
        poolSize: alphabet.length,
        theoreticalBits,
        formula: `${length} × log₂(${alphabet.length})`,
        modeLabel,
      },
    };
  }

  // ------------------------------------------------------------------------
  // 5. Entropy, Heuristic Pattern Detection & Crack-Time Modeling
  // ------------------------------------------------------------------------

  function hasSequentialRun(str, minRun = 3) {
    if (str.length < minRun) return false;
    const lower = str.toLowerCase();
    let ascRun = 1;
    let descRun = 1;

    for (let i = 1; i < lower.length; i++) {
      const prev = lower.charCodeAt(i - 1);
      const curr = lower.charCodeAt(i);
      const isAlphaNum = /[a-z0-9]/.test(lower[i]) && /[a-z0-9]/.test(lower[i - 1]);

      if (isAlphaNum && curr - prev === 1) {
        ascRun++;
        if (ascRun >= minRun) return true;
      } else {
        ascRun = 1;
      }

      if (isAlphaNum && prev - curr === 1) {
        descRun++;
        if (descRun >= minRun) return true;
      } else {
        descRun = 1;
      }
    }

    // Check 4-char keyboard walks
    for (const row of KEYBOARD_ROWS) {
      const rev = row.split("").reverse().join("");
      for (let i = 0; i <= row.length - 4; i++) {
        const sub = row.slice(i, i + 4);
        const subRev = rev.slice(i, i + 4);
        if (lower.includes(sub) || lower.includes(subRev)) {
          return true;
        }
      }
    }

    return false;
  }

  function hasRepeatedRun(str, minRun = 3) {
    const regex = new RegExp(`(.)\\1{${minRun - 1},}`);
    return regex.test(str);
  }

  function analyzeCredential(credential, customMeta = null) {
    const len = credential.length;
    let upper = 0;
    let lower = 0;
    let digits = 0;
    let symbols = 0;

    for (const ch of credential) {
      if (/[A-Z]/.test(ch)) upper++;
      else if (/[a-z]/.test(ch)) lower++;
      else if (/[0-9]/.test(ch)) digits++;
      else symbols++;
    }

    const activeClasses =
      (upper > 0 ? 1 : 0) +
      (lower > 0 ? 1 : 0) +
      (digits > 0 ? 1 : 0) +
      (symbols > 0 ? 1 : 0);

    // Infer pool size from observed classes when auditing arbitrary input
    let inferredPool = 0;
    if (upper > 0) inferredPool += 26;
    if (lower > 0) inferredPool += 26;
    if (digits > 0) inferredPool += 10;
    if (symbols > 0) inferredPool += 32;

    const theoreticalBits = customMeta
      ? customMeta.theoreticalBits
      : len > 0 && inferredPool > 0
      ? len * Math.log2(inferredPool)
      : 0;

    const formula = customMeta
      ? customMeta.formula
      : len > 0
      ? `${len} × log₂(${inferredPool})`
      : "0 × log₂(0)";

    // Heuristic penalties for weak structure (especially relevant in Audit mode)
    let penaltyBits = 0;
    const penalties = [];

    const repeatIssue = len > 0 && hasRepeatedRun(credential, 3);
    const seqIssue = len > 0 && hasSequentialRun(credential, 3);

    if (repeatIssue) {
      penaltyBits += 14;
      penalties.push("repeated characters");
    }
    if (seqIssue) {
      penaltyBits += 16;
      penalties.push("sequential/keyboard pattern");
    }

    const lowerCred = credential.toLowerCase();
    for (const token of COMMON_WEAK_TOKENS) {
      if (lowerCred.includes(token)) {
        penaltyBits += 24;
        penalties.push(`common word "${token}"`);
        break;
      }
    }

    if (len >= 6) {
      const uniqueRatio = new Set(credential).size / len;
      if (uniqueRatio < 0.45) {
        penaltyBits += 12;
        penalties.push("low character uniqueness");
      }
    }

    const effectiveBits = Math.max(0, theoreticalBits - penaltyBits);

    return {
      len,
      counts: { upper, lower, digits, symbols },
      activeClasses,
      theoreticalBits,
      effectiveBits,
      formula,
      penalties,
      checks: {
        length: len >= 12,
        variety: activeClasses >= 3,
        repeats: len > 0 && !repeatIssue,
        sequences: len > 0 && !seqIssue,
      },
    };
  }

  function formatCrackDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds > 1e25) {
      return "> Age of Universe";
    }
    if (seconds < 0.001) return "Instant (< 1 ms)";
    if (seconds < 1) return "Instant (< 1 sec)";
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    const mins = seconds / 60;
    if (mins < 60) return `${Math.round(mins)} min`;
    const hours = mins / 60;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    const days = hours / 24;
    if (days < 365.25) return `${Math.round(days)} days`;
    const years = days / 365.25;
    if (years < 1e3) return `${Math.round(years)} years`;
    if (years < 1e6) return `${(years / 1e3).toFixed(1)}k years`;
    if (years < 1e9) return `${(years / 1e6).toFixed(1)}M years`;
    if (years < 1e12) return `${(years / 1e9).toFixed(1)}B years`;
    if (years < 1e15) return `${(years / 1e12).toFixed(1)}T years`;
    return "> 1 Quadrillion yrs";
  }

  function classifyStrength(bits) {
    if (bits < 36) {
      return { label: "Very Weak", cls: "strength-weak", color: "var(--status-weak)", pct: 18 };
    }
    if (bits < 56) {
      return { label: "Weak", cls: "strength-weak", color: "var(--status-weak)", pct: 38 };
    }
    if (bits < 76) {
      return { label: "Fair", cls: "strength-fair", color: "var(--status-fair)", pct: 60 };
    }
    if (bits < 100) {
      return { label: "Strong", cls: "strength-good", color: "var(--status-good)", pct: 82 };
    }
    return { label: "Very Strong", cls: "strength-strong", color: "var(--status-strong)", pct: 100 };
  }

  // ------------------------------------------------------------------------
  // 6. UI Rendering
  // ------------------------------------------------------------------------

  function renderFormattedCredential(text) {
    const container = els.passwordFormatted;
    container.innerHTML = "";

    if (!text) {
      container.textContent = "—";
      return;
    }

    if (state.masked) {
      container.classList.add("masked");
      container.textContent = "•".repeat(Math.min(text.length, 48));
      return;
    }

    container.classList.remove("masked");
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const span = document.createElement("span");
      if (/[A-Za-z]/.test(ch)) {
        span.className = "ch-letter";
      } else if (/[0-9]/.test(ch)) {
        span.className = "ch-digit";
      } else {
        span.className = "ch-symbol";
      }
      span.textContent = ch;
      frag.appendChild(span);
    }
    container.appendChild(frag);
  }

  function renderAnalysis(credential, customMeta = null) {
    const stats = analyzeCredential(credential, customMeta);
    const tier = classifyStrength(stats.effectiveBits);

    els.charCountChip.textContent = `${stats.len} ${stats.len === 1 ? "char" : "chars"}`;
    els.entropyChip.textContent = `${stats.effectiveBits.toFixed(1)} bits`;
    els.effectiveEntropyTag.textContent = `${stats.effectiveBits.toFixed(1)} bits`;

    els.strengthBadge.textContent = stats.len === 0 ? "Empty" : tier.label;
    els.strengthBadge.className = `strength-badge ${stats.len === 0 ? "strength-weak" : tier.cls}`;

    els.strengthFill.style.width = stats.len === 0 ? "0%" : `${tier.pct}%`;
    els.strengthFill.style.backgroundColor = tier.color;

    els.kpiTheoretical.textContent = `${stats.theoreticalBits.toFixed(1)} bits`;
    els.kpiFormula.textContent = stats.formula;
    els.kpiEffective.textContent = `${stats.effectiveBits.toFixed(1)} bits`;
    els.kpiPenalty.textContent =
      stats.penalties.length > 0
        ? `Penalized: ${stats.penalties.join(", ")}`
        : "No pattern penalties detected";

    const total = Math.max(stats.len, 1);
    els.countUpper.textContent = stats.counts.upper;
    els.countLower.textContent = stats.counts.lower;
    els.countDigits.textContent = stats.counts.digits;
    els.countSymbols.textContent = stats.counts.symbols;

    els.barUpper.style.width = `${(stats.counts.upper / total) * 100}%`;
    els.barLower.style.width = `${(stats.counts.lower / total) * 100}%`;
    els.barDigits.style.width = `${(stats.counts.digits / total) * 100}%`;
    els.barSymbols.style.width = `${(stats.counts.symbols / total) * 100}%`;

    // 50% exhaustion: 0.5 * 2^H = 2^(H - 1)
    if (stats.len === 0) {
      els.crackOnlineSlow.textContent = "—";
      els.crackOnlineFast.textContent = "—";
      els.crackOfflineSlow.textContent = "—";
      els.crackOfflineFast.textContent = "—";
    } else {
      const halfKeyspace = Math.pow(2, Math.max(0, stats.effectiveBits - 1));
      els.crackOnlineSlow.textContent = formatCrackDuration(halfKeyspace / (100 / 3600));
      els.crackOnlineFast.textContent = formatCrackDuration(halfKeyspace / 1000);
      els.crackOfflineSlow.textContent = formatCrackDuration(halfKeyspace / 1e4);
      els.crackOfflineFast.textContent = formatCrackDuration(halfKeyspace / 1e11);
    }

    // Update heuristic checklist
    const checkItems = els.policyChecklist.querySelectorAll("li");
    checkItems.forEach((li) => {
      const key = li.dataset.check;
      const passed = Boolean(stats.checks[key]);
      li.classList.remove("pass", "fail");
      const icon = li.querySelector(".check-icon");
      if (stats.len === 0) {
        icon.textContent = "";
      } else if (passed) {
        li.classList.add("pass");
        icon.textContent = "✓";
      } else {
        li.classList.add("fail");
        icon.textContent = "!";
      }
    });
  }

  function pushHistory(value, meta) {
    if (!value) return;
    if (state.history.length > 0 && state.history[0].value === value) return;

    const entry = {
      value,
      bits: meta.theoreticalBits.toFixed(1),
      modeLabel: meta.modeLabel,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    state.history.unshift(entry);
    if (state.history.length > 15) {
      state.history.pop();
    }
    renderHistory();
  }

  function renderHistory() {
    const list = els.historyList;
    list.innerHTML = "";

    if (state.history.length === 0) {
      list.classList.add("empty-state");
      const li = document.createElement("li");
      li.className = "empty-message";
      li.textContent = "Generated credentials appear here for quick retrieval.";
      list.appendChild(li);
      return;
    }

    list.classList.remove("empty-state");
    state.history.forEach((item) => {
      const li = document.createElement("li");
      li.className = "list-item";

      const main = document.createElement("div");
      main.className = "list-item-main";

      const code = document.createElement("span");
      code.className = "list-item-code";
      code.textContent = state.masked ? "•".repeat(Math.min(item.value.length, 24)) : item.value;
      code.title = state.masked ? "Unmask to inspect" : item.value;

      const meta = document.createElement("span");
      meta.className = "list-item-meta";
      meta.textContent = `${item.modeLabel} · ${item.bits} bits · ${item.time}`;

      main.appendChild(code);
      main.appendChild(meta);

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-ghost btn-sm";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", () => copyText(item.value, "History item copied"));

      li.appendChild(main);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  function renderBatch(items) {
    const list = els.batchList;
    list.innerHTML = "";
    state.batchItems = items;

    if (!items.length) {
      list.classList.add("empty-state");
      els.copyBatchBtn.classList.add("hidden");
      els.exportBatchBtn.classList.add("hidden");
      const li = document.createElement("li");
      li.className = "empty-message";
      li.innerHTML = "Click <strong>Generate Batch</strong> to produce a list of credentials for bulk provisioning.";
      list.appendChild(li);
      return;
    }

    list.classList.remove("empty-state");
    els.copyBatchBtn.classList.remove("hidden");
    els.exportBatchBtn.classList.remove("hidden");

    items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "list-item";

      const main = document.createElement("div");
      main.className = "list-item-main";

      const code = document.createElement("span");
      code.className = "list-item-code";
      code.textContent = item.value;

      const meta = document.createElement("span");
      meta.className = "list-item-meta";
      meta.textContent = `#${index + 1} · ${item.value.length} chars · ${item.meta.theoreticalBits.toFixed(1)} bits`;

      main.appendChild(code);
      main.appendChild(meta);

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-ghost btn-sm";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", () => copyText(item.value, `Credential #${index + 1} copied`));

      li.appendChild(main);
      li.appendChild(copyBtn);
      list.appendChild(li);
    });
  }

  // ------------------------------------------------------------------------
  // 7. Generation Dispatcher & Mode Management
  // ------------------------------------------------------------------------

  function generateSingleByMode(mode) {
    if (mode === "passphrase") return generatePassphrase();
    if (mode === "pin") return generatePinOrRecovery();
    return generateRandomPassword();
  }

  function refreshCurrentCredential(recordHistory = true) {
    if (state.mode === "audit") {
      const val = els.customAuditInput.value;
      state.currentCredential = val;
      renderAnalysis(val, null);
      return;
    }

    const generated = generateSingleByMode(state.mode);
    state.currentCredential = generated.value;
    state.lastMeta = generated.meta;

    renderFormattedCredential(generated.value);
    renderAnalysis(generated.value, generated.meta);

    if (recordHistory) {
      pushHistory(generated.value, generated.meta);
    }
  }

  function syncPinLengthOptions() {
    const type = els.pinType.value;
    const prevVal = els.pinLength.value;
    els.pinLength.innerHTML = "";

    let options = [];
    if (type === "numeric") {
      els.pinFormatLabel.textContent = "Numeric CSPRNG (0–9)";
      options = [
        ["4", "4 digits"],
        ["6", "6 digits"],
        ["8", "8 digits"],
        ["12", "12 digits"],
      ];
    } else if (type === "hex") {
      els.pinFormatLabel.textContent = "Hexadecimal (0–9, A–F)";
      options = [
        ["16", "16 hex chars (64-bit)"],
        ["24", "24 hex chars (96-bit)"],
        ["32", "32 hex chars (128-bit)"],
        ["64", "64 hex chars (256-bit)"],
      ];
    } else {
      els.pinFormatLabel.textContent = "Unambiguous Base32 Blocks";
      options = [
        ["16", "4×4 blocks (16 chars)"],
        ["24", "6×4 blocks (24 chars)"],
        ["32", "8×4 blocks (32 chars)"],
      ];
    }

    options.forEach(([val, label]) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label;
      els.pinLength.appendChild(opt);
    });

    const match = options.find(([val]) => val === prevVal);
    els.pinLength.value = match ? prevVal : type === "numeric" ? "6" : "16";
  }

  function switchMode(newMode) {
    state.mode = newMode;

    els.modeTabs.forEach((tab) => {
      const active = tab.dataset.mode === newMode;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    els.randomConfig.classList.toggle("hidden", newMode !== "random");
    els.passphraseConfig.classList.toggle("hidden", newMode !== "passphrase");
    els.pinConfig.classList.toggle("hidden", newMode !== "pin");
    els.auditConfig.classList.toggle("hidden", newMode !== "audit");

    const isAudit = newMode === "audit";
    els.passwordFormatted.classList.toggle("hidden", isAudit);
    els.customAuditInput.classList.toggle("hidden", !isAudit);
    els.presetsCard.classList.toggle("hidden", isAudit);
    els.batchCard.classList.toggle("hidden", isAudit);
    els.toggleMaskBtn.classList.toggle("hidden", isAudit);
    els.regenerateBtn.classList.toggle("hidden", isAudit);

    if (isAudit) {
      els.customAuditInput.focus();
      refreshCurrentCredential(false);
    } else {
      refreshCurrentCredential(true);
    }
  }

  function applyPreset(presetName) {
    if (presetName === "standard") {
      switchMode("random");
      setRandomLength(16);
      els.optUpper.checked = true;
      els.optLower.checked = true;
      els.optDigits.checked = true;
      els.optSymbols.checked = true;
      els.optExcludeAmbiguous.checked = false;
      els.optStrictPolicy.checked = true;
      els.customSymbolSet.value = "!@#$%^&*()-_=+[]{};:,.<>?";
    } else if (presetName === "vault") {
      switchMode("random");
      setRandomLength(24);
      els.optUpper.checked = true;
      els.optLower.checked = true;
      els.optDigits.checked = true;
      els.optSymbols.checked = true;
      els.optExcludeAmbiguous.checked = false;
      els.optStrictPolicy.checked = true;
      els.customSymbolSet.value = "!@#$%^&*()-_=+[]{};:,.<>?";
    } else if (presetName === "wifi") {
      switchMode("random");
      setRandomLength(32);
      els.optUpper.checked = true;
      els.optLower.checked = true;
      els.optDigits.checked = true;
      els.optSymbols.checked = true;
      els.optExcludeAmbiguous.checked = true;
      els.optStrictPolicy.checked = true;
      els.customSymbolSet.value = "!@#$%-_=+";
    } else if (presetName === "passphrase") {
      switchMode("passphrase");
      els.wordCountRange.value = "5";
      els.wordCountValue.textContent = "5 words";
      els.wordSeparator.value = "-";
      els.wordCasing.value = "title";
      els.optPhraseNumber.checked = true;
      els.optPhraseSymbol.checked = false;
    } else if (presetName === "recovery") {
      switchMode("pin");
      els.pinType.value = "recovery";
      syncPinLengthOptions();
      els.pinLength.value = "16";
      els.optPinNoSequential.checked = true;
    }

    refreshCurrentCredential(true);
    showToast("Applied preset profile");
  }

  // ------------------------------------------------------------------------
  // 8. Utilities: Clipboard, Export, Toast, Theme
  // ------------------------------------------------------------------------

  function clampInt(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function setRandomLength(val) {
    const clamped = clampInt(val, 6, 128);
    els.lengthRange.value = String(clamped);
    els.lengthNumber.value = String(clamped);
  }

  let toastTimer = null;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove("visible");
    }, 2200);
  }

  async function copyText(text, successMsg = "Copied to clipboard") {
    if (!text) {
      showToast("Nothing to copy");
      return;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      showToast(successMsg);
    } catch {
      showToast("Clipboard copy blocked by browser");
    }
  }

  function exportBatchAsText() {
    if (!state.batchItems.length) return;
    const lines = [
      `# KeyForge Batch Export (${new Date().toISOString()})`,
      `# Mode: ${state.mode} | Count: ${state.batchItems.length}`,
      "",
      ...state.batchItems.map((item) => item.value),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `keyforge-batch-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded batch .txt file");
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const isDark = theme === "dark";
    els.themeIconSun.classList.toggle("hidden", !isDark);
    els.themeIconMoon.classList.toggle("hidden", isDark);
    els.themeLabel.textContent = isDark ? "Light" : "Dark";
    try {
      localStorage.setItem("keyforge_theme", theme);
    } catch {
      // Ignore storage restrictions
    }
  }

  // ------------------------------------------------------------------------
  // 9. Event Listeners & Initialization
  // ------------------------------------------------------------------------

  function bindEvents() {
    els.themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });

    els.modeTabs.forEach((tab) => {
      tab.addEventListener("click", () => switchMode(tab.dataset.mode));
    });

    els.presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
    });

    els.regenerateBtn.addEventListener("click", () => refreshCurrentCredential(true));

    els.copyBtn.addEventListener("click", () => {
      const target =
        state.mode === "audit" ? els.customAuditInput.value : state.currentCredential;
      copyText(target, "Credential copied to clipboard");
    });

    els.toggleMaskBtn.addEventListener("click", () => {
      state.masked = !state.masked;
      els.toggleMaskBtn.textContent = state.masked ? "Reveal" : "Mask";
      els.toggleMaskBtn.setAttribute("aria-pressed", String(state.masked));
      renderFormattedCredential(state.currentCredential);
      renderHistory();
    });

    // Random length controls
    els.lengthRange.addEventListener("input", () => {
      setRandomLength(parseInt(els.lengthRange.value, 10));
      refreshCurrentCredential(false);
    });
    els.lengthRange.addEventListener("change", () => refreshCurrentCredential(true));

    els.lengthNumber.addEventListener("change", () => {
      setRandomLength(parseInt(els.lengthNumber.value, 10) || 16);
      refreshCurrentCredential(true);
    });

    els.lengthDecBtn.addEventListener("click", () => {
      setRandomLength((parseInt(els.lengthNumber.value, 10) || 16) - 1);
      refreshCurrentCredential(true);
    });

    els.lengthIncBtn.addEventListener("click", () => {
      setRandomLength((parseInt(els.lengthNumber.value, 10) || 16) + 1);
      refreshCurrentCredential(true);
    });

    // Random option toggles
    const randomToggles = [
      els.optUpper,
      els.optLower,
      els.optDigits,
      els.optSymbols,
      els.optExcludeAmbiguous,
      els.optStrictPolicy,
      els.optNoRepeats,
    ];
    randomToggles.forEach((cb) => {
      cb.addEventListener("change", () => {
        const anyChecked =
          els.optUpper.checked ||
          els.optLower.checked ||
          els.optDigits.checked ||
          els.optSymbols.checked;
        if (!anyChecked) {
          cb.checked = true;
          showToast("At least one character class must remain active");
          return;
        }
        refreshCurrentCredential(true);
      });
    });

    els.customSymbolSet.addEventListener("input", () => refreshCurrentCredential(false));

    // Passphrase controls
    els.wordCountRange.addEventListener("input", () => {
      els.wordCountValue.textContent = `${els.wordCountRange.value} words`;
      refreshCurrentCredential(false);
    });
    els.wordCountRange.addEventListener("change", () => refreshCurrentCredential(true));

    [els.wordSeparator, els.wordCasing, els.optPhraseNumber, els.optPhraseSymbol].forEach((el) => {
      el.addEventListener("change", () => refreshCurrentCredential(true));
    });

    // PIN / Recovery controls
    els.pinType.addEventListener("change", () => {
      syncPinLengthOptions();
      refreshCurrentCredential(true);
    });
    [els.pinLength, els.optPinNoSequential].forEach((el) => {
      el.addEventListener("change", () => refreshCurrentCredential(true));
    });

    // Audit Custom mode
    els.customAuditInput.addEventListener("input", () => refreshCurrentCredential(false));
    els.clearAuditBtn.addEventListener("click", () => {
      els.customAuditInput.value = "";
      refreshCurrentCredential(false);
      els.customAuditInput.focus();
    });
    els.sampleWeakBtn.addEventListener("click", () => {
      els.customAuditInput.value = "Password123!";
      refreshCurrentCredential(false);
    });
    els.sampleStrongBtn.addEventListener("click", () => {
      els.customAuditInput.value = generateRandomPassword().value;
      refreshCurrentCredential(false);
    });

    // Batch generation
    els.generateBatchBtn.addEventListener("click", () => {
      const count = clampInt(parseInt(els.batchCountSelect.value, 10) || 5, 1, 20);
      const batchMode = state.mode === "audit" ? "random" : state.mode;
      const items = [];
      for (let i = 0; i < count; i++) {
        items.push(generateSingleByMode(batchMode));
      }
      renderBatch(items);
      showToast(`Generated ${count} independent credentials`);
    });

    els.copyBatchBtn.addEventListener("click", () => {
      const all = state.batchItems.map((i) => i.value).join("\n");
      copyText(all, `Copied ${state.batchItems.length} credentials`);
    });

    els.exportBatchBtn.addEventListener("click", exportBatchAsText);

    // History clear
    els.clearHistoryBtn.addEventListener("click", () => {
      state.history = [];
      renderHistory();
      showToast("Session history cleared");
    });

    // Keyboard shortcuts (G = Generate, C = Copy)
    document.addEventListener("keydown", (event) => {
      const tag = event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "g" && state.mode !== "audit") {
        event.preventDefault();
        refreshCurrentCredential(true);
      } else if (key === "c") {
        event.preventDefault();
        copyText(state.currentCredential, "Credential copied to clipboard");
      }
    });
  }

  function init() {
    // Load saved theme if available
    try {
      const savedTheme = localStorage.getItem("keyforge_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        applyTheme(savedTheme);
      }
    } catch {
      // Ignore storage errors
    }

    els.wordlistSizeLabel.textContent = `Wordlist: ${WORDLIST.length} words (${Math.log2(WORDLIST.length).toFixed(0)} bits/word)`;
    syncPinLengthOptions();
    bindEvents();
    refreshCurrentCredential(true);
  }

  init();
})();
