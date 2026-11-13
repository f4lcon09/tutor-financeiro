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
    var fut = {}; (num.futuras || real.faturas_futuras_parcelas_antigas).forEach(function (f) { fut[f.mes] = f; });   // pluggy-8: num.futuras = a série com as parcelas novas do banco
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
      var sai = fx.ajuda_em_casa_a_partir_de_dezembro + f.fatura_total + (f.novas || 0) + ass + fac + lazer + mercado + per;
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
     O dia do fechamento fica na fatura que fechou. Exceção (pluggy-7, visto no Nubank em 12/11/2026, A Confirmar em outros bancos):
     as parcelas de uma fatura chegam datadas no dia do fechamento anterior. Então, com pm (as parcelas, já dentro de movs):
     soma as parcelas datadas no último fechamento e tira as datadas hoje, quando hoje é dia de fechamento. Sem pm, igual a antes. */
  function estimarFatura(movs, fecha, hojeISO, pm) {
    if (!(fecha >= 1 && fecha <= 31) || !/^\d{4}-\d{2}-\d{2}$/.test(hojeISO || '')) return null;
    var desde = fechamentoAnterior(fecha, hojeISO), s = 0, np = 0;
    (movs || []).forEach(function (m) { if (m[0] > desde && m[0] <= hojeISO) s += m[1]; });
    var hp = hojeISO.split('-').map(Number), fechaHoje = hp[2] === Math.min(fecha, new Date(Date.UTC(hp[0], hp[1], 0)).getUTCDate());
    (pm || []).forEach(function (m) {
      if (m[0] === desde) { s += m[1]; np++; }
      else if (fechaHoje && m[0] === hojeISO) s -= m[1];
    });
    return { valor: r2(Math.max(s, 0)), desde: desde, parcelas: np };
  }
  /* pluggy-8: as parcelas do banco nas faturas seguintes à aberta. pn: [data, valor, n, N] com n < N.
     Parcela da fatura aberta: datada no último fechamento (regra da pluggy-7) ou depois dele até hoje (menos as datadas hoje, quando hoje é dia de fechamento).
     Cada uma repete o valor nas N - n faturas seguintes. "novas": as que começaram depois da data do arquivo (a 1ª parcela, n - 1 meses antes, é posterior a asOf);
     o arquivo não tem como conhecê-las. Devolve { todas: [...], novas: [...] }, posição 0 = a fatura logo depois da aberta. */
  function parcelasSeguintes(pn, fecha, hojeISO, asOf) {
    if (!(fecha >= 1 && fecha <= 31) || !/^\d{4}-\d{2}-\d{2}$/.test(hojeISO || '')) return null;
    var desde = fechamentoAnterior(fecha, hojeISO), hp = hojeISO.split('-').map(Number), fechaHoje = hp[2] === Math.min(fecha, new Date(Date.UTC(hp[0], hp[1], 0)).getUTCDate());
    var todas = [], novas = [], n = 0;
    var inicio = function (iso, k) { var p = iso.split('-').map(Number), t = p[0] * 12 + (p[1] - 1) - (k - 1), y = Math.floor(t / 12), m = t % 12 + 1; return y + '-' + pad(m) + '-' + pad(Math.min(p[2], new Date(Date.UTC(y, m, 0)).getUTCDate())); };
    (pn || []).forEach(function (m) {
      if (!(m[0] === desde || (m[0] > desde && m[0] <= hojeISO && !(fechaHoje && m[0] === hojeISO)))) return;
      var nova = inicio(m[0], m[2]) > String(asOf || ''); n++;
      for (var i = 0; i < m[3] - m[2] && i < 120; i++) { todas[i] = (todas[i] || 0) + m[1]; novas[i] = (novas[i] || 0) + (nova ? m[1] : 0); }
    });
    return { todas: todas.map(function (x) { return r2(x); }), novas: novas.map(function (x) { return r2(x); }), n: n };
  }
  function mesMais(mes, k) { var p = mes.split('-').map(Number), t = p[0] * 12 + (p[1] - 1) + k; return Math.floor(t / 12) + '-' + pad(t % 12 + 1); }
  /* mês em que a fatura aberta vence ('AAAA-MM'): ela fecha no mês seguinte ao do último fechamento e vence nesse mesmo mês,
     ou no seguinte quando o dia do vencimento não é depois do dia do fechamento. É a chave "mes" das faturas do arquivo. */
  function mesAberta(fecha, vence, hojeISO) {
    if (!(fecha >= 1 && fecha <= 31) || !/^\d{4}-\d{2}-\d{2}$/.test(hojeISO || '')) return null;
    return mesMais(fechamentoAnterior(fecha, hojeISO).slice(0, 7), vence >= 1 && vence <= fecha ? 2 : 1);
  }
  /* série das faturas DEPOIS da aberta, por mês (nunca por posição): as linhas do arquivo (parcelas antigas) com mes > aberta, mais as do banco.
     Em cada mês, o que o banco acrescenta ("novas") é o maior entre: as parcelas que começaram depois da data do arquivo; e o que o banco mostra
     a mais que o arquivo naquele mês. Mínimo 0. Mês que o arquivo não tem ganha linha nova. O arquivo não é alterado; a saída vem em ordem de mês. */
  function juntarSerie(serie, ps, aberta) {
    var mapa = {};
    (serie || []).forEach(function (f) {
      if (!(f.mes > aberta)) return;
      if (mapa[f.mes]) { mapa[f.mes].fatura_total = r2(mapa[f.mes].fatura_total + f.fatura_total); mapa[f.mes].parte_mae = r2((mapa[f.mes].parte_mae || 0) + (f.parte_mae || 0)); }
      else mapa[f.mes] = Object.assign({}, f);
    });
    ((ps && ps.todas) || []).forEach(function (tot, k) {
      var mes = mesMais(aberta, k + 1), arq = mapa[mes] ? mapa[mes].fatura_total : 0, nv = r2(Math.max(ps.novas[k] || 0, (tot || 0) - arq, 0));
      if (!(nv > 0)) return;
      if (!mapa[mes]) mapa[mes] = { mes: mes, fatura_total: 0, parte_mae: 0 };
      mapa[mes].novas = nv;
    });
    return Object.keys(mapa).sort().map(function (k) { return mapa[k]; });
  }
  /* pluggy-9 (diagnóstico do dono): os movimentos brutos de um cartão do banco, do último fechamento até hoje, cada um com o que a estimativa
     faz com ele. Mesma regra de banco.js:instantaneo + estimarFatura: pagamento fica fora; compra depois do fechamento conta; parcela datada
     no fechamento conta; compra comum no dia do fechamento fica na fatura que fechou; parcela datada hoje, em dia de fechamento, é da próxima.
     ehPagamento(cat) vem de TFBanco.catDoBanco. Devolve { desde, itens (mais novo primeiro), total, conta } ou null. */
  function itensFatura(movs, contaId, fecha, hojeISO, inverter, ehPagamento) {
    if (!(fecha >= 1 && fecha <= 31) || !/^\d{4}-\d{2}-\d{2}$/.test(hojeISO || '') || !Array.isArray(movs)) return null;
    var desde = fechamentoAnterior(fecha, hojeISO), hp = hojeISO.split('-').map(Number), fechaHoje = hp[2] === Math.min(fecha, new Date(Date.UTC(hp[0], hp[1], 0)).getUTCDate());
    var itens = [], total = 0, conta = 0;
    movs.forEach(function (m) {
      if (!isObjeto(m) || m.conta !== contaId || typeof m.data !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(m.data) || typeof m.valor !== 'number' || !isFinite(m.valor) || (m.tipo !== 'DEBIT' && m.tipo !== 'CREDIT')) return;
      var dia = m.data.slice(0, 10); if (dia < desde || dia > hojeISO) return;
      var gasto = m.tipo === 'DEBIT'; if (inverter) gasto = !gasto;
      var p = m.parc, parc = isObjeto(p) && Number.isInteger(p.n) && Number.isInteger(p.de) && p.n >= 1 && p.de >= p.n && p.de <= 120;
      var pag = !!(ehPagamento && ehPagamento(m.cat)), entra, motivo;
      if (pag) { entra = false; motivo = 'pagamento de fatura: fica fora'; }
      else if (parc && fechaHoje && dia === hojeISO) { entra = false; motivo = 'parcela da próxima fatura'; }
      else if (dia === desde) { entra = parc; motivo = parc ? 'parcela lançada no fechamento: conta' : 'dia do fechamento: fica na fatura que fechou'; }
      else { entra = true; motivo = 'conta'; }
      var v = r2((gasto ? 1 : -1) * Math.abs(m.valor));
      if (entra) { total += v; conta++; }
      itens.push({ data: dia, desc: typeof m.desc === 'string' ? m.desc.slice(0, 80) : '', valor: v, n: parc ? p.n : null, de: parc ? p.de : null, pendente: m.status === 'PENDING', entra: entra, motivo: motivo });
    });
    itens.sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : 0; });
    return { desde: desde, itens: itens, total: r2(Math.max(total, 0)), conta: conta };
  }
  var isObjeto = function (x) { return !!x && typeof x === 'object' && !Array.isArray(x); };
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
      var o = oBanco(bc.atu), est = estimarFatura((B.movs || {})[bc.id], c.fecha, ctx.hojeISO, (B.pm || {})[bc.id]);
      c.banco = { id: bc.id, nome: bc.nome };
      c.origem = { limite: typeof bc.lim === 'number' ? o : null, usado: o, fatura: est ? { t: 'estimado', desde: est.desde, parcelas: est.parcelas, ms: o.ms, desat: o.desat } : null };
      if (typeof bc.lim === 'number') c.limite = bc.lim;
      c.disponivel = typeof bc.disp === 'number' ? bc.disp : null;
      c.usadoBanco = bc.saldo;   // limite usado = saldo do cartão no banco (limite menos disponível): fatura aberta mais parcelas que ainda vêm
      /* pluggy-8: com o banco, a fatura aberta é a estimada; a série passa a ser só o que vem depois dela, por mês, com as parcelas do banco.
         Antes a linha do arquivo do mês da fatura aberta aparecia de novo como "mês seguinte" (parcelas antigas contadas duas vezes). */
      var ab = c.serie && est ? mesAberta(c.fecha, c.vence, ctx.hojeISO) : null;
      var ps = est ? parcelasSeguintes((B.pn || {})[bc.id], c.fecha, ctx.hojeISO, real._meta.as_of) : null;
      /* pluggy-9: segunda conta da fatura aberta, para comparar com a do banco (A Confirmar): o limite usado (saldo do cartão no banco) menos
         as parcelas futuras que o banco mostra. Pega o que está na fatura e não chega como movimento; erra para mais se faltar parcela futura
         na conexão, e entre o fechamento e o pagamento inclui a fatura fechada ainda não paga. Só quando a foto traz parcelas com seguintes
         (foto de versão antiga chega sem pn e não dá para saber as parcelas futuras). */
      if (est && ps && ps.n > 0 && isObjeto(B.pn)) c.origem.fatura.peloLimite = r2(Math.max(bc.saldo - ps.todas.reduce(function (s, x) { return s + x; }, 0), 0));
      /* pluggy-10: conferido com o dono em 14/11/2026 (Nubank): essa conta deu a fatura do banco no centavo, e a soma dos itens ficou abaixo por três
         motivos que ela não tem (compra em moeda estrangeira chega no valor da moeda de origem; a conexão data os itens um dia antes; item que já
         está no saldo e ainda não está na lista). Então ela passa a ser a fatura estimada, quando dá para saber que a fatura que fechou já foi paga:
         a foto traz um pagamento de fatura (pg) depois do último fechamento. Antes do pagamento o saldo ainda inclui a fatura fechada: vale a soma dos itens. */
      var pagoEm = isObjeto(B.pg) && typeof B.pg[bc.id] === 'string' ? B.pg[bc.id] : null;
      var peloSaldo = est && ps && isObjeto(B.pn) && pagoEm && pagoEm > est.desde ? r2(Math.max(bc.saldo - ps.todas.reduce(function (s, x) { return s + x; }, 0), 0)) : null;
      if (peloSaldo !== null) { c.origem.fatura.t = 'limite'; c.origem.fatura.porItens = est.valor; c.origem.fatura.peloLimite = peloSaldo; c.origem.fatura.pagoEm = pagoEm; }
      if (B.em > 0 && ag > 0) c.origem.buscadoMs = Math.max(ag - B.em, 0);   // há quanto tempo o app buscou os valores (a idade ao lado é a dos dados no banco)
      if (ab) {
        var arqS = c.serie;
        c.mesAberta = ab; c.serie = juntarSerie(arqS, ps, ab);
        n2.futuras = arqS.filter(function (f) { return !(f.mes > ab); }).concat(c.serie);
      }
      if (est) { c.fatura = peloSaldo !== null ? peloSaldo : est.valor; c.parcelasFuturas = r2(Math.max(bc.saldo - c.fatura, 0)); }   // compromisso futuro estimado, mínimo 0
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

  var api = { estimarFatura: estimarFatura, parcelasSeguintes: parcelasSeguintes, juntarSerie: juntarSerie, itensFatura: itensFatura, mesAberta: mesAberta, mesMais: mesMais, fechamentoAnterior: fechamentoAnterior, LIMITE_DESATUALIZADO_H: LIMITE_DESATUALIZADO_H, projetar: projetar, derivar: derivar, rotulosMeses: rotulosMeses, quintoDiaUtil: quintoDiaUtil, feriados: feriados, mediaMercado: mediaMercado, salarioEstimado: salarioEstimado, fmt: fmt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Real = api;
})(typeof window !== 'undefined' ? window : this);
