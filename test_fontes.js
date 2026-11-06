/* Fontes: arquivos, licença, cobertura de glifos e uso só por variável CSS. Lê o cmap direto do woff2, sem dependências.
   Rodar: node test_fontes.js */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
let ok = 0, f = 0; const t = (n, c) => { if (c) ok++; else { f++; console.log('FALHOU: ' + n); } };
const NOMES = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post'];

/* devolve {cmap:Set de códigos, unidades, ascender, descender} */
function abre(arq) {
  const b = fs.readFileSync(arq);
  if (b.toString('latin1', 0, 4) !== 'wOF2') throw new Error('não é woff2: ' + arq);
  const n = b.readUInt16BE(12), comp = b.readUInt32BE(20); let p = 48;
  const b128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const c = b[p++]; v = (v << 7) | (c & 127); if (!(c & 128)) return v >>> 0; } throw new Error('base128'); };
  const tabs = [];
  for (let i = 0; i < n; i++) {
    const fl = b[p++], idx = fl & 63, ver = fl >> 6; let tag = NOMES[idx] || idx;
    if (idx === 63) { tag = b.toString('latin1', p, p + 4); p += 4; }
    const orig = b128(), trans = ((idx === 10 || idx === 11) ? ver !== 3 : ver !== 0);   // glyf=10, loca=11
    tabs.push({ tag, tam: trans ? b128() : orig });
  }
  const d = zlib.brotliDecompressSync(b.subarray(p, p + comp)); let o = 0; const T = {};
  tabs.forEach(x => { T[x.tag] = d.subarray(o, o + x.tam); o += x.tam; });
  const c = T.cmap, nt = c.readUInt16BE(2), set = new Set();
  for (let i = 0; i < nt; i++) {
    const off = c.readUInt32BE(4 + i * 8 + 4), fm = c.readUInt16BE(off);
    if (fm === 12) { const g = c.readUInt32BE(off + 12); for (let k = 0; k < g; k++) { const a = c.readUInt32BE(off + 16 + k * 12), z = c.readUInt32BE(off + 20 + k * 12); for (let u = a; u <= z; u++) set.add(u); } }
    if (fm === 4) { const sc = c.readUInt16BE(off + 6) / 2, ini = off + 16 + sc * 2; for (let k = 0; k < sc; k++) { const z = c.readUInt16BE(off + 14 + k * 2), a = c.readUInt16BE(ini + k * 2); for (let u = a; u <= z && u < 65535; u++) set.add(u); } }
  }
  return { cmap: set, unidades: T.head.readUInt16BE(18), ascender: T.hhea.readInt16BE(4), descender: T.hhea.readInt16BE(6), gap: T.hhea.readInt16BE(8) };
}

