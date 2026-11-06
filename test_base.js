/* Base dos testes de interface versionados: abre o app num DOM simulado (jsdom) com scripts embutidos.
   Só usa valores inventados para o teste. Precisa de dev/node_modules/jsdom (cd dev && npm install); sem isso avisa e sai com erro. */
const fs = require('fs'), path = require('path');
const JS = path.join(__dirname, 'dev', 'node_modules', 'jsdom');
if (!fs.existsSync(JS)) { console.log('ATENÇÃO: testes de interface NÃO rodaram (jsdom ausente).'); process.exit(2); }
const { JSDOM, VirtualConsole } = require(JS);

const tick = (ms = 0) => new Promise(r => setTimeout(r, ms));

/* Dados inventados no formato do arquivo importado. Nenhum número aqui vem de dados reais. */
const FICTICIO = {
  _meta: { as_of: '2026-01-15' }, liquidez: { total: 9000, conta_corrente: 500, onde: 'Banco Teste' },
  cartao: { emissor: 'Cartão Teste', fechamento_dia: 5, limite: 4000, fatura_atual: { total: 300, vence_em: '2026-02-12' } },
  pendencias_novembro: [{ descricao: 'Conta de teste', valor: 100, vence: '2026-02-12' }],
  plano_de_pagamento: [], sobra_apos_pagar_tudo: 8000, entradas_esperadas: [{ descricao: 'Salário de teste', valor_estimado: 5000 }],
  gastos_fixos_mensais: { ajuda_em_casa_a_partir_de_dezembro: 200, faculdade_2026: 100, faculdade_2027_estimado: 120, assinaturas_no_cartao: { a: 10 }, teto_lazer_mes: 300 },
  faturas_futuras_parcelas_antigas: [{ mes: '2026-02', fatura_total: 200, parte_mae: 0 }],
  regras_e_metas: { meta_17_01_2027: 5000, piso_17_01_2027: 3000, alerta_dezembro: 2000, piso_absoluto_status: 'definido' },
  pendente_do_usuario: [], _traducoes: {}, cartoes_extra: []
};

async function abrir(inicial, opts) {
  opts = opts || {};
  let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');   // o jsdom não aplica CSP; csp.js testa a CSP em navegador real
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => '<script>' + fs.readFileSync(path.join(__dirname, src), 'utf8').replace(/<\/script>/g, '<\\/script>') + '</script>');
  const erros = [], vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) erros.push('jsdom: ' + e.message); });
  vc.on('error', e => erros.push('console.error: ' + e));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: opts.url || 'http://localhost/index.html', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      if (opts.storage) { Object.defineProperty(w, 'localStorage', { value: opts.storage, configurable: true }); }
      Object.keys(inicial || {}).forEach(k => w.localStorage.setItem(k, JSON.stringify(inicial[k])));
      if (opts.largura) w.innerWidth = opts.largura;
      if (opts.userAgent) Object.defineProperty(w.navigator, 'userAgent', { value: opts.userAgent, configurable: true });
      if (opts.antes) opts.antes(w);
      w.scrollTo = () => {}; w.URL.createObjectURL = () => 'blob:x';
      w.HTMLAnchorElement.prototype.click = function () { w.__baixou = this.download; };
      w.Element.prototype.scrollIntoView = function () {};
      w.fetch = opts.fetch || (() => Promise.reject(new Error('sem rede')));
      w.addEventListener('error', e => erros.push('erro de script: ' + e.message));
    }
  });
  await tick(30);
  const w = dom.window, d = w.document;
  return {
    w, d, erros,
    $: s => d.querySelector(s), $$: s => [...d.querySelectorAll(s)],
    ir: async k => { w.eval("ir('" + k + "')"); await tick(15); },
    set: (sel, v) => { const e = d.querySelector(sel); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('change', { bubbles: true })); },
    click: sel => { const e = typeof sel === 'string' ? d.querySelector(sel) : sel; e.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); },
    ls: k => { const v = w.localStorage.getItem(k); try { return JSON.parse(v); } catch (e) { return v; } },
    texto: () => d.querySelector('main').textContent.replace(/\s+/g, ' ')
  };
}

function contador(nome) {
  let ok = 0, f = 0;
  return { t: (n, c) => { if (c) ok++; else { f++; console.log('FALHOU: ' + n); } }, fim: () => { console.log(f ? f + ' falha(s) de ' + (ok + f) : 'Todos os ' + ok + ' testes de ' + nome + ' passaram.'); return f ? 1 : 0; } };
}

module.exports = { abrir, tick, contador, FICTICIO };
