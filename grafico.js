/* Gráfico de previsão (tela Futuro): cálculo puro e SVG em texto, sem DOM. Testado em node (test_grafico.js).
   Cores só por token, em CSS var. Todo texto de fora passa por esc(). */
(function (root) {
  var Seg = (typeof require === 'function' && typeof module !== 'undefined') ? require('./seguranca.js') : root.TFSeg;
  var esc = Seg.esc;
  var PX = { valor: 13, rotulo: 12, eixo: 12 };                 // no máximo três tamanhos, nunca abaixo de 12
  var M = { l: 42, r: 16, t: 4, b: 26, topo: 36, fundo: 36 };   // topo e fundo: espaço mínimo para as etiquetas dentro da área
  var PASSOS = [500, 1000, 2000, 2500, 5000];

  var largura = function (t, px) { return Math.ceil(String(t).length * px * 0.62); };
  var sobre = function (a, b, p) { p = p || 0; return a.x < b.x + b.w + p && b.x < a.x + a.w + p && a.y < b.y + b.h + p && b.y < a.y + a.h + p; };
  /* segmento contra retângulo (Liang-Barsky), com folga */
  function cruza(s, c, p) {
    p = p || 0; var x0 = c.x - p, x1 = c.x + c.w + p, y0 = c.y - p, y1 = c.y + c.h + p, dx = s.x2 - s.x1, dy = s.y2 - s.y1, t0 = 0, t1 = 1;
    var testes = [[-dx, s.x1 - x0], [dx, x1 - s.x1], [-dy, s.y1 - y0], [dy, y1 - s.y1]];
    for (var i = 0; i < 4; i++) { var a = testes[i][0], b = testes[i][1]; if (a === 0) { if (b < 0) return false; continue; } var r = b / a; if (a < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } }
    return t0 <= t1;
  }
  function segmentos(pts) { var o = []; for (var i = 1; i < pts.length; i++) o.push({ x1: pts[i - 1].x, y1: pts[i - 1].y, x2: pts[i].x, y2: pts[i].y }); return o; }

  /* eixo: de min(dados, alerta, 0) a max(dados, meta), com marcas redondas */
  function escala(valores, meta, alerta) {
    var lim = valores.filter(isFinite), lo = Math.min.apply(null, lim.concat([0])), hi = Math.max.apply(null, lim.concat([0]));
    if (meta > 0) hi = Math.max(hi, meta);
    if (alerta > 0) lo = Math.min(lo, alerta);
    var faixa = (hi - lo) || 1, base = 1, passo;
    for (var g = 0; g < 8 && !passo; g++) { for (var i = 0; i < PASSOS.length; i++) { var c = PASSOS[i] * base; if (faixa / c <= 4) { passo = c; break; } } base *= 10; }
    var a = Math.floor(lo / passo) * passo, b = Math.ceil(hi / passo) * passo, ticks = [];
    if (a === b) b = a + passo;
    for (var v = a; v <= b + passo / 2; v += passo) ticks.push(v === 0 ? 0 : v);
    return { lo: a, hi: b, passo: passo, ticks: ticks };
  }
  function fmtEixo(v) {
    if (v === 0) return '0';
    var a = Math.abs(v), s = v < 0 ? '-' : '';
    if (a >= 1000) return s + String(+(a / 1000).toFixed(1)).replace('.', ',') + ' mil';
    return s + a;
  }
  /* estado de um valor: mesma régua do app, com o alerta na frente */
  function estado(v, meta, piso, alerta, brl) {
    if (!(meta > 0)) return null;
    if (alerta > 0 && v < alerta) return { cls: 'ru', texto: 'Abaixo do alerta (' + brl(alerta) + ')' };
    if (v < piso) return { cls: 'ru', texto: 'Abaixo do piso' };
    if (v < meta) return { cls: 'at', texto: 'Entre piso e meta' };
    return { cls: 'ok', texto: 'Acima da meta' };
  }
  var TOK = { ok: 'var(--ok)', at: 'var(--at)', ru: 'var(--ru)' };
  var TRACO = {
    ok: '<path d="M-4 0.3l2.7 2.7L4.2-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    at: '<path d="M0-4.6L4.8 3.8H-4.8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M0-1.2V1M0 2.5v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    ru: '<path d="M-3.4-3.4L3.4 3.4M3.4-3.4L-3.4 3.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  };
  function iconeChip(cls) { return '<svg class="pv-ic" viewBox="-6 -6 12 12" width="14" height="14" aria-hidden="true">' + (TRACO[cls] || '') + '</svg>'; }

  /* janela de decisão: mês atual e os 3 seguintes */
  function janela(meses, ini) { var n = Math.min(4, meses.length), i = Math.max(0, Math.min(ini || 0, meses.length - n)); return { ini: i, n: n }; }

  function menor(vals) { var m = 0; vals.forEach(function (v, i) { if (v < vals[m]) m = i; }); return m; }

  /* o = {meses, base, cenario|null, meta, piso, alerta, W, H, fmt:{valor(v), curto(v)}} */
  function montar(o) {
    var W = o.W, H = o.H || 300, n = o.meses.length, ativa = o.cenario || o.base, tem = !!o.cenario;
    var todos = o.base.concat(o.cenario || []), E = escala(todos, o.meta, o.alerta);
    var P = { l: M.l, r: W - M.r, t: M.t, b: H - M.b };
    var y = function (v) { return P.b - (v - E.lo) / (E.hi - E.lo) * (P.b - P.t); };
    /* as marcas continuam redondas: se a etiqueta não couber, o eixo ganha mais um passo */
    
    for (var k = 0; k < 3 && P.b - y(Math.min.apply(null, ativa)) < M.fundo; k++) { E.lo -= E.passo; E.ticks.unshift(E.lo === 0 ? 0 : E.lo); }
    for (k = 0; k < 3 && y(ativa[ativa.length - 1]) - P.t < M.topo; k++) { E.hi += E.passo; E.ticks.push(E.hi === 0 ? 0 : E.hi); }
    while (E.ticks.length > 7) { E.ticks = E.ticks.filter(function (t, i) { return i % 2 === 0 || t === 0; }); }
    var x = function (i) { return n < 2 ? (P.l + P.r) / 2 : P.l + (P.r - P.l) * i / (n - 1); };
    var ponto = function (v, i) { return { x: x(i), y: y(v), v: v, i: i }; };
    var pb = o.base.map(ponto), pc = tem ? o.cenario.map(ponto) : null, pa = pc || pb;
    var segs = segmentos(pb).concat(pc ? segmentos(pc) : []);
    var marcas = pb.concat(pc || []).map(function (p) { return { x: p.x - 4, y: p.y - 4, w: 8, h: 8 }; });
    var caixas = [], ok = function (c, pad) {
      if (c.x < P.l - 2 || c.x + c.w > W - 2 || c.y < P.t || c.y + c.h > P.b - 1) return false;
      if (segs.some(function (s) { return cruza(s, c, pad); }) || marcas.some(function (m) { return sobre(c, m, 1); })) return false;
      return !caixas.some(function (b) { return sobre(c, b, 2); });
    };

    /* (b) ponto mais baixo: logo abaixo dele, ícone de estado e etiqueta com o valor */
    var li = menor(ativa), lp = pa[li], est = estado(lp.v, o.meta, o.piso, o.alerta, o.fmt.fixo), tb = o.fmt.valor(lp.v), wb = largura(tb, PX.valor) + 16, baixo = null;
    var ALT = 22, IC = 20, wTot = IC + 6 + wb, fimX = W - 2;
    [[0, 8], [-wTot / 2, 8], [-wTot + IC / 2, 8], [0, 22], [-wTot / 2, 22], [-wTot + IC / 2, 22], [-60, 8], [60, 8], [0, -8 - ALT], [-wTot / 2, -8 - ALT], [-wTot + IC / 2, -8 - ALT]].some(function (d) {
      var bx = Math.max(P.l - 2, Math.min(lp.x - IC / 2 + d[0], fimX - wTot)), c = { x: bx, y: lp.y + d[1], w: wTot, h: ALT };
      if (ok(c, 2)) baixo = c;
      return !!baixo;
    });
    if (baixo) { baixo.texto = tb; baixo.cls = est ? est.cls : ''; baixo.wp = wb; caixas.push(baixo); }

    /* (a) etiqueta do fim da janela: acima do último ponto, alinhada à direita */
    var ult = pa[pa.length - 1], tf = o.fmt.valor(ult.v), wf = largura(tf, PX.valor) + 16, fim = null, xf = Math.max(P.l, fimX - wf);
    [-32, -44, -56, 10, 22, 34, -70, -84, 46, 58].some(function (dy) {
      for (var bx = xf; bx >= P.l && !fim; bx -= 20) { var c = { x: bx, y: ult.y + dy, w: wf, h: ALT }; if (ok(c, 2)) fim = c; }
      return !!fim;
    });
    if (fim) { fim.texto = tf; caixas.push(fim); }

    /* divisórias e rótulos: dentro do gráfico, à esquerda, com forma própria */
    var refs = [], omitidos = [], horizontais = [o.meta, o.piso, o.alerta, 0].filter(function (v, i) { return i === 3 || v > 0; }).map(function (v) { return { x1: P.l, x2: P.r, y1: y(v), y2: y(v) }; });
    var defs = [{ tipo: 'meta', nome: 'Meta', v: o.meta, cls: 'ok' }, { tipo: 'piso', nome: 'Piso', v: o.piso, cls: 'at' }, { tipo: 'alerta', nome: 'Alerta', v: o.alerta, cls: 'ru' }];
    defs.filter(function (r) { return r.v > 0; }).forEach(function (r) {
      var ry = y(r.v), achou = null;
      [r.nome + ' ' + o.fmt.curto(r.v), r.nome].some(function (txt) {
        var w = largura(txt, PX.rotulo) + 16;
        for (var k = 0; P.l + 4 + k * 12 + w <= P.r && !achou; k++) {
          [[-16], [3], [-30], [17], [-44], [31]].some(function (dy) {
            var c = { x: P.l + 4 + k * 12, y: ry + dy[0], w: w, h: 14 };
            if (ok(c, 3) && !horizontais.some(function (l) { return cruza(l, c, 1); })) { achou = { x: c.x, y: c.y, w: c.w, h: c.h, texto: txt }; return true; } return false;
          });
        }
        return !!achou;
      });
      r.y = ry; r.caixa = achou; refs.push(r);
      if (achou) caixas.push(achou); else omitidos.push(r.tipo);
    });
    return { W: W, H: H, P: P, E: E, y: y, x: x, horizontais: horizontais, pb: pb, pc: pc, pa: pa, tem: tem, meses: o.meses, fim: fim, baixo: baixo, li: li, refs: refs, omitidos: omitidos, caixas: caixas, segs: segs, est: est, meta: o.meta, piso: o.piso, alerta: o.alerta, fmt: o.fmt };
  }

  var forma = function (tipo, x, y) {
    if (tipo === 'meta') return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="var(--ok)"/>';
    if (tipo === 'piso') return '<path d="M' + x + ' ' + (y - 5) + 'l5 5l-5 5l-5-5z" fill="var(--at)"/>';
    return '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="8" height="8" fill="var(--ru)"/>';
  };
  var linhaRef = { meta: '', piso: ' stroke-dasharray="1.5 3.5"', alerta: '' };
  var f1 = function (n) { return Math.round(n * 10) / 10; };
  var caminho = function (pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f1(p.x) + ' ' + f1(p.y); }).join(' '); };

  /* v = {id, sel, animar, priv} */
  function svgDe(m, v) {
    v = v || {}; var P = m.P, y = m.y, g = '', y0 = f1(Math.max(P.t, Math.min(P.b, y(0))));
    var yMeta = m.meta > 0 ? y(m.meta) : null, yAl = m.alerta > 0 ? y(m.alerta) : yMeta;
    if (yMeta != null) {
      g += '<rect class="pv-z" x="' + P.l + '" y="' + P.t + '" width="' + (P.r - P.l) + '" height="' + f1(Math.max(0, yMeta - P.t)) + '" fill="var(--zone-ok)"/>';
      g += '<rect class="pv-z" x="' + P.l + '" y="' + f1(yMeta) + '" width="' + (P.r - P.l) + '" height="' + f1(Math.max(0, yAl - yMeta)) + '" fill="var(--zone-attention)"/>';
      g += '<rect class="pv-z" x="' + P.l + '" y="' + f1(yAl) + '" width="' + (P.r - P.l) + '" height="' + f1(Math.max(0, P.b - yAl)) + '" fill="var(--zone-risk)"/>';
    }
    m.E.ticks.forEach(function (t) { g += '<text class="pv-eixo" x="' + (P.l - 6) + '" y="' + f1(y(t) + 4) + '" text-anchor="end" font-size="' + PX.eixo + '" fill="var(--mu)">' + (v.priv ? '••' : esc(fmtEixo(t))) + '</text>'; });
    m.refs.forEach(function (r) { g += '<line class="pv-ref pv-ref-' + r.tipo + '" x1="' + P.l + '" x2="' + P.r + '" y1="' + f1(r.y) + '" y2="' + f1(r.y) + '" stroke="var(--' + r.cls + ')" stroke-width="1"' + linhaRef[r.tipo] + '/>'; });
    g += '<line class="zero" x1="' + P.l + '" x2="' + P.r + '" y1="' + y0 + '" y2="' + y0 + '" stroke="var(--tx)" stroke-width="1.5"/>';
    if (m.pc) {
      var yt = Math.min.apply(null, m.pc.map(function (p) { return p.y; }));
      g += '<defs><clipPath id="' + v.id + 'c"><rect x="' + P.l + '" y="' + P.t + '" width="' + (P.r - P.l) + '" height="' + (P.b - P.t) + '"/></clipPath><linearGradient id="' + v.id + 'g" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="' + f1(yt) + '" y2="' + y0 + '"><stop offset="0" stop-color="var(--primary)" stop-opacity=".26"/><stop offset="1" stop-color="var(--primary)" stop-opacity=".03"/></linearGradient></defs>';
      g += '<path class="pv-area" d="' + caminho(m.pc) + ' L' + f1(m.pc[m.pc.length - 1].x) + ' ' + y0 + ' L' + f1(m.pc[0].x) + ' ' + y0 + 'Z" fill="url(#' + v.id + 'g)" clip-path="url(#' + v.id + 'c)"/>';
    }
    g += '<path class="pv-base" d="' + caminho(m.pb) + '" fill="none" stroke="var(--mu)" stroke-width="2" stroke-linejoin="round"/>';
    m.pb.forEach(function (p) { g += '<circle class="pv-mb" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="3" fill="var(--p1)" stroke="var(--mu)" stroke-width="1.5"/>'; });
    if (m.pc) {
      g += '<path class="pv-cen' + (v.animar ? ' entra' : '') + '" pathLength="1" d="' + caminho(m.pc) + '" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
      m.pc.forEach(function (p) { g += '<circle class="pv-mc" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="4" fill="var(--primary)" stroke="var(--p1)" stroke-width="1.5"/>'; });
    }
    if (v.sel != null && m.pa[v.sel]) {
      var sp = m.pa[v.sel], sb = m.pb[v.sel];
      g += '<line class="pv-guia" x1="' + f1(sp.x) + '" x2="' + f1(sp.x) + '" y1="' + P.t + '" y2="' + P.b + '" stroke="var(--tx)" stroke-width="1"/><circle class="pv-halo" cx="' + f1(sp.x) + '" cy="' + f1(sp.y) + '" r="10" fill="var(--primary)" opacity=".28"/><circle cx="' + f1(sp.x) + '" cy="' + f1(sp.y) + '" r="6" fill="var(--primary)" stroke="var(--p1)" stroke-width="2"/>';
      if (m.pc) g += '<circle cx="' + f1(sb.x) + '" cy="' + f1(sb.y) + '" r="5" fill="var(--p1)" stroke="var(--mu)" stroke-width="2"/>';
    }
    m.refs.forEach(function (r) {
      if (!r.caixa) return; var c = r.caixa;
      g += '<g class="pv-rot pv-rot-' + r.tipo + '">' + forma(r.tipo, c.x + 6, c.y + 7) + '<text x="' + (c.x + 15) + '" y="' + (c.y + 11) + '" font-size="' + PX.rotulo + '" fill="var(--' + r.cls + ')">' + esc(c.texto) + '</text></g>';
    });
    var pill = function (x, y, w, txt, cor) { return '<rect class="pv-pill" x="' + f1(x) + '" y="' + f1(y) + '" width="' + w + '" height="22" rx="11" fill="var(--p2)" stroke="' + cor + '" stroke-width="1.5"/><text x="' + f1(x + w / 2) + '" y="' + f1(y + 15.5) + '" text-anchor="middle" font-size="' + PX.valor + '" font-weight="600" fill="' + cor + '">' + esc(txt) + '</text>'; };
    if (v.sel == null) {   // com um mês escolhido, a leitura vai para o cabeçalho e nada flutua sobre as linhas
      if (m.fim) g += '<g class="pv-fim">' + pill(m.fim.x, m.fim.y, m.fim.w, m.fim.texto, 'var(--primary)') + '</g>';
      if (m.baixo) {
        var b = m.baixo, cl = b.cls, cor = cl ? TOK[cl] : 'var(--tx)', ic = cl ? '<g transform="translate(' + f1(b.x + 10) + ' ' + f1(b.y + 11) + ')" style="color:' + cor + '"><circle r="9.5" fill="var(--p2)" stroke="currentColor" stroke-width="1.5"/>' + TRACO[cl] + '</g>' : '';
        g += '<g class="pv-baixo pv-est-' + (cl || 'neutro') + '">' + ic + pill(b.x + b.w - b.wp, b.y, b.wp, b.texto, cor) + '</g>';
      }
    }
    m.meses.forEach(function (lb, i) {
      var px = m.x(i), n = m.meses.length, ultimo = i === n - 1 && n > 1, a = ultimo ? 'end' : 'middle', tx = ultimo ? m.W - 2 : px;
      g += '<text class="pv-mes" x="' + f1(tx) + '" y="' + (m.H - 8) + '" text-anchor="' + a + '" font-size="' + PX.eixo + '"' + (v.sel === i ? ' font-weight="700"' : '') + ' fill="' + (v.sel === i ? 'var(--tx)' : 'var(--mu)') + '">' + esc(lb) + '</text>';
    });
    return '<svg data-ch="' + v.id + '" class="pv-svg" viewBox="0 0 ' + m.W + ' ' + m.H + '" width="' + m.W + '" height="' + m.H + '" aria-hidden="true" focusable="false">' + g + '</svg>';
  }

  /* marcos da série inteira, além da janela */
  function marcos(serie, meses, meta, li) {
    var m = {}, g = serie.findIndex(function (v) { return meta > 0 && v >= meta; });
    if (g >= 0 && serie[0] < meta) m.meta = meses[g];
    if (serie[li] < 0) { for (var i = li + 1; i < serie.length; i++) if (serie[i] >= 0) { m.positivo = meses[i]; break; } }
    return m;
  }
  function leitura(m, i, baseJan) {
    var b = baseJan[i], c = m.pc ? m.pc[i].v : null;
    return { mes: m.meses[i], base: b, cenario: c, dif: c == null ? null : c - b, estado: estado(c == null ? b : c, m.meta, m.piso, m.alerta, m.fmt.fixo) };
  }
  function resumo(m) {
    var a = m.pa, p = a[m.li], t = 'Previsão do saldo de ' + m.meses[0] + ' a ' + m.meses[m.meses.length - 1] + (m.tem ? ', com a simulação' : '') + '. Mês mais apertado: ' + m.meses[m.li] + ', ' + m.fmt.valor(p.v) + '. ';
    return t + (m.est ? m.est.texto + '. ' : '') + 'Fim de ' + m.meses[m.meses.length - 1] + ': ' + m.fmt.valor(a[a.length - 1].v) + '. Use as setas para ver cada mês.';
  }
  var api = { escala: escala, fmtEixo: fmtEixo, estado: estado, janela: janela, montar: montar, svgDe: svgDe, marcos: marcos, leitura: leitura, resumo: resumo, iconeChip: iconeChip, sobre: sobre, cruza: cruza, PX: PX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TFGrafico = api;
})(typeof window !== 'undefined' ? window : this);
