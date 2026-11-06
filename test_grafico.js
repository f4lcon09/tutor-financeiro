/* Gráfico de previsão: escala, estados e colisão de etiquetas. Só valores inventados. Rodar: node test_grafico.js */
const G = require('./grafico.js');
let ok = 0, f = 0; const t = (n, c) => { if (c) ok++; else { f++; console.log('FALHOU: ' + n); } };
const fmt = { valor: v => '~R$ ' + Math.round(v).toLocaleString('pt-BR'), fixo: v => 'R$ ' + Math.round(v).toLocaleString('pt-BR'), curto: v => Math.round(v).toLocaleString('pt-BR') };
const M4 = ['nov/26', 'dez/26', 'jan/27', 'fev/27'];
const R = { meta: 3000, piso: 2000, alerta: 1500 };
const FIX = {
  'subindo': { base: [557, 1768, 2989, 4259] },
  'cenário negativo': { base: [557, 1768, 2989, 4259], cenario: [-300, -2100, -3600, -1200] },
  'como o mockup': { base: [400, 1300, 2700, 3500], cenario: [400, -1200, 200, 1000], R: { meta: 3000, piso: 2500, alerta: 1500 } },
  'mínimo no primeiro mês, faixa larga': { base: [-6000, 2000, 9000, 16000], cenario: [-8000, 0, 7000, 14000], R: { meta: 15000, piso: 8000, alerta: 3000 } },
  'mínimo no último mês': { base: [4000, 3900, 3800, 3700], cenario: [4000, 3900, 3800, -2500] },
  'mínimo no meio': { base: [2200, 2300, 2400, 2500], cenario: [2200, 400, 300, 2600] },
  'negativo desde o início': { base: [-800, -500, -200, 100], cenario: [-2400, -2600, -2800, -3000] },
  'tudo acima da meta': { base: [5200, 5400, 5600, 5800] },
  'tudo acima, com cenário': { base: [5200, 5400, 5600, 5800], cenario: [4800, 4600, 4400, 4200] },
  'cenário acima da base': { base: [100, 200, 300, 400], cenario: [1800, 2400, 2900, 3500] },
  'linhas cruzadas': { base: [3200, 1200, 2800, 900], cenario: [800, 2900, 700, 3100] },
  'faixa estreita': { base: [3100, 3120, 3140, 3160], cenario: [3050, 3070, 3090, 3110], R: { meta: 3000, piso: 2900, alerta: 2800 } },
  'plano no zero': { base: [0, 0, 0, 0] },
  'plano na meta': { base: [3000, 3000, 3000, 3000] },
  'plano no alerta': { base: [1500, 1500, 1500, 1500], cenario: [1400, 1450, 1500, 1550] },
  'valores grandes': { base: [120000, 125000, 131000, 140000], cenario: [80000, 60000, 41000, 22000], R: { meta: 100000, piso: 60000, alerta: 40000 } },
  'queda forte no fim': { base: [4000, 3900, 3800, 3700], cenario: [4000, 3900, 3800, -2500] },
  'sem meta': { base: [1000, 1200, 1400, 1600], R: { meta: 0, piso: 0, alerta: 0 } }
};
const monta = (nome, W, meses) => { const x = FIX[nome], n = (meses || M4).length, r = x.R || R; return G.montar({ meses: (meses || M4), base: x.base.slice(0, n), cenario: x.cenario ? x.cenario.slice(0, n) : null, ...r, W, H: 264, fmt }); };

/* escala */
{
  const e = G.escala([557, -3243, 4200], 4550, 1550);
  t('eixo: exemplo do dono, não simétrico', e.lo === -4000 && e.hi >= 5000 && e.hi <= 6000 && e.ticks.length <= 5, );
  t('eixo: inclui negativo e meta', e.lo <= -3243 && e.hi >= 4550);
  t('eixo: 5% de folga nas pontas', e.lo <= -3243 - 7793 * .05 && e.hi >= 4550 + 7793 * .05);
  t('eixo: marcas redondas', e.ticks.every(v => v % e.passo === 0) && [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000].includes(e.passo));
  t('eixo: zero está nas marcas', e.ticks.includes(0));
  for (const c of [[[557, -3243], 3000, 1500], [[10, 20], 30, 5], [[-90000, 140000], 100000, 40000], [[3100, 3160], 3000, 2800], [[-8000, 14000], 15000, 3000]]) { const x = G.escala(...c); t('eixo: no máximo 5 rótulos em ' + c[0], x.ticks.length <= 5 && x.ticks.length >= 2 && x.ticks.includes(0)); }
  t('eixo: inclui o alerta quando os dados ficam acima', G.escala([5000, 6000], 3000, 1500).lo <= 1500);
  t('eixo: sempre vai até zero', G.escala([5000, 6000], 3000, 1500).lo <= 0);
  t('eixo: sem negativo, não inventa faixa abaixo de zero', G.escala([5000, 6000], 3000, 1500).lo === 0);
  t('eixo: rótulos com sinal de menos de verdade', G.fmtEixo(2000) === '2 mil' && G.fmtEixo(-2000) === '\u22122 mil' && G.fmtEixo(0) === '0' && G.fmtEixo(2500) === '2,5 mil' && G.fmtEixo(-500) === '\u2212500');
  t('eixo: valor único não divide por zero', G.escala([0, 0], 0, 0).hi > G.escala([0, 0], 0, 0).lo);
}

