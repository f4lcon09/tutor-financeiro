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

  /* prévia: nada é gravado aqui. estado = novo | existe (mesma data, valor e descrição) | importado (mesmo id). */
  function montarPrevia(dados, lanc, idsLocais, inversoes) {
    var porConta = new Map(dados.contas.map(function (c) { return [c.id, c]; }));
    var ids = new Set(idsLocais || []), chaves = new Set();
    (lanc || []).forEach(function (l) { if (l.idExterno) ids.add(l.idExterno); chaves.add(chave(l.data, l.valor, l.desc)); });
    var vistos = new Set(), inv = new Set(inversoes || []);
    return dados.movs.map(function (m) {
      var c = porConta.get(m.conta), it = mapear(m, c, inv.has(c.id));
      var dup = ids.has(m.id) || vistos.has(m.id), vazio = !(it.valor > 0);
      vistos.add(m.id);
      it.estado = dup ? 'importado' : vazio ? 'sem_valor' : chaves.has(chave(it.data, it.direcao === 'entrada' ? -it.valor : it.valor, it.desc)) ? 'existe' : 'novo';
      it.marcado = it.estado === 'novo';
      return it;
    });
  }

  var api = { validarUrl: validarUrl, validarResposta: validarResposta, mensagem: mensagem, consultar: consultar, mapear: mapear, normalizar: normalizar, chave: chave, montarPrevia: montarPrevia, MAX_MOVS: MAX_MOVS, DIAS: DIAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TFBanco = api;
})(typeof window !== 'undefined' ? window : globalThis);
