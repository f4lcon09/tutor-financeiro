/* Regressão de dois defeitos de sincronização: modo apagado com Drive conectado, e Ver exemplo e voltar. Só valores inventados. */
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const TFSync = require('./sync.js');
const { t, fim } = contador('regressão da sincronização');

const memoria = ini => { const o = {}; Object.keys(ini || {}).forEach(k => { o[k] = JSON.stringify(ini[k]); }); return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: k => { delete o[k]; }, key: i => Object.keys(o)[i], get length() { return Object.keys(o).length; }, _o: o }; };
const hoje = new Date(), mes = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
const clone = o => JSON.parse(JSON.stringify(o));
const CHAVES = ['tf_modo', 'tf_real', 'tf_lanc3', 'tf_metas', 'tf_tetos', 'tf_numeros', 'tf_pagos', 'tf_taxameta'];
const foto = m => { const f = {}; CHAVES.forEach(k => { f[k] = m.getItem(k); }); return f; };
const TELAS = ['hoje', 'lancar', 'cartao', 'agenda', 'orcamento', 'metas', 'futuro', 'decidir', 'numeros', 'hoje'];

const MEUS = [
  { id: 1700000000001, data: mes + '-02', desc: 'Feira inventada', cat: 'Mercado', valor: 87.35, forma: 'Pix', essencial: true, lazer: false },
  { id: 1700000000002, data: mes + '-02', desc: 'Lanche inventado', cat: 'Comida', valor: 23.9, forma: 'Pix', essencial: false, lazer: true },
  { id: 1700000000003, data: mes + '-01', desc: 'Livro inventado', cat: 'Lazer', valor: 54, forma: 'Crédito', essencial: false, lazer: true }
];
const META = { id: 7, nome: 'Meta inventada', alvo: 1234, guardado: 222, prazo: '2027-06', aporte: 55 };
const REAL = () => { const r = clone(FICTICIO); r.cartoes_extra = [{ id: 'c2', nome: 'Cartão Inventado', limite: 777, fatura: 11 }]; return r; };
const antigo = extra => Object.assign({ tf_modo: 'real', tf_real: REAL(), tf_lanc3: clone(MEUS), tf_metas: [clone(META)], tf_tetos: { Mercado: 611, Transporte: 145, Estudos: 90, 'Saúde': 120, Outros: 277 }, tf_numeros: { mercado: 433 }, tf_pagos: {}, tf_taxameta: 0.7 }, extra || {});
const DEMO_LANC = [
  { id: 1, data: mes + '-03', desc: 'Jogo novo', cat: 'Jogos', valor: 59.9, forma: 'Crédito', essencial: false, lazer: true },
  { id: 2, data: mes + '-01', desc: 'Compra do mês', cat: 'Mercado', valor: 312.4, forma: 'Débito', essencial: true, lazer: false }
];
const DEMO_METAS = [{ id: 1, nome: 'Reserva de emergência (6 meses)', alvo: 9600, guardado: 1950, prazo: '2027-12', aporte: 350 }];

/* Drive de mentira: registra cada gravação */
function driveFalso(tk, doc) {
  const arq = { files: {} }, escritas = [], leituras = [];
  if (doc) { arq.files.pasta = { name: 'Tutor Financeiro', body: '' }; arq.files.arq = { name: 'dados.json', body: JSON.stringify(doc) }; }
  const resp = o => Promise.resolve({ ok: true, status: 200, json: async () => o, text: async () => (typeof o === 'string' ? o : JSON.stringify(o)) });
  const nao = () => Promise.resolve({ ok: false, status: 404, json: async () => ({}), text: async () => '' });
  const fetch = (url, opt = {}) => {
    url = String(url);
    if (url.includes('/upload/drive/v3/files/')) { const id = url.split('/files/')[1].split('?')[0]; if (!arq.files[id]) return nao(); arq.files[id].body = opt.body; escritas.push(opt.body); return resp({ id }); }
    if (url.includes('alt=media')) { const id = url.split('/files/')[1].split('?')[0]; if (!arq.files[id]) return nao(); leituras.push(id); return resp(arq.files[id].body || ''); }
    if (opt.method === 'POST') { const b = JSON.parse(opt.body), id = 'f' + Object.keys(arq.files).length; arq.files[id] = { name: b.name, body: '' }; return resp({ id }); }
    const nome = (decodeURIComponent(url.split('q=')[1] || '').match(/name='([^']+)'/) || [])[1];
    return resp({ files: Object.entries(arq.files).filter(([, f]) => f.name === nome).map(([i, f]) => ({ id: i, name: f.name })) });
  };
  const itens = () => { const f = Object.values(arq.files).find(x => x.name === 'dados.json'); return f && f.body ? JSON.parse(f.body).itens : {}; };
  return { fetch, escritas, leituras, itens, vivos: () => Object.entries(itens()).filter(([, i]) => !i.d).map(([k]) => k), tk };
}
const conecta = (m, tk) => { m.setItem('tf_gtoken', JSON.stringify({ v: tk, exp: Date.now() + 3600000 })); m.setItem('tf_gjaconectou', 'true'); };
const docDe = (st, u) => TFSync.doc(TFSync.atualizar(st, {}, u));
const estadoDe = (ini) => ({ lanc: ini.tf_lanc3, pagos: ini.tf_pagos, tetos: ini.tf_tetos, metas: ini.tf_metas, taxa: ini.tf_taxameta, numeros: ini.tf_numeros, real: ini.tf_real });
const espera = async (A) => { await A.w.eval('sincronizar()'); await tick(30); };

