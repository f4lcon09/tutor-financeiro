/* Testes de segurança: escape de HTML, validação do JSON importado, dados hostis vindos do Drive, CSP e service worker.
   Só dados sintéticos. Precisa do jsdom (cd dev && npm install). Rodar: node test_seguranca.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const Seg = require('./seguranca.js'), Store = require('./store.js'), Sync = require('./sync.js');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('./dev/node_modules/jsdom')); } catch (e) { console.log('jsdom não instalado (cd dev && npm install): testes de interface ignorados'); }

let ok = 0, f = 0; const t = (n, c) => { if (c) ok++; else { f++; console.log('FALHOU: ' + n); } };
const tick = (ms = 0) => new Promise(r => setTimeout(r, ms));

/* ---------- dados sintéticos ---------- */
const REAL = () => JSON.parse(JSON.stringify({
  _meta: { as_of: '2026-01-15' }, liquidez: { total: 2790.35, conta_corrente: 0, onde: 'Banco Teste' },
  cartao: { emissor: 'Cartão A', fechamento_dia: 5, limite: 3300, fatura_atual: { total: 180.4, vence_em: '2026-02-12' } },
  pendencias_novembro: [{ descricao: 'Fatura', valor: 180.4, vence: '2026-02-12' }, { descricao: 'Conta de teste', valor: 52.6, vence: '2026-02-12' }],
  plano_de_pagamento: [{ data: '2026-02-11', acao: 'Withdraw 233.00 from X, pay fatura (180.40) + agua (52.60)' }],
  sobra_apos_pagar_tudo: 2557.35, entradas_esperadas: [{ descricao: 'Salário de teste', valor_estimado: 4700 }],
  gastos_fixos_mensais: { ajuda_em_casa_a_partir_de_dezembro: 410, faculdade_2026: 230, faculdade_2027_estimado: 240, assinaturas_no_cartao: { a: 19, b: 120 }, teto_lazer_mes: 260 },
  faturas_futuras_parcelas_antigas: [{ mes: '2026-02', fatura_total: 310.25, parte_mae: 20.5 }, { mes: '2026-03', fatura_total: 275.1, parte_mae: 10.5 }],
  regras_e_metas: { meta_17_01_2027: 4550, piso_17_01_2027: 2450, alerta_dezembro: 1550, piso_absoluto_status: 'definido' },
  pendente_do_usuario: ['item de teste', 'algo'], _traducoes: { 'item de teste': 'Item de teste' },
  cartoes_extra: [{ id: 'c2', nome: 'Cartão B', limite: 650, fatura: 0 }]
}));
const PAYLOADS = [
  '<img src=x onerror="window.__xss=1">',
  '<script>window.__xss=2</script>',
  '"><svg onload=window.__xss=3>',
  "' onmouseover='window.__xss=4' x='",
  'Tom & Jerry &amp; <b>negrito</b> "aspas" \'simples\' `crase`',
  '</td></tr></table><iframe srcdoc="<script>parent.__xss=5</script>"></iframe>'
];
const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m }; };

/* ===== 1. esc() ===== */
t('esc troca os seis caracteres perigosos', Seg.esc('<>&"\'`') === '&lt;&gt;&amp;&quot;&#39;&#96;');
t('esc aceita null, undefined e número', Seg.esc(null) === '' && Seg.esc(undefined) === '' && Seg.esc(12.5) === '12.5');
t('esc não escapa duas vezes o que já é texto', Seg.esc('&lt;') === '&amp;lt;');

