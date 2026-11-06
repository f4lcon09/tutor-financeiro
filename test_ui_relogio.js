/* Roda a suíte de interface (test_ui_casos, test_ui_1b, test_ui_1c) com o relógio do navegador simulado fixado em dois dias do mês.
   Motivo: "poucos dados" e o ritmo dependem do dia. Em certos dias a projeção coincide com o teto da
   fixture, e o teste reprova sem que haja defeito. Nenhuma asserção muda: só a data de partida do relógio é fixada (dia 3 cobre "poucos dados", dia 20 cobre a projeção).
   Os arquivos da suíte são ignorados pelo git; este arquivo não contém dados.
   Rodar: node test_ui_relogio.js */
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const DIAS = [['dia 3', '2026-11-03T12:00:00'], ['dia 20', '2026-11-20T12:00:00']];

const faltando = ['test_ui.js', 'test_ui_casos.js', 'test_ui_1b.js', 'test_ui_1c.js', 'dev/node_modules/jsdom'].filter(f => !fs.existsSync(path.join(__dirname, f)));
if (faltando.length) { console.log('ATENÇÃO: suíte de interface ausente (' + faltando.join(', ') + '). Nada foi testado.'); process.exit(2); }

if (!process.env.TF_RELOGIO) {
  let cod = 0;
  for (const [nome, iso] of DIAS) {
    console.log('--- relógio fixo: ' + nome + ' (' + iso + ')');
    const r = spawnSync(process.execPath, [__filename], { env: { ...process.env, TF_RELOGIO: iso }, stdio: 'inherit' });
    if (r.status !== 0) cod = 1;
  }
  process.exit(cod);
}

/* filho: faz o Date de cada janela do jsdom começar no dia escolhido e roda a suíte */
const j = require('./dev/node_modules/jsdom'), Orig = j.JSDOM, real = Date.now.bind(Date), DESLOC = new Date(process.env.TF_RELOGIO).getTime() - real();
const agora = () => real() + DESLOC;   // o relógio anda (a junção por item compara horários), só começa no dia escolhido
const fixarRelogio = w => { const R = w.Date; class D extends R { constructor(...a) { if (a.length) super(...a); else super(agora()); } static now() { return agora(); } } w.Date = D; };
fixarRelogio(global);   // o próprio teste calcula validade de sessão com Date.now(): usa o mesmo relógio da janela
j.JSDOM = function (html, opts) { const bp = opts && opts.beforeParse; return new Orig(html, { ...opts, beforeParse(w) { fixarRelogio(w); if (bp) bp(w); } }); };

const H = require('./test_ui.js');
(async () => {
  await require('./test_ui_casos.js').rodar(H);
  await require('./test_ui_1b.js').rodar(H);
  await require('./test_ui_1c.js').rodar(H);
  process.exit(H.resumo());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
