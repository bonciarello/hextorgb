#!/usr/bin/env node
/**
 * Test suite per Convertitore HEX → RGB (ChromaLab)
 * Testa: logica di conversione, server HTTP, SEO, accessibilità base
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4599;
const BASE_URL = `http://localhost:${PORT}`;
const HTML_PATH = path.join(__dirname, 'index.html');

let server;
let passed = 0;
let failed = 0;

/* ── Helpers ── */
function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

function assertEqual(actual, expected, label) {
  const ok = actual === expected;
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label} — expected "${expected}", got "${actual}"`);
    failed++;
  }
}

/* ── 1. Unit tests: conversione HEX → RGB ── */
console.log('\n📐 Test unitari: hexToRgb()');

function hexToRgb(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const hex = raw.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$/.test(hex) && !/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  let expanded = hex;
  if (hex.length === 3) expanded = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = parseInt(expanded.substring(0, 2), 16);
  const g = parseInt(expanded.substring(2, 4), 16);
  const b = parseInt(expanded.substring(4, 6), 16);
  return { r, g, b, hex: '#' + expanded.toUpperCase() };
}

// Test: formato standard con #
const r1 = hexToRgb('#FF5733');
assert(r1 !== null, '#FF5733 viene convertito');
assertEqual(r1.r, 255, '  R = 255');
assertEqual(r1.g, 87, '  G = 87');
assertEqual(r1.b, 51, '  B = 51');
assertEqual(r1.hex, '#FF5733', '  hex espanso = #FF5733');

// Test: formato standard senza #
const r2 = hexToRgb('FF5733');
assert(r2 !== null, 'FF5733 (senza #) viene convertito');
assertEqual(r2.r, 255, '  R = 255');
assertEqual(r2.g, 87, '  G = 87');
assertEqual(r2.b, 51, '  B = 51');

// Test: formato corto 3 caratteri
const r3 = hexToRgb('#abc');
assert(r3 !== null, '#abc viene convertito');
assertEqual(r3.r, 170, '  R = 170 (aa)');
assertEqual(r3.g, 187, '  G = 187 (bb)');
assertEqual(r3.b, 204, '  B = 204 (cc)');
assertEqual(r3.hex, '#AABBCC', '  hex espanso = #AABBCC');

// Test: formato corto senza #
const r4 = hexToRgb('abc');
assert(r4 !== null, 'abc (senza #) viene convertito');
assertEqual(r4.r, 170, '  R = 170');
assertEqual(r4.g, 187, '  G = 187');
assertEqual(r4.b, 204, '  B = 204');

// Test: bianco
const r5 = hexToRgb('#FFFFFF');
assert(r5 !== null, '#FFFFFF viene convertito');
assertEqual(r5.r, 255, '  R = 255');
assertEqual(r5.g, 255, '  G = 255');
assertEqual(r5.b, 255, '  B = 255');

// Test: nero
const r6 = hexToRgb('#000000');
assert(r6 !== null, '#000000 viene convertito');
assertEqual(r6.r, 0, '  R = 0');
assertEqual(r6.g, 0, '  G = 0');
assertEqual(r6.b, 0, '  B = 0');

// Test: nero corto
const r7 = hexToRgb('#000');
assert(r7 !== null, '#000 viene convertito');
assertEqual(r7.r, 0, '  R = 0');
assertEqual(r7.g, 0, '  G = 0');
assertEqual(r7.b, 0, '  B = 0');

// Test: input non validi
assert(hexToRgb('xyz') === null, '"xyz" restituisce null');
assert(hexToRgb('') === null, 'stringa vuota restituisce null');
assert(hexToRgb('#') === null, '"#" restituisce null');
assert(hexToRgb('#FF573') === null, '"#FF573" (5 cifre) restituisce null');
assert(hexToRgb('#FF5733F') === null, '"#FF5733F" (7 cifre) restituisce null');
assert(hexToRgb('#GGGGGG') === null, '"#GGGGGG" (caratteri non hex) restituisce null');
assert(hexToRgb('hello') === null, '"hello" restituisce null');
assert(hexToRgb(null) === null, 'null restituisce null');
assert(hexToRgb(undefined) === null, 'undefined restituisce null');

// Test: maiuscole/minuscole miste
const r8 = hexToRgb('#ff5733');
assert(r8 !== null, '#ff5733 (minuscole) viene convertito');
assertEqual(r8.r, 255, '  R = 255');
assertEqual(r8.g, 87, '  G = 87');
assertEqual(r8.b, 51, '  B = 51');

// Test: spazi bianchi
const r9 = hexToRgb('  #FF5733  ');
assert(r9 !== null, '"  #FF5733  " (con spazi) viene convertito');
assertEqual(r9.r, 255, '  R = 255');

/* ── 2. File statici ── */
console.log('\n📁 Test file statici');

assert(fs.existsSync(HTML_PATH), 'index.html esiste');
assert(fs.existsSync(path.join(__dirname, 'robots.txt')), 'robots.txt esiste');
assert(fs.existsSync(path.join(__dirname, 'sitemap.xml')), 'sitemap.xml esiste');

// HTML contiene elementi chiave
const html = fs.readFileSync(HTML_PATH, 'utf-8');
assert(html.includes('<!DOCTYPE html>'), 'index.html ha DOCTYPE');
assert(html.includes('<html lang="it"'), 'index.html ha lang="it"');
assert(html.includes('<title>'), 'index.html ha <title>');
assert(html.includes('og:title'), 'index.html ha og:title');
assert(html.includes('og:description'), 'index.html ha og:description');
assert(html.includes('og:url'), 'index.html ha og:url');
assert(html.includes('<link rel="canonical"'), 'index.html ha link canonical');
assert(html.includes('application/ld+json'), 'index.html ha JSON-LD');
assert(html.includes('WebApplication'), 'JSON-LD contiene WebApplication');
assert(html.includes('<label'), 'index.html ha <label>');
assert(html.includes('for="hexInput"'), 'label ha attributo for');
assert(html.includes('id="hexInput"'), 'input ha id che matcha label');
assert(html.includes('role="alert"'), 'messaggio errore ha role="alert"');
assert(html.includes('aria-describedby'), 'input ha aria-describedby');
assert(html.includes('aria-live'), 'input ha aria-live');
assert(html.includes('<header'), 'index.html ha <header>');
assert(html.includes('<main'), 'index.html ha <main>');
assert(html.includes('<footer'), 'index.html ha <footer>');
assert(html.includes('<h1>'), 'index.html ha un solo <h1>');

// Verifica che ci sia esattamente un <h1>
const h1Count = (html.match(/<h1[>\s]/g) || []).length;
assertEqual(h1Count, 1, 'index.html ha esattamente 1 <h1>');

/* ── 3. Test server HTTP ── */
console.log('\n🌐 Test server HTTP');

// Funzione per fare fetch manuale (Node 18+ ha fetch globale, ma per compatibilità usiamo http)
function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runHttpTests() {
  // Test index.html
  const indexRes = await fetchPage('/');
  assertEqual(indexRes.status, 200, 'GET / restituisce 200');
  assert(indexRes.headers['content-type'].includes('text/html'), 'Content-Type è text/html');
  assert(indexRes.body.includes('<!DOCTYPE html>'), 'La risposta contiene DOCTYPE');
  assert(indexRes.body.includes('ChromaLab'), 'La risposta contiene il nome dell\'app');

  // Test robots.txt
  const robotsRes = await fetchPage('/robots.txt');
  assertEqual(robotsRes.status, 200, 'GET /robots.txt restituisce 200');
  assert(robotsRes.body.includes('Sitemap:'), 'robots.txt contiene Sitemap');

  // Test sitemap.xml
  const sitemapRes = await fetchPage('/sitemap.xml');
  assertEqual(sitemapRes.status, 200, 'GET /sitemap.xml restituisce 200');
  assert(sitemapRes.body.includes('<urlset'), 'sitemap.xml contiene <urlset>');
  assert(sitemapRes.body.includes('cristianporco.it'), 'sitemap.xml contiene URL canonico');

  // Test 404
  const notFoundRes = await fetchPage('/pagina-inesistente');
  assertEqual(notFoundRes.status, 404, 'GET /pagina-inesistente restituisce 404');
}

/* ── Avvio server e test HTTP ── */
console.log(`\n🚀 Avvio server su porta ${PORT}...`);

server = http.createServer((req, res) => {
  const url = new URL(req.url, BASE_URL);
  let filePath;

  if (url.pathname === '/' || url.pathname === '/index.html') {
    filePath = HTML_PATH;
  } else if (url.pathname === '/robots.txt') {
    filePath = path.join(__dirname, 'robots.txt');
  } else if (url.pathname === '/sitemap.xml') {
    filePath = path.join(__dirname, 'sitemap.xml');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server in ascolto su http://0.0.0.0:${PORT}`);

  try {
    await runHttpTests();
  } catch (err) {
    console.error('Errore nei test HTTP:', err.message);
    failed++;
  }

  /* ── Riepilogo ── */
  const total = passed + failed;
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`📊 Riepilogo: ${passed}/${total} test passati`);
  if (failed > 0) {
    console.log(`❌ ${failed} test falliti`);
    process.exitCode = 1;
  } else {
    console.log('✅ Tutti i test passati!');
  }
  console.log(`${'─'.repeat(40)}\n`);

  // Il server rimane in esecuzione
  console.log(`Server attivo su http://localhost:${PORT}`);
});
