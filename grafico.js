/* Gráfico de previsão (tela Futuro): cálculo puro e SVG em texto, sem DOM. Testado em node (test_grafico.js).
   Cores só por token, em CSS var. Todo texto de fora passa por esc(). */
(function (root) {
  var Seg = (typeof require === 'function' && typeof module !== 'undefined') ? require('./seguranca.js') : root.TFSeg;
  var esc = Seg.esc;
  var PX = { valor: 13, rotulo: 12, eixo: 12 };                 // no máximo três tamanhos, nunca abaixo de 12
  var M = { l: 42, r: 16, t: 8, b: 34 };   // embaixo cabem meia marca do eixo e a linha dos meses, sem se tocarem
  var PASSOS = [500, 1000, 2000, 2500, 5000];
  var LIMITE = { dx: 2, dy: 2 };                                 // nada encosta na borda da área do gráfico

  var estimada = function (t, px) { return Math.ceil(String(t).length * px * (px > 12 ? 0.62 : 0.55)); };   // só sem medidor (node); no app a largura vem do texto real
  var sobre = function (a, b, p) { p = p || 0; return a.x < b.x + b.w + p && b.x < a.x + a.w + p && a.y < b.y + b.h + p && b.y < a.y + a.h + p; };
  /* segmento contra retângulo (Liang-Barsky), com folga */
  function cruza(s, c, p) {
    p = p || 0; var x0 = c.x - p, x1 = c.x + c.w + p, y0 = c.y - p, y1 = c.y + c.h + p, dx = s.x2 - s.x1, dy = s.y2 - s.y1, t0 = 0, t1 = 1;
    var testes = [[-dx, s.x1 - x0], [dx, x1 - s.x1], [-dy, s.y1 - y0], [dy, y1 - s.y1]];
    for (var i = 0; i < 4; i++) { var a = testes[i][0], b = testes[i][1]; if (a === 0) { if (b < 0) return false; continue; } var r = b / a; if (a < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } }
    return t0 <= t1;
  }
  function segmentos(pts) { var o = []; for (var i = 1; i < pts.length; i++) o.push({ x1: pts[i - 1].x, y1: pts[i - 1].y, x2: pts[i].x, y2: pts[i].y }); return o; }

  /* eixo: min(pontos, alerta, 0) e max(pontos, meta), com 5% de folga, arredondados. No máximo 5 marcas, sem forçar simetria. */
  function escala(valores, meta, alerta) {
    var lim = valores.filter(isFinite), lo0 = Math.min.apply(null, lim.concat([0])), hi0 = Math.max.apply(null, lim.concat([0]));
    if (meta > 0) hi0 = Math.max(hi0, meta);
    if (alerta > 0) lo0 = Math.min(lo0, alerta);
    var folga = ((hi0 - lo0) || 1) * 0.05, lo = lo0 < 0 ? lo0 - folga : 0, hi = hi0 + folga, r = null;
    for (var g = 0, base = 0.1; g < 9 && !r; g++, base *= 10) {
      for (var i = 0; i < PASSOS.length && !r; i++) {
        var S = PASSOS[i] * base, B = PASSOS[i] === 2500 || PASSOS[i] === 5000 ? S / 5 : S / 2;   // o limite arredonda mais fino que as marcas
        var a = Math.floor(lo / B) * B, b = Math.ceil(hi / B) * B, ticks = [];
        for (var k = Math.ceil(a / S); k * S <= b + 1e-9; k++) ticks.push(k === 0 ? 0 : k * S);
        if (ticks.length <= 5) r = { lo: a === 0 ? 0 : a, hi: b, passo: S, fino: B, ticks: ticks };
      }
    }
    if (r.lo === r.hi) r.hi = r.lo + r.passo;
    return r;
  }
  function fmtEixo(v) {
    if (v === 0) return '0';
    var a = Math.abs(v), s = v < 0 ? '\u2212' : '';
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
  var ARO = '<circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>';
  function iconeChip(cls) { return '<svg class="pv-ic" viewBox="-8 -8 16 16" width="16" height="16" aria-hidden="true">' + (cls === 'at' ? '' : ARO) + (TRACO[cls] || '') + '</svg>'; }

  /* janela de decisão: mês atual e os 3 seguintes */
  function janela(meses, ini) { var n = Math.min(4, meses.length), i = Math.max(0, Math.min(ini || 0, meses.length - n)); return { ini: i, n: n }; }

  function menor(vals) { var m = 0; vals.forEach(function (v, i) { if (v < vals[m]) m = i; }); return m; }

  /* o = {meses, base, cenario|null, meta, piso, alerta, W, H, fmt:{valor, fixo, curto}} */
  function montar(o) {
    var E0 = escala(o.base.concat(o.cenario || []), o.meta, o.alerta), m = null;
    for (var extra = 0; extra < 6; extra++) {
      var E = { lo: E0.lo - Math.ceil(extra / 2) * E0.fino, hi: E0.hi + Math.floor(extra / 2) * E0.fino, passo: E0.passo, fino: E0.fino, ticks: [] };
      for (var passo = E.passo; ; passo *= 2) {   // ampliar nunca passa de 5 rótulos
        E.ticks = []; for (var k = Math.ceil(E.lo / passo); k * passo <= E.hi + 1e-9; k++) E.ticks.push(k === 0 ? 0 : k * passo);
        if (E.ticks.length <= 5) break;
      }
      m = desenho(o, E);
      if (m.fim && m.baixo) break;   // só amplia o eixo se a etiqueta não couber em lugar nenhum
    }
    return m;
  }
  function desenho(o, E) {
    var W = o.W, H = o.H || 264, n = o.meses.length, ativa = o.cenario || o.base, tem = !!o.cenario;
    var largura = function (t, px, peso) { var m = o.mede ? o.mede(String(t), px, peso || 400) : 0; return m > 0 ? Math.ceil(m) + 2 : estimada(t, px); };
    var P = { l: M.l, r: W - M.r, t: M.t, b: H - M.b };
    var y = function (v) { return P.b - (v - E.lo) / (E.hi - E.lo) * (P.b - P.t); };
    var x = function (i) { return n < 2 ? (P.l + P.r) / 2 : P.l + (P.r - P.l) * i / (n - 1); };
    var ponto = function (v, i) { return { x: x(i), y: y(v), v: v, i: i }; };
    var pb = o.base.map(ponto), pc = tem ? o.cenario.map(ponto) : null, pa = pc || pb;
    var segs = segmentos(pb).concat(pc ? segmentos(pc) : []);
    var marcas = pb.concat(pc || []).map(function (p) { return { x: p.x - 4, y: p.y - 4, w: 8, h: 8 }; });
    var eixo = E.ticks.map(function (t) { var tx = fmtEixo(t), w = largura(tx, PX.eixo); return { x: P.l - 6 - w, y: y(t) - 8, w: w, h: 14, t: t }; });
    var horizontais = [];
    [['meta', o.meta], ['piso', o.piso], ['alerta', o.alerta], ['zero', 0]].forEach(function (l) { if (l[0] === 'zero' || l[1] > 0) horizontais.push({ tipo: l[0], x1: P.l, x2: P.r, y1: y(l[1]), y2: y(l[1]) }); });
    var caixas = [];
    var dentro = function (c) { return c.x >= P.l + LIMITE.dx && c.x + c.w <= P.r - LIMITE.dx && c.y >= P.t + LIMITE.dy && c.y + c.h <= P.b - LIMITE.dy; };
    var livre = function (c, pad) {
      if (!dentro(c)) return false;
      if (segs.some(function (s) { return cruza(s, c, pad); }) || marcas.some(function (p) { return sobre(c, p, 1); })) return false;
      return !caixas.some(function (b) { return sobre(c, b, 2); });
    };
    var semLinha = function (c, menos) { return !horizontais.some(function (l) { return l.tipo !== menos && cruza(l, c, 0); }); };

    /* rótulos: logo acima da própria divisória, à esquerda; depois abaixo; depois só o nome. Texto nunca atravessa linha. */
    var refs = [], omitidos = [];
    [{ tipo: 'meta', nome: 'Meta', v: o.meta, cls: 'ok' }, { tipo: 'piso', nome: 'Piso', v: o.piso, cls: 'at' }, { tipo: 'alerta', nome: 'Alerta', v: o.alerta, cls: 'ru' }].filter(function (r) { return r.v > 0; }).forEach(function (r) {
      var ry = y(r.v), achou = null, textos = [r.nome + ' ' + o.fmt.curto(r.v), r.nome];
      for (var px = P.l + 4; px < P.r && !achou; px += 12) {
        textos.some(function (txt) {
          var w = largura(txt, PX.rotulo) + 16;
          return [ry - 16, ry + 3].some(function (cy) {
            var c = { x: px, y: cy, w: w, h: 14 };
            if (livre(c, 1) && semLinha(c)) { achou = { x: c.x, y: c.y, w: c.w, h: c.h, texto: txt, tipo: 'rotulo' }; return true; }
            return false;
          });
        });
      }
      r.y = ry; r.caixa = achou; refs.push(r);
      if (achou) caixas.push(achou); else omitidos.push(r.tipo);
    });

    /* ponto mais baixo: ícone junto do ponto, etiqueta do lado que tem espaço */
    var li = menor(ativa), lp = pa[li], est = estado(lp.v, o.meta, o.piso, o.alerta, o.fmt.fixo), tb = o.fmt.valor(lp.v), wb = largura(tb, PX.valor, 600) + 16, baixo = null, ALT = 22, IC = 20;
    [true, false].some(function (cuidaLinha) {
      [lp.y + 9, lp.y + 20, lp.y + 4, lp.y - 9 - ALT, lp.y - 20 - ALT, lp.y - 4, lp.y - 11, lp.y + 32].some(function (fy) {
        [0, 16, -16, 32, -32, 48, -48, 64, -64, 80, -80, 96, -96, 112, -112].some(function (dx) {
          var cx = Math.max(P.l + LIMITE.dx + IC / 2 + 2, Math.min(lp.x + dx, P.r - LIMITE.dx - IC / 2 - 2));
          return [1, -1].some(function (lado) {
            var ic = { x: cx - IC / 2, y: fy + 1, w: IC, h: IC, tipo: 'icone' }, pl = { x: lado > 0 ? cx + IC / 2 + 4 : cx - IC / 2 - 4 - wb, y: fy, w: wb, h: ALT, tipo: 'pilula' };
            if (livre(ic, 2) && livre(pl, 2) && !sobre(ic, pl) && (!cuidaLinha || (semLinha(ic) && semLinha(pl)))) { baixo = { ic: ic, pill: pl, texto: tb, cls: est ? est.cls : '' }; return true; }
            return false;
          });
        });
        return !!baixo;
      });
      return !!baixo;
    });
    if (baixo) { caixas.push(baixo.ic); caixas.push(baixo.pill); }

    /* fim da janela: acima do ponto, abaixo, à esquerda */
    var ult = pa[pa.length - 1], tf = o.fmt.valor(ult.v), wf = largura(tf, PX.valor, 600) + 16, fim = null, xd = P.r - LIMITE.dx - wf;
    var lugares = [{ x: xd, y: ult.y - 8 - ALT }, { x: xd, y: ult.y + 8 }, { x: ult.x - 10 - wf, y: ult.y - ALT / 2 }];
    for (var dd = 12; dd <= 72; dd += 12) { lugares.push({ x: xd, y: ult.y - 8 - ALT - dd }, { x: xd, y: ult.y + 8 + dd }, { x: ult.x - 10 - wf - dd, y: ult.y - ALT / 2 }, { x: xd - dd, y: ult.y - 8 - ALT }, { x: xd - dd, y: ult.y + 8 }); }
    for (var ex = 12; ex <= 96; ex += 12) for (var ey = -60; ey <= 60; ey += 12) lugares.push({ x: xd - ex, y: ult.y + ey });
    [true, false].some(function (cuidaLinha) {
      return lugares.some(function (l) { var c = { x: l.x, y: l.y, w: wf, h: ALT, tipo: 'pilula' }; if (livre(c, 2) && (!cuidaLinha || semLinha(c))) { fim = c; return true; } return false; });
    });
    if (fim) { fim.texto = tf; caixas.push(fim); }
    var mesesCx = o.meses.map(function (lb, i) { var w = largura(lb, PX.eixo), ultimo = i === n - 1 && n > 1; return { x: ultimo ? W - 2 - w : x(i) - w / 2, y: H - 19, w: w, h: 14 }; });
    return { W: W, H: H, P: P, E: E, y: y, x: x, horizontais: horizontais, eixo: eixo, mesesCx: mesesCx, pb: pb, pc: pc, pa: pa, tem: tem, meses: o.meses, fim: fim, baixo: baixo, li: li, refs: refs, omitidos: omitidos, caixas: caixas, segs: segs, est: est, meta: o.meta, piso: o.piso, alerta: o.alerta, fmt: o.fmt };
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
    g += '<line class="zero" x1="' + P.l + '" x2="' + P.r + '" y1="' + y0 + '" y2="' + y0 + '" stroke="var(--mu)" stroke-width="1"/>';
    if (m.pc) {
      var ys = m.pc.map(function (p) { return p.y; }).concat([+y0]), yt = Math.min.apply(null, ys), yb = Math.max.apply(null, ys), corte = yb > yt ? f1((y0 - yt) / (yb - yt) * 100) / 100 : 0;
      g += '<defs><clipPath id="' + v.id + 'c"><rect x="' + P.l + '" y="' + P.t + '" width="' + (P.r - P.l) + '" height="' + (P.b - P.t) + '"/></clipPath><linearGradient id="' + v.id + 'g" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="' + f1(yt) + '" y2="' + f1(yb) + '"><stop offset="0" stop-color="var(--primary)" stop-opacity=".26"/><stop offset="' + corte + '" stop-color="var(--primary)" stop-opacity=".03"/><stop offset="1" stop-color="var(--primary)" stop-opacity=".26"/></linearGradient></defs>';
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
      g += '<line class="pv-guia" x1="' + f1(sp.x) + '" x2="' + f1(sp.x) + '" y1="' + P.t + '" y2="' + P.b + '" stroke="var(--mu)" stroke-width="1"/><circle class="pv-halo" cx="' + f1(sp.x) + '" cy="' + f1(sp.y) + '" r="10" fill="var(--primary)" opacity=".28"/><circle cx="' + f1(sp.x) + '" cy="' + f1(sp.y) + '" r="6" fill="var(--primary)" stroke="var(--p1)" stroke-width="2"/>';
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
        var b = m.baixo, cl = b.cls, cor = cl ? TOK[cl] : 'var(--tx)', ic = cl ? '<g transform="translate(' + f1(b.ic.x + 10) + ' ' + f1(b.ic.y + 10) + ')" style="color:' + cor + '"><circle r="9.5" fill="var(--p2)" stroke="currentColor" stroke-width="1.5"/>' + TRACO[cl] + '</g>' : '';
        g += '<g class="pv-baixo pv-est-' + (cl || 'neutro') + '">' + ic + pill(b.pill.x, b.pill.y, b.pill.w, b.texto, cor) + '</g>';
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
