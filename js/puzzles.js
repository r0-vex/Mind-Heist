/* ────────────────────────────────────────────────────────────────
   MIND HEIST — Puzzle Generation Engine
   Generates dynamic puzzles for each difficulty tier.
   ──────────────────────────────────────────────────────────────── */

const LEVELS = [
  { id:1, name:'BOOT SECTOR',    difficulty:'EASY',   timeLimit:45, puzzleCount:4, color:'#00ff88' },
  { id:2, name:'KERNEL BREACH',  difficulty:'EASY',   timeLimit:40, puzzleCount:4, color:'#00ff88' },
  { id:3, name:'FIREWALL',       difficulty:'MEDIUM',  timeLimit:35, puzzleCount:5, color:'#00e5ff' },
  { id:4, name:'ENCRYPTION',     difficulty:'MEDIUM',  timeLimit:30, puzzleCount:5, color:'#00e5ff' },
  { id:5, name:'MAINFRAME',      difficulty:'HARD',   timeLimit:25, puzzleCount:5, color:'#ffe600' },
  { id:6, name:'NEURAL CORE',    difficulty:'HARD',   timeLimit:20, puzzleCount:6, color:'#ffe600' },
  { id:7, name:'SHADOW SERVER',  difficulty:'EXPERT', timeLimit:18, puzzleCount:6, color:'#ff3366' },
  { id:8, name:'QUANTUM VAULT',  difficulty:'EXPERT', timeLimit:15, puzzleCount:6, color:'#ff3366' },
  { id:9, name:'DARK NEXUS',     difficulty:'ELITE',  timeLimit:12, puzzleCount:7, color:'#ff3366' },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PuzzleGen = {

  /* Arithmetic sequence: find next term */
  arithmeticSeq(diff) {
    const step = (diff <= 2) ? randInt(1,3)
               : (diff <= 4) ? randInt(2,6)
               : randInt(4,12);
    const start = randInt(1, 20);
    const len = 5 + diff;
    const seq = Array.from({length: len}, (_,i) => start + i * step);
    const answerIdx = seq.length - 1;
    const answer = seq[answerIdx];
    seq[answerIdx] = '?';
    return {
      type: 'SEQUENCE', category: 'NUMBER SEQUENCE',
      display: seq,
      question: `Complete the arithmetic sequence:`,
      answer: String(answer)
    };
  },

  /* Geometric sequence: find next term */
  geoSeq(diff) {
    const ratio = (diff <= 2) ? randInt(2,3)
                : (diff <= 5) ? randInt(2,4)
                : randInt(2,5);
    const start = randInt(1, 5);
    const len = 4 + Math.min(diff, 3);
    const seq = Array.from({length: len}, (_,i) => start * Math.pow(ratio, i));
    if (seq.some(v => v > 99999)) return this.arithmeticSeq(diff);
    const answer = seq[seq.length - 1];
    seq[seq.length - 1] = '?';
    return {
      type: 'SEQUENCE', category: 'GEOMETRIC SEQUENCE',
      display: seq,
      question: `Find the next term in this geometric sequence:`,
      answer: String(answer)
    };
  },

  /* Fibonacci-variant */
  fibVariant(diff) {
    const a0 = randInt(1, 5 + diff * 2);
    const a1 = randInt(a0, a0 + diff * 3 + 2);
    const seq = [a0, a1];
    const len = 5 + Math.min(diff, 3);
    for (let i = 2; i < len; i++) seq.push(seq[i-1] + seq[i-2]);
    if (seq.some(v => v > 999999)) return this.arithmeticSeq(diff);
    const answer = seq[seq.length - 1];
    seq[seq.length - 1] = '?';
    return {
      type: 'SEQUENCE', category: 'ADDITIVE SEQUENCE',
      display: seq,
      question: `Each term = sum of two preceding terms. Find ?:`,
      answer: String(answer)
    };
  },

  /* Missing number in middle */
  missingMiddle(diff) {
    const step = randInt(diff + 1, diff * 3 + 3);
    const start = randInt(1, 30);
    const len = 5 + Math.min(diff, 3);
    const seq = Array.from({length: len}, (_,i) => start + i * step);
    const gapIdx = 1 + randInt(0, len - 3);
    const answer = seq[gapIdx];
    seq[gapIdx] = '?';
    return {
      type: 'SEQUENCE', category: 'MISSING NUMBER',
      display: seq,
      question: `Find the missing value in the sequence:`,
      answer: String(answer)
    };
  },

  /* Prime detection */
  primeQ(diff) {
    function isPrime(n) {
      if (n < 2) return false;
      for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
      return true;
    }
    const candidates = [];
    const max = 30 + diff * 15;
    for (let n = 2; n <= max; n++) if (isPrime(n)) candidates.push(n);
    const primes = candidates.slice(randInt(0, candidates.length - 5), -1);
    const idx = randInt(1, primes.length - 2);
    const answer = primes[idx];
    const seq = primes.slice(0, idx).concat(['?']).concat(primes.slice(idx + 1, idx + 4));
    return {
      type: 'SEQUENCE', category: 'PRIME SEQUENCE',
      display: seq.slice(0, 6),
      question: `All terms are prime numbers. Find ?:`,
      answer: String(answer)
    };
  },

  /* Math expression */
  mathExpr(diff) {
    const ops = ['+', '-', '*'];
    const op  = ops[randInt(0, ops.length - 1)];
    let a, b, ans;
    if (diff <= 2) {
      a = randInt(2, 20); b = randInt(2, 10);
    } else if (diff <= 5) {
      a = randInt(5, 50); b = randInt(2, 20);
    } else {
      a = randInt(10, 99); b = randInt(2, 30);
    }
    switch(op) {
      case '+': ans = a + b; break;
      case '-': ans = Math.abs(a - b); a = Math.max(a,b); b = Math.min(a,b); ans = a-b; break;
      case '*': ans = a * b; break;
    }
    return {
      type: 'MATH', category: 'ARITHMETIC DECODE',
      display: null,
      question: `Compute: ${a} ${op} ${b} = ?`,
      answer: String(ans)
    };
  },

  /* Binary to decimal */
  binaryDec(diff) {
    const bits = diff <= 3 ? 4 : diff <= 6 ? 6 : 8;
    const val = randInt(1, Math.pow(2, bits) - 1);
    const bin = val.toString(2).padStart(bits, '0');
    return {
      type: 'LOGIC', category: 'BINARY DECODE',
      display: null,
      question: `Convert binary to decimal:
[ ${bin} ] = ?`,
      answer: String(val)
    };
  },

  /* Decimal to binary */
  decBinary(diff) {
    const max = diff <= 3 ? 15 : diff <= 6 ? 63 : 255;
    const val = randInt(1, max);
    return {
      type: 'LOGIC', category: 'BINARY ENCODE',
      display: null,
      question: `Convert to binary:
${val} = ?`,
      answer: val.toString(2)
    };
  },

  /* Reverse string */
  reverseStr(diff) {
    const words = ['HACK','CODE','BYTE','ROOT','NODE','DATA','CORE','GHOST','PING','FLUX','KILL','MASK','RAID','SYNC','VOLT','WORM'];
    const wordLen = Math.min(words[randInt(0, words.length-1)].length + diff, 10);
    const word = words[randInt(0, words.length-1)].substring(0, Math.min(wordLen, 8));
    return {
      type: 'STRING', category: 'STRING REVERSAL',
      display: null,
      question: `Reverse the following string:
"${word}" = ?`,
      answer: word.split('').reverse().join('')
    };
  },

  /* Caesar cipher */
  caesarCipher(diff) {
    const shift = randInt(1, 5 + diff);
    const words = ['HACK','CODE','BYTE','ROOT','NODE','DATA','CORE','RAID'];
    const word = words[randInt(0, words.length-1)];
    const encoded = word.split('').map(c => {
      const code = c.charCodeAt(0);
      return String.fromCharCode(((code - 65 + shift) % 26) + 65);
    }).join('');
    return {
      type: 'STRING', category: 'CAESAR CIPHER',
      display: null,
      question: `Shift ${shift} letters back (decrypt):
"${encoded}" = ?`,
      answer: word
    };
  },

  /* Pattern: square numbers */
  squarePattern(diff) {
    const start = randInt(1, 3 + diff);
    const len = 5;
    const seq = Array.from({length: len}, (_,i) => Math.pow(start + i, 2));
    const answer = seq[seq.length - 1];
    seq[seq.length - 1] = '?';
    return {
      type: 'PATTERN', category: 'SQUARE NUMBERS',
      display: seq,
      question: `Identify the pattern (perfect squares):`,
      answer: String(answer)
    };
  },

  /* Modular arithmetic */
  modular(diff) {
    const mod = randInt(2 + diff, 8 + diff);
    const a = randInt(mod * 2, mod * (5 + diff));
    const ans = a % mod;
    return {
      type: 'MATH', category: 'MODULAR ARITHMETIC',
      display: null,
      question: `${a} mod ${mod} = ?`,
      answer: String(ans)
    };
  },

  /* Power of 2 missing */
  powerOf2(diff) {
    const exp = randInt(1, 4 + diff);
    const seq = Array.from({length: 6}, (_,i) => Math.pow(2, exp + i));
    if (seq.some(v => v > 999999)) return this.arithmeticSeq(diff);
    const ansIdx = randInt(1, 4);
    const answer = seq[ansIdx];
    seq[ansIdx] = '?';
    return {
      type: 'PATTERN', category: 'POWERS OF 2',
      display: seq,
      question: `Powers of 2 — find the missing value:`,
      answer: String(answer)
    };
  },

  /* Hexadecimal */
  hexDecode(diff) {
    const val = randInt(10, Math.min(255, 20 + diff * 25));
    const hex = val.toString(16).toUpperCase();
    return {
      type: 'LOGIC', category: 'HEX DECODE',
      display: null,
      question: `Convert hex to decimal:
0x${hex} = ?`,
      answer: String(val)
    };
  },

  /* Sum of digits */
  digitSum(diff) {
    const digits = 2 + Math.min(diff, 5);
    let num = '';
    for (let i = 0; i < digits; i++) num += randInt(i === 0 ? 1 : 0, 9);
    const ans = num.split('').reduce((s,d) => s + parseInt(d), 0);
    return {
      type: 'MATH', category: 'DIGIT SUM',
      display: null,
      question: `Sum of all digits in:
${num} = ?`,
      answer: String(ans)
    };
  },

  /* Generate for a level */
  generate(levelId, count) {
    const diff = levelId;
    const pool = [];

    if (diff <= 2) {
      pool.push(...Array(3).fill('arithmeticSeq'),
                ...Array(2).fill('missingMiddle'),
                'mathExpr','squarePattern');
    } else if (diff <= 4) {
      pool.push('arithmeticSeq','geoSeq','missingMiddle','fibVariant',
                'mathExpr','squarePattern','binaryDec','modular','digitSum');
    } else if (diff <= 6) {
      pool.push('geoSeq','fibVariant','missingMiddle','primeQ',
                'binaryDec','decBinary','mathExpr','modular',
                'powerOf2','hexDecode','caesarCipher','digitSum');
    } else {
      pool.push('primeQ','fibVariant','binaryDec','decBinary',
                'hexDecode','caesarCipher','reverseStr','modular',
                'powerOf2','geoSeq','digitSum');
    }

    const puzzles = [];
    const used = new Set();
    let attempts = 0;
    while (puzzles.length < count && attempts < count * 5) {
      attempts++;
      const key = pool[randInt(0, pool.length - 1)];
      if (!used.has(key) || pool.filter(p => !used.has(p)).length === 0) {
        try {
          const p = this[key](diff);
          if (p) { puzzles.push(p); used.add(key); }
        } catch(e) {}
      }
    }
    while (puzzles.length < count) {
      puzzles.push(this.mathExpr(diff));
    }
    return puzzles;
  }
};
