/* Papéis ARIA dos botões de alternar e nome acessível dos anéis. Só valores inventados. */
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const { t, fim } = contador('ARIA');

(async () => {
  /* Gasto/Entrada escolhe um valor do formulário: é alternância, não aba */
  {
    const A = await abrir({ tf_modo: 'demo' }); await A.ir('lancar');
    const bs = A.$$('#tipo button');
    t('tipo: dois botões', bs.length === 2);
    t('tipo: grupo com nome', A.$('#tipo').getAttribute('role') === 'group' && !!A.$('#tipo').getAttribute('aria-label'));
    t('tipo: sem aria-selected', bs.every(b => !b.hasAttribute('aria-selected')));
    t('tipo: Gasto começa pressionado', bs[0].getAttribute('aria-pressed') === 'true' && bs[1].getAttribute('aria-pressed') === 'false');
    A.click(bs[1]); await tick(10);
    t('tipo: tocar em Entrada muda o estado', bs[0].getAttribute('aria-pressed') === 'false' && bs[1].getAttribute('aria-pressed') === 'true');
    A.set('#f_valor', '12'); A.set('#f_desc', 'Entrada inventada'); A.click('#f_ok'); await tick(20);
    t('tipo: o lançamento sai como entrada', A.w.eval('S.st.lanc.find(l=>l.desc==="Entrada inventada").valor') < 0);
    t('tipo: estilo cobre aria-pressed', /\.seg button\[aria-pressed=true\]/.test(A.d.documentElement.innerHTML));
  }
  /* A calculadora troca o painel: é aba */
  {
    const A = await abrir({ tf_modo: 'demo' }); await A.ir('decidir');
    const bs = A.$$('#calcs button'), lista = A.$('#calcs'), painel = A.$('#calcbox');
    t('calculadoras: lista de abas com nome', lista.getAttribute('role') === 'tablist' && !!lista.getAttribute('aria-label'));
    t('calculadoras: quatro abas', bs.length === 4 && bs.every(b => b.getAttribute('role') === 'tab'));
    t('calculadoras: uma aba selecionada', bs.filter(b => b.getAttribute('aria-selected') === 'true').length === 1);
    t('calculadoras: aba aponta para o painel', bs.every(b => b.getAttribute('aria-controls') === 'calcbox'));
    const sel = () => bs.find(b => b.getAttribute('aria-selected') === 'true');
    t('calculadoras: painel ligado à aba', painel.getAttribute('role') === 'tabpanel' && painel.getAttribute('aria-labelledby') === sel().id);
    t('calculadoras: só a selecionada entra no Tab', bs.every(b => b.getAttribute('tabindex') === (b === sel() ? '0' : '-1')));
    A.click(bs[2]); await tick(15);
    t('calculadoras: tocar troca aba e painel', sel() === bs[2] && painel.getAttribute('aria-labelledby') === bs[2].id && /fatura/i.test(painel.textContent));
    t('calculadoras: Tab acompanha', bs[2].getAttribute('tabindex') === '0' && bs[0].getAttribute('tabindex') === '-1');
    const tecla = (b, key) => b.dispatchEvent(new A.w.KeyboardEvent('keydown', { key, bubbles: true }));
    tecla(bs[2], 'ArrowRight'); await tick(15);
    t('calculadoras: seta para a direita', sel() === bs[3] && A.d.activeElement === bs[3]);
    tecla(bs[3], 'ArrowRight'); await tick(15);
    t('calculadoras: a seta dá a volta', sel() === bs[0]);
    tecla(bs[0], 'ArrowLeft'); await tick(15);
    t('calculadoras: seta para a esquerda dá a volta', sel() === bs[3]);
    tecla(bs[3], 'Home'); await tick(15);
    t('calculadoras: Home vai para a primeira', sel() === bs[0]);
    tecla(bs[0], 'End'); await tick(15);
    t('calculadoras: End vai para a última', sel() === bs[3]);
    await A.ir('hoje'); await A.ir('decidir');
    t('calculadoras: voltar à tela mantém a aba', A.$('#calcs button[aria-selected="true"]').dataset.k === 'inv' && A.$('#calcbox').getAttribute('aria-labelledby') === A.$('#calcs button[aria-selected="true"]').id);
  }
  /* Anéis: todo SVG com role=img tem nome; o anel diz o percentual ou a nota */
  {
    const R = { tf_modo: 'real', tf_real: FICTICIO, tf_metas: [{ id: 7, nome: 'Meta inventada', alvo: 1000, guardado: 250, prazo: '2030-06', aporte: 50 }] };
    for (const larg of [390, 1200]) for (const k of ['hoje', 'lancar', 'cartao', 'metas', 'futuro', 'saude']) {
      const A = await abrir(R, { largura: larg }); await A.ir(k);
      const semNome = A.$$('svg[role="img"]').filter(s => !(s.getAttribute('aria-label') || '').trim());
      t('anéis: nenhum SVG sem nome em ' + k + ' (' + larg + ')', semNome.length === 0);
    }
    const A = await abrir(R); await A.ir('metas');
    const anel = A.$$('svg[role="img"]').find(s => /circle/i.test(s.innerHTML) && /25%/.test(s.textContent));
    t('anéis: o nome traz o percentual', !!anel && /25%/.test(anel.getAttribute('aria-label')));
    const P = await abrir({ ...R, tf_priv: true }); await P.ir('saude');
    const nomes = P.$$('svg[role="img"]').map(s => s.getAttribute('aria-label') || '').join(' ');
    t('anéis: com o olho fechado o nome não traz dinheiro', !/R\$\s*\d/.test(nomes));
  }
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