/* ===== 2. Validação do JSON importado ===== */
{
  t('arquivo sintético válido é aceito', Seg.validarImportacao(REAL()).ok === true);
  const rej = (nome, mut, parte) => { const j = REAL(); mut(j); const r = Seg.validarImportacao(j); t('rejeita: ' + nome, r.ok === false && /^Arquivo não aceito: /.test(r.erro) && (!parte || r.erro.includes(parte))); return r; };
  t('rejeita não-objeto (lista, texto, null)', [[], 'x', null, 5].every(x => Seg.validarImportacao(x).ok === false));
  rej('sem liquidez', j => { delete j.liquidez; }, 'liquidez');
  rej('número escrito como texto', j => { j.liquidez.total = '1000'; }, 'liquidez.total');
  rej('número infinito/NaN vira null no JSON, mas valor enorme é recusado', j => { j.liquidez.total = 1e30; }, 'liquidez.total');
  rej('data inválida', j => { j._meta.as_of = '2026-13-45'; }, '_meta.as_of');
  rej('dia de fechamento fora de 1 a 31', j => { j.cartao.fechamento_dia = 40; }, 'fechamento_dia');
  rej('lista no lugar de objeto', j => { j.gastos_fixos_mensais = []; });
  rej('item da lista com tipo errado', j => { j.pendencias_novembro[1].valor = 'muito'; }, 'pendencias_novembro[2].valor');
  rej('lista longa demais', j => { j.pendencias_novembro = Array.from({ length: 201 }, () => ({ descricao: 'x', valor: 1, vence: '2026-11-10' })); }, 'pendencias_novembro');
  rej('texto longo demais', j => { j.cartao.emissor = 'A'.repeat(5000); });
  rej('assinatura com valor de texto', j => { j.gastos_fixos_mensais.assinaturas_no_cartao.a = '<b>'; }, 'assinaturas_no_cartao');
  rej('id de cartão extra com caracteres estranhos', j => { j.cartoes_extra[0].id = 'c2"><img>'; }, 'cartoes_extra');
  rej('pendente_do_usuario com número', j => { j.pendente_do_usuario = [1]; }, 'pendente_do_usuario');
  const sentinela = 'SEGREDO-9Z9';
  const r = rej('mensagem não repete o valor', j => { j.liquidez.total = sentinela; });
  t('mensagem de erro cita o campo e nunca o valor', !r.erro.includes(sentinela));
  // poluição de protótipo: JSON.parse cria a chave __proto__ como propriedade própria
  const poluido = JSON.parse(JSON.stringify(REAL()).replace('"_meta"', '"__proto__":{"polluted":"sim"},"_meta"'));
  t('JSON com __proto__ na raiz é rejeitado', Seg.validarImportacao(poluido).ok === false);
  const aninhado = REAL(); aninhado.regras_e_metas = JSON.parse('{"meta_17_01_2027":1,"piso_17_01_2027":1,"alerta_dezembro":1,"x":{"constructor":{"prototype":{"polluted":"sim"}}}}');
  t('chaves constructor/prototype aninhadas são rejeitadas', Seg.validarImportacao(aninhado).ok === false);
  const fundo = REAL(); let p = fundo; for (let i = 0; i < 30; i++) { p.a = {}; p = p.a; }
  t('aninhamento profundo demais é rejeitado (sem estourar a pilha)', Seg.validarImportacao(fundo).ok === false);
  const largo = REAL(); largo.extra = Array.from({ length: 30000 }, (_, i) => i);
  t('quantidade de nós acima do limite é rejeitada', Seg.validarImportacao(largo).ok === false);
  t('tamanho do arquivo acima do limite é rejeitado', Seg.validarImportacao(REAL(), Seg.LIM.bytes + 1).ok === false);
  // o store recusa antes de tocar no estado
  const m = mem(), s = Store.criarStore(m);
  const antes = JSON.stringify(s.st);
  t('store recusa JSON hostil e não muda o estado', s.importarReal(poluido).ok === false && JSON.stringify(s.st) === antes && s.st.modo === null && m.getItem('tf_modo') === null);
  t('nenhuma poluição de protótipo depois da tentativa', ({}).polluted === undefined && Object.prototype.polluted === undefined);
  t('store aceita o arquivo sintético válido', s.importarReal(REAL()).ok === true && s.st.modo === 'real');
}

