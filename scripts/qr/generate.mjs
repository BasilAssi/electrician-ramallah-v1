// يولّد كرت QR لرابط التواصل: marketing/qr/qr-card.png + qr.svg (للطباعة)
// التشغيل: npm run qr
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { business, phones } from '../../src/data/contact.js';
import { SITE_URL } from '../../src/data/site.js';
import { formatPhone } from '../../src/utils/phone.js';
import { renderHtml } from '../lib/render.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'marketing/qr');
const TARGET_URL = `${SITE_URL}/#contact`;
const PHOTO = '../../public/images/alaa-assi-electrician-ramallah-800.webp';

const C = { ink: '#14202e', paper: '#f5f2ea', volt: '#f5b700', line: '#d8d1c1' };
const BOLT = 'M13 2 4 14h7l-1 8 9-12h-7Z';

// ---------- QR as SVG ----------

function buildQrSvg(url) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const n = modules.size;
  const quiet = 4;
  const size = n + quiet * 2;
  const logo = Math.round(n * 0.22) | 1; // مربع اللوغو بالنص (عدد فردي)
  const logoStart = (n - logo) / 2;

  const inFinder = (x, y) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const inLogo = (x, y) =>
    x >= logoStart - 1 && x < logoStart + logo + 1 && y >= logoStart - 1 && y < logoStart + logo + 1;

  let dots = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!modules.get(x, y) || inFinder(x, y) || inLogo(x, y)) continue;
      dots += `<rect x="${x + quiet + 0.06}" y="${y + quiet + 0.06}" width="0.88" height="0.88" rx="0.3"/>`;
    }
  }

  const finder = (fx, fy) => {
    const x = fx + quiet;
    const y = fy + quiet;
    return `
      <rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.6" fill="none" stroke="${C.ink}" stroke-width="1"/>
      <rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.8" fill="${C.ink}"/>`;
  };

  const lx = logoStart + quiet;
  const center = `
    <rect x="${lx}" y="${lx}" width="${logo}" height="${logo}" rx="${logo * 0.18}" fill="${C.ink}"/>
    <g transform="translate(${lx + logo * 0.18} ${lx + logo * 0.18}) scale(${(logo * 0.64) / 24})">
      <path d="${BOLT}" fill="${C.volt}"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="geometricPrecision">
  <rect width="${size}" height="${size}" fill="${C.paper}"/>
  <g fill="${C.ink}">${dots}</g>
  ${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}
  ${center}
</svg>`;
}

// ---------- Card (HTML → PNG) ----------

const phoneIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>`;
const waIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2Z"/></svg>`;

