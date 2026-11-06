/* Gráfico de previsão: escala, estados e colisão de etiquetas. Só valores inventados. Rodar: node test_grafico.js */
const G = require('./grafico.js');
let ok = 0, f = 0; const t = (n, c) => { if (c) ok++; else { f++; console.log('FALHOU: ' + n); } };
const fmt = { valor: v => '~R$ ' + Math.round(v).toLocaleString('pt-BR'), fixo: v => 'R$ ' + Math.round(v).toLocaleString('pt-BR'), curto: v => Math.round(v).toLocaleString('pt-BR') };
const M4 = ['nov/26', 'dez/26', 'jan/27', 'fev/27'];
const R = { meta: 3000, piso: 2000, alerta: 1500 };
const FIX = {
  'subindo': { base: [557, 1768, 2989, 4259] },
  'cenário negativo': { base: [557, 1768, 2989, 4259], cenario: [-300, -2100, -3600, -1200] },
  'negativo desde o início': { base: [-800, -500, -200, 100], cenario: [-2400, -2600, -2800, -3000] },
  'tudo acima da meta': { base: [5200, 5400, 5600, 5800] },
  'tudo acima, com cenário': { base: [5200, 5400, 5600, 5800], cenario: [4800, 4600, 4400, 4200] },
  'vale no meio': { base: [2200, 2300, 2400, 2500], cenario: [2200, 400, 300, 2600] },
  'cenário acima da base': { base: [100, 200, 300, 400], cenario: [1800, 2400, 2900, 3500] },
  'linhas cruzadas': { base: [3200, 1200, 2800, 900], cenario: [800, 2900, 700, 3100] },
  'plano no zero': { base: [0, 0, 0, 0] },
  'plano na meta': { base: [3000, 3000, 3000, 3000] },
  'plano no alerta': { base: [1500, 1500, 1500, 1500], cenario: [1400, 1450, 1500, 1550] },
  'valores grandes': { base: [120000, 125000, 131000, 140000], cenario: [80000, 60000, 41000, 22000], R: { meta: 100000, piso: 60000, alerta: 40000 } },
  'referências coladas': { base: [900, 1000, 1100, 1200], cenario: [700, 800, 900, 1000], R: { meta: 1250, piso: 1200, alerta: 1150 } },
  'queda forte no fim': { base: [4000, 3900, 3800, 3700], cenario: [4000, 3900, 3800, -2500] },
  'sem meta': { base: [1000, 1200, 1400, 1600], R: { meta: 0, piso: 0, alerta: 0 } }
};
const monta = (nome, W, meses) => { const x = FIX[nome], n = (meses || M4).length, r = x.R || R; return G.montar({ meses: (meses || M4), base: x.base.slice(0, n), cenario: x.cenario ? x.cenario.slice(0, n) : null, ...r, W, H: 300, fmt }); };