/* ===== 3. Dados hostis vindos do Drive (junção sem DOM) ===== */
{
  const now = Date.now();
  const itens = JSON.parse(JSON.stringify({
    'lanc:1': { u: now, d: false, v: { id: 1, data: '2026-11-02', desc: PAYLOADS[0], cat: 'Mercado', valor: 10, forma: 'Pix', essencial: true, lazer: false } },
    'lanc:2': { u: now, d: false, v: { id: 2, data: '2026-11-02', desc: 'ok', cat: 'Mercado', valor: '10' } },
    'lanc:3': { u: now, d: false, v: { id: 3, data: 'ontem', desc: 'ok', cat: 'Mercado', valor: 10 } },
    'lanc:4': { u: now, d: false, v: { id: '"><img>', data: '2026-11-02', desc: 'ok', cat: 'Mercado', valor: 10 } },
    'meta:1': { u: now, d: false, v: { id: 1, nome: PAYLOADS[1], alvo: 100, guardado: 0, prazo: '2027-01', aporte: 5 } },
    'meta:2': { u: now, d: false, v: { id: 2, nome: 'x', alvo: 'cem', guardado: 0, prazo: '2027-01', aporte: 5 } },
    'pago:a1@2026-11': { u: now, d: false, v: true },
    'pago:a2@2026-11': { u: now, d: false, v: 'sim' },
    'teto:Mercado': { u: now, d: false, v: 800 },
    'teto:Fora': { u: now, d: false, v: '<b>' },
    taxa: { u: now, d: false, v: 0.8 },
    'coisa:estranha': { u: now, d: false, v: 1 },
    'lanc:5': { u: 'agora', d: false, v: {} }
  }));
  // chaves __proto__ só existem via JSON.parse
  const hostil = JSON.parse(JSON.stringify(itens).replace('"lanc:1"', '"__proto__":{"u":1,"d":false,"v":{"polluted":"sim"}},"pago:__proto__":{"u":' + now + ',"d":false,"v":true},"teto:constructor":{"u":' + now + ',"d":false,"v":5},"lanc:1"'));
  const r = Seg.limparItens(hostil);
  const ks = Object.keys(r.itens).sort();
  t('limparItens mantém só itens com forma válida', ks.join() === 'lanc:1,meta:1,pago:a1@2026-11,taxa,teto:Mercado', ks.join());
  t('limparItens conta o que descartou', r.descartados >= 9);
  t('texto do lançamento é preservado (será escapado ao desenhar)', r.itens['lanc:1'].v.desc === PAYLOADS[0]);
  const st = Sync.montar(Sync.juntar({}, r.itens));
  t('montar não polui o protótipo', ({}).polluted === undefined && Object.getPrototypeOf(st.pagos) === Object.prototype);
  // mesmo sem passar por limparItens, montar ignora chaves perigosas
  const st2 = Sync.montar({ 'pago:__proto__': { u: 1, d: false, v: { polluted: 'sim' } }, 'teto:constructor': { u: 1, d: false, v: 1 } });
  t('montar ignora chaves de protótipo mesmo se chamado direto', ({}).polluted === undefined && Object.keys(st2.pagos).length === 0 && Object.keys(st2.tetos).length === 0);
  t('limparItens aceita só objeto', Object.keys(Seg.limparItens([1, 2]).itens).length === 0 && Object.keys(Seg.limparItens('x').itens).length === 0);
  // aplicar() sanea de novo
  const s = Store.criarStore(mem());
  s.aplicar({ lanc: [{ id: 9, data: '2026-11-01', desc: 'A'.repeat(5000), cat: 'B'.repeat(500), valor: 1 }, { id: 10, data: 'x', desc: 'y', cat: 'z', valor: 1 }], pagos: { 'a@1': true, x: 5 }, tetos: { Mercado: 1, '<i>': 'a' }, metas: [{ id: 1, nome: 'ok', alvo: -5, guardado: 0, prazo: '2027-01', aporte: 0 }], taxa: 'alta', numeros: { mercado: '<b>', salario: 3000, limites: { c1: 50, '"><x': 5 } } });
  t('aplicar: lançamento válido entra truncado, inválido sai', s.st.lanc.length === 1 && s.st.lanc[0].desc.length === Seg.LIM.desc && s.st.lanc[0].cat === 'Outros');
  t('aplicar: pagos, tetos, metas e taxa inválidos são descartados', Object.keys(s.st.pagos).join() === 'a@1' && Object.keys(s.st.tetos).join() === 'Mercado' && s.st.metas.length === 0 && s.st.taxa === 0.8);
  t('aplicar: números só guarda o que é número', s.st.numeros.mercado === undefined && s.st.numeros.salario === 3000 && Object.keys(s.st.numeros.limites).join() === 'c1');
  // desc muito longa digitada na tela
  const s2 = Store.criarStore(mem(), () => new Date(2026, 10, 5));
  s2.lancar({ tipo: 'gasto', valor: '5', desc: 'Z'.repeat(10000), cat: 'Mercado', data: '2026-11-05' });
  t('lançamento digitado com texto enorme é cortado', s2.st.lanc[0].desc.length === Seg.LIM.desc);
  // CSV: fórmula de planilha
  s2.lancar({ tipo: 'gasto', valor: '5', desc: '=HYPERLINK("http://x","clique")', cat: 'Outros', data: '2026-11-05' });
  s2.lancar({ tipo: 'gasto', valor: '5', desc: '@SUM(1+1)', cat: 'Outros', data: '2026-11-05' });
  const csv = s2.exportarCSV();
  s2.aplicar({ lanc: [{ id: 1, data: '2026-11-05', desc: 'x', cat: '=1+1', valor: 1, forma: '@SUM(A1)' }] });
  t('CSV: categoria e forma vindas de fora viram valores da lista permitida', s2.st.lanc[0].cat === 'Outros' && s2.st.lanc[0].forma === 'Pix');
  t('limparItens: item no futuro distante, chave diferente do id e nome perigoso são descartados', Object.keys(Seg.limparItens({ 'lanc:1': { u: 9.9e14, d: false, v: { id: 1, data: '2026-11-01', desc: 'a', cat: 'Outros', valor: 1 } }, 'lanc:2': { u: 1, d: false, v: { id: 3, data: '2026-11-01', desc: 'a', cat: 'Outros', valor: 1 } }, 'teto:toString': { u: 1, d: false, v: 5 }, 'meta:0.5': { u: 1, d: false, v: { id: 0.5, nome: 'a', alvo: 1, guardado: 0, prazo: '2027-01', aporte: 0 } } }).itens).length === 0);
  t('CSV neutraliza descrição que começa com = ou @', !/(^|,)=HYPERLINK/m.test(csv) && !/(^|,)@SUM/m.test(csv) && csv.includes("'=HYPERLINK") && csv.includes("'@SUM"));
}

