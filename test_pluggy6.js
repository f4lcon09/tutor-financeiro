/* pluggy-6: números do banco com origem e idade, reserva digitada, ligação dos cartões, fatura estimada e mapeamento de categorias.
   Só valores inventados. Parte pura em node e parte de tela no jsdom (test_base.js). */
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const B = require('./banco.js'), Real = require('./real.js'), Store = require('./store.js'), Seg = require('./seguranca.js'), TFSync = require('./sync.js');
const { t, fim } = contador('pluggy-6');

const AG = Date.UTC(2026, 10, 9, 12);   // relógio fixo da parte pura
const hAtras = n => new Date(AG - n * 36e5).toISOString();
const clone = o => JSON.parse(JSON.stringify(o));
const memoria = ini => { const o = {}; Object.keys(ini || {}).forEach(k => { o[k] = JSON.stringify(ini[k]); }); return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: k => { delete o[k]; }, key: i => Object.keys(o)[i], get length() { return Object.keys(o).length; }, _o: o }; };
const ctxB = (banco, extra) => Object.assign({ banco, agora: AG, idadeMs: B.idadeMs, hojeISO: '2026-11-09' }, extra || {});
const REAL = () => { const r = clone(FICTICIO); r._meta.as_of = '2026-11-01'; return r; };