const F = path.join(__dirname, 'fonts');
const ARQS = { 'Source Sans 3 400': 'source-sans-3-latin-400-normal.woff2', 'Source Sans 3 600': 'source-sans-3-latin-600-normal.woff2', 'Source Sans 3 700': 'source-sans-3-latin-700-normal.woff2', 'Fraunces 600': 'fraunces-latin-600-normal.woff2' };
const css = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8'), gi = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
let total = 0;
const fontes = {};
for (const [n, a] of Object.entries(ARQS)) {
  const p = path.join(F, a); t(n + ': arquivo existe', fs.existsSync(p)); if (!fs.existsSync(p)) continue;
  total += fs.statSync(p).size; fontes[n] = abre(p);
  t(n + ': no cache do service worker', sw.includes("'fonts/" + a + "'"));
  t(n + ': @font-face local com swap', new RegExp('url\\("?fonts/' + a.replace(/\./g, '\\.') + '"?\\)').test(css));
}
t('só os quatro arquivos de fonte', fs.readdirSync(F).filter(x => /\.(woff2?|ttf|otf)$/.test(x)).length === 4);
t('peso total perto de 80 KB', total < 100 * 1024);
t('licenças e README presentes', ['OFL-Source-Sans-3.txt', 'OFL-Fraunces.txt', 'README.md'].every(x => fs.existsSync(path.join(F, x))));
['OFL-Source-Sans-3.txt', 'OFL-Fraunces.txt'].forEach(x => t(x + ': é a OFL 1.1', /SIL Open Font License, Version 1\.1/.test(fs.readFileSync(path.join(F, x), 'utf8'))));
t('.gitignore libera a pasta', /^!\/fonts\//m.test(gi));
t('todo @font-face usa swap', (css.match(/@font-face\{[^}]*src:url[^}]*\}/g) || []).every(x => /font-display:swap/.test(x)) && (css.match(/@font-face\{[^}]*src:url/g) || []).length === 4);
t('sem fonte externa', !/fonts\.googleapis|fonts\.gstatic|https?:[^"')]*\.woff/.test(css));

/* famílias só nas variáveis */
const svgs0 = css.replace(/--font-[a-z]+:[^;]*;/g, '') + fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'grafico.js'), 'utf8');
const semRaiz = css.replace(/@font-face\{[^}]*\}/g, '').replace(/--font-[a-z]+:[^;]*;/g, '');
t('nome de família só nas variáveis', !/Fraunces|Source Sans/.test(semRaiz) && !/Fraunces|Source Sans/.test(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8')) && !/Fraunces|Source Sans/.test(fs.readFileSync(path.join(__dirname, 'grafico.js'), 'utf8')));
t('sem font-family fixa fora das variáveis', !(semRaiz.match(/font-family:(?!var\()[^;}]*/g) || []).filter(x => !/inherit/.test(x)).length);
t('sem fonte antiga em SVG', !/Bahnschrift/.test(svgs0));
t('sem negrito falso', /font-synthesis:none/.test(css));
const pesos = new Set((css.match(/font-weight:\s*\d+/g) || []).map(x => x.replace(/\D/g, '')));
t('só pesos carregados no CSS', [...pesos].every(p => ['400', '600', '700'].includes(p)));
const svgs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'grafico.js'), 'utf8');
t('só pesos carregados no código', [...new Set((svgs.match(/font-weight[:=]\s*"?\d+/g) || []).map(x => x.replace(/\D/g, '')))].every(p => ['400', '600', '700'].includes(p)));

/* cobertura: todo caractere dos textos do app */
const fontesTexto = ['app.js', 'real.js', 'store.js', 'index.html', 'privacidade.html'].map(a => fs.readFileSync(path.join(__dirname, a), 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, ' ');
const usados = new Set([...fontesTexto].map(c => c.codePointAt(0)).filter(u => u >= 32 && u !== 127));
const nome = u => 'U+' + u.toString(16).toUpperCase().padStart(4, '0') + ' ' + String.fromCodePoint(u);
const OBRIGATORIOS = [...'áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÇ', 'R', '$', '~', '−', '·', '…', 'º', 'ª', '°', '0', '9', '%', '+', '×'].map(c => c.codePointAt(0));
for (const [n, x] of Object.entries(fontes)) { const falta = OBRIGATORIOS.filter(u => !x.cmap.has(u)); t(n + ': cobre acentos, R$, ~, menos real, ponto, reticências e ordinais' + (falta.length ? ' (falta ' + falta.map(nome).join(', ') + ')' : ''), falta.length === 0); }
const base = fontes['Source Sans 3 400'], faltam = [...usados].filter(u => base && !base.cmap.has(u)).sort((a, b) => a - b);
console.log('Caracteres usados no app: ' + usados.size + '. Fora da Source Sans 3: ' + (faltam.map(nome).join(', ') || 'nenhum'));
const ACEITOS = new Set([0x2197, 0x25B4, 0x25BE, 0x26A0, 0x270E, 0x2714, 0x2716]);   // símbolos de ícone do app, listados no relatório
t('fora da fonte só símbolos de ícone, nenhuma letra ou número', faltam.every(u => ACEITOS.has(u)));
if (process.argv[2] === '--metricas') for (const [n, x] of Object.entries(fontes)) console.log(n, JSON.stringify({ unidades: x.unidades, ascender: x.ascender, descender: x.descender, gap: x.gap }));
console.log('Peso das fontes: ' + total + ' bytes');
console.log(f ? f + ' falha(s) de ' + (ok + f) : 'Todos os ' + ok + ' testes de fontes passaram.');
process.exit(f ? 1 : 0);
