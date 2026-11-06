/* Conexão bancária na tela: escondida por padrão, endereço, sessão, erros, prévia, duplicados, sinal, cancelar e confirmar.
   Só valores inventados, fetch simulado, nunca a rede. */
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const { t, fim } = contador('tela da conexão bancária');
const hoje = new Date(), mes = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
const URLOK = 'https://script.google.com/macros/s/ENDERECO-INVENTADO/exec', TOKEN = 'token-inventado-123';
const REALFX = () => { const r = JSON.parse(JSON.stringify(FICTICIO)); r._meta.as_of = mes + '-01'; return r; };
const LOGADO = () => ({ tf_gtoken: { v: TOKEN, exp: Date.now() + 3600000 }, tf_gjaconectou: true, tf_gtry: Date.now() });
const LIGADO = () => ({ tf_modo: 'real', tf_real: REALFX(), tf_banco_on: true, ...LOGADO() });
const larg = { largura: 390 };
const CONTAS = [{ id: 'c1', tipo: 'BANK', subtipo: 'CHECKING_ACCOUNT', nome: 'Conta Teste', saldo: 100.5, item: 'i1' }, { id: 'c2', tipo: 'CREDIT', subtipo: 'CREDIT_CARD', nome: 'Cartão Teste', saldo: -200, item: 'i1' }];
const M1 = { id: 'm1', conta: 'c1', data: mes + '-02', desc: 'Padaria Exemplo', valor: -12.5, tipo: 'DEBIT', status: 'POSTED' };
const M2 = { id: 'm2', conta: 'c1', data: mes + '-03', desc: 'Pix recebido', valor: 300, tipo: 'CREDIT', status: 'POSTED' };
const M3 = { id: 'm3', conta: 'c2', data: mes + '-04', desc: 'Loja Inventada', valor: 45.9, tipo: 'DEBIT', status: 'PENDING' };
const RESP = movs => ({ ok: true, dados: { de: mes + '-01', ate: mes + '-05', contas: CONTAS, movs } });
/* ponte simulada: só responde ao endereço inventado; o Drive fica sem rede */
const ponte = (corpo, chamadas) => async (u, o) => { if (u !== URLOK) throw new Error('sem rede'); if (chamadas) chamadas.push({ u, o }); return { ok: true, text: async () => typeof corpo === 'string' ? corpo : JSON.stringify(corpo) }; };
const abreCom = async (corpo, extra, opts) => { const ch = []; const A = await abrir({ ...LIGADO(), ...(extra || {}) }, { ...larg, fetch: ponte(corpo, ch), ...(opts || {}) }); await A.ir('banco'); A.chamadas = ch; A.erros.length = 0; return A; };
const atualiza = async A => { A.set('#bc_url', URLOK); A.click('#bc_atu'); await tick(120); };
const msg = A => A.$('#bc_msg').textContent.replace(/\s+/g, ' ').trim();
const fundo = A => A.d.querySelector('.bc-prev');
const linhas = A => [...A.d.querySelectorAll('.bc-it')];
const caixa = (A, i) => A.d.querySelector('.bc-it input[data-i="' + i + '"]');
const marca = (A, i, v) => { const c = caixa(A, i); c.checked = v; c.dispatchEvent(new A.w.Event('change', { bubbles: true })); };
const foto = A => JSON.stringify(['tf_lanc3', 'tf_banco_ids', 'tf_banco_inv', 'tf_items', 'tf_banco_on'].map(k => A.w.localStorage.getItem(k)));

