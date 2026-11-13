/* pluggy-7: parcelas do cartão datadas no fechamento anterior. banco.js (instantaneo -> pm), seguranca.js (sanBanco), real.js (estimarFatura e derivar) e o texto da tela Cartão.
   Só valores inventados. Parte pura em node e parte de tela no jsdom (test_base.js). */
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const B = require('./banco.js'), Real = require('./real.js'), Seg = require('./seguranca.js'), TFSync = require('./sync.js');
const { t, fim } = contador('pluggy-7');

const AG = Date.UTC(2026, 10, 9, 12);
const hAtras = n => new Date(AG - n * 36e5).toISOString();
const clone = o => JSON.parse(JSON.stringify(o));
const ctxB = (banco, extra) => Object.assign({ banco, agora: AG, idadeMs: B.idadeMs, hojeISO: '2026-11-09' }, extra || {});
const REAL = () => { const r = clone(FICTICIO); r._meta.as_of = '2026-11-01'; return r; };
const E = Real.estimarFatura;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* gerador pseudoaleatório com semente (mulberry32), para o teste de propriedade ser repetível */
const prng = semente => { let a = semente >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
const somaDias = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

/* resposta inventada da ponte: um cartão (crA), um segundo cartão (crB) e uma conta corrente (ccA) */
const mov = (id, conta, data, valor, tipo, extra) => Object.assign({ id, conta, data, desc: 'Item inventado ' + id, valor, tipo: tipo || 'DEBIT', status: 'POSTED', cat: 'Shopping' }, extra || {});
const RESP = movs => ({ ok: true, dados: { de: '2026-10-05', ate: '2026-11-09',
  contas: [
    { id: 'ccA', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'Banco Alfa', saldo: 1200.5, item: 'it1', atualizado: hAtras(5) },
    { id: 'crA', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartão Alfa', saldo: 900, item: 'it1', atualizado: hAtras(5), credito: { creditLimit: 4000, availableCreditLimit: 3100 } },
    { id: 'crB', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartão Beta', saldo: 500, item: 'it1', atualizado: hAtras(5), credito: { creditLimit: 2000, availableCreditLimit: 1500 } }],
  investimentos: [], itens: [{ item: 'it1', atualizado: hAtras(5) }], movs } });
const P = (n, de) => ({ n, de });

(async () => {
  /* ===== 1. estimarFatura: o caso observado e os cantos do calendário ===== */
  {
    /* fechamento dia 5, hoje 09/11: desde = 05/11 */
    let e = E([['2026-11-06', 40]], 5, '2026-11-09', [['2026-11-05', 100]]);
    t('parcela datada no fechamento é somada: 40 + 100 = 140, desde 05/11, 1 parcela', e.valor === 140 && e.desde === '2026-11-05' && e.parcelas === 1);
    e = E([['2026-11-05', 70], ['2026-11-06', 40]], 5, '2026-11-09', []);
    t('compra comum no dia do fechamento (fora de pm) continua fora da fatura', e.valor === 40 && e.parcelas === 0);
    e = E([['2026-11-05', 70], ['2026-11-06', 40]], 5, '2026-11-09', [['2026-11-05', 70]]);
    t('o mesmo item no dia do fechamento: fora de pm não entra, dentro de pm entra', e.valor === 110 && e.parcelas === 1);
    e = E([['2026-11-06', 40], ['2026-11-07', 25]], 5, '2026-11-09', [['2026-11-06', 40], ['2026-11-07', 25]]);
    t('parcelas em outros dias já estão em movs: não são contadas duas vezes', e.valor === 65 && e.parcelas === 0);
    e = E([['2026-11-06', 40]], 5, '2026-11-09', [['2026-11-06', 40], ['2026-11-05', 100], ['2026-11-05', 30]]);
    t('várias parcelas no fechamento: soma todas e conta todas', e.valor === 170 && e.parcelas === 2);
    e = E([['2026-11-06', 40]], 5, '2026-11-09', [['2026-11-04', 500], ['2026-10-05', 500], ['2026-11-10', 500]]);
    t('parcela antes do fechamento ou depois de hoje: ignorada', e.valor === 40 && e.parcelas === 0);
    e = E([], 5, '2026-11-09', [['2026-11-05', 0.1], ['2026-11-05', 0.2]]);
    t('centavos: 0,1 + 0,2 vira 0,3', e.valor === 0.3 && e.parcelas === 2);

    /* hoje é o dia do fechamento (05/11): desde = 05/10; as parcelas de hoje pertencem à próxima fatura */
    const movsH = [['2026-10-20', 50], ['2026-11-05', 30]];
    e = E(movsH, 5, '2026-11-05', [['2026-10-05', 100], ['2026-11-05', 30]]);
    t('hoje é o fechamento: soma as parcelas do fechamento anterior (100) e tira as de hoje (30): 50 + 30 + 100 − 30 = 150', e.desde === '2026-10-05' && e.valor === 150 && e.parcelas === 1);
    e = E(movsH, 5, '2026-11-05', [['2026-11-05', 30]]);
    t('hoje é o fechamento, só parcela de hoje: não conta como parcela lançada e sai do total (50)', e.valor === 50 && e.parcelas === 0);
    e = E(movsH, 5, '2026-11-05', []);
    t('hoje é o fechamento, compra comum de hoje fica no total (80, igual a antes)', e.valor === 80 && e.parcelas === 0);
    e = E([['2026-10-20', 100], ['2026-11-05', -30]], 5, '2026-11-05', [['2026-11-05', -30]]);
    t('hoje é o fechamento com parcela negativa de hoje: o desconto devolve o valor (100)', e.valor === 100);
    e = E([['2026-11-06', 7], ['2026-11-05', 30]], 5, '2026-11-06', [['2026-11-05', 100], ['2026-11-06', 20]]);
    t('dia seguinte ao fechamento: parcelas do fechamento entram; as de hoje continuam em movs, sem desconto (7 + 100)', e.desde === '2026-11-05' && e.valor === 107 && e.parcelas === 1);
    e = E([['2026-11-06', 20]], 5, '2026-11-06', [['2026-11-06', 20]]);
    t('dia seguinte: parcela de hoje em pm e em movs não é descontada (20)', e.valor === 20 && e.parcelas === 0);
    e = E([['2026-11-04', 9]], 5, '2026-11-04', [['2026-10-05', 60]]);
    t('dia anterior ao fechamento: o último fechamento é o do mês passado', e.desde === '2026-10-05' && e.valor === 69 && e.parcelas === 1);

    /* fechamento 31 */
    e = E([['2026-11-30', 25]], 31, '2026-11-30', [['2026-10-31', 80], ['2026-11-30', 25]]);
    t('fechamento 31 em mês de 30 dias: hoje (30/11) é dia de fechamento; desde 31/10; 25 + 80 − 25 = 80', e.desde === '2026-10-31' && e.valor === 80 && e.parcelas === 1);
    e = E([['2026-12-01', 10]], 31, '2026-12-01', [['2026-11-30', 25]]);
    t('fechamento 31, dia seguinte (01/12): desde 30/11; parcela de 30/11 entra: 10 + 25', e.desde === '2026-11-30' && e.valor === 35 && e.parcelas === 1);
    e = E([['2026-11-29', 5]], 31, '2026-11-29', [['2026-10-31', 11]]);
    t('fechamento 31, dia 29/11 ainda não é fechamento: não desconta nada de hoje', e.desde === '2026-10-31' && e.valor === 16 && e.parcelas === 1);
    e = E([['2027-02-28', 15]], 31, '2027-02-28', [['2027-01-31', 60], ['2027-02-28', 15]]);
    t('fechamento 31 em fevereiro (28 dias): hoje 28/02 é fechamento; 15 + 60 − 15 = 60', e.desde === '2027-01-31' && e.valor === 60 && e.parcelas === 1);
    e = E([['2027-03-01', 4]], 31, '2027-03-01', [['2027-02-28', 15]]);
    t('fechamento 31, 01/03 depois de fevereiro: desde 28/02; 4 + 15', e.desde === '2027-02-28' && e.valor === 19 && e.parcelas === 1);
    e = E([['2028-02-29', 15]], 31, '2028-02-29', [['2028-01-31', 60], ['2028-02-29', 15]]);
    t('fechamento 31 em fevereiro bissexto (29): hoje 29/02 é fechamento', e.desde === '2028-01-31' && e.valor === 60 && e.parcelas === 1);
    e = E([['2028-02-28', 15]], 31, '2028-02-28', [['2028-01-31', 60], ['2028-02-28', 15]]);
    t('fechamento 31, 28/02 de ano bissexto não é fechamento: não desconta; 15 + 60', e.desde === '2028-01-31' && e.valor === 75);
    e = E([['2026-12-31', 7]], 31, '2026-12-31', [['2026-11-30', 40], ['2026-12-31', 7]]);
    t('fechamento 31 em dezembro: hoje 31/12 é fechamento; desde 30/11; 7 + 40 − 7 = 40', e.desde === '2026-11-30' && e.valor === 40 && e.parcelas === 1);

    /* virada de ano */
    e = E([['2027-01-10', 10]], 10, '2027-01-10', [['2026-12-10', 90], ['2027-01-10', 10]]);
    t('virada de ano, hoje é o fechamento (10/01): desde 10/12; 10 + 90 − 10 = 90', e.desde === '2026-12-10' && e.valor === 90 && e.parcelas === 1);
    e = E([['2026-12-20', 5]], 10, '2027-01-03', [['2026-12-10', 90]]);
    t('virada de ano, 03/01: desde 10/12; 5 + 90', e.desde === '2026-12-10' && e.valor === 95 && e.parcelas === 1);
    e = E([['2027-01-01', 5]], 1, '2027-01-01', [['2026-12-01', 20], ['2027-01-01', 5]]);
    t('fechamento dia 1, hoje 01/01: desde 01/12; 5 + 20 − 5 = 20', e.desde === '2026-12-01' && e.valor === 20 && e.parcelas === 1);

    /* parcela negativa (estorno de parcela), mínimo 0 */
    e = E([['2026-11-06', 50]], 5, '2026-11-09', [['2026-11-05', -30]]);
    t('estorno de parcela no fechamento desconta: 50 − 30 = 20, 1 parcela', e.valor === 20 && e.parcelas === 1);
    e = E([['2026-11-06', 10]], 5, '2026-11-09', [['2026-11-05', -500]]);
    t('estorno maior que o total: mínimo 0, mas a parcela é contada', e.valor === 0 && e.parcelas === 1);
    e = E([['2026-11-06', 100], ['2026-11-06', -30]], 5, '2026-11-09', [['2026-11-06', -30]]);
    t('estorno de parcela em outro dia já está em movs: não conta de novo (70)', e.valor === 70 && e.parcelas === 0);

    /* entradas inválidas */
    t('sem dia de fechamento ou data ruim: não estima, com ou sem pm', E([], null, '2026-11-09', [['2026-11-05', 1]]) === null && E([], 0, '2026-11-09', []) === null && E([], 32, '2026-11-09', []) === null && E([], 5, 'ontem', []) === null && E([], 5, undefined, []) === null);
    t('movs ausente: estima só com pm', E(undefined, 5, '2026-11-09', [['2026-11-05', 12]]).valor === 12 && E(null, 5, '2026-11-09', null).valor === 0);
    t('o resultado traz exatamente valor, desde e parcelas', eq(Object.keys(E([], 5, '2026-11-09', [])).sort(), ['desde', 'parcelas', 'valor']));
  }

  /* ===== 2. estimarFatura: sem pm é idêntico ao jeito antigo (propriedade, semente fixa) ===== */
  {
    const antigo = (movs, fecha, hoje) => { if (!(fecha >= 1 && fecha <= 31)) return null; const desde = Real.fechamentoAnterior(fecha, hoje); let s = 0; (movs || []).forEach(m => { if (m[0] > desde && m[0] <= hoje) s += m[1]; }); return { valor: Math.round(Math.max(s, 0) * 100) / 100, desde }; };
    const rnd = prng(20261112), n = 4000;
    let iguais = 0, semParcela = 0, totalComMovs = 0;
    for (let i = 0; i < n; i++) {
      const fecha = 1 + Math.floor(rnd() * 31), hoje = somaDias('2026-01-01', Math.floor(rnd() * 1100));
      const movs = []; const q = Math.floor(rnd() * 13);
      for (let k = 0; k < q; k++) movs.push([somaDias(hoje, Math.floor(rnd() * 90) - 55), Math.round((rnd() * 400 - 60) * 100) / 100]);
      const ref = antigo(movs, fecha, hoje), a3 = E(movs, fecha, hoje);
      const v = [E(movs, fecha, hoje, undefined), E(movs, fecha, hoje, []), E(movs, fecha, hoje, null), E(movs, fecha, hoje, {}.nada)];
      const ok = a3.valor === ref.valor && a3.desde === ref.desde && a3.parcelas === 0 && v.every(x => x.valor === a3.valor && x.desde === a3.desde && x.parcelas === 0);
      if (ok) iguais++;
      if (q) totalComMovs++;
      if (a3.parcelas === 0) semParcela++;
    }
    t('propriedade (4000 casos): sem pm, vazio ou nulo, valor e desde idênticos ao cálculo antigo de 3 argumentos e parcelas 0', iguais === n && semParcela === n && totalComMovs > 3000, iguais + '/' + n);

    /* com pm: parcelas em dias que não são nem o fechamento nem o dia de hoje de fechamento não mudam nada; modelo independente para o resto */
    const rnd2 = prng(7777);
    let modeloOk = 0, neutroOk = 0, comParcelas = 0, comDesconto = 0;
    for (let i = 0; i < n; i++) {
      const fecha = 1 + Math.floor(rnd2() * 31), hoje = somaDias('2026-01-01', Math.floor(rnd2() * 1100)), desde = Real.fechamentoAnterior(fecha, hoje);
      const fechaHoje = Real.fechamentoAnterior(fecha, somaDias(hoje, 1)) === hoje;   // amanhã o último fechamento é hoje: logo hoje é dia de fechamento
      const movs = [], pm = []; const q = Math.floor(rnd2() * 10);
      for (let k = 0; k < q; k++) {
        const sorte = rnd2(), dia = sorte < 0.25 ? hoje : sorte < 0.5 ? desde : somaDias(hoje, Math.floor(rnd2() * 90) - 50);
        const it = [dia, Math.round((rnd2() * 300 - 40) * 100) / 100];
        if (rnd2() < 0.5) pm.push(it);
        if (it[0] !== desde || rnd2() < 0.5) movs.push(it);   // parcelas estão dentro de movs, no dia do fechamento só às vezes
      }
      const a3 = E(movs, fecha, hoje), a4 = E(movs, fecha, hoje, pm);
      const noFech = pm.filter(m => m[0] === desde), noHoje = pm.filter(m => m[0] === hoje && fechaHoje && m[0] !== desde);
      const bruto = semMin(movs, desde, hoje) + noFech.reduce((s, m) => s + m[1], 0) - noHoje.reduce((s, m) => s + m[1], 0);
      if (a4.valor === Math.round(Math.max(bruto, 0) * 100) / 100 && a4.parcelas === noFech.length && a4.desde === desde) modeloOk++;
      /* só parcelas fora do fechamento e fora de "hoje de fechamento": nada muda */
      const pmNeutro = pm.filter(m => m[0] !== desde && !(fechaHoje && m[0] === hoje));
      const a5 = E(movs, fecha, hoje, pmNeutro);
      if (a5.valor === a3.valor && a5.parcelas === 0) neutroOk++;
      if (noFech.length) comParcelas++;
      if (noHoje.length) comDesconto++;
    }
    t('propriedade (4000 casos): valor e parcelas batem com o modelo (soma de movs no intervalo + pm no fechamento − pm de hoje se for fechamento)', modeloOk === n, modeloOk + '/' + n);
    t('propriedade: parcelas fora do fechamento (e fora de hoje, quando hoje fecha) nunca mudam o resultado', neutroOk === n, neutroOk + '/' + n);
    t('propriedade: o sorteio exercitou parcelas no fechamento e descontos de hoje', comParcelas > 500 && comDesconto > 20, comParcelas + ' / ' + comDesconto);
  }
  function semMin(movs, desde, hoje) { let s = 0; movs.forEach(m => { if (m[0] > desde && m[0] <= hoje) s += m[1]; }); return s; }

  /* ===== 3. instantaneo: a lista pm ===== */
  {
    const PARCS = [
      mov('v1', 'crA', '2026-11-05', 100, 'DEBIT', { parc: P(2, 5) }),          // válida
      mov('v2', 'crA', '2026-11-05', 30, 'DEBIT', { parc: P(1, 1) }),           // válida, 1 de 1
      mov('v3', 'crA', '2026-11-05', 20, 'DEBIT', { parc: P(120, 120) }),       // válida, limite de 120
      mov('v4', 'crA', '2026-11-05', 15, 'DEBIT', { parc: P(1, 120) }),         // válida
      mov('e1', 'crA', '2026-11-05', 11, 'CREDIT', { parc: P(3, 6) })];         // estorno de parcela
    const r = B.instantaneo(RESP(PARCS), AG, []), sn = r.snap;
    t('pm: guarda só [data, valor com sinal] das parcelas válidas, estorno de parcela negativo', r.ok && eq(sn.pm, { crA: [['2026-11-05', 100], ['2026-11-05', 30], ['2026-11-05', 20], ['2026-11-05', 15], ['2026-11-05', -11]] }));
    t('pm: movs continua com as parcelas também (versão antiga estima como antes)', eq(sn.movs, sn.pm));
    t('foto: tem pm mesmo sem nenhuma parcela, como objeto vazio', eq(B.instantaneo(RESP([mov('a', 'crA', '2026-11-06', 5)]), AG).snap.pm, {}) && eq(B.instantaneo(RESP([]), AG).snap.pm, {}));

    const RUINS = [P(0, 5), P(3, 2), P(1, 121), P(1.5, 3), P(1, 3.5), { n: '1', de: '3' }, { n: 1 }, { de: 3 }, { n: NaN, de: 3 }, { n: 1, de: Infinity }, P(-1, 3), P(1, 0), 'x', 5, null, undefined, [], [1, 3], true, {}];
    const ruins = RUINS.map((p, i) => mov('r' + i, 'crA', '2026-11-0' + (1 + (i % 8)), 10 + i, 'DEBIT', { parc: p }));
    const rr = B.instantaneo(RESP(ruins), AG).snap;
    t('parc inválido (n=0, de<n, de>120, não inteiro, texto, faltando, nulo, lista, vazio) fica fora de pm', eq(rr.pm, {}), JSON.stringify(rr.pm));
    t('parc inválido continua em movs, todos os ' + RUINS.length, rr.movs.crA.length === RUINS.length);
    t('parc inválido: movs igual ao de uma resposta sem nenhum parc', eq(rr.movs, B.instantaneo(RESP(ruins.map(m => { const c = Object.assign({}, m); delete c.parc; return c; })), AG).snap.movs));
    t('limites da regra de parcela: n=1,de=120 vale; n=1,de=121 não; n=de vale; n=de+1 não', B.instantaneo(RESP([mov('a', 'crA', '2026-11-05', 1, 'DEBIT', { parc: P(1, 120) })]), AG).snap.pm.crA.length === 1 && !B.instantaneo(RESP([mov('a', 'crA', '2026-11-05', 1, 'DEBIT', { parc: P(1, 121) })]), AG).snap.pm.crA && !B.instantaneo(RESP([mov('a', 'crA', '2026-11-05', 1, 'DEBIT', { parc: P(7, 6) })]), AG).snap.pm.crA && B.instantaneo(RESP([mov('a', 'crA', '2026-11-05', 1, 'DEBIT', { parc: P(7, 7) })]), AG).snap.pm.crA.length === 1);

    /* pagamento da fatura: fora dos dois, mesmo com parc */
    const pag = [mov('p1', 'crA', '2026-11-05', 800, 'CREDIT', { cat: 'Credit card payment', parc: P(1, 3) }), mov('p2', 'crA', '2026-11-05', 40, 'DEBIT', { cat: ' credit card payment ', parc: P(2, 3) }), mov('ok', 'crA', '2026-11-05', 9, 'DEBIT', { cat: 'Shopping', parc: P(1, 2) })];
    const rp = B.instantaneo(RESP(pag), AG).snap;
    t('categoria de pagamento da fatura fica fora de movs e de pm, mesmo com parc válido', eq(rp.pm, { crA: [['2026-11-05', 9]] }) && eq(rp.movs, { crA: [['2026-11-05', 9]] }));
    const neutroNaoPag = B.instantaneo(RESP([mov('n1', 'crA', '2026-11-05', 50, 'DEBIT', { cat: 'Same person transfer', parc: P(1, 2) })]), AG).snap;
    t('outra categoria neutra (não é pagamento) continua em movs e em pm', eq(neutroNaoPag.movs, { crA: [['2026-11-05', 50]] }) && eq(neutroNaoPag.pm, { crA: [['2026-11-05', 50]] }));

    /* sinal invertido pelo dono */
    const inv = B.instantaneo(RESP(PARCS.concat([mov('b1', 'crB', '2026-11-05', 60, 'DEBIT', { parc: P(1, 2) })])), AG, ['crA']).snap;
    t('inversão vale para pm e movs do cartão marcado, e só dele', eq(inv.pm.crA, [['2026-11-05', -100], ['2026-11-05', -30], ['2026-11-05', -20], ['2026-11-05', -15], ['2026-11-05', 11]]) && eq(inv.pm.crA, inv.movs.crA) && eq(inv.pm.crB, [['2026-11-05', 60]]) && eq(inv.movs.crB, [['2026-11-05', 60]]));

    /* contas que não são cartão, ou que não existem */
    const fora = B.instantaneo(RESP([mov('c1', 'ccA', '2026-11-05', 33, 'DEBIT', { parc: P(1, 2) }), mov('c2', 'zzz', '2026-11-05', 33, 'DEBIT', { parc: P(1, 2) }), mov('c3', 'crA', '2026-11-05', 1, 'DEBIT', { parc: P(1, 2) })]), AG).snap;
    t('parcela em conta corrente ou em conta que não existe não entra em pm', eq(Object.keys(fora.pm), ['crA']) && !('ccA' in fora.movs) && !('zzz' in fora.pm));

    /* movimentos inválidos não viram parcela */
    const mal = [mov('d1', 'crA', 'ontem', 5, 'DEBIT', { parc: P(1, 2) }), mov('d2', 'crA', '2026-11-05', '5', 'DEBIT', { parc: P(1, 2) }), mov('d3', 'crA', '2026-11-05', 5, 'OUTRO', { parc: P(1, 2) }), mov('d4', 'crA', '2026-11-05', NaN, 'DEBIT', { parc: P(1, 2) }), mov('d5', 'crA', '2026-02-30', 5, 'DEBIT', { parc: P(1, 2) }), null, 'x', mov('ok', 'crA', '2026-11-05', 4, 'DEBIT', { parc: P(1, 2) })];
    t('movimento com data, valor ou tipo ruim, ou nem objeto, não vira parcela', eq(B.instantaneo(RESP(mal), AG).snap.pm, { crA: [['2026-11-05', 4]] }));
    t('valor da parcela arredondado em centavos, módulo e sinal pelo tipo', eq(B.instantaneo(RESP([mov('q1', 'crA', '2026-11-05', -12.345, 'DEBIT', { parc: P(1, 2) }), mov('q2', 'crA', '2026-11-05', 7.004, 'CREDIT', { parc: P(1, 2) })]), AG).snap.pm.crA, [['2026-11-05', 12.35], ['2026-11-05', -7]]));

    /* teto de 400 por conta */
    const mil = []; for (let i = 0; i < 450; i++) mil.push(mov('x' + i, 'crA', '2026-11-05', i + 1, 'DEBIT', { parc: P(1, 2) }));
    for (let i = 0; i < 5; i++) mil.push(mov('y' + i, 'crB', '2026-11-05', 1, 'DEBIT', { parc: P(1, 2) }));
    const cap = B.instantaneo(RESP(mil), AG).snap;
    t('teto de 400 por cartão em pm e em movs, e os primeiros são os que ficam; outro cartão tem o seu próprio teto', cap.pm.crA.length === 400 && cap.movs.crA.length === 400 && cap.pm.crA[0][1] === 1 && cap.pm.crA[399][1] === 400 && cap.pm.crB.length === 5);
    const antesParc = []; for (let i = 0; i < 400; i++) antesParc.push(mov('s' + i, 'crA', '2026-11-06', 1));
    antesParc.push(mov('p9', 'crA', '2026-11-05', 77, 'DEBIT', { parc: P(1, 2) }));
    const cap2 = B.instantaneo(RESP(antesParc), AG).snap;
    t('movs cheio (400 compras): a parcela seguinte fica fora de movs (como antes) mas entra em pm, que tem o seu teto', cap2.movs.crA.length === 400 && cap2.movs.crA.every(m => m[1] === 1) && eq(cap2.pm, { crA: [['2026-11-05', 77]] }));

    /* acrescentar parc nunca muda movs: propriedade */
    const rnd = prng(424242); let iguais = 0, pmSub = 0; const N = 300;
    for (let i = 0; i < N; i++) {
      const lista = [], sem = [];
      const q = Math.floor(rnd() * 30);
      for (let k = 0; k < q; k++) {
        const conta = ['crA', 'crB', 'ccA', 'zzz'][Math.floor(rnd() * 4)], data = rnd() < 0.1 ? 'lixo' : somaDias('2026-10-01', Math.floor(rnd() * 40));
        const base = mov('m' + k, conta, data, Math.round(rnd() * 50000) / 100, rnd() < 0.7 ? 'DEBIT' : 'CREDIT', { cat: ['Shopping', 'Credit card payment', null, 'Groceries'][Math.floor(rnd() * 4)] });
        sem.push(base);
        const p = rnd() < 0.5 ? P(1 + Math.floor(rnd() * 10), 10 + Math.floor(rnd() * 120)) : [P(0, 3), 'x', null, P(2, 1.5)][Math.floor(rnd() * 4)];
        lista.push(Object.assign({}, base, { parc: p }));
      }
      const inversoes = rnd() < 0.5 ? ['crA'] : [];
      const a = B.instantaneo(RESP(lista), AG, inversoes).snap, b = B.instantaneo(RESP(sem), AG, inversoes).snap;
      if (eq(a.movs, b.movs) && eq(a.contas, b.contas)) iguais++;
      const sub = Object.keys(a.pm).every(k => a.pm[k].every(m => a.movs[k].some(x => x[0] === m[0] && x[1] === m[1]) || a.movs[k].length >= 400));
      if (sub) pmSub++;
    }
    t('propriedade (300 respostas): com ou sem parc nas entradas, movs e contas ficam idênticos', iguais === N, iguais + '/' + N);
    t('propriedade: todo item de pm também está em movs', pmSub === N, pmSub + '/' + N);

    /* a ponte manda parc cru: instantaneo lê j.dados.movs, não a saída de validarResposta */
    const bruto = RESP(PARCS);
    t('validarResposta descarta parc, mas o app chama instantaneo com a resposta crua (r.j): a foto tem pm', !('parc' in B.validarResposta(bruto).dados.movs[0]) && B.instantaneo(bruto, AG).snap.pm.crA.length === 5 && eq(B.instantaneo(B.validarResposta(bruto), AG).ok, false));
  }

  /* ===== 4. sanBanco: pm ===== */
  {
    const PARCS = [mov('v1', 'crA', '2026-11-05', 100, 'DEBIT', { parc: P(2, 5) }), mov('v2', 'crA', '2026-11-05', 30, 'CREDIT', { parc: P(1, 2) }), mov('c', 'crA', '2026-11-07', 5), mov('b1', 'crB', '2026-11-05', 60, 'DEBIT', { parc: P(1, 2) })];
    const sn = B.instantaneo(RESP(PARCS), AG).snap;
    t('sanBanco aceita a foto com pm como veio (ida e volta idêntica)', eq(Seg.sanBanco(sn), sn) && eq(Seg.sanBanco(sn).pm, { crA: [['2026-11-05', 100], ['2026-11-05', -30]], crB: [['2026-11-05', 60]] }));
    t('sanBanco devolve cópias: mudar o resultado não muda a foto', (() => { const s = Seg.sanBanco(sn); s.pm.crA[0][1] = 1; s.pm.crA.push(['2026-11-05', 1]); return sn.pm.crA[0][1] === 100 && sn.pm.crA.length === 2; })());
    const sem = clone(sn); delete sem.pm;
    t('sem pm na foto: pm vira objeto vazio e o resto fica igual', eq(Seg.sanBanco(sem).pm, {}) && eq(Seg.sanBanco(sem).movs, sn.movs));
    t('pm que não é objeto (nulo, lista, texto, número, booleano) vira {}', [null, [], [['2026-11-05', 1]], 'x', 5, true].every(v => { const c = clone(sn); c.pm = v; return eq(Seg.sanBanco(c).pm, {}); }));

    const ruim = clone(sn);
    ruim.pm.crA = [['2026-11-05', 1], ['2026-11-05', 2, 3], ['2026-11-05'], [], ['ontem', 4], ['2026-02-30', 5], ['2026-13-01', 5], ['2026-11-05', NaN], ['2026-11-05', null], ['2026-11-05', '7'], ['2026-11-05', 1e15], ['2026-11-05', -1e15], 'x', 5, null, { 0: '2026-11-05', 1: 9, length: 2 }, [20261105, 5], ['2026-11-06', 0], ['2026-11-07', -8.5]];
    ruim.pm.ccA = [['2026-11-05', 1]]; ruim.pm.zzz = [['2026-11-05', 1]]; ruim.pm.crB = 'nao é lista'; ruim.pm['__proto__x'] = [['2026-11-05', 1]];
    const s = Seg.sanBanco(ruim);
    t('pm malformado: fica só [data válida, número finito] com exatamente 2 elementos', eq(s.pm.crA, [['2026-11-05', 1], ['2026-11-06', 0], ['2026-11-07', -8.5]]), JSON.stringify(s.pm.crA));
    t('pm: chave de conta corrente, de conta desconhecida ou valor que não é lista fica fora', eq(Object.keys(s.pm), ['crA']) && !('ccA' in s.pm) && !('zzz' in s.pm) && !('crB' in s.pm));
    const inf = clone(sn); inf.pm.crA = [['2026-11-05', 1]]; inf.pm.crA.push(['2026-11-05', Infinity], ['2026-11-05', -Infinity], ['2026-11-05', NaN]);   // objetos de verdade, sem passar por JSON
    t('pm: Infinity, -Infinity e NaN de verdade (sem JSON) são descartados', eq(Seg.sanBanco(inf).pm.crA, [['2026-11-05', 1]]));

    /* prototype pollution: __proto__ como chave própria vinda de JSON */
    const pol = JSON.parse(JSON.stringify(sn).replace(/"pm":\{/, '"pm":{"__proto__":[["2026-11-05",1]],"constructor":[["2026-11-05",2]],"toString":[["2026-11-05",3]],'));
    const sp = Seg.sanBanco(pol);
    t('chave __proto__ (própria, vinda de JSON) em pm é ignorada; ninguém ganha propriedade herdada', Object.prototype.hasOwnProperty.call(pol.pm, '__proto__') && !Object.prototype.hasOwnProperty.call(sp.pm, '__proto__') && !Object.prototype.hasOwnProperty.call(sp.pm, 'constructor') && !Object.prototype.hasOwnProperty.call(sp.pm, 'toString') && Object.getPrototypeOf(sp.pm) === Object.prototype && eq(Object.keys(sp.pm).sort(), ['crA', 'crB']) && ({}).polluido === undefined && ({})[0] === undefined);
    const pol2 = JSON.parse('{"v":1,"em":1,"contas":[{"id":"crA","tipo":"CREDIT","nome":"C","saldo":1}],"inv":[],"ip":false,"movs":{},"pm":{"__proto__":{"polluido":1},"crA":[["2026-11-05",1]]}}');
    const sp2 = Seg.sanBanco(pol2);
    t('pm com __proto__ apontando para objeto: nada vaza para Object.prototype', ({}).polluido === undefined && eq(sp2.pm, { crA: [['2026-11-05', 1]] }));
    const idPerigoso = clone(sn); idPerigoso.contas.push({ id: '__proto__', tipo: 'CREDIT', nome: 'x', saldo: 1 }); idPerigoso.pm = JSON.parse('{"__proto__":[["2026-11-05",1]],"crA":[["2026-11-05",2]]}');
    t('conta CREDIT com id __proto__ nem entra nas contas; o pm dela também não', !Seg.sanBanco(idPerigoso).contas.some(c => c.id === '__proto__') && eq(Seg.sanBanco(idPerigoso).pm, { crA: [['2026-11-05', 2]] }));

    /* teto de 400 */
    const gr = clone(sn); gr.pm.crA = []; for (let i = 0; i < 450; i++) gr.pm.crA.push(['2026-11-05', i + 1]);
    const sg = Seg.sanBanco(gr);
    t('pm: no máximo 400 itens por cartão, os 400 primeiros', sg.pm.crA.length === 400 && sg.pm.crA[0][1] === 1 && sg.pm.crA[399][1] === 400);
    const gr2 = clone(sn); gr2.pm.crA = []; for (let i = 0; i < 405; i++) gr2.pm.crA.push(i < 3 || i >= 400 ? ['ruim', 1] : ['2026-11-05', i]);
    t('pm: o teto vale antes do filtro (como movs): 400 olhados, 3 ruins no começo, 397 ficam', Seg.sanBanco(gr2).pm.crA.length === 397);
    t('movs não mudou: mesma regra e mesmo teto de antes', (() => { const c = clone(sn); c.movs.crA = []; for (let i = 0; i < 450; i++) c.movs.crA.push(['2026-11-05', i]); c.movs.ccA = [['2026-11-05', 1]]; const r = Seg.sanBanco(c); return r.movs.crA.length === 400 && !('ccA' in r.movs); })());
    t('pm tem de ser lido do pm e não de movs (movs vazio, pm cheio, e o contrário)', (() => { const c = clone(sn); c.movs = {}; const r = Seg.sanBanco(c); const d = clone(sn); d.pm = {}; const r2 = Seg.sanBanco(d); return eq(r.movs, {}) && r.pm.crA.length === 2 && eq(r2.pm, {}) && r2.movs.crA.length === 3; })());
    t('sanBanco: uma foto antiga de pluggy-6 (sem pm) ainda é aceita e vira pm {}', (() => { const antiga = { v: 1, em: AG, ip: true, contas: [{ id: 'crA', tipo: 'CREDIT', nome: 'Cartão', saldo: 9, atu: null, lim: 100, disp: 90 }], inv: [], movs: { crA: [['2026-11-06', 5]] } }; const r = Seg.sanBanco(antiga); return !!r && eq(r.pm, {}) && eq(r.movs, { crA: [['2026-11-06', 5]] }); })());

    /* a foto com pm passa pela sincronização */
    const est = { lanc: [], pagos: {}, tetos: {}, metas: [], taxa: 0.8, banco: sn, reserva: [], liga: { crA: 'c1' } };
    const itens = TFSync.atualizar(est, {}, 1000), limpo = Seg.limparItens(itens);
    t('sincronização: o item banco leva o pm e limparItens não descarta', limpo.descartados === 0 && eq(limpo.itens.banco.v.pm, sn.pm));

    /* simulação de versão antiga: a foto nova perde pm; o cálculo volta ao de antes */
    const real = REAL();
    const fotoNova = clone(sn); fotoNova.contas = fotoNova.contas.filter(c => c.id !== 'crB');
    fotoNova.movs.crA = [['2026-11-06', 40], ['2026-11-08', 100], ['2026-11-05', 70]]; fotoNova.pm.crA = [['2026-11-05', 200], ['2026-11-06', 40]];
    const fotoAntiga = clone(fotoNova); delete fotoAntiga.pm;
    const dN = Real.derivar(real, {}, ctxB(fotoNova)).cartoes[0], dA = Real.derivar(real, {}, ctxB(fotoAntiga)).cartoes[0];
    const dSan = Real.derivar(real, {}, ctxB(Seg.sanBanco(fotoAntiga))).cartoes[0];
    const velho = E(fotoNova.movs.crA, 5, '2026-11-09');
    t('versão antiga (sem pm): a fatura é a de antes (40 + 100 = 140), igual ao estimarFatura de 3 argumentos', dA.fatura === 140 && dA.fatura === velho.valor && dA.origem.fatura.desde === velho.desde);
    t('versão antiga sem pm: sem parcelas lançadas (0), nenhuma quebra; a foto saneada dá o mesmo', dA.origem.fatura.parcelas === 0 && dSan.fatura === 140 && dSan.origem.fatura.parcelas === 0);
    t('versão nova com pm: 140 + 200 = 340 e 2 parcelas... a de 06/11 está em movs; só a de 05/11 conta: 1 parcela', dN.fatura === 340 && dN.origem.fatura.parcelas === 1);
  }

  /* ===== 5. derivar: de ponta a ponta ===== */
  {
    const real = REAL();
    const movs = { crA: [['2026-11-08', 100], ['2026-11-06', 40], ['2026-11-07', -15]] };
    const mk = (m, p) => ({ v: 1, em: AG, ip: false, contas: [{ id: 'ccA', tipo: 'BANK', nome: 'Banco Alfa', saldo: 600, atu: hAtras(5) }, { id: 'crA', tipo: 'CREDIT', nome: 'Cartão Alfa', saldo: 900, atu: hAtras(5), lim: 4000, disp: 3100 }], inv: [], movs: m, pm: p });
    const c0 = Real.derivar(real, {}, ctxB(mk(movs, {}))).cartoes[0];
    t('sem parcelas: fatura 100 + 40 − 15 = 125, 0 parcelas lançadas, compromisso futuro 900 − 125', c0.fatura === 125 && c0.origem.fatura.parcelas === 0 && c0.parcelasFuturas === 775 && c0.origem.fatura.desde === '2026-11-05');
    const c1 = Real.derivar(real, {}, ctxB(mk(movs, { crA: [['2026-11-05', 150], ['2026-11-05', 50], ['2026-11-06', 40]] }))).cartoes[0];
    t('com parcelas no fechamento: fatura 125 + 200 = 325, 2 parcelas, compromisso futuro 900 − 325', c1.fatura === 325 && c1.origem.fatura.parcelas === 2 && c1.parcelasFuturas === 575 && c1.origem.fatura.t === 'estimado');
    const c2 = Real.derivar(real, {}, ctxB(mk(movs, null))).cartoes[0], c3 = Real.derivar(real, {}, ctxB(mk(movs, undefined))).cartoes[0];
    t('foto sem pm ou com pm nulo: igual a antes e sem quebrar', c2.fatura === 125 && c3.fatura === 125 && c2.origem.fatura.parcelas === 0);
    const cH = Real.derivar(real, {}, ctxB(mk(movs, { crA: [['2026-11-05', 50]] }), { hojeISO: '2026-11-05' })).cartoes[0];
    t('hoje é o fechamento (dia 5): desde 05/10; parcelas de 05/10 entram (nenhuma); as de hoje saem. Sem movs de hoje, a parcela de hoje em pm desconta 50 → 0', cH.origem.fatura.desde === '2026-10-05' && cH.fatura === 0 && cH.origem.fatura.parcelas === 0);
    const cH2 = Real.derivar(real, {}, ctxB(mk({ crA: [['2026-10-20', 80], ['2026-11-05', 50]] }, { crA: [['2026-10-05', 300], ['2026-11-05', 50]] }), { hojeISO: '2026-11-05' })).cartoes[0];
    t('hoje é o fechamento, de ponta a ponta: 80 + 50 + 300 − 50 = 380, 1 parcela', cH2.fatura === 380 && cH2.origem.fatura.parcelas === 1);
    const semFecha = REAL(); delete semFecha.cartao.fechamento_dia;
    const cS = Real.derivar(semFecha, {}, ctxB(mk(movs, { crA: [['2026-11-05', 1]] }))).cartoes[0];
    t('sem dia de fechamento: não estima (fatura do arquivo, origem.fatura nula), mesmo com pm', cS.origem.fatura === null && cS.fatura === 300);

    /* dois cartões do banco, cada um com o seu pm */
    const dois = REAL(); dois.cartoes_extra = [{ id: 'c2', nome: 'Cartão Segundo', limite: 1000, fechamento_dia: 20, vence_dia: 28, fatura: 0 }];
    const fd = { v: 1, em: AG, ip: false,
      contas: [{ id: 'ccA', tipo: 'BANK', nome: 'Banco Alfa', saldo: 600, atu: hAtras(5) }, { id: 'crA', tipo: 'CREDIT', nome: 'Cartão Alfa', saldo: 900, atu: hAtras(5), lim: 4000, disp: 3100 }, { id: 'crB', tipo: 'CREDIT', nome: 'Cartão Beta', saldo: 500, atu: hAtras(5), lim: 2000, disp: 1500 }],
      inv: [], movs: { crA: [['2026-11-06', 10]], crB: [['2026-11-07', 20]] }, pm: { crA: [['2026-11-05', 100]], crB: [['2026-10-20', 1000], ['2026-10-20', 2000]] } };
    const dd = Real.derivar(dois, {}, ctxB(fd, { liga: { crA: 'c1', crB: 'c2' } }));
    const [ca, cb] = dd.cartoes;
    t('dois cartões ligados: cada um usa o seu pm (A: dia 5, 10 + 100; B: dia 20, 20 + 3000)', ca.banco.id === 'crA' && cb.banco.id === 'crB' && ca.fatura === 110 && ca.origem.fatura.parcelas === 1 && ca.origem.fatura.desde === '2026-11-05' && cb.fatura === 3020 && cb.origem.fatura.parcelas === 2 && cb.origem.fatura.desde === '2026-10-20');
    const dd2 = Real.derivar(dois, {}, ctxB(fd, { liga: { crA: 'c2', crB: 'c1' } }));
    t('ligação trocada: o pm acompanha o cartão do banco, e o calendário é o do cartão do app (c1 dia 5 recebe crB: 20 e 0 parcelas; c2 dia 20 recebe crA: 10 e 0 parcelas)', dd2.cartoes[0].banco.id === 'crB' && dd2.cartoes[0].origem.fatura.desde === '2026-11-05' && dd2.cartoes[0].fatura === 20 && dd2.cartoes[0].origem.fatura.parcelas === 0 && dd2.cartoes[1].banco.id === 'crA' && dd2.cartoes[1].origem.fatura.desde === '2026-10-20' && dd2.cartoes[1].fatura === 10 && dd2.cartoes[1].origem.fatura.parcelas === 0);
    const ddSo = Real.derivar(dois, {}, ctxB(Object.assign(clone(fd), { pm: { crB: fd.pm.crB } }), { liga: { crA: 'c1', crB: 'c2' } }));
    t('pm só de um cartão: o outro fica com 0 parcelas', ddSo.cartoes[0].origem.fatura.parcelas === 0 && ddSo.cartoes[0].fatura === 10 && ddSo.cartoes[1].origem.fatura.parcelas === 2);
    t('derivar não altera a foto recebida (pm e movs)', (() => { const f = clone(fd), antes = JSON.stringify(f); Real.derivar(dois, {}, ctxB(f, { liga: { crA: 'c1', crB: 'c2' } })); return JSON.stringify(f) === antes; })());
    t('Real.derivar sem banco: cartão sem origem de fatura (nada de parcelas)', !Real.derivar(real, {}, ctxB(null)).cartoes[0].origem);
  }

  /* ===== 6. Tela do Cartão: texto das parcelas lançadas ===== */
  {
    const relogio = iso => w => { const Rr = w.Date, alvo = new Rr(iso).getTime(), d0 = Rr.now(), ag = () => alvo + (Rr.now() - d0); class D extends Rr { constructor(...x) { if (x.length) super(...x); else super(ag()); } static now() { return ag(); } } w.Date = D; };
    const RT = () => { const r = clone(FICTICIO); r._meta.as_of = '2026-11-08'; return r; };
    const agoraT = new Date('2026-11-10T12:00:00').getTime(), hT = n => new Date(agoraT - n * 36e5).toISOString();
    const SNAP = pm => ({ v: 1, em: agoraT, ip: true,
      contas: [{ id: 'ccA', tipo: 'BANK', nome: 'Banco Alfa', saldo: 1200, atu: hT(5) }, { id: 'crA', tipo: 'CREDIT', nome: 'Cartão Alfa', saldo: 900, atu: hT(5), lim: 4000, disp: 3100 }],
      inv: [{ nome: 'Reserva inventada', saldo: 5000, atu: hT(5) }], movs: { crA: [['2026-11-08', 100], ['2026-11-09', 20]] }, pm });
    const txt = A => A.$('main').textContent.replace(/\s+/g, ' ');
    const abre = async (pm, larg, tela) => { const A = await abrir({ tf_modo: 'real', tf_real: RT(), tf_bsnap: SNAP(pm) }, { antes: relogio('2026-11-10T12:00:00'), largura: larg }); await A.ir(tela || 'cartao'); return A; };
    const NOTA = /A fatura do banco pode ser um pouco maior/;
    for (const larg of [390, 1024]) {
      const n = larg + 'px: ';
      const A2 = await abre({ crA: [['2026-11-05', 40], ['2026-11-05', 60]] }, larg);
      t(n + 'Cartão: duas parcelas -> "compras depois de 05/11 e 2 parcelas lançadas em 05/11"', /estimada · compras depois de 05\/11 e 2 parcelas lançadas em 05\/11/.test(txt(A2)));
      t(n + 'Cartão: a frase das parcelas fica num trecho próprio, para poder quebrar de linha (junta, ela é cortada em 360 px e o Hoje ganha rolagem lateral em 900 px)', [...A2.d.querySelectorAll('.orig')].some(e => e.textContent.trim() === 'e 2 parcelas lançadas em 05/11') && ![...A2.d.querySelectorAll('.orig')].some(e => /compras depois/.test(e.textContent) && /parcelas/.test(e.textContent)));
      t(n + 'Cartão: a fatura soma as parcelas (100 + 20 + 40 + 60 = 220)', /Fatura atual \(estimada\)\s*R\$\s?220,00/.test(txt(A2)) && A2.w.eval('DEMO.cartoes[0].fatura') === 220);
      t(n + 'Cartão: a nota "A fatura do banco pode ser um pouco maior" aparece', NOTA.test(txt(A2)) && /A Confirmar/.test(txt(A2)));
      const A1 = await abre({ crA: [['2026-11-05', 40]] }, larg);
      t(n + 'Cartão: uma parcela -> singular "1 parcela lançada em 05/11"', /compras depois de 05\/11 e 1 parcela lançada em 05\/11/.test(txt(A1)) && !/1 parcelas/.test(txt(A1)));
      const A0 = await abre({}, larg);
      t(n + 'Cartão: zero parcelas -> só "compras depois de 05/11", sem texto de parcela', /estimada · compras depois de 05\/11/.test(txt(A0)) && !/parcelas? lançadas?/.test(txt(A0)) && !/ e 0 parcela/.test(txt(A0)));
      t(n + 'Cartão: zero parcelas mantém a nota da fatura do banco', NOTA.test(txt(A0)));
      const An = await abre(undefined, larg);
      t(n + 'Cartão: foto antiga sem pm: igual a zero parcelas, sem erro', /compras depois de 05\/11/.test(txt(An)) && !/parcelas? lançadas?/.test(txt(An)) && An.erros.length === 0);
      const Ah = await abre({ crA: [['2026-11-05', 40], ['2026-11-05', 60]] }, larg, 'hoje');
      if (larg >= 800) t(n + 'Hoje: o painel de limite também mostra as parcelas lançadas', /e 2 parcelas lançadas em 05\/11/.test(txt(Ah)));
      t(n + 'sem erro', A2.erros.length + A1.erros.length + A0.erros.length + Ah.erros.length === 0, [].concat(A2.erros, A1.erros, A0.erros, Ah.erros).join(' | '));
    }
    const Ad = await abrir({ tf_modo: 'real', tf_real: RT() }, { antes: relogio('2026-11-10T12:00:00'), largura: 390 }); await Ad.ir('cartao');
    t('sem banco ligado: nem texto de parcelas nem a nota', !NOTA.test(txt(Ad)) && !/parcelas? lançadas?/.test(txt(Ad)));
    const Ae = await abrir({ tf_modo: 'demo' }, { largura: 390 }); await Ae.ir('cartao');
    t('modo exemplo: nem texto de parcelas nem a nota', !NOTA.test(txt(Ae)) && !/parcelas? lançadas?/.test(txt(Ae)));
    /* a ligação explica as parcelas */
    const Am = await abre({ crA: [['2026-11-05', 40]] }, 1024, 'numeros');
    t('Meus números: o texto de ajuda dos cartões do banco cita as parcelas lançadas no dia do fechamento', /pelas parcelas lançadas no dia do fechamento/.test(Am.d.body.textContent.replace(/\s+/g, ' ')));
  }

  /* ===== 7. pluggy-8: parcelas do banco nas faturas seguintes à aberta ===== */
  {
    const PS = Real.parcelasSeguintes, JS = Real.juntarSerie, n = 'faturas seguintes: ';
    /* fechamento dia 5, hoje 09/11 (desde 05/11), arquivo de 01/11 */
    let p = PS([['2026-11-07', 100, 1, 3]], 5, '2026-11-09', '2026-11-01');
    t(n + 'compra nova em 3x (1 de 3, datada na compra): 100 nas 2 faturas seguintes', eq(p.todas, [100, 100]) && eq(p.novas, [100, 100]) && p.n === 1);
    p = PS([['2026-11-05', 50, 4, 6]], 5, '2026-11-09', '2026-11-01');
    t(n + 'parcela antiga (4 de 6, começou antes do arquivo): está em todas, não em novas', eq(p.todas, [50, 50]) && eq(p.novas, [0, 0]));
    p = PS([['2026-11-05', 50, 1, 2]], 5, '2026-11-09', '2026-11-01');
    t(n + '1 de 2 datada no fechamento, depois do arquivo: nova, 1 fatura', eq(p.todas, [50]) && eq(p.novas, [50]));
    p = PS([['2026-11-05', 50, 1, 2]], 5, '2026-11-09', '2026-11-05');
    t(n + 'começou no dia do arquivo: não é nova', eq(p.novas, [0]));
    p = PS([['2026-11-05', 50, 1, 2]], 5, '2026-11-09', '2026-11-04');
    t(n + 'começou um dia depois do arquivo: nova', eq(p.novas, [50]));
    p = PS([['2026-10-05', 80, 2, 5], ['2026-10-20', 80, 1, 5], ['2026-11-10', 80, 1, 5]], 5, '2026-11-09', '2026-01-01');
    t(n + 'parcela de fatura já fechada ou com data futura fica fora', eq(p.todas, []) && p.n === 0);
    p = PS([['2026-11-05', 70, 1, 3], ['2026-10-05', 40, 2, 4]], 5, '2026-11-05', '2026-01-01');
    t(n + 'hoje é dia de fechamento: vale a datada no fechamento anterior, não a datada hoje', eq(p.todas, [40, 40]) && p.n === 1);
    p = PS([['2026-11-07', -30, 1, 3]], 5, '2026-11-09', '2026-11-01');
    t(n + 'estorno parcelado desconta', eq(p.todas, [-30, -30]) && eq(p.novas, [-30, -30]));
    p = PS([['2026-11-07', 100, 1, 3], ['2026-11-05', 40, 2, 3], ['2026-11-06', 10.1, 1, 4], ['2026-11-06', 10.2, 1, 4]], 5, '2026-11-09', '2026-11-01');
    t(n + 'várias parcelas somam por fatura, com centavos certos', eq(p.todas, [160.3, 120.3, 20.3]) && eq(p.novas, [120.3, 120.3, 20.3]) && p.n === 4);
    t(n + 'sem dia de fechamento ou sem data de hoje: nada', PS([['2026-11-07', 100, 1, 3]], 0, '2026-11-09', '2026-11-01') === null && PS([['2026-11-07', 100, 1, 3]], 5, '', '2026-11-01') === null && PS([['2026-11-07', 100, 1, 3]], 32, '2026-11-09', '2026-11-01') === null);
    t(n + 'sem lista: zero parcelas', eq(PS(undefined, 5, '2026-11-09', '2026-11-01'), { todas: [], novas: [], n: 0 }));
    /* fechamento 31: a 1ª parcela de uma 2 de N datada em 31/03 é 28/02 */
    t(n + 'início em mês curto: 31/03 menos 1 mês = 28/02 (arquivo de 28/02: não é nova)', eq(PS([['2026-03-31', 10, 2, 3]], 31, '2026-04-10', '2026-02-28').novas, [0]));
    t(n + 'início em mês curto: arquivo de 27/02: é nova', eq(PS([['2026-03-31', 10, 2, 3]], 31, '2026-04-10', '2026-02-27').novas, [10]));
    t(n + 'início atravessa o ano: 3 de 5 em 05/01/2027 começou em 05/11/2026', eq(PS([['2027-01-05', 10, 3, 5]], 5, '2027-01-20', '2026-11-04').novas, [10, 10]) && eq(PS([['2027-01-05', 10, 3, 5]], 5, '2027-01-20', '2026-11-05').novas, [0, 0]));
    t(n + '120 de limite: 1 de 120 gera 119 faturas', PS([['2026-11-07', 1, 1, 120]], 5, '2026-11-09', '2026-11-01').todas.length === 119);

    /* mesMais e mesAberta: o mês em que a fatura aberta vence */
    const MA = Real.mesAberta, MM = Real.mesMais;
    t(n + 'mesMais: vira o ano para a frente e para trás', MM('2026-12', 1) === '2027-01' && MM('2026-01', -1) === '2025-12' && MM('2026-11', 0) === '2026-11' && MM('2026-11', 14) === '2028-01');
    t(n + 'aberta: fecha 5, vence 12, hoje 09/11: fecha em 05/12 e vence em dezembro', MA(5, 12, '2026-11-09') === '2026-12');
    t(n + 'aberta: hoje 03/11, antes do fechamento: vence em novembro', MA(5, 12, '2026-11-03') === '2026-11');
    t(n + 'aberta: hoje é o dia do fechamento: ainda é a que fecha hoje', MA(5, 12, '2026-11-05') === '2026-11' && MA(5, 12, '2026-11-06') === '2026-12');
    t(n + 'aberta: vencimento antes do dia do fechamento cai no mês seguinte', MA(20, 5, '2026-11-25') === '2027-01' && MA(20, 5, '2026-11-10') === '2026-12');
    t(n + 'aberta: vencimento no mesmo dia do fechamento: mês seguinte', MA(5, 5, '2026-11-09') === '2027-01');
    t(n + 'aberta: dezembro vira janeiro', MA(5, 12, '2026-12-09') === '2027-01');
    t(n + 'aberta: sem dia de vencimento, assume o mesmo mês do fechamento', MA(5, null, '2026-11-09') === '2026-12');
    t(n + 'aberta: sem fechamento ou sem data: nada', MA(0, 12, '2026-11-09') === null && MA(5, 12, '') === null);

    /* juntarSerie: por mês, só o que vem depois da fatura aberta */
    const SER = () => [{ mes: '2026-12', fatura_total: 200, parte_mae: 10 }, { mes: '2027-01', fatura_total: 100, parte_mae: 0 }];
    let s0 = SER(), s = JS(s0, { todas: [100, 100], novas: [100, 100] }, '2026-11');
    t(n + 'série: parcelas novas entram ao lado das antigas, no mês de cada fatura', eq(s, [{ mes: '2026-12', fatura_total: 200, parte_mae: 10, novas: 100 }, { mes: '2027-01', fatura_total: 100, parte_mae: 0, novas: 100 }]));
    t(n + 'série: a lista do arquivo não é alterada', eq(s0, SER()) && s[0] !== s0[0]);
    s = JS(SER(), { todas: [100, 100], novas: [100, 100] }, '2026-12');
    t(n + 'série: a linha do mês da fatura aberta sai (ela já é a fatura estimada); as parcelas vão para os meses depois dela', eq(s, [{ mes: '2027-01', fatura_total: 100, parte_mae: 0, novas: 100 }, { mes: '2027-02', fatura_total: 0, parte_mae: 0, novas: 100 }]));
    s = JS([{ mes: '2026-10', fatura_total: 1, parte_mae: 0 }, { mes: '2026-11', fatura_total: 2, parte_mae: 0 }].concat(SER()), { todas: [], novas: [] }, '2026-11');
    t(n + 'série: meses já passados do arquivo saem', eq(s, SER()));
    s = JS(SER(), { todas: [100, 100, 100, 100], novas: [100, 100, 100, 100] }, '2026-11');
    t(n + 'série: parcelas além do fim do arquivo ganham meses novos', s.length === 4 && eq(s.slice(2), [{ mes: '2027-02', fatura_total: 0, parte_mae: 0, novas: 100 }, { mes: '2027-03', fatura_total: 0, parte_mae: 0, novas: 100 }]));
    s = JS([], { todas: [9, 9], novas: [9, 9] }, '2026-12');
    t(n + 'série: arquivo sem faturas futuras: começa no mês depois da aberta, virando o ano', eq(s.map(f => f.mes), ['2027-01', '2027-02']) && s[0].novas === 9 && s[0].fatura_total === 0);
    s = JS(SER(), { todas: [260, 50], novas: [0, 0] }, '2026-11');
    t(n + 'série: o banco mostra mais que o arquivo: a diferença entra; menos que o arquivo: nada', s[0].novas === 60 && !('novas' in s[1]));
    s = JS(SER(), { todas: [350, 100], novas: [100, 0] }, '2026-11');
    t(n + 'série: vale o maior entre as novas e a diferença para o arquivo', s[0].novas === 150 && !('novas' in s[1]));
    s = JS(SER(), { todas: [-50], novas: [-50] }, '2026-11');
    t(n + 'série: nunca tira das parcelas antigas', eq(s, SER()));
    t(n + 'série: sem parcelas do banco (lista vazia ou nada), igual ao arquivo depois da aberta', eq(JS(SER(), { todas: [], novas: [] }, '2026-11'), SER()) && eq(JS(SER(), null, '2026-11'), SER()) && eq(JS(SER(), null, '2026-12'), SER().slice(1)) && eq(JS(SER(), null, '2027-01'), []));
    s = JS(SER(), { todas: [0, 0, 0, 7], novas: [0, 0, 0, 7] }, '2026-11');
    t(n + 'série: parcela num mês que o arquivo não tem, com um mês vazio no meio: vai para o mês certo', eq(s, SER().concat([{ mes: '2027-03', fatura_total: 0, parte_mae: 0, novas: 7 }])));
    s = JS([{ mes: '2027-01', fatura_total: 100, parte_mae: 0 }, { mes: '2026-12', fatura_total: 200, parte_mae: 10 }, { mes: '2027-01', fatura_total: 50.1, parte_mae: 5 }], { todas: [0, 10], novas: [0, 10] }, '2026-11');
    t(n + 'série: arquivo fora de ordem ou com mês repetido: sai em ordem, com o mês somado', eq(s, [{ mes: '2026-12', fatura_total: 200, parte_mae: 10 }, { mes: '2027-01', fatura_total: 150.1, parte_mae: 5, novas: 10 }]));
    s = JS([{ mes: '2026-12', fatura_total: 200, parte_mae: 0 }, { mes: '2027-02', fatura_total: 80, parte_mae: 0 }], { todas: [30, 30], novas: [30, 30] }, '2026-12');
    t(n + 'série: arquivo com mês faltando: a parcela não escorrega para a linha seguinte', eq(s, [{ mes: '2027-01', fatura_total: 0, parte_mae: 0, novas: 30 }, { mes: '2027-02', fatura_total: 80, parte_mae: 0, novas: 30 }]));

    /* instantaneo -> pn */
    const ms = [mov('a', 'crA', '2026-11-07', 90, 'DEBIT', { parc: P(1, 3) }), mov('b', 'crA', '2026-11-06', 40), mov('c', 'crA', '2026-11-05', 30, 'DEBIT', { parc: P(3, 3) }),
      mov('d', 'crA', '2026-11-06', 25, 'CREDIT', { parc: P(1, 2) }), mov('e', 'crB', '2026-11-06', 12, 'DEBIT', { parc: P(2, 10) }), mov('f', 'ccA', '2026-11-06', 12, 'DEBIT', { parc: P(2, 10) }),
      mov('g', 'crA', '2026-11-06', 500, 'CREDIT', { parc: P(1, 2), cat: 'Credit card payment' })];
    const foto = B.instantaneo(RESP(ms), AG, []).snap;
    t(n + 'foto: pn guarda data, valor com sinal, n e N só de parcela com seguintes', eq(foto.pn, { crA: [['2026-11-07', 90, 1, 3], ['2026-11-06', -25, 1, 2]], crB: [['2026-11-06', 12, 2, 10]] }));
    t(n + 'foto: a última parcela (3 de 3) fica em pm e fora de pn', foto.pm.crA.some(m => m[1] === 30) && !foto.pn.crA.some(m => m[1] === 30));
    t(n + 'foto: movs e pm iguais aos de antes', eq(foto.movs.crA, [['2026-11-07', 90], ['2026-11-06', 40], ['2026-11-05', 30], ['2026-11-06', -25]]) && eq(foto.pm.crA, [['2026-11-07', 90], ['2026-11-05', 30], ['2026-11-06', -25]]));
    t(n + 'foto: cartão com sinal invertido inverte pn', eq(B.instantaneo(RESP(ms), AG, ['crA']).snap.pn.crA, [['2026-11-07', -90, 1, 3], ['2026-11-06', 25, 1, 2]]));
    t(n + 'foto: sem parcelas, pn vazio', eq(B.instantaneo(RESP([mov('b', 'crA', '2026-11-06', 40)]), AG, []).snap.pn, {}));
    const muitos = []; for (let i = 0; i < 450; i++) muitos.push(mov('m' + i, 'crA', '2026-11-06', 1, 'DEBIT', { parc: P(1, 2) }));
    t(n + 'foto: no máximo 400 por cartão', B.instantaneo(RESP(muitos), AG, []).snap.pn.crA.length === 400);

    /* sanBanco */
    t(n + 'sanBanco: ida e volta igual', eq(Seg.sanBanco(clone(foto)), foto));
    const ruim = clone(foto); ruim.pn = { crA: [['2026-11-07', 90, 1, 3], ['2026-11-07', 90], ['2026-11-07', 90, 3, 3], ['2026-11-07', 90, 4, 3], ['2026-11-07', 90, 0, 3], ['2026-11-07', 90, 1.5, 3], ['2026-11-07', 90, 1, 121], ['2026-13-07', 90, 1, 3], ['2026-11-07', '90', 1, 3], ['2026-11-07', 90, 1, 3, 9], 'x', null, { 0: '2026-11-07' }], ccA: [['2026-11-07', 90, 1, 3]], zz: [['2026-11-07', 90, 1, 3]], crB: 'x' };
    t(n + 'sanBanco: só fica a parcela bem formada de cartão', eq(Seg.sanBanco(ruim).pn, { crA: [['2026-11-07', 90, 1, 3]] }));
    const semPn = clone(foto); delete semPn.pn;
    t(n + 'sanBanco: foto de versão antiga (sem pn) vira pn vazio', eq(Seg.sanBanco(semPn).pn, {}));
    const pnLista = clone(foto); pnLista.pn = [1, 2];
    t(n + 'sanBanco: pn que não é objeto vira vazio', eq(Seg.sanBanco(pnLista).pn, {}));

    /* derivar de ponta a ponta: arquivo de 01/11, fecha 5, vence 12, hoje 09/11 -> a fatura aberta vence em dezembro */
    const real = REAL(); real.faturas_futuras_parcelas_antigas = [{ mes: '2026-12', fatura_total: 200, parte_mae: 0 }, { mes: '2027-01', fatura_total: 120, parte_mae: 0 }];
    const antes = JSON.stringify(real), LG = { liga: { crA: 'c1', crB: 'nao' } };
    const d = Real.derivar(real, {}, ctxB(foto, LG)), c = d.cartoes[0];
    t(n + 'derivar: a série é o que vem depois da fatura aberta, com as parcelas do banco no mês certo (90 e -25 em janeiro; 90 em fevereiro)', c.mesAberta === '2026-12' && eq(c.serie, [{ mes: '2027-01', fatura_total: 120, parte_mae: 0, novas: 65 }, { mes: '2027-02', fatura_total: 0, parte_mae: 0, novas: 90 }]));
    t(n + 'derivar: o arquivo não é alterado', JSON.stringify(real) === antes);
    const dSem = Real.derivar(real, {}, ctxB(semPn, LG));
    t(n + 'derivar: foto sem pn (versão antiga): só as linhas do arquivo depois da aberta, sem parcelas novas', dSem.cartoes[0].mesAberta === '2026-12' && eq(dSem.cartoes[0].serie, [{ mes: '2027-01', fatura_total: 120, parte_mae: 0 }]));
    const dArq = Real.derivar(real, {}, ctxB(null));
    t(n + 'derivar: sem banco: a série é a do arquivo, como antes', dArq.cartoes[0].serie === real.faturas_futuras_parcelas_antigas && dArq.cartoes[0].mesAberta === undefined);
    t(n + 'derivar: cartão do banco não ligado: a série é a do arquivo', Real.derivar(real, {}, ctxB(foto, { liga: { crA: 'nao', crB: 'nao' } })).cartoes[0].serie === real.faturas_futuras_parcelas_antigas);
    const dAntes = Real.derivar(real, {}, ctxB(foto, Object.assign({}, LG, { hojeISO: '2026-11-03' })));
    t(n + 'derivar: antes do fechamento de novembro, a aberta vence em novembro e dezembro continua na série', dAntes.cartoes[0].mesAberta === '2026-11' && dAntes.cartoes[0].serie[0].mes === '2026-12' && dAntes.cartoes[0].serie[0].fatura_total === 200);
    const pj = Real.projetar(real, {}, {}), pjN = Real.projetar(real, {}, { futuras: [real.faturas_futuras_parcelas_antigas[0]].concat(c.serie) });
    const dif = i => Math.round((pj[i] - pjN[i]) * 100);
    t(n + 'projeção: as parcelas novas saem do saldo previsto no mês de cada fatura (janeiro 65, fevereiro 90)', dif(0) === 0 && dif(1) === 0 && dif(2) === 6500 && dif(3) === 15500 && dif(11) === 15500);
    const semDez = clone(real); semDez.faturas_futuras_parcelas_antigas[0].fatura_total = 0;
    const dSemDez = Real.derivar(semDez, {}, ctxB(foto, LG));
    t(n + 'projeção do app: a linha do arquivo do mês da fatura aberta continua contando no saldo previsto', eq(dSemDez.cartoes[0].serie, c.serie) && JSON.stringify(dSemDez) !== JSON.stringify(d));
    t(n + 'projeção do app: muda com as parcelas novas', JSON.stringify(d) !== JSON.stringify(dSem));

    /* tela do Cartão */
    const relogio = iso => w => { const Rr = w.Date, alvo = new Rr(iso).getTime(), d0 = Rr.now(), ag = () => alvo + (Rr.now() - d0); class D extends Rr { constructor(...x) { if (x.length) super(...x); else super(ag()); } static now() { return ag(); } } w.Date = D; };
    const RT = fut => { const r = clone(FICTICIO); r._meta.as_of = '2026-11-08'; r.faturas_futuras_parcelas_antigas = fut || [{ mes: '2026-12', fatura_total: 300, parte_mae: 0 }, { mes: '2027-01', fatura_total: 200, parte_mae: 0 }]; return r; };
    const agoraT = new Date('2026-11-10T12:00:00').getTime(), hT = h => new Date(agoraT - h * 36e5).toISOString();
    const SNAP = pn => ({ v: 1, em: agoraT, ip: true,
      contas: [{ id: 'ccA', tipo: 'BANK', nome: 'Banco Alfa', saldo: 1200, atu: hT(5) }, { id: 'crA', tipo: 'CREDIT', nome: 'Cartão Alfa', saldo: 900, atu: hT(5), lim: 4000, disp: 3100 }],
      inv: [{ nome: 'Reserva inventada', saldo: 5000, atu: hT(5) }], movs: { crA: [['2026-11-08', 100], ['2026-11-09', 60]] }, pm: { crA: [['2026-11-09', 60]] }, pn });
    const abre = async (pn, larg, fut) => { const A = await abrir(Object.assign({ tf_modo: 'real', tf_real: RT(fut) }, pn ? { tf_bsnap: SNAP(pn) } : {}), { antes: relogio('2026-11-10T12:00:00'), largura: larg }); await A.ir('cartao'); return A; };
    const barras = A => [...A.d.querySelectorAll('.vb em')].map(e => e.textContent.replace(/[^\d]/g, '')).join('|');
    const meses = A => [...A.d.querySelectorAll('.vb small')].map(e => e.textContent.trim()).join('|');
    const txt = A => A.$('main').textContent.replace(/\s+/g, ' ');
    const col = (A, l) => [...A.d.querySelectorAll('td[data-l="' + l + '"]')].map(e => e.textContent.replace(/[^\d,—]/g, '')).join('|');
    const linhas = A => [...A.d.querySelectorAll('table.rt td.tt')].map(e => e.textContent.trim()).join('|');
    for (const larg of [390, 1024]) {
      const A = await abre({ crA: [['2026-11-09', 60, 1, 3]] }, larg);
      t(n + larg + ' px: gráfico por mês: a aberta (160) em dezembro, depois 200 + 60 em janeiro e 60 em fevereiro', barras(A) === '160|260|60|0|0|0' && meses(A) === 'dez/26|jan/27|fev/27|mar/27|abr/27|mai/27');
      t(n + larg + ' px: o texto do gráfico explica a primeira barra e de onde vêm as parcelas', /A primeira barra é a fatura aberta \(estimada\), no mês em que ela vence\./.test(txt(A)) && /Inclui as parcelas novas vistas no banco \(A Confirmar\)\./.test(txt(A)) && !/Fatura do mês mais as parcelas/.test(txt(A)));
      t(n + larg + ' px: a tabela mostra janeiro e fevereiro, com a coluna das parcelas novas', linhas(A) === '01/27|02/27' && [...A.d.querySelectorAll('table.rt th')].some(e => e.textContent === 'Parcelas novas (banco)') && col(A, 'Parcelas novas (banco)') === '60,00|60,00' && col(A, 'Parcelas antigas') === '200,00|0,00');
      t(n + larg + ' px: sem erro de script', A.erros.length === 0);
      const Z = await abre({}, larg);
      t(n + larg + ' px: banco sem parcelas com seguintes: dezembro não aparece duas vezes, sem coluna nova', barras(Z) === '160|200|0|0|0|0' && meses(Z).startsWith('dez/26|jan/27') && linhas(Z) === '01/27' && !/Parcelas novas/.test(txt(Z)) && !/Inclui as parcelas novas/.test(txt(Z)));
      const V = await abre({}, larg, [{ mes: '2026-12', fatura_total: 300, parte_mae: 0 }]);
      t(n + larg + ' px: nada depois da fatura aberta: a tabela diz isso', /Nenhuma parcela depois da fatura aberta\./.test(txt(V)) && !V.d.querySelector('table.rt td.tt') && barras(V) === '160|0|0|0|0|0' && V.erros.length === 0);
      const F = await abre(null, larg);
      t(n + larg + ' px: sem banco: gráfico e tabela como antes (por posição, a partir do mês de hoje)', barras(F) === '300|300|200' && meses(F) === 'nov/26|dez/26|jan/27' && linhas(F) === '12/26|01/27' && /Fatura do mês mais as parcelas que ainda estão rodando\./.test(txt(F)) && !/A primeira barra/.test(txt(F)));
    }
    /* lacunas apontadas pela prova por mutação (13/11) */
    {
      const g = n + 'limites: ';
      t(g + 'parcela datada hoje, fora do dia de fechamento, conta', eq(PS([['2026-11-09', 10, 1, 3]], 5, '2026-11-09', '2026-11-01').todas, [10, 10]));
      t(g + 'fechamento no dia 1 funciona', eq(PS([['2026-11-05', 10, 1, 2]], 1, '2026-11-09', '2026-01-01').todas, [10]) && MA(1, 10, '2026-11-09') === '2026-12');
      t(g + 'fechamento no dia 31 funciona (30/11 ainda é antes do fechamento; vence dia 10: dois meses depois do último)', MA(31, 10, '2026-11-09') === '2026-12' && MA(31, 10, '2026-12-05') === '2027-01');
      t(g + 'fechamento 31 em mês de 30 dias: 30/04 é dia de fechamento, a parcela datada nele fica fora', eq(PS([['2026-04-30', 10, 1, 3], ['2026-03-31', 7, 1, 3]], 31, '2026-04-30', '2026-01-01').todas, [7, 7]));
      t(g + 'vencimento no dia 1: dois meses depois do último fechamento', MA(5, 1, '2026-11-09') === '2027-01');
      t(g + 'parcela nova de centavos não se perde', JS(SER(), { todas: [0.5], novas: [0.5] }, '2026-11')[0].novas === 0.5);
      t(g + 'no máximo 120 faturas, mesmo com N absurdo', PS([['2026-11-07', 1, 1, 500]], 5, '2026-11-09', '2026-11-01').todas.length === 120);
      const linhas450 = []; for (let i = 0; i < 450; i++) linhas450.push(['2026-11-07', 1, 1, 2]);
      const f450 = clone(foto); f450.pn = { crA: linhas450 };
      t(g + 'sanBanco: no máximo 400 parcelas por cartão', Seg.sanBanco(f450).pn.crA.length === 400);
      const fN = clone(foto); fN.pn = { crA: [['2026-11-07', 1, 1, 7.5], ['2026-11-07', 2, 1, 120], ['2026-11-07', 3, 1, 121], ['2026-11-07', 4, 119, 120]] };
      t(g + 'sanBanco: N quebrado cai; N = 120 fica; N = 121 cai', eq(Seg.sanBanco(fN).pn.crA, [['2026-11-07', 2, 1, 120], ['2026-11-07', 4, 119, 120]]));
      /* derivar com fechamento 20 e vencimento 10: usa o fechamento do cartão para escolher as parcelas e o vencimento para o mês */
      const r20 = REAL(); r20.cartao.fechamento_dia = 20; r20.cartao.fatura_atual.vence_em = '2026-11-10'; r20.faturas_futuras_parcelas_antigas = [];
      const f20 = B.instantaneo(RESP([mov('a', 'crA', '2026-11-22', 60, 'DEBIT', { parc: P(1, 3) }), mov('b', 'crA', '2026-11-15', 33, 'DEBIT', { parc: P(1, 3) })]), AG, []).snap;
      const c20 = Real.derivar(r20, {}, ctxB(f20, { liga: { crA: 'c1', crB: 'nao' }, hojeISO: '2026-11-25' })).cartoes[0];
      t(g + 'derivar: fecha 20, vence 10, hoje 25/11: aberta vence em janeiro; só a parcela depois do dia 20 conta, em fevereiro e março', c20.mesAberta === '2027-01' && eq(c20.serie, [{ mes: '2027-02', fatura_total: 0, parte_mae: 0, novas: 60 }, { mes: '2027-03', fatura_total: 0, parte_mae: 0, novas: 60 }]));
      /* derivar: parcela antiga (começou antes do arquivo) não vira "nova" quando o arquivo já tem mais que ela no mês */
      const fVelha = B.instantaneo(RESP([mov('a', 'crA', '2026-11-05', 50, 'DEBIT', { parc: P(4, 6) })]), AG, []).snap;
      const cV = Real.derivar(real, {}, ctxB(fVelha, LG)).cartoes[0];
      t(g + 'derivar: parcela antiga não é somada de novo em janeiro (o arquivo já tem 120); em fevereiro, que o arquivo não tem, entra', eq(cV.serie, [{ mes: '2027-01', fatura_total: 120, parte_mae: 0 }, { mes: '2027-02', fatura_total: 0, parte_mae: 0, novas: 50 }]));
      /* derivar: a projeção de saldo do app desconta as parcelas novas no mês delas */
      const arr12 = o => { const out = []; (function v(x) { if (Array.isArray(x)) { if (x.length === 12 && x.every(y => typeof y === 'number')) out.push(x); else x.forEach(v); } else if (x && typeof x === 'object') Object.keys(x).forEach(k => v(x[k])); })(o); return out; };
      const pA = arr12(d), pB = arr12(dSem);
      t(g + 'derivar: as projeções de saldo caem 65 em janeiro e mais 90 em fevereiro', pA.length >= 2 && pA.length === pB.length && pA.every((a, i) => Math.round((pB[i][1] - a[1]) * 100) === 0 && Math.round((pB[i][2] - a[2]) * 100) === 6500 && Math.round((pB[i][3] - a[3]) * 100) === 15500));
      /* tela: série em que só um mês tem parcela nova */
      const M = await abre({ crA: [['2026-11-09', 60, 1, 2]] }, 390, [{ mes: '2026-12', fatura_total: 300, parte_mae: 0 }, { mes: '2027-01', fatura_total: 200, parte_mae: 0 }, { mes: '2027-02', fatura_total: 100, parte_mae: 0 }]);
      t(g + 'tela: só um mês com parcela nova: a coluna aparece, o outro mês mostra traço, e o texto do gráfico avisa', col(M, 'Parcelas novas (banco)') === '60,00|—' && /Inclui as parcelas novas vistas no banco/.test(txt(M)) && barras(M) === '160|260|100|0|0|0');
    }
    const Ad = await abrir({ tf_modo: 'demo' }, { largura: 390 }); await Ad.ir('cartao');
    t(n + 'modo de exemplo: nada de parcelas novas nem de fatura aberta', !/Parcelas novas/.test(txt(Ad)) && !/Inclui as parcelas novas/.test(txt(Ad)) && !/A primeira barra/.test(txt(Ad)));
  }

  process.exit(fim());
})();
