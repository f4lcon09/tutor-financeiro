/* Offline: guarda só o "casco" do app (lista fixa abaixo). Nada mais é guardado:
   respostas do Google/Drive (outra origem) vão direto à rede e nunca entram no cache; os dados do usuário
   ficam no localStorage e no Drive, nunca aqui. Atualização: rede primeiro; versão nova de sw.js assume sozinha. */
const V = 'tf-v25';
const CASCO = ['./', 'index.html', 'app.js', 'calc.js', 'sync.js', 'real.js', 'store.js', 'seguranca.js', 'grafico.js', 'banco.js', 'taxas.js', 'fonts/source-sans-3-latin-400-normal.woff2', 'fonts/source-sans-3-latin-600-normal.woff2', 'fonts/source-sans-3-latin-700-normal.woff2', 'fonts/fraunces-latin-600-normal.woff2', 'tokens.css', 'tema.js', 'config.js', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const base = new URL('./', self.location).pathname;
const doCasco = u => CASCO.some(a => u.pathname === base + (a === './' ? '' : a));   // só estes caminhos podem ser guardados
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CASCO.map(a => new Request(a, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // Google/Drive vão direto à rede
  // rede primeiro (pega versão nova), cai para o cache se estiver offline
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && r.type === 'basic' && doCasco(u)) { const c = r.clone(); e.waitUntil(caches.open(V).then(x => x.put(u.pathname, c))); }
    return r;
  }).catch(() => caches.match(u.pathname).then(r => r || caches.match(base + 'index.html'))));
});
