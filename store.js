/* Camada de dados do Tutor Financeiro: estado, validação e operações. Pura (sem DOM), testada em node.
   O armazenamento (localStorage) entra por parâmetro. Nada aqui conhece telas. */
(function (root) {
  var Seg = (typeof require === 'function' && typeof module !== 'undefined') ? require('./seguranca.js') : root.TFSeg;
  var CHAVES = { lanc: 'tf_lanc3', pagos: 'tf_pagos', tetos: 'tf_tetos', metas: 'tf_metas', taxa: 'tf_taxameta', numeros: 'tf_numeros', real: 'tf_real', modo: 'tf_modo' };
  var CATEGORIAS = ['Mercado', 'Transporte', 'Lazer', 'Comida', 'Estudos', 'Saúde', 'Jogos', 'Outros'];
  var FORMAS = ['Pix', 'Débito', 'Crédito', 'Dinheiro'];
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var r2 = function (x) { return Math.round(x * 100) / 100; };
  var comOrigem = function (l, n) { if (l.origem) { n.origem = l.origem; n.idExterno = l.idExterno; } if (l.contaId) { n.contaId = l.contaId; n.contaNome = l.contaNome; } return n; };
  var comNeutro = function (n, ligado) { if (ligado) n.neutro = true; return n; };   // editar não apaga de onde o lançamento veio
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
  var RE_NUM = /\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?/g;
  var RE_UNIDADE = /^\s*(?:tb|gb|mb|kb|kg|mg|ml|km|cm|mm|g|l|m|un|und|unid|unidades?|cx|pct|p[cç]s?|itens?|pessoas?|vez|vezes)(?![a-zà-ÿ0-9])/i;
  var RE_VEZES = /^\s*(?:x|vez|vezes)(?![a-zà-ÿ0-9])/i;
  /* \b do JavaScript não vê letra acentuada ("ônibus", "café"); só para achar palavras: as posições e a descrição usam o texto digitado. */
  function semAcento(t) { return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  /* "1.200" no texto é milhar pt-BR. lerNumero segue tratando "12.06" como decimal (campos numéricos). */
  function lerValorTexto(t) { return lerNumero(/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(t) ? t.replace(/\./g, '') : t); }
  /* Acha o valor no texto. Não contam: "3x" e "3 vezes" (parcelas), número seguido de unidade ou quantidade ("1tb", "4 un", "2 pessoas"), número colado em
     palavra ("ps5") e partes de data ("10/11"). Entre os que sobram, vence o marcado com R$ ou "reais", depois o que tem
     centavos ou milhar e, por fim, o último número solto ("2 pizzas 40"). */
  function acharValor(base) {
    var cands = [], vezes = null, m;
    RE_NUM.lastIndex = 0;
    while ((m = RE_NUM.exec(base))) {
      var ini = m.index, fim = ini + m[0].length, antes = base.slice(0, ini), depois = base.slice(fim);
      if (/[a-zà-ÿ]$/i.test(antes) || /\/$/.test(antes) || /^\//.test(depois)) continue;
      var x = RE_VEZES.exec(depois);
      if (x && /^\d{1,2}$/.test(m[0])) { if (!vezes) vezes = { n: +m[0], ini: ini, fim: fim + x[0].length }; continue; }
      if (RE_UNIDADE.test(depois)) continue;
      cands.push({ txt: m[0], ini: ini, fim: fim, moeda: /R\$\s*$/i.test(antes) || /^\s*(?:reais|real|conto)\b/i.test(depois), marcado: /[.,]/.test(m[0]) });
    }
    var filtra = function (k) { return cands.filter(function (c) { return c[k]; }); };
    var moeda = filtra('moeda'), marcado = filtra('marcado');
    return { cand: moeda[0] || marcado[marcado.length - 1] || cands[cands.length - 1] || null, vezes: vezes };
  }
  function interpretarTexto(txt, hojeISO) {
    var s = String(txt || '').trim();
    if (!s) return { ok: false, erro: 'Digite algo como "45 mercado pix".' };
    var diaTxt = s.match(/\bdia\s+(\d{1,2})\b/i);
    var base = diaTxt ? s.replace(diaTxt[0], diaTxt[0].replace(/./g, ' ')) : s;   // mesmas posições do texto original
    var achado = acharValor(base), m = achado.cand;
    var valor = m ? lerValorTexto(m.txt) : NaN;
    if (!(valor > 0)) return { ok: false, erro: 'Não achei o valor. Escreva o número, como em "45 mercado pix".' };
    var tipo = /\b(recebi|recebido|entrada|sal[aá]rio|ganhei)\b/i.test(s) ? 'entrada' : 'gasto';
    var cat = 'Outros', padroes = [], achouCat = false, achouForma = false;
    var plano = semAcento(s);
    for (var i = 0; i < PALAVRAS.length; i++) { if (PALAVRAS[i][1].test(plano)) { cat = PALAVRAS[i][0]; achouCat = true; break; } }
    var forma = 'Pix'; for (var j = 0; j < FORMAS_TXT.length; j++) { if (FORMAS_TXT[j][1].test(plano)) { forma = FORMAS_TXT[j][0]; achouForma = true; break; } }
    if (!achouForma) padroes.push('forma');   // a tela pode avisar que Pix ou Outros foram supostos
    if (!achouCat) padroes.push('cat');
    var v = achado.vezes, parcelas = v && tipo === 'gasto' && forma === 'Crédito' && v.n >= 2 ? v.n : null;   // sem cartão, "3x" é ignorado
    var cortes = [m].concat(v ? [v] : []).sort(function (a, b) { return b.ini - a.ini; }), semValor = s;
    cortes.forEach(function (c) { semValor = semValor.slice(0, c.ini) + ' ' + semValor.slice(c.fim); });
    var data = hojeISO;
    if (/\banteontem\b/i.test(s)) data = somarDias(hojeISO, -2); else if (/\bontem\b/i.test(s)) data = somarDias(hojeISO, -1);
    else if (diaTxt && +diaTxt[1] >= 1 && +diaTxt[1] <= 31) { var cand = hojeISO.slice(0, 8) + pad(+diaTxt[1]); if (dataValida(cand)) data = cand; }
    var desc = semValor.replace(/R\$/gi, ' ').replace(/\b(pix|d[eé]bito|cr[eé]dito|cart[aã]o|dinheiro|esp[eé]cie|hoje|ontem|anteontem|recebi|recebido|entrada|ganhei)\b/gi, ' ').replace(/\bdia\s+\d{1,2}\b/gi, ' ').replace(/\s+/g, ' ').trim();
    desc = desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : cat;
    return { ok: true, tipo: tipo, valor: valor, cat: cat, forma: forma, data: data, desc: desc, parcelas: parcelas, padroes: padroes };
  }

  /* Primeiro uso: três números aproximados. "1.200" é milhar, como no texto rápido; "12.06" segue decimal em lerNumero. */
  function lerAprox(v) { var t = String(v == null ? '' : v).trim().replace(/\s|R\$/g, ''); return lerNumero(/^-?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(t) ? t.replace(/\./g, '') : t); }
  function validarInicio(d) {
    d = d || {}; var erros = {}, renda = lerAprox(d.renda), fixos = lerAprox(d.fixos), saldo = lerAprox(d.saldo);
    if (!(renda > 0)) erros.renda = 'Informe a renda do mês. Pode ser aproximada.';
    if (!(fixos >= 0)) erros.fixos = 'Informe os gastos fixos do mês. Pode ser aproximado; zero também vale.';
    if (isNaN(saldo)) erros.saldo = 'Informe o saldo de hoje. Pode ser aproximado.';
    return Object.keys(erros).length ? { ok: false, erros: erros } : { ok: true, valores: { renda: r2(renda), fixos: r2(fixos), saldo: r2(saldo) } };
  }
  /* Monta o mesmo formato do arquivo importado, com os blocos ainda vazios: cada tela diz o que ganha quando for preenchida. */
  function montarInicio(v, hojeISO) {
    return {
      _meta: { as_of: hojeISO }, _inicio: Object.assign({ renda: v.renda, fixos: v.fixos, saldo: v.saldo }, +hojeISO.slice(8) > 1 ? { mes_incompleto: hojeISO.slice(0, 7) } : {}),   // começou depois do dia 1: o que veio antes ainda não foi lançado
      liquidez: { total: v.saldo, conta_corrente: 0, onde: 'Saldo informado' },
      cartao: { emissor: 'Cartão', fechamento_dia: 1, limite: 0, fatura_atual: { total: 0, vence_em: hojeISO } },
      pendencias_novembro: [], plano_de_pagamento: [], sobra_apos_pagar_tudo: 0,
      entradas_esperadas: [{ descricao: 'Salário ou renda do mês', valor_estimado: v.renda }],
      gastos_fixos_mensais: { ajuda_em_casa_a_partir_de_dezembro: v.fixos, faculdade_2026: 0, faculdade_2027_estimado: 0, assinaturas_no_cartao: {}, teto_lazer_mes: 0 },
      faturas_futuras_parcelas_antigas: [], regras_e_metas: { meta_17_01_2027: 0, piso_17_01_2027: 0, alerta_dezembro: 0, piso_absoluto_status: 'definido' },
      pendente_do_usuario: [], _traducoes: {}, cartoes_extra: []
    };
  }
  /* Quanto dá para gastar por dia até o fim do mês, em centavos. Arredonda para baixo: nunca promete a mais. */
  function porDia(renda, fixos, gasto, dia, diasMes) {
    var c = function (x) { return Math.round(Number(x) * 100) || 0; };
    var livre = c(renda) - c(fixos), resta = livre - c(gasto), dias = Math.max(1, Math.floor(diasMes) - Math.floor(dia) + 1);
    var d = resta > 0 ? Math.floor(resta / dias) : 0;
    return { livreCentavos: livre, restaCentavos: resta, porDiaCentavos: d, diasRestantes: dias, livre: livre / 100, resta: resta / 100, porDia: d / 100 };
  }
  /* O modo exemplo guarda tudo em chaves próprias: trocar de modo nunca mistura dados. Só a chave do modo é comum. */
  var PREF_EXEMPLO = 'tf_demo_';
  function armazenamentoDoModo(storage) {
    var modo = null; try { modo = JSON.parse(storage.getItem(CHAVES.modo)); } catch (e) { modo = null; }
    if (modo !== 'demo') return storage;
    var k = function (c) { return c === CHAVES.modo ? c : PREF_EXEMPLO + c; };
    return { getItem: function (c) { return storage.getItem(k(c)); }, setItem: function (c, v) { storage.setItem(k(c), v); }, removeItem: function (c) { storage.removeItem(k(c)); } };
  }
  /* Qual explicação de instalação mostrar. */
  function plataforma(ua, instalado) {
    if (instalado) return 'instalado';
    ua = String(ua || '');
    if (/iPhone|iPad|iPod/.test(ua)) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-outro' : 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'computador';
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
        var l = { id: novoId(), data: o.data, desc: String(o.desc || '').trim().slice(0, Seg.LIM.desc) || o.cat, cat: o.cat, valor: r2(tipo === 'entrada' ? -v.valor : v.valor), forma: o.forma || 'Pix', essencial: tipo === 'gasto' && !!o.essencial, lazer: tipo === 'gasto' && !!o.lazer };
        comNeutro(l, o.neutro === true);
        st.lanc.push(l); mudou({ lanc: 1 }); return { ok: true, id: l.id };
      },
      /* lançamentos confirmados na prévia do banco: tudo ou nada, id externo nunca repete */
      importarBanco: function (lista) {
        if (st.modo === 'demo') return { ok: false, erro: 'No modo de exemplo não dá para importar.' };
        if (!Array.isArray(lista) || !lista.length) return { ok: false, erro: 'Nada selecionado.' };
        var usados = {}, ext = new Set(), novos = [], i, x, v, id;
        st.lanc.forEach(function (l) { usados[String(l.id)] = 1; if (l.idExterno) ext.add(l.idExterno); });
        for (i = 0; i < lista.length; i++) {
          x = lista[i]; v = r2(Number(x && x.valor));
          if (!x || !(v > 0) || !dataValida(x.data) || typeof x.idExterno !== 'string' || !x.idExterno || FORMAS.indexOf(x.forma) < 0 || (x.direcao !== 'entrada' && x.direcao !== 'saida')) return { ok: false, erro: 'Há um item inválido. Nada foi importado.' };
          if (ext.has(x.idExterno)) continue;
          ext.add(x.idExterno);
          do { id = novoId(); } while (usados[String(id)]);
          usados[String(id)] = 1;
          novos.push({ id: id, data: x.data, desc: String(x.desc || '').trim().slice(0, Seg.LIM.desc) || 'Outros', cat: 'Outros', valor: r2(x.direcao === 'entrada' ? -v : v), forma: x.forma, essencial: false, lazer: false, origem: 'pluggy', idExterno: x.idExterno });
          if (x.contaId && x.contaNome) { novos[novos.length - 1].contaId = x.contaId; novos[novos.length - 1].contaNome = String(x.contaNome).slice(0, Seg.LIM.nome); }
          comNeutro(novos[novos.length - 1], x.neutro === true);
        }
        if (novos.length) { st.lanc = st.lanc.concat(novos); mudou({ lanc: 1 }); }
        return { ok: true, n: novos.length };
      },
      /* liga um lançamento que já existe à conta do banco. Só acrescenta a conta e, se faltarem, origem e id externo. */
      vincularBanco: function (lista) {
        if (st.modo === 'demo') return { ok: false, erro: 'No modo de exemplo não dá para importar.' };
        if (!Array.isArray(lista)) return { ok: false, erro: 'Nada selecionado.' };
        var pedidos = new Map(), n = 0, nn = 0;
        lista.forEach(function (x) { if (x && x.alvo != null && typeof x.contaId === 'string' && x.contaId && typeof x.contaNome === 'string' && x.contaNome) pedidos.set(String(x.alvo), x); });
        var novo = st.lanc.map(function (l) {
          var x = pedidos.get(String(l.id)); if (!x) return l;
          var c;
          if (l.contaId) { if (l.contaId !== x.contaId || x.neutro !== true || l.neutro) return l; c = Object.assign({}, l); c.neutro = true; n++; nn++; return c; }
          c = Object.assign({}, l); c.contaId = x.contaId; c.contaNome = x.contaNome.slice(0, Seg.LIM.nome);
          if (x.neutro === true && !c.neutro) { c.neutro = true; nn++; }
          if (!c.origem) c.origem = 'pluggy';
          if (!c.idExterno && typeof x.idExterno === 'string') c.idExterno = x.idExterno;
          n++; return c;
        });
        if (n) { st.lanc = novo; mudou({ lanc: 1 }); }
        return { ok: true, n: n, neutros: nn };
      },
      editar: function (id, o) {
        var v = validarLancamento(o); if (!v.ok) return { ok: false, erros: v.erros };
        var achou = false, tipo = o.tipo === 'entrada' ? 'entrada' : 'gasto';
        st.lanc = st.lanc.map(function (l) { if (String(l.id) !== String(id)) return l; achou = true; return comNeutro(comOrigem(l, { id: l.id, data: o.data, desc: String(o.desc || '').trim().slice(0, Seg.LIM.desc) || o.cat, cat: o.cat, valor: r2(tipo === 'entrada' ? -v.valor : v.valor), forma: o.forma || 'Pix', essencial: tipo === 'gasto' && !!o.essencial, lazer: tipo === 'gasto' && !!o.lazer }), o.neutro === undefined ? l.neutro === true : o.neutro === true); });
        if (!achou) return { ok: false, erros: { geral: 'Lançamento não encontrado.' } };
        mudou({ lanc: 1 }); return { ok: true };
      },
      apagar: function (id) {
        var l = st.lanc.filter(function (x) { return String(x.id) === String(id); })[0]; if (!l) return null;
        st.lanc = st.lanc.filter(function (x) { return String(x.id) !== String(id); }); mudou({ lanc: 1 }); return l;
      },
      desfazerApagar: function (l) { if (l && !st.lanc.some(function (x) { return String(x.id) === String(l.id); })) { st.lanc.push(l); mudou({ lanc: 1 }); return true; } return false; },
      doMes: function (mes) { mes = mes || S.mesAtual(); return st.lanc.filter(function (l) { return l.data.indexOf(mes) === 0; }); },
      gastosMes: function (mes) { return S.doMes(mes).filter(function (l) { return l.valor > 0 && !l.neutro; }); },   // neutro: dinheiro que só mudou de lugar
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
        var meta = { id: novoId(), nome: String(m.nome).trim().slice(0, Seg.LIM.nome), alvo: r2(alvo), guardado: g > 0 ? r2(g) : 0, prazo: m.prazo, aporte: ap > 0 ? r2(ap) : 0 };
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
      comecar: function (d) {
        var v = validarInicio(d); if (!v.ok) return v;
        return S.importarReal(montarInicio(v.valores, S.hojeISO()));
      },
      atualizarInicio: function (d) {
        var v = validarInicio(d); if (!v.ok) return v; if (!st.real || !st.real._inicio) return { ok: false, erros: { geral: 'Sem dados de início.' } };
        var x = v.valores, r = st.real;
        var incompleto = r._inicio.mes_incompleto; r._inicio = { renda: x.renda, fixos: x.fixos, saldo: x.saldo }; if (incompleto) r._inicio.mes_incompleto = incompleto; r.liquidez.total = x.saldo;
        r.entradas_esperadas = [{ descricao: 'Salário ou renda do mês', valor_estimado: x.renda }];
        r.gastos_fixos_mensais.ajuda_em_casa_a_partir_de_dezembro = x.fixos;
        mudou({ real: 1 }); return { ok: true };
      },
      /* A marca guarda o ano e o mês: no mês seguinte deixa de valer sem ninguém apagar. */
      mesIncompleto: function () { return st.modo === 'real' && !!(st.real && st.real._inicio) && st.real._inicio.mes_incompleto === S.mesAtual(); },
      limparMesIncompleto: function () { if (!st.real || !st.real._inicio) return; delete st.real._inicio.mes_incompleto; mudou({ real: 1 }); },
      atualizarCartao: function (d) {
        d = d || {}; var erros = {}, lim = lerAprox(d.limite), fat = lerAprox(d.fatura || '0'), fe = +d.fechamento, ve = +d.vencimento;
        if (!(lim > 0)) erros.limite = 'Informe o limite do cartão.';
        if (!(fat >= 0)) erros.fatura = 'Informe a fatura atual; zero também vale.';
        if (!(fe >= 1 && fe <= 28)) erros.fechamento = 'Informe o dia de fechamento, de 1 a 28.';
        if (!(ve >= 1 && ve <= 28)) erros.vencimento = 'Informe o dia de vencimento, de 1 a 28.';
        if (!st.real) erros.geral = 'Sem dados.';
        if (Object.keys(erros).length) return { ok: false, erros: erros };
        var c = st.real.cartao; c.limite = r2(lim); c.fechamento_dia = fe; c.fatura_atual = { total: r2(fat), vence_em: S.mesAtual() + '-' + pad(ve) };
        mudou({ real: 1 }); return { ok: true };
      },
      addConta: function (d) {
        d = d || {}; var nome = String(d.nome || '').trim().slice(0, 60), v = lerAprox(d.valor), dia = +d.dia, erros = {};
        if (!nome) erros.nome = 'Informe o nome da conta.';
        if (!(v > 0)) erros.valor = 'Informe o valor da conta.';
        if (!(dia >= 1 && dia <= 28)) erros.dia = 'Informe o dia de vencimento, de 1 a 28.';
        if (!st.real) erros.geral = 'Sem dados.';
        if (Object.keys(erros).length) return { ok: false, erros: erros };
        st.real.pendencias_novembro.push({ descricao: nome, valor: r2(v), vence: S.mesAtual() + '-' + pad(dia) });
        mudou({ real: 1 }); return { ok: true };
      },
      importarReal: function (j) {
        if (st.modo === 'demo') return { ok: false, erro: 'No modo de exemplo não dá para importar. Seus dados ficam só no modo real.' };
        var v = Seg.validarImportacao(j); if (!v.ok) return v;
        var ok = j && j._meta && j.liquidez && j.cartao && j.pendencias_novembro && j.gastos_fixos_mensais && j.faturas_futuras_parcelas_antigas && j.regras_e_metas && j.entradas_esperadas;
        if (!ok) return { ok: false, erro: 'Arquivo não reconhecido: confira se é o dados_reais_*.json.' };
        st.real = j; st.modo = 'real'; gravar(CHAVES.modo, 'real'); mudou({ real: 1 }); return { ok: true };
      },
      /* troca o estado inteiro (vindo da sincronização) */
      aplicar: function (novo) {
        novo = Seg.sanearEstado(novo).estado;   // o que vem do Drive nunca é confiável
        if (novo.lanc) st.lanc = novo.lanc; if (novo.pagos) st.pagos = novo.pagos; if (novo.tetos) st.tetos = novo.tetos;
        if (novo.metas) st.metas = novo.metas; if (novo.taxa != null) st.taxa = novo.taxa; if (novo.numeros !== undefined) st.numeros = novo.numeros || {};
        if (novo.real !== undefined) st.real = novo.real;
        mudou({ lanc: 1, pagos: 1, tetos: 1, metas: 1, taxa: 1, numeros: 1, real: novo.real !== undefined });
      },
      paraSync: function () { return { lanc: st.lanc, pagos: st.pagos, tetos: st.tetos, metas: st.metas, taxa: st.taxa, numeros: Object.keys(st.numeros).length ? st.numeros : undefined, real: st.modo === 'demo' || (st.modo !== 'real' && !st.real) ? undefined : st.real }; },   // sem modo, os dados guardados continuam valendo: nunca viram lápide no Drive

      exportarCSV: function () {
        var q = function (t) { t = String(t); if (/^[=+@\t\r-]/.test(t)) t = "'" + t; return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
        var linhas = ['data,descricao,categoria,valor,forma,essencial,mes,conta_no_lazer'].concat(st.lanc.slice().sort(function (a, b) { return a.data.localeCompare(b.data); }).map(function (l) {
          return [l.data, q(l.desc), q(l.cat), l.valor.toFixed(2), q(l.forma || ''), l.essencial ? 'Sim' : 'Não', l.data.slice(0, 7), l.lazer ? 'Sim' : 'Não'].join(',');
        }));
        return linhas.join('\n');
      }
    };
    return S;
  }

  var api = { criarStore: criarStore, lerNumero: lerNumero, dataValida: dataValida, sugerir: sugerir, validarLancamento: validarLancamento, interpretarTexto: interpretarTexto, validarInicio: validarInicio, montarInicio: montarInicio, porDia: porDia, armazenamentoDoModo: armazenamentoDoModo, plataforma: plataforma, ritmoMes: ritmoMes, RITMO_MIN_DIAS: RITMO_MIN_DIAS, CATEGORIAS: CATEGORIAS, FORMAS: FORMAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TFStore = api;
})(typeof window !== 'undefined' ? window : this);