/* ===== 3b. OAuth: o retorno só vale com o state que o app gerou ===== */
{
  const mk = (loc, store) => { const m = Object.assign({}, store); const arm = { get: k => (k in m ? m[k] : null), set: (k, v) => { m[k] = v; }, del: k => { delete m[k]; } }; global.location = Object.assign({ origin: 'https://x.io', pathname: '/', search: '', replace() {} }, loc); global.history = { replaceState() {} }; return { d: Sync.criarDrive({ clientId: 'c' }, arm), arm }; };
  let x = mk({ hash: '#access_token=ATACANTE&expires_in=3600' }, {});
  t('OAuth: token sem state, num aparelho que nunca conectou, é recusado', x.d.lerRetorno() === false && x.d.conectado() === false);
  x = mk({ hash: '#access_token=ATACANTE&expires_in=3600&state=outro' }, { tf_gstate: 'certo' });
  t('OAuth: state diferente é recusado', x.d.lerRetorno() === false && x.d.conectado() === false);
  x = mk({ hash: '#access_token=OK&expires_in=3600&state=certo' }, { tf_gstate: 'certo' });
  t('OAuth: state correto é aceito e só vale uma vez', x.d.lerRetorno() === true && x.d.conectado() === true && x.arm.get('tf_gstate') === null);
  delete global.location; delete global.history;
}

