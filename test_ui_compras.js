/* compras-1: categoria nova "Compras" e categoria fora da lista (de outra versão do app). Só valores inventados. */
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const Store = require('./store.js'), Seg = require('./seguranca.js'), TFSync = require('./sync.js');
const { t, fim } = contador('categoria Compras');

const ORDEM = 'Lazer,Jogos,Comida,Mercado,Compras,Transporte,Estudos,Saúde,Outros';
const memoria = ini => { const o = {}; Object.keys(ini || {}).forEach(k => { o[k] = JSON.stringify(ini[k]); }); return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: k => { delete o[k]; }, key: i => Object.keys(o)[i], get length() { return Object.keys(o).length; }, _o: o }; };
const hoje = new Date(), mes = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0'), dia = String(Math.min(hoje.getDate(), 28)).padStart(2, '0');
const clone = o => JSON.parse(JSON.stringify(o));
const L = (id, cat, valor, extra) => Object.assign({ id, data: mes + '-' + dia, desc: 'Item inventado ' + id, cat, valor, forma: 'Pix', essencial: false, lazer: false }, extra || {});
const chips = A => A.$$('#f_cat .chip').map(b => b.dataset.c).join();
const lancs = m => JSON.parse(m.getItem('tf_lanc3') || '[]');
const catDe = (m, id) => (lancs(m).find(l => l.id === id) || {}).cat;
/* rede: conta todo pedido; sem Drive de mentira, recusa */
const espiao = () => { const s = { n: 0 }; s.fetch = () => { s.n++; return Promise.reject(new Error('sem rede')); }; return s; };

/* Drive de mentira, como em test_ui_sync_retorno.js */
function driveFalso(doc) {
  const arq = { files: {} }, escritas = [];
  if (doc) { arq.files.pasta = { name: 'Tutor Financeiro', body: '' }; arq.files.arq = { name: 'dados.json', body: JSON.stringify(doc) }; }
  const resp = o => Promise.resolve({ ok: true, status: 200, json: async () => o, text: async () => (typeof o === 'string' ? o : JSON.stringify(o)) });
  const nao = () => Promise.resolve({ ok: false, status: 404, json: async () => ({}), text: async () => '' });
  const fetch = (url, opt = {}) => {
    url = String(url);
    if (url.includes('/upload/drive/v3/files/')) { const id = url.split('/files/')[1].split('?')[0]; if (!arq.files[id]) return nao(); arq.files[id].body = opt.body; escritas.push(opt.body); return resp({ id }); }
    if (url.includes('alt=media')) { const id = url.split('/files/')[1].split('?')[0]; if (!arq.files[id]) return nao(); return resp(arq.files[id].body || ''); }
    if (opt.method === 'POST') { const b = JSON.parse(opt.body), id = 'f' + Object.keys(arq.files).length; arq.files[id] = { name: b.name, body: '' }; return resp({ id }); }
    const nome = (decodeURIComponent(url.split('q=')[1] || '').match(/name='([^']+)'/) || [])[1];
    return resp({ files: Object.entries(arq.files).filter(([, f]) => f.name === nome).map(([i, f]) => ({ id: i, name: f.name })) });
  };
  const itens = () => { const f = Object.values(arq.files).find(x => x.name === 'dados.json'); return f && f.body ? JSON.parse(f.body).itens : {}; };
  return { fetch, escritas, itens };
}
const conecta = m => { m.setItem('tf_gtoken', JSON.stringify({ v: 'tok', exp: Date.now() + 3600000 })); m.setItem('tf_gjaconectou', 'true'); };
const sincroniza = async A => { await A.w.eval('sincronizar()'); await tick(30); };

