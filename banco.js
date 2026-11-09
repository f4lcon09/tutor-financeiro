/* Conexão bancária (em teste): lógica pura, sem DOM. Testada em node (test_banco.js).
   Nunca guarda endereço, token ou resposta aqui. A resposta da ponte é não confiável: só passa o que tem a forma combinada.
   Texto do servidor nunca chega à tela: só as mensagens fixas abaixo. */
(function (root) {
  var MAX_MOVS = 5000, MAX_CONTAS = 50, MAX_BYTES = 5 * 1024 * 1024, DIAS = 35, ESPERA_MS = 60000, LIM_DESC = 200;
  var RE_ID = /^[A-Za-z0-9_-]{1,80}$/, RE_DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  var isObj = function (x) { return !!x && typeof x === 'object' && !Array.isArray(x); };
  var num = function (x) { return typeof x === 'number' && isFinite(x); };
  var texto = function (x, max) { return typeof x === 'string' && x.length <= max; };
  var ouNulo = function (x, max) { return x === null || x === undefined || texto(x, max); };
  function dataOk(s) {
    if (typeof s !== 'string' || !RE_DATA.test(s)) return false;
    var p = s.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.getFullYear() === +p[0] && d.getMonth() === +p[1] - 1 && d.getDate() === +p[2];
  }

  /* endereço da ponte: só https em script.google.com, sem usuário, senha ou porta */
  function validarUrl(s) {
    var erro = { ok: false, erro: 'Informe o endereço completo da ponte, começando com https://script.google.com/' };
    if (typeof s !== 'string' || !s.trim() || s.length > 500) return erro;
    var u; try { u = new URL(s.trim()); } catch (e) { return erro; }
    if (u.protocol !== 'https:' || u.hostname !== 'script.google.com' || u.port || u.username || u.password) return erro;
    return { ok: true, url: u.href };
  }

  /* resposta da ponte -> {ok:true, dados} ou {ok:false, erro:<código>}. Monta objetos novos: nada extra passa. */
  function validarResposta(j) {
    var ruim = { ok: false, erro: 'formato' };
    if (!isObj(j) || typeof j.ok !== 'boolean') return ruim;
    if (!j.ok) return typeof j.erro === 'string' && j.erro && j.erro.length <= 300 ? { ok: false, erro: j.erro } : ruim;
    var d = j.dados;
    if (!isObj(d) || !dataOk(d.de) || !dataOk(d.ate) || !Array.isArray(d.contas) || !Array.isArray(d.movs)) return ruim;
    if (d.contas.length > MAX_CONTAS || d.movs.length > MAX_MOVS) return ruim;
    var ids = new Set(), contas = [], movs = [], i, c, m;
    for (i = 0; i < d.contas.length; i++) {
      c = d.contas[i];
      if (!isObj(c) || !RE_ID.test(c.id) || ids.has(c.id) || !texto(c.tipo, 40) || !ouNulo(c.subtipo, 40) || !texto(c.nome, 200) || !c.nome.trim() || !num(c.saldo) || !ouNulo(c.item, 80)) return ruim;
      ids.add(c.id); contas.push({ id: c.id, tipo: c.tipo, subtipo: c.subtipo == null ? null : c.subtipo, nome: c.nome.trim() });
    }
    for (i = 0; i < d.movs.length; i++) {
      m = d.movs[i];
      if (!isObj(m) || !RE_ID.test(m.id) || !ids.has(m.conta) || !dataOk(m.data) || !texto(m.desc, 1000) || !num(m.valor) || (m.tipo !== 'DEBIT' && m.tipo !== 'CREDIT') || !ouNulo(m.status, 40)) return ruim;
      movs.push({ id: m.id, conta: m.conta, data: m.data, desc: m.desc, valor: m.valor, tipo: m.tipo, status: m.status == null ? null : m.status });
    }
    return { ok: true, dados: { de: d.de, ate: d.ate, contas: contas, movs: movs } };
  }

  /* códigos -> PT-BR. Nunca devolve o texto recebido. */
  var FIXAS = {
    sem_token: 'A ponte não recebeu o acesso do Google. Toque no ícone de nuvem, no topo, e tente de novo.',
    token_invalido: 'A ponte recusou o acesso do Google. Toque no ícone de nuvem, no topo, para reconectar.',
    cliente_errado: 'O acesso do Google veio de outro app. Confira a configuração da ponte.',
    sem_email: 'A ponte não conseguiu confirmar sua conta Google. Confira a configuração da ponte.',
    token_sem_email: 'O acesso do Google não informa o seu e-mail, e a ponte precisa dele para reconhecer você.',
    email_nao_verificado: 'O e-mail desta conta Google não está verificado.',
    nao_autorizado: 'Esta conta Google não tem permissão para usar a ponte.',
    formato: 'A ponte respondeu em um formato inesperado. Nada foi importado.',
    rede: 'Não consegui falar com a ponte. Confira a internet e o endereço.',
    tempo: 'A ponte demorou demais para responder. Tente de novo.',
    csp: 'A política de segurança do app ainda não permite falar com a ponte. Nada foi enviado.',
    expirada: 'A autorização do banco expirou. Renove a conexão e tente de novo.'
  };
  function mensagem(cod) {
    var c = String(cod || ''), m;
    if (/USER_AUTHORIZATION_EXPIRED/.test(c)) return FIXAS.expirada;
    if (Object.prototype.hasOwnProperty.call(FIXAS, c)) return FIXAS[c];
    if ((m = /^pluggy_auth_(\d{1,4})$/.exec(c))) return 'A ponte não conseguiu entrar no serviço do banco (código ' + m[1] + ').';
    if ((m = /^pluggy_(\d{1,4})$/.exec(c))) return 'O serviço do banco devolveu um erro (código ' + m[1] + ').';
    return 'A ponte devolveu um erro que o app não conhece. Nada foi importado.';
  }

  /* pede os dados à ponte e devolve o JSON ainda não conferido ({ok:true, j}) ou {ok:false, erro}. fetch é injetado para os testes. */
  async function pedir(o) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null, tempo = false;
    var timer = ctrl ? setTimeout(function () { tempo = true; ctrl.abort(); }, o.espera || ESPERA_MS) : null, r, t;
    try {
      r = await o.fetch(o.url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ token: o.token, tipo: 'access', dias: DIAS }), redirect: 'follow', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: ctrl ? ctrl.signal : undefined });
      if (!r || !r.ok) return { ok: false, erro: 'formato' };
      t = await r.text();
    } catch (e) { return { ok: false, erro: tempo ? 'tempo' : 'rede' }; } finally { if (timer) clearTimeout(timer); }
    if (typeof t !== 'string' || t.length > MAX_BYTES) return { ok: false, erro: 'formato' };
    var j; try { j = JSON.parse(t); } catch (e) { return { ok: false, erro: 'formato' }; }
    return { ok: true, j: j };
  }
  /* pede e confere: só passa o que tem a forma combinada */
  async function consultar(o) { var p = await pedir(o); return p.ok ? validarResposta(p.j) : p; }

  /* ===== Diagnóstico só de estrutura (dono): contagens e nomes de campos conhecidos. Nunca devolve valor, nome, descrição ou id vindo da ponte. ===== */
  var LIM_DIAG = 20000;
  var CHAVES_BANCO = ['closingBalance', 'automaticallyInvestedBalance', 'overdraftContractedLimit', 'overdraftUsedLimit'];
  var CHAVES_CRED = ['creditLimit', 'availableCreditLimit', 'balanceCloseDate', 'balanceDueDate', 'minimumPayment'];
  /* lista fixa, por campo, dos valores do serviço do banco que podem aparecer. Qualquer outro valor vira "outro" e só é contado:
     a segurança não depende do formato do que a ponte manda. Situações de item: nomes A Confirmar.
     Investimentos: enums do esquema na documentação do Pluggy (referência da API, página "investments-retrieve"; o endereço fica fora do código),
     passados pelo dono em 09/11/2026. A documentação não diz que as listas são completas: um valor novo aparece como "outro" até entrar aqui. */
  var LISTA_DIAG = {
    contaTipo: ['BANK', 'CREDIT'],
    contaSubtipo: ['CHECKING_ACCOUNT', 'SAVINGS_ACCOUNT', 'CREDIT_CARD'],
    movStatus: ['POSTED', 'PENDING'],
    itemStatus: ['UPDATED', 'UPDATING', 'WAITING_USER_INPUT', 'LOGIN_ERROR', 'OUTDATED'],
    invTipo: ['COE', 'EQUITY', 'ETF', 'FIXED_INCOME', 'MUTUAL_FUND', 'SECURITY', 'OTHER'],
    invSubtipo: ['STRUCTURED_NOTE', 'STOCK', 'ETF', 'REAL_ESTATE_FUND', 'BDR', 'DERIVATIVES', 'OPTION', 'TREASURY', 'LCI', 'LCA', 'LC', 'LF', 'CDB', 'CRI', 'CRA', 'DEBENTURES', 'CORPORATE_DEBT',
      'INVESTMENT_FUND', 'MULTIMARKET_FUND', 'FIXED_INCOME_FUND', 'STOCK_FUND', 'ETF_FUND', 'OFFSHORE_FUND', 'FIP_FUND', 'EXCHANGE_FUND', 'FI_INFRA', 'FI_AGRO', 'RETIREMENT', 'OTHER']
  };
  var ROTULO_FORA = [['contaTipo', 'tipo de conta'], ['contaSubtipo', 'subtipo de conta'], ['movStatus', 'status de movimento'], ['itemStatus', 'status de item'], ['invTipo', 'tipo de investimento'], ['invSubtipo', 'subtipo de investimento']];
  /* devolve um conferidor novo a cada diagnóstico: vazio vira null, valor da lista passa, o resto vira "outro" e soma em fora[campo] */
  var conferidor = function () {
    var fora = {}; ROTULO_FORA.forEach(function (p) { fora[p[0]] = 0; });
    var f = function (x, campo) {
      if (x === null || x === undefined || x === '') return null;
      if (typeof x === 'string' && LISTA_DIAG[campo].indexOf(x) >= 0) return x;
      fora[campo]++; return 'outro';
    };
    f.fora = fora; return f;
  };
  var lista = function (x) { return Array.isArray(x) ? x.slice(0, LIM_DIAG) : null; };
  var tipoData = function (x) { return typeof x !== 'string' || !x.trim() ? 'ausente' : /^\d{4}-\d{2}-\d{2}/.test(x) && dataOk(x.slice(0, 10)) ? 'data' : 'texto'; };
  var soma1 = function (m, k) { m[k] = (m[k] || 0) + 1; };
  var pares = function (m) { return Object.keys(m).sort().map(function (k) { return [k, m[k]]; }); };
  function contaChaves(objs, chaves) {
    var out = { com: 0, chaves: {}, outras: 0 };
    chaves.forEach(function (k) { out.chaves[k] = 0; });
    objs.forEach(function (o) {
      if (!isObj(o)) return;
      out.com++;
      var outra = false;
      Object.keys(o).forEach(function (k) { if (chaves.indexOf(k) >= 0) { if (o[k] !== undefined && o[k] !== null) out.chaves[k]++; } else outra = true; });
      if (outra) out.outras++;
    });
    return out;
  }
  /* reserva do Nubank e do Mercado Pago: só "achou ou não", pelo nome (heurística, A Confirmar no teste real) */
  var INST = { nubank: /\bnu ?bank\b|\bnu pagamentos\b/, mercadoPago: /\bmercado ?pago\b/ };
  var RE_RESERVA = /\bcaixinhas?\b|\bcofrinhos?\b|\breservas?\b/;
  /* resposta bruta da ponte -> {ok:true, e} com só contagens, ou {ok:false, erro}. hojeISO = "AAAA-MM-DD" local. */
  function estrutura(j, hojeISO) {
    if (!isObj(j) || typeof j.ok !== 'boolean') return { ok: false, erro: 'formato' };
    if (!j.ok) return typeof j.erro === 'string' && j.erro && j.erro.length <= 300 ? { ok: false, erro: j.erro } : { ok: false, erro: 'formato' };
    var d = j.dados, e = { dados: isObj(d) }, token = conferidor();
    if (!e.dados) return { ok: true, e: e };
    e.fora = token.fora;
    e.periodo = { de: dataOk(d.de), ate: dataOk(d.ate) };
    e.periodo.dias = e.periodo.de && e.periodo.ate ? Math.round((Date.UTC(+d.ate.slice(0, 4), +d.ate.slice(5, 7) - 1, +d.ate.slice(8, 10)) - Date.UTC(+d.de.slice(0, 4), +d.de.slice(5, 7) - 1, +d.de.slice(8, 10))) / 864e5) : null;
    var contas = lista(d.contas), movs = lista(d.movs), faturas = lista(d.faturas), inv = lista(d.investimentos), itens = lista(d.itens);
    var cs = (contas || []).filter(isObj), porTipo = {};
    cs.forEach(function (c) { soma1(porTipo, (token(c.tipo, 'contaTipo') || 'sem tipo') + ' / ' + (token(c.subtipo, 'contaSubtipo') || 'sem subtipo')); });
    e.contas = { presente: !!contas, total: contas ? contas.length : 0, invalidas: contas ? contas.length - cs.length : 0, porTipo: pares(porTipo),
      comAtualizado: cs.filter(function (c) { return tipoData(c.atualizado) !== 'ausente'; }).length, comSaldo: cs.filter(function (c) { return num(c.saldo); }).length,
      banco: contaChaves(cs.map(function (c) { return c.banco; }), CHAVES_BANCO), credito: contaChaves(cs.map(function (c) { return c.credito; }), CHAVES_CRED) };
    var ms = (movs || []).filter(isObj), st = {}, tp = {}, parc = 0, parcRuim = 0, cat = 0;
    ms.forEach(function (m) {
      var s = token(m.status, 'movStatus'); soma1(st, s || 'sem status');
      soma1(tp, m.tipo === 'DEBIT' || m.tipo === 'CREDIT' ? m.tipo : 'outro');
      if (m.parc != null) { var p = m.parc; if (isObj(p) && Number.isInteger(p.n) && Number.isInteger(p.de) && p.n >= 1 && p.de >= p.n && p.de <= 120) parc++; else parcRuim++; }
      if (typeof m.cat === 'string' && m.cat.trim()) cat++;
    });
    e.movs = { presente: !!movs, total: movs ? movs.length : 0, status: st, tipo: tp, comParc: parc, parcInvalida: parcRuim, comCat: cat };
    var fats = (faturas || []).filter(isObj), hm = +hojeISO.slice(0, 4) * 12 + +hojeISO.slice(5, 7), comVence = 0, futuras = 0, meses = null;
    fats.forEach(function (f) {
      if (!dataOk(f.vence)) return; comVence++;
      if (f.vence > hojeISO) { futuras++; var m = +f.vence.slice(0, 4) * 12 + +f.vence.slice(5, 7) - hm; meses = meses == null ? m : Math.max(meses, m); }
    });
    e.faturas = { presente: !!faturas, total: faturas ? faturas.length : 0, comVence: comVence, futuras: futuras, mesesFrente: meses };
    var vs = (inv || []).filter(isObj), porTipoI = {};
    vs.forEach(function (v) { soma1(porTipoI, (token(v.tipo, 'invTipo') || 'sem tipo') + ' / ' + (token(v.subtipo, 'invSubtipo') || 'sem subtipo')); });
    e.investimentos = { presente: !!inv, total: inv ? inv.length : 0, porTipo: pares(porTipoI), comSaldo: vs.filter(function (v) { return num(v.saldo); }).length };
    /* itens: rótulo pela ordem ("item 1"); o id só serve para ligar contas e investimentos ao item, nunca sai daqui */
    var is = (itens || []).filter(isObj), chaveItem = function (x) { return typeof x === 'string' && x ? x : null; };
    e.itens = { presente: !!itens, total: itens ? itens.length : 0, lista: is.map(function (it, i) {
      var k = chaveItem(it.item);
      return { rotulo: 'item ' + (i + 1), atualizado: tipoData(it.atualizado), status: token(it.status, 'itemStatus') || 'ausente',
        contas: k ? cs.filter(function (c) { return c.item === k; }).length : 0, investimentos: k ? vs.filter(function (v) { return v.item === k; }).length : 0 };
    }) };
    var conhecidos = new Set(is.map(function (it) { return chaveItem(it.item); }).filter(Boolean));
    e.itens.semInfo = new Set(cs.concat(vs).map(function (x) { return chaveItem(x.item); }).filter(function (k) { return k && !conhecidos.has(k); })).size;
    e.reservas = {};
    /* só nome em texto é olhado: outro tipo vira vazio (String() de um objeto estranho poderia lançar erro) */
    var nomeDe = function (x) { return typeof x.nome === 'string' ? normalizar(x.nome.slice(0, 200)) : ''; };
    Object.keys(INST).forEach(function (nome) {
      var re = INST[nome], doBanco = new Set();
      cs.forEach(function (c) { if (re.test(nomeDe(c)) && chaveItem(c.item)) doBanco.add(c.item); });
      vs.forEach(function (v) { if (re.test(nomeDe(v)) && chaveItem(v.item)) doBanco.add(v.item); });
      var seus = vs.filter(function (v) { return doBanco.has(v.item) || re.test(nomeDe(v)); });
      e.reservas[nome] = { conta: cs.some(function (c) { return re.test(nomeDe(c)); }), investimentos: seus.length, nomeReserva: seus.some(function (v) { return RE_RESERVA.test(nomeDe(v)); }) };
    });
    return { ok: true, e: e };
  }
  /* o diagnóstico em linhas de texto fixo + números, para a tela e para copiar. {t, n} = texto e recuo. */
  function estruturaLinhas(e) {
    var L = [], add = function (t, n) { L.push({ t: t, n: n || 0 }); }, sn = function (b) { return b ? 'sim' : 'não'; };
    if (!e.dados) { add('dados: ausente (a ponte respondeu ok, mas sem o bloco de dados)'); return L; }
    add('Período: de ' + (e.periodo.de ? 'presente' : 'ausente') + ', até ' + (e.periodo.ate ? 'presente' : 'ausente') + (e.periodo.dias != null ? ' (' + e.periodo.dias + ' dias)' : ''));
    var c = e.contas;
    add('contas: ' + (c.presente ? c.total + (c.invalidas ? ' (' + c.invalidas + ' fora do formato)' : '') : 'ausente'));
    c.porTipo.forEach(function (p) { add(p[0] + ': ' + p[1], 1); });
    if (c.presente) {
      add('com atualizado: ' + c.comAtualizado + ' de ' + (c.total - c.invalidas) + '; com saldo numérico: ' + c.comSaldo, 1);
      add('com banco: ' + c.banco.com + (c.banco.com ? ' (' + CHAVES_BANCO.map(function (k) { return k + ' em ' + c.banco.chaves[k]; }).join(', ') + (c.banco.outras ? ', outras chaves em ' + c.banco.outras : '') + ')' : ''), 1);
      add('com credito: ' + c.credito.com + (c.credito.com ? ' (' + CHAVES_CRED.map(function (k) { return k + ' em ' + c.credito.chaves[k]; }).join(', ') + (c.credito.outras ? ', outras chaves em ' + c.credito.outras : '') + ')' : ''), 1);
    }
    var m = e.movs;
    add('movs: ' + (m.presente ? m.total : 'ausente'));
    if (m.presente) {
      add('por status: ' + ['POSTED', 'PENDING', 'outro', 'sem status'].map(function (k) { return k + ' ' + (m.status[k] || 0); }).join(', '), 1);
      add('por tipo: ' + ['DEBIT', 'CREDIT', 'outro'].map(function (k) { return k + ' ' + (m.tipo[k] || 0); }).join(', '), 1);
      add('com parc: ' + m.comParc + (m.parcInvalida ? ' (mais ' + m.parcInvalida + ' fora do formato n de N)' : '') + '; com cat: ' + m.comCat, 1);
    }
    var f = e.faturas;
    add('faturas: ' + (f.presente ? f.total : 'ausente'));
    if (f.presente) add('com vencimento: ' + f.comVence + '; vencimento futuro: ' + (f.futuras ? 'sim, ' + f.futuras + ', até ' + f.mesesFrente + (f.mesesFrente === 1 ? ' mês' : ' meses') + ' à frente' : 'não'), 1);
    var v = e.investimentos;
    add('investimentos: ' + (v.presente ? v.total : 'ausente'));
    v.porTipo.forEach(function (p) { add(p[0] + ': ' + p[1], 1); });
    if (v.presente && v.total) add('com saldo numérico: ' + v.comSaldo, 1);
    var it = e.itens;
    add('itens: ' + (it.presente ? it.total : 'ausente') + (it.semInfo ? '; ' + it.semInfo + ' item(ns) citado(s) em contas ou investimentos sem informação em itens' : ''));
    it.lista.forEach(function (x) { add(x.rotulo + ': atualizado ' + x.atualizado + ', status ' + x.status + ', ' + x.contas + ' conta(s), ' + x.investimentos + ' investimento(s)', 1); });
    [['nubank', 'Nubank'], ['mercadoPago', 'Mercado Pago']].forEach(function (p) {
      var r = e.reservas[p[0]];
      add('Reserva ' + p[1] + ' (pelo nome, A Confirmar): conta com o nome ' + sn(r.conta) + '; investimentos do mesmo item ' + r.investimentos + '; algum com nome de caixinha, cofrinho ou reserva ' + sn(r.nomeReserva));
    });
    add('banco.closingBalance: ' + (c.presente && c.banco.chaves.closingBalance ? 'existe em ' + c.banco.chaves.closingBalance + ' conta(s)' : 'não existe'));
    add('banco.automaticallyInvestedBalance: ' + (c.presente && c.banco.chaves.automaticallyInvestedBalance ? 'existe em ' + c.banco.chaves.automaticallyInvestedBalance + ' conta(s)' : 'não existe'));
    add('Fora da lista fixa (aparecem como outro): ' + ROTULO_FORA.map(function (p) { return p[1] + ' outro (' + e.fora[p[0]] + ')'; }).join(', '));
    return L;
  }
  /* ===== Conferir saldos (dono): saldo de cada conta, só para a tela. Nada aqui é guardado. ===== */
  function saldos(j) {
    if (!isObj(j) || typeof j.ok !== 'boolean') return { ok: false, erro: 'formato' };
    if (!j.ok) return typeof j.erro === 'string' && j.erro && j.erro.length <= 300 ? { ok: false, erro: j.erro } : { ok: false, erro: 'formato' };
    var d = j.dados; if (!isObj(d) || !Array.isArray(d.contas)) return { ok: false, erro: 'formato' };
    var ids = new Set(), contas = [], fora = 0;
    d.contas.slice(0, MAX_CONTAS).forEach(function (c) {
      if (!isObj(c) || typeof c.id !== 'string' || !RE_ID.test(c.id) || ids.has(c.id) || !texto(c.tipo, 40) || !ouNulo(c.subtipo, 40) || !texto(c.nome, 200) || !c.nome.trim() || !num(c.saldo)) { fora++; return; }
      ids.add(c.id);
      var b = isObj(c.banco) ? c.banco : {};
      contas.push({ id: c.id, tipo: c.tipo, subtipo: c.subtipo == null ? null : c.subtipo, nome: c.nome.trim(), saldo: c.saldo,
        fechamento: num(b.closingBalance) ? b.closingBalance : null, investidoAuto: num(b.automaticallyInvestedBalance) ? b.automaticallyInvestedBalance : null });
    });
    fora += Math.max(0, d.contas.length - MAX_CONTAS);
    var vs = Array.isArray(d.investimentos) ? d.investimentos.slice(0, LIM_DIAG).filter(function (v) { return isObj(v) && num(v.saldo); }) : [];
    return { ok: true, contas: contas, fora: fora, invest: { presente: Array.isArray(d.investimentos), n: vs.length, soma: r2(vs.reduce(function (s, v) { return s + v.saldo; }, 0)) } };
  }

  var r2 = function (x) { return Math.round(x * 100) / 100; };
  /* única camada de tradução. Sentido vem de tipo (DEBIT = saída, CREDIT = entrada); inverter é escolha do dono, por conta. */
  function mapear(mov, conta, inverter) {
    var entrada = mov.tipo === 'CREDIT';
    if (inverter) entrada = !entrada;
    return { idExterno: mov.id, contaId: conta.id, conta: conta.nome, data: mov.data, desc: String(mov.desc).trim().slice(0, LIM_DESC) || 'Sem descrição', valor: r2(Math.abs(mov.valor)), direcao: entrada ? 'entrada' : 'saida', pendente: mov.status === 'PENDING', forma: conta.tipo === 'CREDIT' ? 'Crédito' : 'Débito' };
  }

  var normalizar = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
  /* valor com sinal do app: gasto positivo, entrada negativa */
  var chave = function (data, valorComSinal, desc) { return data + '|' + Math.round(valorComSinal * 100) + '|' + normalizar(desc); };

  /* texto normalizado (sem acento, minúsculo). Lista única, sem nome de pessoa ou de empresa. A Confirmar com extratos reais. */
  var PADROES = {
    fatura: [/\bpagamento (de |da |do )?fatura\b/, /\bpag(t|to)? (de |da |do )?fatura\b/, /\bfatura (do |de )?cartao\b/, /\bpagamento (do |de )?cartao( de credito)?\b(?! debito)/, /\bpgto (do |de )?cartao\b/],
    reserva: [/\b(caixinha|cofrinho)\b/, /\bresgate\b/, /\baplicacao (rdb|cdb|automatica|financeira|em (rdb|cdb|reserva|poupanca))\b/, /\bguardar\b/, /\bguardad[oa]\b/, /\breserva de emergencia\b/, /\b(transferencia|transf) (para|pra|da|de|entre) .*\b(poupanca|reserva|cofre)\b/, /\bentre contas\b/, /\b(deposito|retirada) (em|na|no|da|do) (cofre|reserva|poupanca)\b/, /^dinheiro reservado\b/, /^dinheiro retirado\b/],
    transferencia: [/\bpix (recebido|enviado)\b/, /\b(transferencia|transf) (recebida|enviada)\b/, /\bted\b/, /\bdoc\b/],
    compra: [/^pagamento com\b/, /\bcompra (no |na |em |de |com )?(debito|credito)\b/],
    cartaoFatura: [/\bpagamento recebido\b/, /\bpagamento (de |da |do )?fatura\b/]   // só em conta de cartão (CREDIT). Texto real do cartão: A Confirmar
  };
  var RAZOES = { fatura: 'As compras já entram pelo cartão. Se importar, entra como não é gasto, para não contar duas vezes.', cartao: 'Pagamento da fatura só move dinheiro da conta para o cartão. Se importar, entra como não é gasto.' };
  var combina = function (lista, desc) { var d = normalizar(desc); return lista.some(function (r) { return r.test(d); }); };

  /* nomes das contas: nome + tipo; se dois baterem, entra o subtipo; se ainda baterem, um número. O nome dado pelo dono vale sobre tudo. */
  var SUBTIPOS = { CHECKING_ACCOUNT: 'corrente', SAVINGS_ACCOUNT: 'poupança', CREDIT_CARD: 'crédito' };
  var subtipoTxt = function (s) { return s ? (SUBTIPOS[s] || String(s).replace(/_/g, ' ').toLowerCase()) : ''; };
  function padraoConta(c) { return c.nome + (c.tipo === 'CREDIT' ? ' · cartão' : ' · conta'); }
  function rotulos(contas, renomes) {
    var ren = renomes || new Map(), out = new Map();
    var ordem = contas.filter(function (c) { return !ren.get(c.id); }).slice().sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    var grupo = function (lista, f) { var g = new Map(); lista.forEach(function (c) { var k = f(c); if (!g.has(k)) g.set(k, []); g.get(k).push(c); }); return g; };
    grupo(ordem, padraoConta).forEach(function (cs, base) {
      if (cs.length === 1) { out.set(cs[0].id, base); return; }
      var comSub = function (c) { var s = subtipoTxt(c.subtipo); return s ? base + ' · ' + s : base; };
      grupo(cs, comSub).forEach(function (ds, nome) {
        if (ds.length === 1) { out.set(ds[0].id, nome); return; }
        ds.forEach(function (c, i) { out.set(c.id, nome + ' ' + (i + 1)); });
      });
    });
    contas.forEach(function (c) { if (ren.get(c.id)) out.set(c.id, ren.get(c.id)); });
    return out;
  }
  function limparNome(s) { return typeof s === 'string' ? s.trim().slice(0, 60) : ''; }

  /* marca o que não é gasto nem ganho: pares entre contas do dono, reserva e pagamento de fatura. Nada some: só vem desmarcado.
     Par exige mesmo valor, sentidos opostos, contas diferentes, até 1 dia e descrições com cara de transferência. Mais de um candidato: não forma par. */
  var pareceTransferencia = function (desc) { return !combina(PADROES.compra, desc) && (combina(PADROES.transferencia, desc) || combina(PADROES.reserva, desc)); };
  function marcarPares(lista) {
    var dia = function (s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; };
    var aptos = lista.filter(function (x) { return x.estado !== 'sem_valor' && pareceTransferencia(x.desc); }), porValor = new Map(), usado = new Set();
    aptos.forEach(function (x) { if (!porValor.has(x.valor)) porValor.set(x.valor, []); porValor.get(x.valor).push(x); });
    var candidatos = function (x) { return porValor.get(x.valor).filter(function (c) { return c.direcao !== x.direcao && c.contaId !== x.contaId && Math.abs(dia(c.data) - dia(x.data)) <= 1; }); };
    aptos.forEach(function (a) {
      if (a.direcao !== 'saida') return;
      var cs = candidatos(a);
      if (cs.length === 1 && candidatos(cs[0]).length === 1) { usado.add(a); usado.add(cs[0]); }
    });
    return usado;
  }

  /* prévia: nada é gravado aqui. estado = novo | existe (mesma data, valor e descrição) | importado (mesmo id).
     vinculo = sim | ambiguo | feito | null, sobre o lançamento que já existe. */
  function montarPrevia(dados, lanc, idsLocais, inversoes, renomes) {
    var porConta = new Map(dados.contas.map(function (c) { return [c.id, c]; })), nomes = rotulos(dados.contas, renomes);
    var ids = new Set(idsLocais || []), porExt = new Map(), porChave = new Map(), manuais = new Map();
    var poe = function (m, k, l) { if (!m.has(k)) m.set(k, []); m.get(k).push(l); };
    (lanc || []).forEach(function (l) { if (l.idExterno) { ids.add(l.idExterno); poe(porExt, l.idExterno, l); } poe(porChave, chave(l.data, l.valor, l.desc), l); if (!l.origem && !l.contaId) poe(manuais, l.data + '|' + Math.round(l.valor * 100), l); });
    var vistos = new Set(), inv = new Set(inversoes || []), alvos = new Map(), feitos = new Map();
    var lista = dados.movs.map(function (m) {
      var c = porConta.get(m.conta), it = mapear(m, c, inv.has(c.id)), repetido = vistos.has(m.id);
      var dup = ids.has(m.id) || repetido, vazio = !(it.valor > 0), k = chave(it.data, it.direcao === 'entrada' ? -it.valor : it.valor, it.desc);
      vistos.add(m.id);
      it.contaNome = nomes.get(c.id);
      it.estado = dup ? 'importado' : vazio ? 'sem_valor' : porChave.has(k) ? 'existe' : 'novo';
      it.marcado = it.estado === 'novo'; it.vinculo = null; it.alvo = null; it.marca = null; it.neutro = false; it.soNeutro = false; it.possivel = null;
      if (it.estado === 'novo') {
        var pv = manuais.get(it.data + '|' + Math.round((it.direcao === 'entrada' ? -it.valor : it.valor) * 100));   // mesma data e valor, descrição diferente: nunca junta sozinho
        if (pv) it.possivel = pv.length > 1 ? { ambiguo: true } : { alvo: pv[0].id, desc: pv[0].desc };
      }
      var acha = repetido ? [] : it.estado === 'importado' ? (porExt.get(m.id) || []) : it.estado === 'existe' ? porChave.get(k) : [];
      if (acha.length > 1) it.vinculo = 'ambiguo';
      else if (acha.length === 1) {
        var l = acha[0];
        if (l.contaId) { it.vinculo = l.contaId === c.id ? 'feito' : null; if (it.vinculo) feitos.set(it, l); }
        else if (!l.idExterno || l.idExterno === m.id) { it.vinculo = 'sim'; it.alvo = l.id; }
      }
      if (it.estado !== 'sem_valor') {
        if (c.tipo === 'CREDIT' && combina(PADROES.cartaoFatura, it.desc)) it.marca = 'cartao';
        else if (c.tipo !== 'CREDIT' && combina(PADROES.fatura, it.desc)) it.marca = 'fatura';
        else if (combina(PADROES.reserva, it.desc)) it.marca = 'entre';
      }
      return it;
    });
    marcarPares(lista).forEach(function (it) { if (!it.marca) it.marca = 'entre'; });
    /* entre contas e reserva não são gasto; quem já tem a conta só ganha essa marca */
    lista.forEach(function (it) {
      if (it.marca || it.possivel) it.marcado = false;
      it.neutro = it.marca === 'entre' || ((it.marca === 'fatura' || it.marca === 'cartao') && it.vinculo == null);   // fatura: neutro só ao importar como novo; vínculos e lançamentos já salvos não mudam
      var l = feitos.get(it);
      if (l && it.neutro && !l.neutro) { it.vinculo = 'sim'; it.alvo = l.id; it.soNeutro = true; }
      var dest = it.alvo != null ? it.alvo : it.possivel && it.possivel.alvo;
      if (dest != null) alvos.set(String(dest), (alvos.get(String(dest)) || 0) + 1);
    });
    /* dois movimentos para o mesmo lançamento: não dá para saber qual é */
    lista.forEach(function (it) { if (it.alvo != null && alvos.get(String(it.alvo)) > 1) { it.vinculo = 'ambiguo'; it.alvo = null; it.soNeutro = false; } if (it.possivel && it.possivel.alvo != null && alvos.get(String(it.possivel.alvo)) > 1) it.possivel = { ambiguo: true }; });
    return lista;
  }

  var api = { rotulos: rotulos, padraoConta: padraoConta, limparNome: limparNome, marcarPares: marcarPares, PADROES: PADROES, RAZOES: RAZOES, validarUrl: validarUrl, validarResposta: validarResposta, mensagem: mensagem, consultar: consultar, pedir: pedir, estrutura: estrutura, estruturaLinhas: estruturaLinhas, saldos: saldos, mapear: mapear, normalizar: normalizar, chave: chave, montarPrevia: montarPrevia, MAX_MOVS: MAX_MOVS, DIAS: DIAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TFBanco = api;
})(typeof window !== 'undefined' ? window : globalThis);
