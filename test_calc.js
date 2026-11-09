// Testes das funções de cálculo contra valores de referência feitos à mão ou por fórmula fechada.
const C = require('./calc.js');
let falhas = 0;
function perto(nome, obtido, esperado, tol) {
  const ok = Math.abs(obtido - esperado) <= tol;
  if (!ok) falhas++;
  console.log((ok ? 'OK    ' : 'FALHA ') + nome + ': obtido ' + obtido + ', esperado ' + esperado);
}
// Taxa: 1% ao mês = 12,6825% ao ano; e de volta.
perto('1% a.m. em a.a.', C.anual(0.01) * 100, 12.682503, 1e-5);
perto('12,6825% a.a. em a.m.', C.mensal(12.682503, 'a') * 100, 1, 1e-5);
// Price: 10.000 a 2% a.m. em 12x => parcela 945,5960 (fórmula fechada)
const p = C.emprestimo(10000, 0.02, 12, 'price', 0);
perto('Price parcela', p.primeira, 945.5960, 1e-3);
perto('Price total', p.total, 945.5960 * 12, 1e-2);
perto('Price CET sem tarifa = taxa', p.cetMensal, 0.02, 1e-6);
perto('Price saldo final', p.parcelas[11].saldo, 0, 1e-6);
// SAC: primeira = 10000/12 + 200 ; última = 10000/12 * 1,02
const s = C.emprestimo(10000, 0.02, 12, 'sac', 0);
perto('SAC primeira', s.primeira, 10000 / 12 + 200, 1e-6);
perto('SAC última', s.ultima, (10000 / 12) * 1.02, 1e-6);
// Tarifa sobe o custo efetivo
const t = C.emprestimo(10000, 0.02, 12, 'price', 300);
console.log((t.cetMensal > 0.02 ? 'OK    ' : 'FALHA ') + 'CET com tarifa maior que a taxa: ' + t.cetMensal); if (!(t.cetMensal > 0.02)) falhas++;
// Consórcio sem taxas contemplado no mês 1 => custo 0
const c0 = C.consorcio(60000, 60, 0, 0, 0, 1);
perto('Consórcio sem taxas, k=1, custo efetivo', c0.cetMensal, 0, 1e-6);
const c1 = C.consorcio(60000, 60, 15, 2, 0, 1);
perto('Consórcio parcela', c1.parcela, 60000 * 1.17 / 60, 1e-6);
// Contemplação tardia: a taxa efetiva pode não existir (você paga muito antes de receber). O custo em reais continua válido.
const c2 = C.consorcio(60000, 60, 15, 2, 0, 30);
const okc2 = c2.cetMensal === null || c2.cetMensal > c1.cetMensal;
console.log((okc2 ? 'OK    ' : 'FALHA ') + 'contemplação tardia: taxa ' + c2.cetMensal + ' (null é aceito) ; custo em R$ ' + c2.custo); if (!okc2) falhas++;
perto('Consórcio custo em R$', c2.custo, 60000 * 0.17, 1e-6);
// Rotativo: 1000 a 10% a.m. pagando 200 => 8 meses
const r = C.rotativo(1000, 0.10, 200);
perto('Rotativo meses', r.meses, 8, 0);
const rn = C.rotativo(1000, 0.10, 90);
console.log((rn.quita === false ? 'OK    ' : 'FALHA ') + 'Rotativo pagando menos que os juros não quita'); if (rn.quita) falhas++;
// Investimento: 100/mês a 1% por 12 meses = 1268,25. IR por aporte, pela idade no fim (meses de 30 dias):
// os aportes que ficam 7 a 11 meses (210 a 330 dias) pagam 20%; os que ficam 0 a 6 meses (até 180 dias) pagam 22,5%
const inv = C.investimento(0, 100, 0.01, 12, true, 0);
perto('Investimento bruto', inv.bruto, 1268.2503, 1e-3);
perto('Investimento aportado', inv.aportado, 1200, 1e-9);
const somaG = (v, i, ms) => ms.reduce((a, m) => a + v * (Math.pow(1 + i, m) - 1), 0);
perto('Investimento IR', inv.imposto, 0.20 * somaG(100, 0.01, [7, 8, 9, 10, 11]) + 0.225 * somaG(100, 0.01, [0, 1, 2, 3, 4, 5, 6]), 1e-9);
const inv2 = C.investimento(1000, 0, 0.01, 24, false, 5);
perto('Investimento real descontando inflação', inv2.real, 1000 * Math.pow(1.01, 24) / Math.pow(1.05, 2), 1e-6);
// IR por aporte (tabela regressiva; faixas A Confirmar com a Receita). Conta de referência com dados inventados.
const ok = (nome, c, extra) => { if (!c) falhas++; console.log((c ? 'OK    ' : 'FALHA ') + nome + (c || extra == null ? '' : ': ' + extra)); };
const ref = C.investimento(1000, 200, 0.0085, 36, true, 0);
ok('IR referência: bruto continua 9.738', Math.round(ref.bruto) === 9738, ref.bruto);
ok('IR referência: ganho 1.538', Math.round(ref.ganho) === 1538, ref.ganho);
ok('IR referência: imposto 249 (era 231 com 15% sobre tudo)', Math.round(ref.imposto) === 249, ref.imposto);
ok('IR referência: média 16,2%', (ref.aliquota * 100).toFixed(1) === '16.2', ref.aliquota);
ok('IR referência: líquido 9.489 (era 9.507)', Math.round(ref.liquido) === 9489, ref.liquido);
perto('IR referência: imposto pela soma direta dos 37 aportes', ref.imposto, 0.15 * somaG(1000, 0.0085, [36]) + 0.15 * somaG(200, 0.0085, [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]) + 0.175 * somaG(200, 0.0085, [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]) + 0.20 * somaG(200, 0.0085, [7, 8, 9, 10, 11, 12]) + 0.225 * somaG(200, 0.0085, [0, 1, 2, 3, 4, 5, 6]), 1e-9);
ok('IR referência: 37 aportes, o inicial fica 36 meses e o último 0', ref.depositos.length === 37 && ref.depositos[0].meses === 36 && ref.depositos[0].valor === 1000 && ref.depositos[36].meses === 0 && ref.depositos[36].ganho === 0);
const semIR = C.investimento(1000, 200, 0.0085, 36, false, 4.5), comIR = C.investimento(1000, 200, 0.0085, 36, true, 4.5);
ok('IR desligado: imposto 0, alíquota 0, líquido = bruto', semIR.imposto === 0 && semIR.aliquota === 0 && semIR.liquido === semIR.bruto);
ok('IR desligado e ligado: bruto, aportado e ganho iguais', semIR.bruto === comIR.bruto && semIR.aportado === comIR.aportado && semIR.ganho === comIR.ganho);
perto('Inflação: mesma conta sobre o líquido', comIR.real, comIR.liquido / Math.pow(1.045, 3), 1e-9);
const zero = C.investimento(1000, 200, 0, 36, true, 0);
ok('Taxa zero: sem ganho, sem imposto, líquido = aportado', zero.ganho === 0 && zero.imposto === 0 && zero.aliquota === 0 && zero.liquido === 8200);
// fronteiras das faixas, só com o valor inicial: 1 e 6 meses (30 e 180 dias) 22,5%; 7 e 12 (210 e 360) 20%; 24 (720) 17,5%; 25 (750) 15%
[[1, 0.225], [6, 0.225], [7, 0.20], [12, 0.20], [24, 0.175], [25, 0.15]].forEach(([n, a]) => {
  const r = C.investimento(1000, 0, 0.01, n, true, 0);
  perto('Só o inicial, ' + n + ' meses (' + n * 30 + ' dias): imposto a ' + a * 100 + '%', r.imposto, a * 1000 * (Math.pow(1.01, n) - 1), 1e-9);
  ok('Só o inicial, ' + n + ' meses: média igual à faixa', Math.abs(r.aliquota - a) < 1e-12, r.aliquota);
});
// fronteiras nos aportes mensais: em 25 meses, o aporte do mês 1 fica 24 meses (17,5%) e o do mês 19 fica 6 (22,5%); o do mês 18 fica 7 (20%)
const b25 = C.investimento(0, 100, 0.01, 25, true, 0).depositos;
ok('Aportes em 25 meses: mês 1 fica 24 meses, 17,5%', b25[1].meses === 24 && b25[1].aliquota === 0.175);
ok('Aportes em 25 meses: mês 13 fica 12 meses, 20%', b25[13].meses === 12 && b25[13].aliquota === 0.20);
ok('Aportes em 25 meses: mês 18 fica 7 meses, 20%', b25[18].meses === 7 && b25[18].aliquota === 0.20);
ok('Aportes em 25 meses: mês 19 fica 6 meses, 22,5%', b25[19].meses === 6 && b25[19].aliquota === 0.225);
const so = C.investimento(0, 200, 0.0085, 36, true, 0);
perto('Só aportes mensais: imposto pela soma direta', so.imposto, 0.15 * somaG(200, 0.0085, [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]) + 0.175 * somaG(200, 0.0085, [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]) + 0.20 * somaG(200, 0.0085, [7, 8, 9, 10, 11, 12]) + 0.225 * somaG(200, 0.0085, [0, 1, 2, 3, 4, 5, 6]), 1e-9);
const lump = C.investimento(1000, 0, 0.0085, 36, true, 0);
ok('Só o inicial em 36 meses: 15% exatos', Math.abs(lump.aliquota - 0.15) < 1e-12 && Math.abs(lump.imposto - 0.15 * lump.ganho) < 1e-9);
// em vários casos: a soma dos ganhos por aporte é o ganho total, e a média fica entre 15% e 22,5%
let somaOk = true, faixaOk = true, pior = '';
[0, 1000, 25000].forEach(ini => [0, 50, 200].forEach(m => [0.001, 0.0085, 0.02].forEach(i => [1, 2, 6, 7, 12, 13, 24, 25, 36, 120].forEach(n => {
  if (!ini && !m) return;
  const r = C.investimento(ini, m, i, n, true, 0), sg = r.depositos.reduce((a, d) => a + d.ganho, 0), si = r.depositos.reduce((a, d) => a + d.imposto, 0);
  if (Math.abs(sg - r.ganho) > 1e-6 * Math.max(1, r.ganho) || Math.abs(si - r.imposto) > 1e-9) { somaOk = false; pior = [ini, m, i, n].join('/'); }
  if (r.ganho > 0 && (r.imposto < 0.15 * r.ganho - 1e-9 || r.imposto > 0.225 * r.ganho + 1e-9 || r.aliquota < 0.15 - 1e-12 || r.aliquota > 0.225 + 1e-12)) { faixaOk = false; pior = [ini, m, i, n].join('/'); }
}))));
ok('Soma dos ganhos por aporte = ganho total (240 casos)', somaOk, pior);
ok('Imposto nunca abaixo de 15% nem acima de 22,5% do ganho (240 casos)', faixaOk, pior);
const neg = C.investimento(1000, 100, -0.01, 12, true, 0);
ok('Taxa negativa: sem imposto', neg.imposto === 0 && neg.aliquota === 0 && neg.liquido === neg.bruto);
// Meses para a meta: 1000 + 100/mês a 0% até 2000 => 10
perto('Meses para meta', C.mesesParaMeta(2000, 1000, 100, 0), 10, 0);
// Saúde
const sa = C.saude({ cobertura: 6, folgaMeta: 0, meta: 1000, dividaCartao: 0, renda: 3000, lazerGasto: 0, lazerTeto: 100, mesesComRegistro: 3 });
console.log('Saúde situação boa: ' + sa.nota + ' (esperado 87,5 -> 88: meta em 0 de folga vale 50%)');
perto('Saúde nota', sa.nota, 88, 0);
// Carteira
const ca = C.carteira([{ nome: 'A', classe: 'Renda fixa', valor: 600, liquidez: 'diaria' }, { nome: 'B', classe: 'Ações', valor: 400, liquidez: 'media' }], 200);
perto('Carteira concentração', ca.concentracao, 0.6, 1e-9);
perto('Carteira meses líquidos', ca.mesesLiquidos, 3, 1e-9);
// Cartão e metas
const ct = C.cartao(6000, 3100, 3, 10);
perto('Cartão utilização', ct.utilizacao, 3100 / 6000, 1e-9);
perto('Cartão disponível', ct.disponivel, 2900, 1e-9);
console.log((ct.status === 'atencao' ? 'OK    ' : 'FALHA ') + 'Cartão 52% = atenção'); if (ct.status !== 'atencao') falhas++;
perto('Melhor dia de compra (fecha dia 3)', ct.melhorDiaCompra, 4, 0);
perto('Melhor dia de compra (fecha dia 31)', C.cartao(1000, 0, 31, 1).melhorDiaCompra, 1, 0);
perto('Limite saudável 30%', ct.limiteSaudavel, 1800, 1e-9);
perto('Meta sem juros', C.metaAporte(1200, 0, 0, 12), 100, 1e-9);
perto('Meta com 1% a.m.', C.metaAporte(1200, 0, 0.01, 12), 1200 * 0.01 / (Math.pow(1.01, 12) - 1), 1e-9);
perto('Meta já atingida', C.metaAporte(1000, 1500, 0.01, 12), 0, 0);
// Conferência cruzada: guardar o aporte calculado de fato chega na meta
const ap = C.metaAporte(5000, 800, 0.008, 18);
perto('Meta: simular o aporte chega em 5000', C.investimento(800, ap, 0.008, 18, false, 0).bruto, 5000, 1e-6);
console.log(falhas === 0 ? '\nTodos os testes passaram.' : '\nFalhas: ' + falhas);
process.exit(falhas === 0 ? 0 : 1);
