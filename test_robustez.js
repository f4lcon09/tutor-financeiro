/* Robustez (bugs-1): armazenamento cheio ao salvar. Só valores inventados, sem rede. */
const TFStore = require('./store.js');
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const { t, fim } = contador('Robustez');

(async () => {
  const hoje = new Date(), mes = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
  const REALFX = () => { const r = JSON.parse(JSON.stringify(FICTICIO)); r._meta.as_of = mes + '-01'; return r; };
  const semRede = () => Promise.reject(new TypeError('sem rede no teste'));
  /* armazenamento em memória que pode "encher": setItem lança QuotaExceededError enquanto cheio */
  const armazem = ini => {
    const mapa = new Map(), ctl = { cheio: false, mapa };
    Object.keys(ini || {}).forEach(k => mapa.set(k, JSON.stringify(ini[k])));
    ctl.st = { getItem: k => mapa.has(k) ? mapa.get(k) : null, setItem: (k, v) => { if (ctl.cheio) { const e = new Error('cota'); e.name = 'QuotaExceededError'; throw e; } mapa.set(k, String(v)); },
      removeItem: k => mapa.delete(k), clear: () => mapa.clear(), key: i => [...mapa.keys()][i] || null, get length() { return mapa.size; } };
    return ctl;
  };
  const msg = A => ((A.$('#f_msg') || {}).textContent || '').trim();
  const lancar = async (A, valor, desc) => { A.set('#f_valor', valor); A.set('#f_desc', desc); A.click('#f_ok'); await tick(30); };
  const lancs = ctl => (JSON.parse(ctl.mapa.get('tf_lanc3') || '[]'));

  /* 1. store: gravar devolve se gravou e a falha fica marcada até a pergunta */
  {
    const ctl = armazem({}), S = TFStore.criarStore(ctl.st, () => new Date(2026, 10, 9, 12)), fg = () => typeof S.falhouGravar === 'function' ? S.falhouGravar() : null;
    t('store: sem falha, falhouGravar é false', fg() === false);
    ctl.cheio = true; S.definirModo('real');
    t('store: com o armazenamento cheio, falhouGravar é true', fg() === true);
    t('store: a pergunta zera a marca', fg() === false);
    ctl.cheio = false; S.definirModo('demo');
    t('store: gravou de novo, sem marca', fg() === false && ctl.mapa.get('tf_modo') === '"demo"');
  }

  /* 2. tela Lançar com o armazenamento cheio: avisa e não diz "Salvo." */
  {
    const ctl = armazem({ tf_modo: 'real', tf_real: REALFX(), tf_lanc3: [] });
    const A = await abrir({}, { largura: 390, storage: ctl.st, fetch: semRede });
    await A.ir('lancar');
    await lancar(A, '12.34', 'Lanche inventado');
    t('normal: "Salvo." e o lançamento fica guardado', msg(A).endsWith('Salvo.') && lancs(ctl).length === 1);
    ctl.cheio = true;
    await lancar(A, '45.60', 'Mercado inventado');
    const m = msg(A), al = A.$('#f_msg [role="alert"]');
    t('cheio: mensagem de que não conseguiu guardar', m.includes('Não consegui guardar neste aparelho') && m.includes('some se a página for recarregada'), m);
    t('cheio: o aviso é role="alert" e não diz "Salvo."', !!al && !m.includes('Salvo.'));
    t('cheio: nada novo foi guardado', lancs(ctl).length === 1);
    ctl.cheio = false;
    await lancar(A, '7.89', 'Café inventado');
    t('voltou a gravar: "Salvo." de novo (a falha antiga não fica presa)', msg(A).endsWith('Salvo.') && lancs(ctl).length === 3);
    /* falha de outra gravação, antes do toque: o aviso fala só do toque em Salvar */
    ctl.cheio = true; A.w.eval("S.definirModo('real')"); ctl.cheio = false;
    await lancar(A, '3.21', 'Pão inventado');
    t('falha anterior de outra gravação não vira aviso falso', msg(A).endsWith('Salvo.') && lancs(ctl).length === 4);
    t('sem erros de script', A.erros.length === 0, A.erros.join(' | '));
  }

  /* 3. depois de recarregar, o que não foi guardado de fato some (é por isso que o aviso existe) */
  {
    const ctl = armazem({ tf_modo: 'real', tf_real: REALFX(), tf_lanc3: [] });
    const A = await abrir({}, { largura: 390, storage: ctl.st, fetch: semRede }); await A.ir('lancar');
    ctl.cheio = true; await lancar(A, '12.34', 'Lanche inventado');
    t('recarregar: na memória havia 1 lançamento', A.w.eval('S.st.lanc.length') === 1);
    ctl.cheio = false;
    const B = await abrir({}, { largura: 390, storage: ctl.st, fetch: semRede }); await B.ir('lancar');
    t('recarregar: depois de recarregar não há lançamento, e o aviso tinha dito isso', B.w.eval('S.st.lanc.length') === 0 && msg(A).includes('some se a página for recarregada'));
  }

  process.exit(fim());
})().catch(e => { console.error('FALHA geral', e); process.exit(1); });
