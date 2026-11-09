/* Diagnóstico da ponte (só estrutura) e Conferir saldos: parte pura e tela. Só valores inventados, fetch simulado, nunca a rede. */
const B = require('./banco.js');
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const { t, fim } = contador('diagnóstico da ponte');

const HOJE = '2026-11-09';
/* valores inventados e fáceis de achar: se algum aparecer no diagnóstico, vazou */
const SEGREDOS = ['98765.43', '98765,43', '4321.09', '4321,09', '55555.5', '55555,5', '7777.77', '7777,77', '1234.56', 'Padaria Sigilosa', 'Loja Escondida', 'Conta Nubank Inventada', 'Cartao Inventado', 'Caixinha Viagem Inventada', 'idContaA', 'idContaB', 'idMovA', 'idMovB', 'itemSecretoUm', 'itemSecretoDois', 'idFatA', 'idInvA', 'Alimentacao Inventada'];
const V4 = () => ({ ok: true, dados: {
  de: '2026-10-05', ate: HOJE,
  contas: [
    { id: 'idContaA', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'Conta Nubank Inventada', saldo: 98765.43, item: 'itemSecretoUm', atualizado: '2026-11-08T10:00:00.000Z', banco: { closingBalance: 4321.09, automaticallyInvestedBalance: 55555.5 }, credito: null },
    { id: 'idContaB', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartao Inventado', saldo: 7777.77, item: 'itemSecretoDois', atualizado: '', banco: null, credito: { creditLimit: 1234.56, balanceDueDate: '2026-11-20', campoNovo: 1 } }
  ],
  movs: [
    { id: 'idMovA', conta: 'idContaA', data: '2026-11-01', desc: 'Padaria Sigilosa', valor: -1234.56, tipo: 'DEBIT', status: 'POSTED', cat: 'Alimentacao Inventada', parc: null },
    { id: 'idMovB', conta: 'idContaB', data: '2026-11-02', desc: 'Loja Escondida', valor: 7777.77, tipo: 'DEBIT', status: 'PENDING', cat: '', parc: { n: 2, de: 5 } },
    { id: 'idMovC', conta: 'idContaB', data: '2026-11-03', desc: 'Loja Escondida', valor: 1, tipo: 'CREDIT', status: 'posted?', cat: '', parc: { n: 7, de: 5 } },
    { id: 'idMovD', conta: 'idContaB', data: '2026-11-04', desc: 'x', valor: 1, tipo: 'OUTRO', parc: null }
  ],
  faturas: [{ id: 'idFatA', conta: 'idContaB', vence: '2026-12-10', fecha: '2026-12-01', total: 4321.09 }, { id: 'f2', conta: 'idContaB', vence: '2027-02-10', total: 1 }, { id: 'f3', conta: 'idContaB', vence: '2026-10-10', total: 1 }, { id: 'f4', vence: 'amanhã' }],
  investimentos: [{ id: 'idInvA', item: 'itemSecretoUm', nome: 'Caixinha Viagem Inventada', tipo: 'FIXED_INCOME', subtipo: 'CDB', saldo: 55555.5 }, { id: 'v2', item: 'itemSecretoTres', nome: 'Fundo', tipo: 'MUTUAL_FUND', subtipo: 'multi mercado', saldo: 'x' }],
  itens: [{ item: 'itemSecretoUm', atualizado: '2026-11-08T10:00:00.000Z', status: 'UPDATED' }, { item: 'itemSecretoDois', atualizado: 'ontem', status: 'erro de login' }, { item: 'itemSemNada' }]
} });
const linhas = j => { const e = B.estrutura(j, HOJE); return e.ok ? B.estruturaLinhas(e.e).map(l => (l.n ? '  ' : '') + l.t) : null; };
const vazou = txt => SEGREDOS.filter(s => txt.includes(s));

(async () => {
  /* ===== parte pura ===== */
  const L = linhas(V4()), T = L.join('\n');
  t('v4 completo: linhas esperadas', JSON.stringify(L) === JSON.stringify([
    'Período: de presente, até presente (35 dias)',
    'contas: 2',
    '  BANK / CHECKING_ACCOUNT: 1',
    '  CREDIT / CREDIT_CARD: 1',
    '  com atualizado: 1 de 2; com saldo numérico: 2',
    '  com banco: 1 (closingBalance em 1, automaticallyInvestedBalance em 1, overdraftContractedLimit em 0, overdraftUsedLimit em 0)',
    '  com credito: 1 (creditLimit em 1, availableCreditLimit em 0, balanceCloseDate em 0, balanceDueDate em 1, minimumPayment em 0, outras chaves em 1)',
    'movs: 4',
    '  por status: POSTED 1, PENDING 1, outro 1, sem status 1',
    '  por tipo: DEBIT 2, CREDIT 1, outro 1',
    '  com parc: 1 (mais 1 fora do formato n de N); com cat: 1',
    'faturas: 4',
    '  com vencimento: 3; vencimento futuro: sim, 2, até 3 meses à frente',
    'investimentos: 2',
    '  FIXED_INCOME / CDB: 1',
    '  MUTUAL_FUND / outro: 1',
    '  com saldo numérico: 1',
    'itens: 3; 1 item(ns) citado(s) em contas ou investimentos sem informação em itens',
    '  item 1: atualizado data, status UPDATED, 1 conta(s), 1 investimento(s)',
    '  item 2: atualizado texto, status outro, 1 conta(s), 0 investimento(s)',
    '  item 3: atualizado ausente, status ausente, 0 conta(s), 0 investimento(s)',
    'Reserva Nubank (pelo nome, A Confirmar): conta com o nome sim; investimentos do mesmo item 1; algum com nome de caixinha, cofrinho ou reserva sim',
    'Reserva Mercado Pago (pelo nome, A Confirmar): conta com o nome não; investimentos do mesmo item 0; algum com nome de caixinha, cofrinho ou reserva não',
    'banco.closingBalance: existe em 1 conta(s)',
    'banco.automaticallyInvestedBalance: existe em 1 conta(s)',
    'Fora da lista fixa (aparecem como outro): tipo de conta outro (0), subtipo de conta outro (0), status de movimento outro (1), status de item outro (1), tipo de investimento outro (0), subtipo de investimento outro (1)'
  ]), T);
  t('v4 completo: nenhum valor, nome, descrição ou id vazou', vazou(T).length === 0);
  t('v4 completo: nenhum texto em minúsculas vindo da ponte (status e subtipo estranhos viram "outro")', !/posted\?|erro de login|multi mercado|ontem|amanhã/.test(T));

  /* lista fixa: um valor em maiúsculas que não está na lista nunca aparece, só conta como "outro" (valores inventados) */
  {
    const P = 'VALOR_PESSOAL_INVENTADO_123', P2 = 'CPF00000000000', P3 = 'NOME_INVENTADO';
    const J = { ok: true, dados: { de: '2026-10-05', ate: HOJE,
      contas: [{ tipo: P, subtipo: P2, item: 'i1' }, { tipo: 'BANK', subtipo: 'SAVINGS_ACCOUNT', item: 'i1' }, { tipo: 'CREDIT', subtipo: 'CREDIT_CARD' }, { tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT' }, { tipo: 5, subtipo: ['BANK'] }, { tipo: 'tipo_minusculo', subtipo: 'subtipo_minusculo' }],
      movs: [{ status: P3, tipo: P }, { status: 'POSTED', tipo: 'DEBIT' }, { status: 'PENDING', tipo: 'CREDIT' }, { status: { a: 1 } }],
      investimentos: [{ tipo: 'FIXED_INCOME', subtipo: P, item: 'i1' }],
      itens: [{ item: 'i1', status: P2 }, { item: 'i2', status: 'UPDATED' }, { item: 'i3', status: 'LOGIN_ERROR' }, { item: 'i4', status: 'OUTDATED' }, { item: 'i5', status: 'UPDATING' }, { item: 'i6', status: 'WAITING_USER_INPUT' }] } };
    const LL = linhas(J), TT = LL.join('\n');
    t('lista fixa: valores em maiúsculas fora da lista não aparecem', ![P, P2, P3, 'tipo_minusculo', 'subtipo_minusculo'].some(x => TT.includes(x)), TT);
    t('lista fixa: contas da lista passam, o resto vira outro com a contagem', LL.includes('  BANK / SAVINGS_ACCOUNT: 1') && LL.includes('  CREDIT / CREDIT_CARD: 1') && LL.includes('  BANK / CHECKING_ACCOUNT: 1') && LL.includes('  outro / outro: 3'));
    t('lista fixa: status de movimento fora da lista vira outro', LL.includes('  por status: POSTED 1, PENDING 1, outro 2, sem status 0'));
    t('lista fixa: as cinco situações de item da lista passam; a de fora vira outro', ['UPDATED', 'LOGIN_ERROR', 'OUTDATED', 'UPDATING', 'WAITING_USER_INPUT'].every(s => TT.includes('status ' + s + ',')) && LL.includes('  item 1: atualizado ausente, status outro, 2 conta(s), 1 investimento(s)'));
    t('lista fixa: investimento com tipo documentado passa; subtipo fora da lista vira outro', LL.includes('  FIXED_INCOME / outro: 1'));
    const fora = 'Fora da lista fixa (aparecem como outro): tipo de conta outro (3), subtipo de conta outro (3), status de movimento outro (2), status de item outro (1), tipo de investimento outro (0), subtipo de investimento outro (1)';
    t('lista fixa: linha com a contagem de cada campo', LL[LL.length - 1] === fora, LL[LL.length - 1]);
    t('lista fixa: a contagem não acumula entre diagnósticos', linhas(J)[LL.length - 1] === fora);
  }
  t('lista fixa: sem listas, todas as contagens em 0', linhas({ ok: true, dados: {} }).slice(-1)[0] === 'Fora da lista fixa (aparecem como outro): tipo de conta outro (0), subtipo de conta outro (0), status de movimento outro (0), status de item outro (0), tipo de investimento outro (0), subtipo de investimento outro (0)');

  /* investimentos: subtipo documentado passa; valor em maiúsculas que não está na documentação continua "outro" */
  {
    const P = 'VALOR_PESSOAL_INVENTADO_123';
    const I = linhas({ ok: true, dados: { investimentos: [{ tipo: 'FIXED_INCOME', subtipo: 'CDB' }, { tipo: 'MUTUAL_FUND', subtipo: 'MULTIMARKET_FUND' }] } });
    t('investimentos: subtipo documentado (CDB) passa', I.includes('  FIXED_INCOME / CDB: 1') && I.includes('  MUTUAL_FUND / MULTIMARKET_FUND: 1') && /tipo de investimento outro \(0\), subtipo de investimento outro \(0\)$/.test(I[I.length - 1]));
    const X = linhas({ ok: true, dados: { investimentos: [{ tipo: P, subtipo: P }] } });
    t('investimentos: valor em maiúsculas fora da documentação vira outro e é contado', X.includes('  outro / outro: 1') && !X.join('\n').includes(P) && /tipo de investimento outro \(1\), subtipo de investimento outro \(1\)$/.test(X[X.length - 1]));
  }

  /* chaves ausentes */
  const semChaves = linhas({ ok: true, dados: { de: '2026-10-05', ate: HOJE } });
  t('sem contas, movs, faturas, investimentos e itens: cada um "ausente"', ['contas: ausente', 'movs: ausente', 'faturas: ausente', 'investimentos: ausente', 'itens: ausente'].every(x => semChaves.includes(x)));
  t('sem contas: closingBalance e automaticallyInvestedBalance "não existe"', semChaves.includes('banco.closingBalance: não existe') && semChaves.includes('banco.automaticallyInvestedBalance: não existe'));
  t('sem contas: as reservas ficam "não"', semChaves.filter(x => /^Reserva/.test(x)).every(x => /conta com o nome não; investimentos do mesmo item 0; .* não$/.test(x)));
  const formato1 = linhas({ ok: true, dados: { de: '2026-10-05', ate: HOJE, contas: [{ id: 'a', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'X', saldo: 1 }], movs: [] } });
  t('formato antigo (só contas e movs): faturas, investimentos e itens ausentes; banco e credito em 0', formato1.includes('faturas: ausente') && formato1.includes('investimentos: ausente') && formato1.includes('itens: ausente') && formato1.includes('  com banco: 0') && formato1.includes('  com credito: 0') && formato1.includes('movs: 0'));
  const semPeriodo = linhas({ ok: true, dados: { de: 'ontem' } });
  t('período inválido ou ausente', semPeriodo[0] === 'Período: de ausente, até ausente');
  t('ok sem dados: "dados: ausente"', JSON.stringify(linhas({ ok: true })) === JSON.stringify(['dados: ausente (a ponte respondeu ok, mas sem o bloco de dados)']));

  /* listas vazias */
  const vazio = linhas({ ok: true, dados: { de: '2026-10-05', ate: HOJE, contas: [], movs: [], faturas: [], investimentos: [], itens: [] } });
  t('listas vazias: tudo em 0, sem vencimento futuro', ['contas: 0', 'movs: 0', 'faturas: 0', 'investimentos: 0', 'itens: 0'].every(x => vazio.includes(x)) && vazio.includes('  com vencimento: 0; vencimento futuro: não') && vazio.includes('  por status: POSTED 0, PENDING 0, outro 0, sem status 0'));

  /* lixo dentro das listas: nada lança erro */
  let lancou = false, lixoL = null;
  try { lixoL = linhas({ ok: true, dados: { de: 5, ate: null, contas: [null, 1, 'x', [], { tipo: { a: 1 } }], movs: [null, { status: 5, parc: 'sim' }], faturas: 'nao', investimentos: [{ nome: 5, item: { x: 1 } }], itens: [null, { item: 5, status: ['UPDATED'] }] } }); } catch (e) { lancou = true; }
  t('lixo nas listas: não lança erro', !lancou && !!lixoL);
  t('lixo: contas fora do formato contadas, sem tipo vira "outro"', lixoL.includes('contas: 5 (4 fora do formato)') && lixoL.includes('  outro / sem subtipo: 1'));
  t('lixo: parc que não é n de N conta como fora do formato; status número vira "outro"', lixoL.includes('  com parc: 0 (mais 1 fora do formato n de N); com cat: 0') && lixoL.includes('  por status: POSTED 0, PENDING 0, outro 1, sem status 0'));
  t('lixo: faturas que não é lista vira "ausente"', lixoL.includes('faturas: ausente'));
  t('lixo: item com status em lista vira "outro"', lixoL.includes('  item 1: atualizado ausente, status outro, 0 conta(s), 0 investimento(s)'));
  for (const x of [null, undefined, 0, 'x', [], [1], { ok: 'sim' }, { ok: true, dados: [] }, { ok: true, dados: 'x' }]) {
    let erro = false; try { B.estrutura(x, HOJE); B.saldos(x); } catch (e) { erro = true; }
    if (erro) t('nunca lança erro: ' + JSON.stringify(x), false);
  }
  t('nunca lança erro com entradas estranhas', true);
  /* achado do fuzz da noite: objeto sem protótipo em nome ou id fazia String() lançar erro (JSON.parse não cria esse objeto, mas a função não deve cair) */
  const semProto = () => Object.create(null);
  let caiu = false; try { const x = { ok: true, dados: { contas: [{ id: semProto(), tipo: 'BANK', nome: semProto(), saldo: 1, item: 'i' }], investimentos: [{ nome: semProto(), item: 'i' }] } }; B.estrutura(x, HOJE); B.saldos(x); } catch (e) { caiu = true; }
  t('objeto sem protótipo em nome e id: não lança erro', !caiu);

  /* respostas de erro */
  t('resposta não é objeto: formato', B.estrutura('x', HOJE).erro === 'formato' && B.estrutura([], HOJE).erro === 'formato' && B.estrutura({ dados: {} }, HOJE).erro === 'formato');
  t('ok falso com código: devolve o código para a mensagem fixa', B.estrutura({ ok: false, erro: 'nao_autorizado' }, HOJE).erro === 'nao_autorizado' && B.mensagem('nao_autorizado') === 'Esta conta Google não tem permissão para usar a ponte.');
  t('ok falso sem código ou com texto longo: formato', B.estrutura({ ok: false }, HOJE).erro === 'formato' && B.estrutura({ ok: false, erro: 'x'.repeat(301) }, HOJE).erro === 'formato');
  t('texto de erro desconhecido nunca vai para a tela', !B.mensagem('segredo do servidor 123').includes('segredo'));

  /* faturas: futuras e meses à frente */
  const fat = (vences, hoje) => { const e = B.estrutura({ ok: true, dados: { faturas: vences.map(v => ({ vence: v })) } }, hoje).e.faturas; return [e.comVence, e.futuras, e.mesesFrente]; };
  t('faturas só passadas: nenhuma futura', JSON.stringify(fat(['2026-10-10', '2026-11-09'], HOJE)) === '[2,0,null]');
  t('fatura de amanhã no mesmo mês: futura, 0 meses à frente', JSON.stringify(fat(['2026-11-10'], HOJE)) === '[1,1,0]');
  t('virada de ano: 31/12 para 01/01 é 1 mês à frente', JSON.stringify(fat(['2027-01-01'], '2026-12-31')) === '[1,1,1]');
  t('a mais distante decide; data inválida não conta', JSON.stringify(fat(['2026-12-10', '2027-11-01', '2027-02-30', ''], HOJE)) === '[2,2,12]');
  t('linha de 1 mês no singular', linhas({ ok: true, dados: { faturas: [{ vence: '2026-12-01' }] } }).includes('  com vencimento: 1; vencimento futuro: sim, 1, até 1 mês à frente'));

  /* reservas pelo nome */
  const res = (contas, inv) => B.estrutura({ ok: true, dados: { contas, investimentos: inv } }, HOJE).e.reservas;
  const r1 = res([{ nome: 'Mercado Pago Conta', item: 'i9' }], [{ nome: 'Reserva Inventada', item: 'i9' }, { nome: 'Outro', item: 'i8' }]);
  t('Mercado Pago pela conta; reserva pelo nome do investimento do mesmo item', r1.mercadoPago.conta && r1.mercadoPago.investimentos === 1 && r1.mercadoPago.nomeReserva && !r1.nubank.conta && r1.nubank.investimentos === 0);
  const r2 = res([], [{ nome: 'Cofrinho Nubank', item: 'i1' }]);
  t('Nubank só pelo nome do investimento: conta não, investimento sim', !r2.nubank.conta && r2.nubank.investimentos === 1 && r2.nubank.nomeReserva);
  const r3 = res([{ nome: 'NU PAGAMENTOS S.A.', item: 'i1' }], [{ nome: 'CDB Liquidez', item: 'i1' }]);
  t('Nubank pela razão social, investimento sem nome de reserva', r3.nubank.conta && r3.nubank.investimentos === 1 && !r3.nubank.nomeReserva);

  /* saldos */
  const s = B.saldos(V4());
  t('saldos: as contas no formato, com fechamento e investido automático', s.ok && s.contas.length === 2 && s.contas[0].saldo === 98765.43 && s.contas[0].fechamento === 4321.09 && s.contas[0].investidoAuto === 55555.5 && s.contas[1].fechamento === null && s.fora === 0);
  t('saldos: soma só dos investimentos com saldo numérico', s.invest.presente && s.invest.n === 1 && s.invest.soma === 55555.5);
  const s2 = B.saldos({ ok: true, dados: { contas: [{ id: 'a', tipo: 'BANK', nome: 'X', saldo: 'mil' }, { id: 'b c', tipo: 'BANK', nome: 'Y', saldo: 1 }, { id: 'c', tipo: 'BANK', nome: 'Z', saldo: 2 }, { id: 'c', tipo: 'BANK', nome: 'Z2', saldo: 3 }] } });
  t('saldos: conta sem saldo numérico, id ruim ou repetido fica fora e é contada', s2.ok && s2.contas.length === 1 && s2.fora === 3 && !s2.invest.presente);
  t('saldos: sem contas é formato; erro da ponte passa o código', B.saldos({ ok: true, dados: {} }).erro === 'formato' && B.saldos({ ok: false, erro: 'token_invalido' }).erro === 'token_invalido');

  /* pedir: as mesmas regras do pedido de antes; consultar continua conferindo */
  const URL = 'https://script.google.com/macros/s/ENDERECO-INVENTADO/exec';
  let visto = null; const r = await B.pedir({ url: URL, token: 'tok-inventado', fetch: async (u, o) => { visto = { u, o }; return { ok: true, text: async () => JSON.stringify(V4()) }; } });
  t('pedir: devolve o JSON sem conferir', r.ok && r.j.dados.faturas.length === 4);
  t('pedir: POST de texto, sem cookie, sem referrer, sem cache, com sinal', visto.u === URL && visto.o.method === 'POST' && visto.o.headers['Content-Type'] === 'text/plain' && visto.o.credentials === 'omit' && visto.o.referrerPolicy === 'no-referrer' && visto.o.cache === 'no-store' && !!visto.o.signal && JSON.parse(visto.o.body).dias === B.DIAS);
  t('pedir: rede, status ruim, JSON quebrado e tamanho', (await B.pedir({ url: URL, fetch: async () => { throw new Error('x'); } })).erro === 'rede' && (await B.pedir({ url: URL, fetch: async () => ({ ok: false }) })).erro === 'formato' && (await B.pedir({ url: URL, fetch: async () => ({ ok: true, text: async () => '{x' }) })).erro === 'formato' && (await B.pedir({ url: URL, fetch: async () => ({ ok: true, text: async () => 'x'.repeat(5 * 1024 * 1024 + 1) }) })).erro === 'formato');
  t('pedir: tempo esgotado', (await B.pedir({ url: URL, espera: 20, fetch: (u, o) => new Promise((_, rej) => o.signal.addEventListener('abort', () => rej(new Error('abort')))) })).erro === 'tempo');
  const v4ok = V4(); v4ok.dados.movs = v4ok.dados.movs.filter(m => m.tipo !== 'OUTRO');   /* consultar recusa a resposta inteira com um movimento fora do formato */
  const c = await B.consultar({ url: URL, fetch: async () => ({ ok: true, text: async () => JSON.stringify(v4ok) }) });
  t('consultar: continua passando só o formato combinado (sem faturas, investimentos e itens)', c.ok && Object.keys(c.dados).join() === 'de,ate,contas,movs' && Object.keys(c.dados.contas[0]).join() === 'id,tipo,subtipo,nome');

  /* ===== tela ===== */
  const hoje = new Date(), mes = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
  const REALFX = () => { const x = JSON.parse(JSON.stringify(FICTICIO)); x._meta.as_of = mes + '-01'; return x; };
  const LOGADO = () => ({ tf_gtoken: { v: 'token-inventado-123', exp: Date.now() + 3600000 }, tf_gjaconectou: true, tf_gtry: Date.now() });
  const LIGADO = () => ({ tf_modo: 'real', tf_real: REALFX(), tf_banco_on: true, ...LOGADO() });
  /* saldos da tela: app do FICTICIO tem caixinha 9000, conta 500 (Caixa hoje 9500) e um cartão com fatura 300 */
  const CONTAS = [{ id: 'k1', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'Conta <img src=x onerror=alert(1)>', saldo: 480.25, item: 'i1', banco: { closingBalance: 470 } },
    { id: 'k2', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartao Tela', saldo: 310, item: 'i1' },
    { id: 'k3', tipo: 'BANK', subtipo: 'SAVINGS_ACCOUNT', nome: 'Poupanca Tela', saldo: 8800, item: 'i2' }];
  const RESP = () => ({ ok: true, dados: { ...V4().dados, contas: V4().dados.contas.concat(CONTAS), investimentos: [{ id: 'iv', item: 'i2', nome: 'Fundo', tipo: 'FIXED_INCOME', subtipo: 'CDB', saldo: 150 }] } });
  const ponte = (corpo, ch, atraso) => async (u, o) => { ch.push({ u, o }); if (u !== URL) throw new Error('sem rede'); if (atraso) await tick(atraso); return { ok: true, text: async () => typeof corpo === 'string' ? corpo : JSON.stringify(corpo) }; };
  const abre = async (corpo, extra, opts) => { const ch = []; const A = await abrir({ ...LIGADO(), ...(extra || {}) }, { largura: 390, fetch: ponte(corpo, ch, opts && opts.atraso), ...(opts || {}) }); await A.ir('banco'); A.ch = ch; A.ponte = () => ch.filter(x => x.u === URL); A.erros.length = 0; return A; };   /* ch tem também o Drive (sincronização ao abrir, de antes); A.ponte() só a ponte */
  const tudo = A => JSON.stringify(Object.keys(A.w.localStorage).sort().map(k => [k, A.w.localStorage.getItem(k)]));
  const espiaConsole = A => { const n = { c: 0 }; ['log', 'info', 'warn', 'error', 'debug', 'trace'].forEach(k => { A.w.console[k] = () => { n.c++; }; }); return n; };
  const saida = A => A.$('#bc_diag_out').textContent.replace(/\s+/g, ' ').trim();
  const norm = x => x.replace(/\s+/g, ' ');

  { const A = await abre(V4());
    t('tela: painel do diagnóstico com os dois botões', /Diagnóstico \(só para o dono\)/.test(A.texto()) && A.$('#bc_diag').textContent === 'Ver estrutura da resposta' && A.$('#bc_conf').textContent === 'Conferir saldos' && A.$('#bc_diag_out').textContent === '');
    t('tela: abrir não chama a ponte', A.ponte().length === 0); }
  { const A = await abrir({ tf_modo: 'demo', tf_banco_on: true }, { largura: 390 }); await A.ir('banco');
    t('modo de exemplo: sem tela e sem diagnóstico', !A.$('#bc_diag')); }
  { const A = await abre(V4(), { tf_gtoken: null, tf_gjaconectou: false });
    A.set('#bc_url', URL); A.click('#bc_diag'); await tick(40);
    t('sem sessão do Google: aviso e nenhuma chamada', /conecte a sincronização/.test(saida(A)) && A.ponte().length === 0); }
  { const A = await abre(V4()); A.set('#bc_url', 'https://exemplo.com/x'); A.click('#bc_diag'); await tick(40);
    t('endereço fora do script.google.com: aviso e nenhuma chamada', /começando com https:\/\/script\.google\.com/.test(saida(A)) && A.ponte().length === 0); }

  /* estrutura na tela */
  { const A = await abre(V4()); A.set('#bc_url', URL); const antes = tudo(A), cons = espiaConsole(A);
    let copiado = null; Object.defineProperty(A.w.navigator, 'clipboard', { value: { writeText: async x => { copiado = x; } }, configurable: true });
    A.click('#bc_diag'); await tick(120);
    const itens = A.$$('#bc_diag_out .bc-diag li').map(e => e.textContent);
    t('estrutura: uma chamada à ponte, ao endereço digitado', A.ponte().length === 1 && A.ponte()[0].o.method === 'POST');
    t('estrutura: as mesmas linhas da parte pura, com recuo', JSON.stringify(itens) === JSON.stringify(L.map(x => x.trim())) && A.$$('#bc_diag_out .bc-diag li.n1').length === L.filter(x => x.startsWith('  ')).length);
    t('estrutura: nada da resposta vazou para a tela', vazou(A.d.body.textContent).length === 0 && vazou(A.d.body.innerHTML).length === 0);
    t('estrutura: nada guardado', tudo(A) === antes);
    t('estrutura: nada no console', cons.c === 0);
    t('estrutura: botão volta ao normal', A.$('#bc_diag').disabled === false && A.$('#bc_diag').textContent === 'Ver estrutura da resposta');
    A.click('#bc_copiar'); await tick(20);
    t('copiar: só as linhas da estrutura', copiado === L.join('\n') && vazou(copiado).length === 0 && A.$('#bc_copiou').textContent === 'Copiado: só contagens e nomes de campos.');
    t('copiar: nada guardado', tudo(A) === antes);
    Object.defineProperty(A.w.navigator, 'clipboard', { value: undefined, configurable: true }); A.click('#bc_copiar'); await tick(10);
    t('copiar sem área de transferência: aviso', A.$('#bc_copiou').textContent === 'Não consegui copiar. Selecione o texto acima.');
    await A.ir('hoje'); await A.ir('banco');
    t('sair e voltar: o diagnóstico some', A.$('#bc_diag_out').textContent === '' && !A.$('.bc-diag'));
    t('sem erros de script', A.erros.length === 0); }

  /* erros */
  for (const [nome, corpo, esperado] of [['código da ponte', { ok: false, erro: 'nao_autorizado' }, 'Esta conta Google não tem permissão para usar a ponte.'], ['texto desconhecido', { ok: false, erro: 'segredo do servidor' }, 'A ponte devolveu um erro que o app não conhece. Nada foi importado.'], ['JSON quebrado', '{quebrado', 'A ponte respondeu em um formato inesperado. Nada foi importado.']]) {
    const A = await abre(corpo); A.set('#bc_url', URL); A.click('#bc_diag'); await tick(150);
    t('estrutura com erro (' + nome + '): mensagem fixa', saida(A) === esperado && !/segredo/.test(A.texto()));   /* texto da tela (main); o corpo inteiro inclui os scripts embutidos, e config.js tem a palavra num comentário */
    A.click('#bc_conf'); await tick(150);
    t('saldos com erro (' + nome + '): mensagem fixa', saida(A) === esperado);
  }
  { const ch = []; const A = await abrir(LIGADO(), { largura: 390, fetch: async (u, o) => { ch.push(u); throw new TypeError('Failed to fetch'); } }); await A.ir('banco'); A.set('#bc_url', URL); A.click('#bc_diag'); await tick(140);
    t('sem rede: mensagem de rede', saida(A) === 'Não consegui falar com a ponte. Confira a internet e o endereço.'); }
  { const A = await abre(V4(), null, { atraso: 60 }); A.set('#bc_url', URL); A.click('#bc_diag'); await tick(10); await A.ir('hoje'); await tick(120);
    t('resposta depois de sair da tela: descartada, sem erro', A.erros.length === 0 && !A.$('.bc-diag')); }

  /* Conferir saldos */
  { const A = await abre(RESP()); A.set('#bc_url', URL); const antes = tudo(A), cons = espiaConsole(A);
    A.click('#bc_conf'); await tick(120);
    /* à prova de nulo: um elemento que falta vira falha contada, não erro do teste */
    const VAZIO = { value: null, options: [], textContent: '', dispatchEvent() {} };
    const blocos = A.$$('#bc_diag_out .bc-cs'), bloco = i => blocos[i] || VAZIO, sel = i => A.$('#bc_cs_' + i) || VAZIO, txt = id => norm((A.$(id) || VAZIO).textContent), dif = i => txt('#bc_cd_' + i);
    const idx = n => A.$$('#bc_diag_out .bc-cs > b').findIndex(b => b.textContent.includes(n));
    const i1 = idx('Conta <img'), i2 = idx('Cartao Tela'), i3 = idx('Poupanca Tela');
    t('saldos: um bloco por conta mais as somas', blocos.length === 5 + 1 && i1 >= 0 && i2 >= 0 && i3 >= 0);
    t('saldos: nome com HTML aparece como texto', !A.$('#bc_diag_out img') && (A.$$('#bc_diag_out .bc-cs > b')[i1] || VAZIO).textContent.includes('<img src=x onerror=alert(1)>'));
    t('saldos: conta corrente compara com a Conta corrente do app (500)', sel(i1).value === 'conta' && dif(i1) === norm('+R$ 19,75'));
    t('saldos: saldo de fechamento do banco aparece quando existe', /Saldo de fechamento no banco/.test(bloco(i1).textContent) && !/Saldo de fechamento/.test(bloco(i3).textContent) && i3 >= 0);
    t('saldos: cartão compara com a fatura do único cartão do app (300)', sel(i2).value === 'c:c1' && dif(i2) === norm('-R$ 10,00'));
    t('saldos: poupança compara com a Caixinha (9000)', sel(i3).value === 'reserva' && dif(i3) === norm('+R$ 200,00'));
    t('saldos: as opções do app', [...sel(i1).options].map(o => o.textContent).join('|') === 'Caixa hoje|Caixinha (reserva)|Conta corrente|Fatura atual de Cartão Teste|Não comparar');
    sel(i1).value = 'caixa'; sel(i1).dispatchEvent(new A.w.Event('change', { bubbles: true }));   /* com VAZIO, dispatchEvent não faz nada */
    t('saldos: trocar a escolha recalcula a diferença', dif(i1) === norm('+R$ 9.019,75'));
    sel(i1).value = ''; sel(i1).dispatchEvent(new A.w.Event('change', { bubbles: true }));
    t('saldos: "Não comparar" tira a diferença', dif(i1) === '—');
    const bank = 98765.43 + 480.25 + 8800;
    t('saldos: soma das contas BANK contra o Caixa hoje (9500)', txt('#bc_cd_soma') === norm((9500 - bank > 0 ? '+' : '') + (9500 - bank).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
    t('saldos: soma com os investimentos (um com saldo, 150)', /Contas BANK mais 1 investimento\(s\)/.test(saida(A)) && txt('#bc_cd_inv') === norm((9500 - bank - 150).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
    t('saldos: aviso do sinal do cartão', /No cartão, o sinal do saldo do banco ainda é a confirmar\./.test(saida(A)));
    t('saldos: nada guardado, nem a escolha', tudo(A) === antes);
    t('saldos: nada no console', cons.c === 0);
    await A.ir('hoje'); await A.ir('banco');
    t('saldos: sair e voltar, some', A.$('#bc_diag_out').textContent === '' && !A.$('.bc-cs'));
    t('saldos: fora o Drive de antes, só a ponte foi chamada, uma vez', A.ch.every(x => x.u === URL || /^https:\/\/www\.googleapis\.com\//.test(x.u)) && A.ponte().length === 1); }
  /* tocar Conferir várias vezes: nenhum ouvinte se acumula no elemento fixo da tela, e vale a resposta mais nova */
  { const corpos = [RESP(), RESP(), RESP()]; corpos[2].dados.contas = corpos[2].dados.contas.map(c => c.id === 'k1' ? { ...c, saldo: 400 } : c);
    let n = 0; const ch = [];
    const A = await abrir({ ...LIGADO() }, { largura: 390, fetch: async (u, o) => { ch.push(u); if (u !== URL) throw new Error('sem rede'); const corpo = corpos[Math.min(n++, 2)]; return { ok: true, text: async () => JSON.stringify(corpo) }; } });
    await A.ir('banco'); A.set('#bc_url', URL);
    const reg = []; const orig = A.w.EventTarget.prototype.addEventListener;
    A.w.EventTarget.prototype.addEventListener = function (tipo, f, o) { reg.push([this.id || this.nodeName, tipo]); return orig.call(this, tipo, f, o); };
    for (let k = 0; k < 3; k++) { A.click('#bc_conf'); await tick(150); }
    A.w.EventTarget.prototype.addEventListener = orig;
    t('três conferências: nenhum ouvinte novo no #bc_diag_out, uma caixa só na tela', reg.filter(r => r[0] === 'bc_diag_out').length === 0 && reg.filter(r => r[0] === 'bc_conf_box' && r[1] === 'change').length === 3 && A.$$('#bc_conf_box').length === 1);
    const i1 = A.$$('#bc_diag_out .bc-cs > b').findIndex(b => b.textContent.includes('Conta <img')), s1 = A.$('#bc_cs_' + i1);
    if (s1) { s1.value = 'conta'; s1.dispatchEvent(new A.w.Event('change', { bubbles: true })); }
    t('três conferências: a diferença usa a resposta mais nova (500 − 400)', !!s1 && norm(A.$('#bc_cd_' + i1).textContent) === norm('+R$ 100,00')); }
  { const A = await abre(RESP(), { tf_priv: true }); A.set('#bc_url', URL); A.click('#bc_conf'); await tick(120);
    t('olho fechado: valores e diferenças escondidos', !/\d+,\d{2}/.test(saida(A)) && saida(A).includes('R$ ••••')); }
  { const A = await abre({ ok: true, dados: { contas: [{ id: 'z', tipo: 'BANK', nome: 'Sem saldo', saldo: null }] } }); A.set('#bc_url', URL); A.click('#bc_conf'); await tick(80);
    t('saldos sem nenhuma conta válida: aviso', saida(A) === 'A ponte não trouxe nenhuma conta com saldo.'); }

  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