/* resposta inventada da ponte v4 */
const RESP = () => ({ ok: true, dados: { de: '2026-10-05', ate: '2026-11-09',
  contas: [
    { id: 'ccA', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'Banco Alfa', saldo: 1200.5, item: 'it1', atualizado: hAtras(5), banco: { closingBalance: 1200.5 } },
    { id: 'ccB', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'Banco Beta', saldo: 300, item: 'it2' },
    { id: 'crA', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartão Alfa', saldo: 900, item: 'it1', atualizado: hAtras(5), credito: { creditLimit: 4000, availableCreditLimit: 3100, balanceDueDate: '2026-11-01', minimumPayment: 0 } }],
  investimentos: [
    { nome: 'CDB 1', saldo: 0, status: 'TOTAL_WITHDRAWAL', item: 'it1' }, { nome: 'CDB 2', saldo: 50, status: 'TOTAL_WITHDRAWAL', item: 'it1' },
    { nome: 'CDB 3', saldo: 0, status: 'ACTIVE', item: 'it1' }, { nome: 'Reserva inventada', saldo: 5000, status: 'ACTIVE', item: 'it1' }, { nome: 'Sem status', saldo: 10, item: 'it2' }],
  itens: [{ item: 'it1', atualizado: hAtras(5) }, { item: 'it2', atualizado: hAtras(60) }],
  movs: [
    { id: 'm1', conta: 'crA', data: '2026-11-08', desc: 'Compra inventada', valor: 100, tipo: 'DEBIT', status: 'POSTED', cat: 'Shopping' },
    { id: 'm2', conta: 'crA', data: '2026-11-06', desc: 'Parcela inventada 2/5', valor: 40, tipo: 'DEBIT', status: 'POSTED', cat: 'Electronics', parc: { n: 2, de: 5 } },
    { id: 'm3', conta: 'crA', data: '2026-11-05', desc: 'No dia do fechamento', valor: 70, tipo: 'DEBIT', status: 'POSTED', cat: 'Groceries' },
    { id: 'm4', conta: 'crA', data: '2026-11-07', desc: 'Estorno inventado', valor: 15, tipo: 'CREDIT', status: 'POSTED', cat: 'Shopping' },
    { id: 'm5', conta: 'crA', data: '2026-11-03', desc: 'Pagamento da fatura', valor: 800, tipo: 'CREDIT', status: 'POSTED', cat: 'Credit card payment' },
    { id: 'm6', conta: 'crA', data: '2026-11-09', desc: 'Pendente inventado', valor: 20, tipo: 'DEBIT', status: 'PENDING', cat: 'Eating out' },
    { id: 'm7', conta: 'ccA', data: '2026-11-04', desc: 'Pix inventado', valor: 60, tipo: 'DEBIT', status: 'POSTED', cat: 'Same person transfer' }] } });

(async () => {
  /* ===== 1. Mapeamento de categorias: cada linha da tabela e o caso sem par ===== */
  const LINHAS = { Mercado: ['Groceries'], Comida: ['Eating out', 'Food delivery'], Transporte: ['Taxi and ride-hailing', 'Public transportation', 'Bus tickets'],
    Estudos: ['Education', 'University', 'Bookstore'], 'Saúde': ['Pharmacy', 'Hospital clinics and labs'], Lazer: ['Music streaming', 'Video streaming', 'Tickets'],
    Compras: ['Shopping', 'Online shopping', 'Electronics'], Outros: ['Transfers', 'Services', 'Digital services', 'Tax on financial operations', 'Internet', 'Telecommunications', 'Cashback'] };
  Object.keys(LINHAS).forEach(app => LINHAS[app].forEach(b => { const r = B.catDoBanco(b); t('mapeia "' + b + '" para ' + app, r.cat === app && r.neutro === false); }));
  ['Transfer - Internal', 'Same person transfer', 'Credit card payment'].forEach(b => { const r = B.catDoBanco(b); t('"' + b + '" vira Outros e não é gasto', r.cat === 'Outros' && r.neutro === true); });
  t('sem par: vira Outros, não marca', B.catDoBanco('Pets').cat === 'Outros' && !B.catDoBanco('Pets').neutro && B.catDoBanco(null).cat === 'Outros' && B.catDoBanco('').cat === 'Outros');
  t('mapeamento ignora maiúsculas e espaços nas pontas', B.catDoBanco('  groceries ').cat === 'Mercado');
  t('toda categoria do mapa existe no app', Object.keys(B.CAT_BANCO).every(c => Store.CATEGORIAS.includes(c)));

  /* mapeamento na importação: a categoria do app entra, a do banco nunca */
  {
    const v = B.validarResposta(RESP()); t('validarResposta passa a cat (só para o mapeamento)', v.ok && v.dados.movs[0].cat === 'Shopping');
    const lista = B.montarPrevia(v.dados, [], [], [], new Map());
    const m = id => lista.find(x => x.idExterno === id);
    t('prévia: Shopping vira Compras, Groceries vira Mercado, Eating out vira Comida', m('m1').cat === 'Compras' && m('m3').cat === 'Mercado' && m('m6').cat === 'Comida');
    t('prévia: Same person transfer é "não é gasto" e não vem marcado', m('m7').neutro === true && m('m7').marca === 'categoria' && m('m7').marcado === false);
    t('prévia: PENDING segue marcado como pendente (sem mudança)', m('m6').pendente === true && m('m6').marcado === true);
    const s = Store.criarStore(memoria({ tf_modo: 'real' }), () => new Date(2026, 10, 9));
    const r = s.importarBanco(lista.filter(x => ['m1', 'm7', 'm6'].includes(x.idExterno)).map(x => Object.assign({}, x, { marcado: true })));
    const l = id => s.st.lanc.find(x => x.idExterno === id);
    t('importar: categoria do app gravada', r.ok && l('m1').cat === 'Compras' && l('m6').cat === 'Comida' && l('m7').cat === 'Outros' && l('m7').neutro === true);
    t('importar: a categoria do banco não é gravada', !JSON.stringify(s.st.lanc).includes('Shopping') && !JSON.stringify(s.st.lanc).includes('Same person') && s.st.lanc.every(x => !('catBanco' in x) && !('neutroCat' in x)));
    t('importar: categoria fora do app vira Outros', s.importarBanco([{ data: '2026-11-08', valor: 5, idExterno: 'mz', forma: 'Pix', direcao: 'saida', cat: 'Shopping' }]).ok && s.st.lanc.find(x => x.idExterno === 'mz').cat === 'Outros');
    const s2 = Store.criarStore(memoria({ tf_modo: 'real', tf_lanc3: [{ id: 1, data: '2026-11-08', desc: 'Antigo', cat: 'Outros', valor: 100, forma: 'Crédito', essencial: false, lazer: false }] }));
    const lv = B.montarPrevia(v.dados, s2.st.lanc, [], [], new Map());
    s2.vincularBanco(lv.filter(x => x.vinculo === 'sim').map(x => ({ alvo: x.alvo, contaId: x.contaId, contaNome: 'Cartão', idExterno: x.idExterno })));
    t('lançamento que já existia não é recategorizado', s2.st.lanc[0].cat === 'Outros');
  }

  /* ===== 2. Foto do banco (instantaneo) ===== */
  {
    const r = B.instantaneo(RESP(), AG, []), sn = r.snap;
    t('foto: ok, com contas BANK e CREDIT', r.ok && sn.contas.length === 3 && sn.em === AG && sn.ip === true);
    t('foto: cartão com limite e disponível', sn.contas[2].lim === 4000 && sn.contas[2].disp === 3100 && !('vence' in sn.contas[2]) && !('minimo' in sn.contas[2]));
    t('foto: idade da conta, ou do item quando a conta não tem', sn.contas[0].atu === hAtras(5) && sn.contas[1].atu === hAtras(60));
    t('foto: TOTAL_WITHDRAWAL e saldo zero ficam fora da reserva', sn.inv.map(v => v.nome).join() === 'Reserva inventada,Sem status');
    t('foto: só movimentos de cartão, sem descrição e sem id; pagamento da fatura fora', JSON.stringify(sn.movs) === JSON.stringify({ crA: [['2026-11-08', 100], ['2026-11-06', 40], ['2026-11-05', 70], ['2026-11-07', -15], ['2026-11-09', 20]] }));
    t('foto: nada de descrição, item ou id de movimento', !/inventad|Pagamento|it1|m1/.test(JSON.stringify(sn.movs)) && !JSON.stringify(sn).includes('it1'));
    const inv = B.instantaneo(RESP(), AG, ['crA']).snap;
    t('foto: sinal invertido pelo dono vale para o cartão', inv.movs.crA[0][1] === -100);
    t('foto: resposta de erro não vira foto', !B.instantaneo({ ok: false, erro: 'expirada' }, AG).ok && !B.instantaneo(null, AG).ok && !B.instantaneo({ ok: true, dados: { contas: [] } }, AG).ok);
    const sem = clone(RESP()); delete sem.dados.investimentos; delete sem.dados.itens; delete sem.dados.contas[2].credito; delete sem.dados.contas[0].atualizado;
    const r2 = B.instantaneo(sem, AG);
    t('chaves faltando: sem investimentos, sem crédito, sem idade', r2.ok && r2.snap.ip === false && r2.snap.inv.length === 0 && r2.snap.contas[2].lim === null && r2.snap.contas[2].disp === null && r2.snap.contas[0].atu === null);
    const lixo = clone(RESP()); lixo.dados.contas.push({ id: 'x y', tipo: 'BANK', nome: 'ruim', saldo: 1 }, { id: 'ok2', tipo: 'OUTRO', nome: 'x', saldo: 1 }, { id: 'ok3', tipo: 'BANK', nome: 'x', saldo: '10' });
    t('contas malformadas ficam fora', B.instantaneo(lixo, AG).snap.contas.length === 3);
  }

  /* ===== 3. Saneador e sincronização dos itens novos ===== */
  {
    const sn = B.instantaneo(RESP(), AG).snap;
    t('sanBanco aceita a foto como veio', JSON.stringify(Seg.sanBanco(sn)) === JSON.stringify(sn));
    t('sanBanco recusa sem contas, sem hora ou não objeto', Seg.sanBanco({ em: 1, contas: [] }) === null && Seg.sanBanco({ contas: sn.contas }) === null && Seg.sanBanco('x') === null);
    const ruim = clone(sn); ruim.contas[0].id = '__proto__'; ruim.inv.push({ nome: 'neg', saldo: -5 }); ruim.movs.ccA = [['2026-11-01', 1]]; ruim.movs.crA.push(['ontem', 1]);
    const s = Seg.sanBanco(ruim);
    t('sanBanco: id perigoso, investimento negativo, movimento de conta não cartão e data ruim ficam fora', s.contas.length === 2 && s.inv.length === 2 && !('ccA' in s.movs) && s.movs.crA.length === 5);
    t('sanReserva', Seg.sanReserva({ id: 7, nome: ' Cofrinho ', valor: 10, data: '2026-11-01' }).nome === 'Cofrinho' && Seg.sanReserva({ id: 7, nome: '', valor: 10, data: '2026-11-01' }) === null && Seg.sanReserva({ id: 7, nome: 'a', valor: -1, data: '2026-11-01' }) === null);
    t('sanLiga', JSON.stringify(Seg.sanLiga({ crA: 'c1', crB: 'nao', '__proto__': 'c1', crC: '<b>' })) === JSON.stringify({ crA: 'c1', crB: 'nao' }));
    const est = { lanc: [], pagos: {}, tetos: {}, metas: [], taxa: 0.8, banco: sn, reserva: [{ id: 7, nome: 'Cofrinho', valor: 250, data: '2026-11-07' }], liga: { crA: 'c1' } };
    const itens = TFSync.atualizar(est, {}, 1000);
    t('sync: itens banco, res:7 e liga', !!itens.banco && !!itens['res:7'] && !!itens.liga);
    const limpo = Seg.limparItens(itens);
    t('limparItens aceita os itens novos', limpo.descartados === 0 && !!limpo.itens.banco && !!limpo.itens['res:7'] && !!limpo.itens.liga);
    t('limparItens: chave da reserva tem de bater com o id', Seg.limparItens({ 'res:8': { u: 1, d: false, v: { id: 7, nome: 'a', valor: 1, data: '2026-11-01' } } }).descartados === 1);
    const s2 = Store.criarStore(memoria());   // sem modo: o paraSync não manda real: null (comportamento antigo, fora desta tarefa)
    s2.aplicar(TFSync.montar(limpo.itens));
    t('ida e volta: foto, reserva e ligação iguais, sem hora nova', TFSync.igual(TFSync.atualizar(s2.paraSync(), itens, 2000), itens) && s2.st.reserva[0].valor === 250 && s2.st.liga.crA === 'c1');
    const lap = TFSync.atualizar(Object.assign({}, est, { reserva: [] }), itens, 3000);
    t('apagar uma reserva vira lápide no Drive', lap['res:7'].d === true);
    t('modo exemplo não manda nada do banco', (() => { const d = Store.criarStore(memoria({ tf_modo: 'demo' })); d.st.banco = sn; d.st.reserva = [{ id: 1 }]; const p = d.paraSync(); return p.banco === undefined && p.reserva.length === 0 && p.liga === undefined; })());
  }

  /* ===== 4. Reserva digitada no store ===== */
  {
    const s = Store.criarStore(memoria({ tf_modo: 'real' }), () => new Date(2026, 10, 9));
    const a = s.addReserva({ nome: ' Cofrinho inventado ', valor: '250,50' });
    t('adicionar: guarda nome, valor e a data de hoje', a.ok && s.st.reserva[0].nome === 'Cofrinho inventado' && s.st.reserva[0].valor === 250.5 && s.st.reserva[0].data === '2026-11-09');
    t('adicionar: recusa sem nome e valor ruim', s.addReserva({ nome: '', valor: '1' }).erros.nome && s.addReserva({ nome: 'x', valor: 'abc' }).erros.valor && s.addReserva({ nome: 'x', valor: '-1' }).erros.valor);
    t('adicionar: zero vale', s.addReserva({ nome: 'Zero', valor: '0' }).ok);
    const s3 = Store.criarStore(memoria({ tf_modo: 'real', tf_reserva: [{ id: 5, nome: 'Velho', valor: 10, data: '2026-10-01' }] }), () => new Date(2026, 10, 9));
    t('editar: troca valor e a data passa a ser hoje', s3.editarReserva(5, { nome: 'Velho', valor: '20' }).ok && s3.st.reserva[0].valor === 20 && s3.st.reserva[0].data === '2026-11-09');
    t('editar: id que não existe', s3.editarReserva(99, { nome: 'a', valor: '1' }).erros.geral === 'Reserva não encontrada.');
    t('apagar', s3.apagarReserva(5) === true && s3.st.reserva.length === 0 && s3.apagarReserva(5) === false);
    t('ligação: grava, troca e volta ao automático', s3.setLiga('crA', 'c1') && s3.st.liga.crA === 'c1' && s3.setLiga('crA', 'nao') && s3.st.liga.crA === 'nao' && s3.setLiga('crA', null) && !('crA' in s3.st.liga));
  }

  /* ===== 5. Fatura estimada: fechamento, parcelas, estorno ===== */
  {
    const M = [['2026-11-05', 70], ['2026-11-06', 40], ['2026-11-07', -15], ['2026-11-08', 100], ['2026-11-09', 20], ['2026-11-10', 999]];
    const e = Real.estimarFatura(M, 5, '2026-11-09');
    t('fechamento dia 5, hoje 9: conta de 06 a 09; o dia 5 fica na fatura fechada; amanhã não entra', e.desde === '2026-11-05' && e.valor === 145);
    t('hoje é o dia do fechamento: ainda conta desde o fechamento anterior', Real.estimarFatura([['2026-10-06', 10], ['2026-11-05', 5]], 5, '2026-11-05').valor === 15 && Real.fechamentoAnterior(5, '2026-11-05') === '2026-10-05');
    t('dia seguinte ao fechamento: só o que veio depois', Real.estimarFatura([['2026-11-05', 5], ['2026-11-06', 7]], 5, '2026-11-06').valor === 7);
    t('fechamento 31 em novembro vira 30; em fevereiro vira 28', Real.fechamentoAnterior(31, '2026-12-01') === '2026-11-30' && Real.fechamentoAnterior(31, '2027-03-01') === '2027-02-28');
    t('virada de ano', Real.fechamentoAnterior(10, '2027-01-03') === '2026-12-10');
    t('parcelas: cada uma pelo próprio valor e data', Real.estimarFatura([['2026-11-06', 40], ['2026-12-06', 40]], 5, '2026-11-20').valor === 40);
    t('estorno maior que as compras: mínimo 0', Real.estimarFatura([['2026-11-06', 10], ['2026-11-07', -50]], 5, '2026-11-09').valor === 0);
    t('sem dia de fechamento: não estima', Real.estimarFatura(M, null, '2026-11-09') === null && Real.estimarFatura(M, 0, '2026-11-09') === null);
  }

  /* ===== 6. derivar: banco contra arquivo ===== */
  {
    const real = REAL(), sn = B.instantaneo(RESP(), AG).snap;
    const A0 = Real.derivar(real, {}, ctxB(null));
    const A1 = Real.derivar(real, {}, ctxB(sn, { reserva: [{ id: 7, nome: 'Cofrinho', valor: 250, data: '2026-11-07' }] }));
    t('sem banco: caixa e reserva do arquivo, como antes', A0.caixaBanco === false && A0.caixinha === 9000 && A0.conta === 500 && A0.caixaLinhas[0].o.t === 'arquivo' && A0.reservaLinhas[0].o.data === '2026-11-01');
    t('sem banco: a previsão começa da liquidez do arquivo (igual a antes)', JSON.stringify(A0.cenarios.Base) === JSON.stringify(Real.projetar(real, {}, { mercadoMedia: null })));
    t('com banco: caixa = soma das contas BANK (1200,50 + 300)', A1.caixaBanco === true && A1.conta === 1500.5);
    t('com banco: reserva = investimentos válidos + digitada (5000 + 10 + 250), fora do caixa', A1.caixinha === 5260 && A1.reservaLinhas.map(x => x.o.t).join() === 'banco,banco,digitado');
    t('com banco: a previsão começa da reserva', A1.cenarios.Base[0] === Real.projetar(real, {}, { inicio: 5260, mercadoMedia: null })[0] && A1.cenarios.Base[0] !== A0.cenarios.Base[0]);
    t('idade: 5 h não está desatualizado; 60 h está', A1.caixaLinhas[0].o.desat === false && A1.caixaLinhas[1].o.desat === true && Math.round(A1.caixaLinhas[0].o.ms / 36e5) === 5);
    const c = A1.cartoes[0];
    t('cartão ligado sozinho (um de cada lado): limite e usado do banco', c.banco.id === 'crA' && c.limite === 4000 && c.disponivel === 3100 && c.usadoBanco === 900);
    t('cartão: fatura estimada (100 + 40 − 15 + 20) e compromisso futuro (900 − 145)', c.fatura === 145 && c.parcelasFuturas === 755 && c.origem.fatura.t === 'estimado' && c.origem.fatura.desde === '2026-11-05');
    t('cartão: vencimento continua o dia do arquivo (não usa balanceDueDate)', c.vence === A0.cartoes[0].vence);
    const maior = clone(sn); maior.contas[2].saldo = 100;
    t('fatura estimada maior que o limite usado: compromisso futuro fica 0', Real.derivar(real, {}, ctxB(maior)).cartoes[0].fatura === 145 && Real.derivar(real, {}, ctxB(maior)).cartoes[0].parcelasFuturas === 0);
    const lim = Real.derivar(real, { limites: { c1: 1234 } }, ctxB(sn));
    t('limite digitado perde para o do banco; sem banco, vale o digitado', lim.cartoes[0].limite === 4000 && Real.derivar(real, { limites: { c1: 1234 } }, ctxB(null)).cartoes[0].limite === 1234);
    const semLim = clone(sn); semLim.contas[2].lim = null;
    t('banco sem limite: fica o do arquivo', Real.derivar(real, {}, ctxB(semLim)).cartoes[0].limite === 4000 && Real.derivar(real, {}, ctxB(semLim)).cartoes[0].origem.limite === null);
    const dois = clone(sn); dois.contas.push({ id: 'crB', tipo: 'CREDIT', nome: 'Cartão Beta', saldo: 50, atu: hAtras(1), lim: 500, disp: 450 });
    t('dois cartões no banco e um no app: nenhum liga sozinho', !Real.derivar(real, {}, ctxB(dois)).cartoes[0].banco);
    t('ligação escolhida vale', Real.derivar(real, {}, ctxB(dois, { liga: { crB: 'c1' } })).cartoes[0].usadoBanco === 50);
    t('"não usar" desliga', !Real.derivar(real, {}, ctxB(sn, { liga: { crA: 'nao' } })).cartoes[0].banco);
    const soCartao = clone(sn); soCartao.contas = soCartao.contas.filter(x => x.tipo === 'CREDIT');
    t('banco sem conta BANK: caixa fica do arquivo', Real.derivar(real, {}, ctxB(soCartao)).caixaBanco === false && Real.derivar(real, {}, ctxB(soCartao)).conta === 500);
    const semInv = clone(sn); semInv.ip = false; semInv.inv = [];
    t('ponte sem investimentos: reserva fica do arquivo (+ digitada)', Real.derivar(real, {}, ctxB(semInv, { reserva: [{ id: 1, nome: 'x', valor: 1, data: '2026-11-01' }] })).caixinha === 9001);
    const vazioInv = clone(sn); vazioInv.ip = true; vazioInv.inv = [];
    t('ponte com lista de investimentos vazia: reserva do banco é zero', Real.derivar(real, {}, ctxB(vazioInv)).caixinha === 0);
    const semData = clone(sn); semData.contas[0].atu = null;
    t('sem data de atualização: conta como desatualizado', Real.derivar(real, {}, ctxB(semData)).caixaLinhas[0].o.desat === true && Real.derivar(real, {}, ctxB(semData)).caixaLinhas[0].o.ms === null);
    const lim48 = clone(sn); lim48.contas[0].atu = hAtras(48);
    t('exatamente 48 h ainda não é desatualizado', Real.derivar(real, {}, ctxB(lim48)).caixaLinhas[0].o.desat === false && Real.LIMITE_DESATUALIZADO_H === 48);
    t('carteira do Patrimônio: uma linha por reserva, com origem', A1.carteira.length === 3 && A1.carteira.every(x => x.o && x.classe === 'Renda fixa' && x.liquidez === 'diaria'));
  }

  /* ===== 7. Telas ===== */
  const hoje = new Date(), hISO = d => { const x = new Date(hoje); x.setDate(x.getDate() - d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const agoraT = Date.now(), hT = n => new Date(agoraT - n * 36e5).toISOString();
  const SNAP = () => ({ v: 1, em: agoraT, ip: true,
    contas: [{ id: 'ccA', tipo: 'BANK', nome: 'Banco Alfa', saldo: 1200, atu: hT(5) }, { id: 'ccB', tipo: 'BANK', nome: 'Banco Beta', saldo: 300, atu: hT(60) },
      { id: 'crA', tipo: 'CREDIT', nome: 'Cartão Alfa', saldo: 900, atu: hT(5), lim: 4000, disp: 3100 }],
    inv: [{ nome: 'Reserva inventada', saldo: 5000, atu: hT(5) }], movs: { crA: [] } });
  const RT = () => { const r = clone(FICTICIO); r._meta.as_of = hISO(3); return r; };
  const espiao = () => { const s = { n: 0 }; s.fetch = () => { s.n++; return Promise.reject(new Error('sem rede')); }; return s; };
  const txt = A => A.$('main').textContent.replace(/\s+/g, ' ');
  for (const larg of [390, 1024]) {
    const n = larg + 'px: ';
    const A = await abrir({ tf_modo: 'real', tf_real: RT(), tf_bsnap: SNAP(), tf_reserva: [{ id: 7, nome: 'Cofrinho inventado', valor: 250, data: hISO(2) }] }, { largura: larg });
    await A.ir('hoje');
    const pc = [...A.$$('#main .pn')].find(p => /Caixa hoje/.test(p.textContent));
    t(n + 'Hoje: Caixa hoje é só a soma das contas do banco (R$ 1.500,00)', /R\$\s?1\.500,00/.test(pc.querySelector('.big').textContent));
    t(n + 'Hoje: reserva à parte, fora do caixa, com origem banco e digitado', /reserva R\$\s?5\.250,00, fora do caixa/.test(pc.textContent) && /banco · há 5 h/.test(pc.textContent) && /digitado · de /.test(pc.textContent));
    t(n + 'Hoje: conta de 60 h marcada desatualizado', /banco · há 2 dias/.test(pc.textContent) && !!pc.querySelector('.tag.at') && /desatualizado/.test(pc.querySelector('.tag.at').textContent));
    const bt = A.$('#cx_ver'), ls = A.$('#cx_lista');
    t(n + 'painel do caixa: fechado no começo', bt.getAttribute('aria-expanded') === 'false' && ls.hidden && bt.getAttribute('aria-controls') === 'cx_lista');
    const antes = A.w.eval('atual');
    A.click(bt); await tick(5);
    t(n + 'painel do caixa: abre, lista as contas que somam e a reserva à parte', !ls.hidden && bt.getAttribute('aria-expanded') === 'true' && /Somam o caixa.*Banco Alfa.*Banco Beta.*Reserva, fora do caixa.*Reserva inventada.*Cofrinho inventado/.test(ls.textContent.replace(/\s+/g, ' ')));
    t(n + 'painel do caixa: tocar não troca de tela', A.w.eval('atual') === antes);
    A.click(ls); await tick(5);
    t(n + 'painel do caixa: tocar na lista também não troca de tela', A.w.eval('atual') === antes);
    A.click(bt); await tick(5);
    t(n + 'painel do caixa: fecha de novo', ls.hidden && bt.getAttribute('aria-expanded') === 'false');
    t(n + 'Hoje: cartão com origem do banco', larg < 800 ? /Cartão usado\s*\d+%\s*banco · há 5 h/.test(txt(A)) : /limite e uso banco · há 5 h/.test(txt(A)));
    await A.ir('futuro');
    t(n + 'Futuro: diz de onde a previsão começa', /A previsão começa da reserva de R\$\s?5\.250 banco · há 5 h digitado · de /.test(A.$('.fut-orig').textContent.replace(/\s+/g, ' ')));
    await A.ir('saude');
    t(n + 'Patrimônio: origem do que você tem', /banco · há 2 dias/.test(txt(A)) && /digitado · de /.test(txt(A)));
    await A.ir('cartao');
    t(n + 'Cartão: fatura estimada e compromisso futuro estimado', /Fatura atual \(estimada\)/.test(txt(A)) && /ompromisso futuro no cartão \(estimado\)/.test(txt(A)));
    await A.ir('numeros');
    t(n + 'Meus números: cartão do banco ligado sozinho, com origem', /Cartão Alfa \(cartão do banco\)/.test(txt(A)) && /Automático: Cartão Teste/.test(txt(A)) && /Limite usadoR\$\s?900,00 banco · há 5 h/.test(txt(A)));
    t(n + 'Meus números: limite digitado avisa que vale o do banco', /Com o banco ligado, vale o limite que veio dele: banco · há 5 h/.test(txt(A)));
    t(n + 'sem erro', A.erros.length === 0);
  }
  /* Meus números: reserva digitada e ligação pela tela */
  {
    const m = memoria({ tf_modo: 'real', tf_real: RT(), tf_bsnap: SNAP() }), A = await abrir({}, { storage: m, largura: 1024 });
    await A.ir('numeros');
    A.set('#rs_n_novo', 'Cofrinho inventado'); A.set('#rs_v_novo', '300'); A.click('#rs_add'); await tick(10);
    const rs = () => JSON.parse(m.getItem('tf_reserva') || '[]');
    t('tela: adicionar reserva grava e mostra a data', rs().length === 1 && rs()[0].valor === 300 && /Adicionado à reserva/.test(A.$('#rs_msg').textContent) && /digitado · de /.test(txt(A)));
    A.set('#rs_n_novo', ''); A.set('#rs_v_novo', '5'); A.click('#rs_add'); await tick(10);
    t('tela: reserva sem nome mostra o erro', /Informe o nome da reserva/.test(A.$('#rs_msg').textContent) && rs().length === 1);
    A.set('#rs_v_0', '320'); A.click('[data-rs-salva="0"]'); await tick(10);
    t('tela: editar reserva', rs()[0].valor === 320);
    await A.ir('hoje');
    t('tela: a reserva digitada entra na reserva do Hoje (5.000 + 320)', /reserva R\$\s?5\.320,00/.test(txt(A)));
    await A.ir('numeros'); A.click('[data-rs-apaga="0"]'); await tick(10);
    t('tela: apagar reserva', rs().length === 0 && /Removido da reserva/.test(A.$('#rs_msg').textContent));
    const sel = A.$('select[data-lg="0"]'); sel.value = 'nao'; sel.dispatchEvent(new A.w.Event('change', { bubbles: true })); await tick(10);
    t('tela: "Não usar" grava e desliga o cartão', JSON.parse(m.getItem('tf_liga')).crA === 'nao' && !A.w.eval('DEMO.cartoes[0].banco'));
    const s2 = A.$('select[data-lg="0"]'); s2.value = ''; s2.dispatchEvent(new A.w.Event('change', { bubbles: true })); await tick(10);
    t('tela: voltar ao automático', !('crA' in JSON.parse(m.getItem('tf_liga'))) && A.w.eval('DEMO.cartoes[0].usadoBanco') === 900);
    t('tela: id da conta do banco não vai para o DOM', !A.d.body.innerHTML.includes('crA') && !A.d.body.innerHTML.includes('ccA'));
    t('tela: sem erro', A.erros.length === 0);
  }
  /* Ponte falhou: os últimos valores ficam, com a idade */
  {
    const m = memoria({ tf_modo: 'real', tf_real: RT(), tf_bsnap: SNAP(), tf_banco_on: true, tf_banco_url: 'https://script.google.com/macros/s/ABC/exec' });
    m.setItem('tf_gtoken', JSON.stringify({ v: 'tok', exp: Date.now() + 3600000 })); m.setItem('tf_gjaconectou', 'true');
    const resp = o => Promise.resolve({ ok: true, status: 200, json: async () => o, text: async () => JSON.stringify(o) });
    let modo = 'falha';
    const fetch = url => { url = String(url); if (!url.includes('script.google.com')) return Promise.reject(new Error('sem rede')); return modo === 'falha' ? Promise.reject(new Error('rede')) : modo === 'erro' ? resp({ ok: false, erro: 'expirada' }) : resp({ ok: true, dados: { de: '2026-10-01', ate: '2026-11-09', contas: 'x', movs: [] } }); };
    const A = await abrir({}, { storage: m, fetch, largura: 1024 });
    const antes = m.getItem('tf_bsnap');
    for (const k of ['falha', 'erro', 'formato']) {
      modo = k; await A.ir('banco'); A.click('#bc_atu'); await tick(150);
      t('ponte ' + k + ': mensagem e a foto anterior continua igual', /Não consegui falar com a ponte|autorização do banco expirou|formato inesperado/.test(A.$('#bc_msg').textContent) && m.getItem('tf_bsnap') === antes);
    }
    await A.ir('hoje');
    t('ponte falhou: Hoje continua com os valores do banco e a idade', /R\$\s?1\.500,00/.test(txt(A)) && /banco · há 5 h/.test(txt(A)));
    modo = 'ok2';
    const nova = { ok: true, dados: { de: '2026-10-01', ate: '2026-11-09', contas: [{ id: 'ccA', tipo: 'BANK', nome: 'Banco Alfa', saldo: 999, atualizado: new Date().toISOString() }], movs: [] } };
    A.w.fetch = url => String(url).includes('script.google.com') ? resp(nova) : Promise.reject(new Error('sem rede'));
    await A.ir('banco'); A.click('#bc_atu'); await tick(150);
    t('ponte respondeu: grava a foto nova e avisa', JSON.parse(m.getItem('tf_bsnap')).contas[0].saldo === 999 && /Valores do banco atualizados/.test(A.$('#bc_msg').textContent));
    await A.ir('hoje');
    t('foto nova: Hoje usa o valor novo, banco · há 0 h', /R\$\s?999,00/.test(txt(A)) && /banco · há 0 h/.test(txt(A)));
    t('sem erro', A.erros.length === 0);
  }
  /* Drive de mentira: a foto, a reserva e a ligação vão de um aparelho para o outro */
  {
    const arq = { files: {} }, resp = o => Promise.resolve({ ok: true, status: 200, json: async () => o, text: async () => (typeof o === 'string' ? o : JSON.stringify(o)) });
    const nao = () => Promise.resolve({ ok: false, status: 404, json: async () => ({}), text: async () => '' });
    const fetch = (url, opt = {}) => { url = String(url);
      if (url.includes('/upload/drive/v3/files/')) { const id = url.split('/files/')[1].split('?')[0]; if (!arq.files[id]) return nao(); arq.files[id].body = opt.body; return resp({ id }); }
      if (url.includes('alt=media')) { const id = url.split('/files/')[1].split('?')[0]; if (!arq.files[id]) return nao(); return resp(arq.files[id].body || ''); }
      if (opt.method === 'POST') { const b = JSON.parse(opt.body), id = 'f' + Object.keys(arq.files).length; arq.files[id] = { name: b.name, body: '' }; return resp({ id }); }
      const nome = (decodeURIComponent(url.split('q=')[1] || '').match(/name='([^']+)'/) || [])[1];
      return resp({ files: Object.entries(arq.files).filter(([, x]) => x.name === nome).map(([i, x]) => ({ id: i, name: x.name })) }); };
    const itensDrive = () => { const x = Object.values(arq.files).find(y => y.name === 'dados.json'); return x && x.body ? JSON.parse(x.body).itens : {}; };
    const conecta = m => { m.setItem('tf_gtoken', JSON.stringify({ v: 'tok', exp: Date.now() + 3600000 })); m.setItem('tf_gjaconectou', 'true'); };
    const sinc = async A => { await A.w.eval('sincronizar()'); await tick(30); };
    const m1 = memoria({ tf_modo: 'real', tf_real: RT(), tf_bsnap: SNAP(), tf_reserva: [{ id: 7, nome: 'Cofrinho inventado', valor: 250, data: hISO(2) }], tf_liga: { crA: 'c1' } }); conecta(m1);
    const P1 = await abrir({}, { storage: m1, fetch }); await sinc(P1);
    const it = itensDrive();
    t('Drive: o aparelho 1 manda banco, res:7 e liga', !!it.banco && !!it['res:7'] && !!it.liga && it.banco.v.contas.length === 3);
    const m2 = memoria({ tf_modo: 'real', tf_real: RT() }); conecta(m2);
    const P2 = await abrir({}, { storage: m2, fetch }); await sinc(P2);
    t('Drive: o aparelho 2 recebe a foto, a reserva e a ligação', JSON.parse(m2.getItem('tf_bsnap')).contas.length === 3 && JSON.parse(m2.getItem('tf_reserva'))[0].valor === 250 && JSON.parse(m2.getItem('tf_liga')).crA === 'c1');
    await P2.ir('hoje');
    t('Drive: o aparelho 2 mostra o caixa do banco com a idade', /R\$\s?1\.500,00/.test(txt(P2)) && /banco · há 5 h/.test(txt(P2)));
    await P2.ir('numeros'); P2.click('[data-rs-apaga="0"]'); await tick(10); await sinc(P2);
    t('Drive: apagar a reserva no aparelho 2 vira lápide', itensDrive()['res:7'].d === true);
    await sinc(P1);
    t('Drive: o aparelho 1 recebe a exclusão', JSON.parse(m1.getItem('tf_reserva')).length === 0);
    t('Drive: sem erro', P1.erros.length + P2.erros.length === 0);
  }
  /* n2.inicio (onde a previsão começa) fica só dentro do derivar: não vai para Meus números, localStorage nem Drive */
  {
    const num = { salario: 5000, mercado: 400, limites: { c1: 1234 } }, antes = JSON.stringify(num);
    Real.derivar(REAL(), num, ctxB(B.instantaneo(RESP(), AG).snap));
    t('n2.inicio: o num passado ao derivar não muda', JSON.stringify(num) === antes && !('inicio' in num));
    const m = memoria({ tf_modo: 'real', tf_real: RT(), tf_bsnap: SNAP(), tf_numeros: { salario: 5000 } });
    const A = await abrir({}, { storage: m, largura: 1024 });
    await A.ir('futuro'); await A.ir('numeros'); A.set('#n_mercado', '400'); A.click('#n_ok'); await tick(20);
    const temInicio = x => /"inicio":/.test(typeof x === 'string' ? x : JSON.stringify(x));
    t('n2.inicio: não está em S.st.numeros', !temInicio(A.w.eval('S.st.numeros')) && A.w.eval('S.st.numeros.mercado') === 400);
    t('n2.inicio: não está em nenhuma chave do localStorage', Object.keys(m._o).every(k => !temInicio(m._o[k])));
    const it = A.w.eval('capturar()');
    t('n2.inicio: não está nos itens que vão para o Drive', !temInicio(it) && !!it.numeros && !temInicio(it.numeros.v));
    t('n2.inicio: sem erro', A.erros.length === 0);
  }
  /* Mês 0 da previsão: início do banco ou digitado desconta só as pendências não pagas; início do arquivo fica igual */
  {
    const relogio = iso => w => { const Rr = w.Date, alvo = new Rr(iso).getTime(), d0 = Rr.now(), ag = () => alvo + (Rr.now() - d0); class D extends Rr { constructor(...x) { if (x.length) super(...x); else super(ag()); } static now() { return ag(); } } w.Date = D; };
    const RP = () => { const r = clone(FICTICIO); r._meta.as_of = '2026-11-01'; r.liquidez.total = 9000; r.gastos_fixos_mensais.teto_lazer_mes = 300;
      r.pendencias_novembro = [{ descricao: 'Conta A inventada', valor: 800, vence: '2026-11-03' }, { descricao: 'Conta B inventada', valor: 700, vence: '2026-11-20' }]; return r; };
    const SN = { v: 1, em: AG, ip: true, contas: [{ id: 'ccA', tipo: 'BANK', nome: 'Banco Alfa', saldo: 600, atu: hAtras(5) }], inv: [{ nome: 'Reserva inventada', saldo: 1000, atu: hAtras(5) }], movs: {} };
    const pagoDe = pagos => { const st = Store.criarStore(memoria({ tf_modo: 'real', tf_pagos: pagos || {} }), () => new Date(2026, 10, 10)); return x => st.estaPago(x, 10, '2026-11'); };
    const mes0 = (ctx, pagos) => Real.derivar(RP(), {}, Object.assign({ agora: AG, idadeMs: B.idadeMs, hojeISO: '2026-11-10', pago: pagoDe(pagos) }, ctx));
    const b0 = mes0({ banco: SN });
    t('pendências: início do banco, nada marcado: desconta só B (a vencer) e dá 0', b0.cenarios.Base[0] === 0 && b0.pendNaoPagas.n === 1 && b0.pendNaoPagas.valor === 700);
    const b1 = mes0({ banco: SN }, { 'a2@2026-11': true });
    t('pendências: B marcada como paga: 700', b1.cenarios.Base[0] === 700 && b1.pendNaoPagas.n === 0 && b1.pendNaoPagas.valor === 0);
    const b2 = mes0({ banco: SN }, { 'a1@2026-11': false, 'a2@2026-11': false });
    t('pendências: A e B marcadas como não pagas: -800', b2.cenarios.Base[0] === -800 && b2.pendNaoPagas.n === 2 && b2.pendNaoPagas.valor === 1500);
    const arq = mes0({});
    t('pendências: início do arquivo: 7.200, como antes, e sem a contagem', arq.cenarios.Base[0] === 7200 && arq.pendNaoPagas === null);
    const arqMarcado = mes0({}, { 'a1@2026-11': false, 'a2@2026-11': true });
    t('pendências: início do arquivo ignora as marcas de pago', JSON.stringify(arqMarcado.cenarios) === JSON.stringify(arq.cenarios));
    t('pendências: início do arquivo é idêntico ao projetar antigo (as duas séries)', JSON.stringify(arq.cenarios.Base) === JSON.stringify(Real.projetar(RP(), {}, { mercadoMedia: null })) && JSON.stringify(arq.cenarios['Com repasse da mãe']) === JSON.stringify(Real.projetar(RP(), { repasseMae: true }, { mercadoMedia: null })));
    const semPago = Real.derivar(RP(), {}, { agora: AG, idadeMs: B.idadeMs, hojeISO: '2026-11-10' });
    t('pendências: início do arquivo, com e sem a função de pago: saída idêntica', JSON.stringify(arq) === JSON.stringify(semPago));
    const fx = Real.derivar(REAL(), { salario: 5000, mercado: 400 }, { agora: AG, idadeMs: B.idadeMs, hojeISO: '2026-11-09', pago: pagoDe({ 'a1@2026-11': false }) });
    t('pendências: fixtura do arquivo real de teste, início do arquivo: idêntico ao projetar antigo', JSON.stringify(fx.cenarios.Base) === JSON.stringify(Real.projetar(REAL(), {}, { salario: 5000, mercado: 400, mercadoMedia: null })) && fx.pendNaoPagas === null);
    const dig = mes0({ reserva: [{ id: 1, nome: 'Cofrinho', valor: 100, data: '2026-11-05' }] });
    t('pendências: início com reserva digitada (sem banco): só as não pagas (9.000 + 100 − 700 − 300)', dig.cenarios.Base[0] === 8100 && dig.pendNaoPagas.n === 1);
    t('pendências: sem a função de pago, o início do banco desconta todas (seguro)', Real.derivar(RP(), {}, { banco: SN, agora: AG, idadeMs: B.idadeMs, hojeISO: '2026-11-10' }).cenarios.Base[0] === -800);
    /* tela: a linha de origem do Futuro mostra o que foi descontado */
    const tela = async (ini, larg) => { const A = await abrir(Object.assign({ tf_modo: 'real', tf_real: RP() }, ini), { antes: relogio('2026-11-10T12:00:00'), largura: larg }); await A.ir('futuro'); return A; };
    const snTela = clone(SN); snTela.contas[0].atu = '2026-11-10T07:00:00'; snTela.inv[0].atu = '2026-11-10T07:00:00';
    for (const larg of [390, 1024]) {
      const A = await tela({ tf_bsnap: snTela }, larg), l = A.$('.fut-orig').textContent.replace(/\s+/g, ' ');
      t(larg + 'px Futuro: "pendências não pagas: 1, R$ 700" e mês 0 = 0', /pendências não pagas: 1, R\$\s?700/.test(l) && A.w.eval('DEMO.cenarios.Base[0]') === 0 && !!A.$('.fut-orig .orig'));
      const P = await tela({ tf_bsnap: snTela, tf_pagos: { 'a2@2026-11': true } }, larg);
      t(larg + 'px Futuro: B paga: "pendências não pagas: 0, R$ 0" e mês 0 = 700', /pendências não pagas: 0, R\$\s?0/.test(P.$('.fut-orig').textContent.replace(/\s+/g, ' ')) && P.w.eval('DEMO.cenarios.Base[0]') === 700);
      const F = await tela({}, larg);
      t(larg + 'px Futuro: início do arquivo: sem a contagem e mês 0 = 7.200', !/pendências não pagas/.test(F.$('.fut-orig').textContent) && F.w.eval('DEMO.cenarios.Base[0]') === 7200);
      t(larg + 'px Futuro: sem erro', A.erros.length + P.erros.length + F.erros.length === 0);
    }
    /* marcar como paga na Agenda recalcula a previsão na hora */
    const G = await abrir({ tf_modo: 'real', tf_real: RP(), tf_bsnap: snTela }, { antes: relogio('2026-11-10T12:00:00'), largura: 1024 });
    await G.ir('agenda');
    const cx = G.$$('#main input[type=checkbox]'); cx[1].checked = true; cx[1].dispatchEvent(new G.w.Event('change', { bubbles: true })); await tick(10);
    t('Agenda: marcar B como paga muda o mês 0 de 0 para 700', G.w.eval('DEMO.cenarios.Base[0]') === 700 && G.erros.length === 0);
  }
  /* Mês 0: no início do banco ou digitado, lazer e mercado descontam só o que falta do mês; início do arquivo fica igual */
  {
    const RP = () => { const r = clone(FICTICIO); r._meta.as_of = '2026-11-01'; r.liquidez.total = 9000; r.gastos_fixos_mensais.teto_lazer_mes = 300;
      r.pendencias_novembro = [{ descricao: 'Conta A inventada', valor: 800, vence: '2026-11-03' }, { descricao: 'Conta B inventada', valor: 700, vence: '2026-11-20' }]; return r; };
    const SN = { v: 1, em: AG, ip: true, contas: [{ id: 'ccA', tipo: 'BANK', nome: 'Banco Alfa', saldo: 600, atu: hAtras(5) }], inv: [{ nome: 'Reserva inventada', saldo: 1000, atu: hAtras(5) }], movs: {} };
    const st = Store.criarStore(memoria({ tf_modo: 'real' }), () => new Date(2026, 10, 10)), pago = x => st.estaPago(x, 10, '2026-11');
    const G = (id, data, cat, valor, extra) => Object.assign({ id, data, desc: 'Gasto inventado ' + id, cat, valor, forma: 'Pix', essencial: false, lazer: false }, extra || {});
    const gastos = [G(1, '2026-11-04', 'Lazer', 200, { lazer: true }), G(2, '2026-11-06', 'Mercado', 150)];
    const d = (num, lanc, extra) => Real.derivar(RP(), num, Object.assign({ banco: SN, agora: AG, idadeMs: B.idadeMs, hojeISO: '2026-11-10', pago, lanc }, extra || {}));
    t('falta do mês: sem gastos lançados, igual a antes (0)', d({}, []).cenarios.Base[0] === 0 && d({}, []).faltaMes0.lazer === 300 && d({}, []).faltaMes0.mercado === 0);
    t('falta do mês: lazer 200 já gasto, mercado 0: 200 = 1.000 − 700 − (300 − 200)', d({}, gastos).cenarios.Base[0] === 200 && d({}, gastos).faltaMes0.lazer === 100);
    t('falta do mês: mercado informado 400, com 150 já gasto: −50', d({ mercado: 400 }, gastos).cenarios.Base[0] === -50 && d({ mercado: 400 }, gastos).faltaMes0.mercado === 250);
    const acima = [G(1, '2026-11-04', 'Jogos', 500, { lazer: true }), G(2, '2026-11-06', 'Mercado', 900)];
    t('falta do mês: gasto acima do teto e do mercado: desconta zero, nunca negativo', d({ mercado: 400 }, acima).cenarios.Base[0] === 300 && d({ mercado: 400 }, acima).faltaMes0.lazer === 0 && d({ mercado: 400 }, acima).faltaMes0.mercado === 0);
    const fora = [G(1, '2026-10-30', 'Lazer', 200, { lazer: true }), G(2, '2026-11-06', 'Mercado', 150, { neutro: true }), G(3, '2026-11-07', 'Lazer', -80, { lazer: true }), G(4, '2026-11-08', 'Mercado', 60, { lazer: true })];
    t('falta do mês: mês passado, "não é gasto" e entrada não contam; Mercado marcado como lazer conta no lazer', d({ mercado: 400 }, fora).faltaMes0.lazer === 240 && d({ mercado: 400 }, fora).faltaMes0.mercado === 400);
    t('falta do mês: os meses seguintes não mudam', JSON.stringify(d({ mercado: 400 }, gastos).cenarios.Base.slice(1).map((v, i, arr) => i ? Math.round((v - arr[i - 1]) * 100) : 0)) === JSON.stringify(d({ mercado: 400 }, []).cenarios.Base.slice(1).map((v, i, arr) => i ? Math.round((v - arr[i - 1]) * 100) : 0)));
    const arq = (num, lanc) => Real.derivar(RP(), num, { agora: AG, idadeMs: B.idadeMs, hojeISO: '2026-11-10', pago, lanc });
    t('falta do mês: início do arquivo ignora os gastos lançados (7.200) e não tem o campo', arq({}, gastos).cenarios.Base[0] === 7200 && arq({}, gastos).faltaMes0 === null && JSON.stringify(arq({ mercado: 400 }, gastos).cenarios) === JSON.stringify(arq({ mercado: 400 }, []).cenarios));
    t('falta do mês: início do arquivo idêntico ao projetar antigo', JSON.stringify(arq({ mercado: 400 }, gastos).cenarios.Base) === JSON.stringify(Real.projetar(RP(), {}, { mercado: 400, mercadoMedia: null })));
    t('falta do mês: hoje em outro mês que não o do arquivo: desconta o mês inteiro', d({}, [G(1, '2026-12-04', 'Lazer', 200, { lazer: true })], { hojeISO: '2026-12-10' }).faltaMes0 === null);
    t('falta do mês: reserva digitada, sem banco, também desconta só o que falta', Real.derivar(RP(), {}, { reserva: [{ id: 1, nome: 'Cofrinho', valor: 100, data: '2026-11-05' }], agora: AG, idadeMs: B.idadeMs, hojeISO: '2026-11-10', pago, lanc: gastos }).cenarios.Base[0] === 8300);
    const relogio = iso => w => { const Rr = w.Date, alvo = new Rr(iso).getTime(), d0 = Rr.now(), ag = () => alvo + (Rr.now() - d0); class D extends Rr { constructor(...x) { if (x.length) super(...x); else super(ag()); } static now() { return ag(); } } w.Date = D; };
    const snTela = clone(SN); snTela.contas[0].atu = '2026-11-10T07:00:00'; snTela.inv[0].atu = '2026-11-10T07:00:00';
    for (const larg of [390, 1024]) {
      const A = await abrir({ tf_modo: 'real', tf_real: RP(), tf_bsnap: snTela, tf_lanc3: gastos }, { antes: relogio('2026-11-10T12:00:00'), largura: larg }); await A.ir('futuro');
      const l = A.$('.fut-orig').textContent.replace(/\s+/g, ' ');
      t(larg + 'px Futuro: "ainda a gastar no mês: lazer R$ 100, mercado R$ 0" e mês 0 = 200', /ainda a gastar no mês: lazer R\$\s?100, mercado R\$\s?0/.test(l) && A.w.eval('DEMO.cenarios.Base[0]') === 200 && A.erros.length === 0);
      const F = await abrir({ tf_modo: 'real', tf_real: RP(), tf_lanc3: gastos }, { antes: relogio('2026-11-10T12:00:00'), largura: larg }); await F.ir('futuro');
      t(larg + 'px Futuro: início do arquivo sem essa linha', !/ainda a gastar no mês/.test(F.$('.fut-orig').textContent) && F.w.eval('DEMO.cenarios.Base[0]') === 7200);
    }
  }
  /* Os quatro modos */
  {
    const r = espiao(), A = await abrir({}, { storage: memoria(), fetch: r.fetch });
    t('sem dados: tela inicial, 0 pedidos de rede', !!A.$('#ini_ok') && r.n === 0 && A.erros.length === 0);
    const r2 = espiao(), E = await abrir({}, { storage: memoria({ tf_modo: 'demo' }), fetch: r2.fetch });
    await E.ir('hoje');
    t('exemplo: sem origem nem botão de contas, 0 pedidos de rede', !/banco ·|arquivo ·|digitado ·/.test(txt(E)) && !E.$('#cx_ver') && r2.n === 0 && E.erros.length === 0);
    await E.ir('numeros');
    t('exemplo: Meus números sem os painéis novos', !E.$('#rs_add') && !E.$('select[data-lg]'));
    const m = memoria(), S0 = await abrir({}, { storage: m });
    S0.set('#ini_renda', '5000'); S0.set('#ini_fixos', '3000'); S0.set('#ini_saldo', '1500'); S0.click('#ini_ok'); await tick(10);
    const Sm = await abrir({}, { storage: m }); await Sm.ir('hoje');
    t('real simples: Hoje continua o do primeiro uso, sem botão de contas', !Sm.$('#cx_ver') && /saldo informado em/.test(txt(Sm)) && Sm.erros.length === 0);
    const C = await abrir({ tf_modo: 'real', tf_real: RT() }); await C.ir('hoje');
    t('real completo sem banco: caixa do arquivo (caixinha + conta), com a origem arquivo', /R\$\s?9\.500,00/.test(txt(C)) && /arquivo · de /.test(txt(C)) && !/banco ·/.test(txt(C)));
    C.click('#cx_ver'); await tick(5);
    t('real completo sem banco: painel lista conta corrente e reserva do arquivo', /Conta corrente.*arquivo · de .*Reserva \(caixinha\)/.test(C.$('#cx_lista').textContent.replace(/\s+/g, ' ')));
    await C.ir('numeros');
    t('real completo sem banco: sem painel de cartões do banco; reserva digitada disponível', !C.$('select[data-lg]') && !!C.$('#rs_add') && C.erros.length === 0);
  }

  process.exit(fim());
})();
