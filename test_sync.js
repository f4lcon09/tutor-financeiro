const S = require('./sync.js');
let ok = 0, falhas = 0;
const t = (nome, cond) => { if (cond) ok++; else { falhas++; console.log('FALHOU: ' + nome); } };

const L = (id, valor, extra) => Object.assign({ id, data: '2026-11-03', desc: 'x', cat: 'Mercado', valor, forma: 'Pix', essencial: true, lazer: false }, extra);
const vazio = () => ({ lanc: [], pagos: {}, tetos: {}, metas: [], taxa: 0.8 });

/* 1. ida e volta do estado */
{
  const st = vazio(); st.lanc = [L(1, 10), L(2, 20)]; st.pagos = { 'a@2026-11': true }; st.tetos = { Mercado: 500 }; st.metas = [{ id: 5, nome: 'm' }];
  const it = S.atualizar(st, {}, 1000), volta = S.montar(it);
  t('ida e volta lanc', volta.lanc.length === 2 && volta.pagos['a@2026-11'] === true && volta.tetos.Mercado === 500 && volta.metas.length === 1 && volta.taxa === 0.8);
}

/* 2. dois aparelhos lançam coisas diferentes: nada se perde */
{
  const pc = S.atualizar(Object.assign(vazio(), { lanc: [L(1, 10)] }), {}, 1000);
  const cel = S.atualizar(Object.assign(vazio(), { lanc: [L(2, 20)] }), {}, 1500);
  const m = S.montar(S.juntar(pc, cel));
  t('união de lançamentos', m.lanc.length === 2);
  t('juntar é comutativo', S.igual(S.juntar(pc, cel), S.juntar(cel, pc)));
  t('juntar é idempotente', S.igual(S.juntar(pc, pc), pc));
}

/* 3. mesma edição nos dois: vence a mais recente */
{
  const base = S.atualizar(Object.assign(vazio(), { lanc: [L(1, 10)] }), {}, 1000);
  const pc = S.atualizar(Object.assign(vazio(), { lanc: [L(1, 11)] }), base, 2000);
  const cel = S.atualizar(Object.assign(vazio(), { lanc: [L(1, 12)] }), base, 3000);
  t('edição mais recente vence', S.montar(S.juntar(pc, cel)).lanc[0].valor === 12);
}

/* 4. exclusão chega ao outro aparelho e não ressuscita */
{
  const base = S.atualizar(Object.assign(vazio(), { lanc: [L(1, 10), L(2, 20)] }), {}, 1000);
  const pc = S.atualizar(Object.assign(vazio(), { lanc: [L(2, 20)] }), base, 2000);
  t('lápide criada', pc['lanc:1'].d === true);
  const juntado = S.juntar(base, pc);
  t('exclusão propaga', S.montar(juntado).lanc.length === 1);
  // celular sem mudanças recalcula a partir do juntado e não recria o item
  const cel = S.atualizar(S.montar(juntado), juntado, 5000);
  t('não ressuscita', S.montar(S.juntar(juntado, cel)).lanc.length === 1);
}

/* 5. edição posterior à exclusão no outro aparelho vence (item volta) */
{
  const base = S.atualizar(Object.assign(vazio(), { lanc: [L(1, 10)] }), {}, 1000);
  const pc = S.atualizar(vazio(), base, 2000);
  const cel = S.atualizar(Object.assign(vazio(), { lanc: [L(1, 99)] }), base, 3000);
  t('edição depois da exclusão vence', S.montar(S.juntar(pc, cel)).lanc[0].valor === 99);
}

/* 6. dados de exemplo iguais nos dois aparelhos: exclusão num aparelho vale no outro; sem alteração nada vai ao Drive */
{
  const exemplo = vazio(); exemplo.lanc = [L(1, 10), L(2, 20)];
  const base = S.baseItens(exemplo);
  const celNovo = S.semBase(S.atualizar(exemplo, base, 9000));
  t('exemplo sem alteração não vai ao Drive', Object.keys(celNovo).length === 0);
  const pcEx = vazio(); pcEx.lanc = [L(2, 20)];
  const pc = S.semBase(S.atualizar(pcEx, base, 2000));
  t('exclusão de exemplo vira lápide', pc['lanc:1'] && pc['lanc:1'].d === true && Object.keys(pc).length === 1);
  // celular, ainda com o exemplo, recebe a lápide
  const junto = S.juntar(base, pc);
  t('celular recebe a exclusão', S.montar(junto).lanc.length === 1 && S.montar(junto).lanc[0].id === 2);
}

/* 7. editar um item de exemplo e apagar depois */
{
  const exemplo = vazio(); exemplo.lanc = [L(1, 10)];
  const base = S.baseItens(exemplo);
  const ed = vazio(); ed.lanc = [L(1, 11)];
  const a = S.atualizar(ed, base, 2000);
  t('edição de exemplo vira item', a['lanc:1'].u === 2000 && a['lanc:1'].v.valor === 11);
  const b = S.atualizar(vazio(), a, 3000);
  t('lápide após edição', b['lanc:1'].d === true);
  t('celular recebe exclusão', S.montar(S.juntar(base, S.semBase(b))).lanc.length === 0);
}

/* 8. sem mudança, nada muda (sem alterar a hora) */
{
  const st = Object.assign(vazio(), { lanc: [L(1, 10)] });
  const a = S.atualizar(st, {}, 1000), b = S.atualizar(S.montar(a), a, 9000);
  t('estável sem mudanças', S.igual(a, b));
}

/* 9. números (item único) vai e volta, e a edição mais recente vence */
{
  const a = Object.assign(vazio(), { numeros: { mercado: 500 } });
  const it = S.atualizar(a, {}, 1000);
  t('numeros ida e volta', S.montar(it).numeros.mercado === 500);
  const b = Object.assign(vazio(), { numeros: { mercado: 777 } });
  const it2 = S.atualizar(b, it, 2000);
  t('numeros edição recente vence', S.montar(S.juntar(it, it2)).numeros.mercado === 777 && S.montar(S.juntar(it2, it)).numeros.mercado === 777);
}

console.log(falhas ? falhas + ' falha(s)' : 'Todos os ' + ok + ' testes de junção passaram.');
process.exit(falhas ? 1 : 0);
