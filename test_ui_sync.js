/* Estado da sincronização no celular: "não conectado" e "erro" mostram forma de ícone e texto curto; "ok" fica só com o ponto. */
const fs = require('fs'), path = require('path');
const { abrir, tick, contador } = require('./test_base.js');
const { t, fim } = contador('estado da sincronização');

(async () => {
  const A = await abrir({ tf_modo: 'demo' });
  A.w.innerWidth = 390; A.w.dispatchEvent(new A.w.Event('resize')); await tick(20);
  const pinta = async (s) => { A.w.eval('sincStatus=' + JSON.stringify(s) + ';pintaSync()'); await tick(2); return A.$('#sync'); };
  const css = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  const casos = [
    ['off', 'Conectar', /Conectar ao Drive/, 'corte'],
    ['at', 'Reconectar', /Reconectar ao Drive/, 'corte'],
    ['cfg', 'Configurar', /configurar o Drive/, 'corte'],
    ['ru', 'Erro no Drive', /Sem sincronizar/, 'exclamacao']
  ];
  const formas = {};
  for (const [st, curto, nome, forma] of casos) {
    const el = await pinta({ t: st, msg: 'Mensagem de teste.' });
    t(st + ': mostra o texto curto "' + curto + '"', el.querySelector('b').textContent === curto && el.classList.contains('comtexto'));
    t(st + ': o nome acessível continua completo', nome.test(el.getAttribute('aria-label')) && /Mensagem de teste/.test(el.getAttribute('aria-label')));
    t(st + ': o ícone tem forma própria, além da nuvem', el.querySelectorAll('svg path').length === 2);
    formas[forma] = el.querySelector('svg').innerHTML;
  }
  t('erro e não conectado têm formas diferentes', formas.corte !== formas.exclamacao);

  const ok = await pinta({ t: 'ok', h: '10:30' });
  t('ok: sem texto curto, só o ponto', ok.querySelector('b').textContent === '' && !ok.classList.contains('comtexto') && ok.classList.contains('ok'));
  t('ok: nuvem simples', ok.querySelectorAll('svg path').length === 1);
  t('ok: o nome acessível diz que sincronizou e a hora', /Sincronizado 10:30/.test(ok.getAttribute('aria-label')));
  const go = await pinta({ t: 'go' });
  t('sincronizando: sem texto curto, ponto pulsando', go.querySelector('b').textContent === '' && go.classList.contains('go'));

  t('celular: botão de 44px com texto (altura e largura mínima)', /\.sync\{position:relative;width:44px;min-width:44px;height:44px/.test(css));
  t('celular: com texto a largura acompanha o conteúdo e o ponto some', /\.sync\.comtexto\{width:auto/.test(css) && /\.sync\.comtexto i\{display:none\}/.test(css));
  t('desktop: o texto curto não aparece', /\.sync b\{display:none\}/.test(css));
  t('nenhum erro de script', A.erros.length === 0);
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
