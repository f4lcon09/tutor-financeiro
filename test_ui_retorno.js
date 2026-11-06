/* Quem já usava o app abre a versão nova. Formato antigo de armazenamento (chaves normais), só valores inventados.
   Linhas "OBS:" descrevem o que a pessoa vê; não são falhas. */
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const TFSync = require('./sync.js');
const { t, fim } = contador('usuário que volta');

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
  /* ===== 1. Modo real, sem Drive ===== */
  {
    let chamadas = 0; const m = memoria(antigo()), f0 = foto(m);
    const A = await abrir({}, { storage: m, fetch: () => { chamadas++; return Promise.reject(new Error('sem rede')); } });
    t('1: não aparece o primeiro uso', !A.$('#ini_renda') && !A.$('#ini_ok') && !/Bem-vindo/.test(A.texto()));
    t('1: não entra na tela simples', A.w.eval('SIMPLES()') === false);
    t('1: não mostra o selo de exemplo', !/exemplo/i.test((A.$('#selo') || { textContent: '' }).textContent));
    t('1: nada mudou ao abrir', JSON.stringify(foto(m)) === JSON.stringify(f0));
    for (const k of TELAS) { await A.ir(k); }
    await A.ir('lancar'); t('1: os lançamentos antigos aparecem', MEUS.every(l => A.texto().includes(l.desc)));
    await A.ir('metas'); t('1: a meta antiga aparece', A.texto().includes(META.nome));
    await A.ir('cartao'); t('1: o cartão extra aparece', A.texto().includes('Cartão Inventado'));
    t('1: nada mudou depois de passar por todas as telas', JSON.stringify(foto(m)) === JSON.stringify(f0));
    t('1: nenhuma chave de exemplo foi criada', !Object.keys(m._o).some(k => k.startsWith('tf_demo_')));
    t('1: nenhuma chamada de rede sem conexão com o Drive', chamadas === 0);
    t('1: sem erro de script', A.erros.length === 0);
    const B = await abrir({}, { storage: m, fetch: () => Promise.reject(new Error('sem rede')) });
    t('1: reabrir não muda nada', JSON.stringify(foto(m)) === JSON.stringify(f0) && !B.$('#ini_renda'));
  }

  /* ===== 2. Drive conectado e ainda sem arquivo: primeira sincronização normal ===== */
  {
    const m = memoria(antigo()), f0 = foto(m), D = driveFalso('tok'); conecta(m, 'tok');
    const A = await abrir({}, { storage: m, fetch: D.fetch }); await espera(A);
    t('2: cria o arquivo vazio e envia os dados uma vez, pela sincronização normal', D.escritas.length === 2 && Object.keys(JSON.parse(D.escritas[0]).itens).length === 0);
    t('2: o Drive recebeu lançamentos, meta e dados reais', MEUS.every(l => D.vivos().includes('lanc:' + l.id)) && D.vivos().includes('meta:7') && D.vivos().includes('real'));
    t('2: os dados locais não mudaram', JSON.stringify(foto(m)) === JSON.stringify(f0));
    await espera(A);
    t('2: sem mudança, sincronizar de novo não grava', D.escritas.length === 2);
  }

  /* ===== 3. Drive com os mesmos dados, itens locais já existentes ===== */
  {
    const ini = antigo(), doc = docDe(estadoDe(ini), Date.now() - 86400000);
    const m = memoria(ini); m.setItem('tf_items', JSON.stringify(doc.itens)); const f0 = foto(m), D = driveFalso('tok', doc); conecta(m, 'tok');
    const A = await abrir({}, { storage: m, fetch: D.fetch }); await espera(A);
    t('3: dados iguais: nada é gravado no Drive', D.escritas.length === 0 && D.leituras.length > 0);
    t('3: os dados locais não mudaram', JSON.stringify(foto(m)) === JSON.stringify(f0));
  }

  /* ===== 4. Drive mais completo que o aparelho ===== */
  {
    const ini = antigo(), extra = { id: 1700000000009, data: mes + '-01', desc: 'Compra de outro aparelho', cat: 'Outros', valor: 19.9, forma: 'Pix', essencial: false, lazer: false };
    const noDrive = antigo(); noDrive.tf_lanc3 = noDrive.tf_lanc3.concat([extra]); noDrive.tf_metas = noDrive.tf_metas.concat([{ id: 8, nome: 'Outra meta inventada', alvo: 500, guardado: 10, prazo: '2027-09', aporte: 20 }]);
    const doc = docDe(estadoDe(noDrive), Date.now() - 86400000), vivosAntes = Object.keys(doc.itens).length;
    const m = memoria(ini), D = driveFalso('tok', doc); conecta(m, 'tok');
    const A = await abrir({}, { storage: m, fetch: D.fetch }); await espera(A);
    t('4: o Drive continua com tudo que tinha', Object.keys(doc.itens).every(k => D.vivos().includes(k)) && D.vivos().length >= vivosAntes);
    t('4: nenhuma lápide entrou no Drive', Object.values(D.itens()).every(i => !i.d));
    t('4: o aparelho recebeu o que faltava', /Compra de outro aparelho/.test(m.getItem('tf_lanc3')) && /Outra meta inventada/.test(m.getItem('tf_metas')));
    t('4: o aparelho manteve o que tinha', MEUS.every(l => m.getItem('tf_lanc3').includes(l.desc)));
    t('4: o aparelho segue com os dados reais, sem primeiro uso', !A.$('#ini_renda') && JSON.parse(m.getItem('tf_real')).cartoes_extra[0].nome === 'Cartão Inventado');
  }

  /* ===== 5. Drive com item que o app recusa: não sobrescreve ===== */
  {
    const ini = antigo(), doc = docDe(estadoDe(ini), Date.now() - 86400000); doc.itens['lanc:999'] = { u: 1, d: false, v: { id: 999, data: 'data ruim', desc: 'x', cat: 'Outros', valor: 'nao e numero', forma: 'Pix' } };
    const m = memoria(ini); m.setItem('tf_items', JSON.stringify(doc.itens)); const D = driveFalso('tok', doc); conecta(m, 'tok');
    const A = await abrir({}, { storage: m, fetch: D.fetch }); A.w.eval("S.lancar({tipo:'gasto',valor:'10',desc:'Novo inventado',cat:'Outros',data:S.hojeISO(),essencial:false,lazer:false})"); await espera(A);
    t('5: com item recusado o Drive não é sobrescrito', D.escritas.length === 0);
  }

  /* ===== 6. Decisão 8: exemplo antigo nas chaves normais, sem dados reais ===== */
  {
    const m = memoria({ tf_modo: 'demo', tf_lanc3: DEMO_LANC.concat(clone(MEUS)), tf_metas: DEMO_METAS.concat([clone(META)]), tf_tetos: { Mercado: 611 }, tf_taxameta: 0.8 }), f0 = foto(m);
    let chamadas = 0; const fetch = () => { chamadas++; return Promise.reject(new Error('sem rede')); };
    const A = await abrir({}, { storage: m, fetch }); await A.ir('lancar');
    const viu = MEUS.filter(l => A.texto().includes(l.desc)).length;
    console.log('OBS: 6a, modo exemplo antigo: selo=' + !!A.$('#selo') + ', lançamentos antigos visíveis=' + viu + ' de ' + MEUS.length + ', exemplo novo visível=' + /Cinema/.test(A.texto()));
    t('6: abrir no modo exemplo não muda as chaves normais', JSON.stringify(foto(m)) === JSON.stringify(f0));
    t('6: modo exemplo não chama a rede', chamadas === 0);
    m.setItem('tf_modo', JSON.stringify(null));   // o que sairExemplo faz sem dados reais
    const B = await abrir({}, { storage: m, fetch }); t('6: ao sair do exemplo vem a tela de começar', !!B.$('#ini_ok'));
    B.set('#ini_renda', '5000'); B.set('#ini_fixos', '3000'); B.set('#ini_saldo', '1500'); B.click('#ini_ok'); await tick(10);
    const C = await abrir({}, { storage: m, fetch }); await C.ir('lancar');
    const lanc = JSON.parse(m.getItem('tf_lanc3')), metas = JSON.parse(m.getItem('tf_metas'));
    console.log('OBS: 6b, depois dos três números: lançamentos guardados=' + lanc.length + ' (exemplo antigo ' + lanc.filter(l => l.id < 100).length + '), metas guardadas=' + metas.length + ' (exemplo antigo ' + metas.filter(x => x.id === 1).length + '), "Compra do mês" na tela=' + /Compra do mês/.test(C.texto()) + ', "Feira inventada" na tela=' + /Feira inventada/.test(C.texto()));
    await C.ir('metas'); console.log('OBS: 6c, meta do exemplo antigo na tela Metas=' + /Reserva de emergência/.test(C.texto()) + ', meta própria=' + /Meta inventada/.test(C.texto()));
    t('6: nada se perdeu', MEUS.every(l => m.getItem('tf_lanc3').includes(l.desc)) && DEMO_LANC.every(l => m.getItem('tf_lanc3').includes(l.desc)) && m.getItem('tf_metas').includes(META.nome));
  }

  /* ===== 7. Decisão 8: exemplo antigo misturado com dados reais, modo real ===== */
  {
    const ini = antigo({ tf_lanc3: DEMO_LANC.concat(clone(MEUS)), tf_metas: DEMO_METAS.concat([clone(META)]) }), m = memoria(ini), f0 = foto(m), D = driveFalso('tok'); conecta(m, 'tok');
    const A = await abrir({}, { storage: m, fetch: D.fetch }); await A.ir('lancar');
    console.log('OBS: 7, modo real com exemplo misturado: primeiro uso=' + !!A.$('#ini_ok') + ', selo=' + !!A.$('#selo') + ', "Compra do mês" do exemplo na tela=' + /Compra do mês/.test(A.texto()) + ', "Feira inventada" na tela=' + /Feira inventada/.test(A.texto()));
    await espera(A);
    console.log('OBS: 7, itens do exemplo enviados ao Drive=' + D.vivos().filter(k => k === 'lanc:1' || k === 'lanc:2' || k === 'meta:1').length + ' de 3');
    t('7: nada mudou nem se perdeu', JSON.stringify(foto(m)) === JSON.stringify(f0));
  }

  /* ===== 8. Modo exemplo antigo com dados reais guardados ===== */
  {
    const m = memoria(antigo({ tf_modo: 'demo' })), f0 = foto(m), A = await abrir({}, { storage: m, fetch: () => Promise.reject(new Error('sem rede')) });
    t('8: dados reais guardados não são tocados', JSON.stringify(foto(m)) === JSON.stringify(f0) && !!A.$('#selo'));
    m.setItem('tf_modo', JSON.stringify('real'));
    const B = await abrir({}, { storage: m, fetch: () => Promise.reject(new Error('sem rede')) });
    await B.ir('lancar'); t('8: ao voltar para o real, tudo está lá', MEUS.every(l => B.texto().includes(l.desc)) && !B.$('#ini_ok'));
  }

  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
