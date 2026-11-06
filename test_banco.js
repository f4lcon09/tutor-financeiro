/* Conexão bancária: validação, mensagens, tradução, duplicados, gravação e compatibilidade com aparelho antigo.
   Só valores inventados, fetch simulado, nunca a rede. Rodar: node test_banco.js */
const fs = require('fs');
const B = require('./banco.js'), Seg = require('./seguranca.js'), Sync = require('./sync.js'), St = require('./store.js');
let ok = 0, f = 0; const t = (n, c) => { if (c) ok++; else { f++; console.log('FALHOU: ' + n); } };
const clone = x => JSON.parse(JSON.stringify(x));
const CONTAS = [{ id: 'c1', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'Conta Teste', saldo: 100.5, item: 'i1' }, { id: 'c2', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartão Teste', saldo: -200, item: 'i1' }];
const MOVS = [
  { id: 'm1', conta: 'c1', data: '2026-11-02', desc: 'Padaria Exemplo', valor: -12.5, tipo: 'DEBIT', status: 'POSTED' },
  { id: 'm2', conta: 'c1', data: '2026-11-03', desc: 'Pix recebido', valor: 300, tipo: 'CREDIT', status: 'POSTED' },
  { id: 'm3', conta: 'c2', data: '2026-11-04', desc: 'Loja Inventada', valor: 45.9, tipo: 'DEBIT', status: 'PENDING' }
];
const RESP = (extra) => ({ ok: true, dados: { de: '2026-10-01', ate: '2026-11-05', contas: clone(CONTAS), movs: clone(MOVS), ...(extra || {}) } });
const DADOS = () => B.validarResposta(RESP()).dados;

/* endereço */
const URLOK = 'https://script.google.com/macros/s/ENDERECO-INVENTADO/exec';
t('url: aceita https em script.google.com', B.validarUrl(URLOK).ok && B.validarUrl(URLOK).url === URLOK);
t('url: ignora espaços nas pontas', B.validarUrl('  ' + URLOK + ' ').ok);
['http://script.google.com/macros/s/X/exec', 'https://example.com/macros/s/X/exec', 'https://script.google.com.example.com/x', 'https://evil-script.google.com/x', 'https://script.googleusercontent.com/x', 'https://usuario:senha@script.google.com/x', 'https://script.google.com:8443/x', 'javascript:alert(1)', 'script.google.com/x', '', '   ', null, undefined, 42, 'https://' + 'a'.repeat(600)].forEach(u => t('url: recusa ' + String(u).slice(0, 40), !B.validarUrl(u).ok && /https:\/\/script\.google\.com/.test(B.validarUrl(u).erro)));

/* forma da resposta */
t('resposta boa passa', B.validarResposta(RESP()).ok);
t('resposta boa: 0 movimentos passa', B.validarResposta(RESP({ movs: [] })).ok);
t('resposta boa: sem campos extras', !('saldo' in DADOS().contas[0]) && !('item' in DADOS().contas[0]) && Object.keys(DADOS().movs[0]).length === 7);
t('resposta boa: campo a mais não passa adiante', !('x' in B.validarResposta(RESP({ movs: [{ ...MOVS[0], x: 1 }] })).dados.movs[0]));
t('resposta boa: subtipo e status podem ser nulos', B.validarResposta(RESP({ contas: [{ ...CONTAS[0], subtipo: null }], movs: [{ ...MOVS[0], status: null }] })).ok);
const RUINS = {
  'nulo': null, 'lista': [], 'texto': 'x', 'número': 1, 'ok texto': { ok: 'true' }, 'ok ausente': { dados: {} }, 'ok verdadeiro sem dados': { ok: true }, 'erro vazio': { ok: false, erro: '' }, 'erro número': { ok: false, erro: 1 }, 'erro enorme': { ok: false, erro: 'x'.repeat(301) },
  'de inválido': RESP({ de: '01/10/2026' }), 'ate ausente': RESP({ ate: undefined }), 'contas não é lista': RESP({ contas: {} }), 'movs não é lista': RESP({ movs: {} }),
  'conta sem id': RESP({ contas: [{ ...CONTAS[0], id: '' }] }), 'id de conta com símbolo': RESP({ contas: [{ ...CONTAS[0], id: '<b>' }], movs: [] }), 'conta repetida': RESP({ contas: [CONTAS[0], CONTAS[0]] }), 'nome vazio': RESP({ contas: [{ ...CONTAS[0], nome: ' ' }] }), 'nome número': RESP({ contas: [{ ...CONTAS[0], nome: 1 }] }),
  'saldo texto': RESP({ contas: [{ ...CONTAS[0], saldo: '10' }] }), 'saldo nulo': RESP({ contas: [{ ...CONTAS[0], saldo: null }] }), 'saldo infinito': { ok: true, dados: { de: '2026-10-01', ate: '2026-11-05', contas: [{ ...CONTAS[0], saldo: Infinity }], movs: [] } },
  'mov sem id': RESP({ movs: [{ ...MOVS[0], id: '' }] }), 'mov de conta desconhecida': RESP({ movs: [{ ...MOVS[0], conta: 'zz' }] }), 'data com hora': RESP({ movs: [{ ...MOVS[0], data: '2026-11-02T10:00:00' }] }), 'data impossível': RESP({ movs: [{ ...MOVS[0], data: '2026-02-30' }] }), 'mês 13': RESP({ movs: [{ ...MOVS[0], data: '2026-13-01' }] }),
  'desc número': RESP({ movs: [{ ...MOVS[0], desc: 1 }] }), 'desc enorme': RESP({ movs: [{ ...MOVS[0], desc: 'x'.repeat(1001) }] }), 'valor texto': RESP({ movs: [{ ...MOVS[0], valor: '12,50' }] }), 'valor NaN': { ok: true, dados: { de: '2026-10-01', ate: '2026-11-05', contas: CONTAS, movs: [{ ...MOVS[0], valor: NaN }] } }, 'valor nulo': RESP({ movs: [{ ...MOVS[0], valor: null }] }),
  'tipo desconhecido': RESP({ movs: [{ ...MOVS[0], tipo: 'OUTRO' }] }), 'tipo minúsculo': RESP({ movs: [{ ...MOVS[0], tipo: 'debit' }] }), 'status número': RESP({ movs: [{ ...MOVS[0], status: 1 }] }),
  'mais de 5000': RESP({ movs: Array.from({ length: 5001 }, (_, i) => ({ ...MOVS[0], id: 'm' + i })) })
};
Object.keys(RUINS).forEach(k => { const r = B.validarResposta(RUINS[k]); t('resposta ruim: ' + k, r.ok === false && r.erro === 'formato'); });
t('5000 movimentos ainda passam', B.validarResposta(RESP({ movs: Array.from({ length: 5000 }, (_, i) => ({ ...MOVS[0], id: 'm' + i })) })).ok);
t('resposta com erro traz o código', B.validarResposta({ ok: false, erro: 'nao_autorizado' }).erro === 'nao_autorizado');

/* mensagens */
['sem_token', 'token_invalido', 'cliente_errado', 'sem_email', 'token_sem_email', 'email_nao_verificado', 'nao_autorizado', 'formato', 'rede', 'tempo', 'csp'].forEach(c => t('mensagem de ' + c, B.mensagem(c).length > 20 && !/_/.test(B.mensagem(c))));
t('pluggy_auth_401 traz só o número', /código 401/.test(B.mensagem('pluggy_auth_401')));
t('pluggy_500 traz só o número', /código 500/.test(B.mensagem('pluggy_500')));
['pluggy_401 USER_AUTHORIZATION_EXPIRED', 'pluggy_auth_400:USER_AUTHORIZATION_EXPIRED', 'USER_AUTHORIZATION_EXPIRED'].forEach(c => t('autorização expirada: ' + c, /Renove a conexão/.test(B.mensagem(c))));
['<img src=x onerror=alert(1)>', 'pluggy_abc', 'pluggy_500 detalhes internos', 'constructor', '__proto__', 'toString', '', null, undefined].forEach(c => t('código desconhecido não repete o texto: ' + String(c).slice(0, 24), /não conhece/.test(B.mensagem(c)) && !/onerror|internos/.test(B.mensagem(c))));

/* tradução: uma função só */
const fazer = (tipo, valor, inv) => B.mapear({ ...MOVS[0], tipo, valor }, CONTAS[0], inv);
t('DEBIT é saída', fazer('DEBIT', -12.5).direcao === 'saida');
t('CREDIT é entrada', fazer('CREDIT', 300).direcao === 'entrada');
t('o valor é sempre positivo', fazer('DEBIT', -12.5).valor === 12.5 && fazer('DEBIT', 12.5).valor === 12.5 && fazer('CREDIT', -300).valor === 300);
t('o sinal do valor não decide o sentido', fazer('DEBIT', 12.5).direcao === 'saida' && fazer('CREDIT', -300).direcao === 'entrada');
t('inverter troca o sentido', fazer('DEBIT', -1, true).direcao === 'entrada' && fazer('CREDIT', 1, true).direcao === 'saida');
t('arredonda em centavos', fazer('DEBIT', -12.345).valor === 12.35 || fazer('DEBIT', -12.345).valor === 12.34);
t('forma por tipo de conta', B.mapear(MOVS[2], CONTAS[1]).forma === 'Crédito' && B.mapear(MOVS[0], CONTAS[0]).forma === 'Débito');
t('sem descrição fica explícito', B.mapear({ ...MOVS[0], desc: '  ' }, CONTAS[0]).desc === 'Sem descrição');
t('pendente fica marcado', B.mapear(MOVS[2], CONTAS[1]).pendente === true && B.mapear(MOVS[0], CONTAS[0]).pendente === false);
t('descrição normalizada', B.normalizar('  Pão  de AÇÚCAR-3 ') === 'pao de acucar 3');

/* prévia e duplicados */
{
  const p = B.montarPrevia(DADOS(), [], [], []);
  t('prévia: todos novos e marcados', p.length === 3 && p.every(x => x.estado === 'novo' && x.marcado));
  t('prévia: traz data, descrição, valor, conta e sentido', p[0].data === '2026-11-02' && p[0].desc === 'Padaria Exemplo' && p[0].valor === 12.5 && p[0].conta === 'Conta Teste' && p[0].direcao === 'saida');
  const q = B.montarPrevia(DADOS(), [], ['m1'], []);
  t('duplicado por id local', q[0].estado === 'importado' && !q[0].marcado && q[1].estado === 'novo');
  const r = B.montarPrevia(DADOS(), [{ id: 9, data: '2026-11-03', desc: 'x', valor: -1, idExterno: 'm3' }], [], []);
  t('duplicado por id que veio em lançamento de outro aparelho', r[2].estado === 'importado');
  const lancIgual = [{ id: 1, data: '2026-11-02', desc: 'PADARIA  exemplo', valor: 12.5 }];
  const s = B.montarPrevia(DADOS(), lancIgual, [], []);
  t('duplicado por data, valor e descrição', s[0].estado === 'existe' && s[0].marcado === false && s[1].estado === 'novo');
  t('entrada não bate com gasto de mesmo valor', B.montarPrevia(DADOS(), [{ id: 1, data: '2026-11-03', desc: 'Pix recebido', valor: 300 }], [], [])[1].estado === 'novo');
  t('entrada bate com entrada', B.montarPrevia(DADOS(), [{ id: 1, data: '2026-11-03', desc: 'Pix recebido', valor: -300 }], [], [])[1].estado === 'existe');
  t('outro dia não é duplicado', B.montarPrevia(DADOS(), [{ id: 1, data: '2026-11-01', desc: 'Padaria Exemplo', valor: 12.5 }], [], [])[0].estado === 'novo');
  t('outro valor não é duplicado', B.montarPrevia(DADOS(), [{ id: 1, data: '2026-11-02', desc: 'Padaria Exemplo', valor: 12.51 }], [], [])[0].estado === 'novo');
  const inv = B.montarPrevia(DADOS(), [], [], ['c2']);
  t('inverter vale só para a conta escolhida', inv[2].direcao === 'entrada' && inv[0].direcao === 'saida' && inv[1].direcao === 'entrada');
  const rep = B.validarResposta(RESP({ movs: [MOVS[0], MOVS[0]] })).dados;
  t('mesmo id duas vezes na resposta entra uma vez', B.montarPrevia(rep, [], [], []).filter(x => x.marcado).length === 1);
  t('valor zero não entra', B.montarPrevia(B.validarResposta(RESP({ movs: [{ ...MOVS[0], valor: 0 }] })).dados, [], [], [])[0].estado === 'sem_valor');
  t('a prévia não muda a entrada', (() => { const l = [{ id: 1, data: '2026-11-02', desc: 'a', valor: 1 }], c = clone(l), ids = ['m1']; B.montarPrevia(DADOS(), l, ids, []); return JSON.stringify(l) === JSON.stringify(c) && ids.length === 1; })());
}

/* gravação */
const mem = () => { const o = {}; return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, _o: o }; };
const HOJE = new Date(2026, 10, 5), novo = (m) => St.criarStore(m || mem(), () => HOJE);
const sel = (extra) => B.montarPrevia(DADOS(), [], [], []).map(x => ({ ...x, ...(extra || {}) }));
{
  const S = novo(); S.definirModo('real');
  const r = S.importarBanco(sel());
  t('importa os três', r.ok && r.n === 3 && S.st.lanc.length === 3);
  const g = S.st.lanc.find(l => l.idExterno === 'm1'), e = S.st.lanc.find(l => l.idExterno === 'm2'), c = S.st.lanc.find(l => l.idExterno === 'm3');
  t('gasto fica positivo', g.valor === 12.5 && g.origem === 'pluggy');
  t('entrada fica negativa, como no app', e.valor === -300);
  t('cartão fica com forma Crédito', c.forma === 'Crédito' && g.forma === 'Débito');
  t('item é lançamento comum', ['id', 'data', 'desc', 'cat', 'valor', 'forma', 'essencial', 'lazer'].every(k => k in g) && g.cat === 'Outros' && !g.essencial && !g.lazer);
  t('não cria outro tipo de item', Object.keys(Sync.achatar(S.paraSync())).every(k => /^(lanc|pago|teto|meta):|^taxa$|^real$|^numeros$/.test(k)));
  const r2 = S.importarBanco(sel());
  t('importar de novo cria zero duplicados', r2.ok && r2.n === 0 && S.st.lanc.length === 3);
  const edit = S.editar(g.id, { tipo: 'gasto', valor: '13,00', desc: 'Padaria', cat: 'Comida', data: '2026-11-02', forma: 'Pix' });
  const g2 = S.st.lanc.find(l => l.id === g.id);
  t('editar mantém a origem', edit.ok && g2.origem === 'pluggy' && g2.idExterno === 'm1' && g2.valor === 13);
  const antes = S.st.lanc.length, av = S.importarBanco([{ ...sel()[0], idExterno: 'novo1' }, { ...sel()[1], idExterno: 'novo2', valor: 0 }]);
  t('item inválido: nada é gravado', !av.ok && S.st.lanc.length === antes);
  t('lista vazia não grava', !S.importarBanco([]).ok && S.st.lanc.length === antes);
}
{
  const S = novo(); S.definirModo('demo'); t('modo de exemplo não importa', !S.importarBanco(sel()).ok && S.st.lanc.length === 0);
  const Q = novo(); Q.definirModo('real');
  const mil = Array.from({ length: 3000 }, (_, i) => ({ ...sel()[0], idExterno: 'x' + i }));
  t('ids únicos mesmo com muitos itens', Q.importarBanco(mil).n === 3000 && new Set(Q.st.lanc.map(l => l.id)).size === 3000);
  const P = novo(); P.definirModo('real'); let ouvidas = 0; P.aoMudar(() => ouvidas++); P.importarBanco(sel());
  t('avisa a mudança uma vez', ouvidas === 1);
}

/* campos opcionais na limpeza */
{
  const l = { id: 7, data: '2026-11-02', desc: 'a', cat: 'Outros', valor: 1, forma: 'Débito', essencial: false, lazer: false, origem: 'pluggy', idExterno: 'abc-1' };
  const ok1 = Seg.sanearEstado({ lanc: [l] }).estado.lanc[0];
  t('limpeza mantém origem e id externo', ok1.origem === 'pluggy' && ok1.idExterno === 'abc-1');
  [['origem desconhecida', { origem: 'outra' }], ['id externo com símbolo', { idExterno: '<b>' }], ['id externo número', { idExterno: 1 }], ['id externo perigoso', { idExterno: '__proto__' }]].forEach(([n, x]) => { const r = Seg.sanearEstado({ lanc: [{ ...l, ...x }] }); t('limpeza: ' + n + ' não passa, o lançamento fica', r.estado.lanc.length === 1 && !('idExterno' in r.estado.lanc[0]) && !('origem' in r.estado.lanc[0])); });
  const semExtra = { id: 8, data: '2026-11-02', desc: 'a', cat: 'Outros', valor: 1, forma: 'Pix', essencial: false, lazer: false };
  t('lançamento comum continua igual', JSON.stringify(Seg.sanearEstado({ lanc: [semExtra] }).estado.lanc[0]) === JSON.stringify(semExtra));
  t('limparItens mantém os campos', Seg.limparItens({ 'lanc:7': { u: 1, d: false, v: l } }).itens['lanc:7'].v.idExterno === 'abc-1');
}

/* aparelho com a versão anterior: cópia congelada da limpeza dela, que só conhece oito campos */
const sanAntigo = l => ({ id: l.id, data: l.data, desc: l.desc, cat: l.cat, valor: l.valor, forma: l.forma, essencial: l.essencial === true, lazer: l.lazer === true });
const leituraAntiga = itens => { const o = {}; Object.keys(itens).forEach(k => { const it = itens[k]; o[k] = !it.d && k.startsWith('lanc:') ? { u: it.u, d: false, v: sanAntigo(it.v) } : clone(it); }); return o; };
{
  const S = novo(); S.definirModo('real'); S.importarBanco(sel());
  const idM1 = S.st.lanc.find(l => l.idExterno === 'm1').id, k1 = 'lanc:' + idM1;
  const dono = Sync.atualizar({ ...S.paraSync(), real: undefined }, {}, 1000);   // loja de teste sem arquivo importado
  /* o aparelho antigo lê, não se perde e não quebra */
  let velho = Sync.juntar({}, leituraAntiga(clone(dono)));
  let stV = Sync.montar(velho);
  t('antigo: recebe os três lançamentos', stV.lanc.length === 3 && stV.lanc.find(l => l.id === idM1).valor === 12.5);
  t('antigo: passa pela limpeza real sem descartar', Seg.limparItens(clone(velho)).descartados === 0);
  const velho2 = Sync.atualizar(stV, velho, 1000);
  t('antigo: sem mudança não muda a hora', velho2[k1].u === 1000);
  /* o antigo lança outra coisa e escreve no Drive */
  stV.lanc.push({ id: 555, data: '2026-11-05', desc: 'Do antigo', cat: 'Outros', valor: 5, forma: 'Pix', essencial: false, lazer: false });
  velho = Sync.atualizar(stV, velho, 2000);
  t('antigo: o item importado segue com a hora original', velho[k1].u === 1000 && !velho[k1].d);
  /* o dono lê de volta */
  const lido = Seg.limparItens(clone(velho));
  let junto = Sync.juntar(dono, lido.itens), stN = Sync.montar(junto);
  t('dono: nada descartado', lido.descartados === 0);
  t('dono: os quatro lançamentos ficam', stN.lanc.length === 4 && stN.lanc.some(l => l.id === 555));
  t('dono: o valor do importado não muda', stN.lanc.find(l => l.id === idM1).valor === 12.5);
  /* empate de hora: quem escreve por último é o antigo, sem os campos extras */
  const ids = stN.lanc.filter(l => l.idExterno).map(l => l.idExterno);
  const previa = B.montarPrevia(DADOS(), stN.lanc, ['m1', 'm2', 'm3'], []);
  t('sem os campos extras, o conjunto local ainda barra o duplicado', previa.every(x => x.estado === 'importado'));
  const semLocal = B.montarPrevia(DADOS(), stN.lanc, ids, []);
  t('sem o conjunto local, data, valor e descrição ainda barram', semLocal.every(x => x.estado !== 'novo'));
  /* lápide: o dono apaga, o antigo respeita */
  const apagado = { ...stN, lanc: stN.lanc.filter(l => l.id !== idM1) };
  const donoApagou = Sync.atualizar(apagado, junto, 3000);
  t('lápide: marcada no dono', donoApagou[k1].d === true && donoApagou[k1].u === 3000);
  const paraAntigo = leituraAntiga(clone(donoApagou)), velho3 = Sync.juntar(velho, paraAntigo);
  t('lápide: o antigo apaga', velho3[k1].d === true && !Sync.montar(velho3).lanc.some(l => l.id === idM1));
  /* o antigo apaga, o dono respeita */
  const stV2 = Sync.montar(velho), idM2 = stV2.lanc.find(l => l.valor === -300).id, k2 = 'lanc:' + idM2;
  const velhoApagou = Sync.atualizar({ ...stV2, lanc: stV2.lanc.filter(l => l.id !== idM2) }, velho, 4000);
  const dono2 = Sync.juntar(dono, Seg.limparItens(clone(velhoApagou)).itens);
  t('lápide do antigo chega ao dono', dono2[k2].d === true && !Sync.montar(dono2).lanc.some(l => l.id === idM2));
  /* a mais recente vence */
  const novaV = stV.lanc.map(l => l.id === idM1 ? { ...l, valor: 99 } : l);
  const velhoEd = Sync.atualizar({ ...stV, lanc: novaV }, velho, 5000), dono3 = Sync.juntar(dono, Seg.limparItens(clone(velhoEd)).itens);
  t('edição mais recente do antigo vence', Sync.montar(dono3).lanc.find(l => l.id === idM1).valor === 99);
  const donoEd = Sync.atualizar({ ...Sync.montar(dono), lanc: Sync.montar(dono).lanc.map(l => l.id === idM1 ? { ...l, valor: 77 } : l) }, dono, 6000);
  const tudo = Sync.juntar(velhoEd, leituraAntiga(clone(donoEd)));
  t('edição mais recente do dono vence no antigo', Sync.montar(tudo).lanc.find(l => l.id === idM1).valor === 77);
  /* versão nova nos dois aparelhos: campos sobrevivem à ida e volta */
  const ida = Seg.limparItens(clone(dono)).itens;
  t('versão nova: campos sobrevivem à ida e volta', Sync.montar(ida).lanc.every(l => l.origem === 'pluggy' && l.idExterno));
  t('versão nova: aplicar mantém os campos', (() => { const Z = novo(); Z.definirModo('real'); Z.aplicar(Sync.montar(ida)); return Z.st.lanc.every(l => l.idExterno); })());
}

/* conversa com a ponte: fetch simulado */
(async () => {
  const resp = (corpo, o) => ({ ok: !o || o.ok !== false, text: async () => corpo });
  let visto = null;
  const r = await B.consultar({ url: URLOK, token: 'token-inventado', fetch: async (u, o) => { visto = [u, o]; return resp(JSON.stringify(RESP())); } });
  t('consulta: devolve dados validados', r.ok && r.dados.movs.length === 3);
  t('consulta: POST em text/plain', visto[0] === URLOK && visto[1].method === 'POST' && visto[1].headers['Content-Type'] === 'text/plain');
  t('consulta: corpo combinado', JSON.stringify(JSON.parse(visto[1].body)) === JSON.stringify({ token: 'token-inventado', tipo: 'access', dias: 35 }));
  t('consulta: token nunca vai na URL', !/token/.test(visto[0]));
  t('consulta: sem cookies e sem cache', visto[1].credentials === 'omit' && visto[1].cache === 'no-store');
  const casos = [['rede fora', async () => { throw new TypeError('rede'); }, 'rede'], ['html no lugar de JSON', async () => resp('<!doctype html><title>Entrar</title>'), 'formato'], ['json quebrado', async () => resp('{"ok":'), 'formato'], ['status 500', async () => resp('x', { ok: false }), 'formato'], ['corpo grande demais', async () => resp('x'.repeat(5 * 1024 * 1024 + 1)), 'formato'], ['resposta vazia', async () => resp(''), 'formato']];
  for (const [n, fe, e] of casos) { const x = await B.consultar({ url: URLOK, token: 't', fetch: fe }); t('consulta: ' + n, x.ok === false && x.erro === e); }
  const lenta = await B.consultar({ url: URLOK, token: 't', espera: 5, fetch: (u, o) => new Promise((_, n) => o.signal.addEventListener('abort', () => n(new Error('abortado')))) });
  t('consulta: demora vira mensagem própria', lenta.erro === 'tempo');
  const naoOk = await B.consultar({ url: URLOK, token: 't', fetch: async () => resp(JSON.stringify({ ok: false, erro: 'token_sem_email' })) });
  t('consulta: erro da ponte chega como código', naoOk.ok === false && naoOk.erro === 'token_sem_email');

  /* repositório público e privacidade */
  const src = ['banco.js', 'app.js', 'sync.js', 'store.js', 'seguranca.js', 'config.js', 'sw.js', 'index.html'].map(a => fs.readFileSync(a, 'utf8')).join('\n');
  t('nenhum endereço de ponte no código', !/\/macros\/s\/|AKfyc|script\.googleusercontent/.test(src.replace(/\\\.google\(usercontent\)\?\\\.com/g, '')));
  t('nenhum serviço de banco no código', !/api\.pluggy|pluggy\.ai|clientSecret|client_secret/i.test(src));
  const b = fs.readFileSync('banco.js', 'utf8');
  t('banco.js só cita um host', new Set([...b.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map(m => m[1])).size === 1 && /https:\/\/script\.google\.com/.test(b));
  t('banco.js não escreve em log', !/console\.|localStorage|sessionStorage|caches\.|document\.|location/.test(b));
  const app = fs.readFileSync('app.js', 'utf8'), bloco = app.slice(app.indexOf('/* ===== Conexão bancária'), app.indexOf('function fecharMais(){'));
  t('bloco do app não escreve em log', bloco.length > 1000 && !/console\.|sessionStorage|location\.|history\./.test(bloco));
  t('bloco do app não guarda a resposta', !/save0\('tf_banco_(dados|resp|mov)/.test(bloco) && !/save0\('tf_banco_(ids|inv|url|on)'/.test(bloco) === false);
  const sw = fs.readFileSync('sw.js', 'utf8');
  t('service worker só guarda GET da própria origem', /e\.request\.method !== 'GET' \|\| u\.origin !== location\.origin\) return/.test(sw));
  t('banco.js está no casco e no index', /'banco\.js'/.test(sw) && /<script src="banco\.js">/.test(fs.readFileSync('index.html', 'utf8')));
  t('escopo e fluxo do Google não mudaram', /escopo: 'https:\/\/www\.googleapis\.com\/auth\/drive\.file'/.test(fs.readFileSync('sync.js', 'utf8')) && /response_type: 'token'/.test(fs.readFileSync('sync.js', 'utf8')));
  console.log(f ? f + ' falha(s) de ' + (ok + f) : 'Todos os ' + ok + ' testes da conexão bancária passaram.');
  process.exit(f ? 1 : 0);
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
