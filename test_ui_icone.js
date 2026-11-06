/* O sinal de atenção é um SVG que herda a cor do tema; nunca o caractere ⚠, que vira emoji colorido em alguns navegadores. */
const fs = require('fs'), path = require('path');
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const { t, fim } = contador('ícone de atenção');
const TELAS = ['hoje', 'lancar', 'cartao', 'agenda', 'orcamento', 'metas', 'futuro', 'decidir', 'saude', 'numeros'];

/* nós de texto visíveis com o caractere: o <desc> do SVG não é desenhado */
const soltos = A => { const r = []; const w = A.d.createTreeWalker(A.d.querySelector('main'), 4); let n; while ((n = w.nextNode())) { if (n.textContent.includes('⚠') && !n.parentElement.closest('svg')) r.push(n.textContent.slice(0, 30)); } return r; };

(async () => {
  const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const usos = src.split('\n').filter(l => l.includes('⚠'));
  t('app.js: o caractere só aparece na definição do ícone', usos.length === 1 && /const AV\s*=/.test(usos[0]));
  const css = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  t('o ícone usa fill:currentColor (herda a cor do tema)', /\.gl\{[^}]*fill:currentColor/.test(css));

  for (const [nome, ini] of [['exemplo', { tf_modo: 'demo' }], ['ficticio', { tf_modo: 'real', tf_real: FICTICIO }]]) for (const larg of [1440, 390]) {
    const A = await abrir(ini);
    A.w.innerWidth = larg; A.w.dispatchEvent(new A.w.Event('resize')); await tick(20);
    for (const k of TELAS) {
      await A.ir(k); A.$$('main details.det').forEach(d => { d.open = true; }); await tick(10);
      const s = soltos(A);
      t(nome + ' ' + larg + ' ' + k + ': nenhum ⚠ como texto' + (s.length ? ' [' + s[0] + ']' : ''), s.length === 0);
      t(nome + ' ' + larg + ' ' + k + ': nada de SVG escapado aparecendo como texto', !/&lt;svg|<svg/.test(A.texto()));
    }
    await A.ir('agenda');
    t(nome + ' ' + larg + ': erros de script', A.erros.length === 0);
  }

  const A = await abrir({ tf_modo: 'demo' });
  A.w.innerWidth = 390; A.w.dispatchEvent(new A.w.Event('resize')); await tick(20);
  await A.ir('hoje');
  const al = A.$('.alerta.at');
  t('o alerta de atenção mostra o SVG', !!al && !!al.querySelector('svg.gl'));
  t('o ícone não vai para o leitor de tela e o texto do alerta continua', !!al && al.querySelector('svg.gl').getAttribute('aria-hidden') === 'true' && /limite do cartão/.test(al.textContent));
  await A.ir('agenda');
  const tag = A.$$('.tag.at').find(x => x.querySelector('svg.gl'));
  t('as etiquetas de atenção usam o SVG e mantêm o texto', !!tag && /Vence hoje|Em \d dias/.test(tag.textContent));
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