/* ===== 4. CSP e arquivos estáticos ===== */
{
  const html = fs.readFileSync('index.html', 'utf8');
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';
  const dir = n => (csp.split(';').map(x => x.trim()).find(x => x.startsWith(n + ' ')) || '').split(/\s+/).slice(1);
  t('index.html tem meta CSP', !!csp);
  t('CSP: default-src só da própria origem', dir('default-src').join() === "'self'");
  t("CSP: script-src sem 'unsafe-inline' e sem 'unsafe-eval'", dir('script-src').join() === "'self'");
  t('CSP: connect-src só a própria origem e www.googleapis.com', dir('connect-src').sort().join() === "'self',https://www.googleapis.com");
  t('CSP: sem objetos, <base> nem formulários', dir('object-src').join() === "'none'" && dir('base-uri').join() === "'none'" && dir('form-action').join() === "'none'");
  t('index.html não tem <script> inline', !/<script(?![^>]*\ssrc=)[^>]*>/i.test(html));
  t('index.html não tem atributos on*= nem javascript:', !/\son[a-z]+\s*=/i.test(html.replace(/<style[\s\S]*?<\/style>/, '')) && !/javascript:/i.test(html));
  t('todos os scripts são locais (sem http)', [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].every(m => !/^(https?:)?\/\//.test(m[1])));
  const fontes = ['app.js', 'sync.js', 'store.js', 'real.js', 'calc.js', 'seguranca.js', 'config.js'].map(a => [a, fs.readFileSync(a, 'utf8')]);
  const hosts = new Set(); fontes.forEach(([a, s]) => { for (const m of s.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) hosts.add(m[1]); });
  t('o código só fala com accounts.google.com (redirecionamento), www.googleapis.com e o namespace SVG', [...hosts].sort().join() === 'accounts.google.com,www.googleapis.com,www.w3.org', [...hosts].join());
  t('nenhum eval, new Function nem document.write no código', fontes.every(([a, s]) => !/\beval\s*\(|new Function\s*\(|document\.write\s*\(/.test(s.replace(/\/\*[\s\S]*?\*\//g, ''))));
  t('config.js só traz o clientId (sem secret)', !/secret|token|senha|password/i.test(fs.readFileSync('config.js', 'utf8')));
}

/* ===== 5. Service worker ===== */
{
  const guardados = []; const ouvintes = {};
  const caches = { open: async () => ({ put: async (k) => { guardados.push(String(k)); }, addAll: async () => {} }), match: async () => undefined, keys: async () => [], delete: async () => true };
  const respostas = {};
  const ctx = { self: { addEventListener: (n, fn) => { ouvintes[n] = fn; }, location: new URL('https://exemplo.github.io/app/sw.js'), skipWaiting() {}, clients: { claim() {} } }, caches, location: new URL('https://exemplo.github.io/app/sw.js'), URL, Promise,
    fetch: async (req) => ({ ok: true, type: req.url.startsWith('https://exemplo.github.io') ? 'basic' : 'cors', clone() { return this; } }) };
  vm.runInNewContext(fs.readFileSync('sw.js', 'utf8'), ctx);
  const pedir = async (url, method = 'GET') => { let p; ouvintes.fetch({ request: { url, method }, respondWith: x => { p = x; } }); if (p) { await p; await tick(5); } return !!p; };
  (async () => {
    t('sw: pedido ao Drive/Google não é interceptado', (await pedir('https://www.googleapis.com/drive/v3/files/abc?alt=media')) === false);
    t('sw: pedido ao accounts.google.com não é interceptado', (await pedir('https://accounts.google.com/o/oauth2/v2/auth?x=1')) === false);
    t('sw: POST/PATCH não é interceptado', (await pedir('https://exemplo.github.io/app/index.html', 'POST')) === false);
    t('sw: nada foi guardado até aqui', guardados.length === 0);
    await pedir('https://exemplo.github.io/app/index.html');
    t('sw: arquivo do casco é guardado', guardados.length === 1 && guardados[0] === '/app/index.html');
    await pedir('https://exemplo.github.io/app/dados.json'); await pedir('https://exemplo.github.io/app/dados_reais_2026-11-04.json'); await pedir('https://exemplo.github.io/app/qualquer.txt?token=1');
    t('sw: arquivo fora da lista do casco (dados, json, qualquer outro) nunca é guardado', guardados.length === 1);
    t('sw: lista do casco inclui os arquivos novos', /'app\.js'/.test(fs.readFileSync('sw.js', 'utf8')) && /'seguranca\.js'/.test(fs.readFileSync('sw.js', 'utf8')) && /'tema\.js'/.test(fs.readFileSync('sw.js', 'utf8')) && /'tokens\.css'/.test(fs.readFileSync('sw.js', 'utf8')) && /const V = 'tf-v8'/.test(fs.readFileSync('sw.js', 'utf8')));
    const casco = (fs.readFileSync('sw.js', 'utf8').match(/const CASCO = \[([^\]]+)\]/) || [])[1].match(/'([^']+)'/g).map(x => x.slice(1, -1)).filter(x => x !== './');
    t('sw: todo arquivo do casco existe no repositório', casco.every(a => fs.existsSync(a)), casco.filter(a => !fs.existsSync(a)).join());
    await fimInterface();
  })();
}

/* ===== 6. Interface (jsdom): texto hostil aparece literal e nada executa ===== */
async function abrir(inicial, opts) {
  opts = opts || {};
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => '<script>' + fs.readFileSync(src, 'utf8').replace(/<\/script>/g, '<\\/script>') + '</script>');
  const erros = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) erros.push('jsdom: ' + e.message); });
  vc.on('error', e => erros.push('console.error: ' + e));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'http://localhost/index.html', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      Object.keys(inicial || {}).forEach(k => w.localStorage.setItem(k, JSON.stringify(inicial[k])));
      w.scrollTo = () => {}; w.URL.createObjectURL = () => 'blob:x';
      w.fetch = opts.fetch || (() => Promise.reject(new Error('sem rede')));
      w.addEventListener('error', e => erros.push('erro de script: ' + e.message));
    }
  });
  await tick(30);
  const w = dom.window, d = w.document;
  return { w, d, erros, $: s => d.querySelector(s), $$: s => [...d.querySelectorAll(s)], ir: async k => { w.eval("ir('" + k + "')"); await tick(10); }, click: s => d.querySelector(s).dispatchEvent(new w.MouseEvent('click', { bubbles: true })), texto: () => d.querySelector('main').textContent.replace(/\s+/g, ' '), set: (sel, v) => { const e = d.querySelector(sel); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('change', { bubbles: true })); } };
}
/* Procura qualquer sinal de HTML injetado: elementos que não existem no app, atributos on*, srcdoc, javascript:. */
function injetado(A) {
  const ruins = [];
  A.$$('main, #nav, .tip').forEach(raiz => raiz.querySelectorAll('*').forEach(e => {
    if (/^(IMG|SCRIPT|IFRAME|OBJECT|EMBED|LINK|META|FORM)$/.test(e.tagName)) ruins.push('<' + e.tagName + '>');
    [...e.attributes].forEach(a => { if (/^on/i.test(a.name) || a.name === 'srcdoc' || /^\s*javascript:/i.test(a.value)) ruins.push(a.name); });
    if (e.tagName === 'svg' && !e.hasAttribute('viewBox')) ruins.push('svg estranho');
  }));
  A.$$('*').forEach(e => { if (e.closest('main, #nav, .tip')) return; });
  return ruins;
}
const TELAS = ['hoje', 'lancar', 'cartao', 'agenda', 'orcamento', 'metas', 'futuro', 'decidir', 'saude', 'numeros'];
async function percorrer(A) { for (const k of TELAS) { await A.ir(k); } }

