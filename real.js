/* Dados reais -> números do app. Funções puras, testadas em node. Nenhum dado pessoal mora neste arquivo. */
(function (root) {
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var r2 = function (x) { return Math.round(x * 100) / 100; };
  var soma = function (o) { return Object.keys(o || {}).reduce(function (s, k) { return s + (+o[k] || 0); }, 0); };

  function rotulosMeses(asOf) {
    var p = asOf.split('-'), y = +p[0], m = +p[1] - 1, out = [];
    for (var i = 0; i < 12; i++) { var mm = (m + i) % 12, yy = y + Math.floor((m + i) / 12); out.push(MESES[mm] + '/' + String(yy).slice(2)); }
    return out;
  }

  /* Saldo previsto no fim de cada mês (12 meses a partir do mês de as_of).
     Mês 0: liquidez de hoje menos as pendências do mês e o teto de lazer.
     Meses seguintes: + salário estimado, - ajuda em casa, - fatura das parcelas antigas, - assinaturas, - faculdade, - teto de lazer.
     opt.repasseMae: soma a parte da mãe de cada fatura (só entra quando você escolher o cenário "recebido"). */
  function projetar(real, opt) {
    opt = opt || {};
    var fx = real.gastos_fixos_mensais, ass = soma(fx.assinaturas_no_cartao), lazer = fx.teto_lazer_mes;
    var salario = (real.entradas_esperadas.filter(function (e) { return /sal/i.test(e.descricao); })[0] || {}).valor_estimado || 0;
    var pend = real.pendencias_novembro.reduce(function (s, p) { return s + p.valor; }, 0);
    var fut = {}; real.faturas_futuras_parcelas_antigas.forEach(function (f) { fut[f.mes] = f; });
    var p = real._meta.as_of.split('-'), y = +p[0], m = +p[1] - 1;
    var saldo = r2(real.liquidez.total - pend - lazer), out = [saldo];
    for (var i = 1; i < 12; i++) {
      var mm = (m + i) % 12, yy = y + Math.floor((m + i) / 12);
      var chave = yy + '-' + String(mm + 1).padStart(2, '0');
      var f = fut[chave] || { fatura_total: 0, parte_mae: 0 };
      var fac = yy >= 2027 ? fx.faculdade_2027_estimado : fx.faculdade_2026;
      var entra = salario + (opt.repasseMae ? f.parte_mae : 0);
      var sai = fx.ajuda_em_casa_a_partir_de_dezembro + f.fatura_total + ass + fac + lazer;
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

  /* Objeto no formato que as telas esperam (DEMO) */
  function derivar(real) {
    var fx = real.gastos_fixos_mensais, c = real.cartao, rg = real.regras_e_metas;
    var salario = (real.entradas_esperadas.filter(function (e) { return /sal/i.test(e.descricao); })[0] || {}).valor_estimado || 0;
    var essencial = r2(fx.ajuda_em_casa_a_partir_de_dezembro + fx.faculdade_2026 + (fx.assinaturas_no_cartao.dados_moveis || 0));
    var futuras = real.faturas_futuras_parcelas_antigas;
    var diaPag = {};   // dia de pagamento planejado de cada pendência
    var ven = function (s) { return +s.slice(8); };
    var agenda = real.pendencias_novembro.map(function (p, i) {
      var d = ven(p.vence), nota = p.nota || '';
      if (/friday/i.test(nota)) { var m = nota.match(/\d{4}-\d{2}-(\d{2})/); if (m) d = +m[1]; }
      return { id: 'a' + (i + 1), nome: p.descricao + (d !== ven(p.vence) ? ' (vence dia ' + ven(p.vence) + ')' : ''), dia: d, valor: p.valor };
    });
    var base = projetar(real), com = projetar(real, { repasseMae: true });
    return {
      real: true, asOf: real._meta.as_of,
      caixinha: real.liquidez.total, conta: real.liquidez.conta_corrente, essencial: essencial, renda: salario,
      meta: rg.meta_17_01_2027, piso: rg.piso_17_01_2027, alerta: rg.alerta_dezembro, tetoLazer: fx.teto_lazer_mes,
      meses: rotulosMeses(real._meta.as_of),
      cenarios: { 'Base': base, 'Com repasse da mãe': com },
      cores: { 'Base': '#4CC9FF', 'Com repasse da mãe': '#3DDC97' },
      carteira: [{ nome: String(real.liquidez.onde || 'Liquidez').split('(')[0].trim() + ' (liquidez diária)', classe: 'Renda fixa', valor: real.liquidez.total, liquidez: 'diaria' }],
      cartoes: [{ id: 'c1', nome: c.emissor, final: '', limite: c.limite || 0, fatura: c.fatura_atual.total, parcelasFuturas: r2(futuras.reduce(function (s, f) { return s + f.fatura_total; }, 0)), fecha: c.fechamento_dia, vence: ven(c.fatura_atual.vence_em), serie: futuras }],
      parcelamentos: [],
      agenda: agenda,
      tetos: { Mercado: 0, Transporte: 0, Estudos: 0, 'Saúde': 0, Outros: 0 },
      pendentes: (real.pendente_do_usuario || []).map(function (t) { return (real._traducoes || {})[t] || t; }),
      plano: (real.plano_de_pagamento || []).map(function (a) { return { data: a.data, texto: planoTexto(a) }; }),
      sobra: real.sobra_apos_pagar_tudo,
      pisoDefinido: !/NOT yet defined/i.test(rg.piso_absoluto_status || ''),
      suposicoes: ['Salário cheio estimado em ' + fmt(salario) + ' a partir de dezembro (ainda sem holerite).', 'Entram só as parcelas antigas do cartão, as assinaturas (' + fmt(soma(fx.assinaturas_no_cartao)) + ' por mês), a ajuda em casa, a faculdade e o teto de lazer.', 'Transporte pelo vale-transporte da empresa: o desconto é feito na folha e não sai do caixa. Se o salário líquido estimado já vem depois do desconto, nada muda.', 'Mercado do dia a dia ainda não foi informado, então não está na projeção.', 'Repasse da mãe e venda da cama só contam quando recebidos.']
    };
  }

  var api = { projetar: projetar, derivar: derivar, rotulosMeses: rotulosMeses };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Real = api;
})(typeof window !== 'undefined' ? window : this);
