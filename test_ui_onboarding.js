/* Primeiro uso, telas vazias, exemplo separado, instalação e isolamento entre pessoas. Só valores inventados. */
const { abrir, tick, contador } = require('./test_base.js');
const { t, fim } = contador('primeiro uso');

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';
const AND = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36';

/* localStorage comum a duas aberturas, para simular recarregar a página */
const memoria = () => { const o = {}; return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: k => { delete o[k]; }, key: i => Object.keys(o)[i], get length() { return Object.keys(o).length; }, _o: o }; };
const reabre = (m, opts) => abrir({}, { storage: m, ...(opts || {}) });
const preencher = async (A, r, f, s) => { A.set('#ini_renda', r); A.set('#ini_fixos', f); A.set('#ini_saldo', s); A.click('#ini_ok'); await tick(10); };

(async () => {
  /* ===== 33. Três campos ===== */
  {
    const m = memoria(), A = await reabre(m);
    t('33: a primeira tela pede renda, gastos fixos e saldo', !!A.$('#ini_renda') && !!A.$('#ini_fixos') && !!A.$('#ini_saldo') && !!A.$('#ini_ok'));
    t('33: os três campos têm rótulo ligado', ['renda', 'fixos', 'saldo'].every(k => !!A.$('label[for="ini_' + k + '"]')));
    t('33: os três campos não têm Pular', !/Pular/.test(A.texto()));
    t('33: a importação de arquivo fica nas opções avançadas, fechada', !!A.$('#imp_f') && !!A.$('#imp_f').closest('details') && !A.$('#imp_f').closest('details').open);
    t('33: existe Ver exemplo', A.$('#imp_demo').textContent === 'Ver exemplo');
    t('33: o campo de arquivo não passa da largura do painel', /#imp_f\{[^}]*max-width:100%/.test(A.d.documentElement.innerHTML));
    await preencher(A, '', '100', '100');
    t('33: campo vazio mostra o motivo e não entra', /Informe a renda/.test(A.texto()) && A.$('#ini_renda').getAttribute('aria-invalid') === 'true' && m.getItem('tf_modo') === null);
    await preencher(A, '5000', '3000', '1500');
    t('33: valores aproximados entram em modo real', JSON.parse(m.getItem('tf_modo')) === 'real');
    const B = await reabre(m, { fetch: () => Promise.reject(new Error('sem rede')) });
    t('33: depois de salvar mostra quanto gastar por dia', /Para gastar por dia/.test(B.texto()) && /~R\$/.test(B.$('main .big').textContent));
    t('33: o saldo informado aparece com centavos', /R\$\s*1\.500,00/.test(B.texto()));
    B.set('#hq_txt', '45 mercado pix'); B.click('#hq_ok'); await tick(20);
    t('33: o lançamento rápido funciona na hora', B.w.eval('atual') === 'lancar' && B.$('#f_valor').value === '45' && B.$('#f_forma').value === 'Pix');
    B.click('#f_ok'); await tick(10);
    t('33: salvar o gasto desconta do valor por dia', B.w.eval('S.gastosMes(mesAtual).length') === 1);
    await B.ir('hoje');
    const esperado = B.w.eval('TFStore.porDia(5000,3000,45,diaHoje,diasMes).porDia');
    t('33: a tela usa a conta certa', B.$('main .big').textContent.replace(/\s/g, '').includes(String(Math.floor(esperado)).replace(/\B(?=(\d{3})+$)/g, '.')));
    await B.ir('numeros');
    B.set('#n_renda', '6000'); B.click('#n_ok'); await tick(10);
    t('33: dá para corrigir os três números depois', B.w.eval('S.st.real._inicio.renda') === 6000 && /Salvo/.test(B.texto()));
    t('33: sem erros de script', A.erros.length === 0 && B.erros.length === 0);
  }

  /* ===== 34. Cada tela vazia diz o que ganha e tem Pular ===== */
  {
    const m = memoria(), A = await reabre(m);
    await preencher(A, '5000', '3000', '1500');
    const B = await reabre(m);
    for (const k of ['cartao', 'agenda', 'orcamento', 'futuro', 'saude']) {
      await B.ir(k);
      t('34 ' + k + ': diz o que ganha ao preencher', /O que você ganha/.test(B.texto()));
      t('34 ' + k + ': tem Pular', B.$('#vz_pular').textContent === 'Pular');
      B.click('#vz_pular'); await tick(10);
      t('34 ' + k + ': Pular volta para Hoje', B.w.eval('atual') === 'hoje');
    }
    await B.ir('metas');
    t('34 metas: diz o que ganha e tem Pular', /quanto guardar por mês/.test(B.texto()) && !!B.$('#m_pular'));
    await B.ir('cartao');
    B.set('#vz_lim', '2000'); B.set('#vz_fat', '300'); B.set('#vz_fec', '5'); B.set('#vz_ven', '12'); B.click('#vz_ok'); await tick(20);
    t('34: o cartão preenchido abre a tela normal', !B.$('#vz_pular') && B.w.eval('DEMO.cartoes[0].limite') === 2000 && !!B.$('#cart'));
    await B.ir('hoje');
    t('34: cartão abaixo de 30% não gera alerta', !B.$('.alertas'));
    B.w.eval("S.atualizarCartao({limite:'1000',fatura:'700',fechamento:'5',vencimento:'12'})"); await B.ir('hoje');
    t('34: uso do limite em risco aparece na tela Hoje do primeiro uso', /70% do limite do cartão/.test((B.$('.alertas') || { textContent: '' }).textContent) && !B.$('.alertas').closest('details'));
    B.w.eval("S.atualizarCartao({limite:'2000',fatura:'300',fechamento:'5',vencimento:'12'})");
    await B.ir('agenda');
    B.set('#vz_nome', 'Internet'); B.set('#vz_val', '99.90'); B.set('#vz_dia', '10'); B.click('#vz_ok'); await tick(20);
    t('34: a conta cadastrada aparece na Agenda', /Internet/.test(B.texto()) && !B.$('#vz_pular'));
    await B.ir('orcamento');
    B.click('#vz_ok'); await tick(10);
    t('34: Orçamento sem nenhum teto explica e não salva', /ao menos um teto/.test(B.texto()));
    B.set('input[data-cat="Mercado"]', '800'); B.click('#vz_ok'); await tick(20);
    t('34: um teto basta para abrir o Orçamento', !B.$('#vz_pular') && B.w.eval('S.st.tetos.Mercado') === 800);
    await B.ir('futuro');
    t('34: Futuro mostra a previsão simples com ~', /~R\$/.test(B.texto()) && !!B.$('svg[data-ch]') && /Não é promessa/.test(B.texto()));
    t('34: a previsão simples soma a sobra de cada mês ao saldo', B.w.eval("DEMO.cenarios['Base'][6]") === 1500 - 99.9 + 6 * (5000 - 3000) - 800 * 0);
    await B.ir('hoje');
    B.click('#pp_pular'); await tick(10);
    t('34: Pular também tira os próximos passos da tela Hoje', !/Quando quiser/.test(B.texto()));
    for (const k of ['hoje', 'lancar', 'cartao', 'agenda', 'orcamento', 'metas', 'futuro', 'decidir', 'saude', 'numeros']) { await B.ir(k); await tick(5); t('34 ' + k + ': sem NaN, undefined ou Infinity', !/NaN|undefined|Infinity|\[object/.test(B.texto())); }
    t('34: sem erros de script', B.erros.length === 0);
  }

  /* ===== 35. Exemplo separado ===== */
  {
    const m = memoria(), A = await reabre(m);
    await preencher(A, '5000', '3000', '1500');
    const R1 = await reabre(m);
    R1.w.eval("S.lancar({tipo:'gasto',valor:'30',desc:'Compra real',cat:'Mercado',data:S.hojeISO(),essencial:true,lazer:false})"); await tick(10);
    t('35: em modo real não há selo de exemplo', !R1.$('#selo'));
    R1.click('#ver_ex'); await tick(10);
    const D1 = await reabre(m);
    t('35: Ver exemplo abre com o selo visível', !!D1.$('#selo') && /Exemplo/.test(D1.$('#selo').textContent) && !!D1.$('#selo').getAttribute('aria-label'));
    await D1.ir('lancar');
    t('35: o exemplo não mostra dados reais', !/Compra real/.test(D1.texto()));
    D1.w.eval("S.lancar({tipo:'gasto',valor:'77',desc:'Compra de exemplo',cat:'Lazer',data:S.hojeISO(),essencial:false,lazer:true})"); await tick(10);
    D1.click('#selo'); await tick(10);
    const R2 = await reabre(m);
    await R2.ir('lancar');
    t('35: voltar ao real traz só o que é real', /Compra real/.test(R2.texto()) && !/Compra de exemplo/.test(R2.texto()) && !R2.$('#selo'));
    t('35: o dinheiro do modo real não mudou', R2.w.eval('S.st.lanc.length') === 1 && R2.w.eval('S.st.real._inicio.saldo') === 1500);
    R2.click('#ver_ex'); await tick(10);
    const D2 = await reabre(m);
    await D2.ir('lancar');
    t('35: o exemplo mantém o que era dele e continua sem o real', /Compra de exemplo/.test(D2.texto()) && !/Compra real/.test(D2.texto()));
    t('35: exemplo não sincroniza', /não sincroniza/.test(D2.$('#sync').getAttribute('aria-label')));
    const N = memoria(), V = await reabre(N);
    V.click('#imp_demo'); await tick(10);
    const X = await reabre(N);
    X.click('#selo'); await tick(10);
    const Y = await reabre(N);
    t('35: sair do exemplo sem dados volta para os três campos', !!Y.$('#ini_renda'));
    t('35: sem erros de script', [R1, D1, R2, D2, X, Y].every(a => a.erros.length === 0));
    const Z = memoria(); Z.setItem('tf_real', JSON.stringify({ _inicio: 1 }));
    const W = await reabre(Z);
    t('35: se já há dados, a tela inicial oferece voltar e não mostra os três campos', !!W.$('#ini_voltar') && !W.$('#ini_renda'));
  }

  /* ===== 36. Instalação ===== */
  {
    const entra = async ua => { const m = memoria(), A = await reabre(m); await preencher(A, '5000', '3000', '1500'); return { m, B: await reabre(m, { userAgent: ua }) }; };
    const i = await entra(IOS);
    t('36: no iPhone explica Compartilhar, Tela de Início e abrir pelo ícone', /Compartilhar/.test(i.B.texto()) && /Tela de Início/.test(i.B.texto()) && /pelo ícone/.test(i.B.texto()));
    t('36: sugere o Drive em uma frase simples', /é o backup dos seus dados/.test(i.B.texto()));
    i.B.click('#inst_ok'); await tick(10);
    t('36: fecha e não volta', !/Instalar no celular/.test(i.B.$('main').textContent));
    const de = await reabre(i.m, { userAgent: IOS });
    t('36: mostra uma vez só', !/Compartilhar/.test(de.texto()));
    de.click('#inst_ab'); await tick(10);
    t('36: continua acessível pelo menu', /Compartilhar/.test(de.texto()) && de.w.eval('atual') === 'instalar');
    const a = await entra(AND);
    t('36: no Android explica Instalar app', /Instalar app/.test(a.B.texto()) && !/Compartilhar/.test(a.B.texto()));
    const c = await entra('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0');
    t('36: no computador não aparece sozinho', !/Instalar no celular/.test(c.B.$('main').textContent));
    t('36: sem erros de script', i.B.erros.length === 0 && a.B.erros.length === 0 && de.erros.length === 0);
  }

  /* ===== 37. Duas pessoas, dois aparelhos: nada passa de uma para a outra ===== */
  {
    const resp = (o) => Promise.resolve({ ok: true, status: 200, json: async () => o, text: async () => (typeof o === 'string' ? o : JSON.stringify(o)) });
    const contas = {}, chamadas = [];
    /* Drive de mentira: cada token é uma conta Google com seus próprios arquivos */
    const fakeFetch = (url, opt = {}) => {
      url = String(url);
      const tk = ((opt.headers || {}).Authorization || '').replace('Bearer ', ''); chamadas.push(tk);
      const arq = (contas[tk] = contas[tk] || { files: {} });
      if (url.includes('/upload/drive/v3/files/')) { const id = url.split('/files/')[1].split('?')[0]; if (!arq.files[id]) return Promise.resolve({ ok: false, status: 404, json: async () => ({}), text: async () => '' }); arq.files[id].body = opt.body; return resp({ id }); }
      if (url.includes('alt=media')) { const id = url.split('/files/')[1].split('?')[0]; if (!arq.files[id]) return Promise.resolve({ ok: false, status: 404, json: async () => ({}), text: async () => '' }); return resp(arq.files[id].body || ''); }
      if (opt.method === 'POST') { const b = JSON.parse(opt.body), id = tk + '_f' + Object.keys(arq.files).length; arq.files[id] = { name: b.name, body: '' }; return resp({ id }); }
      const nome = (decodeURIComponent(url.split('q=')[1] || '').match(/name='([^']+)'/) || [])[1];
      return resp({ files: Object.entries(arq.files).filter(([, f]) => f.name === nome).map(([i, f]) => ({ id: i, name: f.name })) });
    };
    const pessoa = async (nome, renda) => {
      const m = memoria(), A = await reabre(m, { fetch: fakeFetch }); await preencher(A, renda, '1000', '500');
      m.setItem('tf_gtoken', JSON.stringify({ v: nome, exp: Date.now() + 3600000 })); m.setItem('tf_gjaconectou', 'true');
      const B = await reabre(m, { fetch: fakeFetch });
      B.w.eval("S.lancar({tipo:'gasto',valor:'10',desc:'Gasto de " + nome + "',cat:'Outros',data:S.hojeISO(),essencial:false,lazer:false})"); await tick(10);
      await B.w.eval('sincronizar()'); await tick(10);
      return { m, B };
    };
    const ana = await pessoa('ana', '4000'), bia = await pessoa('bia', '7000');
    const dados = n => JSON.stringify(Object.values(contas[n].files).filter(f => f.name === 'dados.json').map(f => f.body));
    t('37: cada pessoa tem o próprio arquivo no próprio Drive', /Gasto de ana/.test(dados('ana')) && /Gasto de bia/.test(dados('bia')));
    t('37: o arquivo de uma pessoa não tem nada da outra', !/Gasto de bia/.test(dados('ana')) && !/Gasto de ana/.test(dados('bia')));
    t('37: cada aparelho só chamou o Drive com o token dele', new Set(chamadas).size === 2 && [...new Set(chamadas)].sort().join() === 'ana,bia');
    await ana.B.ir('lancar'); await bia.B.ir('lancar');
    t('37: os aparelhos não enxergam os dados um do outro', !/Gasto de bia/.test(ana.B.texto()) && !/Gasto de ana/.test(bia.B.texto()));
    t('37: armazenamentos separados', !/Gasto de bia/.test(JSON.stringify(ana.m._o)) && !/Gasto de ana/.test(JSON.stringify(bia.m._o)));
    const novo = memoria(); novo.setItem('tf_gtoken', JSON.stringify({ v: 'bia', exp: Date.now() + 3600000 })); novo.setItem('tf_gjaconectou', 'true');
    const C = await reabre(novo, { fetch: fakeFetch }); await C.w.eval('sincronizar()'); await tick(20);
    t('37: aparelho novo de uma pessoa recebe só os dados dela', JSON.parse(novo.getItem('tf_real'))._inicio.renda === 7000 && /Gasto de bia/.test(novo.getItem('tf_lanc3')) && !/Gasto de ana/.test(novo.getItem('tf_lanc3')));
  }
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
