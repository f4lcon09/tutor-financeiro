/* Regressão dos defeitos vistos no iPhone e do isolamento do modo exemplo. Só valores inventados.
   As medidas de layout em navegador real ficam em tests/iphone.js; aqui ficam as regras e o comportamento. */
const fs = require('fs'), path = require('path');
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const Store = require('./store.js');
const { t, fim } = contador('defeitos do iPhone');
const memoria = ini => { const o = {}; Object.keys(ini || {}).forEach(k => { o[k] = JSON.stringify(ini[k]); }); return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: k => { delete o[k]; }, key: i => Object.keys(o)[i], get length() { return Object.keys(o).length; }, _o: o }; };
const REAL = () => ({ tf_modo: 'real', tf_real: JSON.parse(JSON.stringify(FICTICIO)) });
const css = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').replace(/\s+/g, ' ');

(async () => {
  /* a) simulador */
  t('a: o valor do controle não quebra linha', /\.sl label b\{[^}]*white-space:nowrap/.test(css));
  t('a: o valor do controle não encolhe', /\.sl label b\{[^}]*flex:none/.test(css));
  t('a: o controle deslizante ocupa a largura toda', /input\[type=range\]\{[^}]*width:100%/.test(css) && /input\[type=range\]\{[^}]*display:block/.test(css));

  /* b) gráfico com saldo negativo */
  {
    const A = await abrir(REAL(), { largura: 390 });
    const svg = A.w.eval("lineChart(['nov','dez','jan'],[{name:'Com a mudança',values:[100,-300,-520],c:'var(--ru)',area:true}],[{v:200,t:'Piso',c:'var(--at)'}],280,360,{exact:true})");
    const box = A.d.createElement('div'); box.innerHTML = svg; const sv = box.querySelector('svg'), H = +sv.getAttribute('viewBox').split(' ')[3];
    const ys = [...sv.querySelectorAll('path[stroke]')].flatMap(p => (p.getAttribute('d').match(/[ML][\d.]+ -?[\d.]+/g) || []).map(x => +x.split(' ')[1]));
    const textos = [...sv.querySelectorAll('text')].map(x => x.textContent);
    t('b: o ponto mais baixo fica dentro do gráfico', Math.max(...ys) <= H - 34 + .5);
    t('b: o eixo mostra valor negativo', textos.some(x => /^-/.test(x)));
    t('b: a linha do zero aparece', !!sv.querySelector('line.zero') && textos.includes('0'));
    const y0 = +sv.querySelector('line.zero').getAttribute('y1');
    t('b: a linha do zero fica acima da parte negativa', y0 < Math.max(...ys));
    const pos = A.w.eval("lineChart(['nov','dez'],[{name:'x',values:[100,300],c:'var(--ok)'}],[],280,360,{exact:true})");
    t('b: sem saldo negativo, o eixo continua sem linha do zero', !/class="zero"/.test(pos));
    const neg = A.w.eval("lineChart(['nov','dez'],[{name:'x',values:[-100,-300],c:'var(--ru)'}],[],280,360,{exact:true})");
    t('b: tudo negativo também mostra o zero', /class="zero"/.test(neg) && !/NaN/.test(neg));
    t('b: formato largo põe o sinal antes do R$', A.w.eval("axisFmt(-1500,false)").startsWith('-R$') && A.w.eval("axisFmt(-200,false)") === '-R$ 200');
    A.w.eval('PRIV=true');
    const oculto = A.w.eval("lineChart(['nov','dez'],[{name:'x',values:[100,-300],c:'var(--ru)'}],[],280,360,{exact:true,endChip:false})");
    t('b: com o olho fechado o eixo não mostra valores', !/-300|-R\$/.test(oculto.replace(/d="[^"]*"/g, '')));
  }

  /* c) barra de abas */
  t('c: com Mais aberto a aba atual perde o destaque', /nav\.aberto>button\[aria-current=true\]:not\(\.maisbtn\)\{[^}]*background:transparent/.test(css));
  t('c: com Mais aberto, Mais ganha o destaque', /nav\.aberto>\.maisbtn\{[^}]*background:var\(--p2\)/.test(css));
  t('c: passar o dedo não deixa destaque preso', /@media \(hover:hover\)\{nav button:hover/.test(css));
  {
    const A = await abrir(REAL(), { largura: 390 }); await A.ir('orcamento');
    A.click('#maisbtn'); await tick(5);
    t('c: Mais abre e avisa que está aberto', A.$('#nav').classList.contains('aberto') && A.$('#maisbtn').getAttribute('aria-expanded') === 'true');
    A.click('#maisbtn'); await tick(5);
    t('c: Mais fecha', !A.$('#nav').classList.contains('aberto'));
  }

  /* d) caixa de dados */
  {
    const A = await abrir(REAL(), { largura: 390 });
    t('d: no toque não fala em tecla', !/Tecle N/.test(A.$('#secw').textContent));
    const B = await abrir(REAL(), { antes: w => { w.matchMedia = () => ({ matches: true }); } });
    t('d: com teclado continua o atalho', /Tecle N/.test(B.$('#secw').textContent));
    const m = memoria(REAL()), C = await abrir({}, { storage: m, largura: 390 });
    C.click('#reimp'); await tick(5);
    const dlg = C.$('[role=alertdialog]');
    t('d: Reimportar pede confirmação', !!dlg && /substitui os dados deste aparelho/.test(dlg.textContent));
    t('d: o foco começa em Cancelar', C.d.activeElement && C.d.activeElement.id === 'conf_nao');
    t('d: nada mudou antes de confirmar', JSON.parse(m.getItem('tf_modo')) === 'real');
    C.click('#conf_nao'); await tick(5);
    t('d: Cancelar fecha sem mudar nada', !C.$('[role=alertdialog]') && JSON.parse(m.getItem('tf_modo')) === 'real');
    t('d: o foco volta para o link', C.d.activeElement && C.d.activeElement.id === 'reimp');
    C.click('#reimp'); await tick(5);
    C.$('#conf_sim').dispatchEvent(new C.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await tick(5);
    t('d: Esc cancela', !C.$('[role=alertdialog]') && JSON.parse(m.getItem('tf_modo')) === 'real');
    C.click('#reimp'); await tick(5); C.click('#conf_sim'); await tick(5);
    t('d: confirmar leva para reimportar', JSON.parse(m.getItem('tf_modo')) === null);
    const D = await abrir({ tf_modo: 'demo' }, { largura: 390 });
    D.click('#reimp'); await tick(5);
    t('d: no exemplo não há o que substituir, sem confirmação', !D.$('[role=alertdialog]'));
  }

  /* 1.4) modo exemplo */
  {
    const ini = REAL(); ini.tf_lanc3 = [{ id: 1700000000001, data: '2026-01-05', desc: 'Compra inventada', cat: 'Outros', valor: 12.34, forma: 'Pix', essencial: false, lazer: false }]; ini.tf_metas = [];
    ini.tf_modo = 'demo';
    const m = memoria(ini), antes = JSON.stringify(m._o), A = await abrir({}, { storage: m, largura: 390 });
    A.w.eval("S.lancar({tipo:'gasto',valor:'33',desc:'Gasto do exemplo',cat:'Outros',data:S.hojeISO(),essencial:false,lazer:false})"); await tick(10);
    A.w.eval("S.addMeta&&S.addMeta({nome:'Meta do exemplo',alvo:'100',guardado:'0',prazo:'2027-01',aporte:'10'})"); await tick(10);
    const era = JSON.parse(antes);
    t('exemplo: nenhuma chave de dados reais muda', ['tf_real', 'tf_lanc3', 'tf_metas', 'tf_modo'].every(k => m._o[k] === era[k]));
    t('exemplo: tf_items não é criado', m.getItem('tf_items') === null);
    t('exemplo: o gasto fica nas chaves do exemplo', /Gasto do exemplo/.test(m.getItem('tf_demo_tf_lanc3') || ''));
    const novas = Object.keys(m._o).filter(k => !(k in era) && !k.startsWith('tf_demo_'));
    t('exemplo: só preferências ficam fora do prefixo', novas.every(k => /^tf_(tema|priv|det|hz|gtry|inst|instalar)/.test(k)));
    const s = Store.criarStore(Store.armazenamentoDoModo(memoria({ tf_modo: 'demo' })));
    const r = s.importarReal(JSON.parse(JSON.stringify(FICTICIO)));
    t('exemplo: importar é bloqueado', r.ok === false && /modo de exemplo/.test(r.erro) && !s.st.real);
    const s2 = Store.criarStore(memoria({ tf_modo: 'real' }));
    t('modo real: importar continua funcionando', s2.importarReal(JSON.parse(JSON.stringify(FICTICIO))).ok === true);
  }
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
