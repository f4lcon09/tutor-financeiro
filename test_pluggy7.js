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

  process.exit(fim());
})();
