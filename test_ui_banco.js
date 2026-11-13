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
/* pluggy-6: Atualizar do banco grava os últimos valores do banco (tf_bsnap e o item banco da sincronização) antes da prévia; a foto confere o resto */
const semBanco = v => { if (!v) return v; try { const o = JSON.parse(v); delete o.banco; return JSON.stringify(o); } catch (e) { return v; } };
const foto = A => JSON.stringify(['tf_lanc3', 'tf_banco_ids', 'tf_banco_inv', 'tf_items', 'tf_banco_on'].map(k => k === 'tf_items' ? semBanco(A.w.localStorage.getItem(k)) : A.w.localStorage.getItem(k)));

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
    t('tela: campo de endereço com o estilo dos outros campos', require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8').includes('input[type=text],input[type=url],input[type=number]'));
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
    A.click('#bc_ok'); await tick(10); A.click('#bc_sim'); await tick(10);
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
  /* pluggy-2: nomes de conta */
  const foto2 = A => JSON.stringify(['tf_lanc3', 'tf_banco_ids', 'tf_banco_inv', 'tf_banco_contas'].map(k => A.w.localStorage.getItem(k)));
  {
    const A = await abreCom(RESP([M1, M3])); await atualiza(A);
    t('nome: linha mostra o nome da conta', /Conta Teste · conta/.test(linhas(A)[0].textContent) && /Cartão Teste · cartão/.test(linhas(A)[1].textContent));
    t('nome: inverter usa o nome novo', /Inverter sinal de Conta Teste · conta/.test(fundo(A).textContent) && /Inverter sinal de Cartão Teste · cartão/.test(fundo(A).textContent));
    t('nome: renomear fica depois da lista', !!fundo(A).querySelector('.bc-nomes summary') && !!A.d.querySelector('label[for="bc_nm1"]'));
    const f0 = foto2(A);
    A.$('#bc_nm1').value = 'Roxinho'; A.$('#bc_nm1').dispatchEvent(new A.w.Event('change', { bubbles: true })); await tick(5);
    t('nome: renomear atualiza a linha e o inverter', /Roxinho/.test(linhas(A)[1].textContent) && /Inverter sinal de Roxinho/.test(fundo(A).textContent));
    t('nome: renomear não grava antes de confirmar', foto2(A) === f0);
    A.click('#bc_cancel'); await tick(5);
    t('nome: cancelar esquece', foto2(A) === f0);
    await atualiza(A);
    A.$('#bc_nm1').value = 'Roxinho'; A.$('#bc_nm1').dispatchEvent(new A.w.Event('change', { bubbles: true })); await tick(5);
    A.click('#bc_ok'); await tick(10);
    const l = A.w.eval('S.st.lanc');
    t('campo: conta no lançamento', l.find(x => x.idExterno === 'm3').contaId === 'c2' && l.find(x => x.idExterno === 'm3').contaNome === 'Roxinho' && l.find(x => x.idExterno === 'm1').contaNome === 'Conta Teste · conta');
    t('nome: fica neste aparelho', (A.ls('tf_banco_contas') || []).find(c => c.id === 'c2').renome === 'Roxinho');
    t('nome: não vai para a sincronização como item', Object.keys(A.w.eval('capturar()')).every(k => /^(lanc|pago|teto|meta|res):|^taxa$|^real$|^numeros$|^banco$|^liga$/.test(k)) && !JSON.stringify(A.w.eval('S.paraSync()')).includes('renome'));
    await A.ir('hoje'); await A.ir('banco');
    t('Mais: lista as contas', !!A.$('#bc_mais') && A.$('#bc_mn1').value === 'Roxinho' && !!A.d.querySelector('label[for="bc_mn1"]'));
    t('Mais: explica o que muda', /próximas importações/.test(A.texto()));
    A.$('#bc_mn0').value = 'Principal'; A.$('#bc_mn0').dispatchEvent(new A.w.Event('change', { bubbles: true })); await tick(5);
    t('Mais: renomear fica guardado', (A.ls('tf_banco_contas') || []).find(c => c.id === 'c1').renome === 'Principal');
    t('Mais: renomear não muda lançamento', A.w.eval('S.st.lanc').find(x => x.idExterno === 'm1').contaNome === 'Conta Teste · conta');
    await atualiza(A);
    t('Mais: a prévia usa o nome novo', /Inverter sinal de Principal/.test(fundo(A).textContent) && A.$('#bc_nm0').value === 'Principal');
    A.click('#bc_cancel');
    A.$('#bc_mn1').value = ''; A.$('#bc_mn1').dispatchEvent(new A.w.Event('change', { bubbles: true })); await tick(5);
    t('Mais: nome vazio volta ao padrão', (A.ls('tf_banco_contas') || []).find(c => c.id === 'c2').renome === '');
    const H = '<img src=x onerror=window.__xss=1>';
    A.$('#bc_mn0').value = H; A.$('#bc_mn0').dispatchEvent(new A.w.Event('change', { bubbles: true })); await A.ir('hoje'); await A.ir('banco');
    t('Mais: nome hostil fica literal', !A.$('main img') && A.w.__xss === undefined);
    const V = await abrir({ tf_modo: 'real', tf_real: REALFX(), tf_banco_on: true, ...LOGADO() }, larg); await V.ir('banco');
    t('Mais: sem contas, sem o painel', !V.$('#bc_mais'));
  }
  /* pluggy-2: linha e filtro em Lançar */
  {
    const hojeISO = mes + '-02', fx = { tf_lanc3: [
      { id: 1, data: hojeISO, desc: 'Sem conta nenhuma', cat: 'Mercado', valor: 10, forma: 'Pix', essencial: true, lazer: false },
      { id: 2, data: hojeISO, desc: 'Da conta', cat: 'Outros', valor: 20, forma: 'Débito', essencial: false, lazer: false, origem: 'pluggy', idExterno: 'x1', contaId: 'c1', contaNome: 'Conta Teste · conta' },
      { id: 3, data: hojeISO, desc: 'Do cartão', cat: 'Outros', valor: 30, forma: 'Crédito', essencial: false, lazer: false, origem: 'pluggy', idExterno: 'x2', contaId: 'c2', contaNome: 'Cartão Teste · cartão' }] };
    const A = await abreCom(RESP([]), fx); await A.ir('lancar'); await tick(15);
    const lin = n => [...A.d.querySelectorAll('#lista tr')].find(r => r.textContent.includes(n));
    t('linha: categoria, forma e conta', /Outros · Crédito · Cartão Teste · cartão/.test(lin('Do cartão').textContent));
    t('linha: sem conta fica como antes', !lin('Sem conta nenhuma').querySelector('.mu').textContent.includes('undefined') && /Mercado · Pix$/.test(lin('Sem conta nenhuma').querySelector('.mu').textContent.trim()));
    const sel = A.$('#flt_conta');
    t('filtro: aparece com rótulo', !!sel && A.d.querySelector('label[for="flt_conta"]').textContent === 'Filtrar por conta');
    t('filtro: opções', [...sel.options].map(o => o.textContent).join('|') === 'Todas as contas|Cartão Teste · cartão|Conta Teste · conta|Sem conta');
    const qtd = () => A.d.querySelectorAll('#lista tr').length - 1;
    t('filtro: começa com tudo', qtd() === 3);
    const esc = v => { const s = A.$('#flt_conta'); s.value = v; s.dispatchEvent(new A.w.Event('change', { bubbles: true })); };
    esc('c2'); await tick(5);
    t('filtro: uma conta', qtd() === 1 && !!lin('Do cartão'));
    t('filtro: mantém a escolha e o foco', A.$('#flt_conta').value === 'c2' && A.d.activeElement === A.$('#flt_conta'));
    t('filtro: mostra o total', /1 resultado\(s\)/.test(A.$('#lista').textContent));
    esc('__sem'); await tick(5);
    t('filtro: sem conta', qtd() === 1 && !!lin('Sem conta nenhuma'));
    esc(''); await tick(5); t('filtro: volta a tudo', qtd() === 3);
    A.set('#busca', 'cartão teste'); await tick(5);
    t('busca: acha pelo nome da conta', qtd() === 1); A.set('#busca', ''); await tick(5);
    const B2 = await abreCom(RESP([]), { tf_lanc3: [fx.tf_lanc3[0]] }); await B2.ir('lancar'); await tick(15);
    t('filtro: sem conta nenhuma, não aparece', !B2.$('#flt_conta'));
    const H = '<img src=x onerror=window.__xss=1>';
    const C = await abreCom(RESP([]), { tf_lanc3: [{ ...fx.tf_lanc3[1], contaNome: H }] }); await C.ir('lancar'); await tick(15);
    t('filtro: nome hostil literal', !C.$('#lista img') && !C.$('#conta_filtro img') && C.w.__xss === undefined);
  }
  /* pluggy-2: vincular */
  {
    const manual = `S.lancar({tipo:'gasto',valor:'12,50',desc:'padaria exemplo',cat:'Comida',data:'${M1.data}',forma:'Pix'})`;
    const A = await abreCom(RESP([M1, M2])); A.w.eval(manual); await atualiza(A);
    const v = A.d.querySelector('.bc-vin input'), f0 = foto2(A), l0 = JSON.stringify(A.w.eval('S.st.lanc[0]'));
    t('vínculo: caixa ligada por padrão', !!v && v.checked && /Vincular conta/.test(A.d.querySelector('.bc-vin').textContent));
    t('vínculo: contagem mostra', /1 de 2 selecionados · 1 para vincular/.test(fundo(A).textContent));
    A.click('#bc_ok'); await tick(5);
    t('resumo: texto simples', /Vai atualizar 1 lançamento existente só com a conta\. Nada mais muda\./.test(A.$('#conf_d').textContent));
    t('resumo: cita o que é novo', /E vai importar 1 lançamento novo\./.test(A.$('#conf_d').textContent));
    t('resumo: diálogo com foco em Cancelar', A.$('#bc_vt').closest('[role=alertdialog]') !== null && A.d.activeElement === A.$('#bc_vt') && A.$('#bc_vt').textContent === 'Cancelar');
    t('resumo: nada gravado ainda', foto2(A) === f0);
    A.click('#bc_vt'); await tick(5);
    t('resumo: cancelar volta à prévia sem gravar', !!fundo(A) && !A.$('#bc_sim') && foto2(A) === f0 && JSON.stringify(A.w.eval('S.st.lanc[0]')) === l0 && A.d.activeElement === A.$('#bc_ok'));
    A.click('#bc_ok'); await tick(5);
    A.d.activeElement.dispatchEvent(new A.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await tick(5);
    t('resumo: Esc também não grava', !!fundo(A) && foto2(A) === f0);
    const u0 = (() => { const m = A.w.eval('capturar()'); return Object.values(m).find(i => i.v && i.v.desc === 'padaria exemplo').u; })();
    await tick(10);
    A.click('#bc_ok'); await tick(5); A.click('#bc_sim'); await tick(15);
    const l = A.w.eval('S.st.lanc').find(x => x.desc === 'padaria exemplo');
    t('vínculo: liga só com a conta', l.contaId === 'c1' && l.contaNome === 'Conta Teste · conta' && l.idExterno === 'm1' && l.origem === 'pluggy' && l.valor === 12.5 && l.cat === 'Comida' && l.forma === 'Pix');
    t('vínculo: não cria lançamento a mais', A.w.eval('S.st.lanc.length') === 2);
    t('vínculo: mensagem', /1 lançamento importado\. 1 lançamento vinculado à conta\./.test(msg(A)));
    t('vínculo: id guardado', A.ls('tf_banco_ids').includes('m1'));
    const u1 = Object.values(A.w.eval('capturar()')).find(i => i.v && i.v.desc === 'padaria exemplo').u;
    t('vínculo: hora do item muda', u1 > u0);
    await atualiza(A);
    t('segunda rodada: nada a vincular', !A.d.querySelector('.bc-vin') && /conta vinculada/.test(fundo(A).textContent) && A.$('#bc_ok').disabled === true);
    A.click('#bc_cancel');
    const B3 = await abreCom(RESP([M1])); B3.w.eval(manual); await atualiza(B3);
    const c0 = B3.d.querySelector('.bc-vin input'); c0.checked = false; c0.dispatchEvent(new B3.w.Event('change', { bubbles: true })); await tick(5);
    t('vínculo: desligar tira da conta', B3.$('#bc_ok').disabled === true && !/para vincular/.test(fundo(B3).textContent));
    c0.checked = true; c0.dispatchEvent(new B3.w.Event('change', { bubbles: true }));
    marca(B3, 0, true); await tick(5);
    t('vínculo: marcar para importar tira do vínculo', !/para vincular/.test(fundo(B3).textContent));
    B3.click('#bc_ok'); await tick(10);
    t('vínculo: importar sem resumo quando não há vínculo', !B3.$('#bc_sim') && B3.w.eval('S.st.lanc.length') === 2);
    const C3 = await abreCom(RESP([M1])); C3.w.eval(manual); C3.w.eval(manual); await atualiza(C3);
    t('ambíguo: aparece e não vincula', /ambíguo/.test(fundo(C3).textContent) && !C3.d.querySelector('.bc-vin') && C3.$('#bc_ok').disabled === true);
    const D3 = await abreCom(RESP([M1, M2])); D3.w.eval(manual); D3.w.eval(`S.lancar({tipo:'entrada',valor:'300',desc:'Pix recebido',cat:'Outros',data:'${M2.data}',forma:'Pix'})`); await atualiza(D3);
    D3.click('#bc_ok'); await tick(5);
    t('resumo: plural', /Vai atualizar 2 lançamentos existentes só com a conta\./.test(D3.$('#conf_d').textContent) && !/importar/.test(D3.$('#conf_d').textContent));
    D3.click('#bc_sim'); await tick(10); t('resumo: mensagem só de vínculo', /2 lançamentos vinculados à conta\./.test(msg(D3)) && !/importado/.test(msg(D3)));
  }
  /* pluggy-2: marcas */
  {
    const S1 = { id: 's1', conta: 'c1', data: mes + '-02', desc: 'Pix enviado', valor: -100, tipo: 'DEBIT', status: 'POSTED' }, S2 = { id: 's2', conta: 'c2', data: mes + '-02', desc: 'Pix recebido', valor: 100, tipo: 'CREDIT', status: 'POSTED' };
    const F = { id: 'f1', conta: 'c1', data: mes + '-03', desc: 'Pagamento de fatura', valor: -500, tipo: 'DEBIT', status: 'POSTED' };
    const A = await abreCom(RESP([S1, S2, F, M1])); await atualiza(A);
    t('marca: entre suas contas, desmarcado', /entre suas contas/.test(linhas(A)[0].textContent) && /entre suas contas/.test(linhas(A)[1].textContent) && !caixa(A, 0).checked && !caixa(A, 1).checked);
    t('marca: fatura com razão', /pagamento de fatura/.test(linhas(A)[2].textContent) && /duas vezes/.test(linhas(A)[2].textContent) && !caixa(A, 2).checked);
    t('marca: o resto segue marcado', caixa(A, 3).checked && /1 de 4 selecionados/.test(fundo(A).textContent));
    t('marca: nada escondido, dá para marcar', !caixa(A, 0).disabled && !caixa(A, 2).disabled);
    marca(A, 2, true); A.click('#bc_ok'); await tick(10);
    t('marca: o dono pode importar mesmo assim', A.w.eval('S.st.lanc.length') === 2 && A.w.eval('S.st.lanc').some(l => l.idExterno === 'f1'));
  }
  /* pluggy-3: fora dos gastos, sem tocar no caixa */
  {
    const D1 = mes + '-01';
    const L = (id, cat, valor, x) => ({ id, data: D1, desc: 'Item ' + id, cat, valor, forma: 'Pix', essencial: false, lazer: false, ...(x || {}) });
    const base = [L(1, 'Outros', 9100), L(2, 'Mercado', 300), L(3, 'Comida', 600)];
    const comN = base.map(l => l.id === 1 ? { ...l, neutro: true } : l);
    const barras = A => [...A.d.querySelectorAll('.bar')];
    const quebra = async (lanc, extra) => { const A = await abreCom(RESP([]), { tf_lanc3: lanc, ...(extra || {}) }); await A.ir('hoje'); await tick(10); return A; };
    const A = await quebra(base), B9 = await quebra(comN);
    const ct = X => JSON.stringify(X.w.eval('catTotals()'));
    t('quebra: sem a marca, o item pesa 91%', /Outros[\s\S]*91%/.test(A.w.eval('catBars()')));
    t('quebra: com a marca, ele sai', !/Outros/.test(B9.w.eval('catBars()')));
    t('quebra: percentuais refeitos', /Comida[\s\S]*67%/.test(B9.w.eval('catBars()')) && /Mercado[\s\S]*33%/.test(B9.w.eval('catBars()')));
    t('total do mês: sem o item', A.w.eval('gastoDoMes()') === 10000 && B9.w.eval('gastoDoMes()') === 900);
    t('categorias: valores certos', ct(B9) === JSON.stringify([['Comida', 600], ['Mercado', 300]]));
    const o = async (lanc, sel) => { const X = await abreCom(RESP([]), { tf_lanc3: lanc }); await X.ir('orcamento'); await tick(10); return X; };
    const O1 = await o(comN); t('Orçamento: fora do total', !/9\.100/.test(O1.texto()));

    /* Faixa do mês: dia só com o item marcado fica sem cor */
    const so = [L(1, 'Outros', 9100, { neutro: true })], Fx = await quebra(so), dia = Fx.d.querySelector('.c[data-d="1"]');
    t('Faixa: dia sem gasto fica sem cor', !/color-mix/.test(dia.getAttribute('style') || '') && !/gasto/.test(dia.getAttribute('title')));
    const Fy = await quebra([L(1, 'Outros', 100)]);
    t('Faixa: dia com gasto segue com cor', /color-mix/.test(Fy.d.querySelector('.c[data-d="1"]').getAttribute('style')) && /gasto/.test(Fy.d.querySelector('.c[data-d="1"]').getAttribute('title')));
    const Fi = await quebra([L(1, 'Outros', 9100, { neutro: true }), L(2, 'Mercado', 50)]);
    t('Faixa: intensidade ignora o item', /100%/.test(Fi.d.querySelector('.c[data-d="1"]').getAttribute('style')));
    Fx.w.eval('diaDetalhe(1)'); await tick(5);
    t('detalhe do dia: o item aparece, com a etiqueta', /Item 1/.test(Fx.$('#diadet').textContent) && /não é gasto/.test(Fx.$('#diadet').textContent));

    /* alertas de gasto */
    const teto = A.w.eval('DEMO.tetoLazer'), acima = teto + 500;
    const Z1 = await quebra([L(5, 'Jogos', acima, { lazer: true })]), Z2 = await quebra([L(5, 'Jogos', acima, { lazer: true, neutro: true })]);
    t('alerta: lazer acima do teto aparece sem a marca', /lazer passou do teto/.test(Z1.texto()));
    t('alerta: com a marca, some', !/lazer passou do teto/.test(Z2.texto()));
    t('lazer: valor restante ignora o item', Z2.w.eval('lazerGasto()') === 0 && Z1.w.eval('lazerGasto()') === acima);
    const Z3 = await abreCom(RESP([]), { tf_lanc3: [L(5, 'Jogos', acima, { lazer: true, neutro: true })] }); await Z3.ir('lancar'); await tick(10);
    t('Lançar: resumo do lazer ignora o item', !/passou/.test(Z3.$('#lz_resumo').textContent));
    const ini = () => { const r = REALFX(); r._inicio = { renda: 3000, fixos: 2000, saldo: 800 }; return r; };
    const P1 = await abreCom(RESP([]), { tf_real: ini(), tf_lanc3: [L(9, 'Outros', 1500)] }), P2 = await abreCom(RESP([]), { tf_real: ini(), tf_lanc3: [L(9, 'Outros', 1500, { neutro: true })] });
    await P1.ir('hoje'); await P2.ir('hoje'); await tick(10);
    t('primeiros passos: alerta de sobra sem a marca', /passaram da sobra/.test(P1.texto()));
    t('primeiros passos: com a marca, some', !/passaram da sobra/.test(P2.texto()));

    /* caixa, saldo e previsão */
    const vis = async lanc => { const X = await abreCom(RESP([]), { tf_lanc3: lanc }); await X.ir('hoje'); await tick(10); const cx = X.$('.big.hero').textContent; await X.ir('futuro'); await tick(10); return JSON.stringify({ demo: X.w.eval('JSON.stringify(DEMO)'), cx, liq: X.w.eval('S.st.real.liquidez'), base: X.w.eval("DEMO.cenarios['Base']") }); };
    const mix = [L(1, 'Mercado', 9100), L(2, 'Mercado', 300), L(3, 'Comida', 600)];
    t('caixa e previsão: idênticos antes e depois da marca', await vis(mix) === await vis(mix.map(l => l.id === 1 ? { ...l, neutro: true } : l)));
    t('caixa e previsão: idênticos também em Outros', await vis(base) === await vis(comN));
    const Ca = await quebra(base), Cb = await quebra(comN);
    t('saúde: caixa de Hoje igual', Ca.$('.big.hero').textContent === Cb.$('.big.hero').textContent);
  }
  /* pluggy-3: formulário e linha */
  {
    const D1 = mes + '-01', A = await abreCom(RESP([]), { tf_lanc3: [{ id: 1, data: D1, desc: 'Reserva inventada', cat: 'Outros', valor: 50, forma: 'Pix', essencial: false, lazer: false }] });
    await A.ir('lancar'); await tick(15);
    const c = A.$('#f_neu');
    t('formulário: caixa com texto', !!c && /Não é gasto \(transferência entre suas contas ou reserva\)/.test(c.closest('label').textContent));
    t('formulário: começa desmarcada', c.checked === false);
    A.click(A.d.querySelector('#lista [data-ed]')); await tick(10);
    A.$('#f_neu').checked = true; A.$('#f_neu').dispatchEvent(new A.w.Event('change', { bubbles: true }));
    t('formulário: resumo em texto', /Não é gasto/.test(A.$('#clas_txt').textContent));
    A.click('#f_ok'); await tick(10);
    t('editar: grava', A.w.eval('S.st.lanc[0].neutro') === true);
    t('linha: etiqueta em texto', /não é gasto/.test(A.d.querySelector('#lista tr:nth-child(2)').textContent));
    t('formulário: limpa depois de salvar', A.$('#f_neu').checked === false);
    A.click(A.d.querySelector('#lista [data-ed]')); await tick(10);
    t('editar: volta marcada', A.$('#f_neu').checked === true);
    A.$('#f_neu').checked = false; A.click('#f_ok'); await tick(10);
    t('editar: desmarcar tira', !('neutro' in A.w.eval('S.st.lanc[0]')) && !/não é gasto/.test(A.$('#lista').textContent));
    A.set('#f_valor', '12'); A.set('#f_desc', 'Nova'); A.$('#f_neu').checked = true; A.click('#f_ok'); await tick(10);
    t('novo lançamento: pode nascer marcado', A.w.eval('S.st.lanc').find(l => l.desc === 'Nova').neutro === true);
    const P = await abrir({ tf_modo: 'real', tf_real: REALFX(), tf_lanc3: [] }, { largura: 1280 }); await P.ir('lancar'); await tick(15);
    t('PC: a caixa existe', !!P.$('#f_neu'));
  }
  /* pluggy-3: prévia */
  {
    const R = { id: 'r1', conta: 'c1', data: mes + '-02', desc: 'Guardar na caixinha', valor: -500, tipo: 'DEBIT', status: 'POSTED' };
    const manualR = "S.lancar({tipo:'gasto',valor:'500',desc:'guardar na caixinha',cat:'Outros',data:'" + R.data + "',forma:'Pix'})", manualP = "S.lancar({tipo:'gasto',valor:'12,50',desc:'padaria exemplo',cat:'Comida',data:'" + M1.data + "',forma:'Pix'})";
    const A = await abreCom(RESP([R, M1])); A.w.eval(manualR); A.w.eval(manualP); await atualiza(A);
    t('prévia: rótulo diz que marca', /Vincular conta e marcar como não é gasto/.test(fundo(A).textContent));
    const f0 = foto2(A), l0 = JSON.stringify(A.w.eval('S.st.lanc')); A.click('#bc_ok'); await tick(5);
    t('resumo: conta os marcados', /Vai atualizar 2 lançamentos existentes só com a conta\. 1 será marcado como não é gasto\. Nada mais muda\./.test(A.$('#conf_d').textContent));
    t('resumo: foco em Cancelar', A.d.activeElement === A.$('#bc_vt'));
    A.click('#bc_vt'); await tick(5);
    t('resumo: cancelar não grava', foto2(A) === f0 && JSON.stringify(A.w.eval('S.st.lanc')) === l0);
    A.click('#bc_ok'); await tick(5); A.click('#bc_sim'); await tick(15);
    const ls = A.w.eval('S.st.lanc'), r = ls.find(l => l.desc === 'guardar na caixinha'), p = ls.find(l => l.desc === 'padaria exemplo');
    t('vincular: neutro só no marcado', r.neutro === true && !('neutro' in p));
    t('vincular: valor, data, descrição, categoria e forma iguais', r.valor === 500 && r.data === R.data && r.cat === 'Outros' && r.forma === 'Pix');
    t('vincular: mensagem', /1 marcado como não é gasto/.test(msg(A)));
    await atualiza(A);
    t('segunda rodada: nada a fazer', !A.d.querySelector('.bc-vin') && A.$('#bc_ok').disabled === true);
    A.click('#bc_cancel');
    const B4 = await abreCom(RESP([R]), { tf_lanc3: [{ id: 5, data: R.data, desc: 'guardar na caixinha', cat: 'Outros', valor: 500, forma: 'Pix', essencial: false, lazer: false, origem: 'pluggy', idExterno: 'r1', contaId: 'c1', contaNome: 'Conta' }] }); await atualiza(B4);
    t('já ligado: rótulo próprio', /Marcar como não é gasto/.test(B4.d.querySelector('.bc-vin').textContent) && !/Vincular conta/.test(B4.d.querySelector('.bc-vin').textContent));
    const c1 = B4.d.querySelector('.bc-vin input'); c1.checked = false; c1.dispatchEvent(new B4.w.Event('change', { bubbles: true })); await tick(5);
    t('já ligado: desligar não grava nada', B4.$('#bc_ok').disabled === true);
    c1.checked = true; c1.dispatchEvent(new B4.w.Event('change', { bubbles: true })); B4.click('#bc_ok'); await tick(5); B4.click('#bc_sim'); await tick(10);
    t('já ligado: ganha a marca', B4.w.eval('S.st.lanc[0].neutro') === true && B4.w.eval('S.st.lanc[0].contaNome') === 'Conta');
    const C = await abreCom(RESP([R])); await atualiza(C); marca(C, 0, true); C.click('#bc_ok'); await tick(10);
    t('importar marcado: entra como não é gasto', C.w.eval('S.st.lanc[0].neutro') === true);
    const T = { id: 'r2', conta: 'c1', data: mes + '-02', desc: 'Guardar na caixinha', valor: -500, tipo: 'DEBIT', status: 'POSTED' };
    const D = await abreCom(RESP([T])); D.w.eval(manualR); D.w.eval(manualR); await atualiza(D);
    t('ambíguo: não marca', /ambíguo/.test(fundo(D).textContent) && !D.d.querySelector('.bc-vin'));
  }
  /* pluggy-4 */
  {
    const D2 = mes + '-02', D3 = mes + '-03', C = (id, desc, valor, data) => ({ id, conta: 'c1', data: data || D2, desc, valor, tipo: valor < 0 ? 'DEBIT' : 'CREDIT', status: 'POSTED' });
    const man = (d, v, dt) => "S.lancar({tipo:'gasto',valor:'" + v + "',desc:'" + d + "',cat:'Comida',data:'" + (dt || D2) + "',forma:'Pix'})";
    const A = await abreCom(RESP([C('b1', 'Lanchonete Exemplo', -21.14), C('b2', 'Farmácia Exemplo', -60.21, D3), C('b3', 'Dinheiro reservado Viagem', -300, D3)])); A.w.eval(man('almoço com colega', '21,14')); await atualiza(A);
    const lin = linhas(A);
    t('duplicado: etiqueta e descrição existente', /possível duplicado/.test(lin[0].textContent) && /Já existe: almoço com colega/.test(lin[0].textContent));
    t('duplicado: desmarcado', !caixa(A, 0).checked && !caixa(A, 0).disabled);
    const vd = A.d.querySelector('[data-d]');
    t('duplicado: caixa explícita, desligada', !!vd && vd.checked === false && /Vincular a este lançamento/.test(vd.closest('label').textContent));
    t('reserva: marcada e fora de marcados', /entre suas contas/.test(lin[2].textContent) && !caixa(A, 2).checked);
    const R = () => A.$('#bc_res').textContent;
    t('topo: resumo antes de confirmar', R() === '0 lançamentos serão atualizados, 0 marcados como não é gasto, 1 possível duplicado.');
    t('topo: anunciado', A.$('#bc_res').getAttribute('role') === 'status' && A.$('#bc_res').closest('.bc-prev') !== null);
    const f0 = foto2(A), l0 = JSON.stringify(A.w.eval('S.st.lanc'));
    vd.checked = true; vd.dispatchEvent(new A.w.Event('change', { bubbles: true })); await tick(5);
    t('topo: acompanha a escolha', R() === '1 lançamento será atualizado, 0 marcados como não é gasto, 1 possível duplicado.');
    t('contagem: para vincular', /1 para vincular/.test(A.$('#bc_cont').textContent));
    A.click('#bc_ok'); await tick(5);
    t('resumo: pede confirmação com foco em Cancelar', A.d.activeElement === A.$('#bc_vt') && /Vai atualizar 1 lançamento existente só com a conta/.test(A.$('#conf_d').textContent));
    A.click('#bc_vt'); await tick(5);
    t('cancelar: nada gravado', foto2(A) === f0 && JSON.stringify(A.w.eval('S.st.lanc')) === l0);
    A.click('#bc_ok'); await tick(5); A.click('#bc_sim'); await tick(15);
    const l = A.w.eval('S.st.lanc').find(x => x.desc === 'almoço com colega');
    t('vincular: só conta e origem', l.contaId === 'c1' && l.origem === 'pluggy' && l.idExterno === 'b1' && l.valor === 21.14 && l.cat === 'Comida' && !('neutro' in l));
    t('vincular: não cria lançamento do item', !A.w.eval('S.st.lanc').some(x => x.desc === 'Lanchonete Exemplo'));
    t('vincular: importou o outro', A.w.eval('S.st.lanc').some(x => x.idExterno === 'b2'));
    await atualiza(A);
    t('segunda rodada: sem duplicado', !A.d.querySelector('[data-d]') && /0 possíveis duplicados/.test(A.$('#bc_res').textContent));
    A.click('#bc_cancel');
    const B5 = await abreCom(RESP([C('b1', 'Lanchonete Exemplo', -21.14)])); B5.w.eval(man('um', '21,14')); B5.w.eval(man('dois', '21,14')); await atualiza(B5);
    t('ambíguo: sem oferta de vincular', /ambíguo/.test(linhas(B5)[0].textContent) && /possível duplicado/.test(linhas(B5)[0].textContent) && !B5.d.querySelector('[data-d]') && /Mais de um lançamento/.test(linhas(B5)[0].textContent));
    t('ambíguo: botão desligado', B5.$('#bc_ok').disabled === true);
    marca(B5, 0, true); B5.click('#bc_ok'); await tick(10);
    t('duplicado: o dono pode importar mesmo assim', B5.w.eval('S.st.lanc.length') === 3);
    const H = '<img src=x onerror=window.__xss=1>';
    const C5 = await abreCom(RESP([C('b1', 'Loja', -21.14)])); C5.w.eval("S.lancar({tipo:'gasto',valor:'21,14',desc:" + JSON.stringify(H) + ",cat:'Comida',data:'" + D2 + "',forma:'Pix'})"); await atualiza(C5);
    t('duplicado: descrição hostil literal', !fundo(C5).querySelector('img') && fundo(C5).textContent.includes(H) && C5.w.__xss === undefined);
    const D5 = await abreCom(RESP([C('b1', 'Lanchonete', -21.14)])); D5.w.eval(man('um', '21,14')); await atualiza(D5);
    const v2 = D5.d.querySelector('[data-d]'); v2.checked = true; v2.dispatchEvent(new D5.w.Event('change', { bubbles: true })); marca(D5, 0, true); await tick(5);
    t('duplicado: marcar para importar tira do vínculo', !/para vincular/.test(D5.$('#bc_cont').textContent));
  }
  /* pluggy-4: pagamento de fatura, os dois lados */
  {
    const FA = { id: 'fa', conta: 'c1', data: mes + '-03', desc: 'Pagamento de fatura', valor: -500, tipo: 'DEBIT', status: 'POSTED' };
    const FK = { id: 'fk', conta: 'c2', data: mes + '-03', desc: 'PAGAMÉNTO Recebido', valor: 500, tipo: 'CREDIT', status: 'POSTED' };
    const BK = { id: 'bk', conta: 'c1', data: mes + '-04', desc: 'Pagamento recebido', valor: 80, tipo: 'CREDIT', status: 'POSTED' };
    const lin = (A, d) => linhas(A).find(l => l.textContent.toLowerCase().includes(d));
    const cx = (A, d) => lin(A, d).querySelector('input[data-i]');
    const liga = (A, d) => { const c = cx(A, d); c.checked = true; c.dispatchEvent(new A.w.Event('change', { bubbles: true })); };
    const A = await abreCom(RESP([FA, FK, BK])); await atualiza(A);
    t('fatura: conta com etiqueta e caixa desligada', /pagamento de fatura/.test(lin(A, 'pagamento de fatura').textContent) && !cx(A, 'pagamento de fatura').checked);
    t('fatura: cartão com não é gasto e caixa desligada', /não é gasto/.test(lin(A, 'pagaménto').textContent) && !/entre suas contas/.test(lin(A, 'pagaménto').textContent) && !cx(A, 'pagaménto').checked);
    t('fatura: entrada em conta comum sem etiqueta', !/não é gasto|entre suas contas|possível duplicado/.test(lin(A, 'pagamento recebido').textContent) && cx(A, 'pagamento recebido').checked);
    const g0 = A.w.eval("JSON.stringify(S.gastosMes('" + mes + "'))");
    A.click('#bc_ok'); await tick(10);
    t('fatura: caixas desligadas ficam fora', !A.w.eval('S.st.lanc').some(l => l.idExterno === 'fa' || l.idExterno === 'fk') && A.w.eval("JSON.stringify(S.gastosMes('" + mes + "'))") === g0);
    const B2 = await abreCom(RESP([FA, FK])); await atualiza(B2);
    liga(B2, 'pagamento de fatura'); liga(B2, 'pagaménto'); await tick(5);
    B2.click('#bc_ok'); await tick(10);
    const ls = B2.w.eval('S.st.lanc'), f = id => ls.find(l => l.idExterno === id);
    t('fatura: os dois lados entram como não é gasto', f('fa') && f('fk') && f('fa').neutro === true && f('fk').neutro === true);
    t('fatura: nenhum dos dois conta como gasto', !B2.w.eval("S.gastosMes('" + mes + "')").some(l => l.idExterno === 'fa' || l.idExterno === 'fk'));
  }
  /* pluggy-8: os valores do banco atualizam sozinhos ao abrir o app e ao voltar para ele */
  {
    const n = 'automático: ';
    const abre = async (corpo, extra, f) => { const ch = []; const A = await abrir({ ...LIGADO(), tf_banco_url: URLOK, ...(extra || {}) }, { ...larg, fetch: f ? f(ch) : ponte(corpo, ch) }); await tick(80); A.chamadas = ch; return A; };
    const volta = async A => { A.d.dispatchEvent(new A.w.Event('visibilitychange')); await tick(80); };
    const snap = A => A.w.eval('JSON.stringify(S.st.banco||null)');
    const A = await abre(RESP([M1, M3]));
    const corpo = JSON.parse(A.chamadas[0].o.body);
    t(n + 'abrir o app chama a ponte uma vez', A.chamadas.length === 1 && A.chamadas[0].u === URLOK);
    t(n + 'mesmo pedido do botão (token só no corpo, 35 dias, tipo access)', corpo.token === TOKEN && corpo.dias === 35 && corpo.tipo === 'access' && !A.chamadas[0].u.includes(TOKEN));
    const b = JSON.parse(snap(A));
    t(n + 'guarda os valores do banco', !!b && b.contas.some(c => c.id === 'c1' && c.saldo === 100.5) && Date.now() - b.em < 5000 && !!A.ls('tf_bsnap'));
    t(n + 'fica no Hoje, sem prévia e sem aviso', A.w.eval('atual') === 'hoje' && !fundo(A) && !A.$('#bc_msg') && !A.d.querySelector('.conf'));
    t(n + 'não importa movimento nenhum', A.w.eval('S.st.lanc').every(l => !l.idExterno) && A.w.localStorage.getItem('tf_banco_ids') === null);
    t(n + 'sem erro de script', A.erros.length === 0);
    await volta(A);
    t(n + 'voltar ao app antes de 5 minutos não chama de novo', A.chamadas.length === 1);
    A.w.eval('bancoAutoT=Date.now()-' + (5 * 60000 - 2000)); await volta(A);
    t(n + 'a 2 segundos dos 5 minutos ainda não', A.chamadas.length === 1);
    A.w.eval('bancoAutoT=Date.now()-' + (5 * 60000 + 1000)); await volta(A);
    t(n + 'passados 5 minutos, voltar ao app chama de novo', A.chamadas.length === 2);
    Object.defineProperty(A.d, 'hidden', { value: true, configurable: true }); A.w.eval('bancoAutoT=0'); await volta(A);
    t(n + 'app escondido não chama', A.chamadas.length === 2);
    /* a tela é redesenhada com o valor novo, menos onde há algo sendo digitado */
    const C = await abre(RESP([M1]));
    const em0 = JSON.parse(snap(C)).em;
    await C.ir('lancar'); const campo = C.$('main input'); campo.value = 'rascunho'; C.w.eval('window.__marca=document.querySelector("main")');
    C.w.eval('bancoAutoT=0'); await tick(5); await volta(C);
    t(n + 'no Lançar: atualiza os valores sem redesenhar a tela', C.chamadas.length === 2 && JSON.parse(snap(C)).em > em0 && C.$('main input') === campo && campo.value === 'rascunho');
    await C.ir('banco'); C.set('#bc_url', URLOK + '?x'); C.w.eval('bancoAutoT=0'); await volta(C);
    t(n + 'na tela da conexão: não redesenha', C.chamadas.length === 3 && C.$('#bc_url').value === URLOK + '?x');
    await C.ir('cartao'); const antes = C.$('main').firstElementChild; C.w.eval('bancoAutoT=0'); await volta(C);
    t(n + 'no Cartão: redesenha com os valores novos', C.chamadas.length === 4 && C.$('main').firstElementChild !== antes && C.w.eval('atual') === 'cartao');
    await C.ir('banco'); C.click('#bc_rem'); const dlg = C.d.querySelector('.conf'); await C.ir('hoje'); const h1 = C.$('main').firstElementChild; C.w.eval('bancoAutoT=0'); await volta(C);
    t(n + 'com uma confirmação aberta: não redesenha', !!dlg && C.d.querySelector('.conf') === dlg && C.$('main').firstElementChild === h1);
    /* quando não roda */
    const semUrl = await abre(RESP([M1]), { tf_banco_url: null });
    t(n + 'sem endereço guardado não chama', semUrl.chamadas.length === 0);
    const urlRuim = await abre(RESP([M1]), { tf_banco_url: 'https://example.com/x' }, ch => async (u, o) => { if (/example\.com/.test(u)) ch.push({ u, o }); throw new Error('sem rede'); });
    t(n + 'endereço guardado inválido não chama', urlRuim.chamadas.length === 0);
    const desl = await abre(RESP([M1]), { tf_banco_on: null });
    t(n + 'conexão desligada não chama', desl.chamadas.length === 0);
    const exp = await abre(RESP([M1]), { tf_gtoken: { v: TOKEN, exp: Date.now() - 1000 } });
    t(n + 'sessão do Google expirada não chama', exp.chamadas.length === 0);
    const semG = await abre(RESP([M1]), { tf_gtoken: null, tf_gjaconectou: null });
    t(n + 'sem conta Google não chama', semG.chamadas.length === 0);
    const demo = await abre(RESP([M1]), { tf_modo: 'demo' });
    t(n + 'modo de exemplo não chama', demo.chamadas.length === 0);
    /* falhas: calado, os últimos valores bons ficam */
    const bom = JSON.parse(snap(A)); bom.em = Date.now() - 3 * 86400000;
    for (const [nome, f] of [['sem rede', ch => async (u, o) => { if (u !== URLOK) throw new Error('sem rede'); ch.push({ u, o }); throw new TypeError('rede'); }], ['ponte recusa', ch => ponte({ ok: false, erro: 'pluggy_503' }, ch)], ['resposta que não é JSON', ch => ponte('<html>', ch)], ['resposta sem contas', ch => ponte({ ok: true, dados: { de: mes + '-01', ate: mes + '-05', movs: [] } }, ch)]]) {
      const F = await abre(null, { tf_bsnap: bom }, f);
      t(n + nome + ': chamou, não mudou os valores e não mostrou erro', F.chamadas.length === 1 && JSON.parse(snap(F)).em === bom.em && F.erros.length === 0 && !F.d.querySelector('.alerta,.conf') === !A.d.querySelector('.alerta,.conf'));
      F.w.eval('bancoAutoT=0'); await volta(F);
      t(n + nome + ': depois da falha, tenta de novo na próxima volta', F.chamadas.length === 2);
    }
    /* conexão removida enquanto a resposta não chegou */
    let solta; const lenta = ch => async (u, o) => { if (u !== URLOK) throw new Error('sem rede'); ch.push({ u, o }); await new Promise(k => { solta = k; }); return { ok: true, text: async () => JSON.stringify(RESP([M1])) }; };
    const R = await abre(null, { tf_bsnap: bom }, lenta);
    await volta(R);
    t(n + 'com um pedido em curso não abre outro', R.chamadas.length === 1);
    R.w.localStorage.removeItem('tf_banco_url'); solta(); await tick(80);
    t(n + 'conexão removida no meio: a resposta é descartada', JSON.parse(snap(R)).em === bom.em);
    /* lacunas apontadas pela prova por mutação (13/11) */
    {
      const g = n + 'limites: ';
      const G = await abre(RESP([M1]));
      await G.ir('cartao');
      for (const sel of ['bc-prev', 'menutema']) {
        const e = G.d.createElement('div'); if (sel === 'menutema') e.id = sel; else e.className = sel; G.d.body.appendChild(e);
        const m0 = G.$('main').firstElementChild, c0 = G.chamadas.length; G.w.eval('bancoAutoT=0'); await volta(G);
        t(g + 'com ' + (sel === 'menutema' ? 'o menu de temas' : 'a prévia') + ' aberto: atualiza os valores e não redesenha', G.chamadas.length === c0 + 1 && G.$('main').firstElementChild === m0);
        e.remove();
      }
      for (const tag of ['input', 'select', 'textarea']) {
        const e = G.d.createElement(tag); G.$('main').appendChild(e); e.focus();
        const c0 = G.chamadas.length; G.w.eval('bancoAutoT=0'); await volta(G);
        t(g + 'com o foco num ' + tag + ': não redesenha', G.d.activeElement === e && G.chamadas.length === c0 + 1 && e.isConnected);
        e.blur(); e.remove();
      }
      const rol = []; Object.defineProperty(G.w, 'scrollY', { value: 321, configurable: true }); G.w.scrollTo = (x, y) => rol.push([x, y]);
      const m1 = G.$('main').firstElementChild; G.w.eval('bancoAutoT=0'); await volta(G);
      t(g + 'ao redesenhar, a rolagem volta para onde estava', G.$('main').firstElementChild !== m1 && rol.length > 0 && rol[rol.length - 1][0] === 0 && rol[rol.length - 1][1] === 321);
      const I = await abre(RESP([M3]), { tf_banco_inv: ['c2'] }), I0 = await abre(RESP([M3]));
      t(g + 'usa a escolha de sinal guardada neste aparelho', I.w.eval('S.st.banco.movs.c2[0][1]') === -45.9 && I0.w.eval('S.st.banco.movs.c2[0][1]') === 45.9);
      let solta2; const lenta2 = ch => async (u, o) => { if (u !== URLOK) throw new Error('sem rede'); ch.push({ u, o }); await new Promise(k => { solta2 = k; }); return { ok: true, text: async () => JSON.stringify(RESP([M1])) }; };
      const D = await abre(null, { tf_bsnap: bom }, lenta2);
      D.w.localStorage.setItem('tf_banco_on', 'false'); solta2(); await tick(80);
      t(g + 'conexão desligada no meio (endereço mantido): a resposta é descartada', D.chamadas.length === 1 && JSON.parse(snap(D)).em === bom.em);
    }
    /* texto da tela */
    await A.ir('banco');
    t(n + 'a tela diz o que roda sozinho', /Os valores do banco atualizam ao abrir o app\. Importar movimentos, só quando você pedir\./.test(A.texto()) && !/Só atualiza quando você pedir/.test(A.texto()));
  }
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
