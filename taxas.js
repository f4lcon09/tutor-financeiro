/* Taxas públicas do Banco Central (SGS). Só GET de séries públicas: nenhum dado seu sai daqui.
   Cache local por série {valor, dataRef, fetchedAt}. Sem rede ou sem resposta, usa o cache; sem cache, nada. Nunca lança erro. */
(function (root) {
  'use strict';
  var HOST = 'https://api.bcb.gov.br';
  var SERIES = { cdiAno: 4389, selic: 432, ipca12: 13522 };
  var QTD = { 4389: 10, 13522: 10 };
  /* 432 (meta Selic): ultimos/N só traz datas futuras (calendário do Copom) e para em 20, então pede um período: os últimos 30 dias até hoje */
  var PERIODO = { 432: 30 };
  /* faixa aceita por série: o IPCA pode ser negativo (deflação); as taxas ficam entre 0 e 100 */
  var FAIXA = { 13522: [-50, 100] }, FAIXA_TAXA = [0, 100];
  function faixa(serie) { return FAIXA[serie] || FAIXA_TAXA; }
  function dentro(v, serie) { var f = faixa(serie); return typeof v === 'number' && isFinite(v) && v >= f[0] && v <= f[1]; }
  var CHAVE = 'tf_taxas', TENTATIVA = 'tf_taxas_tentativa';
  var VALIDADE = 6 * 3600000, INTERVALO = 15 * 60000, TEMPO = 8000;
  /* hora da última tentativa. A busca parte de abrir Decidir > Investimento no modo real com a opção tf_taxas_online ligada;
     se o sessionStorage falhar, o limite de 15 min vale pela página */
  var memoria = { tentativa: 0 };

  function url(serie, n) {
    n = Math.max(1, Math.min(20, Math.floor(+n) || 1));
    return HOST + '/dados/serie/bcdata.sgs.' + serie + '/dados/ultimos/' + n + '?formato=json';
  }
  /* data local "DD/MM/AAAA" com zeros, barras literais (sem codificar) */
  function dataSgs(d) { return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); }
  function urlPeriodo(serie, dias, agora) {
    var fim = new Date(agora), ini = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() - dias);
    return HOST + '/dados/serie/bcdata.sgs.' + serie + '/dados?formato=json&dataInicial=' + dataSgs(ini) + '&dataFinal=' + dataSgs(fim);
  }
  /* o endereço de cada série: período para a 432, ultimos/N para as outras */
  function endereco(serie, agora) { return PERIODO[serie] ? urlPeriodo(serie, PERIODO[serie], agora) : url(serie, QTD[serie] || 10); }
  /* "DD/MM/AAAA" -> "AAAA-MM-DD", só data de calendário válida */
  function data(s) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(typeof s === 'string' ? s : '');
    if (!m) return null;
    var d = +m[1], mes = +m[2], a = +m[3], t = new Date(Date.UTC(a, mes - 1, d));
    if (a < 1990 || a > 2100 || t.getUTCFullYear() !== a || t.getUTCMonth() !== mes - 1 || t.getUTCDate() !== d) return null;
    return m[3] + '-' + m[2] + '-' + m[1];
  }
  /* linhas válidas: data válida, número decimal com ponto, finito, dentro da faixa da série (IPCA de -50 a 100, taxas de 0 a 100). O resto é descartado. */
  function ler(json, serie) {
    if (!Array.isArray(json)) return [];
    var out = [];
    for (var i = 0; i < json.length && i < 1000; i++) {
      var r = json[i];
      if (!r || typeof r !== 'object') continue;
      var d = data(r.data), v = typeof r.valor === 'string' && /^-?\d{1,6}(\.\d{1,10})?$/.test(r.valor.trim()) ? +r.valor.trim() : NaN;
      if (!d || !dentro(v, serie)) continue;
      out.push({ data: d, valor: v });
    }
    return out;
  }
  /* a linha mais recente com data até hoje, nunca simplesmente a última */
  function escolher(linhas, hojeISO) {
    var melhor = null;
    (linhas || []).forEach(function (r) { if (r.data <= hojeISO && (!melhor || r.data > melhor.data)) melhor = r; });
    return melhor;
  }
  function hojeISO(agora) {
    var d = new Date(agora);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* uma série: GET simples, sem cabeçalho próprio (evita preflight), sem cookie, sem referrer, 8 s, sem nova tentativa */
  function buscar(serie, o) {
    o = o || {};
    var f = o.fetch, agora = o.agora || Date.now(), ms = o.tempo || TEMPO;
    if (typeof f !== 'function') return Promise.resolve({ ok: false, erro: 'rede' });
    var ctl = typeof AbortController === 'function' ? new AbortController() : null, relogio = null;
    var tempo = new Promise(function (res) { relogio = setTimeout(function () { if (ctl) { try { ctl.abort(); } catch (e) {} } res({ ok: false, erro: 'tempo' }); }, ms); });
    var pedido;
    try {
      pedido = Promise.resolve(f(endereco(serie, agora), { method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', signal: ctl ? ctl.signal : undefined }))
        .then(function (r) { if (!r || !r.ok) return { ok: false, erro: 'rede' }; return Promise.resolve(r.json()).then(function (j) { return j; }, function () { return undefined; }).then(function (j) {
          if (!Array.isArray(j)) return { ok: false, erro: 'formato' };
          var e = escolher(ler(j, serie), hojeISO(agora));
          return e ? { ok: true, valor: e.valor, dataRef: e.data } : { ok: false, erro: 'vazio' };
        }); }, function () { return { ok: false, erro: 'rede' }; });
    } catch (e) { pedido = Promise.resolve({ ok: false, erro: 'rede' }); }
    return Promise.race([pedido, tempo]).then(function (r) { clearTimeout(relogio); return r; }, function () { clearTimeout(relogio); return { ok: false, erro: 'rede' }; });
  }

  function lerCache(st) {
    var c = null;
    try { c = JSON.parse(st.getItem(CHAVE)); } catch (e) { c = null; }
    var out = {};
    if (!c || typeof c !== 'object') return out;
    Object.keys(SERIES).forEach(function (k) {
      var s = SERIES[k], x = c[s];
      if (x && typeof x === 'object' && dentro(x.valor, s) && typeof x.dataRef === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.dataRef) && typeof x.fetchedAt === 'number' && isFinite(x.fetchedAt))
        out[s] = { valor: x.valor, dataRef: x.dataRef, fetchedAt: x.fetchedAt };
    });
    return out;
  }
  function gravarCache(st, c) { try { st.setItem(CHAVE, JSON.stringify(c)); return true; } catch (e) { return false; } }
  function precisa(c, agora) {
    return Object.keys(SERIES).some(function (k) { var x = c[SERIES[k]]; return !x || agora - x.fetchedAt > VALIDADE; });
  }
  function ultimaTentativa(se) {
    var v = 0; try { v = +se.getItem(TENTATIVA) || 0; } catch (e) { v = 0; }
    return Math.max(v, memoria.tentativa);
  }
  function marcaTentativa(se, agora) { memoria.tentativa = agora; try { se.setItem(TENTATIVA, String(agora)); } catch (e) {} }

  /* chamado ao abrir Decidir > Investimento no modo real com a opção tf_taxas_online ligada (o app.js decide).
     Busca só se alguma das 3 séries falta ou passou de 6 h, e no máximo uma vez a cada 15 min na sessão: até 3 pedidos, um por série */
  function atualizar(o) {
    o = o || {};
    var st = o.storage, se = o.sessao, agora = o.agora || Date.now(), c = {};
    try { c = st ? lerCache(st) : {}; } catch (e) { c = {}; }
    if (!precisa(c, agora)) return Promise.resolve({ buscou: false, motivo: 'recente', cache: c });
    if (agora - ultimaTentativa(se) < INTERVALO) return Promise.resolve({ buscou: false, motivo: 'intervalo', cache: c });
    marcaTentativa(se, agora);
    var lista = Object.keys(SERIES).map(function (k) { return SERIES[k]; });
    return Promise.all(lista.map(function (s) { return buscar(s, { fetch: o.fetch, agora: agora, tempo: o.tempo }); })).then(function (rs) {
      var n = 0;
      rs.forEach(function (r, i) { if (r.ok) { c[lista[i]] = { valor: r.valor, dataRef: r.dataRef, fetchedAt: agora }; n++; } });
      if (n && st) gravarCache(st, c);
      return { buscou: true, novas: n, cache: c };
    }, function () { return { buscou: true, novas: 0, cache: c }; });
  }

  /* taxa mensal decimal a partir do CDI anualizado (base 252, série 4389) e do % do CDI. Estimativa: convenção A Confirmar. */
  function mensalDeCdi(cdiAnoPct, pctDoCdi) {
    if (!isFinite(cdiAnoPct) || !isFinite(pctDoCdi) || cdiAnoPct < 0 || pctDoCdi < 0) return null;
    return (Math.pow(1 + cdiAnoPct / 100, 1 / 12) - 1) * pctDoCdi / 100;
  }
  function diaMes(iso) { return iso.slice(8, 10) + '/' + iso.slice(5, 7); }
  function mesAno(iso) { return iso.slice(5, 7) + '/' + iso.slice(0, 4); }
  function dataBR(ms) { var d = new Date(ms); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); }

  var api = { HOST: HOST, SERIES: SERIES, url: url, endereco: endereco, data: data, ler: ler, escolher: escolher, buscar: buscar, lerCache: lerCache, gravarCache: gravarCache, precisa: precisa, atualizar: atualizar, mensalDeCdi: mensalDeCdi, diaMes: diaMes, mesAno: mesAno, dataBR: dataBR, VALIDADE: VALIDADE, INTERVALO: INTERVALO, TEMPO: TEMPO, CHAVE: CHAVE, _memoria: memoria };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.TFTaxas = api;
})(this);