(async () => {
  /* ===== 1. Listas (parte pura) ===== */
  t('lista do app de dados: Compras logo depois de Mercado', Store.CATEGORIAS.join() === 'Mercado,Compras,Transporte,Lazer,Comida,Estudos,Saúde,Jogos,Outros');
  t('lista da segurança: a mesma, na mesma ordem', Seg.CATS.join() === Store.CATEGORIAS.join());
  t('a lista da tela tem as mesmas categorias', ORDEM.split(',').sort().join() === Store.CATEGORIAS.slice().sort().join());
  const sg = Store.sugerir('Compras', 'loja inventada');
  t('sugestão para Compras: nem essencial nem lazer, pergunta "Em dúvida?"', sg.essencial === false && sg.lazer === false && /Em dúvida/.test(sg.texto));
  t('nome na tela: Compras continua Compras', Store.catExibida('Compras') === 'Compras');
  t('nome na tela: categoria fora da lista vira Outros', Store.catExibida('Viagem') === 'Outros' && Store.catExibida(undefined) === 'Outros' && Store.catExibida('') === 'Outros');

  /* ===== 2. Lançar, corrigir e somar (parte pura) ===== */
  {
    const s = Store.criarStore(memoria(), () => new Date(2026, 10, 9));
    const r = s.lancar({ tipo: 'gasto', valor: '45,90', desc: 'Fone inventado', cat: 'Compras', data: '2026-11-09' });
    t('lançar em Compras grava Compras', r.ok && s.st.lanc[0].cat === 'Compras');
    t('lançamento novo fora da lista é recusado', s.lancar({ tipo: 'gasto', valor: '1', desc: 'x', cat: 'Viagem', data: '2026-11-09' }).erros.cat === 'Escolha uma categoria.');
    s.aplicar({ lanc: [L(1, 'Compras', 50), L(2, 'Viagem', 70), L(3, 'Outros', 5), L(4, 'Mercado', 30), L(5, 'Viagem', 9, { lazer: true })].map(l => Object.assign(l, { data: '2026-11-03' })) });
    const pc = s.porCategoria('2026-11');
    t('por categoria: fora da lista soma em Outros (70 + 5), lazer fica de fora', pc.Outros === 75 && pc.Compras === 50 && pc.Mercado === 30 && !('Viagem' in pc));
    t('por categoria: o valor guardado continua Viagem', s.st.lanc.filter(l => l.cat === 'Viagem').length === 2);
    const e1 = s.editar(2, { tipo: 'gasto', valor: '80', desc: 'Item inventado 2', cat: 'Viagem', data: '2026-11-03' });
    t('corrigir sem trocar a categoria: aceita e mantém Viagem', e1.ok && s.st.lanc.find(l => l.id === 2).cat === 'Viagem' && s.st.lanc.find(l => l.id === 2).valor === 80);
    const e2 = s.editar(2, { tipo: 'gasto', valor: '80', desc: 'x', cat: 'Lugar', data: '2026-11-03' });
    t('corrigir para outra categoria fora da lista: recusa', !e2.ok && e2.erros.cat === 'Escolha uma categoria.' && s.st.lanc.find(l => l.id === 2).cat === 'Viagem');
    const e3 = s.editar(2, { tipo: 'gasto', valor: '80', desc: 'x', cat: 'Compras', data: '2026-11-03' });
    t('corrigir escolhendo Compras: troca de verdade', e3.ok && s.st.lanc.find(l => l.id === 2).cat === 'Compras');
    t('lançamento de outra categoria não aceita a categoria guardada de outro', !s.editar(4, { tipo: 'gasto', valor: '1', desc: 'x', cat: 'Viagem', data: '2026-11-03' }).ok);
  }

  /* ===== 3. O que chega do Drive (saneador) ===== */
  {
    const s = Store.criarStore(memoria());
    const vem = [['Compras', 'Compras'], ['Viagem', 'Viagem'], ['Casa e jardim', 'Casa e jardim'], ['Pet-shop', 'Pet-shop'], ['Educação 2', 'Educação 2'],
      ['<b>x</b>', 'Outros'], ['=1+1', 'Outros'], ['constructor', 'Outros'], [' Viagem', 'Outros'], ['Viagem ', 'Outros'], ['V'.repeat(41), 'Outros'], ['V'.repeat(40), 'V'.repeat(40)], ['', 'Outros']];
    s.aplicar({ lanc: vem.map((c, i) => L(100 + i, c[0], 1)) });
    vem.forEach((c, i) => t('Drive traz "' + (c[0].length > 12 ? c[0].slice(0, 6) + '…(' + c[0].length + ')' : c[0]) + '": fica "' + (c[1].length > 12 ? c[1].slice(0, 6) + '…' : c[1]) + '"', (s.st.lanc.find(l => l.id === 100 + i) || {}).cat === c[1]));
    t('categoria não-texto continua descartando o lançamento', Seg.sanearEstado({ lanc: [L(1, 5, 1)] }).estado.lanc.length === 0);
    /* ida e volta pela junção: nada muda */
    const est = { lanc: [L(1, 'Compras', 10), L(2, 'Viagem', 20), L(3, 'Mercado', 30)], pagos: {}, tetos: { Compras: 100 }, metas: [], taxa: 0.8 };
    const itens = TFSync.atualizar(est, {}, 1000), s2 = Store.criarStore(memoria());
    s2.aplicar(TFSync.montar(itens));
    const de_novo = TFSync.atualizar(s2.paraSync(), itens, 2000);
    t('junção: Compras, Viagem e o teto de Compras voltam iguais, sem hora nova', TFSync.igual(de_novo, itens) && s2.st.tetos.Compras === 100);
    /* conjunto antigo de categorias: chega e fica igual */
    const velho = { lanc: [L(1, 'Jogos', 10, { lazer: true }), L(2, 'Saúde', 20), L(3, 'Outros', 30)], pagos: {}, tetos: { Mercado: 500, Outros: 90 }, metas: [], taxa: 0.8 };
    const it2 = TFSync.atualizar(velho, {}, 1000), s3 = Store.criarStore(memoria());
    s3.aplicar(TFSync.montar(it2));
    t('dados só com as categorias antigas: chegam e voltam iguais', TFSync.igual(TFSync.atualizar(s3.paraSync(), it2, 2000), it2));
  }

  /* ===== 4. Sem dados: tela de boas-vindas ===== */
  {
    const r = espiao(), m = memoria(), A = await abrir({}, { storage: m, fetch: r.fetch }); await tick(30);
    t('sem dados: abre a tela inicial, sem erro', !!A.$('#ini_ok') && A.erros.length === 0);
    t('sem dados: nenhum pedido de rede', r.n === 0);
    t('sem dados: nada de lançamento gravado', m.getItem('tf_lanc3') === null || lancs(m).length === 0);
  }

  /* ===== 5. Exemplo ===== */
  {
    const r = espiao(), m = memoria({ tf_modo: 'demo' }), A = await abrir({}, { storage: m, fetch: r.fetch });
    await A.ir('lancar');
    t('exemplo: chips na ordem, Compras depois de Mercado', chips(A) === ORDEM);
    t('exemplo: o primeiro chip continua Lazer e marcado', A.$('#f_cat .chip').dataset.c === 'Lazer' && A.$('#f_cat .chip').getAttribute('aria-pressed') === 'true');
    A.click('#f_cat .chip[data-c="Compras"]'); await tick(5);
    t('exemplo: tocar em Compras marca só ele', A.$$('#f_cat .chip[aria-pressed="true"]').map(b => b.dataset.c).join() === 'Compras');
    t('exemplo: dica de Compras é a de dúvida, sem marcar essencial nem lazer', /Em dúvida/.test(A.$('#dica').textContent) && !A.$('#f_ess').checked && !A.$('#f_laz').checked);
    A.set('#f_valor', '64.30'); A.set('#f_desc', 'Camiseta inventada'); A.click('#f_ok'); await tick(15);
    const novo = JSON.parse(m.getItem(Object.keys(m._o).find(k => /tf_lanc3$/.test(k) && k !== 'tf_lanc3')) || '[]').find(l => l.desc === 'Camiseta inventada');
    t('exemplo: salvar grava Compras', !!novo && novo.cat === 'Compras' && novo.valor === 64.3 && !novo.lazer && !novo.essencial);
    t('exemplo: a lista mostra Compras', /Camiseta inventada\s*Compras/.test(A.$('#lista').textContent));
    t('exemplo: "Para onde foi" tem Compras', A.w.eval('catTotals()').some(x => x[0] === 'Compras'));
    t('exemplo: nenhum pedido de rede e sem erro', r.n === 0 && A.erros.length === 0);
  }

  /* ===== 6. Real completo: tela, orçamento, gráfico e categoria fora da lista ===== */
  {
    const ini = { tf_modo: 'real', tf_real: clone(FICTICIO), tf_lanc3: [L(1, 'Compras', 120), L(2, 'Viagem', 70), L(3, 'Outros', 5), L(4, 'Mercado', 30), L(5, 'Viagem', 11, { lazer: true })] };
    const m = memoria(ini), A = await abrir({}, { storage: m });
    await A.ir('lancar');
    t('real completo: chips na ordem', chips(A) === ORDEM);
    const linha = id => [...A.$$('#lista tr')].find(tr => tr.textContent.includes('Item inventado ' + id));
    t('real completo: lista mostra Outros para Viagem, e nunca "Viagem"', /Outros/.test(linha(2).textContent) && !/Viagem/.test(A.$('#main').textContent));
    t('real completo: lista mostra Compras', /Compras/.test(linha(1).textContent));
    const ct = A.w.eval('catTotals()');
    t('real completo: "Para onde foi" soma Viagem em Outros (70 + 5 + 11)', ct.find(x => x[0] === 'Outros')[1] === 86 && ct.find(x => x[0] === 'Compras')[1] === 120 && !ct.some(x => x[0] === 'Viagem'));
    t('real completo: depois de pintar, o valor guardado continua Viagem', catDe(m, 2) === 'Viagem' && catDe(m, 5) === 'Viagem');
    A.set('#busca', 'outros'); await tick(5);
    t('real completo: buscar "outros" acha o Viagem', [...A.$$('#lista tr')].some(tr => tr.textContent.includes('Item inventado 2')));
    A.set('#busca', ''); await tick(5);

    /* corrigir um lançamento de categoria fora da lista */
    A.click(linha(2).querySelector('[data-ed]')); await tick(10);
    t('corrigir Viagem: nenhum chip marcado', A.$$('#f_cat .chip[aria-pressed="true"]').length === 0);
    A.set('#f_valor', '72'); A.click('#f_ok'); await tick(15);
    t('corrigir Viagem sem escolher chip: salva e mantém Viagem', catDe(m, 2) === 'Viagem' && lancs(m).find(l => l.id === 2).valor === 72 && /Alteração salva/.test(A.$('#f_msg').textContent));
    A.click(linha(2).querySelector('[data-ed]')); await tick(10);
    A.click('#f_cat .chip[data-c="Compras"]'); A.click('#f_ok'); await tick(15);
    t('corrigir Viagem escolhendo Compras: vira Compras', catDe(m, 2) === 'Compras');

    /* orçamento: Compras sem teto não vira linha, como Comida e Jogos */
    await A.ir('orcamento');
    const linhas = () => A.$$('#main tr[data-cat],#main .orcl[data-cat]').map(e => e.dataset.cat);
    t('orçamento: sem teto de Compras, a linha de Compras aparece como "sem teto"', linhas().includes('Compras') && /sem teto/.test(A.$('#main [data-cat="Compras"]').textContent) && linhas().includes('Outros'));
    t('orçamento: "Ajustar tetos" não oferece Compras sem teto', !A.$('#main input[data-k="Compras"]'));
    t('orçamento: sem erro', A.erros.length === 0);
  }
  {
    const ini = { tf_modo: 'real', tf_real: clone(FICTICIO), tf_tetos: { Mercado: 500, Compras: 200, Outros: 100 }, tf_lanc3: [L(1, 'Compras', 120), L(2, 'Viagem', 70), L(3, 'Outros', 5)] };
    const m = memoria(ini), A = await abrir({}, { storage: m });
    await A.ir('orcamento');
    const linha = c => A.$('#main tr[data-cat="' + c + '"],#main .orcl[data-cat="' + c + '"]');
    t('orçamento com teto de Compras: aparece a linha, com o gasto', !!linha('Compras') && /R\$\s?120/.test(linha('Compras').textContent));
    t('orçamento: Outros soma o Viagem (70 + 5)', /R\$\s?75/.test(linha('Outros').textContent));
    t('orçamento: a faixa de divisão tem Compras na legenda', [...A.$$('#main .legend span')].some(s => /^Compras \d+%$/.test(s.textContent.trim())));
    t('orçamento: "Ajustar tetos" tem o campo de Compras', !!A.$('#main input[data-k="Compras"]') && A.$('#main input[data-k="Compras"]').value === '200');
    A.click(linha('Outros')); await tick(10);
    t('orçamento: abrir Outros lista o Viagem, mostrado como Outros', /Item inventado 2/.test(A.$('#main').textContent) && !/Viagem/.test(A.$('#main').textContent));
    t('orçamento: o valor guardado continua Viagem', catDe(m, 2) === 'Viagem');
  }

  /* ===== 6b. Orçamento não esconde gasto: categoria com gasto e sem teto vira linha "sem teto" e entra no gasto do mês ===== */
  {
    const FIX6 = extra => Object.assign({ tf_modo: 'real', tf_real: clone(FICTICIO), tf_tetos: { Mercado: 500, Outros: 100 },
      tf_lanc3: [L(1, 'Mercado', 30), L(2, 'Compras', 120), L(3, 'Comida', 40), L(4, 'Viagem', 70), L(5, 'Jogos', 25, { lazer: true }), L(6, 'Comida', 15, { lazer: true })] }, extra || {});
    const sem = el => (el.tagName === 'TR' ? [...el.children].map(c => c.textContent).join(' | ') : el.textContent).replace(/\s+/g, ' ').trim();   // na tabela do PC, uma célula por vez
    for (const larg of [390, 1024]) {
      const n = larg + 'px: ';
      const m = memoria(FIX6()), A = await abrir({}, { storage: m, largura: larg }); await A.ir('orcamento');
      const pnG = [...A.$$('#main .pn')].find(p => /Gasto no mês/.test(p.textContent));
      const big = pnG.querySelector('.big').textContent.replace(/\s/g, ' ');
      t(n + 'gasto do mês soma tudo: com teto, sem teto, fora da lista e lazer (R$ 300)', /^R\$ 300(,00)?$/.test(big.trim()));
      t(n + 'planejado não muda (R$ 900 = 500 + 100 + lazer 300)', /de R\$\s?900 planejados/.test(pnG.textContent));
      t(n + '"Ainda posso gastar" desconta o gasto sem teto (R$ 600)', /Ainda posso gastar\s*R\$\s?600/.test(A.texto()));
      const linhas = A.$$('#main tr[data-cat],#main .orcl[data-cat]');
      t(n + 'linhas: as de teto primeiro, depois as sem teto na ordem da lista', linhas.map(e => e.dataset.cat).join() === 'Lazer,Mercado,Outros,Comida,Compras');
      const lc = c => linhas.find(e => e.dataset.cat === c);
      t(n + 'Comida sem teto: R$ 40, "sem teto", sem barra e sem situação', /R\$\s?40\b/.test(sem(lc('Comida'))) && /sem teto/.test(sem(lc('Comida'))) && !lc('Comida').querySelector('.bar') && !lc('Comida').querySelector('.tag'));
      t(n + 'Compras sem teto: R$ 120, "sem teto", sem barra e sem situação', /R\$\s?120\b/.test(sem(lc('Compras'))) && /sem teto/.test(sem(lc('Compras'))) && !lc('Compras').querySelector('.bar') && !lc('Compras').querySelector('.tag'));
      t(n + 'Outros com teto: soma o Viagem (R$ 70) e continua com barra e situação', /R\$\s?70\b/.test(sem(lc('Outros'))) && !!lc('Outros').querySelector('.bar') && !!lc('Outros').querySelector('.tag'));
      t(n + 'Mercado com teto: igual a antes, com barra e situação', /R\$\s?30\b/.test(sem(lc('Mercado'))) && !!lc('Mercado').querySelector('.bar') && !!lc('Mercado').querySelector('.tag') && !/sem teto/.test(sem(lc('Mercado'))));
      t(n + 'Jogos só de lazer não vira linha (está em Lazer, R$ 40)', !lc('Jogos') && /R\$\s?40\b/.test(sem(lc('Lazer'))));
      t(n + 'sem teto não ganha campo de teto', !A.$('#main input[data-k="Comida"]') && !A.$('#main input[data-k="Compras"]') && !!A.$('#main input[data-k="Mercado"]'));
      t(n + 'sem teto não gera aviso de teto', !/(Comida|Compras) (passou do teto|já usou)/.test(A.texto()));
      t(n + 'economia: categoria sem teto não vira sugestão de corte; a maior fatia é a maior linha com teto (Outros)', /Maior fatia: Outros/.test(A.texto()) && !/Maior fatia: (Compras|Comida)/.test(A.texto()));
      t(n + 'distribuição inclui as categorias sem teto', ['Comida', 'Compras'].every(c => [...A.$$('#main .legend span')].some(x => new RegExp('^' + c + ' \\d+%$').test(x.textContent.trim()))));
      A.click(lc('Compras')); await tick(10);
      t(n + 'tocar em Compras sem teto abre os lançamentos dela', /Lançamentos: Compras/.test(A.texto()) && /Item inventado 2/.test(A.texto()));
      t(n + 'sem erro', A.erros.length === 0);
    }
    {
      const A = await abrir({}, { storage: memoria(FIX6({ tf_priv: true })), largura: 390 }); await A.ir('orcamento');
      const c = A.$('#main .orcl[data-cat="Compras"]');
      t('olho fechado: o valor da linha sem teto fica escondido', !!c && /R\$ ••••/.test(c.textContent) && !/120/.test(c.textContent + c.getAttribute('aria-label')));
    }
    {
      /* teto zero continua sendo linha com teto (como antes); categoria com teto e sem gasto continua aparecendo */
      const A = await abrir({}, { storage: memoria(FIX6({ tf_tetos: { Mercado: 0, Transporte: 50 } })), largura: 390 }); await A.ir('orcamento');
      const ls = A.$$('#main .orcl[data-cat]').map(e => e.dataset.cat);
      t('teto zero: Mercado continua linha de teto, com barra', ls.includes('Mercado') && !!A.$('#main .orcl[data-cat="Mercado"] .bar') && !/sem teto/.test(A.$('#main .orcl[data-cat="Mercado"]').textContent));
      t('teto sem gasto: Transporte continua linha com R$ 0', ls.includes('Transporte') && /R\$\s?0 de R\$\s?50/.test(A.$('#main .orcl[data-cat="Transporte"]').textContent));
      t('sem teto para Outros: o Viagem aparece em Outros "sem teto"', /R\$\s?70 · sem teto/.test(A.$('#main .orcl[data-cat="Outros"]').textContent.replace(/\s/g, ' ')));
    }
    {
      /* sem lançamento no mês: nenhuma linha sem teto */
      const A = await abrir({}, { storage: memoria(FIX6({ tf_lanc3: [] })), largura: 390 }); await A.ir('orcamento');
      t('sem lançamentos: nenhuma linha "sem teto"', !/sem teto/.test(A.texto()));
    }
  }

  /* ===== A. Categoria "Lazer" sem a marca de lazer: linha sem teto com rótulo e chave próprios ===== */
  {
    const FIXA = () => ({ tf_modo: 'real', tf_real: clone(FICTICIO), tf_tetos: { Mercado: 500, Outros: 100 },
      tf_lanc3: [L(1, 'Mercado', 30), L(2, 'Compras', 120), L(3, 'Lazer', 55), L(4, 'Jogos', 25, { lazer: true }), L(5, 'Lazer', 10, { lazer: true })] });
    const ROT = 'Lazer, sem marca de lazer';
    const sem = el => (el.tagName === 'TR' ? [...el.children].map(c => c.textContent).join(' | ') : el.textContent).replace(/\s+/g, ' ').trim();
    const detalhe = A => { const p = [...A.$$('#main .pn')].find(x => /Lançamentos:/.test(x.textContent)); return p ? p.textContent.replace(/\s+/g, ' ') : ''; };
    for (const larg of [390, 1024]) {
      const n = 'A ' + larg + 'px: ';
      const A = await abrir({}, { storage: memoria(FIXA()), largura: larg }); await A.ir('orcamento');
      const ks = A.$$('#main tr[data-cat],#main .orcl[data-cat]').map(e => e.dataset.cat);
      t(n + 'linhas: Lazer fixa, as de teto, e a sem teto com rótulo próprio', ks.join('|') === 'Lazer|Mercado|Outros|' + ROT + '|Compras');
      t(n + 'nenhuma chave de linha repetida', new Set(ks).size === ks.length);
      const lin = k => A.$$('#main tr[data-cat],#main .orcl[data-cat]').find(e => e.dataset.cat === k);
      t(n + 'linha fixa de Lazer continua igual: só o marcado como lazer (R$ 35), com teto e situação', /R\$\s?35\b/.test(sem(lin('Lazer'))) && /R\$\s?300\b/.test(sem(lin('Lazer'))) && !!lin('Lazer').querySelector('.tag') && !/sem teto/.test(sem(lin('Lazer'))));
      t(n + 'linha sem teto: "' + ROT + '", R$ 55, sem barra e sem situação', /R\$\s?55\b/.test(sem(lin(ROT))) && /sem teto/.test(sem(lin(ROT))) && !lin(ROT).querySelector('.bar') && !lin(ROT).querySelector('.tag'));
      A.click(lin(ROT)); await tick(10);
      const d1 = detalhe(A);
      t(n + 'tocar na sem teto: lista só o lançamento Lazer sem marca (R$ 55)', /Lançamentos: Lazer, sem marca de lazer/.test(d1) && /Item inventado 3/.test(d1) && !/Item inventado 4|Item inventado 5/.test(d1) && /Total: R\$\s?55,00/.test(d1));
      t(n + 'tocar na sem teto: só ela fica aberta', A.$$('#main tr.sel,#main .orcl.sel').map(e => e.dataset.cat).join('|') === ROT);
      A.click(lin('Lazer')); await tick(10);
      const d2 = detalhe(A);
      t(n + 'tocar na fixa de Lazer: lista só os marcados como lazer (R$ 35)', /Item inventado 4/.test(d2) && /Item inventado 5/.test(d2) && !/Item inventado 3/.test(d2) && /Total: R\$\s?35,00/.test(d2));
      t(n + 'tocar na fixa de Lazer: só ela fica aberta', A.$$('#main tr.sel,#main .orcl.sel').map(e => e.dataset.cat).join('|') === 'Lazer');
      t(n + 'gasto do mês soma tudo (R$ 240)', /^R\$ 240(,00)?$/.test([...A.$$('#main .pn')].find(p => /Gasto no mês/.test(p.textContent)).querySelector('.big').textContent.replace(/\s/g, ' ').trim()));
      t(n + 'lazerGasto() continua 35', A.w.eval('lazerGasto()') === 35);
      await A.ir('lancar');
      t(n + 'Lançar: resumo do lazer igual (R$ 35,00 de R$ 300)', /Lazer: R\$\s?35,00 de R\$\s?300/.test(A.$('#lz_resumo').textContent.replace(/\s/g, ' ')));
      t(n + 'sem erro', A.erros.length === 0);
    }
  }

  /* ===== B. economiaHtml com linhas sem teto (teto 0) ===== */
  {
    const A = await abrir({}, { storage: memoria({ tf_modo: 'real', tf_real: clone(FICTICIO), tf_tetos: { Mercado: 500 } }) });
    const eco = (rows, tG) => A.w.eval('economiaHtml(' + JSON.stringify(rows) + ',' + tG + ')').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const so = eco([{ nome: 'Compras', cat: 'Compras', teto: 0, gasto: 100, semTeto: true }], 100);
    t('B: só sem teto: nenhuma sugestão de corte, nenhum aviso de teto', !/Maior fatia|Cortar|passou|já usou/.test(so) && /Nenhuma categoria perto do teto/.test(so));
    t('B: só sem teto: sem divisão por zero', !/NaN|Infinity/.test(so));
    const mix = eco([{ nome: 'Lazer', teto: 300, gasto: 40, fixo: true }, { nome: 'Mercado', teto: 50, gasto: 60 }, { nome: 'Compras', cat: 'Compras', teto: 0, gasto: 900, semTeto: true }], 1000);
    t('B: misto: a maior fatia é a maior linha com teto (Mercado), não a sem teto maior', /Maior fatia: Mercado/.test(mix) && !/Compras/.test(mix));
    t('B: misto: aviso de teto só para quem tem teto (Mercado passou)', /Mercado já usou 120% do teto/.test(mix) && !/NaN|Infinity/.test(mix));
    const zero = eco([{ nome: 'Mercado', teto: 0, gasto: 60 }], 60);
    t('B: teto zero (linha com teto) continua como antes: pode ser a maior fatia', /Maior fatia: Mercado/.test(zero) && !/NaN|Infinity/.test(zero));
    t('B: sem erro', A.erros.length === 0);
  }

  /* ===== 7. Real simples ===== */
  {
    const m = memoria(), A0 = await abrir({}, { storage: m });
    A0.set('#ini_renda', '5000'); A0.set('#ini_fixos', '3000'); A0.set('#ini_saldo', '1500'); A0.click('#ini_ok'); await tick(10);
    const A = await abrir({}, { storage: m });
    await A.ir('lancar');
    t('real simples: chips na ordem', chips(A) === ORDEM);
    await A.ir('orcamento');
    t('real simples: os tetos do primeiro uso continuam os mesmos cinco (sem Compras)', A.$$('#main input[data-cat]').map(i => i.dataset.cat).join() === 'Mercado,Transporte,Estudos,Saúde,Outros');
    t('real simples: sem erro', A.erros.length === 0);
  }

  /* ===== 8. Drive: chega Compras e uma categoria mais nova de outro aparelho ===== */
  {
    const outro = { lanc: [L(1, 'Compras', 40), L(2, 'Viagem', 60), L(3, 'Jogos', 15, { lazer: true })], pagos: {}, tetos: {}, metas: [], taxa: 0.8, real: clone(FICTICIO) };
    const doc = TFSync.doc(TFSync.atualizar(outro, {}, Date.now() - 86400000));
    const m = memoria({ tf_modo: 'real', tf_real: clone(FICTICIO) }), D = driveFalso(doc); conecta(m);
    const A = await abrir({}, { storage: m, fetch: D.fetch }); await sincroniza(A);
    t('Drive → aparelho: Compras e Viagem chegam como vieram', catDe(m, 1) === 'Compras' && catDe(m, 2) === 'Viagem' && catDe(m, 3) === 'Jogos');
    await sincroniza(A); await sincroniza(A);
    const it = D.itens();
    t('aparelho → Drive: depois de sincronizar de novo, o Drive continua com Compras e Viagem', it['lanc:1'].v.cat === 'Compras' && it['lanc:2'].v.cat === 'Viagem');
    t('aparelho → Drive: os itens desses lançamentos não ganharam hora nova', it['lanc:1'].u === doc.itens['lanc:1'].u && it['lanc:2'].u === doc.itens['lanc:2'].u);
    t('Drive: nenhuma gravação levou Viagem para Outros', D.escritas.every(b => { const i = JSON.parse(b).itens; return !i['lanc:2'] || i['lanc:2'].v.cat === 'Viagem'; }));
    t('Drive: sem erro', A.erros.length === 0);
  }
  {
    /* conjunto antigo de categorias: chega e não é regravado */
    const velho = { lanc: [L(1, 'Mercado', 40), L(2, 'Saúde', 60)], pagos: {}, tetos: { Mercado: 300 }, metas: [], taxa: 0.8, real: clone(FICTICIO) };
    const doc = TFSync.doc(TFSync.atualizar(velho, {}, Date.now() - 86400000));
    const m = memoria({ tf_modo: 'real', tf_real: clone(FICTICIO), tf_tetos: { Mercado: 300 } }), D = driveFalso(doc); conecta(m);
    const A = await abrir({}, { storage: m, fetch: D.fetch }); await sincroniza(A); await sincroniza(A);
    const it = D.itens();
    t('dados de versão antiga: chegam iguais e o Drive não ganha hora nova neles', catDe(m, 1) === 'Mercado' && catDe(m, 2) === 'Saúde' && it['lanc:1'].u === doc.itens['lanc:1'].u && it['lanc:2'].u === doc.itens['lanc:2'].u);
  }

  process.exit(fim());
})();