(async () => {
  /* ===== 9. Dados guardados, modo apagado (tocou em Reimportar na versão antiga), Drive conectado ===== */
  {
    const ini = antigo(), doc = docDe(estadoDe(ini), Date.now() - 86400000), m = memoria(ini); m.setItem('tf_items', JSON.stringify(doc.itens)); m.removeItem('tf_modo');
    const D = driveFalso('tok', doc); conecta(m, 'tok');
    const A = await abrir({}, { storage: m, fetch: D.fetch }); await espera(A);
    t('9: mostra que os dados continuam e não pede os três números', !!A.$('#ini_voltar') && !A.$('#ini_ok'));
    t('9: os dados reais locais continuam', m.getItem('tf_real') === JSON.stringify(ini.tf_real));
    t('9: o Drive continua com os dados reais', D.vivos().includes('real'));
    t('9: sem nada para enviar, o Drive não é regravado', D.escritas.length === 0);
    t('9: quem pediu para reimportar continua na tela de reimportar', m.getItem('tf_modo') === null || m.getItem('tf_modo') === 'null');
    m.setItem('tf_modo', JSON.stringify('real')); const V = await abrir({}, { storage: m, fetch: D.fetch }); await espera(V);
    t('9: ao voltar, os dados reais seguem no Drive', D.vivos().includes('real'));
  }

  /* ===== 9b. Aparelho novo, sem nada guardado: continua recebendo os dados do Drive ===== */
  {
    const doc = docDe(estadoDe(antigo()), Date.now() - 86400000), m = memoria({}), D = driveFalso('tok', doc); conecta(m, 'tok');
    const A = await abrir({}, { storage: m, fetch: D.fetch }); await espera(A);
    t('9b: aparelho novo recebe os dados reais e entra no modo real', JSON.parse(m.getItem('tf_modo')) === 'real' && JSON.parse(m.getItem('tf_real')).cartoes_extra[0].nome === 'Cartão Inventado');
  }

  /* ===== 10. Pessoa com dados reais abre Ver exemplo e volta; outro aparelho alterou algo antes ===== */
  {
    const ini = antigo(), velho = Date.now() - 86400000, doc = docDe(estadoDe(ini), velho), m = memoria(ini); m.setItem('tf_items', JSON.stringify(doc.itens));
    const outra = clone(doc); const ed = clone(MEUS[0]); ed.valor = 91.11; outra.itens['lanc:' + ed.id] = { u: velho + 1000, d: false, v: ed };
    const D = driveFalso('tok', outra); conecta(m, 'tok');
    m.setItem('tf_modo', JSON.stringify('demo'));
    const A = await abrir({}, { storage: m, fetch: D.fetch }); await espera(A);
    t('10: no exemplo o Drive não é tocado', D.escritas.length === 0 && D.leituras.length === 0);
    t('10: o exemplo não mexe nos itens dos dados reais', m.getItem('tf_items') === JSON.stringify(doc.itens));
    A.w.eval("S.lancar({tipo:'gasto',valor:'33',desc:'Gasto do exemplo',cat:'Outros',data:S.hojeISO(),essencial:false,lazer:false})"); await tick(10);
    t('10: lançar no exemplo não vai para os itens dos dados reais', !/Gasto do exemplo/.test(m.getItem('tf_items')));
    await tick(5); m.setItem('tf_modo', JSON.stringify('real'));
    const B = await abrir({}, { storage: m, fetch: D.fetch }); await espera(B);
    t('10: voltar do exemplo não apaga nada no Drive', Object.keys(outra.itens).every(k => D.vivos().includes(k)));
    t('10: a edição feita em outro aparelho sobrevive', (D.itens()['lanc:' + ed.id] || { v: {} }).v.valor === 91.11);
    t('10: o aparelho recebe essa edição', JSON.parse(m.getItem('tf_lanc3')).find(l => l.id === ed.id).valor === 91.11);
    t('10: o gasto do exemplo não chega ao Drive', !JSON.stringify(D.itens()).includes('Gasto do exemplo'));
  }
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