/* escala */
{
  const e = G.escala([557, -3600], 3000, 1500);
  t('eixo: inclui negativo e meta', e.lo <= -3600 && e.hi >= 3000);
  t('eixo: marcas redondas', e.ticks.every(v => v % e.passo === 0) && [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000].includes(e.passo));
  t('eixo: zero está nas marcas', e.ticks.includes(0));
  t('eixo: no máximo 5 intervalos', e.ticks.length <= 6);
  t('eixo: inclui o alerta quando os dados ficam acima', G.escala([5000, 6000], 3000, 1500).lo <= 1500);
  t('eixo: sempre vai até zero', G.escala([5000, 6000], 3000, 1500).lo <= 0);
  t('eixo: rótulos', G.fmtEixo(2000) === '2 mil' && G.fmtEixo(-2000) === '-2 mil' && G.fmtEixo(0) === '0' && G.fmtEixo(2500) === '2,5 mil' && G.fmtEixo(-500) === '-500');
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

/* colisão: etiquetas contra etiquetas e contra as linhas, nas larguras de 360 e 390 px */
for (const [W, rot] of [[298, 360], [328, 390], [640, 'pc']]) {
  for (const nome of Object.keys(FIX)) {
    const m = monta(nome, W), cs = m.caixas, tag = nome + ' em ' + rot;
    let bate = 0, linha = 0, fora = 0;
    cs.forEach((a, i) => { cs.slice(i + 1).forEach(b => { if (G.sobre(a, b)) bate++; }); if (m.segs.some(s => G.cruza(s, a))) linha++; if (a.x < 0 || a.y < 0 || a.x + a.w > m.W || a.y + a.h > m.H) fora++; });
    t(tag + ': etiquetas não se tocam', bate === 0);
    t(tag + ': etiquetas não cruzam as linhas', linha === 0);
    t(tag + ': rótulos não cruzam o zero nem as divisórias', m.refs.filter(r => r.caixa).every(r => !m.horizontais.some(l => G.cruza(l, r.caixa))));
    t(tag + ': tudo dentro do gráfico', fora === 0);
    t(tag + ': etiqueta do fim existe', !!m.fim);
    t(tag + ': etiqueta do ponto mais baixo existe', !!m.baixo);
    t(tag + ': nenhuma referência sumiu', m.omitidos.length === 0);
    t(tag + ': os valores levam ~', /^~/.test(m.fim.texto) && /^~/.test(m.baixo.texto));
    const svg = G.svgDe(m, { id: 'x' });
    t(tag + ': sem cor literal', !/#[0-9a-fA-F]{3,8}\b(?!g|c)/.test(svg.replace(/url\(#xg\)/g, '')) && !/rgba?\(|hsl\(/.test(svg));
    t(tag + ': sem NaN', !/NaN|undefined/.test(svg));
    t(tag + ': texto de pelo menos 12 px', [...svg.matchAll(/font-size="([\d.]+)"/g)].every(x => +x[1] >= 12));
    t(tag + ': no máximo três tamanhos', new Set([...svg.matchAll(/font-size="([\d.]+)"/g)].map(x => x[1])).size <= 3);
  }
}

/* forma e estrutura */
{
  const s = G.svgDe(monta('cenário negativo', 328), { id: 'x' });
  t('negativo: rótulo do eixo aparece', /-\d/.test(s));
  t('negativo: só o zero é linha entre as marcas', (s.match(/class="zero"/g) || []).length === 1 && !/stroke="var\(--ln\)"/.test(s));
  t('referências: formas diferentes', /<circle[^>]*var\(--ok\)/.test(s) && /<path[^>]*var\(--at\)/.test(s) && /<rect[^>]*var\(--ru\)/.test(s));
  t('referências: piso pontilhado', /pv-ref-piso[^>]*dasharray/.test(s) && !/pv-ref-alerta[^>]*dasharray/.test(s));
  t('zonas: três tintas por token', /--zone-ok/.test(s) && /--zone-attention/.test(s) && /--zone-risk/.test(s));
  t('base: marcadores vazados nos meses', (s.match(/pv-mb/g) || []).length === 4);
  t('linhas: base 2 e cenário 3', /pv-base[^>]*stroke-width="2"/.test(s) && /pv-cen[^>]*stroke-width="3"/.test(s));
  t('cenário: preenchimento recortado', /pv-area[^>]*clip-path/.test(s));
  t('sem suavização', !/ [CQS]\d/.test(s));
  t('meses no formato pedido', /nov\/26/.test(s));
  t('com o olho fechado o eixo some', !/-\d mil/.test(G.svgDe(monta('cenário negativo', 328), { id: 'x', priv: true })));
  const u = G.svgDe(monta('subindo', 328), { id: 'x' });
  t('sem cenário: uma linha só', !/pv-cen/.test(u) && !/pv-area/.test(u));
  const a = G.svgDe(monta('tudo acima da meta', 328), { id: 'x' });
  t('tudo acima da meta: sem ícone de risco', /pv-est-ok/.test(a) && !/pv-est-ru/.test(a));
  t('negativo desde o início: ícone de risco', /pv-est-ru/.test(G.svgDe(monta('negativo desde o início', 328), { id: 'x' })));
  const sel = G.svgDe(monta('cenário negativo', 328), { id: 'x', sel: 1 });
  t('seleção: guia, halo e mês em negrito', /pv-guia/.test(sel) && /pv-halo/.test(sel) && /font-weight="700"[^>]*>dez\/26/.test(sel));
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
}
console.log(f ? f + ' falha(s) de ' + (ok + f) : 'Todos os ' + ok + ' testes do gráfico de previsão passaram.');
process.exit(f ? 1 : 0);
