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
const AGORA = Date.UTC(2026, 10, 9, 12, 0, 0);   /* relógio fixo da parte pura: 09/11/2026 12:00 UTC */
const linhas = (j, agora) => { const e = B.estrutura(j, HOJE, agora == null ? AGORA : agora); return e.ok ? B.estruturaLinhas(e.e).map(l => (l.n ? '  ' : '') + l.t) : null; };
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
    '  conta 1 (BANK / CHECKING_ACCOUNT): atualizado há 26 h',
    '  conta 2 (CREDIT / CREDIT_CARD): atualizado sem data',
    '  idade de atualizado nas contas: mínima há 26 h, máxima há 26 h',
    'movs: 4',
    '  por status: POSTED 1, PENDING 1, outro 1, sem status 1',
    '  por tipo: DEBIT 2, CREDIT 1, outro 1',
    '  com parc: 1 (mais 1 fora do formato n de N); com cat: 1',
    '  parcelas: parc preenchido 2; descrição terminando em n/N 0; os dois 0; só parc 2; só descrição 0',
    '  cat distintas: 1',
    'faturas: 4',
    '  com vencimento: 3; vencimento futuro: sim, 2, até 3 meses à frente',
    'investimentos: 2',
    '  FIXED_INCOME / CDB: 1',
    '  MUTUAL_FUND / outro: 1',
    '  com saldo numérico: 1',
    'itens: 3; 1 item(ns) citado(s) em contas ou investimentos sem informação em itens',
    '  item 1: atualizado há 26 h, status UPDATED, 1 conta(s), 1 investimento(s)',
    '  item 2: atualizado sem data, status outro, 1 conta(s), 0 investimento(s)',
    '  item 3: atualizado sem data, status ausente, 0 conta(s), 0 investimento(s)',
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
    t('lista fixa: as cinco situações de item da lista passam; a de fora vira outro', ['UPDATED', 'LOGIN_ERROR', 'OUTDATED', 'UPDATING', 'WAITING_USER_INPUT'].every(s => TT.includes('status ' + s + ',')) && LL.includes('  item 1: atualizado sem data, status outro, 2 conta(s), 1 investimento(s)'));
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
  t('lixo: item com status em lista vira "outro"', lixoL.includes('  item 1: atualizado sem data, status outro, 0 conta(s), 0 investimento(s)'));
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
    const L0 = linhas(V4(), Date.now()); A.click('#bc_diag'); await tick(120); const L1 = linhas(V4(), Date.now());
    const itens = A.$$('#bc_diag_out .bc-diag li').map(e => e.textContent);
    /* a tela usa o relógio do aparelho: vale a parte pura com o relógio de antes ou de depois do toque (a idade em horas pode virar no meio) */
    const LT = JSON.stringify(itens) === JSON.stringify(L1.map(x => x.trim())) ? L1 : L0;
    t('estrutura: uma chamada à ponte, ao endereço digitado', A.ponte().length === 1 && A.ponte()[0].o.method === 'POST');
    t('estrutura: as mesmas linhas da parte pura, com recuo', JSON.stringify(itens) === JSON.stringify(LT.map(x => x.trim())) && A.$$('#bc_diag_out .bc-diag li.n1').length === LT.filter(x => x.startsWith('  ')).length);
    t('estrutura: nada da resposta vazou para a tela', vazou(A.d.body.textContent).length === 0 && vazou(A.d.body.innerHTML).length === 0);
    t('estrutura: nada guardado', tudo(A) === antes);
    t('estrutura: nada no console', cons.c === 0);
    t('estrutura: botão volta ao normal', A.$('#bc_diag').disabled === false && A.$('#bc_diag').textContent === 'Ver estrutura da resposta');
    A.click('#bc_copiar'); await tick(20);
    t('copiar: só as linhas da estrutura', copiado === LT.join('\n') && vazou(copiado).length === 0 && A.$('#bc_copiou').textContent === 'Copiado: só contagens, idades e nomes de campos.');
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

  /* ===== pluggy-5b: idades, parcelas, categorias, investimentos por item e dados de crédito (valores inventados) ===== */
  const HORA = 36e5, ISO = ms => new Date(ms).toISOString();
  /* idade: horas inteiras até 48 h, depois dias; nunca a data */
  const id = x => B.idade(x, AGORA);
  t('idade: 30 min atrás é "há 0 h"; 47 h 59 min é "há 47 h"', id(ISO(AGORA - HORA / 2)) === 'há 0 h' && id(ISO(AGORA - 48 * HORA + 6e4)) === 'há 47 h');
  t('idade: 48 h em ponto já é "há 2 dias"; 50 h é "há 2 dias"', id(ISO(AGORA - 48 * HORA)) === 'há 2 dias' && id(ISO(AGORA - 50 * HORA)) === 'há 2 dias');
  t('idade: mais de 30 dias em dias ("há 40 dias", "há 400 dias")', id(ISO(AGORA - 40 * 24 * HORA)) === 'há 40 dias' && id(ISO(AGORA - 400 * 24 * HORA)) === 'há 400 dias');
  t('idade: só a data (meia-noite UTC) e com fuso -03:00', id('2026-11-09') === 'há 12 h' && id('2026-11-09T06:00:00-03:00') === 'há 3 h' && id('2026-11-09T06:00:00-0300') === 'há 3 h');
  t('idade: um minuto à frente do relógio é "data futura"', id(ISO(AGORA + 6e4)) === 'data futura' && id('2027-01-01') === 'data futura');
  t('idade: fora do ISO ou inválida é "sem data"', ['ontem', '09/11/2026', '2026-11-9', '2026-02-30', '2026-11-09T24:00:00Z', '2026-11-09T10:61:00Z', '2026-11-09T10:00:00+25:00', '', '   ', null, undefined, 5, {}, [], '2026-11-09T10:00:00.000Z' + ' '.repeat(40)].every(x => id(x) === 'sem data'));
  t('idade: sem relógio informado usa o do aparelho', B.idade(ISO(Date.now() - 3 * HORA - 6e4)) === 'há 3 h');
  {
    const P = 'VALOR_PESSOAL_INVENTADO_123';
    const J = { ok: true, dados: { contas: [
      { tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', atualizado: ISO(AGORA - 2 * HORA) },
      { tipo: 'CREDIT', subtipo: 'CREDIT_CARD', atualizado: ISO(AGORA - 50 * HORA) },
      { tipo: 'BANK', subtipo: 'SAVINGS_ACCOUNT', atualizado: ISO(AGORA - 40 * 24 * HORA) },
      { tipo: P, subtipo: P, atualizado: ISO(AGORA + 3 * HORA) },
      { tipo: 'BANK', atualizado: 'ontem' },
      { tipo: 'BANK' }],
      itens: [{ item: 'i1', atualizado: ISO(AGORA + HORA), status: 'UPDATED' }, { item: 'i2', atualizado: ISO(AGORA - 31 * 24 * HORA), status: 'UPDATED' }, { item: 'i3', atualizado: '2026-11-09 10:00' }] } };
    const LL = linhas(J), TT = LL.join('\n');
    t('estrutura: idade de cada conta, pela ordem e pelo tipo da lista fixa', ['  conta 1 (BANK / CHECKING_ACCOUNT): atualizado há 2 h', '  conta 2 (CREDIT / CREDIT_CARD): atualizado há 2 dias', '  conta 3 (BANK / SAVINGS_ACCOUNT): atualizado há 40 dias', '  conta 4 (outro / outro): atualizado data futura', '  conta 5 (BANK / sem subtipo): atualizado sem data', '  conta 6 (BANK / sem subtipo): atualizado sem data'].every(x => LL.includes(x)), TT);
    t('estrutura: mínima e máxima só entre as datas válidas e passadas', LL.includes('  idade de atualizado nas contas: mínima há 2 h, máxima há 40 dias'));
    t('estrutura: o rótulo da conta não conta duas vezes o valor fora da lista', /tipo de conta outro \(1\), subtipo de conta outro \(1\)/.test(LL[LL.length - 1]) && !TT.includes(P));
    t('estrutura: idade dos itens (futura, mais de 30 dias, fora do ISO)', LL.includes('  item 1: atualizado data futura, status UPDATED, 0 conta(s), 0 investimento(s)') && LL.includes('  item 2: atualizado há 31 dias, status UPDATED, 0 conta(s), 0 investimento(s)') && LL.includes('  item 3: atualizado sem data, status ausente, 0 conta(s), 0 investimento(s)'));
    t('estrutura: nenhuma data, só idades', !/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|T\d{2}:\d{2}/.test(TT) && !/\d{4}-\d{2}-\d{2}|T\d{2}:\d{2}/.test(linhas(V4()).join('\n')));
    const semData = linhas({ ok: true, dados: { contas: [{ tipo: 'BANK', atualizado: 'ontem' }, { tipo: 'BANK', atualizado: ISO(AGORA + HORA) }] } });
    t('estrutura: nenhuma conta com data válida', semData.includes('  idade de atualizado nas contas: nenhuma conta com data válida'));
    t('estrutura: lista de contas vazia também diz "nenhuma conta com data válida"; sem contas, nenhuma linha de idade', linhas({ ok: true, dados: { contas: [] } }).includes('  idade de atualizado nas contas: nenhuma conta com data válida') && !linhas({ ok: true, dados: {} }).some(x => /idade de atualizado|: atualizado /.test(x)));
    const muitas = linhas({ ok: true, dados: { contas: Array.from({ length: 53 }, () => ({ tipo: 'BANK', atualizado: ISO(AGORA - HORA) })) } });
    t('estrutura: até 50 contas com idade; o resto é contado', muitas.filter(x => /^ {2}conta \d+ \(/.test(x)).length === 50 && muitas.includes('  mais 3 conta(s) sem idade nesta lista'));
  }
  /* parcelas e categorias distintas: só contagens */
  {
    const D = ['Loja Sigilosa A', 'Loja Sigilosa B'];
    const M = [
      { parc: { n: 2, de: 5 }, desc: 'COMPRA PARC 02/05', cat: 'Alimentacao Inventada' },   /* os dois */
      { parc: { n: 1, de: 3 }, desc: D[0], cat: 'Alimentacao Inventada' },   /* só parc */
      { parc: { n: 9, de: 3 }, desc: D[1], cat: ' Alimentacao Inventada ' },   /* parc fora do formato também é parc preenchido */
      { desc: 'Loja 3/10', cat: 'Transporte Inventado' },   /* só descrição */
      { desc: 'Loja 3 / 10  ', cat: '' },   /* com espaços */
      { desc: '1/2 Loja' }, { desc: 'Loja 5/3' }, { desc: 'Loja 0/3' }, { desc: 'Loja 1/121' }, { desc: 'Loja 10/11' }, { desc: 5 }, { cat: 5 }, null];
    const LL = linhas({ ok: true, dados: { movs: M } }), TT = LL.join('\n');
    t('parcelas: parc, descrição n/N, os dois e só um de cada', LL.includes('  parcelas: parc preenchido 3; descrição terminando em n/N 4; os dois 1; só parc 2; só descrição 3'), TT);
    t('categorias distintas: sem vazio e sem repetição depois de tirar os espaços', LL.includes('  cat distintas: 2'));
    t('parcelas e categorias: nenhuma descrição ou categoria aparece', ![...D, 'Alimentacao', 'Transporte', 'COMPRA', '02/05'].some(x => TT.includes(x)));
    const vaz = linhas({ ok: true, dados: { movs: [] } });
    t('parcelas e categorias com movs vazio: tudo em 0', vaz.includes('  parcelas: parc preenchido 0; descrição terminando em n/N 0; os dois 0; só parc 0; só descrição 0') && vaz.includes('  cat distintas: 0'));
  }
  /* saldos: idade, crédito, campos numéricos e investimentos por item */
  {
    const CS = [
      { id: 'a1', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'Conta Um', saldo: -50.5, item: 'iA', atualizado: ISO(AGORA - 3 * HORA), banco: { closingBalance: -60 } },
      { id: 'a2', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartao Um', saldo: 310, item: 'iA', atualizado: ISO(AGORA - 40 * 24 * HORA), credito: { creditLimit: 5000, availableCreditLimit: 3200.5, balanceDueDate: '2026-11-20T03:00:00.000Z', minimumPayment: 150.75, campoNovo: 7, texto: 'x', sub: { fundo: 1 } }, extraNumero: 12.5, ['k'.repeat(61)]: 1 },
      { id: 'a3', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartao Dois', saldo: 0, item: 'iB', atualizado: ISO(AGORA + HORA), credito: null },
      { id: 'a4', tipo: 'CREDIT', nome: 'Cartao Tres', saldo: 1, credito: { balanceDueDate: 'dia 20', creditLimit: '5000' } }];
    const INV = [{ item: 'iA', nome: '  <b>Inv HTML</b> ', saldo: 1000, status: 'ACTIVE' }, { item: 'iA', nome: 'CDB Dois', saldo: 'x' }, { item: 'iA', nome: '', saldo: -5, status: 'x'.repeat(41) }, { item: 'iZ', nome: 'Sem Item', saldo: 25, status: 'PENDING' }, { nome: 'Sem Chave', saldo: 2 }, null];
    const ITS = [{ item: 'iA', atualizado: ISO(AGORA - 5 * HORA) }, { item: 'iB', atualizado: 'ontem' }, { item: 'iA' }];
    const s = B.saldos({ ok: true, dados: { contas: CS, investimentos: INV, itens: ITS } }, AGORA);
    const c = id => s.contas.find(x => x.id === id);
    t('saldos: idade de cada conta (horas, dias, futura, sem data)', c('a1').idade === 'há 3 h' && c('a2').idade === 'há 40 dias' && c('a3').idade === 'data futura' && c('a4').idade === 'sem data');
    t('saldos: saldo e fechamento negativos passam', c('a1').saldo === -50.5 && c('a1').fechamento === -60);
    t('saldos: dados de crédito do cartão; vencimento só a data', JSON.stringify(c('a2').credito) === JSON.stringify({ limite: 5000, disponivel: 3200.5, vence: '2026-11-20', minimo: 150.75 }));
    t('saldos: cartão sem credito é nulo; credito com texto no lugar de número fica nulo', c('a3').credito === null && JSON.stringify(c('a4').credito) === JSON.stringify({ limite: null, disponivel: null, vence: null, minimo: null }));
    t('saldos: campos numéricos do cartão, como vieram (um nível abaixo; chave longa e texto ficam fora)', JSON.stringify(c('a2').numericos) === JSON.stringify({ lista: [['saldo', 310], ['credito.creditLimit', 5000], ['credito.availableCreditLimit', 3200.5], ['credito.minimumPayment', 150.75], ['credito.campoNovo', 7], ['extraNumero', 12.5]], mais: 0 }), JSON.stringify(c('a2').numericos));
    t('saldos: conta corrente não lista campos numéricos', c('a1').numericos === null);
    const muitos = { id: 'm', tipo: 'CREDIT', nome: 'M', saldo: 1 }; for (let k = 0; k < 44; k++) muitos['n' + k] = k;
    const sm = B.saldos({ ok: true, dados: { contas: [muitos] } }, AGORA).contas[0].numericos;
    t('saldos: até 40 campos numéricos; o resto é contado', sm.lista.length === 40 && sm.mais === 5);
    t('saldos: itens pela ordem, sem repetir o mesmo item, com idade e contas', s.itens.length === 2 && s.itens[0].idade === 'há 5 h' && s.itens[1].idade === 'sem data' && s.itens[0].contas.join() === 'a1,a2' && s.itens[1].contas.join() === 'a3');
    const iA = s.itens[0];
    t('saldos: investimentos do item com nome, saldo e status; total só dos numéricos', iA.investimentos.length === 3 && iA.investimentos[0].nome === '<b>Inv HTML</b>' && iA.investimentos[0].status === 'ACTIVE' && iA.investimentos[1].saldo === null && iA.investimentos[1].status === null && iA.investimentos[2].nome === null && iA.investimentos[2].status === null && iA.soma === 995);
    t('saldos: item que não trouxe investimento fica com a lista vazia', s.itens[1].investimentos.length === 0 && s.itens[1].soma === 0);
    t('saldos: investimento de item fora da lista de itens ou sem item vai para "sem item"', s.semItem.investimentos.map(v => v.nome).join() === 'Sem Item,Sem Chave' && s.semItem.soma === 27);
    t('saldos: soma de todos os investimentos com saldo numérico', s.invest.presente && s.invest.n === 4 && s.invest.soma === 1022 && s.invest.total === 5);
    const sem = B.saldos({ ok: true, dados: { contas: CS, investimentos: INV } }, AGORA);
    t('saldos: sem lista de itens, todos os investimentos ficam "sem item"', sem.itens.length === 0 && sem.semItem.investimentos.length === 5);
    const nada = B.saldos({ ok: true, dados: { contas: CS, investimentos: [], itens: [] } }, AGORA);
    t('saldos: listas vazias de investimentos e itens', nada.invest.presente && nada.invest.n === 0 && nada.itens.length === 0 && nada.semItem.investimentos.length === 0);
    t('saldos: sem a chave investimentos, "presente" é falso', !B.saldos({ ok: true, dados: { contas: CS } }, AGORA).invest.presente);
  }
  /* categorias: parte pura */
  {
    const r = B.categorias({ ok: true, dados: { movs: [{ cat: 'Beta' }, { cat: 'Alfa' }, { cat: 'Gama' }, { cat: ' Gama ' }, { cat: '' }, {}, { cat: 5 }, null, { cat: 'x'.repeat(150) }] } });
    t('categorias: mais movimentos primeiro, empate em ordem alfabética, sem espaços nas pontas', r.ok && JSON.stringify(r.lista) === JSON.stringify([['Gama', 2], ['Alfa', 1], ['Beta', 1], ['x'.repeat(100), 1]]));
    t('categorias: sem categoria e total (só objetos contam)', r.semCat === 3 && r.total === 8 && r.mais === 0);
    t('categorias: sem movs é formato; erro da ponte passa o código', B.categorias({ ok: true, dados: {} }).erro === 'formato' && B.categorias({ ok: false, erro: 'token_invalido' }).erro === 'token_invalido' && B.categorias('x').erro === 'formato');
    const muitas = B.categorias({ ok: true, dados: { movs: Array.from({ length: 305 }, (_, k) => ({ cat: 'c' + k })) } });
    t('categorias: até 300 na lista; o resto é contado', muitas.lista.length === 300 && muitas.mais === 5);
  }

  /* tela: Conferir saldos com idades, crédito, campos numéricos e investimentos por item */
  const HT = h => ISO(Date.now() - h * HORA);
  const RESP5B = () => ({ ok: true, dados: { de: '2026-10-05', ate: HOJE, movs: [],
    contas: [
      { id: 'k1', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'Conta Idade', saldo: 480.25, item: 'iA', atualizado: HT(3), banco: { closingBalance: 470 } },
      { id: 'k2', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartao Credito', saldo: 310, item: 'iA', atualizado: HT(40 * 24), credito: { creditLimit: 5000, availableCreditLimit: 3200.5, balanceDueDate: '2026-11-20T03:00:00.000Z', minimumPayment: 150.75, campoNovo: 7 }, extraNumero: 12.5 },
      { id: 'k3', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartao Sem Credito', saldo: 0, item: 'iB', atualizado: HT(-2) },
      { id: 'k4', tipo: 'BANK', subtipo: 'SAVINGS_ACCOUNT', nome: 'Poupanca Negativa', saldo: -50.5, item: 'iB', atualizado: 'ontem' }],
    investimentos: [{ item: 'iA', nome: '<img src=x onerror=alert(1)>Inv HTML', saldo: 1000, status: 'ACTIVE' }, { item: 'iA', nome: 'CDB Dois', saldo: 'x' }, { item: 'iZ', nome: 'Sem Item', saldo: 25, status: 'PENDING' }],
    itens: [{ item: 'iA', atualizado: HT(5), status: 'UPDATED' }, { item: 'iB', atualizado: HT(60), status: 'UPDATED' }] } });
  const num = s => +String(s).replace(/[^\d,-]/g, '').replace(',', '.');
  /* texto da tela com espaço entre as células (o textContent junta os spans) e sem as opções dos seletores */
  const ptxt = el => { if (!el || !el.cloneNode) return ''; const c = el.cloneNode(true); c.querySelectorAll('select').forEach(x => x.remove()); c.querySelectorAll('*').forEach(x => x.insertAdjacentText('beforebegin', ' ')); return norm(c.textContent).trim(); };
  { const A = await abre(RESP5B()); A.set('#bc_url', URL); const antes = tudo(A), cons = espiaConsole(A);
    A.click('#bc_conf'); await tick(150);
    const VAZIO = { value: null, textContent: '', innerHTML: '', dispatchEvent() {} };
    const blocos = A.$$('#bc_diag_out .bc-cs'), bl = i => ptxt(blocos[i]), q = s => A.$(s) || VAZIO;
    t('5b saldos: quatro contas mais as somas, e o bloco de investimentos', blocos.length === 5 && A.$$('#bc_diag_out .bc-is').length === 1);
    t('5b saldos: idade em toda conta e cartão (horas, dias, futura, sem data)', q('#bc_ci_0').textContent === 'há 3 h' && q('#bc_ci_1').textContent === 'há 40 dias' && q('#bc_ci_2').textContent === 'data futura' && q('#bc_ci_3').textContent === 'sem data');
    t('5b saldos: a idade fica junto dos valores do banco, no mesmo bloco', /Atualizado no banco há 3 h No banco R\$ 480,25/.test(bl(0)) && /dados de crédito do banco, atualizados há 40 dias/i.test(bl(1)));
    t('5b saldos: saldo negativo aparece com sinal', /No banco -R\$ 50,50/.test(bl(3)));
    t('5b cartão: limite do banco ao lado do limite do app (4000), com a diferença', /Limite \(creditLimit\) no banco R\$ 5\.000,00 Limite \(creditLimit\) no app R\$ 4\.000,00 Diferença -R\$ 1\.000,00/.test(bl(1)), bl(1));
    const disp = /Disponível \(availableCreditLimit\) no banco (\S+ \S+) Disponível \(availableCreditLimit\) no app (\S+ \S+) Diferença (\S+ \S+)/.exec(bl(1));
    t('5b cartão: disponível do banco e do app, diferença = app menos banco', !!disp && num(disp[1]) === 3200.5 && Math.abs(num(disp[3]) - (num(disp[2]) - 3200.5)) < 0.005);
    t('5b cartão: vencimento do banco em data, do app em dia, e se batem', /Vencimento \(balanceDueDate\) no banco 20\/11\/2026 Vencimento \(balanceDueDate\) no app dia 12 Diferença dia diferente/.test(bl(1)));
    t('5b cartão: pagamento mínimo do banco; o app não tem', /Pagamento mínimo \(minimumPayment\) no banco R\$ 150,75 Pagamento mínimo no app o app não tem/.test(bl(1)));
    t('5b cartão sem dados de crédito: diz isso', /O banco não mandou os dados de crédito deste cartão\./.test(bl(2)) && !/creditLimit/.test(bl(2)));
    t('5b cartão: todo campo numérico da conta, com nome e valor', /Campos numéricos desta conta, como vieram da ponte \(atualizados há 40 dias\) saldo 310 credito\.creditLimit 5\.000 credito\.availableCreditLimit 3\.200,5 credito\.minimumPayment 150,75 credito\.campoNovo 7 extraNumero 12,5/.test(bl(1)), bl(1));
    t('5b cartão sem crédito: campos numéricos só com o saldo; conta corrente sem a lista', /Campos numéricos desta conta.* saldo 0$/.test(bl(2)) && !/Campos numéricos/.test(bl(0)) && !/Campos numéricos/.test(bl(3)));
    const sel1 = q('#bc_cs_1'); sel1.value = ''; sel1.dispatchEvent(new A.w.Event('change', { bubbles: true }));
    t('5b cartão: "Não comparar" tira os números do app e pede a escolha', /Para comparar, escolha acima a fatura de um cartão do app\./.test(ptxt(A.$('#bc_cc_1'))) && /Limite \(creditLimit\) no app — Diferença —/.test(ptxt(A.$('#bc_cc_1'))));
    sel1.value = 'c:c1'; sel1.dispatchEvent(new A.w.Event('change', { bubbles: true }));
    t('5b cartão: voltar ao cartão do app refaz a comparação', /Diferença -R\$ 1\.000,00/.test(ptxt(A.$('#bc_cc_1'))));
    const inv = ptxt(A.$('#bc_diag_out .bc-is'));
    t('5b investimentos: item com as contas dele, a idade, cada investimento com nome, status e saldo, e o total', /Item 1: Conta Idade · conta, Cartao Credito · cartão Item atualizado há 5 h <img src=x onerror=alert\(1\)>Inv HTML ACTIVE R\$ 1\.000,00 CDB Dois sem status — Total do item R\$ 1\.000,00/.test(inv), inv);
    t('5b investimentos: nome com HTML vira texto', !A.$('#bc_diag_out img'));
    t('5b investimentos: item sem investimento diz isso', /Item 2: Cartao Sem Credito · cartão, Poupanca Negativa · conta Item atualizado há 2 dias Nenhum investimento veio da ponte para este item\./.test(inv));
    t('5b investimentos: o que não tem item conhecido aparece à parte', /Investimentos sem item na lista de itens Sem Item PENDING R\$ 25,00 Total do item R\$ 25,00/.test(inv));
    t('5b somas: investimentos somados e contas mais investimentos contra o Caixa hoje (9500)', norm(q('#bc_si').textContent) === norm('R$ 1.025,00') && norm(q('#bc_cd_soma').textContent) === norm('+R$ 9.070,25') && norm(q('#bc_cd_inv').textContent) === norm('+R$ 8.045,25') && /Contas BANK mais 2 investimento\(s\) R\$ 1\.454,75/.test(bl(4)));
    t('5b saldos: nada guardado', tudo(A) === antes);
    t('5b saldos: nada no console', cons.c === 0);
    t('5b saldos: sem erros de script', A.erros.length === 0);
    await A.ir('hoje'); await A.ir('banco');
    t('5b saldos: sair e voltar, some', A.$('#bc_diag_out').textContent === ''); }
  { const A = await abre(RESP5B(), { tf_priv: true }); A.set('#bc_url', URL); A.click('#bc_conf'); await tick(150);
    const o = ptxt(A.$('#bc_diag_out'));
    t('5b olho fechado: valores, campos numéricos e investimentos escondidos; idades continuam', !/\d+,\d{1,2}\b/.test(o) && !/R\$ \d/.test(o) && /saldo •••• credito\.creditLimit ••••/.test(o) && /Atualizado no banco há 3 h/.test(o) && /Inv HTML ACTIVE R\$ ••••/.test(o)); }
  { const r = RESP5B(); delete r.dados.investimentos; const A = await abre(r); A.set('#bc_url', URL); A.click('#bc_conf'); await tick(150);
    t('5b sem a lista de investimentos: diz isso, e as somas não citam investimentos', /Investimentos por item A ponte não mandou a lista de investimentos\./.test(ptxt(A.$('#bc_diag_out'))) && !A.$('#bc_si') && !A.$('#bc_cd_inv')); }
  { const r = RESP5B(); r.dados.investimentos = []; r.dados.itens = []; const A = await abre(r); A.set('#bc_url', URL); A.click('#bc_conf'); await tick(150);
    t('5b lista de investimentos vazia: diz isso', /A ponte mandou a lista de investimentos vazia\./.test(saida(A)) && norm(A.$('#bc_si').textContent) === norm('R$ 0,00')); }

  /* tela: Categorias do banco */
  const RESPCAT = () => ({ ok: true, dados: { de: '2026-10-05', ate: HOJE, contas: [], movs: [
    { id: 'm1', desc: 'Padaria Sigilosa', valor: 1234.56, cat: 'Alimentacao Inventada' }, { id: 'm2', desc: 'Loja Escondida', valor: 7777.77, cat: 'Alimentacao Inventada' }, { id: 'm3', cat: 'Alimentacao Inventada' },
    { id: 'm4', cat: 'Transporte' }, { id: 'm5', cat: ' Transporte ' }, { id: 'm6', cat: '<img src=x onerror=alert(1)>' }, { id: 'm7', cat: '' }, { id: 'm8' }, { id: 'm9', cat: 5 }] } });
  { const A = await abre(RESPCAT()); A.set('#bc_url', URL); const antes = tudo(A), cons = espiaConsole(A);
    t('categorias: botão no painel do diagnóstico', !!A.$('#bc_cat') && A.$('#bc_cat').textContent === 'Categorias do banco');
    A.click('#bc_cat'); await tick(150);
    const cel = A.$$('#bc_diag_out .bc-cat span').map(e => e.textContent);
    t('categorias: uma chamada à ponte', A.ponte().length === 1);
    t('categorias: cada categoria com a contagem, mais movimentos primeiro, sem espaços nas pontas', JSON.stringify(cel) === JSON.stringify(['Alimentacao Inventada', '3 movimentos', 'Transporte', '2 movimentos', '<img src=x onerror=alert(1)>', '1 movimento']), JSON.stringify(cel));
    t('categorias: sem categoria e total', A.$('#bc_cat_res').textContent === 'Sem categoria: 3 movimentos. Total: 9 movimentos.');
    t('categorias: categoria com HTML vira texto', !A.$('#bc_diag_out img'));
    t('categorias: nenhuma descrição nem valor aparece', !/Padaria|Loja|1234|7777|R\$/.test(saida(A)));
    t('categorias: sem botão de copiar; nada guardado; nada no console; sem erros', !A.$('#bc_copiar') && tudo(A) === antes && cons.c === 0 && A.erros.length === 0);
    t('categorias: botão volta ao normal', A.$('#bc_cat').disabled === false && A.$('#bc_cat').textContent === 'Categorias do banco');
    await A.ir('hoje'); await A.ir('banco');
    t('categorias: sair e voltar, some', A.$('#bc_diag_out').textContent === '' && !A.$('.bc-cat')); }
  { const A = await abre({ ok: true, dados: { contas: [], movs: [{ id: 'a' }, { id: 'b', cat: '' }] } }); A.set('#bc_url', URL); A.click('#bc_cat'); await tick(150);
    t('categorias: nenhum movimento com categoria', /Nenhum movimento veio com categoria\. Sem categoria: 2 movimentos\. Total: 2 movimentos\./.test(ptxt(A.$('#bc_diag_out')))); }
  { const A = await abre({ ok: false, erro: 'nao_autorizado' }); A.set('#bc_url', URL); A.click('#bc_cat'); await tick(150);
    t('categorias com erro: mensagem fixa', saida(A) === 'Esta conta Google não tem permissão para usar a ponte.'); }
  { const A = await abre(RESPCAT(), { tf_gtoken: null, tf_gjaconectou: false }); A.set('#bc_url', URL); A.click('#bc_cat'); await tick(40);
    t('categorias sem sessão do Google: aviso e nenhuma chamada', /conecte a sincronização/.test(saida(A)) && A.ponte().length === 0); }

  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
