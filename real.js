/* Dados reais -> números do app. Funções puras, testadas em node. Nenhum dado pessoal mora neste arquivo. */
(function (root) {
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var r2 = function (x) { return Math.round(x * 100) / 100; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var soma = function (o) { return Object.keys(o || {}).reduce(function (s, k) { return s + (+o[k] || 0); }, 0); };

  function rotulosMeses(asOf) {
    var p = asOf.split('-'), y = +p[0], m = +p[1] - 1, out = [];
    for (var i = 0; i < 12; i++) { var mm = (m + i) % 12, yy = y + Math.floor((m + i) / 12); out.push(MESES[mm] + '/' + String(yy).slice(2)); }
    return out;
  }

  /* ---------- dia útil e salário ---------- */
  function pascoa(y) {   // algoritmo de Meeus/Jones/Butcher
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, mes - 1, dia));
  }
  function iso(dt) { return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate()); }
  /* feriados nacionais fixos, Sexta-feira Santa e Corpus Christi (este só para conferência: não é feriado nacional por lei) */
  function feriados(y) {
    var set = {};
    ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'].forEach(function (md) { set[y + '-' + md] = true; });
    var p = pascoa(y); set[iso(new Date(p.getTime() - 2 * 86400000))] = true;
    return set;
  }
  function quintoDiaUtil(y, m) {   // m de 1 a 12; segunda a sexta, sem feriados nacionais
    var fer = feriados(y), n = 0;
    for (var d = 1; d <= 31; d++) {
      var dt = new Date(Date.UTC(y, m - 1, d)); if (dt.getUTCMonth() !== m - 1) break;
      var w = dt.getUTCDay();
      if (w === 0 || w === 6 || fer[iso(dt)]) continue;
      if (++n === 5) return d;
    }
    return null;
  }

  /* ---------- média do mercado a partir dos lançamentos ---------- */
  /* Só existe média depois de pelo menos 28 dias desde o primeiro lançamento (qualquer categoria). */
  function mediaMercado(lanc, hojeISO) {
    if (!lanc || !lanc.length) return null;
    var datas = lanc.map(function (l) { return l.data; }).sort();
    var ini = new Date(datas[0] + 'T12:00:00Z'), fim = new Date(hojeISO + 'T12:00:00Z');
    var dias = Math.round((fim - ini) / 86400000) + 1;
    if (dias < 28) return null;
    var tot = lanc.filter(function (l) { return l.cat === 'Mercado' && l.valor > 0; }).reduce(function (s, l) { return s + l.valor; }, 0);
    return r2(tot / dias * 30);
  }

  function salarioEstimado(real) {
    return (real.entradas_esperadas.filter(function (e) { return /sal/i.test(e.descricao); })[0] || {}).valor_estimado || 0;
  }

  /* Saldo previsto no fim de cada mês (12 meses a partir do mês de as_of).
     Mês 0: liquidez de hoje menos as pendências do mês, o teto de lazer e o mercado do mês.
     Meses seguintes: + salário, - ajuda em casa, - fatura das parcelas antigas, - assinaturas, - faculdade, - lazer, - mercado, - gastos periódicos.
     opt.repasseMae: soma a parte da mãe de todas as faturas. Sem isso, só os meses marcados como recebidos em num.repasse.
     num (números do dono, opcional): salario, mercado, mercadoMedia, repasse {'AAAA-MM': true}, periodicos. */
  function projetar(real, opt, num) {
    opt = opt || {}; num = num || {};
    var fx = real.gastos_fixos_mensais, ass = soma(fx.assinaturas_no_cartao), lazer = fx.teto_lazer_mes;
    var salario = num.salario > 0 ? +num.salario : salarioEstimado(real);
    var mercado = num.mercado > 0 ? +num.mercado : (num.mercadoMedia > 0 ? +num.mercadoMedia : 0);
    var periodicos = num.periodicos || real.gastos_periodicos || [];
    var pend = num.pend != null && isFinite(num.pend) ? +num.pend : real.pendencias_novembro.reduce(function (s, p) { return s + p.valor; }, 0);   // pluggy-6: num.pend = só as não pagas, quando o início vem do banco ou da reserva digitada
    var fut = {}; real.faturas_futuras_parcelas_antigas.forEach(function (f) { fut[f.mes] = f; });
    var p = real._meta.as_of.split('-'), y = +p[0], m = +p[1] - 1;
    var inicio = num.inicio != null && isFinite(num.inicio) ? +num.inicio : real.liquidez.total;   // pluggy-6: a reserva (banco e digitada) quando houver; senão, a liquidez do arquivo
    var lazer0 = num.lazer0 != null && isFinite(num.lazer0) ? +num.lazer0 : lazer, mercado0 = num.mercado0 != null && isFinite(num.mercado0) ? +num.mercado0 : mercado;   // pluggy-6: só o que falta do mês, no início do banco ou digitado
    var saldo = r2(inicio - pend - lazer0 - mercado0), out = [saldo];
    for (var i = 1; i < 12; i++) {
      var mm = (m + i) % 12, yy = y + Math.floor((m + i) / 12);
      var chave = yy + '-' + pad(mm + 1);
      var f = fut[chave] || { fatura_total: 0, parte_mae: 0 };
      var fac = yy >= 2027 ? fx.faculdade_2027_estimado : fx.faculdade_2026;
      var recebeu = opt.repasseMae || (num.repasse && num.repasse[chave]);
      var entra = salario + (recebeu ? f.parte_mae : 0);
      var per = 0;
      periodicos.forEach(function (g) {
        var q = g.primeiro.split('-'), idx = (yy - +q[0]) * 12 + (mm + 1 - +q[1]);
        if (idx >= 0 && idx % g.a_cada_meses === 0) per += g.valor;
      });
      var sai = fx.ajuda_em_casa_a_partir_de_dezembro + f.fatura_total + ass + fac + lazer + mercado + per;
      saldo = r2(saldo + entra - sai); out.push(saldo);
    }
    return out;
  }

  // As traduções dos itens pendentes vêm no próprio arquivo de dados (campo _traducoes), nunca no código público.

  function fmt(n) { return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function planoTexto(a) {
    var n = (a.acao.match(/\d+\.\d{2}/g) || []).map(Number);
    if (/withdraw/i.test(a.acao) && n.length >= 3) return 'Retirar ' + fmt(n[0]) + ' da conta de liquidez e pagar a fatura (' + fmt(n[1]) + ') e a água (' + fmt(n[2]) + ').';
    if (/pay faculdade/i.test(a.acao) && n.length) return 'Pagar a faculdade (' + fmt(n[0]) + ').';
    return a.acao;
  }

  /* ---------- pluggy-6: origem e idade dos números ---------- */
  var LIMITE_DESATUALIZADO_H = 48;   // valor inicial, ajustar na semana de uso
  /* última data de fechamento antes de hoje: se o dia de hoje já passou do fechamento, é o fechamento deste mês; senão, o do mês anterior.
     Dia de fechamento maior que o mês (ex.: 31 em fevereiro) vira o último dia do mês. */
  function fechamentoAnterior(fecha, hojeISO) {
    var p = hojeISO.split('-').map(Number), y = p[0], m = p[1], d = p[2];
    var dia = function (yy, mm) { return Math.min(fecha, new Date(Date.UTC(yy, mm, 0)).getUTCDate()); };
    if (d > dia(y, m)) return y + '-' + pad(m) + '-' + pad(dia(y, m));
    m--; if (m < 1) { m = 12; y--; }
    return y + '-' + pad(m) + '-' + pad(dia(y, m));
  }
  /* fatura aberta estimada: movimentos do cartão depois do último fechamento até hoje (compra soma, estorno desconta), mínimo 0.
     O dia do fechamento fica na fatura que fechou (A Confirmar por banco). Cada parcela conta pelo próprio valor e pela própria data. */
  function estimarFatura(movs, fecha, hojeISO) {
    if (!(fecha >= 1 && fecha <= 31) || !/^\d{4}-\d{2}-\d{2}$/.test(hojeISO || '')) return null;
    var desde = fechamentoAnterior(fecha, hojeISO), s = 0;
    (movs || []).forEach(function (m) { if (m[0] > desde && m[0] <= hojeISO) s += m[1]; });
    return { valor: r2(Math.max(s, 0)), desde: desde };
  }
  var somaV = function (l) { return r2(l.reduce(function (s, x) { return s + x.valor; }, 0)); };

  /* Objeto no formato que as telas esperam.
     num: números do dono (veja projetar). ctx: {lanc, hojeISO} para a média do mercado. */
  function derivar(real, num, ctx) {
    num = num || {}; ctx = ctx || {};
    var fx = real.gastos_fixos_mensais, c = real.cartao, rg = real.regras_e_metas;
    var estimado = salarioEstimado(real), salario = num.salario > 0 ? +num.salario : estimado;
    var media = ctx.lanc && ctx.hojeISO ? mediaMercado(ctx.lanc, ctx.hojeISO) : null;
    var n2 = Object.assign({}, num, { mercadoMedia: media });
    var essencial = r2(fx.ajuda_em_casa_a_partir_de_dezembro + fx.faculdade_2026 + (fx.assinaturas_no_cartao.dados_moveis || 0));
    var futuras = real.faturas_futuras_parcelas_antigas;
    var ven = function (s) { return +s.slice(8); };
    var agenda = real.pendencias_novembro.map(function (p, i) {
      var d = ven(p.vence), nota = p.nota || '';
      if (/friday/i.test(nota)) { var m = nota.match(/\d{4}-\d{2}-(\d{2})/); if (m) d = +m[1]; }
      return { id: 'a' + (i + 1), nome: p.descricao + (d !== ven(p.vence) ? ' (vence dia ' + ven(p.vence) + ')' : ''), dia: d, valor: p.valor };
    });
    var lim = num.limites || {};
    var cartoes = [{ id: 'c1', nome: c.emissor, final: '', limite: +lim.c1 || c.limite || 0, fatura: c.fatura_atual.total, parcelasFuturas: r2(futuras.reduce(function (s, f) { return s + f.fatura_total; }, 0)), fecha: c.fechamento_dia, vence: ven(c.fatura_atual.vence_em), serie: futuras }];
    (real.cartoes_extra || []).forEach(function (x, i) {
      var id = x.id || 'c' + (i + 2);
      cartoes.push({ id: id, nome: x.nome, final: '', limite: +lim[id] || x.limite || 0, fatura: x.fatura || 0, parcelasFuturas: x.parcelasFuturas || 0, fecha: x.fechamento_dia || null, vence: x.vence_dia || null, serie: null });
    });
    /* ---------- pluggy-6: o que o banco confirma vence o arquivo ---------- */
    var B = ctx.banco && Array.isArray(ctx.banco.contas) && ctx.banco.contas.length ? ctx.banco : null, idf = ctx.idadeMs, ag = ctx.agora;
    var oBanco = function (atu) { var ms = atu && idf ? idf(atu, ag) : null; return { t: 'banco', ms: ms, desat: ms === null || ms > LIMITE_DESATUALIZADO_H * 36e5 }; };
    var oArq = { t: 'arquivo', data: real._meta.as_of };
    var contasBank = B ? B.contas.filter(function (x) { return x.tipo === 'BANK'; }) : [];
    var caixaLinhas = contasBank.length ? contasBank.map(function (x) { return { nome: x.nome, valor: x.saldo, o: oBanco(x.atu) }; })
      : [{ nome: 'Conta corrente', valor: real.liquidez.conta_corrente, o: oArq }];
    var reservaBanco = !!B && (B.ip === true || (Array.isArray(B.inv) && B.inv.length > 0));   // a ponte mandou a lista de investimentos (mesmo vazia) ou há investimento com saldo
    var reservaLinhas = (reservaBanco ? B.inv.map(function (v) { return { nome: v.nome, valor: v.saldo, o: oBanco(v.atu) }; })
      : [{ nome: String(real.liquidez.onde || 'Liquidez').split('(')[0].trim(), valor: real.liquidez.total, o: oArq }])
      .concat((ctx.reserva || []).map(function (r) { return { nome: r.nome, valor: r.valor, o: { t: 'digitado', data: r.data } }; }));
    var caixinha = somaV(reservaLinhas);
    n2.inicio = caixinha;
    /* início do arquivo (liquidez.total, sem reserva digitada): tudo como antes. Início do banco ou digitado: o mês 0 desconta só as pendências
       não pagas, pela mesma regra de Hoje e Agenda (ctx.pago = S.estaPago: marca em tf_pagos; sem marca e já vencida conta como paga). */
    var inicioArquivo = !reservaBanco && !(ctx.reserva || []).length, pendNaoPagas = null;
    if (!inicioArquivo && typeof ctx.pago === 'function') {
      var np = agenda.filter(function (a) { return !ctx.pago(a); });
      pendNaoPagas = { n: np.length, valor: somaV(np) }; n2.pend = pendNaoPagas.valor;
    }
    /* lazer e mercado do mês 0: no início do banco ou digitado, o que já foi lançado neste mês já saiu da conta; desconta só o que falta
       (teto de lazer menos o lazer lançado; mercado do mês menos o mercado lançado; mínimo 0). Só quando hoje está no mês do arquivo. */
    var falta = null;
    if (!inicioArquivo && ctx.lanc && ctx.hojeISO && ctx.hojeISO.slice(0, 7) === real._meta.as_of.slice(0, 7)) {
      var doMes = ctx.lanc.filter(function (l) { return String(l.data).slice(0, 7) === ctx.hojeISO.slice(0, 7) && l.valor > 0 && !l.neutro; });
      var gl = r2(doMes.filter(function (l) { return l.lazer; }).reduce(function (s, l) { return s + l.valor; }, 0));
      var gm = r2(doMes.filter(function (l) { return !l.lazer && l.cat === 'Mercado'; }).reduce(function (s, l) { return s + l.valor; }, 0));
      var mercadoMes = num.mercado > 0 ? +num.mercado : (media > 0 ? +media : 0);
      falta = { lazer: r2(Math.max(fx.teto_lazer_mes - gl, 0)), mercado: r2(Math.max(mercadoMes - gm, 0)) };
      n2.lazer0 = falta.lazer; n2.mercado0 = falta.mercado;
    }
    /* cartões: o cartão do banco ligado a um cartão do app (escolha em Meus números; com um de cada lado, liga sozinho) */
    var credB = B ? B.contas.filter(function (x) { return x.tipo === 'CREDIT'; }) : [], liga = ctx.liga || {}, usados = {};
    var cartaoDe = function (bc) { var v = liga[bc.id]; if (v === 'nao') return null; if (v) return cartoes.filter(function (c) { return c.id === v; })[0] || null; return credB.length === 1 && cartoes.length === 1 ? cartoes[0] : null; };
    credB.forEach(function (bc) {
      var c = cartaoDe(bc); if (!c || usados[c.id]) return; usados[c.id] = 1;
      var o = oBanco(bc.atu), est = estimarFatura((B.movs || {})[bc.id], c.fecha, ctx.hojeISO);
      c.banco = { id: bc.id, nome: bc.nome };
      c.origem = { limite: typeof bc.lim === 'number' ? o : null, usado: o, fatura: est ? { t: 'estimado', desde: est.desde, ms: o.ms, desat: o.desat } : null };
      if (typeof bc.lim === 'number') c.limite = bc.lim;
      c.disponivel = typeof bc.disp === 'number' ? bc.disp : null;
      c.usadoBanco = bc.saldo;   // limite usado = saldo do cartão no banco (limite menos disponível): fatura aberta mais parcelas que ainda vêm
      if (est) { c.fatura = est.valor; c.parcelasFuturas = r2(Math.max(bc.saldo - est.valor, 0)); }   // compromisso futuro estimado, mínimo 0
    });
    var base = projetar(real, {}, n2), com = projetar(real, { repasseMae: true }, n2);
    var origemMercado = num.mercado > 0 ? 'informado' : (media > 0 ? 'média dos lançamentos' : 'ainda sem valor');
    var ano = +real._meta.as_of.slice(0, 4), mes = +real._meta.as_of.slice(5, 7);
    var prox = mes === 12 ? [ano + 1, 1] : [ano, mes + 1];
    var salarioDia = quintoDiaUtil(prox[0], prox[1]);
    var sup = [
      salario === estimado && !(num.salario > 0) ? 'Salário líquido estimado em ' + fmt(salario) + ' a partir de dezembro (ainda sem holerite).' : 'Salário líquido informado: ' + fmt(salario) + ' por mês.',
      'Entram as parcelas antigas do cartão, as assinaturas (' + fmt(soma(fx.assinaturas_no_cartao)) + ' por mês), a ajuda em casa, a faculdade e o teto de lazer.',
      'Transporte pelo vale-transporte da empresa: o desconto é feito na folha e não sai do caixa. Se o salário líquido já vem depois do desconto, nada muda.',
      origemMercado === 'ainda sem valor' ? 'Mercado do dia a dia ainda não foi informado, então não está na projeção.' : 'Mercado entra na projeção: ' + fmt(num.mercado > 0 ? +num.mercado : media) + ' por mês (' + origemMercado + ').',
      'Repasse da mãe e venda da cama só contam quando recebidos.'
    ];
    if ((num.periodicos || real.gastos_periodicos || []).length) sup.push('Gastos periódicos entram no mês em que caem.');
    return {
      real: true, asOf: real._meta.as_of,
      caixinha: caixinha, conta: contasBank.length ? somaV(caixaLinhas) : real.liquidez.conta_corrente, essencial: essencial, renda: salario,
      caixaBanco: !!contasBank.length, caixaLinhas: caixaLinhas, reservaLinhas: reservaLinhas, origemArquivo: oArq, pendNaoPagas: pendNaoPagas, faltaMes0: falta,   // pluggy-6
      salarioEstimado: !(num.salario > 0), salarioDiaProximo: salarioDia,
      meta: rg.meta_17_01_2027, piso: rg.piso_17_01_2027, alerta: rg.alerta_dezembro, tetoLazer: fx.teto_lazer_mes,
      pisoNovo: num.piso > 0 ? +num.piso : null,
      meses: rotulosMeses(real._meta.as_of),
      cenarios: { 'Base': base, 'Com repasse da mãe': com },
      carteira: reservaLinhas.map(function (x, i) { return { nome: x.o.t === 'arquivo' && i === 0 ? x.nome + ' (liquidez diária)' : x.nome, classe: 'Renda fixa', valor: x.valor, liquidez: 'diaria', o: x.o }; }),
      cartoes: cartoes,
      parcelamentos: [],
      agenda: agenda,
      tetos: { Mercado: 0, Transporte: 0, Estudos: 0, 'Saúde': 0, Outros: 0 },
      pendentes: (real.pendente_do_usuario || []).map(function (t) { return (real._traducoes || {})[t] || t; }).filter(function (t) {
        if (num.salario > 0 && /holerite|sal[aá]rio/i.test(t)) return false;
        if (num.piso > 0 && /piso/i.test(t)) return false;
        return true;
      }),
      plano: (real.plano_de_pagamento || []).map(function (a) { return { data: a.data, texto: planoTexto(a) }; }),
      sobra: real.sobra_apos_pagar_tudo,
      pisoDefinido: !/NOT yet defined/i.test(rg.piso_absoluto_status || '') || num.piso > 0,
      mercadoOrigem: origemMercado, mercadoMedia: media,
      suposicoes: sup
    };
  }

  var api = { estimarFatura: estimarFatura, fechamentoAnterior: fechamentoAnterior, LIMITE_DESATUALIZADO_H: LIMITE_DESATUALIZADO_H, projetar: projetar, derivar: derivar, rotulosMeses: rotulosMeses, quintoDiaUtil: quintoDiaUtil, feriados: feriados, mediaMercado: mediaMercado, salarioEstimado: salarioEstimado, fmt: fmt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Real = api;
})(typeof window !== 'undefined' ? window : this);
