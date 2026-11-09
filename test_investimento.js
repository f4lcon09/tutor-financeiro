/* Decidir > Investimento: IR por aporte na tela, título da inflação e espaços. Só valores inventados, sem rede. */
const fs = require('fs');
const C = require('./calc.js');
const { abrir, tick, contador, FICTICIO } = require('./test_base.js');
const { t, fim } = contador('Investimento');

(async () => {
  const hoje = new Date(), iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const mesHoje = iso(hoje).slice(0, 7), mesPassado = iso(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)), ontem = iso(new Date(hoje.getTime() - 86400000));
  const REALFX = () => { const r = JSON.parse(JSON.stringify(FICTICIO)); r._meta.as_of = mesHoje + '-01'; return r; };
  const REAL = extra => ({ tf_modo: 'real', tf_real: REALFX(), ...(extra || {}) });
  const CACHE = () => ({ 4389: { valor: 14.9, dataRef: ontem, fetchedAt: Date.now() }, 13522: { valor: 4.68, dataRef: mesPassado, fetchedAt: Date.now() } });
  const pedidos = [], semRede = async u => { pedidos.push(String(u)); throw new TypeError('sem rede no teste'); };
  const inv = async A => { await A.ir('decidir'); A.click('#ctab_inv'); await tick(40); };
  const brl0 = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const linhas = A => [...A.$('#out .kv').children].map(e => e.textContent.replace(/\s+/g, ' ').trim());
  /* as linhas são normalizadas com \s+, que troca o espaço não separável do R$; o valor esperado passa pela mesma troca */
  const valorDe = (A, rotulo) => { const l = linhas(A), i = l.findIndex(x => x.startsWith(rotulo)); return i < 0 ? null : l[i + 1]; };
  const v0 = n => brl0(n).replace(/\s+/g, ' ');

  /* conta de referência, a mesma da captura de tela do dono: 1000 agora, 200 por mês, 0,85% ao mês, 36 meses, IR ligado */
  for (const [nome, ini] of [['exemplo', { tf_modo: 'demo' }], ['real', REAL()]]) {
    const A = await abrir(ini, { fetch: semRede }); await tick(30); await inv(A);
    const r = C.investimento(1000, 200, 0.0085, 36, true, 4.5);
    t(nome + ': campos iniciais são os da conta de referência', A.$('#i_0').value === '1000' && A.$('#i_m').value === '200' && A.$('#i_i').value === '0.85' && A.$('#i_n').value === '36' && A.$('#i_ir').checked);
    t(nome + ': título "Inflação considerada (% ao ano)"', A.$('label[for="i_f"]').textContent === 'Inflação considerada (% ao ano)' && !A.texto().includes('Inflação esperada'));
    t(nome + ': linha do imposto mostra a média', linhas(A).includes('Imposto (média 16,2% sobre o ganho)') && !A.texto().includes('15,0% sobre o ganho'));
    t(nome + ': imposto R$ 249, bruto R$ 9.738', valorDe(A, 'Imposto (média') === v0(249) && valorDe(A, 'Valor bruto') === v0(9738));
    t(nome + ': líquido R$ 9.489 no destaque', A.$('#out .big').textContent === brl0(9489) && Math.round(r.liquido) === 9489);
    t(nome + ': rendimento líquido no texto', A.$('#out .res').textContent.includes('Você colocou ' + brl0(8200) + '; o resto, ' + brl0(r.liquido - 8200) + ', é rendimento líquido.'));
    t(nome + ': dinheiro de hoje usa o líquido novo', valorDe(A, 'Em dinheiro de hoje') === v0(r.real));
    /* IR desligado: a linha fica como antes */
    A.click('#i_ir'); A.$('#i_ir').checked = false; A.$('#i_ir').dispatchEvent(new A.w.Event('input', { bubbles: true })); await tick(20);
    t(nome + ': IR desligado, linha "Imposto (0,0% sobre o ganho)" e R$ 0', linhas(A).includes('Imposto (0,0% sobre o ganho)') && valorDe(A, 'Imposto (') === v0(0) && !A.texto().includes('média'));
    t(nome + ': IR desligado, destaque = bruto', A.$('#out .big').textContent === brl0(9738));
    /* outro prazo: 12 meses cai em faixas de 20% e 22,5%, média entre as duas */
    A.$('#i_ir').checked = true; A.set('#i_n', '12'); await tick(20);
    const r12 = C.investimento(1000, 200, 0.0085, 12, true, 4.5);
    t(nome + ': 12 meses, média e imposto iguais ao calc.js', linhas(A).includes('Imposto (média ' + (r12.aliquota * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '% sobre o ganho)') && valorDe(A, 'Imposto (média') === v0(r12.imposto) && r12.aliquota > 0.20 && r12.aliquota < 0.225);
    t(nome + ': sem erros de script', A.erros.length === 0);
  }
  t('exemplo e real: nenhum pedido de rede', pedidos.length === 0);

  /* a ajuda do IPCA do Banco Central continua embaixo do campo */
  { const A = await abrir(REAL({ tf_taxas: CACHE(), tf_taxas_online: true }), { fetch: semRede }); await tick(30); await inv(A);
    const campo = A.$('#i_f').closest('.field');
    t('com IPCA guardado: título novo e ajuda do Banco Central no mesmo campo', campo.querySelector('label').textContent === 'Inflação considerada (% ao ano)' && /^IPCA de 12 meses até \d{2}\/\d{4}, do Banco Central\. Troque se quiser\.$/.test(campo.querySelector('.hint').textContent) && A.$('#i_f').value === '4.68'); }

  /* espaços: a linha de situação e o recolhível do gráfico */
  { const A = await abrir(REAL(), { fetch: semRede, largura: 390 }); await tick(30); await inv(A);
    const st = A.$('#i_status'), prox = st.nextElementSibling, cs = e => A.w.getComputedStyle(e);
    t('situação: 14 px abaixo, antes do próximo título', cs(st).marginBottom === '14px' && prox.classList.contains('field') && prox.querySelector('label').getAttribute('for') === 'i_0');
    const kv = A.$('#out .kv'), det = kv.nextElementSibling;
    t('celular: o recolhível do gráfico vem logo depois da última linha, com 16 px acima', kv.classList.contains('inv-kv') && det.tagName === 'DETAILS' && det.querySelector('summary').textContent === 'Gráfico: evolução do saldo' && cs(det).marginTop === '16px');
    t('o espaço é só desta tela: outras .kv sem a classe', A.$$('.kv.inv-kv').length === 1); }
  { const A = await abrir(REAL(), { fetch: semRede, largura: 1023 }); await tick(30); await inv(A);
    t('largura 1023: gráfico aberto, sem recolhível, sem margem nova', !A.$('#out details') && !!A.$('#out .inv-kv') && A.w.getComputedStyle(A.$('#out .inv-kv')).marginBottom === '0px'); }

  /* código: o texto da linha passa por esc(); o comentário marca as faixas como A Confirmar */
  const app = fs.readFileSync('app.js', 'utf8'), calc = fs.readFileSync('calc.js', 'utf8');
  t('tela: rótulo do imposto passa por esc()', /\$\{esc\('Imposto \('\+\(comIr\?'média ':''\)\+pc\(r\.aliquota,1\)\+' sobre o ganho\)'\)\}/.test(app));
  t('calc.js: faixas marcadas "A Confirmar com a Receita (fonte secundária)"', calc.includes('A Confirmar com a Receita (fonte secundária)'));
  t('sem o símbolo "≈" na tela', !app.includes('≈'));

  process.exit(fim());
})().catch(e => { console.log('ERRO NO TESTE:', e); process.exit(2); });
