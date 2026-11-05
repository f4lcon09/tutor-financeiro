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
// Investimento: 100/mês a 1% por 12 meses = 1268,25; IR 22,5% sobre o ganho de 68,25 em 360 dias => 20%
const inv = C.investimento(0, 100, 0.01, 12, true, 0);
perto('Investimento bruto', inv.bruto, 1268.2503, 1e-3);
perto('Investimento aportado', inv.aportado, 1200, 1e-9);
perto('Investimento IR', inv.imposto, (1268.2503 - 1200) * 0.20, 1e-3);
const inv2 = C.investimento(1000, 0, 0.01, 24, false, 5);
perto('Investimento real descontando inflação', inv2.real, 1000 * Math.pow(1.01, 24) / Math.pow(1.05, 2), 1e-6);
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