(async () => {
  /* escondida por padrão */
  {
    let rede = 0;
    const A = await abrir({ tf_modo: 'real', tf_real: REALFX(), ...LOGADO() }, { ...larg, fetch: async () => { rede++; throw new Error('sem rede'); } });
    const r0 = rede;
    t('sem a marca: nada no menu', !A.$('#banco_ab') && !/Conexão bancária/.test(A.$('nav').textContent + A.texto()));
    await A.ir('banco');
    t('sem a marca: pedir a tela abre Hoje', !A.$('#bc_url') && A.w.eval('atual') === 'hoje' && !/Conexão bancária/.test(A.$('nav').textContent + A.texto()));
    t('sem a marca: nada guardado', ['tf_banco_on', 'tf_banco_url', 'tf_banco_ids', 'tf_banco_inv'].every(k => A.w.localStorage.getItem(k) === null));
    t('sem a marca: nenhuma chamada à ponte', !A.w.eval('typeof bancoLigado==="function"&&bancoLigado()') && rede === r0);
    const B = await abrir({ tf_modo: 'real', tf_real: REALFX() }, { ...larg, url: 'http://localhost/index.html#banco' });
    t('sem a marca: endereço com #banco abre Hoje', !B.$('#bc_url') && B.w.eval('atual') === 'hoje');
    const lin = A.$('#ver_lin');
    for (let i = 0; i < 6; i++) lin.dispatchEvent(new A.w.MouseEvent('click', { bubbles: true }));
    t('seis toques não ligam', A.w.localStorage.getItem('tf_banco_on') === null && !A.$('#bc_url'));
    lin.dispatchEvent(new A.w.MouseEvent('click', { bubbles: true })); await tick(10);
    t('sete toques ligam e abrem a tela', A.ls('tf_banco_on') === true && !!A.$('#bc_url') && /Conexão bancária \(em teste\)/.test(A.texto()));
    t('depois de ligar, o menu mostra a entrada', !!A.$('#banco_ab'));
    t('ligar não chama a rede da ponte', !A.w.localStorage.getItem('tf_banco_url'));
    const C = await abrir({ tf_modo: 'real', tf_real: REALFX() }, larg), lc = C.$('#ver_lin');
    for (let i = 0; i < 6; i++) lc.dispatchEvent(new C.w.MouseEvent('click', { bubbles: true }));
    const R = C.w.Date.now, d0 = R.call(C.w.Date); C.w.Date.now = () => d0 + 5000;
    lc.dispatchEvent(new C.w.MouseEvent('click', { bubbles: true }));
    t('toques espaçados não ligam', C.w.localStorage.getItem('tf_banco_on') === null);
    const D = await abrir({ tf_modo: 'demo', tf_banco_on: true }, larg);
    t('modo de exemplo: sem entrada e sem linha de toque', !D.$('#banco_ab') && !D.$('#ver_lin'));
    await D.ir('banco'); t('modo de exemplo: tela não abre', !D.$('#bc_url'));
    t('o texto da linha continua igual', /Dados informados por você em/.test(A.$('#ver_lin').textContent));
  }
  /* tela */
  {
    const A = await abreCom(RESP([M1]));
    t('tela: título e botões', /Conexão bancária \(em teste\)/.test(A.texto()) && A.$('#bc_atu').textContent === 'Atualizar do banco' && A.$('#bc_rem').textContent === 'Remover conexão');
    t('tela: campo com rótulo', !!A.d.querySelector('label[for="bc_url"]') && A.$('#bc_url').getAttribute('type') === 'url');
    t('tela: campo de endereço com o estilo dos outros campos', /input[type=text],input[type=url],[^{]*{min-width:0;width:100%;min-height:44px/.test(require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8')));
    t('tela: botões com tipo button', A.$('#bc_atu').getAttribute('type') === 'button' && A.$('#bc_rem').getAttribute('type') === 'button');
    t('tela: nada automático', A.chamadas.length === 0);
    await tick(1700); t('tela: continua sem chamar a ponte', A.chamadas.length === 0);
  }
  /* endereço */
  for (const u of ['http://script.google.com/macros/s/X/exec', 'https://example.com/x', 'https://script.google.com.example.com/x', 'nada']) {
    const A = await abreCom(RESP([M1]));
    A.set('#bc_url', u); A.click('#bc_atu'); await tick(10);
    t('endereço recusado: ' + u, /https:\/\/script\.google\.com/.test(msg(A)) && A.chamadas.length === 0 && A.w.localStorage.getItem('tf_banco_url') === null);
  }
  {
    const A = await abreCom(RESP([M1])); await atualiza(A);
    t('endereço bom fica só neste aparelho', A.ls('tf_banco_url') === URLOK && !A.w.location.href.includes('script.google'));
    t('endereço não vai para a sincronização', !JSON.stringify(A.w.eval('S.paraSync()')).includes('script.google') && !A.w.localStorage.getItem('tf_items').includes('script.google'));
    await A.ir('hoje'); await A.ir('banco'); t('endereço volta preenchido', A.$('#bc_url').value === URLOK);
  }
  /* sessão do Google */
  {
    const A = await abreCom(RESP([M1]), { tf_gtoken: { v: TOKEN, exp: Date.now() - 1000 } });
    t('sessão expirada: aviso ao abrir', /sessão do Google expirou/.test(msg(A)) && /ícone de nuvem/.test(msg(A)));
    await atualiza(A);
    t('sessão expirada: sem chamada', A.chamadas.length === 0 && /sessão do Google expirou/.test(msg(A)));
    const B = await abreCom(RESP([M1]), { tf_gtoken: null, tf_gjaconectou: null });
    t('sem conexão: aviso ao abrir', /conecte a sincronização/.test(msg(B)) && /ícone de nuvem/.test(msg(B)));
    await atualiza(B); t('sem conexão: sem chamada', B.chamadas.length === 0);
    const C = await abreCom(RESP([M1]));
    t('conectado: sem aviso', msg(C) === '');
    await atualiza(C);
    t('conectado: o token vai só no corpo', JSON.parse(C.chamadas[0].o.body).token === TOKEN && !C.chamadas[0].u.includes(TOKEN));
    t('conectado: pede 35 dias e tipo access', JSON.parse(C.chamadas[0].o.body).dias === 35 && JSON.parse(C.chamadas[0].o.body).tipo === 'access');
    t('conectado: token fora da tela', !C.d.documentElement.outerHTML.includes(TOKEN));
  }
  /* erros da ponte */
  const ERROS = [['sem_token', /não recebeu/], ['token_invalido', /recusou/], ['cliente_errado', /outro app/], ['sem_email', /confirmar sua conta/], ['token_sem_email', /e-mail/], ['email_nao_verificado', /não está verificado/], ['nao_autorizado', /não tem permissão/], ['pluggy_auth_401', /código 401/], ['pluggy_503', /código 503/], ['pluggy_401 USER_AUTHORIZATION_EXPIRED', /Renove a conexão/]];
  for (const [c, re] of ERROS) {
    const A = await abreCom({ ok: false, erro: c }); await atualiza(A);
    t('erro ' + c + ': mensagem em português', re.test(msg(A)) && !fundo(A) && !msg(A).includes('_'));
    t('erro ' + c + ': nada gravado', !A.ls('tf_banco_ids') && A.w.eval('S.st.lanc.length') === 0);
    t('erro ' + c + ': botão volta ao normal', A.$('#bc_atu').disabled === false && A.$('#bc_atu').textContent === 'Atualizar do banco');
  }
  for (const [n, corpo] of [['texto do servidor', { ok: false, erro: '<img src=x onerror=window.__xss=1>detalhe' }], ['html', '<!doctype html><title>Entrar</title>'], ['forma errada', { ok: true, dados: { contas: 1 } }], ['nulo', 'null'], ['campo a menos', { ok: true, dados: { de: mes + '-01', ate: mes + '-05', contas: CONTAS, movs: [{ id: 'x' }] } }]]) {
    const A = await abreCom(corpo); await atualiza(A);
    t('resposta ruim, ' + n + ': mensagem fixa', msg(A).length > 20 && !fundo(A) && !A.$('#bc_msg img') && A.w.__xss === undefined && !/detalhe|Entrar/.test(msg(A)));
  }
  {
    const A = await abrir(LIGADO(), { ...larg, fetch: async () => { throw new TypeError('rede'); } }); await A.ir('banco'); await atualiza(A);
    t('sem rede: mensagem simples', /Não consegui falar com a ponte/.test(msg(A)));
  }
  /* 0, 1 e muitos */
  {
    const Z = await abreCom(RESP([])); await atualiza(Z);
    t('zero itens: avisa e não abre prévia', /Nenhum movimento/.test(msg(Z)) && !fundo(Z));
    const U = await abreCom(RESP([M1])); await atualiza(U);
    t('um item: prévia com um', linhas(U).length === 1 && /1 de 1 selecionados/.test(fundo(U).textContent));
    U.click('#bc_ok'); await tick(10);
    t('um item: grava um', U.w.eval('S.st.lanc.length') === 1 && /1 lançamento importado/.test(msg(U)));
    const muitos = Array.from({ length: 800 }, (_, i) => ({ ...M1, id: 'x' + i, desc: 'Compra ' + i }));
    const V = await abreCom(RESP(muitos)); await atualiza(V);
    t('muitos itens: prévia com todos', linhas(V).length === 800 && /800 de 800/.test(fundo(V).textContent));
    V.click('#bc_ok'); await tick(10);
    t('muitos itens: grava todos, com ids únicos', V.w.eval('S.st.lanc.length') === 800 && V.w.eval('new Set(S.st.lanc.map(l=>l.id)).size') === 800);
  }
  /* prévia */
  {
    const A = await abreCom(RESP([M1, M2, M3]));
    const antes = foto(A); await atualiza(A);
    const P = fundo(A), [a, b, c] = linhas(A);
    t('prévia: nada gravado ao abrir', foto(A) === antes);
    t('prévia: diálogo com nome e descrição', P.getAttribute('role') === 'dialog' && P.getAttribute('aria-modal') === 'true' && !!A.d.getElementById(P.getAttribute('aria-labelledby')) && !!A.d.getElementById(P.getAttribute('aria-describedby')));
    t('prévia: foco inicial em Cancelar', A.d.activeElement === A.$('#bc_cancel'));
    t('prévia: fundo inerte', A.$('nav').hasAttribute('inert') && A.$('.col').hasAttribute('inert'));
    t('prévia: data e descrição', a.textContent.includes('Padaria Exemplo') && a.textContent.includes('02/' + mes.slice(5) + '/' + mes.slice(0, 4)));
    t('prévia: valor com centavos', /R\$\s*12,50/.test(a.textContent) && /R\$\s*45,90/.test(c.textContent) && /R\$\s*300,00/.test(b.textContent));
    t('prévia: conta', a.textContent.includes('Conta Teste') && c.textContent.includes('Cartão Teste'));
    t('prévia: saída e entrada escritas', /saída/.test(a.textContent) && /entrada/.test(b.textContent));
    t('prévia: pendente aparece', /pendente/.test(c.textContent));
    t('prévia: marcados por padrão', [0, 1, 2].every(i => caixa(A, i).checked) && /3 de 3 selecionados/.test(P.textContent));
    t('prévia: botões', A.$('#bc_ok').textContent === 'Importar selecionados' && A.$('#bc_cancel').textContent === 'Cancelar');
    t('prévia: toda caixa tem texto', linhas(A).every(l => l.tagName === 'LABEL' && l.textContent.trim().length > 5));
    t('prévia: chave de sinal por conta', A.d.querySelectorAll('.bc-inv input').length === 2 && /Inverter sinal de Cartão Teste/.test(P.textContent));
    t('prévia: contagem anunciada', A.$('#bc_cont').getAttribute('role') === 'status');
    marca(A, 1, false);
    t('prévia: contagem acompanha', /2 de 3 selecionados/.test(P.textContent));
    marca(A, 0, false); marca(A, 2, false);
    t('prévia: sem seleção, confirmar fica desligado', A.$('#bc_ok').disabled === true);
    marca(A, 2, true); t('prévia: volta a ligar', A.$('#bc_ok').disabled === false);
    const tab = (shift) => { const e = new A.w.KeyboardEvent('keydown', { key: 'Tab', shiftKey: !!shift, bubbles: true, cancelable: true }); A.d.activeElement.dispatchEvent(e); return e.defaultPrevented; };
    A.$('#bc_ok').focus(); t('teclado: Tab no fim volta ao começo', tab() && A.d.activeElement === A.d.querySelector('.bc-inv input'));
    A.d.querySelector('.bc-inv input').focus(); t('teclado: Shift+Tab no começo vai ao fim', tab(true) && A.d.activeElement === A.$('#bc_ok'));
    A.$('#bc_cancel').focus(); A.d.activeElement.dispatchEvent(new A.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    t('teclado: Esc cancela', !fundo(A) && foto(A) === antes && A.d.activeElement === A.$('#bc_atu'));
    t('fechar: fundo volta ao normal', !A.$('nav').hasAttribute('inert'));
  }
  /* cancelar */
  {
    const A = await abreCom(RESP([M1, M2]), { tf_banco_inv: ['c9'] }); const antes = foto(A); await atualiza(A);
    A.d.querySelectorAll('.bc-inv input')[0].click(); await tick(5); marca(A, 0, false);
    A.click('#bc_cancel'); await tick(5);
    t('cancelar: não escreve nada', foto(A) === antes && A.w.eval('S.st.lanc.length') === 0);
    t('cancelar: sem resto na tela', !fundo(A) && !A.d.querySelector('.conf') && !/Padaria/.test(A.texto()));
    t('cancelar: foco volta ao botão', A.d.activeElement === A.$('#bc_atu'));
    const B = await abreCom(RESP([M1])); await atualiza(B); const f0 = foto(B);
    fundo(B).parentElement.dispatchEvent(new B.w.MouseEvent('click', { bubbles: true })); await tick(5);
    t('tocar fora cancela', !fundo(B) && foto(B) === f0);
  }
  /* confirmar */
  {
    const A = await abreCom(RESP([M1, M2, M3])); await atualiza(A);
    marca(A, 1, false); A.click('#bc_ok'); await tick(10);
    const l = A.w.eval('S.st.lanc');
    t('confirmar: grava só os selecionados', l.length === 2 && l.every(x => x.idExterno !== 'm2'));
    t('confirmar: valores certos', l.find(x => x.idExterno === 'm1').valor === 12.5 && l.find(x => x.idExterno === 'm3').valor === 45.9);
    t('confirmar: campos opcionais', l.every(x => x.origem === 'pluggy'));
    t('confirmar: ids guardados', JSON.stringify(A.ls('tf_banco_ids').sort()) === '["m1","m3"]');
    t('confirmar: mensagem', /2 lançamentos importados/.test(msg(A)) && !fundo(A));
    t('confirmar: entra na sincronização', Object.values(A.w.eval('capturar()')).some(i => i.v && i.v.idExterno === 'm1'));
    t('confirmar: nada de resposta guardada', !Object.keys(A.w.localStorage).some(k => /banco/.test(k) && /Padaria/.test(A.w.localStorage.getItem(k) || '')));
    t('confirmar: nada no endereço', !/Padaria|m1/.test(A.w.location.href));
    await atualiza(A);
    t('segunda vez: o já importado vem desligado', caixa(A, 0).disabled && !caixa(A, 0).checked && /já existe/.test(linhas(A)[0].textContent));
    t('segunda vez: o não importado vem marcado', caixa(A, 1).checked);
    t('segunda vez: conta só o novo', /1 de 3 selecionados/.test(fundo(A).textContent));
    A.click('#bc_ok'); await tick(10);
    t('segunda vez: entra só o que faltava', A.w.eval('S.st.lanc.length') === 3);
    await atualiza(A);
    t('terceira vez: nada novo', linhas(A).every(x => x.querySelector('input').disabled) && A.$('#bc_ok').disabled === true);
    A.click('#bc_ok'); await tick(10);
    t('terceira vez: zero duplicados', A.w.eval('S.st.lanc.length') === 3);
    A.click('#bc_cancel');
  }
  /* duplicado por data, valor e descrição */
  {
    const A = await abreCom(RESP([M1, M2]));
    A.w.eval(`S.lancar({tipo:'gasto',valor:'12,50',desc:'PADARIA  exemplo',cat:'Comida',data:'${M1.data}',forma:'Pix'})`);
    await atualiza(A);
    t('igual a lançamento: aparece como já existe, desmarcado', !caixa(A, 0).checked && /já existe/.test(linhas(A)[0].textContent));
    t('igual a lançamento: o dono ainda pode marcar', !caixa(A, 0).disabled);
    t('igual a lançamento: o outro segue marcado', caixa(A, 1).checked);
    A.click('#bc_ok'); await tick(10);
    t('igual a lançamento: não duplica', A.w.eval('S.st.lanc.length') === 2);
  }
  /* sinal de cartão */
  {
    const A = await abreCom(RESP([M1, M3])); await atualiza(A);
    t('sinal: cartão começa como veio', /saída/.test(linhas(A)[1].textContent));
    const ch = A.d.querySelectorAll('.bc-inv input')[1]; marca(A, 0, false); ch.click(); await tick(5);
    t('sinal: inverter vale só para o cartão', /entrada/.test(linhas(A)[1].textContent) && /saída/.test(linhas(A)[0].textContent));
    t('sinal: escolha da caixa sobrevive', !caixa(A, 0).checked);
    t('sinal: nada gravado antes de confirmar', A.w.localStorage.getItem('tf_banco_inv') === null);
    A.click('#bc_ok'); await tick(10);
    t('sinal: grava como entrada', A.w.eval('S.st.lanc[0].valor') === -45.9);
    t('sinal: lembra neste aparelho', JSON.stringify(A.ls('tf_banco_inv')) === '["c2"]');
    await atualiza(A);
    t('sinal: volta ligado', A.d.querySelectorAll('.bc-inv input')[1].checked && !A.d.querySelectorAll('.bc-inv input')[0].checked);
    A.click('#bc_cancel');
  }
  /* texto hostil e olho fechado */
  {
    const H = '<img src=x onerror=window.__xss=1>';
    const A = await abreCom(RESP([{ ...M1, desc: H }])); await atualiza(A);
    t('texto hostil: aparece literal', !fundo(A).querySelector('img') && fundo(A).textContent.includes(H) && A.w.__xss === undefined);
    const C2 = await abreCom({ ok: true, dados: { de: mes + '-01', ate: mes + '-05', contas: [{ ...CONTAS[0], nome: H }], movs: [M1] } }); await atualiza(C2);
    t('nome de conta hostil: literal', !fundo(C2).querySelector('img') && C2.w.__xss === undefined);
    const P = await abreCom(RESP([M1]), { tf_priv: true }); await atualiza(P);
    t('olho fechado: sem valores', !/R\$\s*\d/.test(fundo(P).textContent));
  }
  /* remover */
  {
    const A = await abreCom(RESP([M1]), { tf_banco_url: URLOK, tf_banco_ids: ['m1'], tf_banco_inv: ['c2'] });
    A.click('#bc_rem'); await tick(5);
    t('remover: pede confirmação com foco em Cancelar', !!A.$('#conf_sim') && A.d.activeElement === A.$('#conf_nao'));
    A.click('#conf_nao'); await tick(5);
    t('remover: cancelar mantém', A.ls('tf_banco_url') === URLOK);
    A.click('#bc_rem'); await tick(5); A.click('#conf_sim'); await tick(10);
    t('remover: apaga endereço e sinais', A.w.localStorage.getItem('tf_banco_url') === null && A.w.localStorage.getItem('tf_banco_inv') === null && A.$('#bc_url').value === '');
    t('remover: mantém os ids, para não duplicar depois', JSON.stringify(A.ls('tf_banco_ids')) === '["m1"]');
    t('remover: avisa', /Conexão removida/.test(msg(A)));
  }
  /* privacidade: nada vai para o console */
  {
    const logs = []; const A = await abreCom(RESP([M1]), {}, { antes: w => ['log', 'info', 'warn', 'error', 'debug'].forEach(k => { w.console[k] = (...a) => logs.push(a.join(' ')); }) });
    await atualiza(A); A.click('#bc_ok'); await tick(10);
    t('privacidade: nada no console', !logs.some(l => /Padaria|script\.google|token-inventado/.test(l)));
    t('privacidade: sem erro de script', A.erros.length === 0);
  }
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
