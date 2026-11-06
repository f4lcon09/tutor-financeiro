/* Aviso de mês incompleto na tela Hoje. A fórmula do valor por dia não muda e o saldo não entra. Só valores inventados. */
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const { t, fim } = contador('mês incompleto');

const NOTA = 'Esse valor conta só o que você lançou desde que começou. Se já gastou algo neste mês antes disso, adicione e ele fica mais certo.';
const memoria = () => { const o = {}; return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: k => { delete o[k]; }, key: i => Object.keys(o)[i], get length() { return Object.keys(o).length; }, _o: o }; };
/* o Date da janela começa na data escolhida e continua andando */
const relogio = iso => w => { const R = w.Date, alvo = new R(iso).getTime(), d0 = R.now(), agora = () => alvo + (R.now() - d0); class D extends R { constructor(...a) { if (a.length) super(...a); else super(agora()); } static now() { return agora(); } } w.Date = D; };
const abre = (m, iso, extra) => abrir({}, { storage: m, antes: relogio(iso), ...(extra || {}) });
const comeca = async (m, iso, saldo, extra) => {
  const A = await abre(m, iso, extra);
  A.set('#ini_renda', '5000'); A.set('#ini_fixos', '3000'); A.set('#ini_saldo', saldo || '1500'); A.click('#ini_ok'); await tick(10);
  return abre(m, iso, extra);
};
const valor = A => A.$('main .big').textContent.replace(/\s+/g, ' ').trim();
const temNota = A => A.texto().includes('Esse valor conta só o que você lançou');

(async () => {
  /* Começou no dia 1 */
  {
    const m = memoria(), A = await comeca(m, '2026-11-01T12:00:00');
    t('dia 1: sem aviso', !temNota(A) && !A.$('#mi_add') && !A.$('#mi_ok'));
    t('dia 1: nenhuma marca guardada', !('mes_incompleto' in JSON.parse(m.getItem('tf_real'))._inicio));
    const B = await abre(m, '2026-11-20T12:00:00');
    t('dia 1: continua sem aviso mais tarde no mês', !temNota(B));
  }
  /* Começou no dia 15 */
  {
    const m = memoria(), A = await comeca(m, '2026-11-15T12:00:00');
    t('dia 15: guarda a marca do mês', JSON.parse(m.getItem('tf_real'))._inicio.mes_incompleto === '2026-11');
    t('dia 15: aviso com o texto combinado', A.$('#mi_nota').textContent === NOTA);
    t('dia 15: valor com ~ e a mesma conta', valor(A) === '~R$ 125');
    t('dia 15: dois botões', A.$('#mi_add').textContent === 'Adicionar o que já gastei' && A.$('#mi_ok').textContent === 'Já lancei tudo');
    t('dia 15: o aviso fica junto do valor', A.$('#mi_nota').closest('.pn') === A.$('main .big').closest('.pn'));
    t('dia 15: sem erro de script', A.erros.length === 0);

    A.click('#mi_add'); await tick(20);
    const dt = A.$('#f_data');
    t('adicionar: abre Lançar', !!dt && /Lançamentos|Novo lançamento/.test(A.texto()));
    t('adicionar: data editável', !dt.disabled && !dt.readOnly);
    t('adicionar: limitada ao mês atual', dt.min === '2026-11-01' && dt.max === '2026-11-15');
    A.set('#f_valor', '160'); A.set('#f_desc', 'Compra anterior inventada'); A.set('#f_data', '2026-11-03'); A.click('#f_ok'); await tick(20);
    t('adicionar: salva na data escolhida', A.w.eval('S.st.lanc.find(l=>l.desc==="Compra anterior inventada").data') === '2026-11-03');
    await A.ir('hoje');
    t('adicionar: o valor por dia desce', valor(A) === '~R$ 115');
    t('adicionar: o aviso continua até a pessoa dizer que acabou', temNota(A));

    A.click('#mi_ok'); await tick(20);
    t('já lancei tudo: o aviso some', !temNota(A) && !A.$('#mi_add'));
    t('já lancei tudo: a marca sai', !('mes_incompleto' in JSON.parse(m.getItem('tf_real'))._inicio));
    t('já lancei tudo: o valor não muda', valor(A) === '~R$ 115');
    const B = await abre(m, '2026-11-16T12:00:00');
    t('já lancei tudo: reabrir continua sem aviso', !temNota(B));
  }
  /* Celular: a data fica dentro de Mais opções */
  {
    const m = memoria(), A = await comeca(m, '2026-11-15T12:00:00', '1500', { largura: 390 });
    A.click('#mi_add'); await tick(20);
    const dt = A.$('#f_data'), caixa = dt.closest('details');
    t('celular: Mais opções abre sozinho', !!caixa && caixa.open === true);
    t('celular: data limitada ao mês', dt.min === '2026-11-01' && dt.max === '2026-11-15');
    await A.ir('hoje'); await A.ir('lancar');
    t('celular: entrar em Lançar de outro jeito não limita a data', A.$('#f_data').min === '' && A.$('#f_data').max === '');
  }
  /* Mês seguinte */
  {
    const m = memoria(); await comeca(m, '2026-11-15T12:00:00');
    const B = await abre(m, '2026-12-02T12:00:00');
    t('mês seguinte: a marca não vale mais', !temNota(B) && !B.$('#mi_add'));
    t('mês seguinte: a conta continua', /^~R\$ /.test(valor(B)));
  }
  /* Modo exemplo e quem já tinha dados */
  {
    const A = await abrir({ tf_modo: 'demo' }, { antes: relogio('2026-11-15T12:00:00') });
    t('exemplo: sem aviso', !temNota(A) && !A.$('#mi_add'));
    const B = await abrir({ tf_modo: 'real', tf_real: FICTICIO }, { antes: relogio('2026-11-15T12:00:00') });
    t('dados importados: sem aviso', !temNota(B) && !B.$('#mi_add'));
  }
  /* Olho de privacidade */
  {
    const m = memoria(); await comeca(m, '2026-11-15T12:00:00');
    m.setItem('tf_priv', 'true');
    const A = await abre(m, '2026-11-15T12:00:00');
    t('privacidade: o valor fica escondido', !/\d/.test(valor(A)) && /••/.test(valor(A)));
    t('privacidade: o aviso continua', temNota(A) && !!A.$('#mi_add') && !!A.$('#mi_ok'));
  }
  /* O saldo não entra na conta */
  {
    const a = memoria(), b = memoria(), A = await comeca(a, '2026-11-15T12:00:00', '100'), B = await comeca(b, '2026-11-15T12:00:00', '90000');
    t('saldo: não muda o valor por dia', valor(A) === valor(B) && valor(A) === '~R$ 125');
  }
  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
