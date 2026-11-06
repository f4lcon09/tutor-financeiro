/* Tutor Financeiro: junção de dados (pura, testada em node) e transporte para o Google Drive.
   Documento = mapa de itens: chave -> {u: hora da última alteração (ms), d: apagado?, v: valor}.
   Junção por item: vence a alteração mais recente. Apagar vira "lápide", para a exclusão chegar ao outro aparelho. */
(function (root) {
  const Seg = (typeof require === 'function' && typeof module !== 'undefined') ? require('./seguranca.js') : root.TFSeg;
  const ord = (k, v) => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v).sort().reduce((o, x) => (o[x] = v[x], o), {}) : v;
  const str = v => JSON.stringify(v, ord);
  const eq = (a, b) => str(a) === str(b);

  /* Estado do app -> mapa plano chave -> valor */
  function achatar(st) {
    const m = {};
    (st.lanc || []).forEach(l => { m['lanc:' + l.id] = l; });
    Object.keys(st.pagos || {}).forEach(k => { m['pago:' + k] = st.pagos[k]; });
    Object.keys(st.tetos || {}).forEach(k => { m['teto:' + k] = st.tetos[k]; });
    (st.metas || []).forEach(x => { m['meta:' + x.id] = x; });
    m['taxa'] = st.taxa;
    if (st.real !== undefined) m['real'] = st.real;
    if (st.numeros !== undefined) m['numeros'] = st.numeros;
    return m;
  }

  /* Mapa de itens -> estado do app (ignora apagados) */
  function montar(itens) {
    const st = { lanc: [], pagos: {}, tetos: {}, metas: [], taxa: undefined };
    Object.keys(itens).forEach(k => {
      const it = itens[k]; if (it.d || Seg.perigosa(k.replace(/^[a-z]+:/, ''))) return;
      if (k.startsWith('lanc:')) st.lanc.push(it.v);
      else if (k.startsWith('pago:')) st.pagos[k.slice(5)] = it.v;
      else if (k.startsWith('teto:')) st.tetos[k.slice(5)] = it.v;
      else if (k.startsWith('meta:')) st.metas.push(it.v);
      else if (k === 'taxa') st.taxa = it.v;
      else if (k === 'real') st.real = it.v;
      else if (k === 'numeros') st.numeros = it.v;
    });
    return st;
  }

  /* Compara o estado atual com os itens anteriores e marca só o que mudou. */
  function atualizar(st, prev, agora) {
    const cur = achatar(st), out = {};
    Object.keys(cur).forEach(k => {
      const p = prev[k];
      if (p && !p.d && eq(p.v, cur[k])) { out[k] = p; return; }
      out[k] = { u: agora, d: false, v: cur[k] };
    });
    Object.keys(prev).forEach(k => {
      if (k in out) return;
      const p = prev[k];
      out[k] = p.d ? p : { u: agora, d: true, v: null };
    });
    return out;
  }

  /* União de dois mapas de itens; por item vence o mais recente (empate: o apagado, depois o texto maior) */
  function juntar(a, b) {
    const out = {};
    new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => {
      const x = a[k], y = b[k];
      if (!x) { out[k] = y; return; }
      if (!y) { out[k] = x; return; }
      if (x.u !== y.u) { out[k] = x.u > y.u ? x : y; return; }
      if (x.d !== y.d) { out[k] = x.d ? x : y; return; }
      out[k] = str(x) >= str(y) ? x : y;
    });
    return out;
  }

  /* Dados iniciais iguais nos dois aparelhos (exemplo) entram como itens de hora 0: perdem para qualquer alteração real
     e não vão para o Drive enquanto não forem alterados. */
  function baseItens(st) {
    const m = achatar(st), out = {};
    Object.keys(m).forEach(k => { out[k] = { u: 0, d: false, v: m[k] }; });
    return out;
  }
  const semBase = itens => { const o = {}; Object.keys(itens).forEach(k => { if (itens[k].u > 0) o[k] = itens[k]; }); return o; };
  const igual = (a, b) => eq(a, b);
  const doc = itens => ({ app: 'tutor-financeiro', v: 1, itens });

  /* ---------- Transporte: Google Drive (escopo drive.file: o app só vê os arquivos que ele criou) ---------- */
  const DRIVE = {
    escopo: 'https://www.googleapis.com/auth/drive.file',
    pasta: 'Tutor Financeiro', arquivo: 'dados.json'
  };

  function criarDrive(cfg, arm) {
    // arm: {get(k), set(k,v), del(k)} sobre localStorage
    const redirect = () => location.origin + location.pathname.replace(/\/$/, '/index.html');   // tem de ser igual ao cadastrado no Google
    const tok = () => { const t = arm.get('tf_gtoken'); return t && t.exp > Date.now() + 30000 ? t.v : null; };
    const api = async (url, opt) => {
      const t = tok(); if (!t) throw new Error('sem-token');
      const r = await fetch(url, Object.assign({}, opt, { headers: Object.assign({ Authorization: 'Bearer ' + t }, (opt && opt.headers) || {}) }));
      if (r.status === 401) { arm.del('tf_gtoken'); throw new Error('sem-token'); }
      if (!r.ok) throw new Error('drive ' + r.status);
      return r;
    };
    return {
      configurado: () => !!cfg.clientId,
      conectado: () => !!tok(),
      token: () => tok(),
      jaConectou: () => !!arm.get('tf_gjaconectou'),
      /* Fluxo por redirecionamento (sem biblioteca externa). Chamar a partir de um toque do usuário. */
      conectar() {
        const state = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
        arm.set('tf_gstate', state);
        const q = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: redirect(), response_type: 'token', scope: DRIVE.escopo, state, include_granted_scopes: 'true', prompt: arm.get('tf_gjaconectou') ? '' : 'consent' });
        location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + q.toString();
      },
      /* Ao voltar do Google, o token vem no #hash */
      lerRetorno() {
        if (!location.hash.includes('access_token')) return false;
        const h = new URLSearchParams(location.hash.slice(1));
        history.replaceState(null, '', location.pathname + location.search);
        const esperado = arm.get('tf_gstate'); arm.del('tf_gstate');   // uso único; sem state guardado ou sem state na volta, o token é recusado
        if (!esperado || h.get('state') !== esperado) return false;
        arm.set('tf_gtoken', { v: h.get('access_token'), exp: Date.now() + (+h.get('expires_in') || 3600) * 1000 });
        arm.set('tf_gjaconectou', true);
        return true;
      },
      desconectar() { arm.del('tf_gtoken'); arm.del('tf_gjaconectou'); arm.del('tf_gfile'); },
      async achar(q) {
        const r = await api('https://www.googleapis.com/drive/v3/files?spaces=drive&fields=files(id,name,parents)&q=' + encodeURIComponent(q));
        return (await r.json()).files || [];
      },
      async garantirArquivo() {
        let id = arm.get('tf_gfile'); if (id) return id;
        let pastas = await this.achar("mimeType='application/vnd.google-apps.folder' and name='" + DRIVE.pasta + "' and trashed=false");
        let pasta = pastas[0] && pastas[0].id;
        if (!pasta) {
          const r = await api('https://www.googleapis.com/drive/v3/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: DRIVE.pasta, mimeType: 'application/vnd.google-apps.folder' }) });
          pasta = (await r.json()).id;
        }
        const f = await this.achar("name='" + DRIVE.arquivo + "' and '" + pasta + "' in parents and trashed=false");
        if (f[0]) id = f[0].id;
        else {
          const r = await api('https://www.googleapis.com/drive/v3/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: DRIVE.arquivo, parents: [pasta], mimeType: 'application/json' }) });
          id = (await r.json()).id;
          await this.escrever(id, doc({}));
        }
        arm.set('tf_gfile', id); return id;
      },
      async ler(id) {
        if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error('id inválido');
        const r = await api('https://www.googleapis.com/drive/v3/files/' + id + '?alt=media');
        const t = await r.text(); if (!t.trim()) return {};
        if (t.length > 8 * 1024 * 1024) throw new Error('arquivo grande demais');
        const d = JSON.parse(t); const lp = Seg.limparItens(d && d.itens ? d.itens : {}); this.descartados = lp.descartados; return lp.itens;
      },
      async escrever(id, d) {
        if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error('id inválido');
        await api('https://www.googleapis.com/upload/drive/v3/files/' + id + '?uploadType=media', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      }
    };
  }

  const api = { achatar, montar, atualizar, juntar, baseItens, semBase, igual, doc, criarDrive, DRIVE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TFSync = api;
})(typeof window !== 'undefined' ? window : globalThis);