function buildCardHtml(qrSvg) {
  const phoneRows = phones
    .map(
      (p) => `
      <div class="phone">
        <span class="icons">${phoneIcon}${p.whatsapp ? waIcon : ''}</span>
        <span class="num" dir="ltr">${formatPhone(p.number)}</span>
      </div>`,
    )
    .join('');

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1080px; height: 1350px; overflow: hidden; }
  body {
    background: ${C.ink};
    color: ${C.paper};
    font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif;
    position: relative;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(245,242,234,.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,242,234,.035) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .mono { font-family: 'IBM Plex Mono', monospace; letter-spacing: .08em; }

  header { position: absolute; top: 80px; right: 90px; left: 90px; }
  .kicker { display: flex; align-items: center; gap: 14px; font-size: 26px; font-weight: 600; color: rgba(245,242,234,.7); }
  .kicker i { width: 18px; height: 18px; background: ${C.volt}; display: block; }
  h1 { margin-top: 20px; font-size: 104px; font-weight: 700; line-height: 1.2; }
  h1 .title { color: ${C.volt}; }
  .sub { margin-top: 30px; font-size: 32px; color: rgba(245,242,234,.75); }
  .portrait {
    position: absolute; top: 70px; left: 90px; width: 250px; height: 312px;
    background: ${C.ink}; box-shadow: 10px 10px 0 0 rgba(245,242,234,.12); overflow: hidden;
  }
  .portrait img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 15%; display: block; }
  .portrait::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 10px;
    background: repeating-linear-gradient(-45deg, ${C.volt} 0 12px, ${C.ink} 12px 24px);
  }

  /* الكيبل الأصفر اللي بغذّي لوحة الـ QR */
  .wire { position: absolute; inset: 0; pointer-events: none; }

  .plate {
    position: absolute; top: 470px; left: 50%; transform: translateX(-50%) rotate(-1.5deg);
    width: 560px; padding: 34px; background: ${C.paper};
    box-shadow: 14px 14px 0 0 rgba(245,242,234,.12);
  }
  .plate svg.qr { display: block; width: 100%; height: auto; }
  .screw { position: absolute; width: 18px; height: 18px; border-radius: 50%; background: ${C.line}; border: 2px solid #bfb6a3; }
  .screw::after { content: ''; position: absolute; top: 7px; left: 2px; right: 2px; height: 2px; background: #9d937e; transform: rotate(45deg); }
  .s1 { top: 9px; right: 9px; } .s2 { top: 9px; left: 9px; } .s3 { bottom: 9px; right: 9px; } .s4 { bottom: 9px; left: 9px; }
  .tag {
    position: absolute; bottom: -30px; right: 40px;
    background: ${C.volt}; color: ${C.ink}; font-weight: 700; font-size: 28px; padding: 10px 22px;
  }
  .rating { position: absolute; top: -34px; left: 0; font-size: 18px; color: rgba(245,242,234,.5); direction: ltr; }

  footer { position: absolute; right: 90px; left: 90px; bottom: 96px; display: flex; justify-content: space-between; align-items: flex-end; }
  .phones { display: flex; flex-direction: column; gap: 14px; }
  .phone { display: flex; align-items: center; gap: 18px; }
  .icons { display: flex; gap: 8px; color: ${C.volt}; }
  .icons svg { width: 34px; height: 34px; }
  .num { font-family: 'IBM Plex Mono', monospace; font-size: 42px; font-weight: 600; letter-spacing: .02em; }
  .url { font-size: 18px; color: rgba(245,242,234,.45); direction: ltr; text-align: left; line-height: 1.6; }
  .tape {
    position: absolute; bottom: 0; left: 0; right: 0; height: 26px;
    background: repeating-linear-gradient(-45deg, ${C.volt} 0 22px, ${C.ink} 22px 44px);
  }
</style>
</head>
<body>
  <div class="grid"></div>

  <svg class="wire" viewBox="0 0 1080 1350" fill="none">
    <path d="M1080 385 C 950 385, 900 420, 760 418 S 540 420, 540 452" stroke="${C.volt}" stroke-width="10" stroke-linecap="round"/>
    <rect x="522" y="444" width="36" height="22" rx="4" fill="${C.volt}"/>
    <rect x="530" y="466" width="6" height="10" fill="${C.line}"/>
    <rect x="544" y="466" width="6" height="10" fill="${C.line}"/>
  </svg>

  <header>
    <p class="kicker"><i></i>كهربائي · رام الله والبيرة</p>
    <h1><span class="title">م.</span> ${business.name.ar.replace(/^م\.\s*/, '')}</h1>
    <p class="sub">مهندس وفني كهرباء · تمديدات، صيانة، طاقة شمسية</p>
  </header>
  <div class="portrait"><img src="${PHOTO}" alt=""></div>

  <div class="plate">
    <span class="rating mono">QR · SCAN TO CONNECT</span>
    <span class="screw s1"></span><span class="screw s2"></span><span class="screw s3"></span><span class="screw s4"></span>
    ${qrSvg.replace('<svg ', '<svg class="qr" ')}
    <span class="tag">امسح الكود وتواصل مباشرة</span>
  </div>

  <footer>
    <div class="phones">${phoneRows}</div>
  </footer>
  <div class="tape"></div>
</body>
</html>`;
}

// ---------- Run ----------

mkdirSync(OUT, { recursive: true });

const qrSvg = buildQrSvg(TARGET_URL);
writeFileSync(resolve(OUT, 'qr.svg'), qrSvg);

const htmlPath = resolve(OUT, 'qr-card.html');
writeFileSync(htmlPath, buildCardHtml(qrSvg));

renderHtml(htmlPath, resolve(OUT, 'qr-card.png'), { width: 1080, height: 1350, scale: 2 });

console.log(`QR → ${TARGET_URL}`);
console.log(`Files in ${OUT}: qr.svg, qr-card.html, qr-card.png`);
