// Funções de cálculo puras (sem tela). Usadas pela maquete e testadas em test_calc.js.
(function (root) {
  'use strict';

  // Converte taxa: tipo 'm' (ao mês) ou 'a' (ao ano), em percentual, para taxa mensal decimal.
  function mensal(taxaPct, tipo) {
    var t = taxaPct / 100;
    return tipo === 'a' ? Math.pow(1 + t, 1 / 12) - 1 : t;
  }
  function anual(taxaMensal) { return Math.pow(1 + taxaMensal, 12) - 1; }

  // Taxa interna de retorno mensal de um fluxo [cf0, cf1, ...]. Bisseção.
  function irr(cfs) {
    function npv(r) { var s = 0; for (var t = 0; t < cfs.length; t++) s += cfs[t] / Math.pow(1 + r, t); return s; }
    var lo = -0.5, hi = 2, flo = npv(lo), fhi = npv(hi);
    if (isNaN(flo) || isNaN(fhi) || flo * fhi > 0) return null;
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2, fm = npv(mid);
      if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
    }
    return (lo + hi) / 2;
  }

  // Empréstimo. sistema: 'price' (parcela fixa) ou 'sac' (amortização constante).
  // tarifa: valor descontado na liberação (IOF, tarifas) para o custo efetivo (CET).
  function emprestimo(valor, i, n, sistema, tarifa) {
    tarifa = tarifa || 0;
    var parcelas = [], saldo = valor, totalJuros = 0, i0;
    if (sistema === 'sac') {
      var amort = valor / n;
      for (var k = 1; k <= n; k++) {
        var j = saldo * i; saldo -= amort;
        parcelas.push({ n: k, parcela: amort + j, juros: j, saldo: Math.max(saldo, 0) }); totalJuros += j;
      }
    } else {
      var pmt = i === 0 ? valor / n : valor * i / (1 - Math.pow(1 + i, -n));
      for (var m = 1; m <= n; m++) {
        var jj = saldo * i; saldo = saldo + jj - pmt;
        parcelas.push({ n: m, parcela: pmt, juros: jj, saldo: Math.max(saldo, 0) }); totalJuros += jj;
      }
    }
    var total = parcelas.reduce(function (s, p) { return s + p.parcela; }, 0);
    var cfs = [valor - tarifa]; parcelas.forEach(function (p) { cfs.push(-p.parcela); });
    var cet = irr(cfs);
    return { parcelas: parcelas, total: total, juros: total - valor, primeira: parcelas[0].parcela, ultima: parcelas[parcelas.length - 1].parcela, cetMensal: cet, cetAnual: cet === null ? null : anual(cet) };
  }

  // Consórcio: crédito C, n meses, taxa de administração total (%), fundo de reserva total (%),
  // seguro mensal (% do crédito), contemplação no mês k. Devolve o custo efetivo mensal (IRR).
  function consorcio(credito, n, admPct, fundoPct, seguroMensalPct, k) {
    var parcelaBase = credito * (1 + admPct / 100 + fundoPct / 100) / n;
    var seguro = credito * seguroMensalPct / 100;
    var parcela = parcelaBase + seguro;
    var cfs = [0];
    for (var t = 1; t <= n; t++) cfs.push(-parcela + (t === k ? credito : 0));
    var r = irr(cfs);
    var total = parcela * n;
    return { parcela: parcela, total: total, custo: total - credito, cetMensal: r, cetAnual: r === null ? null : anual(r) };
  }

  // Fatura no rotativo pagando um valor fixo por mês.
  function rotativo(saldo, taxaMensal, pagamento) {
    var bal = saldo, meses = 0, pago = 0;
    while (bal > 0.005 && meses < 600) {
      bal += bal * taxaMensal;
      var p = Math.min(pagamento, bal);
      bal -= p; pago += p; meses++;
      if (pagamento <= saldo * taxaMensal && meses > 5 && bal >= saldo) return { quita: false, meses: null, total: null, juros: null };
    }
    if (bal > 0.005) return { quita: false, meses: null, total: null, juros: null };
    return { quita: true, meses: meses, total: pago, juros: pago - saldo };
  }

  // Parcela de um financiamento de parcela fixa.
  function parcelaFixa(valor, i, n) { return i === 0 ? valor / n : valor * i / (1 - Math.pow(1 + i, -n)); }

  // IR regressivo da renda fixa pelo prazo em dias: até 180, 22,5%; 181 a 360, 20%; 361 a 720, 17,5%; acima de 720, 15%.
  // Faixas: A Confirmar com a Receita (fonte secundária). Sem isenções (LCI, LCA, poupança) nesta conta.
  function aliquotaIR(dias) { return dias <= 180 ? 0.225 : dias <= 360 ? 0.20 : dias <= 720 ? 0.175 : 0.15; }

  // Investimento: aporte inicial + mensal por n meses, taxa mensal (bruta), IR regressivo opcional, inflação anual.
  // O IR é cobrado de cada aporte sobre o próprio ganho, pela idade dele no fim do prazo, com meses de 30 dias:
  // o inicial fica os n meses; o aporte do fim do mês k fica n - k meses (o último fica 0 e não rende).
  // Como a idade é sempre múltipla de 30 dias, 181, 361 e 721 nunca ocorrem: as faixas trocam entre 6 e 7, 12 e 13, 24 e 25 meses.
  function investimento(inicial, mensal, taxaMensal, n, irRegressivo, inflacaoAnualPct) {
    var saldo = inicial, aportado = inicial, serie = [{ mes: 0, saldo: inicial, aportado: inicial }];
    for (var t = 1; t <= n; t++) {
      saldo = saldo * (1 + taxaMensal) + mensal; aportado += mensal;
      serie.push({ mes: t, saldo: saldo, aportado: aportado });
    }
    var ganho = saldo - aportado;
    var depositos = [], imposto = 0;
    var aporte = function (valor, meses) {
      var g = valor * (Math.pow(1 + taxaMensal, meses) - 1), a = irRegressivo ? aliquotaIR(meses * 30) : 0, ir = Math.max(g, 0) * a;
      depositos.push({ valor: valor, meses: meses, dias: meses * 30, ganho: g, aliquota: a, imposto: ir }); imposto += ir;
    };
    aporte(inicial, n);
    for (var k = 1; k <= n; k++) aporte(mensal, n - k);
    // alíquota média: o imposto dividido pelo ganho total (0 sem IR ou sem ganho)
    var aliq = irRegressivo && ganho > 0 ? imposto / ganho : 0;
    var liquido = saldo - imposto;
    var infl = (inflacaoAnualPct || 0) / 100;
    var real = liquido / Math.pow(1 + infl, n / 12);
    return { serie: serie, bruto: saldo, aportado: aportado, ganho: ganho, aliquota: aliq, imposto: imposto, liquido: liquido, real: real, ganhoReal: real - aportado, depositos: depositos };
  }

  // Meses para atingir uma meta com aportes mensais.
  function mesesParaMeta(meta, inicial, mensal, taxaMensal) {
    var s = inicial, t = 0;
    while (s < meta && t < 1200) { s = s * (1 + taxaMensal) + mensal; t++; if (mensal <= 0 && taxaMensal <= 0) return null; }
    return s >= meta ? t : null;
  }

  // Nota de saúde financeira, 0 a 100, com fatores explicáveis.
  // d: { cobertura (meses), folgaMeta (R$), meta (R$), dividaCartao (R$), renda (R$), lazerGasto, lazerTeto, mesesComRegistro (0..3) }
  function saude(d) {
    var f = [];
    function add(nome, peso, ponto, explicacao) { f.push({ nome: nome, peso: peso, ponto: Math.max(0, Math.min(1, ponto)), explicacao: explicacao }); }
    add('Reserva de emergência', 30, d.cobertura / 6, 'A reserva cobre ' + d.cobertura.toFixed(1).replace('.', ',') + ' meses do essencial (ideal: 6).');
    add('Meta de janeiro', 25, d.meta > 0 ? 0.5 + d.folgaMeta / d.meta : 0, d.folgaMeta >= 0 ? 'Você termina acima da meta.' : 'Você termina abaixo da meta.');
    add('Dívida do cartão', 20, 1 - d.dividaCartao / Math.max(d.renda * 1.5, 1), 'A dívida do cartão equivale a ' + (d.dividaCartao / Math.max(d.renda, 1)).toFixed(1).replace('.', ',') + ' mês de renda.');
    add('Lazer dentro do teto', 15, d.lazerTeto > 0 ? 1 - Math.max(d.lazerGasto - d.lazerTeto, 0) / d.lazerTeto : 1, d.lazerGasto <= d.lazerTeto ? 'Lazer dentro do teto do mês.' : 'Lazer passou do teto do mês.');
    add('Hábito de registrar', 10, d.mesesComRegistro / 3, 'Você registrou gastos em ' + d.mesesComRegistro + ' dos últimos 3 meses.');
    var nota = 0; f.forEach(function (x) { nota += x.peso * x.ponto; });
    f.forEach(function (x) { x.status = x.ponto >= 0.75 ? 'ok' : x.ponto >= 0.4 ? 'atencao' : 'ruim'; });
    return { nota: Math.round(nota), fatores: f };
  }

  // Saúde da carteira: concentração, liquidez e diversificação. itens: [{nome, classe, valor, liquidez: 'diaria'|'media'|'baixa'}]
  function carteira(itens, essencialMensal) {
    var total = itens.reduce(function (s, x) { return s + x.valor; }, 0);
    var porClasse = {}; itens.forEach(function (x) { porClasse[x.classe] = (porClasse[x.classe] || 0) + x.valor; });
    var maior = 0, maiorNome = ''; Object.keys(porClasse).forEach(function (c) { if (porClasse[c] > maior) { maior = porClasse[c]; maiorNome = c; } });
    var liquido = itens.filter(function (x) { return x.liquidez === 'diaria'; }).reduce(function (s, x) { return s + x.valor; }, 0);
    var mesesLiquidos = essencialMensal > 0 ? liquido / essencialMensal : 0;
    return { total: total, porClasse: porClasse, concentracao: total > 0 ? maior / total : 0, maiorClasse: maiorNome, liquido: liquido, mesesLiquidos: mesesLiquidos, classes: Object.keys(porClasse).length };
  }

  // Cartão de crédito: limite total, usado (fatura atual + parcelas futuras), dia de fechamento e de hoje.
  // Utilização até 30% é considerada saudável; de 30% a 60% pede atenção; acima disso, risco.
  function cartao(limite, usado, fechamentoDia, diaHoje) {
    var util = limite > 0 ? usado / limite : 0;
    var proxFecha = diaHoje <= fechamentoDia ? fechamentoDia - diaHoje : null;
    return {
      disponivel: Math.max(limite - usado, 0), utilizacao: util,
      status: util <= 0.3 ? 'ok' : util <= 0.6 ? 'atencao' : 'ruim',
      limiteSaudavel: limite * 0.3,
      melhorDiaCompra: (fechamentoDia % 31) + 1,
      diasParaFechar: proxFecha
    };
  }

  // Quanto guardar por mês para chegar na meta em n meses, com rendimento mensal i sobre o que já tem.
  function metaAporte(meta, inicial, i, n) {
    if (n <= 0) return Math.max(meta - inicial, 0);
    if (i === 0) return Math.max((meta - inicial) / n, 0);
    var f = Math.pow(1 + i, n);
    return Math.max((meta - inicial * f) * i / (f - 1), 0);
  }

  // Dias entre hoje (dia do mês) e o vencimento no mês corrente (negativo = já passou).
  function diasAte(diaVenc, diaHoje) { return diaVenc - diaHoje; }

  var api = { cartao: cartao, metaAporte: metaAporte, diasAte: diasAte, mensal: mensal, anual: anual, irr: irr, emprestimo: emprestimo, consorcio: consorcio, rotativo: rotativo, parcelaFixa: parcelaFixa, investimento: investimento, aliquotaIR: aliquotaIR, mesesParaMeta: mesesParaMeta, saude: saude, carteira: carteira };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Calc = api;
})(typeof window !== 'undefined' ? window : this);
