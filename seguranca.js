/* Segurança dos dados do Tutor Financeiro. Pura (sem DOM), testada em node.
   1) esc(): todo texto que veio do usuário, do JSON importado ou do Drive passa por aqui antes de entrar em innerHTML.
   2) validarImportacao(): confere o dados_reais_*.json (tipos, limites, chaves de poluição de protótipo) antes de tocar no estado.
   3) sanearEstado() / limparItens(): o que chega do Drive é tratado como não confiável, item por item.
   As mensagens de erro citam só o NOME do campo, nunca o valor (os dados são pessoais). */
(function (root) {
  var MAPA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
  function esc(v) { return v == null ? '' : String(v).replace(/[&<>"'`]/g, function (c) { return MAPA[c]; }); }

  var LIM = { bytes: 2 * 1024 * 1024, profundidade: 10, nos: 20000, texto: 2000, desc: 200, nome: 100, cat: 40, lanc: 20000, metas: 200, itens: 60000 };
  var NOMES = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty'];
  var perigosa = function (k) { return NOMES.indexOf(k) >= 0; };
  var CATS = ['Mercado', 'Transporte', 'Lazer', 'Comida', 'Estudos', 'Saúde', 'Jogos', 'Outros'], FORMAS = ['Pix', 'Débito', 'Crédito', 'Dinheiro'];
  var isObj = function (x) { return !!x && typeof x === 'object' && !Array.isArray(x); };
  var num = function (x) { return typeof x === 'number' && isFinite(x) && Math.abs(x) < 1e15; };
  var idOk = function (x) { return (typeof x === 'number' && Number.isSafeInteger(x)) || (typeof x === 'string' && RE_ID.test(x) && !perigosa(x)); };
  var txt = function (x, max) { return typeof x === 'string' && x.length <= (max || LIM.texto); };
  var corta = function (x, max) { return String(x).slice(0, max); };
  var RE_EXT = /^[A-Za-z0-9_-]{1,80}$/, RE_ID = /^[A-Za-z0-9_-]{1,40}$/, RE_CHAVE = /^[A-Za-z0-9_.:@-]{1,80}$/, RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
  function data(d) {
    if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    var p = d.split('-').map(Number), dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return dt.getUTCFullYear() === p[0] && dt.getUTCMonth() === p[1] - 1 && dt.getUTCDate() === p[2];
  }
  var mes = function (m) { return typeof m === 'string' && RE_MES.test(m); };

  /* Percorre o JSON inteiro sem recursão: profundidade, quantidade de nós, tamanho de texto e chaves perigosas. */
  function varrer(raiz) {
    var pilha = [[raiz, 0, '']], nos = 0;
    while (pilha.length) {
      var it = pilha.pop(), v = it[0], p = it[1];
      if (++nos > LIM.nos) return 'o arquivo tem itens demais';
      if (typeof v === 'string') { if (v.length > LIM.texto) return 'há um texto longo demais' + (it[2] ? ' em "' + it[2] + '"' : ''); continue; }
      if (v === null || typeof v !== 'object') continue;
      if (p >= LIM.profundidade) return 'o arquivo tem aninhamento demais';
      var ks = Object.keys(v);
      for (var i = 0; i < ks.length; i++) {
        if (perigosa(ks[i])) return 'o arquivo contém uma chave não permitida';
        pilha.push([v[ks[i]], p + 1, Array.isArray(v) ? it[2] : ks[i]]);
      }
    }
    return null;
  }

  /* ---------- JSON importado ---------- */
  var TIPOS = { n: num, s: function (x) { return txt(x, 300); }, d: data, m: mes, i: function (x) { return typeof x === 'number' && isFinite(x) && x >= 1 && x <= 31 && Math.floor(x) === x; } };
  function pegar(o, caminho) { var v = o, ps = caminho.split('.'); for (var i = 0; i < ps.length; i++) { if (!isObj(v)) return undefined; v = v[ps[i]]; } return v; }
  function chk(o, caminho, tipo, base) {   // base: prefixo de mensagem para itens de lista
    var v = pegar(o, caminho), nome = (base || '') + caminho, opc = /\?$/.test(tipo), t = tipo.replace('?', '');
    if (v === undefined || v === null) return opc ? null : 'falta o campo "' + nome + '"';
    return TIPOS[t](v) ? null : 'o campo "' + nome + '" está fora do formato esperado';
  }
  function lista(real, chave, max, campos, obrig) {
    var a = real[chave];
    if (a === undefined || a === null) return obrig ? 'falta o campo "' + chave + '"' : null;
    if (!Array.isArray(a)) return 'o campo "' + chave + '" deveria ser uma lista';
    if (a.length > max) return 'a lista "' + chave + '" é longa demais';
    for (var i = 0; i < a.length; i++) {
      if (!isObj(a[i])) return 'o item ' + (i + 1) + ' de "' + chave + '" está fora do formato esperado';
      for (var c = 0; c < campos.length; c++) { var e = chk(a[i], campos[c][0], campos[c][1], chave + '[' + (i + 1) + '].'); if (e) return e; }
    }
    return null;
  }
  function validarImportacao(j, tamanho) {
    var falha = function (m) { return { ok: false, erro: 'Arquivo não aceito: ' + m + '. Confira se é o dados_reais_*.json.' }; };
    if (tamanho != null && tamanho > LIM.bytes) return falha('o arquivo é grande demais');
    if (!isObj(j)) return falha('o conteúdo não é um objeto JSON');
    var e = varrer(j); if (e) return falha(e);
    var obrig = ['_meta', 'liquidez', 'cartao', 'pendencias_novembro', 'gastos_fixos_mensais', 'faturas_futuras_parcelas_antigas', 'regras_e_metas', 'entradas_esperadas'];
    for (var i = 0; i < obrig.length; i++) if (j[obrig[i]] === undefined || j[obrig[i]] === null) return falha('falta o campo "' + obrig[i] + '"');
    var regras = [
      ['_meta.as_of', 'd'], ['liquidez.total', 'n'], ['liquidez.conta_corrente', 'n?'], ['liquidez.onde', 's?'],
      ['cartao.emissor', 's'], ['cartao.fechamento_dia', 'i'], ['cartao.limite', 'n?'], ['cartao.fatura_atual.total', 'n'], ['cartao.fatura_atual.vence_em', 'd'],
      ['gastos_fixos_mensais.ajuda_em_casa_a_partir_de_dezembro', 'n'], ['gastos_fixos_mensais.faculdade_2026', 'n'], ['gastos_fixos_mensais.faculdade_2027_estimado', 'n'], ['gastos_fixos_mensais.teto_lazer_mes', 'n'],
      ['regras_e_metas.meta_17_01_2027', 'n'], ['regras_e_metas.piso_17_01_2027', 'n'], ['regras_e_metas.alerta_dezembro', 'n'], ['regras_e_metas.piso_absoluto_status', 's?'],
      ['sobra_apos_pagar_tudo', 'n?']
    ];
    for (var r = 0; r < regras.length; r++) { e = chk(j, regras[r][0], regras[r][1]); if (e) return falha(e); }
    var ass = j.gastos_fixos_mensais.assinaturas_no_cartao;
    if (!isObj(ass)) return falha('falta o campo "gastos_fixos_mensais.assinaturas_no_cartao"');
    var ak = Object.keys(ass); if (ak.length > 50) return falha('assinaturas demais');
    for (var a = 0; a < ak.length; a++) if (!num(ass[ak[a]])) return falha('o campo "gastos_fixos_mensais.assinaturas_no_cartao" tem um valor fora do formato esperado');
    e = lista(j, 'pendencias_novembro', 200, [['descricao', 's'], ['valor', 'n'], ['vence', 'd'], ['nota', 's?']], true)
      || lista(j, 'entradas_esperadas', 100, [['descricao', 's'], ['valor_estimado', 'n?']], true)
      || lista(j, 'faturas_futuras_parcelas_antigas', 120, [['mes', 'm'], ['fatura_total', 'n'], ['parte_mae', 'n?']], true)
      || lista(j, 'plano_de_pagamento', 200, [['data', 'd'], ['acao', 's']], false)
      || lista(j, 'gastos_periodicos', 100, [['primeiro', 'm'], ['a_cada_meses', 'i'], ['valor', 'n']], false)
      || lista(j, 'cartoes_extra', 20, [['nome', 's'], ['limite', 'n?'], ['fatura', 'n?'], ['parcelasFuturas', 'n?'], ['fechamento_dia', 'i?'], ['vence_dia', 'i?']], false);
    if (e) return falha(e);
    (j.cartoes_extra || []).forEach(function (x) { if (x.id !== undefined && (!(typeof x.id === 'string' && RE_ID.test(x.id)) || perigosa(x.id) || x.id === 'c1')) e = 'o campo "cartoes_extra[].id" está fora do formato esperado'; });
    if (e) return falha(e);
    if (j.pendente_do_usuario !== undefined && j.pendente_do_usuario !== null) {
      if (!Array.isArray(j.pendente_do_usuario) || j.pendente_do_usuario.length > 100 || !j.pendente_do_usuario.every(function (t) { return txt(t, 300); })) return falha('o campo "pendente_do_usuario" está fora do formato esperado');
    }
    if (j._traducoes !== undefined && j._traducoes !== null) {
      var tk = isObj(j._traducoes) ? Object.keys(j._traducoes) : null;
      if (!tk || tk.length > 100 || !tk.every(function (k) { return txt(j._traducoes[k], 300); })) return falha('o campo "_traducoes" está fora do formato esperado');
    }
    return { ok: true };
  }

  /* ---------- números do dono (store.st.numeros) ---------- */
  function sanNumeros(n) {
    if (!isObj(n)) return {};
    var o = {};
    ['mercado', 'salario', 'piso'].forEach(function (k) { if (num(n[k]) && n[k] > 0) o[k] = n[k]; });
    if (isObj(n.repasse)) { o.repasse = {}; Object.keys(n.repasse).forEach(function (m) { if (mes(m) && n.repasse[m] === true) o.repasse[m] = true; }); }
    if (isObj(n.limites)) { o.limites = {}; Object.keys(n.limites).forEach(function (id) { if (RE_ID.test(id) && !perigosa(id) && num(n.limites[id]) && n.limites[id] > 0) o.limites[id] = n.limites[id]; }); }
    if (Array.isArray(n.periodicos)) o.periodicos = n.periodicos.slice(0, 100).filter(function (g) { return isObj(g) && mes(g.primeiro) && g.a_cada_meses >= 1 && g.a_cada_meses <= 120 && Math.floor(g.a_cada_meses) === g.a_cada_meses && num(g.valor); }).map(function (g) { return { primeiro: g.primeiro, a_cada_meses: g.a_cada_meses, valor: g.valor }; });
    return o;
  }
  /* ---------- um lançamento / uma meta que veio de fora ---------- */
  function sanLanc(l) {
    if (!isObj(l) || !idOk(l.id) || !data(l.data) || !num(l.valor) || typeof l.desc !== 'string' || typeof l.cat !== 'string') return null;
    var o = { id: l.id, data: l.data, desc: corta(l.desc, LIM.desc), cat: CATS.indexOf(l.cat) >= 0 ? l.cat : 'Outros', valor: l.valor, forma: FORMAS.indexOf(l.forma) >= 0 ? l.forma : 'Pix', essencial: l.essencial === true, lazer: l.lazer === true };
    if (l.origem === 'pluggy' && typeof l.idExterno === 'string' && RE_EXT.test(l.idExterno) && !perigosa(l.idExterno)) { o.origem = 'pluggy'; o.idExterno = l.idExterno; }   // opcionais: quem não conhece só ignora
    if (typeof l.contaId === 'string' && RE_EXT.test(l.contaId) && !perigosa(l.contaId) && typeof l.contaNome === 'string' && l.contaNome.trim()) { o.contaId = l.contaId; o.contaNome = corta(l.contaNome, LIM.nome); }
    return o;
  }
  function sanMeta(m) {
    if (!isObj(m) || !idOk(m.id) || typeof m.nome !== 'string' || !m.nome.trim() || !mes(m.prazo) || !num(m.alvo) || m.alvo <= 0 || !num(m.guardado) || m.guardado < 0 || !num(m.aporte) || m.aporte < 0) return null;
    return { id: m.id, nome: corta(m.nome, LIM.nome), alvo: m.alvo, guardado: m.guardado, prazo: m.prazo, aporte: m.aporte };
  }
  /* Estado vindo do Drive -> estado seguro. Itens inválidos são descartados (e contados), nunca corrigidos em silêncio. */
  function sanearEstado(st) {
    var desc = 0, out = {};
    if (!isObj(st)) return { estado: {}, descartados: 1 };
    if (st.lanc !== undefined) { out.lanc = []; (Array.isArray(st.lanc) ? st.lanc.slice(0, LIM.lanc) : []).forEach(function (l) { var x = sanLanc(l); if (x) out.lanc.push(x); else desc++; }); }
    if (st.metas !== undefined) { out.metas = []; (Array.isArray(st.metas) ? st.metas.slice(0, LIM.metas) : []).forEach(function (m) { var x = sanMeta(m); if (x) out.metas.push(x); else desc++; }); }
    if (st.pagos !== undefined) { out.pagos = {}; if (isObj(st.pagos)) Object.keys(st.pagos).forEach(function (k) { if (RE_CHAVE.test(k) && !perigosa(k) && typeof st.pagos[k] === 'boolean') out.pagos[k] = st.pagos[k]; else desc++; }); }
    if (st.tetos !== undefined) { out.tetos = {}; if (isObj(st.tetos)) Object.keys(st.tetos).forEach(function (k) { if (k.length >= 1 && k.length <= LIM.cat && !perigosa(k) && num(st.tetos[k]) && st.tetos[k] >= 0) out.tetos[k] = st.tetos[k]; else desc++; }); }
    if (st.taxa !== undefined && st.taxa !== null) { if (num(st.taxa) && st.taxa >= 0 && st.taxa <= 100) out.taxa = st.taxa; else desc++; }
    if (st.numeros !== undefined) out.numeros = sanNumeros(st.numeros);
    if (st.real !== undefined) { if (validarImportacao(st.real).ok) out.real = st.real; else desc++; }
    return { estado: out, descartados: desc };
  }
  /* Mapa de itens do Drive ({chave: {u, d, v}}) -> só o que tem forma de item. Chave e valor são conferidos. */
  function limparItens(itens) {
    var out = {}, desc = 0;
    if (!isObj(itens)) return { itens: out, descartados: itens === undefined ? 0 : 1 };
    var ks = Object.keys(itens); if (ks.length > LIM.itens) return { itens: out, descartados: ks.length };
    ks.forEach(function (k) {
      var it = itens[k], ok = false;
      var m = /^(lanc|pago|teto|meta):(.{1,80})$/.exec(k);
      if (isObj(it) && num(it.u) && it.u >= 0 && it.u <= Date.now() + 86400000 && typeof it.d === 'boolean' && !perigosa(k) && (m ? !perigosa(m[2]) : (k === 'taxa' || k === 'real' || k === 'numeros'))) {
        if (it.d) { out[k] = { u: it.u, d: true, v: null }; ok = true; }
        else {
          var tipo = m ? m[1] : k, v;
          if (tipo === 'lanc') v = sanLanc(it.v); else if (tipo === 'meta') v = sanMeta(it.v);
          else if (tipo === 'pago') v = typeof it.v === 'boolean' ? it.v : undefined;
          else if (tipo === 'teto') v = num(it.v) && it.v >= 0 ? it.v : undefined;
          else if (tipo === 'taxa') v = num(it.v) && it.v >= 0 && it.v <= 100 ? it.v : undefined;
          else if (tipo === 'numeros') v = isObj(it.v) ? sanNumeros(it.v) : undefined;
          else if (tipo === 'real') v = isObj(it.v) && validarImportacao(it.v).ok ? it.v : undefined;
          if (v && (tipo === 'lanc' || tipo === 'meta') && String(v.id) !== m[2]) v = undefined;   // a chave tem de bater com o id
          if (v !== undefined && v !== null) { out[k] = { u: it.u, d: false, v: v }; ok = true; }
        }
      }
      if (!ok) desc++;
    });
    return { itens: out, descartados: desc };
  }

  var api = { esc: esc, validarImportacao: validarImportacao, sanearEstado: sanearEstado, limparItens: limparItens, varrer: varrer, LIM: LIM, perigosa: perigosa };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TFSeg = api;
})(typeof window !== 'undefined' ? window : globalThis);