/* estados */
{
  const b = v => 'R$ ' + v, e = v => G.estado(v, 3000, 2000, 1500, b);
  t('estado: abaixo do alerta traz o valor', e(1000).cls === 'ru' && e(1000).texto === 'Abaixo do alerta (R$ 1500)');
  t('estado: abaixo do piso', e(1800).cls === 'ru' && e(1800).texto === 'Abaixo do piso');
  t('estado: entre piso e meta', e(2500).cls === 'at' && e(2500).texto === 'Entre piso e meta');
  t('estado: acima da meta', e(3000).cls === 'ok' && e(3000).texto === 'Acima da meta');
  t('estado: sem meta não inventa', G.estado(10, 0, 0, 0, b) === null);
}

/* janela */
t('janela: quatro meses', G.janela(['a', 'b', 'c', 'd', 'e', 'f'], 1).n === 4 && G.janela(['a', 'b', 'c', 'd', 'e', 'f'], 1).ini === 1);
t('janela: não passa do fim', G.janela(['a', 'b', 'c', 'd', 'e', 'f'], 5).ini === 2);
t('janela: menos de quatro meses', G.janela(['a', 'b'], 0).n === 2);
t('janela: pode pedir outra quantidade', G.janela(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 0, 7).n === 7);

/* colisão, nas larguras reais de 360 e 390 px */
const OMITE = { 'faixa estreita': ['meta', 'piso'], 'linhas cruzadas': ['alerta'] };   // divisórias a 6 px, ou linhas de dados por toda a faixa: não há onde pôr texto sem cruzar linha
for (const [W, rot] of [[300, 360], [330, 390], [640, 'pc']]) {
  for (const nome of Object.keys(FIX)) {
    const m = monta(nome, W), cs = m.caixas, tag = nome + ' em ' + rot, P = m.P;
    let bate = 0, linha = 0, borda = 0, eixo = 0, zero = 0, rotLinha = 0;
    const z = m.horizontais.find(l => l.tipo === 'zero');
    cs.forEach((a, i) => {
      cs.slice(i + 1).forEach(b => { if (G.sobre(a, b)) bate++; });
      if (m.segs.some(s => G.cruza(s, a))) linha++;
      if (a.x < P.l + 1 || a.y < P.t + 1 || a.x + a.w > P.r - 1 || a.y + a.h > P.b - 1) borda++;
      if (m.eixo.some(e => G.sobre(a, e))) eixo++;
      if (G.cruza(z, a)) zero++;
      if (a.tipo === 'rotulo' && m.horizontais.some(l => G.cruza(l, a))) rotLinha++;
    });
    t(tag + ': caixas não se tocam', bate === 0);
    t(tag + ': caixas não cruzam as linhas de dados', linha === 0);
    t(tag + ': caixas dentro da área, sem encostar na borda', borda === 0);
    t(tag + ': caixas longe dos rótulos do eixo', eixo === 0);
    t(tag + ': nada em cima da linha do zero', zero === 0);
    t(tag + ': texto de rótulo não atravessa divisória', rotLinha === 0);
    t(tag + ': etiqueta do fim existe', !!m.fim);
    t(tag + ': ícone e etiqueta do mínimo existem', !!m.baixo && m.baixo.pill.w > 0);
    t(tag + ': rótulos do eixo longe dos meses', m.eixo.every(a => m.mesesCx.every(b => !G.sobre(a, b, 2))));
    t(tag + ': rótulos do eixo não se tocam', m.eixo.every((a, i) => m.eixo.slice(i + 1).every(b => !G.sobre(a, b))));
    t(tag + ': só some o rótulo que não cabe entre as linhas', m.omitidos.every(o => (OMITE[nome] || []).includes(o)));
    t(tag + ': no máximo 5 rótulos no eixo', m.E.ticks.length <= 5);
    t(tag + ': os valores levam ~', /^~/.test(m.fim.texto) && /^~/.test(m.baixo.texto));
    const svg = G.svgDe(m, { id: 'x' });
    t(tag + ': sem cor literal', !/#[0-9a-fA-F]{3,8}\b(?!g|c)/.test(svg.replace(/url\(#xg\)/g, '')) && !/rgba?\(|hsl\(/.test(svg));
    t(tag + ': sem NaN', !/NaN|undefined/.test(svg));
    t(tag + ': texto de pelo menos 12 px', [...svg.matchAll(/font-size="([\d.]+)"/g)].every(x => +x[1] >= 12));
    t(tag + ': no máximo três tamanhos', new Set([...svg.matchAll(/font-size="([\d.]+)"/g)].map(x => x[1])).size <= 3);
  }
}
for (const W of [300, 330]) {
  const m = monta('como o mockup', W), r = n => m.refs.find(x => x.tipo === n);
  t('rótulo logo acima da própria divisória, à esquerda em ' + W, ['meta', 'piso', 'alerta'].every(n => r(n).caixa.y + r(n).caixa.h <= r(n).y && r(n).y - r(n).caixa.y <= 16 && r(n).caixa.x === m.P.l + 4));
  t('altura da área entre 210 e 240 em ' + W, m.P.b - m.P.t >= 210 && m.P.b - m.P.t <= 240);
  t('etiqueta do fim acima do ponto em ' + W, m.fim.y + m.fim.h <= m.pa[3].y);
  t('ícone do mínimo abaixo do ponto em ' + W, m.baixo.ic.y >= m.pa[m.li].y);
  const p = monta('mínimo no primeiro mês, faixa larga', W);
  t('mínimo no primeiro mês: ícone longe do eixo em ' + W, p.baixo.ic.x >= p.P.l + 2 && p.baixo.pill.x > p.baixo.ic.x);
  const u = monta('mínimo no último mês', W);
  t('mínimo no último mês: etiqueta do lado com espaço em ' + W, u.baixo.ic.x + u.baixo.ic.w <= u.P.r - 2 && u.baixo.pill.x < u.baixo.ic.x);
}
{
  const c = G.montar({ meses: M4, base: [900, 1000, 1100, 1200], cenario: null, meta: 1250, piso: 1200, alerta: 1150, W: 300, H: 264, fmt });
  t('divisórias coladas: nenhum texto atravessa linha, mesmo sem caber', c.caixas.filter(x => x.tipo === 'rotulo').every(a => !c.horizontais.some(l => G.cruza(l, a))));
  t('divisórias coladas: o que não cabe fica registrado', c.refs.filter(r => !r.caixa).length === c.omitidos.length);
  const s = G.montar({ meses: M4, base: [2600, 2700, 2800, 2900], cenario: null, meta: 3000, piso: 1600, alerta: 300, W: 300, H: 264, fmt });
  t('alerta perto do zero nunca fica sobre o zero', !s.horizontais.some(l => l.tipo === 'zero' && G.cruza(l, s.refs.find(r => r.tipo === 'alerta').caixa)));
}

/* forma e estrutura */
{
  const s = G.svgDe(monta('cenário negativo', 328), { id: 'x' });
  t('negativo: rótulo do eixo com menos de verdade', /\u2212\d/.test(s) && !/>-\d/.test(s));
  t('negativo: só o zero é linha entre as marcas', (s.match(/class="zero"/g) || []).length === 1 && !/stroke="var\(--ln\)"/.test(s));
  t('referências: formas diferentes', /<circle[^>]*var\(--ok\)/.test(s) && /<path[^>]*var\(--at\)/.test(s) && /<rect[^>]*var\(--ru\)/.test(s));
  t('referências: piso pontilhado', /pv-ref-piso[^>]*dasharray/.test(s) && !/pv-ref-alerta[^>]*dasharray/.test(s));
  t('linha do zero e guia em cor suave, 1 px', /class="zero"[^>]*stroke="var\(--mu\)" stroke-width="1"/.test(s));
  t('zonas: três tintas por token', /--zone-ok/.test(s) && /--zone-attention/.test(s) && /--zone-risk/.test(s));
  t('base: marcadores vazados nos meses', (s.match(/pv-mb/g) || []).length === 4);
  t('linhas: base 2 e cenário 3', /pv-base[^>]*stroke-width="2"/.test(s) && /pv-cen[^>]*stroke-width="3"/.test(s));
  t('cenário: preenchimento recortado', /pv-area[^>]*clip-path/.test(s));
  t('sem suavização', !/ [CQS]\d/.test(s));
  t('meses no formato pedido', /nov\/26/.test(s));
  t('com o olho fechado o eixo some', !/\u2212\d mil/.test(G.svgDe(monta('cenário negativo', 328), { id: 'x', priv: true })));
  const u = G.svgDe(monta('subindo', 328), { id: 'x' });
  t('ícones do selo desenhados', ['ok', 'ru'].every(c => /<circle/.test(G.iconeChip(c))) && /<path/.test(G.iconeChip('at')) && !/[✔✖⚠]/.test(G.iconeChip('ok') + G.iconeChip('at') + G.iconeChip('ru')));
  t('sem cenário: uma linha só', !/pv-cen/.test(u) && !/pv-area/.test(u));
  const a = G.svgDe(monta('tudo acima da meta', 328), { id: 'x' });
  t('tudo acima da meta: sem ícone de risco', /pv-est-ok/.test(a) && !/pv-est-ru/.test(a));
  t('negativo desde o início: ícone de risco', /pv-est-ru/.test(G.svgDe(monta('negativo desde o início', 328), { id: 'x' })));
  const sel = G.svgDe(monta('cenário negativo', 328), { id: 'x', sel: 1 });
  t('seleção: guia suave, halo e mês em negrito', /pv-guia[^>]*stroke="var\(--mu\)" stroke-width="1"/.test(sel) && /pv-halo/.test(sel) && /font-weight="700"[^>]*>dez\/26/.test(sel));
  t('seleção: as etiquetas saem de cima das linhas', !/pv-fim|pv-baixo/.test(sel));
  t('animação só quando pedida', !/entra/.test(s) && /pv-cen entra/.test(G.svgDe(monta('cenário negativo', 328), { id: 'x', animar: true })));
  const hostil = G.montar({ meses: ['<img src=x>', 'b'], base: [1, 2], cenario: null, ...R, W: 328, H: 300, fmt });
  t('mês hostil é escapado', !/<img/.test(G.svgDe(hostil, { id: 'x' })));
}

/* poucos meses */
for (const k of [1, 2, 3]) {
  const m = monta('cenário negativo', 328, M4.slice(0, k)), s = G.svgDe(m, { id: 'x' });
  t(k + ' mês(es): monta sem erro', !/NaN|undefined/.test(s) && m.pa.length === k && !!m.baixo);
}

/* marcos e leitura */
{
  const meses = ['nov/26', 'dez/26', 'jan/27', 'fev/27', 'mar/27', 'abr/27'];
  t('marco: passa da meta', G.marcos([1000, 1500, 2000, 2500, 3200, 4000], meses, 3000, 0).meta === 'mar/27');
  t('marco: já acima não repete', G.marcos([3500, 3600], meses, 3000, 0).meta === undefined);
  t('marco: volta ao positivo', G.marcos([100, -500, -800, -200, 300, 900], meses, 3000, 2).positivo === 'mar/27');
  t('marco: sem negativo, sem volta', G.marcos([100, 200], meses, 3000, 0).positivo === undefined);
  const m = monta('cenário negativo', 328), l = G.leitura(m, 1, FIX['cenário negativo'].base);
  t('leitura: mês, valores e diferença', l.mes === 'dez/26' && l.cenario === -2100 && l.base === 1768 && l.dif === -3868 && l.estado.cls === 'ru');
  const u = monta('subindo', 328), l2 = G.leitura(u, 0, FIX.subindo.base);
  t('leitura: sem cenário', l2.cenario === null && l2.dif === null);
  t('resumo: fala o mês mais apertado', /Mês mais apertado: jan\/27/.test(G.resumo(m)) && /~/.test(G.resumo(m)));
  t('resumo sem escolha de mês não fala das setas', !/setas/.test(G.resumo(m, true)) && /Mês mais apertado/.test(G.resumo(m, true)) && /setas/.test(G.resumo(m)));
}
/* versão compacta (Hoje): só Base, altura 220, ponto mais baixo em qualquer mês */
{
  const fmtC = { valor: v => '~R$ ' + (v < 0 ? '−' : '') + Math.round(Math.abs(v)), fixo: v => 'R$ ' + Math.round(v), curto: v => String(Math.round(Math.abs(v))) };
  const CASOS = { a: [3000, 2500, 1500, [400, 1300, 2700, 3500]], b: [15000, 8000, 3000, [-6000, 2000, 9000, 16000]], c: [3000, 2500, 1500, [5200, 5400, 5600, 5800]], d: [3000, 2500, 1500, [1800, -350, 900, 2900]], e: [9000, 6000, 2000, [7000, 5200, 1100, 4300]] };
  for (const W of [298, 328, 360]) for (const k of Object.keys(CASOS)) {
    const [meta, piso, alerta, base] = CASOS[k], m = G.montar({ meses: ['nov/26', 'dez/26', 'jan/27', 'fev/27'], base, cenario: null, meta, piso, alerta, W, H: 220, fmt: fmtC });
    const cx = [m.fim, m.baixo && m.baixo.ic, m.baixo && m.baixo.pill].concat(m.refs.map(r => r.caixa));
    t('compacto ' + k + ' ' + W + ': nada omitido', cx.every(Boolean) && !m.omitidos.length);
    t('compacto ' + k + ' ' + W + ': caixas não se tocam', cx.every((a, i) => cx.slice(i + 1).every(b => !G.sobre(a, b))));
    t('compacto ' + k + ' ' + W + ': caixas não cruzam a linha', cx.every(c => !m.segs.some(s => G.cruza(s, c))));
    t('compacto ' + k + ' ' + W + ': só Base', !m.pc && !m.tem && !/pv-cen|pv-area/.test(G.svgDe(m, { id: 'hj' })));
    const y = m.y; t('compacto ' + k + ' ' + W + ': o valor mais baixo fica dentro do eixo', base.every(v => y(v) >= m.P.t && y(v) <= m.P.b));
    if (Math.min(...base) < 0) t('compacto ' + k + ' ' + W + ': eixo mostra o negativo', m.E.lo < Math.min(...base) + 1 && m.E.ticks.some(v => v < 0));
  }
}
/* altura única: Hoje e Futuro usam o mesmo valor */
{
  t('altura: celular e PC', G.altura(true) === 264 && G.altura(false) === 308);
  const fmtA = { valor: v => '~R$ ' + (v < 0 ? '−' : '') + Math.round(Math.abs(v)), fixo: v => 'R$ ' + Math.round(v), curto: v => String(Math.round(Math.abs(v))) };
  t('altura: sem H, vale a do celular', G.montar({ meses: ['a', 'b'], base: [1, 2], cenario: null, meta: 0, piso: 0, alerta: 0, W: 300, fmt: fmtA }).H === G.altura(true));
  const CASOS = { a: [3000, 2500, 1500, [400, 1300, 2700, 3500]], b: [15000, 8000, 3000, [-6000, 2000, 9000, 16000]], c: [3000, 2500, 1500, [5200, 5400, 5600, 5800]], d: [3000, 2500, 1500, [1800, -350, 900, 2900]], e: [9000, 6000, 2000, [7000, 5200, 1100, 4300]] };
  for (const W of [294, 324, 354]) for (const k of Object.keys(CASOS)) {
    const [meta, piso, alerta, base] = CASOS[k], m = G.montar({ meses: ['nov/26', 'dez/26', 'jan/27', 'fev/27'], base, cenario: null, meta, piso, alerta, W, H: G.altura(true), fmt: fmtA });
    const cx = [m.fim, m.baixo && m.baixo.ic, m.baixo && m.baixo.pill].concat(m.refs.map(r => r.caixa));
    t('altura cheia ' + k + ' ' + W + ': área de 222 px', m.P.b - m.P.t === 222);
    t('altura cheia ' + k + ' ' + W + ': nada omitido', cx.every(Boolean) && !m.omitidos.length);
    t('altura cheia ' + k + ' ' + W + ': caixas não se tocam', cx.every((a, i) => cx.slice(i + 1).every(b => !G.sobre(a, b))));
    t('altura cheia ' + k + ' ' + W + ': caixas não cruzam a linha', cx.every(c => !m.segs.some(s => G.cruza(s, c))));
  }
}
console.log(f ? f + ' falha(s) de ' + (ok + f) : 'Todos os ' + ok + ' testes do gráfico de previsão passaram.');
process.exit(f ? 1 : 0);