async function fimInterface() {
  if (!JSDOM) { return resumo(); }
  const hoje = new Date(), mes = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
  const data = mes + '-' + String(Math.min(hoje.getDate(), 28)).padStart(2, '0');

  /* 6a. lançamentos e metas digitados com texto hostil (modo exemplo) */
  {
    const A = await abrir({ tf_modo: 'demo' });
    await A.ir('lancar');
    PAYLOADS.concat(['A'.repeat(5000)]).forEach((p, i) => {
      A.w.eval(`S.lancar({tipo:'gasto',valor:'${10 + i}',desc:${JSON.stringify(p)},cat:'Mercado',data:'${data}',essencial:true,lazer:false,forma:'Pix'})`);
      A.w.eval(`S.addMeta({nome:${JSON.stringify(p)},alvo:'1000',guardado:'0',prazo:'2027-12',aporte:'10'})`);
    });
    await percorrer(A);
    await A.ir('lancar');
    t('digitado: texto hostil aparece literal na lista', PAYLOADS.every(p => A.$('#lista').textContent.includes(p.slice(0, 200))));
    t('digitado: tela Lançar sem HTML injetado', injetado(A).length === 0, injetado(A).join());
    await A.ir('metas');
    t('digitado: nomes de meta aparecem literais', PAYLOADS.every(p => A.texto().includes(p.slice(0, 100).replace(/\s+/g, ' '))));
    t('digitado: tela Metas sem HTML injetado', injetado(A).length === 0, injetado(A).join());
    // tooltip do gráfico com nome de meta hostil
    const sv = A.$('svg[data-ch]'); sv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 700, height: 280 });
    sv.dispatchEvent(new A.w.MouseEvent('mousemove', { bubbles: true, clientX: 300, clientY: 100 }));
    t('digitado: dica do gráfico sem HTML injetado', injetado(A).length === 0 && A.w.__xss === undefined);
    // editar um lançamento com categoria hostil (veio de fora) não injeta pela dica de sugestão
    A.w.eval('S').st.lanc.push({ id: 777, data, desc: 'x', cat: PAYLOADS[0], valor: 5, forma: PAYLOADS[3], essencial: false, lazer: false });
    await A.ir('lancar'); A.w.eval('startEditFn(777)'); await tick(10);
    t('categoria hostil no formulário de edição não injeta HTML', injetado(A).length === 0 && A.w.__xss === undefined);
    await A.ir('orcamento'); A.w.eval("orcSel='Mercado'"); await A.ir('orcamento');
    t('orçamento: detalhe sem HTML injetado', injetado(A).length === 0);
    await A.ir('hoje'); A.click('.strip .c[data-d="' + new Date().getDate() + '"]'); await tick(5);
    t('hoje: detalhe do dia mostra o texto literal e não injeta HTML', injetado(A).length === 0 && A.w.__xss === undefined);
    t('digitado: nenhum script de página executou', A.w.__xss === undefined && A.erros.length === 0, A.erros.slice(0, 2).join(' | '));
  }

  /* 6b. JSON importado com texto hostil em todos os campos de texto */
  {
    const J = REAL(), P = PAYLOADS;
    J.pendencias_novembro = [{ descricao: P[0], valor: 100, vence: '2026-11-10' }, { descricao: P[1], valor: 50, vence: '2026-11-12', nota: P[2] }];
    J.plano_de_pagamento = [{ data: '2026-11-09', acao: P[2] }, { data: '2026-11-13', acao: P[5] }];
    J.cartao.emissor = P[3]; J.cartoes_extra = [{ id: 'c2', nome: P[4], limite: 500, fatura: 0 }, { id: 'c3', nome: P[1], limite: 100, fatura: 0 }];
    J.pendente_do_usuario = [P[0], P[5], 'algo']; J._traducoes = { [P[0]]: P[1] }; J.liquidez.onde = P[2];
    const A = await abrir({});
    const f = { size: JSON.stringify(J).length, text: async () => JSON.stringify(J) };
    await A.$('#imp_f').onchange({ target: { files: [f] } }); await tick(10);
    t('importação pela tela: arquivo sintético com texto hostil é aceito (o texto é só dado)', A.w.eval('S').st.modo === 'real');
    const B = await abrir({ tf_modo: 'real', tf_real: J });
    await percorrer(B);
    t('importado: nenhuma tela injeta HTML nem executa script', injetado(B).length === 0 && B.w.__xss === undefined && B.erros.length === 0, injetado(B).join() + ' ' + B.erros.slice(0, 2).join(' | '));
    await B.ir('hoje');
    t('importado: pendências em texto literal em Falta informar', B.texto().includes(P[5]) && B.texto().includes('algo'));
    await B.ir('agenda');
    t('importado: nome de conta hostil aparece literal na Agenda', B.texto().includes(P[1]));
    await B.ir('cartao');
    t('importado: nome de cartão hostil aparece literal', B.texto().includes(P[4]) || B.$$('#cts .chip').some(c => c.textContent.includes(P[4])));
    // arquivo hostil pela tela: erro em pt-BR, estado intacto
    const C = await abrir({});
    const ruim = JSON.parse(JSON.stringify(REAL()).replace('"_meta"', '"__proto__":{"polluted":"sim"},"_meta"'));
    await C.$('#imp_f').onchange({ target: { files: [{ size: 100, text: async () => JSON.stringify(ruim) }] } }); await tick(10);
    t('importação pela tela: __proto__ é recusado com mensagem em português', /Arquivo não aceito/.test(C.$('#imp_m').textContent) && C.w.eval('S').st.modo === null && C.w.localStorage.getItem('tf_real') === null);
    await C.$('#imp_f').onchange({ target: { files: [{ size: 100, text: async () => '{nao é json' }] } }); await tick(10);
    t('importação pela tela: JSON quebrado dá mensagem em português', /não é um JSON válido/.test(C.$('#imp_m').textContent));
    await C.$('#imp_f').onchange({ target: { files: [{ size: Seg.LIM.bytes + 1, text: async () => '{}' }] } }); await tick(10);
    t('importação pela tela: arquivo grande demais é recusado sem ler', /grande demais/.test(C.$('#imp_m').textContent));
    t('importação pela tela: o protótipo continua limpo', ({}).polluted === undefined && C.w.eval('({}).polluted') === undefined);
  }

  /* 6c. Sincronização: o Drive de mentira traz itens hostis */
  {
    const arq = { files: { pasta00001: { name: 'Tutor Financeiro', body: '' }, dados00001: { name: 'dados.json', body: '' } } };
    const resp = (o, ok = true, st = 200) => Promise.resolve({ ok, status: st, json: async () => o, text: async () => (typeof o === 'string' ? o : JSON.stringify(o)) });
    const fakeFetch = (url, opt = {}) => {
      url = String(url);
      if (!/^https:\/\/www\.googleapis\.com\//.test(url)) return Promise.reject(new Error('host fora da CSP: ' + url));
      if (url.includes('/upload/drive/v3/files/')) { const id = url.split('/files/')[1].split('?')[0]; arq.files[id].body = opt.body; return resp({ id }); }
      if (url.includes('alt=media')) { const id = url.split('/files/')[1].split('?')[0]; return resp(arq.files[id].body || ''); }
      if (opt.method === 'POST') { const b = JSON.parse(opt.body), id = 'novo0000' + Object.keys(arq.files).length; arq.files[id] = { name: b.name, body: '' }; return resp({ id }); }
      const nome = (decodeURIComponent(url.split('q=')[1] || '').match(/name='([^']+)'/) || [])[1];
      return resp({ files: Object.entries(arq.files).filter(([i, x]) => x.name === nome).map(([i, x]) => ({ id: i, name: x.name })) });
    };
    const now = Date.now() + 1000, P = PAYLOADS;
    const itens = {
      'lanc:11': { u: now, d: false, v: { id: 11, data, desc: P[0], cat: 'Mercado', valor: 12, forma: 'Pix', essencial: true, lazer: false } },
      'lanc:12': { u: now, d: false, v: { id: 12, data, desc: P[1], cat: P[2], valor: 13, forma: P[3], essencial: false, lazer: true } },
      'lanc:13': { u: now, d: false, v: { id: 13, data, desc: 'valor em texto', cat: 'Mercado', valor: '<b>1</b>' } },
      'lanc:14': { u: now, d: false, v: { id: 14, data, desc: 'A'.repeat(100000), cat: 'Mercado', valor: 1 } },
      'meta:21': { u: now, d: false, v: { id: 21, nome: P[4], alvo: 500, guardado: 10, prazo: '2027-06', aporte: 20 } },
      'meta:22': { u: now, d: false, v: { id: '"><img src=x>', nome: 'id hostil', alvo: 500, guardado: 10, prazo: '2027-06', aporte: 20 } },
      'teto:Mercado': { u: now, d: false, v: 900 },
      'teto:<img src=x onerror=window.__xss=6>': { u: now, d: false, v: 50 },
      'numeros': { u: now, d: false, v: { mercado: 400, repasse: { '2026-12': true, '<x>': true } } }
    };
    let corpo = JSON.stringify({ app: 'tutor-financeiro', v: 1, itens });
    corpo = corpo.replace('"lanc:11"', '"__proto__":{"u":1,"d":false,"v":{"polluted":"sim"}},"pago:__proto__":{"u":' + now + ',"d":false,"v":{"polluted":"sim"}},"lanc:11"');
    arq.files.dados00001.body = corpo;
    const tok = { tf_gtoken: { v: 't', exp: Date.now() + 3600000 }, tf_gjaconectou: true, tf_gfile: 'dados00001' };
    const A = await abrir({ tf_modo: 'real', tf_real: REAL(), ...tok }, { fetch: fakeFetch });
    await A.w.eval('sincronizar()'); await tick(30);
    const lanc = A.w.eval('S').st.lanc;
    t('sync: lançamentos válidos chegam; com valor de texto são descartados', lanc.some(l => l.id === 11) && lanc.some(l => l.id === 12) && !lanc.some(l => l.id === 13));
    t('sync: texto enorme do Drive chega cortado', lanc.find(l => l.id === 14).desc.length === Seg.LIM.desc);
    t('sync: meta com id hostil é descartada, a outra entra', A.w.eval('S').st.metas.length === 1 && A.w.eval('S').st.metas[0].id === 21);
    t('sync: teto Mercado entra; teto com nome hostil também entra como texto (escapado ao desenhar)', A.w.eval('S').st.tetos.Mercado === 900 && Object.keys(A.w.eval('S').st.tetos).some(k => k.includes('<img')));
    t('sync: números aceitos só os válidos', A.w.eval('S').st.numeros.mercado === 400 && A.w.eval('S').st.numeros.repasse['2026-12'] === true && !('<x>' in A.w.eval('S').st.numeros.repasse));
    t('sync: nenhuma poluição de protótipo na página nem no teste', A.w.eval('({}).polluted') === undefined && A.w.eval('Object.getPrototypeOf(S.st.pagos)===Object.prototype') === true);
    t('sync: o Drive tinha itens recusados, então o app NÃO sobrescreve o arquivo (nada se perde em silêncio)', arq.files.dados00001.body === corpo && /não aceita/.test(A.$('#sync').title));
    await percorrer(A);
    await A.ir('lancar');
    t('sync: texto hostil do Drive aparece literal na lista', A.$('#lista').textContent.includes(P[0]) && A.$('#lista').textContent.includes(P[1]));
    t('sync: nenhuma tela injeta HTML nem executa script', injetado(A).length === 0 && A.w.__xss === undefined, injetado(A).join());
    await A.ir('orcamento');
    t('sync: nome de teto hostil aparece literal no Orçamento', A.texto().includes('<img src=x onerror=window.__xss=6>') && injetado(A).length === 0);
    await A.ir('metas');
    t('sync: nome de meta do Drive aparece literal', A.texto().includes(P[4].replace(/\s+/g, ' ')));
    t('sync: sem erros de script', A.erros.length === 0, A.erros.slice(0, 2).join(' | '));
    // o que foi gravado no armazenamento local também está limpo
    const guardado = JSON.parse(A.w.localStorage.getItem('tf_lanc3'));
    t('sync: armazenamento local guarda só lançamentos saneados', guardado.every(l => typeof l.valor === 'number' && l.desc.length <= Seg.LIM.desc));
    // id de arquivo hostil devolvido pela busca do Drive não vira URL/consulta
    const D = await abrir({ tf_modo: 'real', tf_real: REAL(), tf_gtoken: tok.tf_gtoken, tf_gjaconectou: true, tf_gfile: '../../x?alt=media#' }, { fetch: fakeFetch });
    await D.w.eval('sincronizar()'); await tick(20);
    t('sync: id de arquivo malformado é recusado antes de chamar a rede', /Falhou|Sem sincronizar/.test(D.$('#sync').textContent) || D.$('#sync').className.includes('ru'));
  }
  resumo();
}

function resumo() {
  if (!JSDOM) { console.log('ATENÇÃO: testes de interface NÃO rodaram (jsdom ausente). Saindo com erro.'); process.exit(1); }
  console.log(f ? f + ' falha(s) de ' + (ok + f) : 'Todos os ' + ok + ' testes de segurança passaram.');
  process.exit(f ? 1 : 0);
}
if (!JSDOM) { /* a seção 5 chama fimInterface, que encerra */ }
