/* Aplica o tema salvo antes do primeiro desenho (evita o piscar do tema errado).
   Fica fora do index.html porque a CSP não aceita script inline. O ?tema= é só para testes e não grava. */
(function () {
  var T = ['cafe', 'ameixa', 'nevoa', 'cha'], t = 'cafe';
  try {
    var v = JSON.parse(localStorage.getItem('tf_tema'));
    var q = new URLSearchParams(location.search).get('tema');
    t = T.indexOf(q) >= 0 ? q : v === 'light' ? 'nevoa' : T.indexOf(v) >= 0 ? v : 'cafe';
  } catch (e) { t = 'cafe'; }
  document.documentElement.setAttribute('data-theme', t);
})();
