/* Camada de dados do Tutor Financeiro: estado, validação e operações. Pura (sem DOM), testada em node.
   O armazenamento (localStorage) entra por parâmetro. Nada aqui conhece telas. */
(function (root) {
  var CHAVES = { lanc: 'tf_lanc3', pagos: 'tf_pagos', tetos: 'tf_tetos', metas: 'tf_metas', taxa: 'tf_taxameta', numeros: 'tf_numeros', real: 'tf_real', modo: 'tf_modo' };
  var CATEGORIAS = ['Mercado', 'Transporte', 'Lazer', 'Comida', 'Estudos', 'Saúde', 'Jogos', 'Outros'];
  var FORMAS = ['Pix', 'Débito', 'Crédito', 'Dinheiro'];
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var r2 = function (x) { return Math.round(x * 100) / 100; };
  var RITMO_MIN_DIAS = 7;   // antes disso a projeção do mês é ruído

  /* Ritmo do mês: gasto até hoje / dias passados * dias do mês, em centavos inteiros.
     poucos = ainda não passou o mínimo de dias; semGasto = nada lançado. */
  function ritmoMes(gasto, dia, diasMes, minDias) {
    var c = Math.round(Number(gasto) * 100), d = Math.max(1, Math.floor(dia) || 1), dm = Math.max(d, Math.floor(diasMes) || d);
    var min = minDias == null ? RITMO_MIN_DIAS : minDias, poucos = d < min;
    if (!(c > 0)) return { semGasto: true, poucos: poucos, projetadoCentavos: 0, projetado: 0 };
    var p = Math.round(c * dm / d);
    return { semGasto: false, poucos: poucos, projetadoCentavos: p, projetado: p / 100 };
  }

  function lerNumero(txt) {   // aceita "12,06" e "1.234,56" e "12.06"
    if (typeof txt === 'number') return txt;
    var s = String(txt == null ? '' : txt).trim().replace(/\s|R\$/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }
  function dataValida(d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return false;
    var p = d.split('-').map(Number), dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return dt.getUTCFullYear() === p[0] && dt.getUTCMonth() === p[1] - 1 && dt.getUTCDate() === p[2];
  }

  /* Sugere essencial ou lazer pela categoria (e pela descrição, em Comida). */
  function sugerir(cat, desc) {
    var d = (desc || '').toLowerCase();
    if (['Mercado', 'Transporte', 'Saúde', 'Estudos'].indexOf(cat) >= 0) return { essencial: true, lazer: false, texto: cat + ' costuma ser essencial: sem isso a rotina básica fica comprometida. Não conta no teto de lazer.' };
    if (['Lazer', 'Jogos'].indexOf(cat) >= 0) return { essencial: false, lazer: true, texto: 'É lazer: uma escolha que dá para adiar sem consequência. Conta no teto de lazer do mês.' };
    if (cat === 'Comida') {
      if (/mercado|feira|padaria|hortifruti|açougue|acougue|supermercado/.test(d)) return { essencial: true, lazer: false, texto: 'Comida de casa é essencial. Para compras de mercado, use a categoria Mercado.' };
      return { essencial: false, lazer: true, texto: 'Comer fora ou pedir entrega conta como lazer. Comida de casa você lança em Mercado, como essencial.' };
    }
    return { essencial: false, lazer: false, texto: 'Em dúvida? Se eu não pagar isso este mês, o que acontece? Se algo importante quebra, é essencial. Se só perde o prazer, é lazer.' };
  }

  /* Valida um lançamento digitado. Retorna {ok, erros, valor} com os textos de erro por campo. */
  function validarLancamento(o) {
    var erros = {}, v = lerNumero(o.valor);
    if (!(v > 0)) erros.valor = 'Informe um valor maior que zero.';
    if (!dataValida(o.data)) erros.data = 'Informe uma data válida.';
    if (CATEGORIAS.indexOf(o.cat) < 0) erros.cat = 'Escolha uma categoria.';
    return { ok: Object.keys(erros).length === 0, erros: erros, valor: v };
  }

  /* Lançamento rápido por texto: "45 mercado pix", "12,06 uber ontem", "recebi 255 do tio". Só interpreta; quem salva é o dono. */
  var PALAVRAS = [
    ['Mercado', /\b(mercado|supermercado|feira|padaria|hortifruti|a[cç]ougue)\b/i],
    ['Transporte', /\b(uber|[oô]nibus|bus[aã]o|gasolina|combust[ií]vel|passagem|metr[oô]|transporte)\b/i],
    ['Jogos', /\b(jogos?|steam|game)\b/i],
    ['Lazer', /\b(cinema|lazer|show|bar|passeio|festa)\b/i],
    ['Comida', /\b(lanche|almo[cç]o|jantar|pizza|ifood|restaurante|hamb[uú]rguer|caf[eé]|sorvete)\b/i],
    ['Estudos', /\b(faculdade|curso|livro|mensalidade|apostila)\b/i],
    ['Saúde', /\b(farm[aá]cia|rem[eé]dio|consulta|m[eé]dico|dentista|exame)\b/i]
  ];
  var FORMAS_TXT = [['Crédito', /\b(cr[eé]dito|cart[aã]o)\b/i], ['Débito', /\bd[eé]bito\b/i], ['Dinheiro', /\b(dinheiro|esp[eé]cie)\b/i], ['Pix', /\bpix\b/i]];
  function somarDias(iso, n) { var p = iso.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function interpretarTexto(txt, hojeISO) {
    var s = String(txt || '').trim();
    if (!s) return { ok: false, erro: 'Digite algo como "45 mercado pix".' };
    var m = s.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
    var diaTxt = s.match(/\bdia\s+(\d{1,2})\b/i);
    if (diaTxt) { var semDia = s.replace(diaTxt[0], ' '); m = semDia.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/); }
    var valor = m ? lerNumero(m[1]) : NaN;
    if (!(valor > 0)) return { ok: false, erro: 'Não achei o valor. Escreva o número, como em "45 mercado pix".' };
    var tipo = /\b(recebi|recebido|entrada|sal[aá]rio|ganhei)\b/i.test(s) ? 'entrada' : 'gasto';
    var cat = 'Outros'; for (var i = 0; i < PALAVRAS.length; i++) { if (PALAVRAS[i][1].test(s)) { cat = PALAVRAS[i][0]; break; } }
    var forma = 'Pix'; for (var j = 0; j < FORMAS_TXT.length; j++) { if (FORMAS_TXT[j][1].test(s)) { forma = FORMAS_TXT[j][0]; break; } }
    var data = hojeISO;
    if (/\banteontem\b/i.test(s)) data = somarDias(hojeISO, -2); else if (/\bontem\b/i.test(s)) data = somarDias(hojeISO, -1);
    else if (diaTxt && +diaTxt[1] >= 1 && +diaTxt[1] <= 31) { var cand = hojeISO.slice(0, 8) + pad(+diaTxt[1]); if (dataValida(cand)) data = cand; }
    var desc = s.replace(m[0], ' ').replace(/R\$/gi, ' ').replace(/\b(pix|d[eé]bito|cr[eé]dito|cart[aã]o|dinheiro|esp[eé]cie|hoje|ontem|anteontem|recebi|recebido|entrada|ganhei)\b/gi, ' ').replace(/\bdia\s+\d{1,2}\b/gi, ' ').replace(/\s+/g, ' ').trim();
    desc = desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : cat;
    return { ok: true, tipo: tipo, valor: valor, cat: cat, forma: forma, data: data, desc: desc };
  }

  function criarStore(storage, agora) {
    agora = agora || function () { return new Date(); };
    var ouvintes = [];
    function ler(k, padrao) { try { var v = JSON.parse(storage.getItem(k)); return v == null ? padrao : v; } catch (e) { return padrao; } }
    function gravar(k, v) { try { storage.setItem(k, JSON.stringify(v)); } catch (e) { /* cheio ou bloqueado */ } }
    var st = {
      modo: ler(CHAVES.modo, null), real: ler(CHAVES.real, null), numeros: ler(CHAVES.numeros, {}),
      lanc: ler(CHAVES.lanc, []), pagos: ler(CHAVES.pagos, {}), tetos: ler(CHAVES.tetos, {}), metas: ler(CHAVES.metas, []), taxa: ler(CHAVES.taxa, 0.8)
    };
    var seq = 0;
    function novoId() { return Date.now() * 1000 + (seq++ % 1000); }
    function mudou(qual) {
      if (qual.lanc) gravar(CHAVES.lanc, st.lanc);
      if (qual.pagos) gravar(CHAVES.pagos, st.pagos);
      if (qual.tetos) gravar(CHAVES.tetos, st.tetos);
      if (qual.metas) gravar(CHAVES.metas, st.metas);
      if (qual.taxa) gravar(CHAVES.taxa, st.taxa);
      if (qual.numeros) gravar(CHAVES.numeros, st.numeros);
      if (qual.real) gravar(CHAVES.real, st.real);
      ouvintes.forEach(function (f) { f(qual); });
    }
    var S = {
      st: st, CATEGORIAS: CATEGORIAS, FORMAS: FORMAS,
      aoMudar: function (f) { ouvintes.push(f); },
      hojeISO: function () { var d = agora(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
      mesAtual: function () { return S.hojeISO().slice(0, 7); },

      /* ---- lançamentos ---- */
      lancar: function (o) {
        var v = validarLancamento(o); if (!v.ok) return { ok: false, erros: v.erros };
        var tipo = o.tipo === 'entrada' ? 'entrada' : 'gasto';
        var l = { id: novoId(), data: o.data, desc: String(o.desc || '').trim() || o.cat, cat: o.cat, valor: r2(tipo === 'entrada' ? -v.valor : v.valor), forma: o.forma || 'Pix', essencial: tipo === 'gasto' && !!o.essencial, lazer: tipo === 'gasto' && !!o.lazer };
        st.lanc.push(l); mudou({ lanc: 1 }); return { ok: true, id: l.id };
      },
      editar: function (id, o) {
        var v = validarLancamento(o); if (!v.ok) return { ok: false, erros: v.erros };
        var achou = false, tipo = o.tipo === 'entrada' ? 'entrada' : 'gasto';
        st.lanc = st.lanc.map(function (l) { if (String(l.id) !== String(id)) return l; achou = true; return { id: l.id, data: o.data, desc: String(o.desc || '').trim() || o.cat, cat: o.cat, valor: r2(tipo === 'entrada' ? -v.valor : v.valor), forma: o.forma || 'Pix', essencial: tipo === 'gasto' && !!o.essencial, lazer: tipo === 'gasto' && !!o.lazer }; });
        if (!achou) return { ok: false, erros: { geral: 'Lançamento não encontrado.' } };
        mudou({ lanc: 1 }); return { ok: true };
      },
      apagar: function (id) {
        var l = st.lanc.filter(function (x) { return String(x.id) === String(id); })[0]; if (!l) return null;
        st.lanc = st.lanc.filter(function (x) { return String(x.id) !== String(id); }); mudou({ lanc: 1 }); return l;
      },
      desfazerApagar: function (l) { if (l && !st.lanc.some(function (x) { return String(x.id) === String(l.id); })) { st.lanc.push(l); mudou({ lanc: 1 }); return true; } return false; },
      doMes: function (mes) { mes = mes || S.mesAtual(); return st.lanc.filter(function (l) { return l.data.indexOf(mes) === 0; }); },
      gastosMes: function (mes) { return S.doMes(mes).filter(function (l) { return l.valor > 0; }); },
      lazerGasto: function (mes) { return r2(S.gastosMes(mes).filter(function (l) { return l.lazer; }).reduce(function (s, l) { return s + l.valor; }, 0)); },
      porCategoria: function (mes) { var o = {}; S.gastosMes(mes).filter(function (l) { return !l.lazer; }).forEach(function (l) { o[l.cat] = r2((o[l.cat] || 0) + l.valor); }); return o; },
      porDia: function (mes) { var o = {}; S.gastosMes(mes).forEach(function (l) { var d = +l.data.slice(8); o[d] = r2((o[d] || 0) + l.valor); }); return o; },
      buscar: function (mes, q) {
        q = (q || '').toLowerCase().trim();
        return S.doMes(mes).filter(function (l) { return !q || (l.desc + ' ' + l.cat + ' ' + (l.forma || '')).toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
      },

      /* ---- contas pagas, tetos ---- */
      chavePago: function (conta, mes) { return conta.id + '@' + (mes || S.mesAtual()); },
      marcarPago: function (conta, pago, mes) { st.pagos[S.chavePago(conta, mes)] = !!pago; mudou({ pagos: 1 }); },
      estaPago: function (conta, diaHoje, mes) { var k = S.chavePago(conta, mes); return k in st.pagos ? !!st.pagos[k] : conta.dia < diaHoje; },
      setTeto: function (cat, valor) { var v = lerNumero(valor); if (!(v >= 0)) return false; st.tetos[cat] = r2(v); mudou({ tetos: 1 }); return true; },

      /* ---- metas ---- */
      addMeta: function (m) {
        var alvo = lerNumero(m.alvo), g = lerNumero(m.guardado), ap = lerNumero(m.aporte), erros = {};
        if (!String(m.nome || '').trim()) erros.nome = 'Dê um nome à meta.';
        if (!(alvo > 0)) erros.alvo = 'Informe quanto quer juntar.';
        if (!/^\d{4}-\d{2}$/.test(m.prazo || '')) erros.prazo = 'Informe o mês do prazo.';
        if (Object.keys(erros).length) return { ok: false, erros: erros };
        var meta = { id: novoId(), nome: String(m.nome).trim(), alvo: r2(alvo), guardado: g > 0 ? r2(g) : 0, prazo: m.prazo, aporte: ap > 0 ? r2(ap) : 0 };
        st.metas.push(meta); mudou({ metas: 1 }); return { ok: true, id: meta.id };
      },
      setAporte: function (id, v) { var m = st.metas.filter(function (x) { return String(x.id) === String(id); })[0]; var n = lerNumero(v); if (!m || !(n >= 0)) return false; m.aporte = r2(n); mudou({ metas: 1 }); return true; },
      depositar: function (id, v) { var m = st.metas.filter(function (x) { return String(x.id) === String(id); })[0]; var n = lerNumero(v); if (!m || !(n > 0)) return false; m.guardado = r2(m.guardado + n); mudou({ metas: 1 }); return true; },
      removerMeta: function (id) { var antes = st.metas.length; st.metas = st.metas.filter(function (x) { return String(x.id) !== String(id); }); if (st.metas.length === antes) return false; mudou({ metas: 1 }); return true; },
      setTaxa: function (v) { var n = lerNumero(v); if (!(n >= 0)) return false; st.taxa = n; mudou({ taxa: 1 }); return true; },

      /* ---- meus números ---- */
      setNumeros: function (patch) {
        var erros = {}, novo = Object.assign({}, st.numeros);
        ['mercado', 'salario', 'piso'].forEach(function (k) {
          if (!(k in patch)) return;
          var txt = patch[k];
          if (txt === '' || txt == null) { delete novo[k]; return; }
          var n = lerNumero(txt); if (!(n > 0)) erros[k] = 'Informe um valor maior que zero.'; else novo[k] = r2(n);
        });
        if ('repasse' in patch) novo.repasse = Object.assign({}, patch.repasse);
        if ('limites' in patch) {
          var lim = Object.assign({}, novo.limites);
          Object.keys(patch.limites).forEach(function (id) {
            var txt = patch.limites[id];
            if (txt === '' || txt == null) { delete lim[id]; return; }
            var n = lerNumero(txt); if (!(n > 0)) erros['limite_' + id] = 'Informe um limite maior que zero.'; else lim[id] = r2(n);
          });
          novo.limites = lim;
        }
        if ('periodicos' in patch) novo.periodicos = patch.periodicos;
        if (Object.keys(erros).length) return { ok: false, erros: erros };
        st.numeros = novo; mudou({ numeros: 1 }); return { ok: true };
      },
      marcarRepasse: function (mes, recebido) { var r = Object.assign({}, st.numeros.repasse); if (recebido) r[mes] = true; else delete r[mes]; st.numeros = Object.assign({}, st.numeros, { repasse: r }); mudou({ numeros: 1 }); },

      /* ---- modo e dados reais ---- */
      definirModo: function (m) { st.modo = m; gravar(CHAVES.modo, m); },
      importarReal: function (j) {
        var ok = j && j._meta && j.liquidez && j.cartao && j.pendencias_novembro && j.gastos_fixos_mensais && j.faturas_futuras_parcelas_antigas && j.regras_e_metas && j.entradas_esperadas;
        if (!ok) return { ok: false, erro: 'Arquivo não reconhecido: confira se é o dados_reais_*.json.' };
        st.real = j; st.modo = 'real'; gravar(CHAVES.modo, 'real'); mudou({ real: 1 }); return { ok: true };
      },
      /* troca o estado inteiro (vindo da sincronização) */
      aplicar: function (novo) {
        if (novo.lanc) st.lanc = novo.lanc; if (novo.pagos) st.pagos = novo.pagos; if (novo.tetos) st.tetos = novo.tetos;
        if (novo.metas) st.metas = novo.metas; if (novo.taxa != null) st.taxa = novo.taxa; if (novo.numeros !== undefined) st.numeros = novo.numeros || {};
        if (novo.real !== undefined) st.real = novo.real;
        mudou({ lanc: 1, pagos: 1, tetos: 1, metas: 1, taxa: 1, numeros: 1, real: novo.real !== undefined });
      },
      paraSync: function () { return { lanc: st.lanc, pagos: st.pagos, tetos: st.tetos, metas: st.metas, taxa: st.taxa, numeros: Object.keys(st.numeros).length ? st.numeros : undefined, real: st.modo === 'real' ? st.real : undefined }; },

      exportarCSV: function () {
        var q = function (t) { t = String(t); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
        var linhas = ['data,descricao,categoria,valor,forma,essencial,mes,conta_no_lazer'].concat(st.lanc.slice().sort(function (a, b) { return a.data.localeCompare(b.data); }).map(function (l) {
          return [l.data, q(l.desc), l.cat, l.valor.toFixed(2), l.forma || '', l.essencial ? 'Sim' : 'Não', l.data.slice(0, 7), l.lazer ? 'Sim' : 'Não'].join(',');
        }));
        return linhas.join('\n');
      }
    };
    return S;
  }

  var api = { criarStore: criarStore, lerNumero: lerNumero, dataValida: dataValida, sugerir: sugerir, validarLancamento: validarLancamento, interpretarTexto: interpretarTexto, ritmoMes: ritmoMes, RITMO_MIN_DIAS: RITMO_MIN_DIAS, CATEGORIAS: CATEGORIAS, FORMAS: FORMAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TFStore = api;
})(typeof window !== 'undefined' ? window : this);
