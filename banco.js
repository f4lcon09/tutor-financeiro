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

  /* pede os dados à ponte. fetch é injetado para os testes. */
  async function consultar(o) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null, tempo = false;
    var timer = ctrl ? setTimeout(function () { tempo = true; ctrl.abort(); }, o.espera || ESPERA_MS) : null, r, t;
    try {
      r = await o.fetch(o.url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ token: o.token, tipo: 'access', dias: DIAS }), redirect: 'follow', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: ctrl ? ctrl.signal : undefined });
      if (!r || !r.ok) return { ok: false, erro: 'formato' };
      t = await r.text();
    } catch (e) { return { ok: false, erro: tempo ? 'tempo' : 'rede' }; } finally { if (timer) clearTimeout(timer); }
    if (typeof t !== 'string' || t.length > MAX_BYTES) return { ok: false, erro: 'formato' };
    var j; try { j = JSON.parse(t); } catch (e) { return { ok: false, erro: 'formato' }; }
    return validarResposta(j);
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
    compra: [/^pagamento com\b/, /\bcompra (no |na |em |de |com )?(debito|credito)\b/]
  };
  var RAZOES = { fatura: 'As compras já entram pelo cartão. Importar isto contaria o mesmo gasto duas vezes.' };
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
        if (c.tipo !== 'CREDIT' && combina(PADROES.fatura, it.desc)) it.marca = 'fatura';
        else if (combina(PADROES.reserva, it.desc)) it.marca = 'entre';
      }
      return it;
    });
    marcarPares(lista).forEach(function (it) { if (!it.marca) it.marca = 'entre'; });
    /* entre contas e reserva não são gasto; quem já tem a conta só ganha essa marca */
    lista.forEach(function (it) {
      if (it.marca || it.possivel) it.marcado = false;
      it.neutro = it.marca === 'entre';
      var l = feitos.get(it);
      if (l && it.neutro && !l.neutro) { it.vinculo = 'sim'; it.alvo = l.id; it.soNeutro = true; }
      var dest = it.alvo != null ? it.alvo : it.possivel && it.possivel.alvo;
      if (dest != null) alvos.set(String(dest), (alvos.get(String(dest)) || 0) + 1);
    });
    /* dois movimentos para o mesmo lançamento: não dá para saber qual é */
    lista.forEach(function (it) { if (it.alvo != null && alvos.get(String(it.alvo)) > 1) { it.vinculo = 'ambiguo'; it.alvo = null; it.soNeutro = false; } if (it.possivel && it.possivel.alvo != null && alvos.get(String(it.possivel.alvo)) > 1) it.possivel = { ambiguo: true }; });
    return lista;
  }

  var api = { rotulos: rotulos, padraoConta: padraoConta, limparNome: limparNome, marcarPares: marcarPares, PADROES: PADROES, RAZOES: RAZOES, validarUrl: validarUrl, validarResposta: validarResposta, mensagem: mensagem, consultar: consultar, mapear: mapear, normalizar: normalizar, chave: chave, montarPrevia: montarPrevia, MAX_MOVS: MAX_MOVS, DIAS: DIAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TFBanco = api;
})(typeof window !== 'undefined' ? window : globalThis);
