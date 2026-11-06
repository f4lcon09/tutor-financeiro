/* Tela Futuro: gráfico único, cabeçalho, seleção, teclado, tabela e casos de borda. Só valores inventados. */
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const { t, fim } = contador('tela do gráfico de previsão');
const hoje = new Date(), mes = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
const FX = extra => { const r = JSON.parse(JSON.stringify(FICTICIO)); r._meta.as_of = mes + '-01'; Object.assign(r, extra || {}); return { tf_modo: 'real', tf_real: r }; };
const larg = { largura: 390 };
const barra = (A, id, v) => { const s = A.$(id); s.value = v; s.dispatchEvent(new A.w.Event('input', { bubbles: true })); };

(async () => {
  {
    const A = await abrir(FX(), larg); await A.ir('futuro'); await tick(10);
    t('um gráfico só na tela', A.$$('#fut svg[data-ch]').length === 1 && A.$$('#pv_area svg').length === 1);
    t('o simulador não tem gráfico próprio', !A.$('#simout svg'));
    t('os controles do simulador continuam', ['#s_g', '#s_e', '#s_c', '#s_m'].every(s => !!A.$(s)));
    t('controle Base e E se...', A.$$('#pv_modo button').map(b => b.textContent).join() === 'Base,E se...');
    t('começa em Base', A.$('#pv_modo [data-m="base"]').getAttribute('aria-pressed') === 'true');
    t('quatro meses na janela', A.$$('.pv-mes').length === 4 && A.$$('.pv-mb').length === 4);
    t('o cabeçalho responde primeiro', /^Mais apertado, em /.test(A.$('.pv-cap').textContent) && /^~R\$/.test(A.$('.pv-val').textContent));
    t('selo com ícone desenhado e texto', !!A.$('#pv_cab .tag svg') && A.$('#pv_cab .tag').textContent.length > 5);
    t('selo não leva ~: o alerta é número seu, não projeção', !/~/.test(A.$('#pv_cab .tag').textContent));
    t('Base e E se...: 44 px de toque com desenho de 36 px', /\.pv-seg button\{[^}]*height:44px/.test(A.d.documentElement.innerHTML) && /\.pv-seg button span\{[^}]*height:36px/.test(A.d.documentElement.innerHTML));
    t('sem legenda', !A.$('#pv_area .legend') && !/Legenda do gráfico/.test(A.texto()));
    t('nota de rodapé', /~ = projeção com base no que você lançou\./.test(A.texto()));
    t('sem erro de script', A.erros.length === 0);
  }
  {
    const A = await abrir(FX(), larg); await A.ir('futuro'); await tick(10);
    A.click('#pv_modo [data-m="se"]'); await tick(10);
    t('E se... sem mudança: uma linha só, com orientação', !A.$('.pv-cen') && /Mexa nos controles/.test(A.$('#pv_cab').textContent));
    A.set('#s_m', '0'); barra(A, '#s_c', '4000'); await tick(10);
    t('mexer no simulador desenha o cenário', !!A.$('.pv-cen') && !!A.$('.pv-base'));
    t('primeiro desenho anima, seguinte não', /entra/.test(A.$('.pv-cen').getAttribute('class')));
    barra(A, '#s_c', '3900'); await tick(10);
    t('ajustar o controle não anima de novo', !/entra/.test(A.$('.pv-cen').getAttribute('class')));
    t('subtítulo compara sem a compra', /Sem a compra seria/.test(A.$('#pv_cab').textContent));
    A.click('#pv_modo [data-m="base"]'); await tick(10);
    t('Base desliga o cenário e mantém os controles', !A.$('.pv-cen') && A.$('#s_c').value === '3900');
    A.click('#pv_modo [data-m="se"]'); await tick(10);
    t('E se... liga de novo o mesmo cenário', !!A.$('.pv-cen'));
    A.click('#s_r'); await tick(10);
    t('limpar volta para Base', !A.$('.pv-cen') && A.$('#pv_modo [data-m="base"]').getAttribute('aria-pressed') === 'true');
  }
  {
    /* seleção por ponteiro */
    const A = await abrir(FX(), larg); await A.ir('futuro'); await tick(10);
    barra(A, '#s_g', '800'); await tick(10);
    const area = A.$('#pv_area'), sv = () => area.querySelector('svg');
    const ev = (tipo, o) => { const e = new A.w.MouseEvent(tipo, { bubbles: true, ...o }); Object.defineProperty(e, 'pointerId', { value: 1 }); Object.defineProperty(e, 'pointerType', { value: 'touch' }); return e; };
    const x1 = A.w.pvUlt ? 0 : 0;
    const W = A.w.eval('pvUlt.m.W'), xm = A.w.eval('pvUlt.m.pa[2].x');
    sv().getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: 300 });
    area.dispatchEvent(ev('pointerdown', { clientX: xm, clientY: 50 })); await tick(5);
    t('tocar escolhe o mês', A.w.eval('pvSel') === 2 && !!A.$('.pv-guia') && !!A.$('.pv-halo'));
    t('cabeçalho vira leitura', /fim do mês/.test(A.$('#pv_cab').textContent) && /Cenário/.test(A.$('#pv_cab').textContent) && /Base/.test(A.$('#pv_cab').textContent) && /Diferença/.test(A.$('#pv_cab').textContent));
    t('selo continua na leitura', !!A.$('#pv_cab .tag'));
    const lin = A.$$('.pv-lin b').map(b => b.textContent);
    t('formato: projeção ~R$ −n e diferença −R$ n, sem ~ e com um sinal só', /^~R\$ /.test(lin[0]) && /^[−+]R\$ \d/.test(lin[2]) && !/~/.test(lin[2]) && !/~−|−R\$ −/.test(A.$('#pv_cab').textContent));
    t('etiquetas saem durante a leitura', !A.$('.pv-fim') && !A.$('.pv-baixo'));
    t('leitura anunciada', /fim do mês/.test(A.$('#pv_vivo').textContent));
    sv().getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: 300 });
    area.dispatchEvent(ev('pointermove', { clientX: A.w.eval('pvUlt.m.pa[3].x'), clientY: 50 })); await tick(5);
    t('arrastar troca o mês', A.w.eval('pvSel') === 3);
    area.dispatchEvent(ev('pointerup', {})); await tick(5);
    t('soltar mantém a seleção', A.w.eval('pvSel') === 3);
    area.dispatchEvent(ev('pointermove', { clientX: 60, clientY: 50 })); await tick(5);
    t('sem pressionar, o toque não muda', A.w.eval('pvSel') === 3);
    A.d.querySelector('h1').dispatchEvent(ev('pointerdown', {})); await tick(5);
    t('tocar fora limpa', A.w.eval('pvSel') === null && /Mais apertado/.test(A.$('#pv_cab').textContent));
  }
  {
    /* teclado e leitor de tela */
    const A = await abrir(FX(), larg); await A.ir('futuro'); await tick(10);
    const area = A.$('#pv_area'), tecla = k => area.dispatchEvent(new A.w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    t('gráfico focável, com resumo em texto', area.getAttribute('role') === 'group' && area.getAttribute('tabindex') === '0' && /Mês mais apertado/.test(area.getAttribute('aria-label')));
    t('região anunciada existe', A.$('#pv_vivo').getAttribute('aria-live') === 'polite');
    tecla('ArrowRight'); await tick(5);
    t('seta direita escolhe o primeiro mês', A.w.eval('pvSel') === 0);
    tecla('ArrowRight'); await tick(5); tecla('ArrowRight'); await tick(5); tecla('ArrowRight'); await tick(5); tecla('ArrowRight'); await tick(5);
    t('seta para no último mês', A.w.eval('pvSel') === 3);
    tecla('ArrowLeft'); await tick(5);
    t('seta esquerda volta', A.w.eval('pvSel') === 2);
    tecla('Escape'); await tick(5);
    t('Esc limpa', A.w.eval('pvSel') === null && A.$('#pv_vivo').textContent === '');
  }
  {
    /* tabela */
    const A = await abrir(FX(), larg); await A.ir('futuro'); await tick(10);
    barra(A, '#s_e', '500'); await tick(10);
    A.click('#pv_tab'); await tick(5);
    const tb = A.$('#pv_tabela table');
    t('tabela real no lugar do gráfico', !!tb && A.$('#pv_area').hidden === true && tb.querySelectorAll('tr').length === 5);
    t('colunas: mês, base, cenário e situação', [...tb.querySelectorAll('th')].map(x => x.textContent).join() === 'Mês,Base,Cenário,Situação');
    t('situação em texto e valor com ~', /Meta|meta|alerta|piso/.test(tb.textContent) && /~R\$/.test(tb.textContent));
    t('botão muda de nome', A.$('#pv_tab').textContent === 'Ver gráfico');
    A.click('#pv_tab'); await tick(5);
    t('volta para o gráfico', !A.$('#pv_tabela table') && A.$('#pv_area').hidden === false && A.$('#pv_tab').textContent === 'Ver em tabela');
    t('botão da tabela sem quebrar linha', /\.pv-tab\{[^}]*white-space:nowrap[^}]*min-height:44px/.test(A.d.documentElement.innerHTML));
  }
  {
    /* olho de privacidade */
    const A = await abrir({ ...FX(), tf_priv: true }, larg); await A.ir('futuro'); await tick(10);
    t('olho fechado: sem valores no cabeçalho nem no gráfico', !/R\$\s*\d/.test(A.$('#pv_cab').textContent) && !/\d mil/.test(A.$('#pv_area').textContent) && /••/.test(A.$('#pv_area').textContent));
    t('olho fechado: resumo acessível sem valores', !/R\$\s*\d/.test(A.$('#pv_area').getAttribute('aria-label')));
    A.$('#pv_area').dispatchEvent(new A.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await tick(5);
    t('olho fechado: leitura sem valores', !/R\$\s*\d/.test(A.$('#pv_cab').textContent) && !/R\$\s*\d/.test(A.$('#pv_vivo').textContent));
  }
  {
    /* casos de borda */
    const alto = await abrir(FX({ sobra_apos_pagar_tudo: 9000, liquidez: { total: 9000, conta_corrente: 500, onde: 'Banco Teste' } }), larg); await alto.ir('futuro'); await tick(10);
    t('tudo acima da meta: selo ok e sem risco', /Acima da meta/.test(alto.$('#pv_cab').textContent) && !alto.$('.pv-est-ru') && !!alto.$('.pv-est-ok'));
    const neg = await abrir(FX({ liquidez: { total: 100, conta_corrente: 0, onde: 'Banco Teste' }, sobra_apos_pagar_tudo: -2500 }), larg); await neg.ir('futuro'); await tick(10);
    t('negativo desde o início: valor negativo visível', /^~R\$ −/.test(neg.$('.pv-val').textContent) && !!neg.$('.pv-est-ru') && /−\d/.test(neg.$('#pv_area').textContent));
    t('negativo desde o início: fala quando volta ao positivo', /Volta ao positivo em /.test(neg.$('#pv_cab').textContent));
    const curto = await abrir(FX(), larg); curto.w.eval("DEMO.meses=DEMO.meses.slice(0,2);DEMO.cenarios={Base:DEMO.cenarios.Base.slice(0,12)}"); await curto.ir('futuro'); await tick(10);
    t('menos de quatro meses: desenha o que há', curto.$$('.pv-mes').length === 2 && curto.erros.length === 0);
    const r = await abrir(FX(), larg); await r.ir('futuro'); await tick(10);
    t('sub-linha diz quando passa da meta', /Passa da meta em /.test(r.$('#pv_cab').textContent) || r.w.eval('Math.max(...DEMO.cenarios.Base) < DEMO.meta || DEMO.cenarios.Base[0] >= DEMO.meta'));
    const ex = await abrir({ tf_modo: 'demo' }, larg); await ex.ir('futuro'); await tick(10);
    t('modo exemplo também usa o gráfico', !!ex.$('.pv-svg') && ex.erros.length === 0);
    const pc = await abrir(FX()); await pc.ir('futuro'); await tick(10);
    t('no PC o gráfico é o mesmo', !!pc.$('.pv-svg') && !pc.$('#simout svg'));
    pc.click('#cmp'); await tick(10);
    t('comparar todos continua no PC', /Todos os cenários/.test(pc.texto()) && !pc.$('.pv-svg'));
  }
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
