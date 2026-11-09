/* ===== Dados de EXEMPLO (fictícios). Na versão real vêm da planilha (somente leitura) e de arquivos do app. ===== */
const DEMO = {
  caixinha: 1950, conta: 400, essencial: 1600, renda: 3800,
  meta: 3000, piso: 2500, alerta: 1900, tetoLazer: 200,
  meses: ['nov/26','dez/26','jan/27','fev/27','mar/27','abr/27','mai/27','jun/27','jul/27','ago/27','set/27','out/27'],
  cenarios: {
    'Base':       [2350,2100,3150,3520,3890,4250,4640,5020,5410,5790,6160,6540],
    'Pessimista': [2350,1700,2150,2350,2600,2850,3100,3350,3600,3850,4100,4350],
    'Otimista':   [2350,2300,3500,3950,4400,4850,5300,5750,6200,6650,7100,7550],
    'Sua regra':  [2350,2000,3050,3400,3750,4100,4450,4800,5150,5500,5850,6200]
  },
  cores: {'Base':'var(--sky)','Pessimista':'var(--ru)','Otimista':'var(--ok)','Sua regra':'var(--at)'},
  carteira: [
    {nome:'Caixinha (CDB liquidez diária)',classe:'Renda fixa',valor:1950,liquidez:'diaria'},
    {nome:'Tesouro Selic',classe:'Renda fixa',valor:1200,liquidez:'diaria'},
    {nome:'ETF de índice',classe:'Ações',valor:900,liquidez:'media'},
    {nome:'Cripto',classe:'Cripto',valor:250,liquidez:'media'}
  ],
  cartoes: [
    {id:'c1',nome:'Cartão principal',final:'4821',limite:6000,fatura:780,parcelasFuturas:2320,fecha:3,vence:10},
    {id:'c2',nome:'Cartão 2',final:'1107',limite:1500,fatura:200,parcelasFuturas:0,fecha:20,vence:27}
  ],
  parcelamentos: [
    {nome:'Notebook',parcela:210,restam:5,total:10},
    {nome:'Celular',parcela:90,restam:9,total:12},
    {nome:'Curso online',parcela:115,restam:4,total:6}
  ],
  agenda: [
    {id:'a1',nome:'Faculdade',dia:5,valor:650},
    {id:'a2',nome:'Academia',dia:8,valor:90},
    {id:'a3',nome:'Fatura do cartão principal',dia:10,valor:780},
    {id:'a4',nome:'Parcela do notebook',dia:12,valor:210},
    {id:'a5',nome:'Assinaturas',dia:15,valor:80},
    {id:'a6',nome:'Celular (plano)',dia:20,valor:40},
    {id:'a7',nome:'Ajuda em casa',dia:25,valor:400}
  ],
  tetos: {Mercado:800,Transporte:150,Estudos:650,'Saúde':120,Outros:100}
};
const HUE = {teal:'var(--teal)',vio:'var(--vio)',pink:'var(--pink)',sky:'var(--sky)'};
const CATS = ['Lazer','Jogos','Comida','Mercado','Transporte','Estudos','Saúde','Outros'];
const MASK = 'R$ ••••';
const SVG_OLHO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>', SVG_OLHO_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.2M6.6 6.6A17 17 0 002 12s3.5 7 10 7a10 10 0 004.2-.9"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/></svg>';
const ic0 = p => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const I = {
  sol: ic0('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  lua: ic0('<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'),
  baixar: ic0('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
  enviar: ic0('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  editar: ic0('<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>'),
  apagar: ic0('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  esq: ic0('<path d="M15 5l-7 7 7 7"/>'),
  dir: ic0('<path d="M9 5l7 7-7 7"/>'),
  mais: ic0('<path d="M12 5v14M5 12h14"/>'),
  paleta: ic0('<path d="M12 3a9 9 0 100 18c1.1 0 1.8-.8 1.8-1.7 0-1.3-1-1.5-1-2.6 0-.9.7-1.7 1.7-1.7H17a4 4 0 004-4c0-4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>'),
  ok: ic0('<path d="M5 12l4 4 10-10"/>')
};
let PRIV = load('tf_priv',false);   // esconder valores: só neste aparelho, desligado por padrão, não sincroniza
const brl = n => (n==null||isNaN(n)) ? '—' : PRIV ? MASK : n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const aprox = n => (n==null||isNaN(n)) ? '—' : PRIV ? MASK : '~'+n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const brl0 = n => (n==null||isNaN(n)) ? '—' : PRIV ? MASK : n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const pc = (n,d=2) => (n==null||isNaN(n)) ? '—' : (n*100).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})+'%';
const num1 = n => n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const esc = TFSeg.esc;   // todo texto vindo do usuário, do JSON importado ou do Drive passa por aqui antes de entrar em innerHTML
/* sinal de atenção desenhado: herda a cor do tema. O caractere vira emoji colorido em alguns navegadores (fica só como texto de apoio, não desenhado) */
const AV = TFGrafico.iconeChip('at','gl'), IOK = TFGrafico.iconeChip('ok','gl'), IX = TFGrafico.iconeChip('ru','gl');   // desenhados: caractere de símbolo pode virar emoji no iPhone
const ISOBE = '<svg class="gl" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>', IDESCE = '<svg class="gl" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>', ILAPIS = '<svg class="gl" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ST = {ok:[IOK,'Tudo certo'],at:[AV,'Atenção'],ru:[IX,'Risco']};
const stCls = s => s==='atencao'?'at':s==='ruim'?'ru':s;

/* ===== Armazenamento da maquete (versão real: arquivos do app, no computador) ===== */
function load(k,def){ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?def:v; }catch(e){ return def; } }
function save0(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

const ARM = TFStore.armazenamentoDoModo(localStorage), S = TFStore.criarStore(ARM);   // o exemplo tem chaves próprias: trocar de modo nunca mistura dados
const TEMAS = ['cafe','ameixa','nevoa','cha'], NOMES_TEMA = {cafe:'Café',ameixa:'Ameixa',nevoa:'Névoa',cha:'Chá'};
const migraTema = v => v==='light'?'nevoa':v==='dark'?'cafe':TEMAS.includes(v)?v:'cafe';   // "dark" e "light" são valores antigos
function aplicaTema(t){ const r=document.documentElement; r.dataset.theme=TEMAS.includes(t)?t:'cafe'; try{ const m=document.querySelector('meta[name="theme-color"]'), c=getComputedStyle(r).getPropertyValue('--bg').trim(); if(m&&c) m.setAttribute('content',c); }catch(e){} }
{ const salvo=load('tf_tema',null), q=new URLSearchParams(location.search).get('tema'), t=migraTema(salvo);   // ?tema= só para testar; não grava
  if(salvo!=null && salvo!==t) save0('tf_tema',t);   // migra "dark"/"light" ou valor inválido para o nome do tema
  aplicaTema(TEMAS.includes(q)?q:t); }
const MODO = S.st.modo;   // 'real' | 'demo' | null (ainda sem dados)
const SIMPLES = () => MODO==='real' && !!(S.st.real && S.st.real._inicio);   // começou pelos três números; o resto vem depois, uma coisa de cada vez
let real = S.st.real;
function recalcDemo(){ if(MODO==='real' && S.st.real){ real=S.st.real; Object.assign(DEMO, Real.derivar(S.st.real, S.st.numeros, {lanc:S.st.lanc, hojeISO:S.hojeISO()})); } }
recalcDemo();
const hoje = new Date(); const diaHoje = hoje.getDate();
const mesAtual = hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0');
const diasMes = new Date(hoje.getFullYear(),hoje.getMonth()+1,0).getDate();
function prevSeed(){
  const dt=new Date(hoje.getFullYear(),hoje.getMonth()-1,1), k=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
  return [
    {id:11,data:k+'-04',desc:'Jogo',cat:'Jogos',valor:79.9,forma:'Crédito',essencial:false,lazer:true},
    {id:12,data:k+'-11',desc:'Compra do mês',cat:'Mercado',valor:341.2,forma:'Débito',essencial:true,lazer:false},
    {id:13,data:k+'-22',desc:'Cinema',cat:'Lazer',valor:42,forma:'Pix',essencial:false,lazer:true}
  ];
}
function seed(){
  const d = n => mesAtual+'-'+String(Math.min(n,diasMes)).padStart(2,'0');
  return [
    {id:1,data:d(3),desc:'Jogo novo',cat:'Jogos',valor:59.9,forma:'Crédito',essencial:false,lazer:true},
    {id:2,data:d(8),desc:'Compra do mês',cat:'Mercado',valor:312.4,forma:'Débito',essencial:true,lazer:false},
    {id:3,data:d(12),desc:'Cinema',cat:'Lazer',valor:46,forma:'Pix',essencial:false,lazer:true},
    {id:4,data:d(19),desc:'Lanche',cat:'Comida',valor:28.5,forma:'Pix',essencial:false,lazer:true},
    {id:5,data:d(6),desc:'Ônibus e app',cat:'Transporte',valor:64,forma:'Pix',essencial:true,lazer:false},
    {id:6,data:d(15),desc:'Consulta',cat:'Saúde',valor:90,forma:'Pix',essencial:true,lazer:false}
  ].concat(prevSeed());
}
const metasPadrao = () => [
  {id:1,nome:'Reserva de emergência (6 meses)',alvo:9600,guardado:1950,prazo:'2027-12',aporte:350},
  {id:2,nome:'Viagem',alvo:3000,guardado:400,prazo:'2027-07',aporte:280},
  {id:3,nome:'Notebook novo',alvo:4500,guardado:0,prazo:'2027-03',aporte:150}
];
if(MODO==='demo' && !ARM.getItem('tf_lanc3')) S.st.lanc = seed();
if(MODO==='demo' && !ARM.getItem('tf_metas')) S.st.metas = metasPadrao();
if(!Object.keys(S.st.tetos).length && !SIMPLES()) S.st.tetos = {...DEMO.tetos};
Object.defineProperties(window,{
  lanc:{get:()=>S.st.lanc,configurable:true}, pagos:{get:()=>S.st.pagos,configurable:true}, tetos:{get:()=>S.st.tetos,configurable:true},
  metas:{get:()=>S.st.metas,configurable:true}, taxaMeta:{get:()=>S.st.taxa,configurable:true}
});
const doMes = () => S.doMes(mesAtual);
const gastosMes = () => S.gastosMes(mesAtual);
const lazerGasto = () => S.lazerGasto(mesAtual);
const pagoKey = a => S.chavePago(a, mesAtual);
const isPago = a => S.estaPago(a, diaHoje, mesAtual);

/* ===== Ícones ===== */
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" stroke-linejoin="round">${p}</svg>`;
const ic = {
  hoje:svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
  lancar:svg('<rect x="3" y="3" width="18" height="18"/><path d="M12 8v8M8 12h8"/>'),
  cartao:svg('<rect x="2" y="5" width="20" height="14"/><path d="M2 10h20M6 15h4"/>'),
  agenda:svg('<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  orcamento:svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  metas:svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 12l6-6"/>'),
  futuro:svg('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
  decidir:svg('<rect x="5" y="3" width="14" height="18"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2"/>'),
  saude:svg('<path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z"/>'),
  mais:svg('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'),
  numeros:svg('<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="8" cy="18" r="1.6"/>')
};
const TELAS = [['hoje','Hoje','teal'],['lancar','Lançar','teal'],['cartao','Cartão','vio'],['agenda','Agenda','vio'],['orcamento','Orçamento','pink'],['metas','Metas','sky'],['futuro','Futuro','sky'],['decidir','Decidir','teal'],['saude','Patrimônio','sky'],['numeros','Meus números','teal']];
const hue = k => HUE[k];

/* ===== Gráficos SVG ===== */
function axisFmt(v,curto){ if(PRIV) return '••'; if(curto) return Math.abs(v)>=1000 ? (v/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mil' : String(Math.round(v)); const sinal=v<0?'-':'', a=Math.abs(v); return a>=1000 ? sinal+'R$ '+(a/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mil' : sinal+'R$ '+Math.round(a); }
const CHARTS={};
/* largura útil de um painel em px CSS: no celular a tela menos margens e preenchimento do painel; no PC uma fração da área principal */
function CW(f){ if(window.innerWidth<=860) return Math.max(window.innerWidth-62,240); const w=Math.max(window.innerWidth-(224+64),320); return Math.round(Math.min(w,1736)*f-44); }
let HZ = load('tf_hz',7);   // horizonte dos gráficos de previsão: 7 ou 12 meses
function lineChart(labels, series, refs, h=280, W=720, o={}){
  const id='ch'+Math.random().toString(36).slice(2,8), args=[labels,series,refs,h,W,o];
  if(!o.exact && window.innerWidth<=860) W=CW(1);
  const estreito=W<=480, FS=12;
  if(labels.length>12-1 && HZ<labels.length){ const N=HZ; labels=labels.slice(0,N); series=series.map(s=>({...s,values:s.values.slice(0,N)})); o={...o,marks:(o.marks||[]).filter(m=>m.i<N)}; }
  const H=estreito?Math.min(h,250):h, L=estreito?46:78, R=estreito?12:18, T=22, B=34;
  const all=[...series.flatMap(s=>s.values), ...refs.map(r=>r.v)];
  let mn=Math.min(...all), mx=Math.max(...all);
  const pad=(mx-mn)*.08||1; mn=mn<0?mn-pad:Math.max(0,mn-pad); mx+=pad; if(mn<0&&mx<0) mx=pad;   // o eixo inclui toda a série e as linhas de referência; saldo negativo fica visível
  const x=i=>L+(W-L-R)*i/Math.max(labels.length-1,1), y=v=>T+(H-T-B)*(1-(v-mn)/(mx-mn));
  let g='<defs><clipPath id="'+id+'c"><rect x="'+L+'" y="'+(T-4)+'" width="'+(W-L-R)+'" height="'+(H-T-B+4)+'"/></clipPath>'+series.map((s,k)=>s.area?`<linearGradient id="${id}g${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.c}" stop-opacity=".38"/><stop offset="1" stop-color="${s.c}" stop-opacity="0"/></linearGradient>`:'').join('')+'</defs>';
  (o.zones||[]).forEach(z=>{ const y1=y(Math.min(z.to,mx)), y2=y(Math.max(z.from,mn)); if(y2>y1) g+=`<rect x="${L}" y="${y1}" width="${W-L-R}" height="${y2-y1}" fill="${z.c}" opacity="${z.o||.07}"/>`; });
  const zeroY=mn<0?y(0):null;
  for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4, colaZero=zeroY!=null&&Math.abs(y(v)-zeroY)<FS+2; g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--ln)"/>`+(colaZero?'':`<text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="${FS}" fill="var(--mu)">${axisFmt(v,estreito)}</text>`);}
  if(zeroY!=null) g+=`<line class="zero" x1="${L}" x2="${W-R}" y1="${zeroY}" y2="${zeroY}" stroke="var(--tx)" stroke-width="1.5"/><text x="${L-6}" y="${zeroY+4}" text-anchor="end" font-size="${FS}" font-weight="600" fill="var(--tx)">${PRIV?'••':'0'}</text>`;
  const n=labels.length, step=estreito?Math.max(1,Math.ceil(n/5)):Math.max(1,Math.ceil(n/Math.max(Math.floor((W-L-R)/70),2)));
  labels.forEach((lb,i)=>{ if(i%step===0){ const px=x(i), anc=px+20>W?'end':'middle'; g+=`<text x="${anc==='end'?W-2:px}" y="${H-10}" text-anchor="${anc}" font-size="${FS}" fill="var(--mu)">${esc(lb)}</text>`; } });
  // rótulos das linhas de referência: no celular vão para a legenda; no PC evitam sobrepor-se entre si e à série
  const sobreSerie=(x1,x2,y1,y2)=>series.some(s=>{ for(let k=0;k<=24;k++){ const px=x1+(x2-x1)*k/24, f=(px-L)/(W-L-R)*(n-1); if(f<0||f>n-1) continue; const i0=Math.floor(f), i1=Math.min(i0+1,n-1), v=s.values[i0]+(s.values[i1]-s.values[i0])*(f-i0), py=y(v); if(py>=y1-3&&py<=y2+3) return true; } return false; });
  let ultimo=-99;
  refs.slice().sort((a,b)=>b.v-a.v).forEach(r=>{
    g+=`<line x1="${L}" x2="${W-R}" y1="${y(r.v)}" y2="${y(r.v)}" stroke="${r.c}" stroke-width="1.5" stroke-dasharray="${estreito?'2 4':'6 5'}"/>`;
    if(estreito) return;
    let yl=Math.min(Math.max(y(r.v)-6,ultimo+FS+4,T+FS),H-B-4); ultimo=yl;
    const tw=r.t.length*FS*.58+8, dir={x:W-R-4,a:'end',x1:W-R-4-tw,x2:W-R-4}, esq={x:L+4,a:'start',x1:L+4,x2:L+4+tw};
    const pos=!sobreSerie(dir.x1,dir.x2,yl-FS,yl+3)?dir:!sobreSerie(esq.x1,esq.x2,yl-FS,yl+3)?esq:dir;
    g+=`<text x="${pos.x}" y="${yl}" text-anchor="${pos.a}" font-size="${FS}" font-weight="600" fill="${r.c}" paint-order="stroke" stroke="var(--bg)" stroke-width="3">${r.t}</text>`; });
  series.forEach((s,k)=>{
    const d=s.values.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)).join(' ');
    if(s.area) g+=`<path d="${d} L${x(s.values.length-1)} ${H-B} L${x(0)} ${H-B}Z" fill="url(#${id}g${k})" clip-path="url(#${id}c)"/>`;
    g+=`<path d="${d}" fill="none" stroke="${s.c}" stroke-width="${s.w||2.5}" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#${id}c)"/>`;
    const i=s.values.length-1; g+=`<circle cx="${x(i)}" cy="${y(s.values[i])}" r="4" fill="${s.c}"/>`;
  });
  if(estreito && series.length && o.endChip!==false){ const sl=series[series.length-1], vi=sl.values.length-1, cx=x(vi), cy=y(sl.values[vi]), tx=PRIV?MASK:'~'+brl0(sl.values[vi]), tw=tx.length*FS*.6+14, ab=cy-T<34, cxl=Math.min(Math.max(cx-tw/2,L),W-R-tw);
    g+=`<rect x="${cxl}" y="${ab?cy+9:cy-30}" width="${tw}" height="22" rx="11" fill="var(--p2)" stroke="${sl.c}"/><text x="${cxl+tw/2}" y="${(ab?cy+9:cy-30)+15}" text-anchor="middle" font-size="${FS}" font-weight="700" fill="var(--tx)">${tx}</text>`; }
  (o.marks||[]).forEach(m=>{ const cx=x(m.i), cy=y(m.v), up=m.pos!=='b'||cy+26>H-B-4, anc=cx<L+70?'start':cx>W-R-70?'end':'middle';
    g+=`<circle cx="${cx}" cy="${cy}" r="${estreito?5:6}" fill="${m.c}" stroke="var(--bg)" stroke-width="2.5"/><text x="${cx}" y="${up?cy-12:cy+22}" text-anchor="${anc}" font-size="${FS}" font-weight="700" fill="${m.c}" paint-order="stroke" stroke="var(--bg)" stroke-width="3">${m.t}</text>`; });
  CHARTS[id]={labels,series,x:null,W,L,R,args};
  const leg=estreito&&refs.length?`<div class="legend">${refs.map(r=>`<span><i style="background:transparent;border-top:2px dashed ${r.c};height:0;width:16px"></i>${r.t}: ${brl0(r.v)}</span>`).join('')}</div>`:'';
  return `<div class="lc"><svg data-ch="${id}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Gráfico: ${esc(series.map(s=>s.name).filter(Boolean).join(', '))||'evolução'}" style="display:block;width:100%;height:auto;max-width:100%">${g}</svg>${leg}</div>`;
}
/* depois de montar a tela, confere a largura real de cada gráfico e redesenha sem esticar */
function ajustarGraficos(){
  $$('svg[data-ch]').forEach(sv=>{ const c=CHARTS[sv.dataset.ch], w=Math.round(sv.getBoundingClientRect().width), lc=sv.closest('.lc'); if(!c||!w||!lc||Math.abs(w-c.W)<=3) return;
    const [lb,se,rf,h,W,o]=c.args, t=document.createElement('div'); t.innerHTML=lineChart(lb,se,rf,h,w,{...o,exact:true}); lc.replaceWith(t.firstChild); });
  const pa=document.querySelector('#pv_area'); if(pa&&pvUlt&&pa.clientWidth&&Math.abs(pa.clientWidth-pvUlt.m.W)>3) pvDesenha();
  const ha=document.querySelector('#hj_area'); if(ha&&hjUlt&&ha.clientWidth&&Math.abs(ha.clientWidth-hjUlt.m.W)>3) hjDesenha();
}
function ring(pct,color,label,sub,size=150){
  const r=size/2-12, c=2*Math.PI*r, off=c*(1-Math.min(Math.max(pct,0),1));
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc('Progresso: '+label+(sub?' '+sub:''))}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--p2)" stroke-width="12"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size/2} ${size/2})"/><text x="50%" y="${sub?'47%':'54%'}" text-anchor="middle" font-size="${size/4.2}" font-weight="600" fill="var(--tx)">${label}</text>${sub?`<text x="50%" y="69%" text-anchor="middle" font-size="12" fill="var(--mu)">${sub}</text>`:''}</svg>`;
}
function status(v, meta, piso){ return v>=meta ? ['ok',IOK,'Acima da meta'] : v>=piso ? ['at',AV,'Entre piso e meta'] : ['ru',IX,'Abaixo do piso']; }
const COR = {ok:'var(--ok)',at:'var(--at)',ru:'var(--ru)'};
const info = (t,r) => `<i class="info${r?' r':''}" tabindex="0" data-t="${esc(t)}">i</i>`;
function sugerir(cat,desc){
  const d=(desc||'').toLowerCase();
  if(['Mercado','Transporte','Saúde','Estudos'].includes(cat)) return {ess:true,laz:false,t:'<b>'+esc(cat)+' costuma ser essencial.</b> Sem isso a rotina básica fica comprometida. Não conta no teto de lazer.'};
  if(['Lazer','Jogos'].includes(cat)) return {ess:false,laz:true,t:'<b>É lazer.</b> É uma escolha que dá para adiar sem consequência. Conta no teto de lazer do mês.'};
  if(cat==='Comida'){
    if(/mercado|feira|padaria|hortifruti|açougue|acougue|supermercado/.test(d)) return {ess:true,laz:false,t:'<b>Comida de casa é essencial.</b> Para compras de mercado, o ideal é usar a categoria Mercado.'};
    return {ess:false,laz:true,t:'<b>Comer fora ou pedir entrega conta como lazer.</b> Comida de casa você lança em Mercado, como essencial.'};
  }
  return {ess:false,laz:false,t:'<b>Em dúvida?</b> Pergunte: se eu não pagar isso este mês, o que acontece? Se algo importante quebra, é essencial. Se só perde o prazer, é lazer.'};
}
const MOB = () => window.innerWidth<=860;
let DET = load('tf_det',{});   // quais blocos "Ver detalhes" ficam abertos; só neste aparelho, não sincroniza
const det = (tela,id,titulo,html,h='teal') => { if(!MOB()) return html; const k=tela+':'+id; return `<details class="det" data-det="${k}" style="--h:var(--${h})"${DET[k]?' open':''}><summary>${titulo}</summary><div class="detc">${html}</div></details>`; };
const alerta = (cls,txt) => `<div class="alerta ${cls}" role="status"><span aria-hidden="true">${ST[cls][0]}</span><span>${txt}</span></div>`;
const alertas = l => l.length?`<div class="alertas">${l.slice().sort((a,b)=>b[0]-a[0]).slice(0,2).map(x=>x[1]).join('')}</div>`:'';
const pn = (titulo, corpo, h='teal', extra='', tag='') => `<div class="pn" style="--h:${hue(h)};${extra}"><h2><span>${titulo}</span>${tag?`<em>${tag}</em>`:''}</h2>${corpo}</div>`;

/* ===== Telas ===== */
const T = {};
function cartaoInfo(c){ const usado=c.fatura+c.parcelasFuturas; return {usado, ...Calc.cartao(c.limite,usado,c.fecha,diaHoje)}; }
const blocoReal = () => { const d=DEMO;
  return `<div class="grid g2" style="margin-bottom:14px">
    ${pn('Plano de pagamento'+info('Montado a partir do que você informou. Os valores não foram confirmados pelo banco.'),d.plano.map(x=>`<div class="ins"><div class="d ok" style="width:auto;min-width:52px;padding:0 6px">${esc(String(x.data).slice(8))}/${esc(String(x.data).slice(5,7))}</div><div class="small">${esc(x.texto)}</div></div>`).join('')+`<div class="kv" style="margin-top:12px"><span>Sobra depois de pagar tudo</span><span>${brl(d.sobra)}</span></div>`,'teal')}
    ${pn('Falta informar',d.pendentes.length?d.pendentes.map(t=>`<div class="ins"><div class="d at">${AV}</div><div class="small" style="padding-top:5px">${esc(t)}</div></div>`).join('')+'<div class="disc">Enquanto isso, o app não estima esses valores.</div><div style="margin-top:12px"><button class="btn ghost" data-ir="numeros">Abrir Meus números</button></div>':'<div class="mu">Nada pendente.</div>','vio')}
  </div>
  ${pn('Como a projeção é feita',d.suposicoes.map(x=>`<div class="ins"><div class="d ne">·</div><div class="small" style="padding-top:5px">${esc(x)}</div></div>`).join(''),'sky','margin-bottom:14px')}`; };
function proximasContas(){
  return DEMO.agenda.filter(a=>!isPago(a)).map(a=>({...a,dias:Calc.diasAte(a.dia,diaHoje)})).sort((x,y)=>(x.dias<0?999+x.dias:x.dias)-(y.dias<0?999+y.dias:y.dias));
}

T.hoje = () => {
  if(SIMPLES()) return hojeSimples();
  const d=DEMO, base=d.cenarios['Base'], jan=base[2], [cls,icn,txt]=status(jan,d.meta,d.piso);
  const gasto=lazerGasto(), restante=d.tetoLazer-gasto, pct=gasto/d.tetoLazer;
  const lzCls = pct<=.75?'ok':pct<=1?'at':'ru';
  const rtz = TFStore.ritmoMes(gasto,diaHoje,diasMes), ritmo = rtz.projetado, semLanc = !doMes().length;
  const cob = d.caixinha/d.essencial;
  const c1 = cartaoInfo(d.cartoes[0]), semLim=!d.cartoes[0].limite, c1cls=semLim?'ne':stCls(c1.status);
  const aPagar = DEMO.agenda.filter(a=>!isPago(a)&&a.dia>=diaHoje).reduce((s,a)=>s+a.valor,0);
  const caixa=d.caixinha+d.conta;
  const frases = {ok:'Se o plano seguir, em janeiro você fica '+brl0(jan-d.meta)+' acima da meta.',at:'Em janeiro você fica entre o piso e a meta: faltam '+brl0(d.meta-jan)+' para a meta.',ru:'Em janeiro você fica abaixo do piso. Vale rever os gastos.'};
  const mesesMax = base.indexOf(Math.min(...base));
  const porDia={}; gastosMes().forEach(l=>{const dd=+l.data.slice(8); porDia[dd]=(porDia[dd]||0)+l.valor;});
  const maxDia=Math.max(...Object.values(porDia),1);
  const cont={}; DEMO.agenda.forEach(a=>{cont[a.dia]=(cont[a.dia]||[]).concat(a.nome+' '+brl0(a.valor));});
  let faixa=''; for(let i=1;i<=diasMes;i++){
    const v=porDia[i]||0, passado=i<=diaHoje, a=passado&&v>0?(.25+.75*v/maxDia):0;
    faixa+=`<div><div data-d="${i}" class="c ${i===diaHoje?'hj':''} ${passado?'':'fut'}" style="${a?`background:color-mix(in srgb,var(--pink) ${Math.round(a*100)}%,transparent)`:''}" title="Dia ${i}${v?': gasto '+brl(v):''}${cont[i]?' | Vence: '+esc(cont[i].join(', ')):''}">${cont[i]?'<b></b>':''}</div><div class="l"><span class="${[1,5,10,15,20,25,diasMes].includes(i)?'key':''}">${i}</span></div></div>`;
  }
  const prox = proximasContas().slice(0,3);
  const pCaixa = pn('Caixa hoje'+info('Caixinha (reserva) mais o saldo da conta corrente. O rótulo à direita mostra quantos meses do gasto essencial a caixinha cobre.'),`<div class="big hero">${brl(caixa)}</div><div class="mu small">caixinha ${brl(d.caixinha)} + conta ${brl(d.conta)}</div>`,'teal','','reserva '+num1(cob)+' m');
  const pCart = semLim?pn('Fatura do cartão'+info('Fatura fechada em ' + d.cartoes[0].fecha + '. Informe o limite na tela Cartão para ver o quanto dele você usa.'),`<div class="big">${brl(d.cartoes[0].fatura)}</div><div class="mu small">vence dia ${d.cartoes[0].vence} · parcelas que ainda vêm ${brl0(d.cartoes[0].parcelasFuturas)}</div><span class="tag ne" style="margin-top:6px">Limite a informar</span>`,'vio'):pn('Limite do cartão usado'+info('Quanto do limite total você já comprometeu: fatura atual mais parcelas que ainda vêm. Até 30% é considerado saudável; acima de 60%, risco.'),`<div class="big">${pc(c1.utilizacao,0)}</div><div class="bar uso" style="--h:${COR[c1cls]}"><span style="width:${Math.min(c1.utilizacao,1)*100}%"></span><i style="left:30%"></i></div><div class="mu small">disponível ${brl0(c1.disponivel)} · ideal até 30%</div>`,'vio');
  const pLazer = pn('Lazer restante'+info('Teto de lazer do mês menos o que você já gastou em lançamentos marcados como lazer.'),`<div class="big">${brl0(Math.max(restante,0))}</div><div class="bar" style="--h:${COR[lzCls]}"><span style="width:${Math.min(pct,1)*100}%"></span></div><div class="mu small">gasto ${brl0(gasto)} de ${brl0(d.tetoLazer)}</div>`,'pink');
  const pJan = pn('Saldo em janeiro',`<div class="big">${brl0(jan)}</div><div class="mu small">meta ${brl0(d.meta)}</div><span class="tag ${cls}" style="margin-top:6px">${icn} ${txt}</span>`,'sky');
  const pFaixa = pn('Faixa do mês'+info('Um quadrado por dia. Quanto mais forte o rosa, mais você gastou naquele dia. O ponto violeta marca conta que vence.'),`<div class="strip" style="grid-template-columns:repeat(${diasMes},1fr)">${faixa}</div><div class="legend"><span><i style="background:var(--pink)"></i>dia com gasto (quanto mais forte, mais gasto)</span><span><i style="background:var(--vio);height:7px;width:7px;border-radius:50%"></i>conta vence</span><span><i style="background:transparent;border:1px dashed var(--ln2);height:9px;width:14px"></i>dias que vêm</span><span>clique num dia para ver o que houve</span></div><div id="diadet" style="margin-top:14px"></div>`,'pink','margin-bottom:14px',hoje.toLocaleDateString('pt-BR',{month:'long'}));
  const pGraf = pn('Saldo previsto (cenário Base)',hjHtml(),'sky');
  const pProxF = prox => pn('Próximas contas',prox.length?`<table>${prox.map(a=>`<tr><td><b>${esc(a.nome)}</b><div class="mu small">${a.dias<0?'venceu há '+(-a.dias)+' dias':a.dias===0?'vence hoje':'em '+a.dias+' dias, dia '+a.dia}</div></td><td class="n">${brl0(a.valor)}</td></tr>`).join('')}</table>`:'<div class="mu">Tudo pago neste mês.</div>','vio');
  const pPerc = pn('O que eu percebi',`
      ${semLim?'':`<div class="ins"><div class="d ${c1cls}">${ST[c1cls][0]}</div><div><b>Você usa ${pc(c1.utilizacao,0)} do limite do cartão</b><div class="mu small">${c1.utilizacao>.3?'O ideal é até 30% ('+brl0(c1.limiteSaudavel)+'). Reduzir o uso ajuda no score de crédito.':'Uso dentro do ideal.'}</div></div></div>`}
      ${semLanc?`<div class="ins"><div class="d ne">·</div><div><b>Nenhum lançamento este mês ainda</b><div class="mu small">Quando você lançar gastos, a projeção do lazer aparece aqui.</div></div></div>`:rtz.poucos?`<div class="ins"><div class="d ne">·</div><div><b>Poucos dados para projetar o lazer</b><div class="mu small">A projeção aparece a partir do dia ${TFStore.RITMO_MIN_DIAS} do mês. Até agora: ${brl0(gasto)} de ${brl0(d.tetoLazer)}.</div></div></div>`:`<div class="ins"><div class="d ${ritmo>d.tetoLazer?'at':'ok'}">${ritmo>d.tetoLazer?AV:IOK}</div><div><b>${ritmo>d.tetoLazer?'Neste ritmo o lazer passa do teto':'Neste ritmo o lazer fecha dentro do teto'}</b><div class="mu small">Projeção do mês: ${brl0(ritmo)} de ${brl0(d.tetoLazer)}.</div></div></div>`}
      <div class="ins"><div class="d at">${AV}</div><div><b>Mês mais apertado: ${d.meses[mesesMax]}</b><div class="mu small">Saldo previsto de ${brl0(Math.min(...base))}. Evite compras grandes até lá.</div></div></div>`,'teal');
  const pCat = pn('Para onde foi o dinheiro este mês',catBars(),'pink');
  if(MOB()){
    const al=[];
    if(!semLim && c1.utilizacao>.3) al.push([c1.utilizacao>.6?2:1, alerta(c1.utilizacao>.6?'ru':'at','Você usa '+pc(c1.utilizacao,0)+' do limite do cartão (ideal até 30%).')]);
    if(caixa<aPagar) al.push([3, alerta('ru','O caixa não cobre as contas até o fim do mês.')]);
    if(!semLanc && restante<0) al.push([2, alerta('ru','O lazer passou do teto em '+brl0(-restante)+'.')]);
    else if(!semLanc && !rtz.poucos && ritmo>d.tetoLazer) al.push([1, alerta('at','Neste ritmo o lazer passa do teto.')]);
    if(cls==='ru') al.push([2, alerta('ru','Em janeiro o saldo fica abaixo do piso.')]);
    const vazio = semLanc ? pn('Nada lançado este mês ainda','<div class="small mu">Com o primeiro gasto, o lazer, o ritmo e as categorias começam a aparecer.</div><button class="btn" data-ir="lancar" style="margin-top:12px;width:100%">Lançar gasto</button>','teal','margin-bottom:14px') : '';
    const mini = `<div class="mini3"><div class="mini"><div class="mu small">Cartão usado</div><b>${semLim?'—':pc(c1.utilizacao,0)}</b></div><div class="mini"><div class="mu small">Lazer restante</div><b>${brl0(Math.max(restante,0))}</b></div><div class="mini"><div class="mu small">Saldo em jan (previsto)</div><b>${aprox(jan)}</b></div></div>`;
    return `
    <div class="head"><div><h1>Hoje</h1><div class="sub">Resumo de ${hoje.toLocaleDateString('pt-BR',{day:'numeric',month:'long'})}</div></div></div>
    <div class="pn verdict compacto" style="--h:${COR[cls]}">
      <div class="ico ${cls}">${icn}</div>
      <div><span class="tag ${cls}">${icn} ${txt}</span><h2 style="margin-top:8px">${cls==='ok'?'Você está no caminho certo':cls==='at'?'Atenção: dá para melhorar':'Alerta: o plano está apertado'}</h2><div class="mu">${frases[cls]}</div></div>
    </div>
    ${alertas(al)}
    ${pn('Caixa hoje'+info('Caixinha (reserva) mais o saldo da conta corrente. O rótulo à direita mostra quantos meses do gasto essencial a caixinha cobre.'),`<div class="big hero">${brl(caixa)}</div><div class="mu small">caixinha ${brl(d.caixinha)} + conta ${brl(d.conta)}</div><div class="mu small" style="margin-top:6px">Contas até o fim do mês: <b style="color:var(--tx)">${brl0(aPagar)}</b> <span class="tag ${caixa>=aPagar?'ok':'ru'}">${caixa>=aPagar?IOK+' Caixa cobre':IX+' Não cobre'}</span></div>`,'teal','','reserva '+num1(cob)+' m')}
    ${vazio}
    ${pProxF(prox.slice(0,2))}
    ${det('hoje','det','Ver detalhes',mini+(DEMO.real?blocoReal():'')+pFaixa+pGraf+pPerc,'teal')}`;
  }
  return `
  <div class="head"><div><h1>Olá! Como estão suas finanças</h1><div class="sub">Resumo de ${hoje.toLocaleDateString('pt-BR',{day:'numeric',month:'long'})}</div></div></div>
  <div class="pn verdict" style="--h:${COR[cls]}">
    <div class="ico ${cls}">${icn}</div>
    <div><span class="tag ${cls}">${icn} ${txt}</span><h2 style="margin-top:8px">${cls==='ok'?'Você está no caminho certo':cls==='at'?'Atenção: dá para melhorar':'Alerta: o plano está apertado'}</h2><div class="mu">${frases[cls]}</div></div>
    <div style="text-align:right" class="small mu">Contas até o fim do mês<div class="mid" style="color:var(--tx)">${brl0(aPagar)}</div><span class="tag ${caixa>=aPagar?'ok':'ru'}">${caixa>=aPagar?IOK+' O caixa cobre':IX+' Caixa não cobre'}</span></div>
  </div>
  <div class="grid g4" style="margin-bottom:14px">
    ${pCaixa}
    ${pCart}
    ${pLazer}
    ${pJan}
  </div>
  ${DEMO.real?blocoReal():''}
  ${pFaixa}
  <div class="grid g32" style="margin-bottom:14px">
    ${pGraf}
    ${pProxF(prox)}
  </div>
  <div class="grid g2">
    ${pPerc}
    ${pCat}
  </div>`;
};

/* --- Lançar --- */
let mesVer = mesAtual, editId = null, lastDel = null, startEditFn = null;
const pad2 = n => String(n).padStart(2,'0');
const mesTitulo = m => { const [y,mm]=m.split('-').map(Number); return new Date(y,mm-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}); };
const mesMove = (m,dl) => { const [y,mm]=m.split('-').map(Number), dt=new Date(y,mm-1+dl,1); return dt.getFullYear()+'-'+pad2(dt.getMonth()+1); };
function lancarM(){
  const formas=TFStore.FORMAS;
  return `
  <div class="head"><div><h1>Lançar</h1><div class="sub">Valor, o que foi e pronto.</div></div></div>
  ${pn('<span id="ftitle">Novo lançamento</span>',`
    <div class="seg" id="tipo" role="group" aria-label="Tipo de lançamento"><button aria-pressed="true" data-t="saida">Gasto</button><button aria-pressed="false" data-t="entrada">Entrada</button></div>
    <div class="field"><label for="q_txt">Lançamento rápido ${info('Escreva como falaria: "45 mercado pix", "12,06 uber ontem" ou "recebi 255 do tio". O app preenche o formulário abaixo e você confere antes de salvar.')}</label><div class="row" style="gap:8px"><input id="q_txt" type="text" placeholder="Ex.: 45 mercado pix" autocomplete="off"><button class="ibtn tonal" id="q_ok" type="button" aria-label="Preencher o formulário com o texto" title="Preencher o formulário com o texto">${I.enviar}</button></div><div class="mu small" id="q_msg" role="status"></div></div>
    <div class="field"><label for="f_valor">Valor (R$)</label><input id="f_valor" type="number" step="0.01" min="0" placeholder="0,00" inputmode="decimal" style="font-size:26px;font-weight:600"></div>
    <div class="field"><label for="f_desc">O que foi?</label><input id="f_desc" type="text" placeholder="Ex.: almoço, jogo, mercado"></div>
    <div class="field"><label id="l_cat">Categoria</label><div class="chips" id="f_cat" role="group" aria-labelledby="l_cat">${CATS.map((c,i)=>`<button class="chip" aria-pressed="${i===0}" data-c="${c}">${c}</button>`).join('')}</div></div>
    <div class="field"><label id="l_forma">Pago com</label><div class="pg4" id="f_forma_b" role="group" aria-labelledby="l_forma">${formas.map((f,i)=>`<button type="button" data-f="${f}" aria-pressed="${i===0}">${f}</button>`).join('')}</div><select id="f_forma" hidden aria-hidden="true" tabindex="-1">${formas.map(f=>`<option>${f}</option>`).join('')}</select></div>
    <div class="clas"><span id="clas_txt" role="status"></span><button class="linkbtn" id="clas_mudar" type="button" aria-expanded="false">mudar</button></div>
    ${det('lancar','mais','Mais opções: data e classificação',`<div class="field"><label for="f_data">Data</label><input id="f_data" type="date" value="${mesAtual}-${pad2(diaHoje)}"></div>
      <div class="toggle" style="margin-bottom:12px"><label><input type="checkbox" id="f_ess"> Essencial</label><label><input type="checkbox" id="f_laz" checked> Conta no lazer</label></div>
      ${NEUTRO_CAMPO}
      <div class="dica" id="dica" style="margin-bottom:0"></div>`,'teal')}`,'teal')}
  <div class="salvarfixo acoes"><div id="f_msg" class="hint" role="status" style="flex:1 0 100%;margin:0"></div><button class="btn" id="f_ok">Salvar lançamento</button><button class="btn ghost" id="f_cancel" style="display:none">Cancelar</button></div>
  ${pn('Lançamentos',`<div id="lz_resumo"></div><div id="conta_filtro"></div><div id="lista"></div>
    ${det('lancar','busca','Buscar e exportar',`<input type="text" id="busca" placeholder="Buscar por nome, categoria ou forma de pagamento…" aria-label="Buscar lançamentos" style="margin-bottom:12px"><div class="row" style="flex-wrap:wrap"><span class="hint">Seus lançamentos ficam neste aparelho e no seu Google Drive.</span><button class="ibtn tonal" id="exp" type="button" aria-label="Exportar lançamentos em CSV" title="Exportar lançamentos em CSV">${I.baixar}</button></div>`,'pink')}`,'pink','',`<span><button class="x" id="mprev" aria-label="Mês anterior">${I.esq}</button> <span id="mnome" style="color:var(--tx)"></span> <button class="x" id="mnext" aria-label="Próximo mês">${I.dir}</button></span>`)}
  ${MODO!=='demo'?'':det('lancar','freq','Atalhos de lançamento',`<div class="chips" id="freq" style="--h:var(--teal)">${FREQ.map((f,i)=>`<button class="chip" data-i="${i}">${f.desc} · ${brl0(f.valor)}</button>`).join('')}</div>`,'teal')}
  ${det('lancar','guia','Ajuda: essencial ou lazer',`<div class="guia">
      <div class="g"><span class="tag ok">Essencial</span><div class="small">Se você não pagar, sua rotina básica quebra. <span class="mu">Ex.: mercado, transporte, saúde, faculdade, contas básicas.</span></div></div>
      <div class="g"><span class="tag at">Lazer</span><div class="small">É escolha e dá para adiar. <span class="mu">Ex.: jogos, cinema, delivery, passeios.</span></div></div>
      <div class="g"><span class="tag ne">Teste</span><div class="small"><b>Se eu não pagar isso este mês, o que acontece?</b> <span class="mu">Algo importante quebra: essencial. Só perco o prazer: lazer.</span></div></div></div>`,'teal')}`;
}
T.lancar = () => MOB() ? lancarM() : `
  <div class="head"><div><h1>Lançar gasto ou entrada</h1><div class="sub">Rápido: valor, o que foi e pronto. Errou algo? Toque no lápis ${ILAPIS} da lista para corrigir.</div></div></div>
  <div class="grid g2">
    ${pn('<span id="ftitle">Novo lançamento</span>',`
      <div class="seg" id="tipo" role="group" aria-label="Tipo de lançamento"><button aria-pressed="true" data-t="saida">Gasto</button><button aria-pressed="false" data-t="entrada">Entrada</button></div>
      <div class="field"><label for="q_txt">Lançamento rápido ${info('Escreva como falaria: "45 mercado pix", "12,06 uber ontem" ou "recebi 255 do tio". O app preenche o formulário abaixo e você confere antes de salvar.')}</label><div class="row" style="gap:8px"><input id="q_txt" type="text" placeholder="Ex.: 45 mercado pix" autocomplete="off"><button class="ibtn tonal" id="q_ok" type="button" aria-label="Preencher o formulário com o texto" title="Preencher o formulário com o texto">${I.enviar}</button></div><div class="mu small" id="q_msg" role="status"></div></div>
      <div class="field"><label>Valor (R$)</label><input id="f_valor" type="number" step="0.01" min="0" placeholder="0,00" style="font-size:26px;font-weight:600"></div>
      <div class="field"><label>O que foi?</label><input id="f_desc" type="text" placeholder="Ex.: almoço, jogo, mercado"></div>
      <div class="field"><label>Categoria ${info('Escolha a que mais combina. Ao escolher, o app já sugere se é essencial ou lazer; você pode mudar.')}</label><div class="chips" id="f_cat">${CATS.map((c,i)=>`<button class="chip" aria-pressed="${i===0}" data-c="${c}">${c}</button>`).join('')}</div></div>
      <div class="g-dp"><div class="field"><label>Data</label><input id="f_data" type="date" value="${mesAtual}-${pad2(diaHoje)}"></div>
      <div class="field"><label>Pago com ${info('Crédito entra na fatura do cartão e pesa no limite. Pix, débito e dinheiro saem da conta na hora.',true)}</label><select id="f_forma"><option>Pix</option><option>Débito</option><option>Crédito</option><option>Dinheiro</option></select></div></div>
      <div class="toggle" style="margin-bottom:18px"><label><input type="checkbox" id="f_ess"> Essencial ${info('Gasto sem o qual sua rotina básica quebra: moradia, comida de casa, transporte para trabalho ou aula, saúde, faculdade, contas básicas. Não conta no teto de lazer.')}</label><label><input type="checkbox" id="f_laz" checked> Conta no lazer ${info('Marque se é escolha e dá para adiar: jogos, cinema, delivery, passeios. Entra no teto de lazer do mês.',true)}</label></div>
      ${NEUTRO_CAMPO}
      <div class="dica" id="dica"></div>
      <div class="row acoes" style="justify-content:flex-start"><button class="btn" id="f_ok">Salvar lançamento</button><button class="btn ghost" id="f_cancel" style="display:none">Cancelar</button></div><div id="f_msg" class="hint"></div>`,'teal')}
    ${pn('Lançamentos',`<input type="text" id="busca" placeholder="Buscar por nome, categoria ou forma de pagamento…" style="margin-bottom:12px"><div id="lz_resumo"></div><div id="conta_filtro"></div><div id="lista"></div>
      <div class="row" style="margin-top:14px"><span class="hint">Seus lançamentos ficam neste aparelho e no seu Google Drive. Exporte o CSV para levar à planilha.</span><button class="ibtn tonal" id="exp" type="button" aria-label="Exportar lançamentos em CSV" title="Exportar lançamentos em CSV">${I.baixar}</button></div>`,'pink','',`<span><button class="x" id="mprev" aria-label="Mês anterior">${I.esq}</button> <span id="mnome" style="color:var(--tx)"></span> <button class="x" id="mnext" aria-label="Próximo mês">${I.dir}</button></span>`)}
  </div>
  <div class="grid g2" style="margin-top:14px">
    <div>
    ${MODO!=='demo'?'':pn('Lançamentos frequentes (um toque preenche)',`<div class="chips" id="freq" style="--h:var(--teal)">${FREQ.map((f,i)=>`<button class="chip" data-i="${i}">${f.desc} · ${brl0(f.valor)}</button>`).join('')}</div><div class="hint" style="margin-top:12px">Na versão real, estes atalhos vêm dos seus lançamentos mais repetidos.</div>`,'teal')}
    ${pn('Como saber se é essencial ou lazer',`<div class="guia">
      <div class="g"><span class="tag ok">Essencial</span><div class="small">Se você não pagar, sua rotina básica quebra. <span class="mu">Ex.: mercado, transporte para trabalhar ou estudar, saúde, faculdade, contas básicas, ajuda em casa.</span></div></div>
      <div class="g"><span class="tag at">Lazer</span><div class="small">É escolha e dá para adiar sem consequência. <span class="mu">Ex.: jogos, cinema, delivery, passeios, assinaturas de entretenimento.</span></div></div>
      <div class="g"><span class="tag ne">Teste rápido</span><div class="small"><b>Se eu não pagar isso este mês, o que acontece?</b> <span class="mu">Algo importante quebra: essencial. Só perco o prazer: lazer.</span></div></div>
      <div class="g"><span class="tag ne">Assinaturas</span><div class="small">Meio-termo. <span class="mu">Se você usa para estudar ou trabalhar, é essencial; se é só diversão, é lazer.</span></div></div>
      <div class="g"><span class="tag ne">Para que serve</span><div class="small"><span class="mu"><b style="color:var(--tx)">Conta no lazer</b> entra no teto de lazer (hoje: lazer, jogos e comida fora de casa). <b style="color:var(--tx)">Essencial</b> ajuda a calcular quantos meses sua reserva dura.</span></div></div>
    </div>`,'teal','margin-top:14px')}
    </div>
    ${pn('Para onde foi neste mês',catBars(),'pink')}
  </div>`;
function bindLancar(){
  let cat='Lazer', tipo='saida';
  const setCat=c=>{ cat=c; $$('#f_cat .chip').forEach(x=>x.setAttribute('aria-pressed',x.dataset.c===c)); };
  const aplica=()=>{ if(editId!=null){ $('#dica').innerHTML='<b>Editando.</b> Ajuste os marcadores se a classificação estiver errada.'; return; }
    const sg=sugerir(cat,$('#f_desc').value); $('#f_ess').checked=sg.ess; $('#f_laz').checked=sg.laz&&tipo==='saida';
    $('#dica').innerHTML=sg.t+' <span class="mu">Sugestão automática: você pode mudar os marcadores.</span>'; clasTxt(); };
  const sincForma=()=>{ $$('#f_forma_b button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===$('#f_forma').value)); };
  $$('#f_forma_b button').forEach(b=>b.onclick=()=>{ $('#f_forma').value=b.dataset.f; sincForma(); });
  $('#f_forma').addEventListener('change',sincForma);
  const clasTxt=()=>{ const t=$('#clas_txt'); if(!t) return; t.textContent = $('#f_neu').checked ? 'Não é gasto' : tipo==='entrada' ? 'Entrada · não conta como essencial nem lazer' : $('#f_laz').checked ? 'Conta no lazer' : $('#f_ess').checked ? 'Essencial' : 'Sem classificação'; };
  $('#f_ess').onchange=$('#f_laz').onchange=$('#f_neu').onchange=clasTxt;
  const cm=$('#clas_mudar'); if(cm) cm.onclick=()=>{ const d=$('details[data-det="lancar:mais"]'); if(d){ d.open=true; DET['lancar:mais']=1; save0('tf_det',DET); } cm.setAttribute('aria-expanded','true'); $('#f_ess').focus(); };
  const setTipo=t=>{ tipo=t; $$('#tipo button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.t===t)); };
  const reset=()=>{ editId=null; $('#f_valor').value=''; $('#f_desc').value=''; $('#f_data').value=mesAtual+'-'+pad2(diaHoje); $('#f_ess').checked=false; $('#f_laz').checked=true; $('#f_neu').checked=false; setTipo('saida'); setCat('Lazer'); $('#ftitle').textContent='Novo lançamento'; $('#f_ok').textContent='Salvar lançamento'; $('#f_cancel').style.display='none'; aplica(); };
  $$('#freq .chip').forEach(b=>b.onclick=()=>{ const f=FREQ[+b.dataset.i]; reset(); $('#f_valor').value=f.valor; $('#f_desc').value=f.desc; setCat(f.cat); $('#f_forma').value=f.forma; sincForma(); $('#f_laz').checked=f.lazer; clasTxt(); $('#f_valor').focus(); });
  $$('#tipo button').forEach(b=>b.onclick=()=>{ setTipo(b.dataset.t); if(b.dataset.t==='entrada'){ $('#f_laz').checked=false; $('#f_ess').checked=false; $('#dica').innerHTML='<b>Entrada é dinheiro que chegou</b> (salário, repasse, extra). Não é essencial nem lazer.'; clasTxt(); } else aplica(); });
  $$('#f_cat .chip').forEach(b=>b.onclick=()=>{ setCat(b.dataset.c); aplica(); });
  $('#f_desc').oninput=()=>{ if(cat==='Comida') aplica(); };
  aplica();
  $('#f_ok').onclick=()=>{
    const dados={tipo:tipo==='entrada'?'entrada':'gasto',valor:$('#f_valor').value,desc:$('#f_desc').value,cat,data:$('#f_data').value,forma:$('#f_forma').value,essencial:$('#f_ess').checked,lazer:$('#f_laz').checked,neutro:$('#f_neu').checked};
    S.falhouGravar();   // zera uma falha antiga: o aviso abaixo fala só deste toque
    const editando=editId!=null, r=editando?S.editar(editId,dados):S.lancar(dados);
    ['valor','data'].forEach(k=>{ const el=$('#f_'+k); if(el) el.setAttribute('aria-invalid',r.ok||!r.erros[k]?'false':'true'); });
    if(!r.ok){ $('#f_msg').innerHTML='<span class="tag ru" role="alert">'+IX+' '+esc(r.erros.valor||r.erros.data||r.erros.cat||r.erros.geral)+'</span>'; return; }
    mesVer=dados.data.slice(0,7); reset(); $('#f_msg').innerHTML=S.falhouGravar()?'<span class="tag ru" role="alert">'+IX+' Não consegui guardar neste aparelho: o armazenamento está cheio ou bloqueado. O lançamento some se a página for recarregada.</span>':IOK+(editando?' Alteração salva.':' Salvo.'); drawLista();
  };
  const rapido=()=>{
    const r=TFStore.interpretarTexto($('#q_txt').value,S.hojeISO());
    if(!r.ok){ $('#q_msg').innerHTML='<span class="tag ru" role="alert">'+IX+' '+esc(r.erro)+'</span>'; return; }
    reset(); setTipo(r.tipo==='entrada'?'entrada':'saida'); setCat(r.cat);
    $('#f_valor').value=r.valor; $('#f_desc').value=r.desc; $('#f_forma').value=r.forma; sincForma(); $('#f_data').value=r.data;
    if(r.tipo==='entrada'){ $('#f_ess').checked=false; $('#f_laz').checked=false; } else { const sg=sugerir(r.cat,r.desc); $('#f_ess').checked=sg.ess; $('#f_laz').checked=sg.laz; $('#dica').innerHTML=sg.t; }
    clasTxt();
    $('#q_msg').innerHTML='<span class="tag ok">'+IOK+' Preenchido. Confira e toque em Salvar.</span>'; $('#q_txt').value=''; $('#f_ok').focus();
  };
  $('#q_ok').onclick=rapido; $('#q_txt').onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); rapido(); } };
  if(rapidoPendente){ $('#q_txt').value=rapidoPendente; rapidoPendente=''; rapido(); }
  $('#f_cancel').onclick=()=>{ reset(); $('#f_msg').textContent=''; drawLista(); };
  startEditFn=id=>{ const l=lanc.find(x=>String(x.id)===String(id)); if(!l) return; editId=l.id;
    $('#f_valor').value=Math.abs(l.valor); $('#f_desc').value=l.desc; $('#f_data').value=l.data; $('#f_forma').value=l.forma; sincForma(); $('#f_ess').checked=l.essencial; $('#f_laz').checked=l.lazer; $('#f_neu').checked=l.neutro===true;
    setTipo(l.valor<0?'entrada':'saida'); setCat(l.cat); $('#ftitle').textContent='Corrigir lançamento'; $('#f_ok').textContent='Salvar alteração'; $('#f_cancel').style.display=''; $('#f_msg').textContent='Corrija o que precisar e salve.'; aplica();
    window.scrollTo(0,0); drawLista(); };
  $('#busca').oninput=()=>drawLista();
  if(prefillData){ $('#f_data').value=prefillData; prefillData=null; }
  if(lancarAntes){ lancarAntes=false; const e=$('#f_data'), caixa=e.closest('details'); if(caixa) caixa.open=true; e.min=mesAtual+'-01'; e.max=mesAtual+'-'+pad2(diaHoje); }
  $('#mprev').onclick=()=>{ mesVer=mesMove(mesVer,-1); drawLista(); };
  $('#mnext').onclick=()=>{ mesVer=mesMove(mesVer,1); drawLista(); };
  $('#exp').onclick=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+S.exportarCSV()],{type:'text/csv'})); a.download='lancamentos_reais_'+mesAtual+'.csv'; a.click(); };
  drawLista();
}
const NEUTRO_TAG='<span class="tag ne">não é gasto</span>', NEUTRO_CAMPO='<div class="toggle bc-neu"><label><input type="checkbox" id="f_neu"> Não é gasto (transferência entre suas contas ou reserva)</label></div>';
/* filtro por conta: só aparece quando o mês tem lançamento com conta */
let contaFiltro='';
function contaFiltroPinta(doM){
  const el=$('#conta_filtro'); if(!el) return;
  const nomes=new Map(); let semConta=false; doM.forEach(l=>{ if(l.contaId){ if(!nomes.has(l.contaId)) nomes.set(l.contaId,l.contaNome); } else semConta=true; });
  if(!nomes.size){ contaFiltro=''; if(el.innerHTML) el.innerHTML=''; return; }
  if(contaFiltro&&contaFiltro!=='__sem'&&!nomes.has(contaFiltro)) contaFiltro='';
  if(contaFiltro==='__sem'&&!semConta) contaFiltro='';
  const op=[...nomes].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'pt-BR')).map(([id,n])=>`<option value="${esc(id)}"${id===contaFiltro?' selected':''}>${esc(n)}</option>`).join('');
  el.innerHTML=`<div class="flt-conta"><label for="flt_conta">Filtrar por conta</label><select id="flt_conta"><option value="">Todas as contas</option>${op}${semConta?`<option value="__sem"${contaFiltro==='__sem'?' selected':''}>Sem conta</option>`:''}</select></div>`;
  const voltou=document.activeElement&&document.activeElement.id==='flt_conta';
  $('#flt_conta').onchange=e=>{ contaFiltro=e.target.value; drawLista(); const s=$('#flt_conta'); if(s) s.focus(); };
  if(voltou) $('#flt_conta').focus();
}
function drawLista(){
  const doM=lanc.filter(l=>l.data.startsWith(mesVer)), g=doM.filter(l=>l.lazer&&l.valor>0&&!l.neutro).reduce((s,l)=>s+l.valor,0), pct=g/DEMO.tetoLazer, cls=pct<=.75?'ok':pct<=1?'at':'ru';
  $('#mnome').textContent=mesTitulo(mesVer);
  if(!DEMO.tetoLazer) $('#lz_resumo').innerHTML=''; else $('#lz_resumo').innerHTML=`<div class="row"><span class="mu small">Lazer: ${brl(g)} de ${brl0(DEMO.tetoLazer)}</span><span class="tag ${cls}">${ST[cls][0]} ${pct>1?'passou '+brl0(g-DEMO.tetoLazer):brl0(DEMO.tetoLazer-g)+' restantes'}</span></div><div class="bar" style="--h:${COR[cls]}"><span style="width:${Math.min(pct,1)*100}%"></span></div>`;
  const q=(($('#busca')||{}).value||'').toLowerCase().trim();
  contaFiltroPinta(doM);
  const rows=[...doM].filter(l=>!q||(l.desc+' '+l.cat+' '+(l.forma||'')+' '+(l.contaNome||'')).toLowerCase().includes(q)).filter(l=>!contaFiltro||(contaFiltro==='__sem'?!l.contaId:l.contaId===contaFiltro)).sort((a,b)=>b.data.localeCompare(a.data));
  $('#lista').innerHTML = rows.length ? `<table class="lt"><tr><th>Dia</th><th>O que</th><th class="n">Valor</th><th></th><th></th></tr>${rows.map(l=>`<tr style="${String(l.id)===String(editId)?'background:var(--p2)':''}"><td>${esc(l.data.slice(8))}</td><td>${esc(l.desc)}<div class="mu small">${esc(l.cat)}${l.lazer?' · lazer':''}${l.forma?' · '+esc(l.forma):''}${l.contaNome?' · '+esc(l.contaNome):''}</div>${l.neutro?NEUTRO_TAG:''}</td><td class="n" style="color:${l.valor<0?'var(--ok)':'inherit'}">${l.valor<0?'+':''}${brl(Math.abs(l.valor))}</td><td class="b"><button class="x" data-ed="${l.id}" title="Corrigir" aria-label="Corrigir">${I.editar}</button></td><td class="b"><button class="x" data-id="${l.id}" title="Apagar" aria-label="Apagar">${I.apagar}</button></td></tr>`).join('')}</table>` : '<div class="mu">Nenhum lançamento neste mês.</div>'+(MOB()?'<button class="btn ghost" id="primeiro" style="margin-top:12px;width:100%">Lançar o primeiro gasto</button>':'');
  const pr1=$('#primeiro'); if(pr1) pr1.onclick=()=>{ const v=$('#f_valor'); if(v.scrollIntoView) v.scrollIntoView({block:'center'}); v.focus(); };
  if(q||contaFiltro) $('#lista').insertAdjacentHTML('beforeend',`<div class="hint">${rows.length} resultado(s) · total ${brl(rows.reduce((s,l)=>s+Math.abs(l.valor),0))}</div>`);
  $$('#lista [data-ed]').forEach(b=>b.onclick=()=>startEditFn&&startEditFn(b.dataset.ed));
  $$('#lista [data-id]').forEach(b=>b.onclick=()=>{ lastDel=S.apagar(b.dataset.id); if(String(editId)===b.dataset.id) editId=null; drawLista();
    $('#f_msg').innerHTML='Lançamento apagado. <a href="#" id="undo" style="color:var(--teal)">Desfazer</a>'; $('#undo').onclick=e=>{ e.preventDefault(); if(lastDel){ S.desfazerApagar(lastDel); lastDel=null; drawLista(); $('#f_msg').textContent=IOK+' Desfeito.'; } }; });
}

/* --- Cartão --- */
let cartSel='c1';
T.cartao = () => `
  <div class="head"><div><h1>Cartão de crédito</h1><div class="sub">Limite, fatura e o melhor dia para comprar.</div></div>
    <div class="chips" id="cts" style="--h:var(--vio)">${DEMO.cartoes.map(c=>`<button class="chip" aria-pressed="${c.id===cartSel}" data-c="${esc(c.id)}">${esc(c.nome)}${c.final?' ••'+esc(c.final):''}</button>`).join('')}</div></div>
  <div id="cart"></div>`;
function drawCartao(){
  const c=DEMO.cartoes.find(x=>x.id===cartSel), i=cartaoInfo(c), cls=stCls(i.status);
  const ehPrincipal = c.id==='c1';
  const pCabe = pn('Cabe esta compra?'+info('Digite um valor e veja quanto do limite você passaria a usar e se continua dentro do ideal.'),`<div class="field"><label>Valor da compra (R$)</label><input type="number" id="sim_v" value="800" min="0" step="50"></div><div id="sim_out"></div>`,'vio');
  const pParc = pn('Parcelas que ainda vêm',c.serie?serieTabela(c):ehPrincipal?`<table class="rt"><tr><th>Compra</th><th class="n">Parcela</th><th class="n">Faltam</th><th class="n">Total</th></tr>${DEMO.parcelamentos.map(p=>`<tr><td class="tt"><b>${esc(p.nome)}</b></td><td class="n" data-l="Parcela">${brl0(p.parcela)}</td><td class="n" data-l="Faltam">${p.restam} de ${p.total}</td><td class="n" data-l="Total">${brl0(p.parcela*p.restam)}</td></tr>`).join('')}</table>`:'<div class="mu">Sem parcelamentos neste cartão.</div>','vio');
  const pPeso = pn('Quanto o cartão pesa nos próximos meses',(()=>{ const v=c.serie?[c.fatura,...c.serie.slice(0,5).map(f=>f.fatura_total)]:[0,1,2,3,4,5].map(k=>(k===0?c.fatura:0)+(ehPrincipal?DEMO.parcelamentos.filter(p=>p.restam>k).reduce((s,p)=>s+p.parcela,0):0)); const mx=Math.max(...v,1);
      return `<div class="vb">${v.map((x,k)=>`<div><em>${brl0(x)}</em><span style="height:${Math.max(x/mx*100,2)}%"></span><small>${mesNome(k)}</small></div>`).join('')}</div><div class="hint">Fatura do mês mais as parcelas que ainda estão rodando. Sem novas compras, o peso cai a cada mês.</div>`; })(),'vio');
  const pLim = c.limite||!DEMO.real?'':pn('Informe o limite do cartão'+info('Não veio no seu arquivo. Com o limite, o app calcula o uso (ideal até 30%) e o quanto cabe de nova compra.'),`<div class="row" style="gap:12px;align-items:end"><div class="field" style="flex:1;margin:0"><label>Limite total (R$)</label><input type="number" id="lim_v" min="0" step="50" placeholder="ex.: 3000"></div><button class="btn" id="lim_ok">Salvar limite</button></div>`,'vio','margin-bottom:14px');
  const al=[];
  if(c.limite && cls!=='ok') al.push([cls==='ru'?2:1, alerta(cls==='ru'?'ru':'at', (cls==='ru'?'Uso do limite muito alto: ':'Uso do limite acima do ideal: ')+pc(i.utilizacao,0)+' (ideal até 30%).')]);
  if(c.limite && i.usado>c.limite) al.push([3, alerta('ru','A fatura mais as parcelas passam do limite do cartão.')]);
  const html = MOB() ? `
  ${pLim}
  <div class="card3d"><div class="mu small">${esc(c.nome)}</div><div class="mid cardnum">${c.final?'•••• •••• •••• '+esc(c.final):'cartão de crédito'}</div><div class="row stats3" style="margin-top:14px"><div><div class="mu small">Fecha dia</div><div class="mid">${c.fecha}</div></div><div><div class="mu small">Vence dia</div><div class="mid">${c.vence}</div></div><div><div class="mu small">Melhor dia</div><div class="mid" style="color:var(--vio)">${i.melhorDiaCompra}</div></div></div></div>
  ${alertas(al)}
  ${pn('Limite usado'+info('A barra mostra quanto do limite você usa. O traço marca 30%, o uso considerado saudável.'),`<div class="big">${pc(i.utilizacao,0)}</div><div class="bar uso" style="--h:${COR[cls]};margin-top:12px"><span style="width:${Math.min(i.utilizacao,1)*100}%"></span><i style="left:30%"></i></div><div class="mu small">disponível ${brl0(i.disponivel)} de ${brl0(c.limite)} · ideal até ${brl0(i.limiteSaudavel)}</div>`,'vio')}
  ${pn('Fatura atual',`<div class="big">${brl(c.fatura)}</div><div class="mu small">parcelas que ainda vêm ${brl0(c.parcelasFuturas)} · ${i.diasParaFechar==null?'já fechou neste mês':'fecha em '+i.diasParaFechar+' dias'}</div>`,'vio')}
  ${det('cartao','det','Ver detalhes',pCabe+pParc+pPeso,'vio')}` : `
  ${pLim}
  <div class="grid g3" style="margin-bottom:14px">
    <div class="card3d"><div class="chip2"></div><div class="mu small" style="overflow-wrap:anywhere">${esc(c.nome)}</div><div class="mid cardnum">${c.final?'•••• •••• •••• '+esc(c.final):'cartão de crédito'}</div><div class="row stats3" style="margin-top:22px"><div><div class="mu small">Fecha dia</div><div class="mid">${esc(c.fecha)}</div></div><div><div class="mu small">Vence dia</div><div class="mid">${esc(c.vence)}</div></div><div><div class="mu small">Melhor dia de compra</div><div class="mid" style="color:var(--vio)">${i.melhorDiaCompra}</div></div></div></div>
    ${pn('Limite'+info('A barra mostra quanto do limite você usa. O traço branco marca 30%, o uso considerado saudável. Usar muito do limite pesa no seu score de crédito.'),`<div class="row"><div><div class="mu small">Disponível</div><div class="big">${brl0(i.disponivel)}</div></div><div style="text-align:right"><div class="mu small">Limite total</div><div class="mid">${brl0(c.limite)}</div></div></div>
      <div class="bar uso" style="--h:${COR[cls]};margin-top:16px"><span style="width:${Math.min(i.utilizacao,1)*100}%"></span><i style="left:30%"></i></div>
      <div class="row small"><span class="mu">usado ${brl0(i.usado)} (${pc(i.utilizacao,0)})</span><span class="mu">| ideal até ${brl0(i.limiteSaudavel)}</span></div>
      <span class="tag ${cls}" style="margin-top:12px">${ST[cls][0]} ${cls==='ok'?'Uso saudável':cls==='at'?'Uso elevado':'Uso muito alto'}</span>`,'vio')}
    ${pn('Faturas',`<div class="kv"><span>Fatura atual</span><span>${brl(c.fatura)}</span><span>Parcelas que ainda vêm</span><span>${brl(c.parcelasFuturas)}</span><span>Total comprometido</span><span>${brl(i.usado)}</span><span>${i.diasParaFechar==null?'Já fechou neste mês':'Fecha em'}</span><span>${i.diasParaFechar==null?'—':i.diasParaFechar+' dias'}</span></div>
      <div class="disc">Comprar logo depois do fechamento (dia ${i.melhorDiaCompra}) dá o maior prazo até pagar.</div>`,'vio')}
  </div>
  <div class="grid g2">
    ${pCabe}
    ${pParc}
  </div>
  <div class="grid g2" style="margin-top:14px">
    ${pPeso}
    ${pn('Regras de ouro do cartão',`<div class="ins"><div class="d ok">1</div><div class="small" style="padding-top:5px"><b>Pague sempre o total da fatura.</b> Pagar só o mínimo joga o resto no rotativo, a dívida mais cara que existe.</div></div>
      <div class="ins"><div class="d ok">2</div><div class="small" style="padding-top:5px"><b>Mantenha o uso abaixo de 30% do limite</b> (${c.limite?brl0(c.limite*0.3)+' neste cartão':'30% do limite informado'}). Ajuda no seu score de crédito.</div></div>
      <div class="ins"><div class="d ok">3</div><div class="small" style="padding-top:5px"><b>Compre depois do fechamento</b> (dia ${i.melhorDiaCompra}) para ter até ~40 dias até pagar.</div></div>
      <div class="ins"><div class="d at">4</div><div class="small" style="padding-top:5px"><b>Parcelar sem juros também ocupa limite.</b> Some as parcelas que ainda vêm antes de uma nova compra.</div></div>`,'vio')}
  </div>`;
  $('#cart').innerHTML=html;
  const sim=()=>{ const v=parseFloat($('#sim_v').value)||0, n=Calc.cartao(c.limite,i.usado+v,c.fecha,diaHoje), k=stCls(n.status);
    $('#sim_out').innerHTML=`<div class="res" style="--h:${COR[k]}"><div class="mu small">Com esta compra você usaria</div><div class="big">${pc(n.utilizacao,0)} <span class="mid mu">do limite</span></div><div class="mu">Sobram ${brl0(n.disponivel)} de limite.</div></div>
    <span class="tag ${k}">${ST[k][0]} ${k==='ok'?'Dentro do ideal (até 30%)':k==='at'?'Acima do ideal de 30%':'Uso muito alto'}</span>${i.usado+v>c.limite?'<div class="tag ru" style="margin-top:8px">'+IX+' Passa do limite do cartão</div>':''}`; };
  $('#sim_v').oninput=sim; sim();
  const lb=$('#lim_ok'); if(lb) lb.onclick=()=>{ const r=S.setNumeros({limites:{[c.id]:$('#lim_v').value}}); if(!r.ok){ $('#lim_v').setAttribute('aria-invalid','true'); return; } recalcDemo(); ir('cartao'); };
}
function serieTabela(c){ return `<table class="rt"><tr><th>Fatura de</th><th class="n">Parcelas antigas</th><th class="n">Parte da mãe</th></tr>${c.serie.map(f=>`<tr><td class="tt"><b>${esc(String(f.mes).slice(5))}/${esc(String(f.mes).slice(2,4))}</b></td><td class="n" data-l="Parcelas antigas">${brl(f.fatura_total)}</td><td class="n" data-l="Parte da mãe">${f.parte_mae?brl(f.parte_mae):'—'}</td></tr>`).join('')}</table><div class="hint">Parcelas antigas já contratadas. A parte da mãe só conta quando ela repassa.</div>`; }

/* --- Agenda --- */
T.agenda = () => {
  const l=DEMO.agenda.map(a=>({...a,dias:Calc.diasAte(a.dia,diaHoje),pago:isPago(a)})).sort((x,y)=>x.dia-y.dia);
  const total=l.reduce((s,a)=>s+a.valor,0), aberto=l.filter(a=>!a.pago).reduce((s,a)=>s+a.valor,0), pagoV=total-aberto;
  const caixa=DEMO.caixinha+DEMO.conta, aVencer=l.filter(a=>!a.pago&&a.dias>=0).reduce((s,a)=>s+a.valor,0);
  const pCal = pn('Calendário do mês',calendario(l),'vio');
  const pPesoAg = pn('Peso das contas na sua renda',(()=>{ const pr=total/DEMO.renda, k=pr<=.5?'ok':pr<=.7?'at':'ru'; return `<div class="row" style="margin-bottom:12px"><div><span class="big">${pc(pr,0)}</span> <span class="mu">da renda de ${brl0(DEMO.renda)} vai para contas do mês</span></div><span class="tag ${k}">${ST[k][0]} ${k==='ok'?'Peso confortável':k==='at'?'Peso alto':'Peso muito alto'}</span></div><div style="display:flex;height:16px;border-radius:99px;overflow:hidden;gap:2px">${l.map((a,i)=>`<span style="flex:${+a.valor||0};background:${PAL[i%6]}" title="${esc(a.nome)}"></span>`).join('')}</div><div class="legend">${l.map((a,i)=>`<span><i style="background:${PAL[i%6]}"></i>${esc(a.nome)} ${pc(a.valor/total,0)}</span>`).join('')}</div><div class="hint" style="margin-top:10px">Contas fixas até 50% da renda deixam espaço para lazer e reserva. Acima de 70% o mês fica sem folga.</div>`; })(),'vio','margin-top:14px');
  if(MOB()){
    const al=[], atras=l.filter(a=>!a.pago&&a.dias<0);
    if(atras.length) al.push([3, alerta('ru', atras.length+(atras.length>1?' contas atrasadas: ':' conta atrasada: ')+atras.map(a=>esc(a.nome)).join(', ')+'.')]);
    if(caixa<aVencer) al.push([2, alerta('ru','O caixa não cobre o que ainda vence neste mês.')]);
    const lista = l.length ? l.map(a=>{ const k=a.pago?'ok':a.dias<0?'ru':a.dias<=3?'at':'ne', t=a.pago?IOK+' Pago':a.dias<0?IX+' Atrasada '+(-a.dias)+'d':a.dias===0?AV+' Vence hoje':a.dias<=3?AV+' Em '+a.dias+' dias':'Em '+a.dias+' dias';
      return `<div class="ag"><label class="linha-check" style="--h:var(--vio);color:var(--tx);font-size:inherit"><input type="checkbox" data-id="${esc(a.id)}" ${a.pago?'checked':''} aria-label="Marcar como pago: ${esc(a.nome)}"><b>${esc(a.nome)}</b></label><span class="agv">${brl(a.valor)}</span><div class="ag2 small mu">dia ${esc(a.dia)} · <span class="tag ${k}">${t}</span></div></div>`; }).join('')
      : '<div class="mu">Nenhuma conta cadastrada neste mês.</div><button class="btn ghost" data-ir="numeros" style="margin-top:12px;width:100%">Abrir Meus números</button>';
    return `<div class="head"><div><h1>Agenda</h1><div class="sub">O que vence e o que já foi pago.</div></div></div>
    ${alertas(al)}
    ${pn('Ainda a vencer',`<div class="big">${brl(aVencer)}</div><span class="tag ${caixa>=aVencer?'ok':'ru'}" style="margin-top:6px">${caixa>=aVencer?IOK+' O caixa cobre ('+brl0(caixa)+')':IX+' Falta caixa'}</span><div class="mu small" style="margin-top:8px">Total do mês ${brl0(total)} · já pago ${brl0(pagoV)}</div>`,'vio')}
    ${pn('Contas do mês',lista,'vio')}
    ${det('agenda','det','Ver detalhes',pCal+pPesoAg,'vio')}`;
  }
  return `<div class="head"><div><h1>Agenda de contas</h1><div class="sub">O que vence e quando. Marque como pago.</div></div></div>
  <div class="grid g3" style="margin-bottom:14px">
    ${pn('Total do mês',`<div class="big">${brl0(total)}</div><div class="mu small">${l.length} contas</div>`,'vio')}
    ${pn('Já pago',`<div class="big" style="color:var(--ok)">${brl0(pagoV)}</div><div class="bar" style="--h:var(--ok)"><span style="width:${total?pagoV/total*100:0}%"></span></div>`,'vio')}
    ${pn('Ainda a vencer',`<div class="big">${brl0(aVencer)}</div><span class="tag ${caixa>=aVencer?'ok':'ru'}">${caixa>=aVencer?IOK+' O caixa cobre ('+brl0(caixa)+')':IX+' Falta caixa'}</span>`,'vio')}
  </div>
  <div class="grid g32">${pn('Contas do mês',`<table class="rt"><tr><th>Conta</th><th>Vencimento</th><th class="n">Valor</th><th>Situação</th></tr>${l.map(a=>{const k=a.pago?'ok':a.dias<0?'ru':a.dias<=3?'at':'ne', t=a.pago?IOK+' Pago':a.dias<0?IX+' Atrasada '+(-a.dias)+'d':a.dias===0?AV+' Vence hoje':a.dias<=3?AV+' Em '+a.dias+' dias':'Em '+a.dias+' dias';
    return `<tr><td class="tt"><label class="linha-check" style="--h:var(--vio);color:var(--tx);font-size:inherit"><input type="checkbox" data-id="${esc(a.id)}" ${a.pago?'checked':''} aria-label="Marcar como pago: ${esc(a.nome)}"><b>${esc(a.nome)}</b></label></td><td data-l="Vencimento">dia ${esc(a.dia)}</td><td class="n" data-l="Valor">${brl(a.valor)}</td><td data-l="Situação"><span class="tag ${k}">${t}</span></td></tr>`}).join('')}</table>`,'vio')}${pCal}</div>
  ${pPesoAg}`;
};
function bindAgenda(){ $$('#main input[type=checkbox]').forEach(c=>c.onchange=()=>{ const a=DEMO.agenda.find(x=>x.id===c.dataset.id); S.marcarPago(a,c.checked,mesAtual); ir('agenda'); }); }

/* --- Orçamento --- */
T.orcamento = () => {
  const porCat={}; gastosMes().filter(l=>!l.lazer).forEach(l=>porCat[l.cat]=(porCat[l.cat]||0)+l.valor);
  const rows=[{nome:'Lazer',teto:DEMO.tetoLazer,gasto:lazerGasto(),fixo:true},...Object.keys(tetos).map(k=>({nome:k,teto:tetos[k],gasto:porCat[k]||0}))];
  const tT=rows.reduce((s,r)=>s+r.teto,0), tG=rows.reduce((s,r)=>s+r.gasto,0), vazio=!doMes().length, rt=TFStore.ritmoMes(tG,diaHoje,diasMes);
  if(MOB()){
    const sit=r=>{ const p=r.teto?r.gasto/r.teto:0; return p<=.75?'ok':p<=1?'at':'ru'; };
    const al=[];
    rows.filter(r=>r.teto&&r.gasto>r.teto).forEach(r=>al.push([3, alerta('ru', esc(r.nome)+' passou do teto em '+brl0(r.gasto-r.teto)+'.')]));
    rows.filter(r=>r.teto&&r.gasto/r.teto>.75&&r.gasto<=r.teto).forEach(r=>al.push([1, alerta('at', esc(r.nome)+' já usou '+pc(r.gasto/r.teto,0)+' do teto.')]));
    const vz = vazio ? pn('Nenhum lançamento este mês ainda','<div class="small mu">Os tetos já estão valendo. Quando você lançar um gasto, o uso de cada categoria aparece aqui.</div><button class="btn" data-ir="lancar" style="margin-top:12px;width:100%">Lançar gasto</button>','pink','margin-bottom:14px') : '';
    const linhaRitmo = vazio ? 'Ritmo do mês: sem lançamentos' : rt.poucos ? 'Ritmo do mês: poucos dados ainda, a projeção aparece a partir do dia '+TFStore.RITMO_MIN_DIAS : 'Ritmo do mês: '+aprox(rt.projetado)+' até o dia '+diasMes;
    const lista = rows.map(r=>{ const k=sit(r), p=r.teto?r.gasto/r.teto:0; return `<div class="orcl${orcSel===r.nome?' sel':''}" data-cat="${esc(r.nome)}" role="button" tabindex="0" aria-label="${esc(r.nome)}: ${brl0(r.gasto)} de ${brl0(r.teto)}. Toque para ver os lançamentos."><div class="orcl1"><b>${esc(r.nome)}</b><span>${brl0(r.gasto)} de ${brl0(r.teto)}</span></div><div class="orcl2"><div class="bar" style="--h:${COR[k]}"><span style="width:${Math.min(p,1)*100}%"></span></div>${vazio?'':`<span class="tag ${k}">${ST[k][0]} ${k==='ok'?'No ritmo':k==='at'?'Perto':'Passou'}</span>`}</div></div>`; }).join('');
    const tetos=rows.filter(r=>!r.fixo).map(r=>`<div class="field"><label for="tt_${esc(r.nome)}">Teto de ${esc(r.nome)} (R$)</label><input type="number" id="tt_${esc(r.nome)}" data-k="${esc(r.nome)}" value="${r.teto}" min="0" step="10"></div>`).join('');
    return `<div class="head"><div><h1>Orçamento</h1><div class="sub">Quanto posso gastar e como estou indo.</div></div></div>
    ${vz}
    ${alertas(al)}
    ${pn('Gasto no mês',`<div class="big">${brl(tG)}</div><div class="mu small">de ${brl0(tT)} planejados</div><div class="bar" style="--h:var(--pink)"><span style="width:${tT?Math.min(tG/tT,1)*100:0}%"></span></div><div class="mu small">Ainda posso gastar ${brl0(Math.max(tT-tG,0))}</div><div class="mu small">${linhaRitmo}</div>`,'pink')}
    ${pn('Por categoria',lista+'<div class="hint">Toque numa categoria para ver os lançamentos dela.</div>','pink')}
    ${orcSel?detalheOrc(rows):''}
    ${det('orcamento','tetos','Ajustar tetos',tetos,'pink')}
    ${det('orcamento','dist','Distribuição e economia',pn('Distribuição do gasto',shareHtml(rows,tG),'pink')+pn('Onde dá para economizar',vazio?'<div class="mu">Sem lançamentos ainda.</div>':economiaHtml(rows,tG),'pink'),'pink')}`;
  }
  return `<div class="head"><div><h1>Orçamento do mês</h1><div class="sub">Quanto posso gastar em cada área, e como estou indo.</div></div></div>
  ${vazio?pn('Nenhum lançamento este mês ainda',`<div class="small">Os tetos já valem. Quando você lançar gastos, o uso, a situação e o ritmo aparecem aqui.</div>`,'pink','margin-bottom:14px'):''}
  <div class="grid g3" style="margin-bottom:14px">
    ${pn('Gasto no mês',`<div class="big">${brl0(tG)}</div><div class="mu small">de ${brl0(tT)} planejados</div>`,'pink')}
    ${pn('Ainda posso gastar',`<div class="big">${brl0(Math.max(tT-tG,0))}</div><div class="bar" style="--h:var(--pink)"><span style="width:${Math.min(tG/tT,1)*100}%"></span></div>`,'pink')}
    ${pn('Ritmo do mês'+info('Projeção simples: o gasto até hoje dividido pelos dias passados, vezes os dias do mês. Só aparece depois de '+TFStore.RITMO_MIN_DIAS+' dias do mês.'),vazio?`<div class="big">—</div><div class="mu small">sem lançamentos este mês</div>`:rt.poucos?`<div class="big" style="font-size:22px">poucos dados</div><div class="mu small">a projeção aparece a partir do dia ${TFStore.RITMO_MIN_DIAS} do mês</div>`:`<div class="big">${brl0(rt.projetado)}</div><div class="mu small">projeção de gasto até dia ${diasMes}</div>`,'pink')}
  </div>
  ${pn('Por categoria'+info('Cada linha compara o que você gastou com o teto do mês. Verde: até 75% do teto. Amarelo: perto do teto. Vermelho: passou. O teto de lazer vem dos seus números; nas outras você ajusta o teto.'),`<table class="rt"><tr><th>Categoria</th><th style="width:34%">Uso</th><th class="n">Gasto</th><th class="n">Teto</th><th>Situação</th></tr>${rows.map(r=>{const p=r.teto?r.gasto/r.teto:0, k=p<=.75?'ok':p<=1?'at':'ru';
    return `<tr class="clk${orcSel===r.nome?' sel':''}" data-cat="${esc(r.nome)}"><td class="tt"><b>${esc(r.nome)}</b>${r.fixo?info('Inclui lazer, jogos e comida fora de casa.'):''}${orcSel===r.nome?' <span class="tag ne">aberto '+IDESCE+'</span>':''}</td><td class="uso"><div class="bar" style="--h:${COR[k]};margin:0"><span style="width:${Math.min(p,1)*100}%"></span></div></td><td class="n" data-l="Gasto">${brl0(r.gasto)}</td><td class="n" data-l="Teto">${r.fixo?brl0(r.teto):`<input type="number" data-k="${esc(r.nome)}" value="${esc(r.teto)}" min="0" step="10" style="width:90px;text-align:right;padding:5px 8px">`}</td><td data-l="Situação">${vazio?'<span class="mu">—</span>':`<span class="tag ${k}">${ST[k][0]} ${k==='ok'?'No ritmo':k==='at'?'Perto do teto':'Passou'}</span>`}</td></tr>`}).join('')}</table><div class="hint">O teto de lazer vem da planilha; os das outras categorias você ajusta aqui. Clique numa linha para ver os lançamentos dela.</div>`,'pink')}
  ${orcSel?detalheOrc(rows):''}
  <div class="grid g2" style="margin-top:14px">${pn('Distribuição do gasto',shareHtml(rows,tG),'pink')}${pn('Onde dá para economizar',vazio?'<div class="mu">Sem lançamentos ainda: nada para comparar.</div>':economiaHtml(rows,tG),'pink')}</div>`;
};
function bindOrc(){
  $$('#main tr[data-cat],#main .orcl[data-cat]').forEach(tr=>{ tr.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); tr.click(); } }; tr.onclick=e=>{ if(e.target.tagName==='INPUT') return; orcSel=orcSel===tr.dataset.cat?null:tr.dataset.cat; ir('orcamento'); }; });
  $$('#main [data-fix]').forEach(b=>b.onclick=()=>{ ir('lancar'); startEditFn&&startEditFn(b.dataset.fix); });
  $$('#main input[data-k]').forEach(i=>i.onchange=()=>{ S.setTeto(i.dataset.k,i.value); ir('orcamento'); }); }

/* --- Metas --- */
T.metas = () => {
  const i=Calc.mensal(taxaMeta,'m');
  const cards=metas.map(m=>{
    const [ay,am]=m.prazo.split('-').map(Number), n=Math.max((ay-hoje.getFullYear())*12+(am-1-hoje.getMonth()),0);
    const need=Calc.metaAporte(m.alvo,m.guardado,i,n), eta=Calc.mesesParaMeta(m.alvo,m.guardado,m.aporte,i);
    const k = m.guardado>=m.alvo?'ok': m.aporte>=need*.999?'ok': m.aporte>=need*.7?'at':'ru', pct=m.guardado/m.alvo;
    const txt = m.guardado>=m.alvo?IOK+' Meta atingida': k==='ok'?IOK+' No ritmo': k==='at'?AV+' Um pouco abaixo':IX+' Fora do ritmo';
    return pn(esc(m.nome),`<div class="row" style="align-items:center;gap:16px"><div>${ring(Math.min(pct,1),HUE.sky,Math.round(pct*100)+'%','',110)}</div>
      <div style="flex:1"><div class="mu small">Guardado</div><div class="mid">${brl0(m.guardado)} <span class="mu small">de ${brl0(m.alvo)}</span></div><span class="tag ${k}" style="margin-top:8px">${txt}</span></div></div>
      <div class="kv" style="margin-top:14px"><span>Prazo</span><span>${String(am).padStart(2,'0')}/${ay} (${n} meses)</span><span>Precisa guardar por mês</span><span>${brl0(need)}</span><span>Você planeja guardar</span><span>${brl0(m.aporte)}</span><span>Chega lá em</span><span>${eta==null?'—':eta+' meses'}</span></div>
      <div style="margin-top:14px;border-top:1px solid var(--ln);padding-top:12px" class="sl"><label><span>Guardar por mês (arraste para testar)</span><b id="sv${esc(m.id)}">${brl0(m.aporte)}</b></label><input type="range" data-ap="${esc(m.id)}" min="0" max="${Math.max(Math.ceil(Math.max(need*2,m.aporte)/50)*50,1000)}" step="10" value="${esc(m.aporte)}" style="width:100%;--h:var(--sky)"></div>
      <div class="row" style="gap:8px"><input type="number" data-dep="${esc(m.id)}" placeholder="Guardei hoje (R$)" min="0" step="10" style="flex:1"><button class="ibtn tonal" type="button" data-depb="${esc(m.id)}" aria-label="Adicionar ao guardado" title="Adicionar ao guardado">${I.mais}</button></div>
      <div class="row" style="margin-top:12px"><span class="hint">${k==='ok'?'':'Faltam '+brl0(Math.max(need-m.aporte,0))+' por mês para chegar no prazo.'}</span><button class="x" data-del="${esc(m.id)}">Remover</button></div>`,'sky');
  }).join('');
  if(MOB()){
    const info1=m=>{ const [ay,am]=m.prazo.split('-').map(Number), n=Math.max((ay-hoje.getFullYear())*12+(am-1-hoje.getMonth()),0), need=Calc.metaAporte(m.alvo,m.guardado,i,n), eta=Calc.mesesParaMeta(m.alvo,m.guardado,m.aporte,i);
      const k=m.guardado>=m.alvo?'ok':m.aporte>=need*.999?'ok':m.aporte>=need*.7?'at':'ru', pct=m.guardado/m.alvo;
      return {ay,am,n,need,eta,k,pct,txt:m.guardado>=m.alvo?IOK+' Meta atingida':k==='ok'?IOK+' No ritmo':k==='at'?AV+' Um pouco abaixo':IX+' Fora do ritmo'}; };
    const somaA=metas.reduce((t,m)=>t+m.aporte,0), somaN=metas.reduce((t,m)=>t+info1(m).need,0), pr=DEMO.renda?somaA/DEMO.renda:0, kk=pr<=.2?'ok':pr<=.35?'at':'ru';
    const fora=metas.filter(m=>info1(m).k==='ru');
    const al=[]; if(fora.length) al.push([2, alerta('ru', fora.length>1?fora.length+' metas fora do ritmo: '+fora.map(m=>esc(m.nome)).join(', ')+'.':'A meta '+esc(fora[0].nome)+' está fora do ritmo.')]);
    const cards=metas.map(m=>{ const x=info1(m);
      return pn(esc(m.nome),`<div class="row" style="align-items:center;gap:14px;justify-content:flex-start"><div>${ring(Math.min(x.pct,1),HUE.sky,Math.round(x.pct*100)+'%','',72)}</div><div style="flex:1;min-width:0"><div class="mid">${brl(m.guardado)} <span class="mu small">de ${brl0(m.alvo)}</span></div><span class="tag ${x.k}" style="margin-top:6px">${x.txt}</span></div></div>
      ${det('metas','m'+m.id,'Prazo e aporte',`<div class="kv"><span>Prazo</span><span>${String(x.am).padStart(2,'0')}/${x.ay} (${x.n} meses)</span><span>Precisa guardar por mês</span><span>${brl0(x.need)}</span><span>Você planeja guardar</span><span>${brl0(m.aporte)}</span><span>Chega lá em</span><span>${x.eta==null?'—':x.eta+' meses'}</span></div>
        <div style="margin-top:12px" class="sl"><label for="ap${esc(m.id)}"><span>Guardar por mês</span><b id="sv${esc(m.id)}">${brl0(m.aporte)}</b></label><input type="range" id="ap${esc(m.id)}" data-ap="${esc(m.id)}" min="0" max="${Math.max(Math.ceil(Math.max(x.need*2,m.aporte)/50)*50,1000)}" step="10" value="${m.aporte}" style="width:100%;--h:var(--sky)"></div>
        <div class="row" style="gap:8px"><input type="number" data-dep="${esc(m.id)}" aria-label="Guardei hoje (R$)" placeholder="Guardei hoje (R$)" min="0" step="10" style="flex:1"><button class="ibtn tonal" type="button" data-depb="${esc(m.id)}" aria-label="Adicionar ao guardado" title="Adicionar ao guardado">${I.mais}</button></div>
        <div class="row" style="margin-top:8px"><span class="hint">${x.k==='ok'?'':'Faltam '+brl0(Math.max(x.need-m.aporte,0))+' por mês para chegar no prazo.'}</span><button class="x" data-del="${esc(m.id)}">Remover</button></div>`,'sky')}`,'sky'); }).join('');
    const labs=Array.from({length:25},(_,k)=>mesNome(k));
    const ser0=metas.map(m=>Calc.investimento(m.guardado,m.aporte,i,24,false,0).serie.map(x=>x.saldo)), tot=ser0.length?ser0[0].map((_,t)=>ser0.reduce((a,v)=>a+v[t],0)):[];
    const vazio=metasVazio();
    const nova=`<div class="field"><label for="m_n">Nome</label><input type="text" id="m_n" placeholder="Ex.: curso, moto, reserva"></div><div class="field"><label for="m_a">Quanto quer juntar (R$)</label><input type="number" id="m_a" min="0" step="100"></div><div class="field"><label for="m_g">Já tem (R$)</label><input type="number" id="m_g" min="0" step="50" value="0"></div><div class="field"><label for="m_p">Prazo</label><input type="month" id="m_p" style="width:100%;background:var(--p2);border:1px solid var(--ln2);border-radius:3px;padding:10px 12px;color:var(--tx)"></div><div class="field"><label for="m_m">Guarda por mês (R$)</label><input type="number" id="m_m" min="0" step="10" value="100"></div><button class="btn" id="m_ok" style="--h:var(--sky);width:100%">Adicionar meta</button><div class="hint" id="m_msg"></div>`;
    return `<div class="head"><div><h1>Metas</h1><div class="sub">Quanto guardar por mês para chegar no prazo.</div></div></div>
    ${vazio}${alertas(al)}
    ${metas.length?pn('Resumo',`<div class="big">${brl0(somaA)}</div><div class="mu small">guardado por mês de ${brl0(somaN)} necessários</div><span class="tag ${kk}" style="margin-top:8px">${ST[kk][0]} ${pc(pr,0)} da renda · ${kk==='ok'?'cabe com folga':kk==='at'?'pesa na renda':'pesa demais'}</span>`,'sky'):''}
    ${cards}
    ${det('metas','nova','Nova meta',nova,'sky')}
    ${metas.length?det('metas','graf','Gráfico e rendimento',pn('Total guardado nos próximos 24 meses',lineChart(labs,[{name:'Total guardado',values:tot,c:'var(--sky)',area:true,w:3}],[],220,CW(1)),'sky')+`<div class="field"><label for="tx">Rendimento esperado do que você guarda (ao mês, %)</label><input type="number" id="tx" value="${taxaMeta}" step="0.05" min="0"></div>`,'sky'):`<div style="display:none"><input type="number" id="tx" value="${taxaMeta}" aria-label="Rendimento esperado ao mês"></div>`}`;
  }
  return `${SIMPLES()?metasVazio():''}<div class="head"><div><h1>Metas</h1><div class="sub">Quanto guardar por mês para chegar lá no prazo.</div></div>
    <div style="width:260px"><label>Rendimento esperado do que você guarda (ao mês, %) ${info('Quanto o dinheiro guardado rende por mês. Se não souber, deixe 0 para uma conta conservadora ou use a taxa do seu CDB ou poupança.',true)}</label><input type="number" id="tx" value="${esc(taxaMeta)}" step="0.05" min="0"></div></div>
  <div class="grid g3" style="margin-bottom:14px">${cards}</div>
  ${metasResumo(i)}
  ${pn('Nova meta',`<div class="grid g4"><div class="field"><label>Nome</label><input type="text" id="m_n" placeholder="Ex.: curso, moto, reserva"></div><div class="field"><label>Quanto quer juntar (R$)</label><input type="number" id="m_a" min="0" step="100"></div><div class="field"><label>Já tem (R$)</label><input type="number" id="m_g" min="0" step="50" value="0"></div><div class="field"><label>Prazo</label><input type="month" id="m_p" style="width:100%;background:var(--p2);border:1px solid var(--ln2);border-radius:3px;padding:10px 12px;color:var(--tx)"></div><div class="field"><label>Guarda por mês (R$)</label><input type="number" id="m_m" min="0" step="10" value="100"></div></div><button class="btn" id="m_ok" style="--h:var(--sky)">Adicionar meta</button><div class="hint" id="m_msg"></div>`,'sky')}`;
};
function bindMetas(){
  const mpu=$('#m_pular'); if(mpu) mpu.onclick=()=>ir('hoje');
  const mp=$('#m_primeira'); if(mp) mp.onclick=()=>{ DET['metas:nova']=1; save0('tf_det',DET); const d=$('details[data-det="metas:nova"]'); if(d) d.open=true; $('#m_n').focus(); };
  $$('[data-ap]').forEach(r=>{ r.oninput=()=>{ $('#sv'+r.dataset.ap).textContent=brl0(+r.value); }; r.onchange=()=>{ if(S.setAporte(r.dataset.ap,r.value)) ir('metas'); }; });
  $$('[data-depb]').forEach(b=>b.onclick=()=>{ const inp=$('[data-dep="'+b.dataset.depb+'"]'); if(S.depositar(b.dataset.depb,inp.value)) ir('metas'); });
  $('#tx').onchange=()=>{ S.setTaxa($('#tx').value); ir('metas'); };
  $$('[data-del]').forEach(b=>b.onclick=()=>{ S.removerMeta(b.dataset.del); ir('metas'); });
  $('#m_ok').onclick=()=>{
    const r=S.addMeta({nome:$('#m_n').value,alvo:$('#m_a').value,guardado:$('#m_g').value,prazo:$('#m_p').value,aporte:$('#m_m').value});
    if(!r.ok){ $('#m_msg').textContent='Preencha nome, valor e prazo.'; return; } ir('metas'); };
}

/* --- Futuro --- */
let cenSel='Base', cmpAll=false;
function zonesFut(){ const d=DEMO; return [{from:d.meta,to:Infinity,c:'var(--ok)',o:.07},{from:d.piso,to:d.meta,c:'var(--at)',o:.09},{from:0,to:d.piso,c:'var(--ru)',o:.07}]; }
T.futuro = () => `
  <div class="head"><div><h1>Para onde vou</h1><div class="sub">Previsão do saldo mês a mês.${MOB()?'':' Passe o mouse no gráfico para ver cada mês.'}</div></div>
    <div class="chips" id="cen" style="--h:var(--sky)">${Object.keys(DEMO.cenarios).map(c=>`<button class="chip" data-c="${esc(c)}" aria-pressed="${c===cenSel}"><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${DEMO.cores[c]};margin-right:7px"></i>${esc(c)}</button>`).join('')}${MOB()?'':`<button class="chip" id="cmp" aria-pressed="${cmpAll}" style="--h:var(--teal)">Comparar todos</button><button class="chip" id="hz" aria-pressed="${HZ>=12}" style="--h:var(--vio)">${HZ>=12?'12 meses':'7 meses'}</button>`}</div></div>
  <div id="fut"></div>`;
function drawFuturo(){
  const cmpOn = cmpAll && !MOB();
  const d=DEMO, v=d.cenarios[cenSel], jan=v[2], dez=v[1], [cls,icn,txt]=status(jan,d.meta,d.piso);
  const alvo=v.findIndex(x=>x>=d.meta), todos=Object.keys(d.cenarios);
  const minV=Math.min(...v), minI=v.indexOf(minV), cresc=(v[11]-v[2])/9;
  const series = cmpOn
    ? [...todos.filter(c=>c!==cenSel).map(c=>({name:c,values:d.cenarios[c],c:d.cores[c],w:2})),{name:cenSel,values:v,c:d.cores[cenSel],w:3.5,area:true}]
    : [{name:cenSel,values:v,c:d.cores[cenSel],w:3.5,area:true}];
  const marks=[{i:2,v:jan,t:'jan '+brl0(jan),c:COR[cls],pos:'t'}];
  if(minI!==2) marks.push({i:minI,v:minV,t:'mais apertado '+brl0(minV),c:COR.at,pos:'b'});
  const refs=[{v:d.meta,t:'Meta (17/01)',c:'var(--ok)'},{v:d.piso,t:'Piso (17/01)',c:'var(--at)'},{v:d.alerta,t:'Alerta (fim de dez)',c:'var(--ru)'}];
  const dfa=minV-d.alerta;
  const pSim = pn('E se...? Simulador'+info('Teste o efeito de gastar mais, economizar, ter uma entrada extra ou fazer uma compra grande. O gráfico mostra o cenário original e o novo.'),'<div id="sim">'+simHtml()+'</div>','teal','margin-bottom:14px');
  const pCen = pn('Cenários lado a lado',`<table class="rt"><tr><th>Cenário</th><th class="n">Dez</th><th class="n">Jan</th><th>Faixa de janeiro</th><th>Mês mais apertado</th><th class="n">Fim de ${d.meses[11]}</th></tr>
   ${todos.map(c=>{const s=d.cenarios[c],[k,i,t]=status(s[2],d.meta,d.piso), mi=s.indexOf(Math.min(...s));return `<tr><td class="tt"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${d.cores[c]};margin-right:8px"></span><b>${c}</b></td><td class="n" data-l="Dez">${brl0(s[1])}</td><td class="n" data-l="Jan">${brl0(s[2])}</td><td data-l="Faixa de janeiro"><span class="tag ${k}">${i} ${t}</span></td><td data-l="Mais apertado">${d.meses[mi]} · ${brl0(s[mi])}</td><td class="n" data-l="Fim de ${d.meses[11]}">${brl0(s[11])}</td></tr>`}).join('')}</table>`,'sky');
  const mobHtml = MOB() ? (()=>{
    const al=[]; if(cls==='ru') al.push([3, alerta('ru','Em janeiro o saldo fica abaixo do piso.')]); else if(cls==='at') al.push([1, alerta('at','Em janeiro o saldo fica entre o piso e a meta.')]);
    if(dez<d.alerta) al.push([2, alerta('ru','Dezembro fica abaixo do alerta ('+brl0(d.alerta)+').')]);
    
    return `${alertas(al)}
    ${pn('Saldo no fim de janeiro',`<div class="big" style="color:${COR[cls]}">${aprox(jan)}</div><span class="tag ${cls}" style="margin-top:6px">${icn} ${txt}</span><div class="mu small" style="margin-top:8px">Fim de dez ${brl0(dez)} · ${jan-d.meta>=0?'folga de '+brl0(jan-d.meta)+' sobre a meta':'faltam '+brl0(d.meta-jan)+' para a meta'}${alvo<0?'':' · passa da meta em '+d.meses[alvo]}</div>`,'sky')}
    ${pn('Saldo previsto',pvHtml(),'sky')}
    ${pn('Leitura do cenário',`<div class="ins"><div class="d ${cls}">${icn}</div><div class="small"><b>Janeiro termina ${jan>=d.meta?'acima da meta':jan>=d.piso?'entre o piso e a meta':'abaixo do piso'}</b></div></div><div class="ins"><div class="d ${dfa>=0?'ok':'ru'}">${dfa>=0?IOK:IX}</div><div class="small"><b>Mês mais apertado: ${d.meses[minI]}</b><div class="mu">Saldo de ${brl0(minV)}, ${dfa>=0?brl0(dfa)+' acima':brl0(-dfa)+' abaixo'} do alerta.</div></div></div>`,'sky')}
    ${det('futuro','det','Ver detalhes',pSim+pCen,'sky')}`; })() : null;
  $('#fut').innerHTML=mobHtml||`
  <div class="grid g4" style="margin-bottom:14px">
    ${pn('Saldo fim de dez',`<div class="big">${brl0(dez)}</div><span class="tag ${dez>=d.alerta?'ok':'ru'}">${dez>=d.alerta?IOK+' Acima do alerta':IX+' Abaixo do alerta'}</span>`,'sky')}
    ${pn('Saldo fim de jan',`<div class="big" style="color:${COR[cls]}">${brl0(jan)}</div><span class="tag ${cls}">${icn} ${txt}</span>`,'sky')}
    ${pn('Folga contra a meta',`<div class="big" style="color:${jan-d.meta>=0?COR.ok:COR.ru}">${jan-d.meta>=0?'+':''}${brl0(jan-d.meta)}</div><div class="mu small">meta ${brl0(d.meta)}</div>`,'sky')}
    ${pn('Atinge a meta em',`<div class="big">${alvo<0?'depois de '+d.meses[11]:d.meses[alvo]}</div><div class="mu small">primeiro mês acima da meta</div>`,'sky')}
  </div>
  <div class="grid g32" style="margin-bottom:14px">
    ${!cmpOn?pn('Saldo previsto',pvHtml(),'sky'):pn('Todos os cenários',lineChart(d.meses,series,refs,360,CW(.66),{zones:zonesFut(),marks})+`<div class="legend"><span><i style="background:var(--ok);height:10px;opacity:.5"></i>acima da meta</span><span><i style="background:var(--at);height:10px;opacity:.5"></i>entre piso e meta</span><span><i style="background:var(--ru);height:10px;opacity:.5"></i>abaixo do piso</span>${todos.map(c=>`<span><i style="background:${d.cores[c]}"></i>${esc(c)}</span>`).join('')}</div>`,'sky')}
    ${pn('Leitura do cenário'+info('Meta e piso vêm dos seus números: a meta é o saldo que você quer ter em 17/01 e o piso é o mínimo aceitável. O alerta é o saldo mínimo de segurança em dezembro.',true),`
      <div class="ins"><div class="d ${cls}">${icn}</div><div class="small"><b>Janeiro termina ${jan>=d.meta?'acima da meta':jan>=d.piso?'entre o piso e a meta':'abaixo do piso'}</b><div class="mu">${jan-d.meta>=0?'Sobram '+brl0(jan-d.meta)+' além da meta.':'Faltam '+brl0(d.meta-jan)+' para a meta e '+(jan>=d.piso?'você está '+brl0(jan-d.piso)+' acima do piso.':brl0(d.piso-jan)+' para o piso.')}</div></div></div>
      <div class="ins"><div class="d ${dfa>=0?'ok':'ru'}">${dfa>=0?IOK:IX}</div><div class="small"><b>Mês mais apertado: ${d.meses[minI]}</b><div class="mu">Saldo de ${brl0(minV)}, ${dfa>=0?brl0(dfa)+' acima':brl0(-dfa)+' abaixo'} do alerta. Evite compras grandes nesse mês.</div></div></div>
      <div class="ins"><div class="d ne">${ISOBE}</div><div class="small"><b>Depois de janeiro o saldo cresce ${brl0(cresc)} por mês</b><div class="mu">Em média, de jan/27 até ${d.meses[11]}. Chega a ${brl0(v[11])} no fim.</div></div></div>
      <div class="disc">Previsão do app com as premissas de cada cenário. Não é promessa.</div>`,'sky')}
  </div>
  ${pSim}
  ${pCen}`;
  pvBind(); bindSim();
}

/* --- Decidir --- */
let calcSel='emp';
/* taxas públicas do Banco Central: cache do aparelho ou, se o armazenamento falhar, o que chegou nesta página */
let invModo='taxa', invPct=null, invInf=null, invMexeu=false, taxasMem={}, taxasEstado=null, onlineMem=null;
const lsSeguro=()=>{ try{ return localStorage; }catch(e){ return null; } }, ssSeguro=()=>{ try{ return sessionStorage; }catch(e){ return null; } };
/* opção deste aparelho: buscar as taxas online. Padrão desligado; fica só no localStorage, fora dos dados do Drive */
const ONLINE='tf_taxas_online', taxasOnline=()=>{ if(onlineMem!=null) return onlineMem; try{ return localStorage.getItem(ONLINE)==='true'; }catch(e){ return false; } };
function guardaOnline(v){ onlineMem=!!v; try{ if(v) localStorage.setItem(ONLINE,'true'); else localStorage.removeItem(ONLINE); }catch(e){} }
const taxas=()=>{ if(MODO!=='real') return {}; let c={}; try{ const s=lsSeguro(); if(s) c=TFTaxas.lerCache(s); }catch(e){ c={}; } return {...taxasMem,...c}; };
const rateField=(id,label,val,tipo='m')=>`<div class="field"><label>${label}</label><div class="rate"><input type="number" step="0.01" min="0" id="${id}" value="${val}"><select id="${id}_t"><option value="m" ${tipo==='m'?'selected':''}>ao mês</option><option value="a" ${tipo==='a'?'selected':''}>ao ano</option></select></div><div class="hint" id="${id}_h"></div></div>`;
const numField=(id,label,val,step='1',hint='')=>`<div class="field"><label>${label}</label><input type="number" id="${id}" value="${val}" step="${step}" min="0">${hint?`<div class="hint">${hint}</div>`:''}</div>`;
function readRate(id){ const p=parseFloat($('#'+id).value)||0, t=$('#'+id+'_t').value, m=Calc.mensal(p,t);
  $('#'+id+'_h').textContent = t==='m' ? '= '+pc(Calc.anual(m))+' ao ano' : '= '+pc(m)+' ao mês'; return m; }
const N = id => parseFloat($('#'+id).value)||0;
/* prazo em meses: inteiro de 1 a MESES_MAX. Sem teto, um valor grande (99999999) travava a aba no laço do cálculo. 1e999 o próprio campo esvazia (vale 1 mês). Teto: valor inicial, A Confirmar */
const MESES_MAX = 600, meses = id => Math.min(MESES_MAX, Math.max(1, Math.round(N(id)) || 1));
T.decidir = () => `
  <div class="head"><div><h1>Decidir com calma</h1><div class="sub">Calculadoras que mostram o custo real antes de você fechar algo.</div></div></div>
  <div class="seg" id="calcs" role="tablist" aria-label="Calculadoras">${[['emp','Empréstimo'],['con','Consórcio'],['fat','Fatura do cartão'],['inv','Investimento']].map(([k,n])=>`<button role="tab" id="ctab_${k}" data-k="${k}" aria-selected="${k===calcSel}" aria-controls="calcbox" tabindex="${k===calcSel?0:-1}">${n}</button>`).join('')}</div>
  <div class="grid g2" id="calcbox" role="tabpanel" aria-labelledby="ctab_${calcSel}"></div>
  <div class="disc">Estas contas são matemática com os números que você digita. Não são recomendação de investimento ou de crédito, e rendimentos futuros são estimativas, não promessas. A decisão é sua.</div>
  ${det('decidir','gloss','Glossário rápido',glossario(),'teal')}`;
const CALCS = {
 emp:{ form:()=>pn('Simular empréstimo',`
   ${numField('e_v','Quanto você quer pegar (R$)',5000,'100')}${rateField('e_i','Juros',2.5)}${numField('e_n','Em quantos meses',24)}
   ${numField('e_t','Tarifas e IOF cobrados na liberação (R$)',0,'10','Entram no custo efetivo total (CET).')}
   <div class="field"><label>Sistema de parcelas</label><select id="e_s"><option value="price">Parcela fixa (Price)</option><option value="sac">Parcela que cai (SAC)</option></select></div>`,'teal')+pn('Resultado','<div id="out"></div>','teal'),
   run:()=>{ const i=readRate('e_i'), v=N('e_v'), n=meses('e_n'), r=Calc.emprestimo(v,i,n,$('#e_s').value,N('e_t'));
    $('#out').innerHTML=`<div class="res"><div class="mu small">Você devolve no total</div><div class="big">${brl(r.total)}</div><div class="mu">${brl(r.juros)} só de juros, ${pc(r.juros/v,1)} sobre o valor pego</div></div>
     <div class="kv"><span>Parcela${$('#e_s').value==='sac'?' (primeira)':''}</span><span>${brl(r.primeira)}</span>${$('#e_s').value==='sac'?`<span>Parcela (última)</span><span>${brl(r.ultima)}</span>`:''}<span>Custo efetivo (CET)</span><span>${pc(r.cetMensal)} a.m. · ${pc(r.cetAnual)} a.a.</span></div>
     ${det('decidir','graf-emp','Gráfico: quanto falta pagar',`<div style="margin-top:14px">${lineChart(r.parcelas.map(p=>p.n),[{name:'Falta pagar',values:r.parcelas.map(p=>p.saldo),c:'var(--teal)',area:true}],[],200,440)}</div><div class="hint">Quanto ainda falta pagar, mês a mês.</div>`,'teal')}
     <div class="hint" style="margin-top:8px">Parcela de ${brl0(r.primeira)} cabe no seu orçamento? Sua renda estimada é ${brl0(DEMO.renda)}: ${pc(r.primeira/DEMO.renda,0)} dela.</div>`; }},
 con:{ form:()=>pn('Simular consórcio',`
   ${numField('c_c','Valor da carta de crédito (R$)',60000,'1000')}${numField('c_n','Prazo (meses)',60)}
   ${numField('c_a','Taxa de administração total (%)',15,'0.5','Está no contrato; costuma ser de 10% a 25% no total.')}${numField('c_f','Fundo de reserva total (%)',2,'0.5')}${numField('c_s','Seguro por mês (% da carta)',0.04,'0.01')}
   ${rateField('c_i','Se você poupasse a parcela, rendimento de',0.8)}`,'teal')+pn('Resultado','<div id="out"></div>','teal'),
   run:()=>{ const c=N('c_c'), n=meses('c_n'), im=readRate('c_i'), r=Calc.consorcio(c,n,N('c_a'),N('c_f'),N('c_s'),1);
    const mp=Calc.mesesParaMeta(c,0,r.parcela,im);
    $('#out').innerHTML=`<div class="res"><div class="mu small">Parcela mensal</div><div class="big">${brl(r.parcela)}</div><div class="mu">Você paga ${brl(r.custo)} a mais que a carta (${pc(r.custo/c,1)}), sem juros mensais.</div></div>
     <div class="kv"><span>Total pago</span><span>${brl(r.total)}</span><span>Taxa equivalente se contemplado já no 1º mês</span><span>${r.cetMensal==null?'—':pc(r.cetMensal)+' a.m. · '+pc(r.cetAnual)+' a.a.'}</span><span>Poupando a mesma parcela, você chega à carta em</span><span>${mp==null?'—':mp+' meses'}</span></div>
     <div class="hint" style="margin-top:12px">A taxa equivalente é o melhor caso: só vale se você for contemplado logo (sorteio ou lance). Quanto mais tarde a contemplação, mais você pagou antes de receber, e o consórcio fica menos vantajoso que um financiamento. Compare o custo em reais.</div>
     <div class="ins" style="margin-top:12px"><div class="d ${mp!=null&&mp<n?'at':'ne'}">i</div><div class="small">${mp!=null&&mp<n?`Guardando ${brl0(r.parcela)} por mês você alcança ${brl0(c)} em ${mp} meses, antes do fim do consórcio e sem pagar taxas, mas sem a garantia de ter o bem na data.`:'Poupando a mesma parcela, o consórcio compra a carta antes. Veja se vale a taxa.'}</div></div>`; }},
 fat:{ form:()=>pn('Remanejar a fatura do cartão',`
   ${numField('f_s','Valor da fatura em aberto (R$)',3100,'50')}${numField('f_p','Quanto você consegue pagar por mês (R$)',450,'10')}
   ${rateField('f_r','Juros do rotativo',14)}${rateField('f_i','Juros de parcelar a fatura',6)}${numField('f_n','Parcelas (parcelamento e empréstimo)',12)}${rateField('f_e','Juros de um empréstimo pessoal',3.2)}`,'vio')+pn('Qual custa menos','<div id="out"></div>','vio'),
   run:()=>{ const s=N('f_s'), p=N('f_p'), n=meses('f_n'), rr=readRate('f_r'), ri=readRate('f_i'), re=readRate('f_e');
    const a=Calc.rotativo(s,rr,p), pmtI=Calc.parcelaFixa(s,ri,n), pmtE=Calc.parcelaFixa(s,re,n);
    const op=[{k:'Ficar no rotativo, pagando '+brl0(p)+'/mês',total:a.quita?a.total:null,det:a.quita?a.meses+' meses':'nunca quita'},
              {k:'Parcelar a fatura em '+n+'x de '+brl0(pmtI),total:pmtI*n,det:n+' meses'},
              {k:'Empréstimo pessoal em '+n+'x de '+brl0(pmtE),total:pmtE*n,det:n+' meses'}];
    const val=op.filter(o=>o.total!=null), min=Math.min(...val.map(o=>o.total)), max=Math.max(...val.map(o=>o.total));
    $('#out').innerHTML=`<div class="res" style="--h:var(--vio)"><div class="mu small">Menor custo total</div><div class="big">${brl0(min)}</div><div class="mu">${val.find(o=>o.total===min).k}</div></div>
     ${op.map(o=>`<div style="margin-bottom:14px"><div class="row"><b style="font-size:14px">${o.k}</b><span class="${o.total==null?'tag ru':o.total===min?'tag ok':'mu'}">${o.total==null?IX+' não quita':o.total===min?IOK+' menor custo':''}</span></div>
       <div class="bar" style="--h:${o.total==null?COR.ru:o.total===min?COR.ok:'var(--vio)'}"><span style="width:${o.total==null?100:o.total/max*100}%"></span></div>
       <div class="mu small">${o.total==null?'A parcela não cobre nem os juros do mês.':brl(o.total)+' no total · '+brl(o.total-s)+' de juros · '+o.det}</div></div>`).join('')}
     <div class="hint">Confira também se a parcela cabe no seu mês. O menor custo total nem sempre é a menor parcela.</div>`; }},
 inv:{ form:()=>{ const tx=taxas(), cdi=tx[4389], ipca=tx[13522], comCdi=!!cdi&&invModo==='cdi';
   const modo=cdi?`<div class="field"><label for="i_modo">Rendimento informado como</label><select id="i_modo"><option value="taxa"${comCdi?'':' selected'}>taxa ao mês</option><option value="cdi"${comCdi?' selected':''}>% do CDI</option></select></div>`:'';
   const taxa=comCdi?`<div class="field"><label for="i_pct">Rendimento esperado (% do CDI)</label><input type="number" id="i_pct" value="${esc(invPct==null?100:invPct)}" step="1" min="0"><div class="hint" id="i_pct_h"></div></div>`:rateField('i_i','Rendimento esperado (bruto)',0.85);
   const inf=invInf!=null?invInf:ipca?ipca.valor:4.5, infH=invInf==null&&ipca?esc('IPCA de 12 meses até '+TFTaxas.mesAno(ipca.dataRef)+', do Banco Central. Troque se quiser.'):'';
   const online=MODO==='real'?`<div class="toggle"><label><input type="checkbox" id="i_online"${taxasOnline()?' checked':''}> Buscar taxas online (Banco Central)</label></div><div class="hint">Só as taxas públicas são pedidas; nada seu é enviado.</div><div class="hint" id="i_status" role="status">${esc(textoStatus())}</div>`:'';
   return pn('Projeção de investimento',`
   ${online}${numField('i_0','Quanto você tem para investir agora (R$)',1000,'100')}${numField('i_m','Quanto aporta por mês (R$)',200,'10')}
   ${modo}${taxa}${numField('i_n','Por quantos meses',36)}${numField('i_f','Inflação considerada (% ao ano)',esc(inf),'0.1',infH)}
   <div class="toggle"><label><input type="checkbox" id="i_ir" checked> Descontar IR da renda fixa (tabela regressiva)</label></div>`,'sky')+pn('O que pode acontecer','<div id="out"></div>','sky'); },
   run:()=>{ const tx=taxas(), cdi=tx[4389], ipca=tx[13522], comCdi=!!cdi&&!!$('#i_pct');   // o campo na tela decide: o select dispara input antes de redesenhar
    let i; if(comCdi){ i=TFTaxas.mensalDeCdi(cdi.valor,N('i_pct'))||0; $('#i_pct_h').textContent='Cerca de '+pc(i)+' ao mês. Estimativa com o CDI de '+TFTaxas.diaMes(cdi.dataRef)+' ('+pc(cdi.valor/100)+' ao ano); a convenção ainda é a confirmar.'; } else i=readRate('i_i');
    const n=meses('i_n'), comIr=$('#i_ir').checked, r=Calc.investimento(N('i_0'),N('i_m'),i,n,comIr,N('i_f'));
    const usaIpca=!!ipca&&invInf==null&&N('i_f')===ipca.valor, usadas=[comCdi&&cdi&&[4389,cdi],usaIpca&&[13522,ipca]].filter(Boolean);
    const fonte=usadas.length?`<div class="hint" id="i_fonte">${esc('Fonte: Banco Central do Brasil (SGS), '+(usadas.length>1?'séries ':'série ')+usadas.map(u=>u[0]).join(' e ')+', consulta em '+TFTaxas.dataBR(Math.max(...usadas.map(u=>u[1].fetchedAt))))}</div>`:'';
    $('#out').innerHTML=`<div class="res" style="--h:var(--sky)"><div class="mu small">Em ${n} meses você teria, depois do imposto</div><div class="big">${brl0(r.liquido)}</div><div class="mu">Você colocou ${brl0(r.aportado)}; o resto, ${brl0(r.liquido-r.aportado)}, é rendimento líquido.</div></div>
     <div class="kv inv-kv"><span>Valor bruto</span><span>${brl0(r.bruto)}</span><span>${esc('Imposto ('+(comIr?'média ':'')+pc(r.aliquota,1)+' sobre o ganho)')}</span><span>${brl0(r.imposto)}</span><span>Em dinheiro de hoje (sem a inflação)</span><span>${brl0(r.real)}</span><span>Ganho de verdade, descontada a inflação</span><span style="color:${r.ganhoReal>=0?COR.ok:COR.ru}">${r.ganhoReal>=0?'+':''}${brl0(r.ganhoReal)}</span></div>
     ${det('decidir','graf-inv','Gráfico: evolução do saldo',`<div style="margin-top:14px">${lineChart(r.serie.map(x=>x.mes),[{name:'Com rendimento',values:r.serie.map(x=>x.saldo),c:'var(--sky)',area:true},{name:'Só o que você colocou',values:r.serie.map(x=>x.aportado),c:'var(--mu)',w:2}],[],200,440)}</div>
     <div class="legend"><span><i style="background:var(--sky)"></i>Com rendimento</span><span><i style="background:var(--mu)"></i>Só o que você colocou</span></div>`,'sky')}${fonte}`; }}
};
function bindAbasCalc(){
  const bs=$$('#calcs button');
  const escolhe=b=>{ calcSel=b.dataset.k; bs.forEach(x=>{ x.setAttribute('aria-selected',x===b); x.setAttribute('tabindex',x===b?'0':'-1'); }); $('#calcbox').setAttribute('aria-labelledby',b.id); drawCalc(); };
  bs.forEach((b,i)=>{
    b.onclick=()=>escolhe(b);
    b.onkeydown=e=>{ const n=bs.length, alvo={ArrowRight:(i+1)%n,ArrowLeft:(i-1+n)%n,Home:0,End:n-1}[e.key]; if(alvo==null) return; e.preventDefault(); escolhe(bs[alvo]); bs[alvo].focus(); };
  });
}
function drawCalc(){
  $('#calcbox').innerHTML=CALCS[calcSel].form();
  $$('#calcbox input,#calcbox select').forEach(e=>e.addEventListener('input',CALCS[calcSel].run)); if(calcSel==='inv'){ ligaInv(); buscaTaxas(); } CALCS[calcSel].run();
}
/* Investimento: o valor digitado sempre vence o preenchido; trocar o modo mantém o resto do formulário */
function ligaInv(){
  invMexeu=false; $$('#calcbox input,#calcbox select').forEach(e=>{ if(e.id!=='i_online') e.addEventListener('input',()=>{ invMexeu=true; }); });
  if($('#i_online')) $('#i_online').addEventListener('change',e=>{ guardaOnline(e.target.checked); taxasEstado=null; if(e.target.checked) buscaTaxas(); pintaStatus(); });
  $('#i_f').addEventListener('input',e=>{ invInf=e.target.value; });
  if($('#i_pct')) $('#i_pct').addEventListener('input',e=>{ invPct=e.target.value; });
  if($('#i_modo')) $('#i_modo').addEventListener('change',e=>{ const ids=['i_0','i_m','i_n','i_f'], v=ids.map(k=>$('#'+k).value), ir=$('#i_ir').checked; invModo=e.target.value; drawCalc(); ids.forEach((k,j)=>{ $('#'+k).value=v[j]; }); $('#i_ir').checked=ir; CALCS.inv.run(); const m=$('#i_modo'); if(m) m.focus(); });
}
/* busca só quando Investimento aparece, só no modo real; nunca no exemplo, nas boas-vindas ou pelo service worker. Sem token, sem cabeçalho, sem cookie. */
function buscaTaxas(){
  if(MODO!=='real'||!taxasOnline()) return;
  if(navigator.onLine===false){ taxasEstado='falhou'; pintaStatus(); return; }   // sem conexão: fica o cache, com a data
  try{ taxasEstado='buscando'; pintaStatus();
    TFTaxas.atualizar({ fetch:(u,o)=>fetch(u,o), storage:lsSeguro(), sessao:ssSeguro() }).then(r=>{
      if(r&&r.novas) return taxasChegaram(r.cache);
      taxasEstado=r&&r.buscou?'falhou':null; pintaStatus();
    },()=>{ taxasEstado='falhou'; pintaStatus(); });
  }catch(e){ taxasEstado='falhou'; pintaStatus(); }
}
function taxasChegaram(c){ taxasMem=c||{}; taxasEstado=null; if(atual==='decidir'&&calcSel==='inv'&&$('#calcbox')&&!invMexeu) drawCalc(); else pintaStatus(); }
/* situação das taxas, pela data em que chegaram (a mais antiga das duas que a calculadora usa) */
function textoStatus(){
  const c=taxas(), us=[c[4389],c[13522]].filter(Boolean), on=taxasOnline();
  if(taxasEstado==='buscando') return 'Buscando as taxas do Banco Central';
  if(!us.length) return on?'Sem conexão: use suas taxas':'Desligado: use suas taxas';
  const quando=Math.min(...us.map(x=>x.fetchedAt)), dm=TFTaxas.dataBR(quando).slice(0,5);
  if(Date.now()-quando<=TFTaxas.VALIDADE) return 'Taxas do Banco Central de '+dm;
  return (on?'Sem conexão: usando as de ':'Desligado: usando as de ')+dm;
}
function pintaStatus(){ const s=$('#i_status'); if(s) s.textContent=textoStatus(); }


/* --- Patrimônio e saúde --- */
T.saude = () => {
  const d=DEMO, base=d.cenarios['Base'];
  const ct=Calc.carteira(d.carteira,d.essencial), divida=d.cartoes.reduce((s,c)=>s+c.fatura+c.parcelasFuturas,0);
  const ativos=ct.total+d.conta, liquido=ativos-divida;
  const s=Calc.saude({cobertura:d.caixinha/d.essencial,folgaMeta:base[2]-d.meta,meta:d.meta,dividaCartao:divida,renda:d.renda,lazerGasto:lazerGasto(),lazerTeto:d.tetoLazer,mesesComRegistro:2});
  const cor=s.nota>=75?'ok':s.nota>=50?'at':'ru';
  const dicas={
    'Reserva de emergência':()=>'Cada mês de essencial na reserva ('+brl0(d.essencial)+') soma 5 pontos. Faltam '+brl0(Math.max(d.essencial*6-d.caixinha,0))+' para os 6 meses.',
    'Meta de janeiro':()=>'Cada '+brl0(d.meta*0.1)+' acima da meta soma cerca de 2,5 pontos.',
    'Dívida do cartão':()=>'Cada R$ 1.000 a menos de dívida soma cerca de '+(20*1000/(d.renda*1.5)).toFixed(1).replace('.',',')+' pontos.',
    'Lazer dentro do teto':()=>'Termine o mês dentro do teto de lazer para manter os 15 pontos.',
    'Hábito de registrar':()=>'Cada mês com gastos registrados soma cerca de 3 pontos. Lance no fim do dia.'
  };
  const ganhos=[...s.fatores].map(f=>({...f,perde:f.peso-Math.round(f.ponto*f.peso)})).filter(f=>f.perde>0).sort((a,b)=>b.perde-a.perde).slice(0,3)
    .map(f=>`<div class="ins"><div class="d ${stCls(f.status)}" style="width:auto;min-width:46px;padding:0 6px">+${f.perde}</div><div class="small"><b>${f.nome}</b><div class="mu">${dicas[f.nome]?dicas[f.nome]():f.explicacao}</div></div></div>`).join('')||'<div class="mu small">Você já está com a nota máxima nos fatores.</div>';
  const cc=ct.porClasse, palette=['var(--sky)','var(--vio)','var(--teal)','var(--pink)']; let ci=0;
  const aviso=[];
  aviso.push(ct.concentracao>.6?['at',AV,'Concentração alta em '+esc(ct.maiorClasse)+' ('+pc(ct.concentracao,0)+'). Diversificar reduz o risco de uma única queda pesar demais.']:['ok',IOK,'Nenhuma classe passa de 60% da carteira.']);
  aviso.push(ct.mesesLiquidos>=3?['ok',IOK,'Você tem '+num1(ct.mesesLiquidos)+' meses do essencial em ativos de liquidez diária.']:['at',AV,'Só '+num1(ct.mesesLiquidos)+' meses do essencial estão em liquidez diária. Reserva precisa estar disponível.']);
  aviso.push(ct.classes>=3?['ok',IOK,'Você tem '+ct.classes+' tipos de ativo.']:['at',AV,'Apenas '+ct.classes+' tipo(s) de ativo.']);
  const pFat = pn('De onde vem a nota',s.fatores.map(f=>`<div class="factor"><div><b>${f.nome}</b><div class="mu small">${f.explicacao}</div></div><span class="tag ${stCls(f.status)}">${ST[stCls(f.status)][0]} ${Math.round(f.ponto*f.peso)}/${f.peso}</span><div class="bar" style="--h:${COR[stCls(f.status)]}"><span style="width:${f.ponto*100}%"></span></div></div>`).join(''),'teal');
  const pCarteira = pn('Minha carteira (exemplo)',`<div class="big">${brl0(ct.total)}</div>
      <div style="display:flex;height:12px;border-radius:99px;overflow:hidden;margin:14px 0 10px;gap:2px">${Object.keys(cc).map(k=>`<span style="flex:${+cc[k]||0};background:${palette[ci++%4]}"></span>`).join('')}</div>
      <div class="legend" style="margin:0 0 14px">${(ci=0,Object.keys(cc).map(k=>`<span><i style="background:${palette[ci++%4]}"></i>${esc(k)} ${pc(cc[k]/ct.total,0)}</span>`).join(''))}</div>
      <table><tr><th>Ativo</th><th>Liquidez</th><th class="n">Valor</th></tr>${d.carteira.map(x=>`<tr><td>${esc(x.nome)}<div class="mu small">${esc(x.classe)}</div></td><td>${x.liquidez==='diaria'?'Diária':'Média'}</td><td class="n">${brl0(x.valor)}</td></tr>`).join('')}</table>`,'sky');
  const pSaudeC = pn('Saúde da carteira',aviso.map(a=>`<div class="ins"><div class="d ${a[0]}">${a[1]}</div><div class="small" style="padding-top:5px">${a[2]}</div></div>`).join('')+'<div class="disc">É uma leitura de concentração e liquidez, não uma indicação de comprar ou vender nada.</div>','sky');
  const pReserva = pn('Reserva de emergência ideal',(()=>{ const alvo=d.essencial*6, p=d.caixinha/alvo; return `<div class="row" style="gap:20px;align-items:center"><div>${ring(Math.min(p,1),HUE.teal,Math.round(p*100)+'%','',120)}</div><div><div class="mu small">Ideal: 6 meses do essencial</div><div class="mid">${brl0(alvo)}</div><div class="mu small" style="margin-top:6px">Você tem ${brl0(d.caixinha)}; faltam ${brl0(Math.max(alvo-d.caixinha,0))}.</div></div></div>`; })(),'teal');
  if(MOB()){
    const al=[]; if(divida>ativos) al.push([3, alerta('ru','Você deve mais do que tem: dívida de '+brl0(divida)+' contra '+brl0(ativos)+'.')]); if(cor==='ru') al.push([2, alerta('ru','A nota está baixa: veja onde dá para ganhar pontos.')]);
    return `<div class="head"><div><h1>Patrimônio</h1><div class="sub">O que você tem, o que deve e uma nota simples.</div></div></div>
    ${alertas(al)}
    ${pn('Patrimônio líquido',`<div class="big" style="color:${liquido>=0?'var(--tx)':COR.ru}">${brl(liquido)}</div><div class="kv" style="margin-top:8px"><span>Tenho</span><span>${brl(ativos)}</span><span>Devo</span><span>${brl(divida)}</span></div>`,'sky')}
    ${pn('Sua nota'+info('Soma de 5 fatores: reserva de emergência, meta de janeiro, dívida do cartão, lazer dentro do teto e hábito de registrar. Não é o score de crédito do Serasa ou do SPC.'),`<div class="row" style="gap:16px;align-items:center;justify-content:flex-start">${ring(s.nota/100,COR[cor],String(s.nota),'de 100',104)}<div><span class="tag ${cor}">${cor==='ok'?IOK+' Saudável':cor==='at'?AV+' Pode melhorar':IX+' Precisa de atenção'}</span></div></div>`,'teal')}
    ${det('saude','det','Ver detalhes',pn('Onde dá para ganhar pontos',ganhos,'teal')+pFat+pCarteira+pSaudeC+pReserva,'sky')}`;
  }
  return `
  <div class="head"><div><h1>Patrimônio e saúde</h1><div class="sub">O que você tem, o que deve e uma nota simples.</div></div></div>
  <div class="grid g3" style="margin-bottom:14px">
    ${pn('Patrimônio líquido',`<div class="big" style="color:${liquido>=0?'var(--tx)':COR.ru}">${brl0(liquido)}</div><div class="mu small">o que tem menos o que deve</div>`,'sky')}
    ${pn('O que você tem',`<div class="big">${brl0(ativos)}</div><div class="mu small">carteira ${brl0(ct.total)} + conta ${brl0(d.conta)}</div>`,'sky')}
    ${pn('O que você deve',`<div class="big" style="color:var(--vio)">${brl0(divida)}</div><div class="mu small">cartões: fatura + parcelas</div>`,'vio')}
  </div>
  <div class="grid g23" style="margin-bottom:14px">
    ${pn('Sua nota'+info('Soma de 5 fatores: reserva de emergência (30), meta de janeiro (25), dívida do cartão (20), lazer dentro do teto (15) e hábito de registrar (10). Não é o score de crédito do Serasa ou do SPC.'),`<div class="row" style="gap:20px;align-items:center;justify-content:flex-start">${ring(s.nota/100,COR[cor],String(s.nota),'de 100',128)}
      <div><span class="tag ${cor}">${cor==='ok'?IOK+' Saudável':cor==='at'?AV+' Pode melhorar':IX+' Precisa de atenção'}</span><div class="mu small" style="margin-top:10px">Nota do app, com regras visíveis ao lado. Não é o score de crédito do Serasa ou do SPC.</div></div></div>
      <div style="margin-top:20px;border-top:1px solid var(--ln);padding-top:16px"><div class="mu small" style="margin-bottom:6px;font-family:var(--fn)">Onde dá para ganhar pontos</div>${ganhos}</div>`,'teal')}
    ${pFat}
  </div>
  <div class="grid g2">
    ${pCarteira}
    ${pSaudeC}
  </div>
  <div class="grid g2" style="margin-top:14px">
    ${pn('Tenho × devo',(()=>{ const mx=Math.max(ativos,divida,1); return `<div style="margin-bottom:16px"><div class="row small"><span>O que tenho</span><span style="font-family:var(--fn)">${brl0(ativos)}</span></div><div class="bar" style="--h:var(--sky);margin-top:6px"><span style="width:${ativos/mx*100}%"></span></div></div><div><div class="row small"><span>O que devo</span><span style="font-family:var(--fn)">${brl0(divida)}</span></div><div class="bar" style="--h:var(--vio);margin-top:6px"><span style="width:${divida/mx*100}%"></span></div></div><div class="hint" style="margin-top:14px">${ativos>=divida?'Você tem mais do que deve.':'Você deve mais do que tem.'} Quitar dívida cara costuma render mais que qualquer investimento.</div>`; })(),'sky')}
    ${pReserva}
  </div>`;
};


/* ===== Auxiliares de tela ===== */
const FREQ=[{desc:'Lanche',cat:'Comida',valor:28.5,forma:'Pix',lazer:true},{desc:'Café',cat:'Comida',valor:12,forma:'Pix',lazer:true},{desc:'Ônibus e app',cat:'Transporte',valor:8,forma:'Pix',lazer:false},{desc:'Cinema',cat:'Lazer',valor:46,forma:'Pix',lazer:true},{desc:'Compra do mês',cat:'Mercado',valor:300,forma:'Débito',lazer:false}];
const PAL=['var(--sky)','var(--vio)','var(--teal)','var(--pink)','var(--at)','var(--ok)'];
function catTotals(){ const o={}; gastosMes().forEach(l=>o[l.cat]=(o[l.cat]||0)+l.valor); return Object.entries(o).sort((a,b)=>b[1]-a[1]); }
function catBars(){ const t=catTotals(), tot=t.reduce((s,x)=>s+x[1],0)||1;
  return t.length ? t.map(([c,v])=>`<div style="margin-bottom:12px"><div class="row small"><span>${esc(c)}</span><span style="font-family:var(--fn)">${brl0(v)} · ${pc(v/tot,0)}</span></div><div class="bar" style="--h:var(--pink);margin:5px 0 0"><span style="width:${v/tot*100}%"></span></div></div>`).join('') : '<div class="mu">Sem gastos neste mês.</div>'; }
const mesNome=k=>{ const d=new Date(hoje.getFullYear(),hoje.getMonth()+k,1); return d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')+'/'+String(d.getFullYear()).slice(2); };
function calendario(l){
  const y=hoje.getFullYear(), m=hoje.getMonth(), off=new Date(y,m,1).getDay(), por={};
  l.forEach(a=>{ (por[a.dia]=por[a.dia]||[]).push(a); });
  let h=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>`<div class="w">${x}</div>`).join('')+'<div></div>'.repeat(off);
  for(let i=1;i<=diasMes;i++){ const b=(por[i]||[]);
    h+=`<div class="d ${i===diaHoje?'hj':''} ${b.length?'v':''}" title="${esc(b.map(a=>a.nome+' '+brl0(a.valor)).join(', '))}">${i}${b.map(a=>`<b class="${a.pago?'pg':''}">${a.pago?'<span class="ck">'+IOK+' </span>':''}<span class="rs">R$ </span>${brl0(a.valor).replace(/^R\$\s?/,'')}</b>`).join('')}</div>`; }
  return `<div class="cal">${h}</div><div class="legend"><span><i style="background:var(--vio);height:8px"></i>a pagar</span><span><i style="background:var(--ok);height:8px"></i>pago</span><span>valores em R$</span></div>`;
}
function shareHtml(rows,tG){
  const act=rows.filter(r=>r.gasto>0); if(!act.length||!tG) return '<div class="mu">Sem gastos ainda.</div>';
  return `<div style="display:flex;height:16px;border-radius:99px;overflow:hidden;gap:2px;margin-bottom:14px">${act.map((r,i)=>`<span style="flex:${+r.gasto||0};background:${PAL[i%6]}" title="${esc(r.nome)}"></span>`).join('')}</div>
    <div class="legend" style="margin:0">${act.map((r,i)=>`<span><i style="background:${PAL[i%6]}"></i>${esc(r.nome.split(' (')[0])} ${pc(r.gasto/tG,0)}</span>`).join('')}</div>`;
}
function economiaHtml(rows,tG){
  const ord=[...rows].sort((a,b)=>b.gasto-a.gasto), top=ord[0], itens=[];
  if(top&&top.gasto>0) itens.push(['ne','i','<b>Maior fatia: '+esc(top.nome.split(' (')[0])+'</b> ('+pc(top.gasto/tG,0)+' do gasto). Cortar 10% dela libera '+brl0(top.gasto*0.1)+' por mês.']);
  rows.filter(r=>r.teto&&r.gasto/r.teto>.75).forEach(r=>itens.push([r.gasto>r.teto?'ru':'at',r.gasto>r.teto?IX:AV,'<b>'+esc(r.nome.split(' (')[0])+'</b> já usou '+pc(r.gasto/r.teto,0)+' do teto.']));
  if(!itens.some(x=>x[0]!=='ne')) itens.push(['ok',IOK,'<b>Nenhuma categoria perto do teto.</b> Bom ritmo.']);
  return itens.map(a=>`<div class="ins"><div class="d ${a[0]}">${a[1]}</div><div class="small" style="padding-top:5px">${a[2]}</div></div>`).join('');
}
function metasResumo(i){
  const N24=24;
  const ser=metas.map((m,k)=>({name:m.nome,values:Calc.investimento(m.guardado,m.aporte,i,N24,false,0).serie.map(x=>x.saldo),c:PAL[k%6],w:2.5}));
  const labs=Array.from({length:N24+1},(_,k)=>mesNome(k));
  const somaA=metas.reduce((s,m)=>s+m.aporte,0);
  const somaN=metas.reduce((s,m)=>{const [ay,am]=m.prazo.split('-').map(Number), n=Math.max((ay-hoje.getFullYear())*12+(am-1-hoje.getMonth()),0); return s+Calc.metaAporte(m.alvo,m.guardado,i,n);},0);
  const pr=somaA/DEMO.renda, k=pr<=.2?'ok':pr<=.35?'at':'ru';
  return `<div class="grid g32" style="margin-bottom:14px">
    ${pn('Como cada meta cresce nos próximos 24 meses',metas.length?lineChart(labs,ser,[],280,CW(.66))+`<div class="legend">${metas.map((m,j)=>`<span><i style="background:${PAL[j%6]}"></i>${esc(m.nome)}</span>`).join('')}</div>`:'<div class="mu">Nenhuma meta ainda.</div>','sky')}
    ${pn('Resumo das metas',`<div class="kv"><span>Você guarda por mês</span><span>${brl0(somaA)}</span><span>Precisaria guardar</span><span>${brl0(somaN)}</span><span>Parte da renda</span><span>${pc(pr,0)}</span></div>
      <span class="tag ${k}" style="margin-top:14px">${ST[k][0]} ${k==='ok'?'Cabe com folga na renda':k==='at'?'Pesa na renda':'Pesa demais na renda'}</span>
      <div class="disc">Até 20% da renda é um esforço confortável; passar de 35% costuma exigir cortes em outras áreas. Priorize a reserva de emergência.</div>`,'sky')}
  </div>`;
}
function glossario(){
  const t=[['Juros ao mês × ao ano','1% ao mês não vira 12% ao ano: com juros sobre juros dá 12,68%. Por isso as calculadoras mostram as duas.'],
   ['CET (custo efetivo total)','A taxa que já inclui tarifas e impostos. É a que você realmente paga.'],
   ['Price × SAC','Price tem parcela igual. SAC começa mais alta e cai, e costuma custar menos juros no total.'],
   ['Rotativo do cartão','Juros quando você paga só parte da fatura. Está entre os mais caros do mercado.'],
   ['Taxa de administração (consórcio)','Cobrada pela administradora mesmo sem juros mensais. Está no contrato.'],
   ['IR regressivo','Imposto na renda fixa que cai com o prazo: 22,5% até 6 meses e 15% depois de 2 anos.'],
   ['Ganho real','O rendimento depois de descontar a inflação. É o que de fato aumenta seu poder de compra.']];
  return pn('Glossário rápido',`<div class="gl">${t.map(x=>`<div><b>${x[0]}</b><div class="mu small">${x[1]}</div></div>`).join('')}</div>`,'teal','margin-top:14px');
}


let prefillData = null, orcSel = null;
let diaSel = null;
const simS = {gasto:0, entrada:0, compra:0, mes:1};

function diaDetalhe(i){
  $$('#main .strip .c').forEach(c=>c.classList.toggle('sel',+c.dataset.d===i));
  $$('#main .strip .l').forEach((l,k)=>l.classList.toggle('sel',k+1===i));
  diaSel=i;
  const gs=doMes().filter(l=>l.valor>0&&+l.data.slice(8)===i), bs=DEMO.agenda.filter(a=>a.dia===i), el=$('#diadet'); if(!el) return;
  const nome=new Date(hoje.getFullYear(),hoje.getMonth(),i).toLocaleDateString('pt-BR',{day:'numeric',month:'long'});
  const linhas=[...gs.map(l=>`<div class="row small"><span>${esc(l.desc)} <span class="mu">· ${esc(l.cat)}</span>${l.neutro?' '+NEUTRO_TAG:''}</span><span style="font-family:var(--fn)">${brl(l.valor)}</span></div>`),
    ...bs.map(a=>`<div class="row small"><span>${esc(a.nome)} <span class="tag ${isPago(a)?'ok':'ne'}">${isPago(a)?IOK+' pago':'vence'}</span></span><span style="font-family:var(--fn)">${brl(a.valor)}</span></div>`)];
  el.innerHTML=`<div class="dica" style="margin:0"><div class="row" style="margin-bottom:8px"><b>${nome}</b><button class="btn ghost" id="dd_l" style="padding:6px 12px;font-size:12.5px">Lançar neste dia</button></div>${linhas.length?linhas.join(''):'<span class="mu small">Nada lançado nem vencendo neste dia.</span>'}</div>`;
  $('#dd_l').onclick=()=>{ prefillData=mesAtual+'-'+pad2(i); ir('lancar'); };
}
function bindHoje(){
  const go=['saude','cartao','orcamento','futuro'];
  $$('#main .g4 > .pn').forEach((c,i)=>{ c.classList.add('click'); c.title='Clique para ver os detalhes'; c.onclick=()=>ir(go[i]); });
  $$('#main .strip .c').forEach(c=>c.onclick=()=>diaDetalhe(+c.dataset.d));
  $$('#main [data-ir]').forEach(b=>b.onclick=()=>ir(b.dataset.ir));
  diaDetalhe(diaHoje);
  hjLiga();
}
function detalheOrc(rows){
  const lz=orcSel==='Lazer', es=gastosMes().filter(l=>lz?l.lazer:(!l.lazer&&l.cat===orcSel)).sort((a,b)=>b.data.localeCompare(a.data));
  return pn('Lançamentos: '+esc(orcSel.split(' (')[0]),es.length?`<table><tr><th>Dia</th><th>O que</th><th class="n">Valor</th><th></th></tr>${es.map(l=>`<tr><td>${esc(l.data.slice(8))}</td><td>${esc(l.desc)}<div class="mu small">${esc(l.cat)}${l.forma?' · '+esc(l.forma):''}</div></td><td class="n">${brl(l.valor)}</td><td><button class="x" data-fix="${esc(l.id)}" title="Corrigir" aria-label="Corrigir">${I.editar}</button></td></tr>`).join('')}</table><div class="hint">Total: ${brl(es.reduce((s,l)=>s+l.valor,0))}. Toque no lápis para corrigir o lançamento.</div>`:'<div class="mu">Nenhum lançamento nesta categoria no mês.</div>','pink','margin-top:14px');
}
/* --- Gráfico de previsão: uma tela só para Base e E se... (cálculo em grafico.js) --- */
let pvModo='base', pvSel=null, pvTabela=false, pvTinha=false, pvUlt=null, pvPress=false, pvFontes=true;
const pvTinta=(()=>{ try{ return document.createElement('canvas').getContext('2d'); }catch(e){ return null; } })();
const pvFamilia=()=>getComputedStyle(document.documentElement).getPropertyValue('--font-text').trim();
const pvMede=(t,px,peso)=>{ if(!pvTinta||!pvTinta.measureText) return 0; pvTinta.font=peso+' '+px+'px '+pvFamilia(); return pvTinta.measureText(t).width; };
if(document.fonts&&document.fonts.load){   // o gráfico mede o texto real, então só desenha com a fonte pronta (ou depois de 1,5 s, para nunca ficar vazio)
  pvFontes=false; const carrega=Promise.all([400,600].map(p=>document.fonts.load(p+' 13px '+pvFamilia())));
  Promise.race([carrega,new Promise(r=>setTimeout(r,1500))]).catch(()=>{}).then(()=>{ pvFontes=true; pvDesenha(); hjDesenha(); });
}
const pvNum=v=>Math.round(Math.abs(v)).toLocaleString('pt-BR');
const pvValor=v=>PRIV?MASK:'~R$ '+(v<0?'−':'')+pvNum(v);
const pvCurto=v=>PRIV?'••••':pvNum(v);
const pvDifTxt=v=>PRIV?MASK:(v>0?'+':v<0?'−':'')+'R$ '+pvNum(v);
const pvFixo=v=>PRIV?MASK:'R$ '+pvNum(v);
const pvAplicado=v=>{ let cum=0; return v.map((x,t)=>{ cum+=simS.entrada-simS.gasto; return x+cum-(t>=simS.mes?simS.compra:0); }); };
function pvInicio(d){ if(!d.asOf) return 0; const a=d.asOf.split('-'); return Math.max(0,(hoje.getFullYear()-(+a[0]))*12+(hoje.getMonth()+1-(+a[1]))); }
function pvMonta(){
  const d=DEMO, v=d.cenarios[cenSel], adj=pvAplicado(v), mudou=adj.some((x,i)=>x!==v[i]), se=pvModo==='se'&&mudou, j=TFGrafico.janela(d.meses,pvInicio(d)), corta=a=>a.slice(j.ini,j.ini+j.n), el=$('#pv_area');
  const W=Math.max((el&&el.clientWidth)||(MOB()?CW(1):CW(.66)),240), base=corta(v);
  return {d,v,adj,j,se,mudou,base,m:TFGrafico.montar({meses:corta(d.meses),base,cenario:se?corta(adj):null,meta:d.meta,piso:d.piso,alerta:d.alerta,W,H:TFGrafico.altura(MOB()),mede:pvMede,fmt:{valor:pvValor,fixo:pvFixo,curto:pvCurto}})};
}
const pvChip=e=>e?`<span class="tag ${e.cls}">${TFGrafico.iconeChip(e.cls)}${esc(e.texto)}</span>`:'';
function pvCabecalho(x){
  const m=x.m;
  if(pvSel!=null){ const l=TFGrafico.leitura(m,pvSel,x.base), lin=(a,b)=>`<div class="pv-lin"><span>${a}</span><b>${b}</b></div>`;
    return `<div class="pv-cap">${esc(l.mes)} · fim do mês</div>${l.cenario==null?'':lin('Cenário',pvValor(l.cenario))}${lin('Base',pvValor(l.base))}${l.cenario==null?'':lin('Diferença',pvDifTxt(l.dif))}<div class="pv-chip">${pvChip(l.estado)}</div>`; }
  const li=m.li, v=m.pa[li].v, e=m.est, serie=x.se?x.adj:x.v, mar=TFGrafico.marcos(serie,x.d.meses,x.d.meta,x.j.ini+li), sub=[];
  if(x.se&&x.base[li]!==v) sub.push((simS.compra?'Sem a compra':'Sem a mudança')+' seria <b>'+pvValor(x.base[li])+'</b>');
  if(mar.positivo) sub.push('Volta ao positivo em '+esc(mar.positivo));
  if(mar.meta) sub.push('Passa da meta em '+esc(mar.meta));
  if(pvModo==='se'&&!x.mudou) sub.push('Mexa nos controles do simulador para ver o efeito.');
  return `<div class="pv-cap">Mais apertado, em ${esc(m.meses[li])}</div><div class="pv-val" style="color:${e?COR[e.cls]:'var(--tx)'}">${pvValor(v)}</div><div class="pv-chip">${pvChip(e)}</div><div class="pv-sub">${sub.join('. ')}${sub.length?'.':''}</div>`;
}
function pvTabelaHtml(x){
  const m=x.m;
  return `<table class="rt"><tr><th>Mês</th><th class="n">Base</th>${m.pc?'<th class="n">Cenário</th>':''}<th>Situação</th></tr>${m.meses.map((mes,i)=>{ const l=TFGrafico.leitura(m,i,x.base); return `<tr><td class="tt"><b>${esc(mes)}</b></td><td class="n" data-l="Base">${pvValor(l.base)}</td>${m.pc?`<td class="n" data-l="Cenário">${pvValor(l.cenario)}</td>`:''}<td data-l="Situação">${l.estado?esc(l.estado.texto):'—'}</td></tr>`; }).join('')}</table>`;
}
function pvFala(x){
  if(pvSel==null) return ''; const l=TFGrafico.leitura(x.m,pvSel,x.base);
  return l.mes+', fim do mês.'+(l.cenario==null?'':' Cenário '+pvValor(l.cenario)+'.')+' Base '+pvValor(l.base)+'.'+(l.cenario==null?'':' Diferença '+pvDifTxt(l.dif)+'.')+(l.estado?' '+l.estado.texto+'.':'');
}
function pvDesenha(){
  const area=$('#pv_area'); if(!area||!pvFontes) return;
  const x=pvMonta(), m=x.m; pvUlt=x; if(pvSel!=null&&!m.pa[pvSel]) pvSel=null;
  $('#pv_cab').innerHTML=pvCabecalho(x);
  $$('#pv_modo button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===pvModo)));
  area.setAttribute('aria-label',TFGrafico.resumo(m));
  area.innerHTML=TFGrafico.svgDe(m,{id:'pvch',sel:pvSel,animar:x.se&&!pvTinha,priv:PRIV}); pvTinha=x.se;
  CHARTS.pvch={prev:true,labels:m.meses,series:[],W:m.W,L:0,R:0,args:[]};
  const tb=$('#pv_tabela'), bt=$('#pv_tab');
  area.hidden=pvTabela; tb.hidden=!pvTabela; tb.innerHTML=pvTabela?pvTabelaHtml(x):''; bt.textContent=pvTabela?'Ver gráfico':'Ver em tabela'; bt.setAttribute('aria-pressed',String(pvTabela));
}
function pvEscolhe(i){ if(i===pvSel) return; pvSel=i; pvDesenha(); const vv=$('#pv_vivo'); if(vv&&pvUlt) vv.textContent=pvFala(pvUlt); }
function pvDoPonteiro(e){ const sv=$('#pv_area svg'); if(!sv||!pvUlt) return; const r=sv.getBoundingClientRect(), m=pvUlt.m, vx=(e.clientX-r.left)*(m.W/(r.width||m.W)); let i=0; m.pa.forEach((p,k)=>{ if(Math.abs(p.x-vx)<Math.abs(m.pa[i].x-vx)) i=k; }); pvEscolhe(i); }
function pvHtml(){
  return `<div class="pv-cab" id="pv_cab"></div>
    <div class="pv-seg" id="pv_modo" role="group" aria-label="Cenário do gráfico"><button type="button" data-m="base" aria-pressed="${pvModo==='base'}"><span>Base</span></button><button type="button" data-m="se" aria-pressed="${pvModo==='se'}"><span>E se...</span></button></div>
    <div id="pv_area" class="pv-grafico" role="group" tabindex="0"></div><div id="pv_tabela" hidden></div>
    <div class="pv-pe"><button type="button" class="btn ghost pv-tab" id="pv_tab" aria-pressed="false">Ver em tabela</button><span class="pv-nota">~ = projeção com base no que você lançou.</span></div>
    <div class="pv-sr" id="pv_vivo" aria-live="polite"></div>`;
}
function pvBind(){
  const area=$('#pv_area'); if(!area) return;
  $$('#pv_modo button').forEach(b=>b.onclick=()=>{ pvModo=b.dataset.m; pvSel=null; const vv=$('#pv_vivo'); if(vv) vv.textContent=''; if(pvModo==='se'){ const s=$('#s_g'), dt=s&&s.closest('details'); if(dt) dt.open=true; } pvDesenha(); });
  $('#pv_tab').onclick=()=>{ pvTabela=!pvTabela; pvDesenha(); };
  area.addEventListener('pointerdown',e=>{ pvPress=true; try{ area.setPointerCapture(e.pointerId); }catch(_){ } pvDoPonteiro(e); });
  area.addEventListener('pointermove',e=>{ if(pvPress||e.pointerType==='mouse') pvDoPonteiro(e); });
  const solta=()=>{ pvPress=false; }; area.addEventListener('pointerup',solta); area.addEventListener('pointercancel',solta);
  area.onkeydown=e=>{ const n=pvUlt?pvUlt.m.pa.length:0;
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){ e.preventDefault(); const d=e.key==='ArrowRight'?1:-1; pvEscolhe(pvSel==null?(d>0?0:n-1):Math.max(0,Math.min(n-1,pvSel+d))); }
    else if(e.key==='Escape'&&pvSel!=null){ pvSel=null; pvDesenha(); const vv=$('#pv_vivo'); if(vv) vv.textContent=''; } };
}
document.addEventListener('pointerdown',e=>{ if(pvSel==null||!e.target.closest||e.target.closest('#pv_area')) return; pvSel=null; pvDesenha(); const vv=$('#pv_vivo'); if(vv) vv.textContent=''; });
/* --- Versão compacta do mesmo gráfico: só Base, sem cabeçalho nem escolha de mês. A leitura mês a mês fica na tabela e, no PC, na dica. --- */
let hjTabela=false, hjUlt=null;
function hjMonta(area){
  const d=DEMO, qtd=+area.dataset.n||4, j=TFGrafico.janela(d.meses,qtd>4?0:pvInicio(d),qtd), corta=a=>a.slice(j.ini,j.ini+j.n), base=corta(d.cenarios['Base']);
  const W=Math.max(area.clientWidth||(MOB()?CW(1):CW(.66)),240);
  return {base,m:TFGrafico.montar({meses:corta(d.meses),base,cenario:null,meta:d.meta,piso:d.piso,alerta:d.alerta,W,H:TFGrafico.altura(MOB()),mede:pvMede,fmt:{valor:pvValor,fixo:pvFixo,curto:pvCurto}})};
}
function hjDesenha(){
  const area=$('#hj_area'); if(!area||!pvFontes) return;
  const x=hjMonta(area), m=x.m; hjUlt=x;
  area.setAttribute('aria-label',TFGrafico.resumo(m,true));
  area.innerHTML=TFGrafico.svgDe(m,{id:'hjch',priv:PRIV});
  CHARTS.hjch={labels:m.meses,series:[{name:'Base',values:x.base,c:'var(--mu)',fmt:pvValor}],W:m.W,L:m.P.l,R:m.W-m.P.r,args:[]};
  const tb=$('#hj_tabela'), bt=$('#hj_tab');
  area.hidden=hjTabela; tb.hidden=!hjTabela; tb.innerHTML=hjTabela?pvTabelaHtml(x):''; bt.textContent=hjTabela?'Ver gráfico':'Ver em tabela'; bt.setAttribute('aria-pressed',String(hjTabela));
}
function hjHtml(qtd){
  return `<div id="hj_area" class="pv-grafico pv-largo"${qtd?` data-n="${qtd}"`:''} role="img"></div><div id="hj_tabela" hidden></div>
    <div class="pv-pe"><button type="button" class="btn ghost pv-tab" id="hj_tab" aria-pressed="false">Ver em tabela</button><span class="pv-nota">~ = projeção com base no que você lançou.</span></div>`;
}
function hjLiga(){ const bt=$('#hj_tab'); if(!bt) return; bt.onclick=()=>{ hjTabela=!hjTabela; hjDesenha(); }; hjDesenha(); }
function simHtml(){
  const d=DEMO;
  return `<div class="grid g3">
    <div class="sl"><label><span>Gasto a mais por mês (negativo = economizar)</span><b id="v_g">R$ 0</b></label><input type="range" id="s_g" min="-400" max="800" step="20" value="${simS.gasto}"></div>
    <div class="sl"><label><span>Entrada extra por mês</span><b id="v_e">R$ 0</b></label><input type="range" id="s_e" min="0" max="1500" step="50" value="${simS.entrada}"></div>
    <div class="sl"><label><span>Compra única</span><b id="v_c">R$ 0</b></label><input type="range" id="s_c" min="0" max="4000" step="100" value="${simS.compra}">
      <select id="s_m" style="margin-top:8px">${d.meses.map((m,i)=>`<option value="${i}" ${i===simS.mes?'selected':''}>em ${m}</option>`).join('')}</select></div>
  </div><div id="simout"></div>`;
}
function bindSim(){
  const d=DEMO, v=d.cenarios[cenSel];
  const draw=()=>{
    $('#v_g').textContent=(simS.gasto>0?'+':'')+brl0(simS.gasto); $('#v_e').textContent=brl0(simS.entrada); $('#v_c').textContent=brl0(simS.compra);
    const adj=pvAplicado(v);
    const jan=adj[2], [cls,icn,txt]=status(jan,d.meta,d.piso), dj=jan-v[2], mn=Math.min(...adj), mi=adj.indexOf(mn);
    const mudou=simS.gasto||simS.entrada||simS.compra;
    $('#simout').innerHTML=`<div style="margin-top:6px">
      <div><div class="kv"><span>Janeiro com a mudança</span><span style="color:${COR[cls]}">${brl0(jan)}</span><span>Diferença contra o original</span><span style="color:${dj>=0?COR.ok:COR.ru}">${dj>=0?'+':''}${brl0(dj)}</span><span>Contra a meta</span><span>${jan-d.meta>=0?'+':''}${brl0(jan-d.meta)}</span><span>Mês mais apertado</span><span>${d.meses[mi]} · ${brl0(mn)}</span></div>
      <span class="tag ${cls}" style="margin-top:12px">${icn} ${txt}</span>
      <div class="disc">${mudou?'Estimativa do app: soma o efeito mês a mês ao cenário. As regras reais de cada mês (freios, rendimento) ficam na planilha, então use como ordem de grandeza.':'Mexa nos controles para ver o efeito no saldo.'}</div>
      <button class="btn ghost" id="s_r" style="margin-top:12px">Limpar simulação</button></div></div>`;
    pvDesenha();
    $('#s_r').onclick=()=>{ simS.gasto=0; simS.entrada=0; simS.compra=0; simS.mes=1; pvModo='base'; pvSel=null; $('#fut').querySelector('#sim').innerHTML=simHtml(); bindSim(); };
  };
  const mexeu=()=>{ pvModo='se'; draw(); };
  $('#s_g').oninput=e=>{ simS.gasto=+e.target.value; mexeu(); };
  $('#s_e').oninput=e=>{ simS.entrada=+e.target.value; mexeu(); };
  $('#s_c').oninput=e=>{ simS.compra=+e.target.value; mexeu(); };
  $('#s_m').onchange=e=>{ simS.mes=+e.target.value; mexeu(); };
  draw();
}
document.addEventListener('keydown',e=>{
  const t=e.target.tagName;
  if(['INPUT','SELECT','TEXTAREA'].includes(t)){ if(e.key==='Escape'&&editId!=null&&atual==='lancar'){ $('#f_cancel').click(); } return; }
  if(atual==='hoje'&&(e.key==='ArrowLeft'||e.key==='ArrowRight')&&diaSel){ e.preventDefault(); const n=Math.min(Math.max(diaSel+(e.key==='ArrowRight'?1:-1),1),$$('#main .strip .c').length); diaDetalhe(n); return; }
  if((e.key==='n'||e.key==='N')&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); ir('lancar'); $('#f_valor').focus(); }
});

/* ===== Dica ao passar o mouse nos gráficos ===== */
const tip=document.createElement('div'); tip.className='tip'; tip.style.display='none'; document.body.appendChild(tip);
document.addEventListener('mousemove',e=>{
  const sv=e.target.closest&&e.target.closest('svg[data-ch]'); $$('svg .hv').forEach(n=>n.remove());
  if(!sv){ tip.style.display='none'; return; }
  const c=CHARTS[sv.dataset.ch]; if(!c||c.prev){ tip.style.display='none'; return; }
  const r=sv.getBoundingClientRect(), vx=(e.clientX-r.left)*(c.W/r.width), n=c.labels.length;
  const i=Math.max(0,Math.min(n-1,Math.round((vx-c.L)/(c.W-c.L-c.R)*(n-1)))), px=c.L+(c.W-c.L-c.R)*i/(n-1);
  const vh=sv.viewBox.baseVal.height;
  const ln=document.createElementNS('http://www.w3.org/2000/svg','line'); ln.setAttribute('class','hv'); ln.setAttribute('x1',px); ln.setAttribute('x2',px); ln.setAttribute('y1',10); ln.setAttribute('y2',vh-34); ln.setAttribute('stroke','var(--mu)'); ln.setAttribute('stroke-dasharray','3 4'); sv.appendChild(ln);
  tip.innerHTML='<b>'+esc(c.labels[i])+'</b>'+c.series.filter(s=>s.name).map(s=>`<div><i style="background:${s.c}"></i>${esc(s.name)}: <span style="font-family:var(--fn)">${(s.fmt||brl0)(s.values[i])}</span></div>`).join('');
  tip.style.display='block'; tip.style.left=Math.min(e.clientX+16,window.innerWidth-220)+'px'; tip.style.top=(e.clientY+16)+'px';
});

/* ===== Sincronização com o Google Drive =====
   Fonte única: dados.json na pasta "Tutor Financeiro" do Drive. Cada aparelho guarda uma cópia local e junta por item. */
const estado = () => S.paraSync();
let aplicandoSync = false;
const BASE = TFSync.baseItens({lanc:MODO==='demo'?seed():[], pagos:{}, tetos:{...DEMO.tetos}, metas:MODO==='demo'?metasPadrao():[], taxa:0.8});
const arm = {get:k=>load(k,null), set:save0, del:k=>{ try{ localStorage.removeItem(k); }catch(e){} }};
const Drive = TFSync.criarDrive(window.TF_CONFIG||{}, arm);
let sincStatus = {t:'off'}, sincOcupado = false, sincTimer = null;

function capturar(){
  if(MODO==='demo') return {};   // o exemplo nunca toca nos itens dos dados reais nem nas horas deles
  const itens = TFSync.semBase(TFSync.atualizar(estado(), TFSync.juntar(BASE, load('tf_items',{})), Date.now()));
  save0('tf_items', itens); return itens;
}
function aplicarEstado(st){
  aplicandoSync = true;
  S.aplicar({lanc:st.lanc,pagos:st.pagos,tetos:st.tetos,metas:st.metas,taxa:st.taxa==null?0.8:st.taxa,numeros:st.numeros,real:st.real});
  aplicandoSync = false; recalcDemo();
}
function pintaOlho(){ const b=$('#olho'); if(!b) return; b.setAttribute('aria-pressed',String(PRIV)); b.setAttribute('aria-label',PRIV?'Mostrar valores':'Ocultar valores'); b.title=PRIV?'Mostrar valores':'Ocultar valores'; b.innerHTML=PRIV?SVG_OLHO_OFF:SVG_OLHO; }
const NUVEM='<path d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.6 1.2A3.5 3.5 0 0117 18z"/>', CORTE='<path d="M4 4l16 16"/>', EXCLAMA='<path d="M12 9.5v3.5M12 15.4v.1"/>';
function pintaSync(){
  const el=$('#sync'); if(!el) return; const s=sincStatus;
  const m={off:['','Conectar ao Drive','Conectar'],go:['go','Sincronizando…'],ok:['ok','Sincronizado '+(s.h||'')],at:['at','Reconectar ao Drive','Reconectar'],ru:['ru','Sem sincronizar','Erro no Drive'],cfg:['at','Falta configurar o Drive','Configurar']}[s.t]||['','—'];
  el.className='sync '+m[0]+(m[2]?' comtexto':''); el.querySelector('span').textContent=m[1]; el.querySelector('b').textContent=m[2]||'';
  el.querySelector('svg').innerHTML=NUVEM+({off:CORTE,at:CORTE,cfg:CORTE,ru:EXCLAMA}[s.t]||''); el.title=s.msg||'Sincronização com o Google Drive'; el.setAttribute('aria-label',m[1]+(s.msg?'. '+s.msg:''));
}
S.aoMudar(()=>{ recalcDemo(); if(!aplicandoSync) mudou(); });
function mudou(){
  capturar();
  clearTimeout(sincTimer); sincTimer=setTimeout(sincronizar,1500);
}
async function sincronizar(){
  if(sincOcupado) return;
  if(MODO==='demo'){ sincStatus={t:'off',msg:'Modo de exemplo: não sincroniza, para não misturar com seus dados reais.'}; pintaSync(); return; }
  if(!Drive.configurado()){ sincStatus={t:'cfg',msg:'Preencha o clientId em config.js (veja o LEIAME).'}; pintaSync(); return; }
  if(!Drive.conectado()){ sincStatus={t:Drive.jaConectou()?'at':'off',msg:'Toque para entrar com a conta Google.'}; pintaSync(); return; }
  sincOcupado=true; sincStatus={t:'go'}; pintaSync();
  try{
    const id=await Drive.garantirArquivo();
    const remoto=await Drive.ler(id);
    const local=capturar();
    const junto=TFSync.semBase(TFSync.juntar(local,remoto));
    const novo=TFSync.montar(TFSync.juntar(BASE,junto));
    if(MODO!=='real' && novo.real && !S.st.real){ aplicarEstado(novo); S.definirModo('real'); save0('tf_items',junto); sincOcupado=false; location.reload(); return; }
    const mudouTela=!TFSync.igual(novo,estado());
    if(mudouTela){ aplicarEstado(novo); }
    if(!TFSync.igual(junto,remoto) && !Drive.descartados) await Drive.escrever(id,TFSync.doc(junto));   // se o Drive trouxe itens recusados, não sobrescreve: nada é perdido em silêncio
    save0('tf_items',junto);
    sincStatus=Drive.descartados?{t:'at',msg:'O Drive tem '+Drive.descartados+' item(ns) que este app não aceita; nada foi apagado lá. Dados deste aparelho não foram enviados.'}:{t:'ok',h:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),msg:'Dados iguais no Drive e neste aparelho.'};
    if(mudouTela && !['lancar'].includes(atual)) ir(atual);
  }catch(e){
    sincStatus = e.message==='sem-token' ? {t:'at',msg:'A sessão do Google expirou. Toque para reconectar.'} : {t:'ru',msg:'Falhou ('+e.message+'). Seus dados continuam salvos aqui; tentarei de novo.'};
  }
  sincOcupado=false; pintaSync();
}
function chipSync(){ if(!Drive.configurado()||Drive.conectado()) sincronizar(); else Drive.conectar(); }
(function iniciaSync(){
  Drive.lerRetorno();
  const el=$('#sync'); el.onclick=chipSync; el.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); chipSync(); } };
  capturar(); pintaSync();
  // renovação automática do acesso (1 hora): redireciona sozinho no máximo a cada 2 minutos
  if(Drive.configurado()&&Drive.jaConectou()&&!Drive.conectado()&&Date.now()-(load('tf_gtry',0))>120000&&!/error=/.test(location.hash)){ save0('tf_gtry',Date.now()); Drive.conectar(); return; }
  sincronizar();
  setInterval(()=>{ if(!document.hidden) sincronizar(); },60000);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) sincronizar(); });
  window.addEventListener('online',sincronizar);
})();

/* --- Meus números --- */
T.numeros = () => {
  if(SIMPLES()) return numerosSimples();
  const n=S.st.numeros||{}, d=DEMO, reais=!!d.real;
  if(!reais) return `<div class="head"><div><h1>Meus números</h1><div class="sub">Os números que o app ainda não sabe.</div></div></div>${pn('Só com dados reais',`<div class="small">Esta tela alimenta a previsão com os seus números. Importe o arquivo de dados reais para usá-la.</div>${MOB()?'<button class="btn" id="imp_btn" style="margin-top:12px;width:100%">Importar dados reais</button>':''}`,'teal')}`;
  const parc=(real.faturas_futuras_parcelas_antigas||[]).filter(f=>f.parte_mae>0);
  const sal=d.salarioEstimado?'estimado: troque pelo valor do holerite':'informado';
  const merc=d.mercadoOrigem;
  const pMerc = pn('Mercado por mês'+info('Quanto você gasta com mercado em um mês. Se deixar em branco, o app usa a média dos seus lançamentos em Mercado, depois de pelo menos quatro semanas de uso.'),`<div class="field"><label for="n_mercado">Valor por mês (R$)</label><input type="number" id="n_mercado" inputmode="decimal" min="0" step="10" '')}"||''}" aria-describedby="n_mercado_a"></div><div class="mu small" id="n_mercado_a">Origem do número usado: ${merc}${d.mercadoMedia?' (média atual '+brl(d.mercadoMedia)+' por mês)':''}.</div>`,'teal');
  const pSal = pn('Salário líquido'+info('O valor que cai na conta. Cai até o quinto dia útil do mês. Troque a estimativa pelo valor do holerite quando tiver.'),`<div class="field"><label for="n_salario">Valor por mês (R$)</label><input type="number" id="n_salario" inputmode="decimal" min="0" step="10" value="${n.salario||''}" placeholder="Estimado: ${d.renda}" aria-describedby="n_salario_a"></div><div class="mu small" id="n_salario_a">Origem: ${sal}. Próximo pagamento previsto: dia ${d.salarioDiaProximo} do mês que vem (quinto dia útil, sem contar feriados nacionais).</div>`,'teal');
  const pRep = pn('Repasse da mãe'+info('Só conta no saldo previsto depois que você marcar que recebeu.'),parc.length?parc.map(f=>`<div class="linha-check"><input type="checkbox" id="rp_${esc(f.mes)}" data-mes="${esc(f.mes)}" ${n.repasse&&n.repasse[f.mes]?'checked':''}><label for="rp_${esc(f.mes)}">${esc(String(f.mes).slice(5))}/${esc(String(f.mes).slice(2,4))}: recebi ${brl(f.parte_mae)}</label></div>`).join(''):'<div class="mu small">Nenhum repasse previsto no arquivo.</div>','vio');
  const pPiso = pn('Piso da reserva'+info('O menor saldo que você aceita ter. Enquanto não definir, o app mostra piso a definir.'),`<div class="field"><label for="n_piso">Valor (R$)</label><input type="number" id="n_piso" inputmode="decimal" min="0" step="50" value="${n.piso||''}" aria-describedby="n_piso_a"></div><div class="mu small" id="n_piso_a">Origem: ${d.pisoNovo?'informado':'ainda a definir'}.</div>`,'pink');
  const pLimC = pn('Limite dos cartões',d.cartoes.map(c=>`<div class="field"><label for="n_lim_${esc(c.id)}">${esc(c.nome)} (R$)</label><input type="number" id="n_lim_${esc(c.id)}" data-id="${esc(c.id)}" inputmode="decimal" min="0" step="50" value="${c.limite||''}"></div>`).join(''),'sky');
  if(MOB()){
    const inf=[n.mercado,n.salario,n.piso].filter(v=>v>0).length;
    return `<div class="head"><div><h1>Meus números</h1><div class="sub">${inf} de 3 números principais informados. A previsão é recalculada ao salvar.</div></div></div>
    ${pMerc}${pSal}${pPiso}
    ${det('numeros','mais','Repasse da mãe e limite dos cartões',pRep+pLimC,'teal')}
    <div class="salvarfixo"><button class="btn" id="n_ok">Salvar números</button><span id="n_msg" class="small" role="status"></span></div>`;
  }
  return `<div class="head"><div><h1>Meus números</h1><div class="sub">Corrija o que o app estimou e conte o que ele ainda não sabe. A previsão do Futuro é recalculada ao salvar.</div></div></div>
  <div class="grid g2">
    ${pMerc}
    ${pSal}
    ${pRep}
    ${pPiso}
    ${pLimC}
  </div>
  <div class="row" style="margin-top:14px;justify-content:flex-start;gap:14px"><button class="btn" id="n_ok">Salvar números</button><span id="n_msg" class="small" role="status"></span></div>`;
};
function bindNumeros(){
  const ib=$('#imp_btn'); if(ib) ib.onclick=()=>{ S.definirModo(null); location.reload(); };
  if(!DEMO.real) return;
  $('#n_ok').onclick=()=>{
    const repasse={}; $$('input[data-mes]').forEach(c=>{ if(c.checked) repasse[c.dataset.mes]=true; });
    const limites={}; $$('input[data-id]').forEach(i=>{ limites[i.dataset.id]=i.value; });
    const r=S.setNumeros({mercado:$('#n_mercado').value,salario:$('#n_salario').value,piso:$('#n_piso').value,repasse,limites});
    ['mercado','salario','piso'].forEach(k=>$('#n_'+k).setAttribute('aria-invalid',r.ok||!r.erros[k]?'false':'true'));
    if(!r.ok){ $('#n_msg').innerHTML='<span class="tag ru" role="alert">'+IX+' '+esc(Object.values(r.erros)[0])+'</span>'; return; }
    ir('numeros'); $('#n_msg').innerHTML='<span class="tag ok">'+IOK+' Salvo. A previsão foi recalculada.</span>';
  };
}

/* ===== Primeira abertura: importar os dados reais ===== */
function telaImportar(){
  const imp=pn('Importar dados reais',`<div class="small" style="margin-bottom:12px">Escolha o arquivo <b>dados_reais_AAAA-MM-DD.json</b> que está na pasta Financeiro do computador. O app lê o arquivo aqui no aparelho e não envia para nenhum site.</div><input type="file" id="imp_f" accept=".json,application/json"><div class="small" id="imp_m" style="margin-top:12px"></div>`,'teal');
  const campo=(id,rot,ajuda)=>`<div class="field"><label for="ini_${id}">${rot}</label><input id="ini_${id}" type="number" inputmode="decimal" step="0.01" placeholder="0,00" aria-describedby="ini_${id}_a"><div class="hint" id="ini_${id}_a">${ajuda}</div></div>`;
  const comeco=S.st.real
    ? pn('Seus dados continuam aqui',`<div class="small">Eles não foram apagados. Você pode voltar para eles agora.</div><button class="btn" id="ini_voltar" style="margin-top:12px">Voltar aos meus dados</button>`,'teal','margin-bottom:14px')
    : pn('Para começar',`${campo('renda','Renda por mês (R$)','O que entra em um mês normal.')}${campo('fixos','Gastos fixos por mês (R$)','Tudo junto, em um número só: aluguel, contas, assinaturas.')}${campo('saldo','Saldo de hoje (R$)','Quanto você tem agora. Pode ser aproximado.')}<button class="btn" id="ini_ok" style="width:100%">Começar</button><div class="hint" id="ini_msg" role="status"></div>`,'teal','margin-bottom:14px');
  return `<div class="head"><div><h1>Bem-vindo ao Tutor Financeiro</h1><div class="sub">Três números e o app já mostra quanto dá para gastar por dia. Valores aproximados servem; você muda depois.</div></div></div>
  ${comeco}
  <div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-bottom:14px"><button class="btn ghost" id="imp_demo">Ver exemplo</button><span class="hint">Dados fictícios, separados dos seus.</span></div>
  <details class="det"><summary>Já uso em outro aparelho</summary><div class="detc small">Toque no ícone de nuvem no topo e entre com a sua conta Google. Seus dados chegam pelo Drive.</div></details>
  <details class="det"><summary>Opções avançadas</summary><div class="detc">${imp}</div></details>`;
}
function bindImportar(){
  $('#imp_f').onchange=async e=>{
    const f=e.target.files[0]; if(!f) return; const m=$('#imp_m');
    try{
      if(f.size>TFSeg.LIM.bytes) throw new Error('Arquivo não aceito: ele é grande demais para ser o dados_reais_*.json.');
      let j; try{ j=JSON.parse(await f.text()); }catch(_){ throw new Error('Arquivo não aceito: o conteúdo não é um JSON válido.'); }
      const r=S.importarReal(j); if(!r.ok) throw new Error(r.erro); location.reload();
    }catch(err){ m.innerHTML='<span class="tag ru" role="alert">'+IX+' '+esc(err.message)+'</span>'; }
  };
  $('#imp_demo').onclick=()=>{ S.definirModo('demo'); location.reload(); };
  const vt=$('#ini_voltar'); if(vt) vt.onclick=()=>{ S.definirModo('real'); location.reload(); };
  const ok=$('#ini_ok'); if(ok) ok.onclick=()=>{
    const r=S.comecar({renda:$('#ini_renda').value,fixos:$('#ini_fixos').value,saldo:$('#ini_saldo').value});
    ['renda','fixos','saldo'].forEach(k=>$('#ini_'+k).setAttribute('aria-invalid',r.ok||!r.erros||!r.erros[k]?'false':'true'));
    if(!r.ok){ $('#ini_msg').innerHTML='<span class="tag ru" role="alert">'+IX+' '+esc(Object.values(r.erros||{})[0]||r.erro)+'</span>'; return; }
    location.reload(); };
}

/* ===== Primeiro uso: Hoje simples, telas vazias que dizem o que ganham, instalação ===== */
let rapidoPendente='', lancarAntes=false;
const PLAT = () => TFStore.plataforma(navigator.userAgent, !!(navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)));
const INSTALAR = {
  ios:'No Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início". Depois disso, abra sempre pelo ícone.',
  'ios-outro':'Abra este endereço no Safari. Lá, toque em Compartilhar e depois em "Adicionar à Tela de Início". Depois disso, abra sempre pelo ícone.',
  android:'No Chrome, abra o menu e toque em "Instalar app". Depois ele abre como qualquer outro aplicativo.',
  computador:'Abra este endereço no navegador do celular para instalar por lá.',
  instalado:'O app já está instalado neste aparelho.'
};
const blocoInstalar = (fechar) => pn('Instalar no celular',`<div class="small">${INSTALAR[PLAT()]}</div><div class="small" style="margin-top:8px">Conecte o Google Drive: é o backup dos seus dados.</div><div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-top:12px"><button class="btn ghost" id="inst_drive">Conectar o Drive</button>${fechar?'<button class="btn ghost" id="inst_ok">Agora não</button>':''}</div>`,'sky','margin-bottom:14px');
const gastoDoMes = () => gastosMes().reduce((t,l)=>t+l.valor,0);
function hojeSimples(){
  const ini=S.st.real._inicio, r=TFStore.porDia(ini.renda,ini.fixos,gastoDoMes(),diaHoje,diasMes), al=[];
  if(r.livre<=0) al.push([3,alerta('ru','Os gastos fixos informados passam da renda do mês.')]);
  else if(r.resta<0) al.push([3,alerta('ru','Os gastos do mês passaram da sobra em '+brl(-r.resta)+'.')]);
  if(S.st.real.cartao.limite>0){ const c=cartaoInfo(DEMO.cartoes[0]); if(c.utilizacao>.3) al.push([c.utilizacao>.6?2:1,alerta(c.utilizacao>.6?'ru':'at','Você usa '+pc(c.utilizacao,0)+' do limite do cartão (ideal até 30%).')]); }
  const mostra=!load('tf_inst_visto',false) && ['ios','ios-outro','android'].includes(PLAT());
  const passos=[['cartao','Cartão','quanto do limite você usa'],['agenda','Contas','o que vence e se o caixa cobre'],['metas','Metas','quanto guardar por mês'],['orcamento','Orçamento','quanto ainda dá para gastar em cada área']];
  return `<div class="head"><div><h1>Hoje</h1><div class="sub">Resumo de ${hoje.toLocaleDateString('pt-BR',{day:'numeric',month:'long'})}</div></div></div>
  ${alertas(al)}
  ${pn('Para gastar por dia'+info('A renda menos os gastos fixos e o que você já lançou no mês, dividido pelos dias que faltam. É uma conta com os números que você informou, não uma promessa.'),`<div class="big hero">${aprox(Math.floor(r.porDia))}</div><div class="mu small">até o fim do mês, ${r.diasRestantes} ${r.diasRestantes===1?'dia':'dias'} · sobra ${brl(Math.max(r.resta,0))}</div>${S.mesIncompleto()?`<div class="small" id="mi_nota" style="margin-top:10px">Esse valor conta só o que você lançou desde que começou. Se já gastou algo neste mês antes disso, adicione e ele fica mais certo.</div><div class="row" style="justify-content:flex-start;flex-wrap:wrap;gap:8px;margin-top:10px"><button class="btn ghost" id="mi_add">Adicionar o que já gastei</button><button class="btn ghost" id="mi_ok">Já lancei tudo</button></div>`:''}`,'teal','margin-bottom:14px')}
  ${pn('Lançamento rápido',`<label for="hq_txt" class="small">Escreva como falaria</label><div class="row" style="gap:8px"><input id="hq_txt" type="text" placeholder="Ex.: 45 mercado pix" autocomplete="off"><button class="ibtn tonal" id="hq_ok" type="button" aria-label="Preencher o lançamento com o texto" title="Preencher o lançamento com o texto">${I.enviar}</button></div>`,'teal','margin-bottom:14px')}
  ${pn('Caixa hoje',`<div class="big">${brl(ini.saldo)}</div><div class="mu small">saldo informado em ${new Date(S.st.real._meta.as_of+'T12:00').toLocaleDateString('pt-BR')}</div>`,'teal','margin-bottom:14px')}
  ${mostra?blocoInstalar(true):''}
  ${load('tf_passos_ok',false)?'':pn('Quando quiser',`${passos.map(([k,n,g])=>`<div class="row" style="padding:4px 0"><span class="small"><b>${n}</b> <span class="mu">${g}</span></span><button class="btn ghost" data-ir="${k}">Abrir</button></div>`).join('')}<button class="btn ghost" id="pp_pular" style="margin-top:8px">Pular</button>`,'vio')}`;
}
function bindHojeSimples(){
  const vai=()=>{ rapidoPendente=$('#hq_txt').value; ir('lancar'); };
  $('#hq_ok').onclick=vai; $('#hq_txt').onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); vai(); } };
  const mi=$('#mi_add'); if(mi) mi.onclick=()=>{ lancarAntes=true; ir('lancar'); };
  const mk=$('#mi_ok'); if(mk) mk.onclick=()=>{ S.limparMesIncompleto(); ir('hoje'); };
  const pp=$('#pp_pular'); if(pp) pp.onclick=()=>{ save0('tf_passos_ok',true); ir('hoje'); };
  bindInstalar();
}
function bindInstalar(){
  const io=$('#inst_ok'); if(io) io.onclick=()=>{ save0('tf_inst_visto',true); ir('hoje'); };
  const id=$('#inst_drive'); if(id) id.onclick=()=>chipSync();
}
T.instalar = () => `<div class="head"><div><h1>Instalar no celular</h1></div></div>${blocoInstalar(false)}<button class="btn ghost" data-ir="hoje">Voltar</button>`;
function numerosSimples(){
  const v=S.st.real._inicio, campo=(id,rot,val)=>`<div class="field"><label for="n_${id}">${rot}</label><input id="n_${id}" type="number" inputmode="decimal" step="0.01" value="${esc(val)}"></div>`;
  return `<div class="head"><div><h1>Meus números</h1><div class="sub">Corrija quando quiser. Valores aproximados servem.</div></div></div>
  ${pn('Os três números',campo('renda','Renda por mês (R$)',v.renda)+campo('fixos','Gastos fixos por mês (R$)',v.fixos)+campo('saldo','Saldo de hoje (R$)',v.saldo)+`<div class="row" style="justify-content:flex-start;gap:14px"><button class="btn" id="n_ok">Salvar números</button><span id="n_msg" class="small" role="status"></span></div>`,'teal')}`;
}
function bindNumerosSimples(){
  $('#n_ok').onclick=()=>{ const r=S.atualizarInicio({renda:$('#n_renda').value,fixos:$('#n_fixos').value,saldo:$('#n_saldo').value});
    if(!r.ok){ $('#n_msg').innerHTML='<span class="tag ru" role="alert">'+IX+' '+esc(Object.values(r.erros)[0])+'</span>'; return; }
    ir('numeros'); $('#n_msg').innerHTML='<span class="tag ok">'+IOK+' Salvo.</span>'; };
}
function metasVazio(){ return !metas.length ? pn('Nenhuma meta por aqui ainda',`<div class="small mu">Crie uma meta com valor e prazo para ver quanto guardar por mês.</div><button class="btn" id="m_primeira" style="margin-top:12px;width:100%;--h:var(--sky)">Criar primeira meta</button>${SIMPLES()?'<button class="btn ghost" id="m_pular" style="margin-top:8px;width:100%">Pular</button>':''}`,'sky','margin-bottom:14px') : ''; }
/* Telas ainda vazias no primeiro uso: dizem o que a pessoa ganha ao preencher e sempre têm "Pular". */
const telaVaziaDe = k => { if(!SIMPLES()) return false; const r=S.st.real; return k==='cartao'?!(r.cartao.limite>0):k==='agenda'?!r.pendencias_novembro.length:k==='orcamento'?!Object.keys(S.st.tetos).length:k==='futuro'||k==='saude'; };
function telaVazia(k){
  const num=(id,rot,extra='')=>`<div class="field"><label for="vz_${id}">${rot}</label><input id="vz_${id}" type="number" inputmode="decimal" step="0.01" ${extra}></div>`;
  const pular='<button class="btn ghost" id="vz_pular" style="margin-top:8px;width:100%">Pular</button>', salvar=(r)=>`<button class="btn" id="vz_ok" style="width:100%">${r}</button><div class="hint" id="vz_msg" role="status"></div>`;
  const t={
    cartao:['Cartão','vio','Com o limite e a fatura, o app mostra quanto do limite você usa, quando a fatura fecha e o melhor dia de comprar.',num('lim','Limite do cartão (R$)')+num('fat','Fatura atual (R$)')+num('fec','Dia de fechamento','min="1" max="28" step="1"')+num('ven','Dia de vencimento','min="1" max="28" step="1"')+salvar('Salvar cartão')],
    agenda:['Agenda','vio','Com as contas e os vencimentos, o app lembra o que vence e mostra se o caixa cobre. Cadastre uma de cada vez.',`<div class="field"><label for="vz_nome">Nome da conta</label><input id="vz_nome" type="text" maxlength="60" placeholder="Ex.: internet"></div>`+num('val','Valor (R$)')+num('dia','Dia de vencimento','min="1" max="28" step="1"')+salvar('Salvar conta')],
    orcamento:['Orçamento','pink','Com um teto por área, o app mostra quanto ainda dá para gastar em cada uma. Preencha só as que quiser.',Object.keys({Mercado:1,Transporte:1,Estudos:1,'Saúde':1,Outros:1}).map(c=>`<div class="field"><label for="vz_t_${c}">${c} (R$ por mês)</label><input id="vz_t_${c}" data-cat="${c}" type="number" inputmode="decimal" step="10" min="0"></div>`).join('')+salvar('Salvar tetos')],
    futuro:['Futuro','sky','Com a renda e os gastos fixos que você informou, esta é uma previsão simples do saldo. Com cartão e contas, ela fica mais completa.',(()=>{ const d=DEMO, b=d.cenarios['Base'].slice(0,7); return `<div class="mid">${aprox(b[b.length-1])}</div><div class="mu small">saldo previsto em ${d.meses[6]}</div>${hjHtml(7)}<div class="disc">Previsão com os números que você informou. Não é promessa.</div>`; })()],
    saude:['Patrimônio','sky','Com investimentos e dívidas, o app mostra o que você tem em comparação com o que deve.','<div class="mu small">Ainda não dá para cadastrar isso aqui.</div>']
  }[k];
  return `<div class="head"><div><h1>${t[0]}</h1></div></div>${pn('O que você ganha',`<div class="small" style="margin-bottom:12px">${t[2]}</div>${t[3]}${pular}`,t[1])}`;
}
function bindVazia(k){
  $('#vz_pular').onclick=()=>ir('hoje');
  const msg=(r)=>{ $('#vz_msg').innerHTML='<span class="tag ru" role="alert">'+IX+' '+esc(Object.values(r.erros||{})[0]||'Confira os campos.')+'</span>'; };
  const ok=$('#vz_ok'); if(!ok) return;
  ok.onclick=()=>{
    if(k==='cartao'){ const r=S.atualizarCartao({limite:$('#vz_lim').value,fatura:$('#vz_fat').value,fechamento:$('#vz_fec').value,vencimento:$('#vz_ven').value}); if(!r.ok) return msg(r); }
    if(k==='agenda'){ const r=S.addConta({nome:$('#vz_nome').value,valor:$('#vz_val').value,dia:$('#vz_dia').value}); if(!r.ok) return msg(r); }
    if(k==='orcamento'){ const vs=$$('input[data-cat]').filter(i=>+i.value>0); if(!vs.length) return msg({erros:{a:'Preencha ao menos um teto ou toque em Pular.'}}); vs.forEach(i=>S.setTeto(i.dataset.cat,i.value)); }
    ir(k);
  };
}
function sairExemplo(){ S.definirModo(load('tf_real',null)?'real':null); location.reload(); }

/* ===== Acessibilidade: liga cada rótulo ao seu campo e dá nome aos campos sem rótulo ===== */
let rotN = 0;
$('#main').addEventListener('toggle',e=>{ const t=e.target; if(t&&t.dataset&&t.dataset.det){ if(t.open) DET[t.dataset.det]=1; else delete DET[t.dataset.det]; save0('tf_det',DET); if(t.open) ajustarGraficos(); } },true);
function ajustarInfo(){ if(!MOB()) return; $$('main .info').forEach(i=>{ if(!i.getAttribute('role')){ i.setAttribute('role','button'); i.setAttribute('aria-expanded','false'); i.setAttribute('aria-label','O que é isto?'); } }); }
$('#main').addEventListener('click',e=>{ const i=e.target.closest&&e.target.closest('.info'); if(!i||!MOB()) return; e.preventDefault();
  const host=i.closest('h2,label')||i.parentElement, ja=host.nextElementSibling&&host.nextElementSibling.classList.contains('infotxt');
  if(ja){ host.nextElementSibling.remove(); i.setAttribute('aria-expanded','false'); } else { host.insertAdjacentHTML('afterend','<div class="infotxt" role="note">'+(i.dataset.t||'').replace(/</g,'&lt;')+'</div>'); i.setAttribute('aria-expanded','true'); } });
function ligarRotulos(){
  $$('main label').forEach(l=>{
    if(l.htmlFor||l.querySelector('input,select,textarea')) return;
    let c=l.nextElementSibling; while(c&&!/^(INPUT|SELECT|TEXTAREA)$/.test(c.tagName)){ c=c.nextElementSibling; }
    if(!c){ const par=l.parentElement; c=par&&par.querySelector('input,select,textarea'); }
    if(c&&!c.getAttribute('aria-label')){ if(!c.id) c.id='auto'+(++rotN); l.htmlFor=c.id; }
  });
  $$('main input,main select,main textarea').forEach(c=>{
    if(c.type==='hidden'||c.getAttribute('aria-label')||c.getAttribute('aria-labelledby')) return;
    if(c.closest('label')||(c.id&&$('label[for="'+c.id+'"]'))) return;
    const lin=c.closest('tr'), nomeLin=lin&&lin.querySelector('b')&&lin.querySelector('b').textContent.trim();
    const painel=c.closest('.pn'), tit=painel&&painel.querySelector('h2')&&painel.querySelector('h2').textContent.trim();
    let nome;
    if(c.type==='checkbox') nome='Marcar como pago'+(nomeLin?': '+nomeLin:'');
    else if(c.dataset.k) nome='Teto de '+c.dataset.k;
    else nome=c.placeholder||c.title||(tit?tit+(nomeLin?': '+nomeLin:''):'Campo');
    c.setAttribute('aria-label',nome);
  });
}
(function(){ let t; new MutationObserver(()=>{ clearTimeout(t); t=setTimeout(()=>{ ligarRotulos(); ajustarInfo(); ajustarGraficos(); },0); }).observe($('#main'),{childList:true,subtree:true}); })();

/* ===== Navegação ===== */
/* ===== Seletor de tema (menu com 4 temas) ===== */
function fecharMenuTema(voltaFoco){ const m=document.getElementById('menutema'); if(!m) return; m.remove(); document.removeEventListener('mousedown',foraMenuTema,true); const b=document.getElementById('tema'); if(b){ b.setAttribute('aria-expanded','false'); if(voltaFoco) b.focus(); } }
function foraMenuTema(e){ const m=document.getElementById('menutema'); if(m && !m.contains(e.target) && !(e.target.closest && e.target.closest('#tema'))) fecharMenuTema(false); }
function escolherTema(t){ aplicaTema(t); save0('tf_tema',t); fecharMenuTema(true); }
function abrirMenuTema(btn){
  if(document.getElementById('menutema')){ fecharMenuTema(true); return; }
  const atualT=document.documentElement.dataset.theme, m=document.createElement('div');
  m.id='menutema'; m.setAttribute('role','menu'); m.setAttribute('aria-label','Temas');
  m.innerHTML=TEMAS.map(t=>`<button type="button" role="menuitemradio" aria-checked="${t===atualT}" data-tema="${t}" tabindex="${t===atualT?0:-1}"><span class="sw" style="--a:var(--sw-${t}-bg);--b:var(--sw-${t}-primary)"></span><span class="nm">${NOMES_TEMA[t]}</span><span class="ck" aria-hidden="true">${t===atualT?I.ok:''}</span></button>`).join('');
  document.body.appendChild(m);
  const r=btn.getBoundingClientRect(); m.style.left=Math.max(8,Math.min(r.left,window.innerWidth-m.offsetWidth-8))+'px'; m.style.bottom=Math.max(8,window.innerHeight-r.top+8)+'px';
  btn.setAttribute('aria-expanded','true');
  const itens=[...m.querySelectorAll('button')]; (itens.find(b=>b.dataset.tema===atualT)||itens[0]).focus();
  m.addEventListener('keydown',e=>{ const i=itens.indexOf(document.activeElement);
    if(e.key==='ArrowDown'){ e.preventDefault(); itens[(i+1)%itens.length].focus(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); itens[(i-1+itens.length)%itens.length].focus(); }
    else if(e.key==='Home'){ e.preventDefault(); itens[0].focus(); }
    else if(e.key==='End'){ e.preventDefault(); itens[itens.length-1].focus(); }
    else if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); fecharMenuTema(true); }
    else if(e.key==='Tab'){ fecharMenuTema(false); } });
  itens.forEach(b=>b.onclick=()=>escolherTema(b.dataset.tema));
  document.addEventListener('mousedown',foraMenuTema,true);
}
let atual = 'hoje';
const PRIM = ['hoje','lancar','cartao','orcamento'];
const temTeclado=()=>{ try{ return matchMedia('(hover:hover) and (pointer:fine)').matches; }catch(e){ return false; } };
function confirmarReimportar(volta){
  const fundo=document.createElement('div'); fundo.className='conf';
  fundo.innerHTML=`<div class="confc" role="alertdialog" aria-modal="true" aria-labelledby="conf_t" aria-describedby="conf_d"><h2 id="conf_t">Reimportar dados?</h2><p id="conf_d">Isso substitui os dados deste aparelho pelos do arquivo que você escolher.</p><div class="confb"><button class="btn ghost" id="conf_nao" type="button">Cancelar</button><button class="btn" id="conf_sim" type="button">Reimportar</button></div></div>`;
  document.body.appendChild(fundo);
  const nao=fundo.querySelector('#conf_nao'), sim=fundo.querySelector('#conf_sim'), fecha=()=>{ fundo.remove(); if(volta&&volta.isConnected) volta.focus(); };
  nao.onclick=fecha; sim.onclick=()=>{ S.definirModo(null); location.reload(); };
  fundo.onclick=e=>{ if(e.target===fundo) fecha(); };
  fundo.onkeydown=e=>{ if(e.key==='Escape'){ e.stopPropagation(); fecha(); } else if(e.key==='Tab'){ e.preventDefault(); (document.activeElement===nao?sim:nao).focus(); } };
  nao.focus();
}
/* ===== Conexão bancária (em teste): só para o dono, ligada neste aparelho. Manual: nada roda sozinho, nada vai para o service worker. ===== */
const bancoLigado=()=>MODO==='real'&&load('tf_banco_on',false)===true;
let bancoToques=[], bancoCsp=false;
function bancoToque(){ const t=Date.now(); bancoToques=bancoToques.filter(x=>t-x<4000); bancoToques.push(t); if(bancoToques.length<7||MODO!=='real') return; bancoToques=[]; save0('tf_banco_on',true); ir('banco'); }
document.addEventListener('securitypolicyviolation',e=>{ if(/script\.google(usercontent)?\.com/.test(e.blockedURI||'')) bancoCsp=true; });
const bancoSessao=()=>Drive.conectado()?null:Drive.jaConectou()?'A sessão do Google expirou. Toque no ícone de nuvem, no topo, para reconectar.':'Para usar, conecte a sincronização: toque no ícone de nuvem, no topo.';
const bancoAviso=(cls,txt)=>{ const m=$('#bc_msg'); if(m) m.innerHTML=txt?alerta(cls,esc(txt)):''; };
T.banco = () => `<div class="head"><div><h1>Conexão bancária (em teste)</h1><div class="sub">Só neste aparelho. Só atualiza quando você pedir.</div></div></div>
  ${pn('Ponte',`<div class="field"><label for="bc_url">Endereço da ponte</label><input id="bc_url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(load('tf_banco_url',''))}"></div>
    <div class="bc-acoes"><button class="btn" id="bc_atu" type="button">Atualizar do banco</button><button class="btn ghost" id="bc_rem" type="button">Remover conexão</button></div><div id="bc_msg" style="margin-top:12px"></div>`,'teal')}
  ${pn('Diagnóstico (só para o dono)',`<div class="small mu">Pede os dados à ponte de novo. A estrutura mostra só contagens, idades e nomes de campos: nenhum valor, data, nome, descrição ou identificador. Conferir saldos e Categorias do banco mostram dados só nesta tela. Nada é guardado.</div>
    <div class="bc-acoes"><button class="btn ghost" id="bc_diag" type="button">Ver estrutura da resposta</button><button class="btn ghost" id="bc_conf" type="button">Conferir saldos</button><button class="btn ghost" id="bc_cat" type="button">Categorias do banco</button></div><div id="bc_diag_out" style="margin-top:12px"></div>`,'teal','margin-top:14px')}
  ${bancoContas().length?pn('Contas',`<div class="small mu" style="margin-bottom:12px">O novo nome vale para as próximas importações. Quem já foi importado mantém o nome daquele dia.</div><div id="bc_mais">${bancoNomesHtml(bancoContas(),'bc_mn')}</div>`,'teal','margin-top:14px'):''}`;
function bancoBind(){ $('#bc_atu').onclick=bancoAtualizar; $('#bc_rem').onclick=bancoRemover; $('#bc_diag').onclick=bancoDiag; $('#bc_conf').onclick=bancoConferir; $('#bc_cat').onclick=bancoCategorias; const s=bancoSessao(); if(s) bancoAviso('at',s); const m=$('#bc_mais'); if(m) m.addEventListener('change',e=>{ const l=bancoContas(), c=l[+e.target.dataset.n]; if(!c) return; c.renome=TFBanco.limparNome(e.target.value); save0('tf_banco_contas',l); }); }
function bancoRemover(){
  const volta=$('#bc_rem'), fundo=document.createElement('div'); fundo.className='conf';
  fundo.innerHTML=`<div class="confc" role="alertdialog" aria-modal="true" aria-labelledby="conf_t" aria-describedby="conf_d"><h2 id="conf_t">Remover conexão?</h2><p id="conf_d">Apaga o endereço da ponte e as escolhas de sinal deste aparelho. Os lançamentos já importados continuam.</p><div class="confb"><button class="btn ghost" id="conf_nao" type="button">Cancelar</button><button class="btn" id="conf_sim" type="button">Remover</button></div></div>`;
  document.body.appendChild(fundo);
  const nao=fundo.querySelector('#conf_nao'), sim=fundo.querySelector('#conf_sim'), fecha=()=>{ fundo.remove(); if(volta.isConnected) volta.focus(); };
  nao.onclick=fecha; sim.onclick=()=>{ arm.del('tf_banco_url'); arm.del('tf_banco_inv'); fundo.remove(); ir('banco'); bancoAviso('ok','Conexão removida.'); };
  fundo.onclick=e=>{ if(e.target===fundo) fecha(); };
  fundo.onkeydown=e=>{ if(e.key==='Escape'){ e.stopPropagation(); fecha(); } else if(e.key==='Tab'){ e.preventDefault(); (document.activeElement===nao?sim:nao).focus(); } };
  nao.focus();
}
async function bancoAtualizar(){
  const v=TFBanco.validarUrl($('#bc_url').value); if(!v.ok){ bancoAviso('ru',v.erro); return; }
  const s=bancoSessao(); if(s){ bancoAviso('at',s); return; }
  save0('tf_banco_url',v.url);
  const b=$('#bc_atu'); b.disabled=true; b.textContent='Buscando…'; bancoAviso('',''); bancoCsp=false;
  let r=await TFBanco.consultar({url:v.url,token:Drive.token(),fetch:(u,o)=>fetch(u,o)});
  if(!r.ok&&r.erro==='rede'){ await new Promise(k=>setTimeout(k,60)); if(bancoCsp) r={ok:false,erro:'csp'}; }
  const b2=$('#bc_atu'); if(!b2) return;   // saiu da tela: a resposta é descartada
  b2.disabled=false; b2.textContent='Atualizar do banco';
  if(!r.ok){ bancoAviso('ru',TFBanco.mensagem(r.erro)); return; }
  if(!r.dados.movs.length){ bancoAviso('ok','Nenhum movimento encontrado nesse período.'); return; }
  bancoPrevia(r.dados);
}
/* diagnóstico (só estrutura) e conferência de saldos: pedem à ponte de novo, quando o dono toca. Nada é guardado nem registrado; sair da tela descarta tudo. */
const bancoDiagMsg=(cls,txt)=>{ const m=$('#bc_diag_out'); if(m) m.innerHTML=txt?alerta(cls,esc(txt)):''; };
async function bancoPedirDiag(id,rotulo){
  const v=TFBanco.validarUrl($('#bc_url').value); if(!v.ok){ bancoDiagMsg('ru',v.erro); return null; }
  const s=bancoSessao(); if(s){ bancoDiagMsg('at',s); return null; }
  const b=$('#'+id); b.disabled=true; b.textContent='Buscando…'; bancoDiagMsg('',''); bancoCsp=false;
  let r=await TFBanco.pedir({url:v.url,token:Drive.token(),fetch:(u,o)=>fetch(u,o)});
  if(!r.ok&&r.erro==='rede'){ await new Promise(k=>setTimeout(k,60)); if(bancoCsp) r={ok:false,erro:'csp'}; }
  const b2=$('#'+id); if(!b2) return null;   // saiu da tela: a resposta é descartada
  b2.disabled=false; b2.textContent=rotulo;
  if(!r.ok){ bancoDiagMsg('ru',TFBanco.mensagem(r.erro)); return null; }
  return {j:r.j};
}
async function bancoDiag(){
  const p=await bancoPedirDiag('bc_diag','Ver estrutura da resposta'); if(!p) return;
  const e=TFBanco.estrutura(p.j,S.hojeISO(),Date.now()); if(!e.ok){ bancoDiagMsg('ru',TFBanco.mensagem(e.erro)); return; }
  const L=TFBanco.estruturaLinhas(e.e), txt=L.map(l=>(l.n?'  ':'')+l.t).join('\n');
  $('#bc_diag_out').innerHTML=`<h3 class="bc-dt">Estrutura da resposta</h3><ul class="bc-diag">${L.map(l=>`<li${l.n?' class="n1"':''}>${esc(l.t)}</li>`).join('')}</ul><div class="bc-acoes"><button class="btn ghost" id="bc_copiar" type="button">Copiar estrutura</button></div><div class="hint" id="bc_copiou" role="status"></div>`;
  $('#bc_copiar').onclick=()=>{ const diz=t=>{ const m=$('#bc_copiou'); if(m) m.textContent=t; }, nao=()=>diz('Não consegui copiar. Selecione o texto acima.');
    try{ navigator.clipboard.writeText(txt).then(()=>diz('Copiado: só contagens, idades e nomes de campos.'),nao); }catch(err){ nao(); } };
}
async function bancoConferir(){
  const p=await bancoPedirDiag('bc_conf','Conferir saldos'); if(!p) return;
  const s=TFBanco.saldos(p.j,Date.now()); if(!s.ok){ bancoDiagMsg('ru',TFBanco.mensagem(s.erro)); return; }
  if(!s.contas.length){ bancoDiagMsg('at','A ponte não trouxe nenhuma conta com saldo.'); return; }
  const rot=TFBanco.rotulos(s.contas,bancoRenomes()), cartoes=DEMO.cartoes||[];
  const ops=[['caixa','Caixa hoje',DEMO.caixinha+DEMO.conta],['reserva','Caixinha (reserva)',DEMO.caixinha],['conta','Conta corrente',DEMO.conta]].concat(cartoes.map(c=>['c:'+c.id,'Fatura atual de '+c.nome,c.fatura]),[['','Não comparar',null]]);
  const val=k=>{ const o=ops.find(x=>x[0]===k); return o?o[2]:null; };
  const padrao=c=>c.subtipo==='CHECKING_ACCOUNT'?'conta':c.subtipo==='SAVINGS_ACCOUNT'?'reserva':c.tipo==='CREDIT'&&cartoes.length===1?'c:'+cartoes[0].id:'';
  const dif=(app,banco)=>app==null||!isFinite(app)||banco==null?'—':PRIV?MASK:(app-banco>0?'+':'')+brl(app-banco);
  const opcoes=sel=>ops.map(o=>`<option value="${esc(o[0])}"${o[0]===sel?' selected':''}>${esc(o[1])}</option>`).join('');
  const soBanco=s.contas.filter(c=>c.tipo==='BANK').reduce((a,c)=>a+c.saldo,0), caixa=val('caixa');
  const cartaoDe=v=>v&&v.startsWith('c:')?cartoes.find(x=>'c:'+x.id===v)||null:null;
  /* cartão: dados de crédito do banco ao lado dos números do cartão do app escolhido no seletor, com a idade do banco */
  const cartaoCmp=(c,ap)=>{
    const k=c.credito, dia=d=>d?d.slice(8)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'—', inf=ap&&ap.limite>0?cartaoInfo(ap):null;
    if(!k) return `<div class="bc-sub small">O banco não mandou os dados de crédito deste cartão.</div>`;
    const linha=(rot,banco,app,d)=>`<span>${rot} no banco</span><span>${banco}</span><span>${rot} no app</span><span>${app}</span><span>Diferença</span><span>${d}</span>`;
    const appV=v=>ap?brl(v):'—', venceApp=ap&&ap.vence?'dia '+esc(String(ap.vence)):'—', venceDif=!ap||!ap.vence||!k.vence?'—':+k.vence.slice(8)===+ap.vence?'mesmo dia':'dia diferente';
    return `<div class="bc-sub"><div class="small mu">Dados de crédito do banco, atualizados ${esc(c.idade)}${ap?'':'. Para comparar, escolha acima a fatura de um cartão do app'}.</div><div class="kv">`+
      linha('Limite (creditLimit)',brl(k.limite),ap&&ap.limite>0?appV(ap.limite):ap?'não informado':'—',dif(ap&&ap.limite>0?ap.limite:null,k.limite))+
      linha('Disponível (availableCreditLimit)',brl(k.disponivel),inf?appV(inf.disponivel):ap?'não informado':'—',dif(inf?inf.disponivel:null,k.disponivel))+
      linha('Vencimento (balanceDueDate)',dia(k.vence),venceApp,venceDif)+
      `<span>Pagamento mínimo (minimumPayment) no banco</span><span>${brl(k.minimo)}</span><span>Pagamento mínimo no app</span><span>o app não tem</span></div></div>`;
  };
  /* cartão: todo campo numérico da conta como veio da ponte, para achar a qual número do app do banco o saldo corresponde */
  const numTxt=v=>PRIV?'••••':esc(v.toLocaleString('pt-BR',{maximumFractionDigits:6}));
  const camposNum=c=>c.numericos?`<div class="bc-sub"><div class="small mu">Campos numéricos desta conta, como vieram da ponte (atualizados ${esc(c.idade)})</div><div class="kv">${c.numericos.lista.map(([k,v])=>`<span>${esc(k)}</span><span>${numTxt(v)}</span>`).join('')}</div>${c.numericos.mais?`<div class="hint">Mais ${c.numericos.mais} campo(s) numérico(s) fora desta lista.</div>`:''}</div>`:'';
  const invLinhas=vs=>vs.map(v=>`<span>${esc(v.nome||'Sem nome')}<small class="bc-st">${esc(v.status||'sem status')}</small></span><span>${brl(v.saldo)}</span>`).join('');
  const blocoItem=(titulo,idade,it)=>`<div class="bc-sub"><b>${esc(titulo)}</b>${idade?`<div class="small mu">Item atualizado ${esc(idade)}</div>`:''}${it.investimentos.length?`<div class="kv">${invLinhas(it.investimentos)}<span>Total do item</span><span>${brl(it.soma)}</span></div>`:'<div class="small">Nenhum investimento veio da ponte para este item.</div>'}</div>`;
  const nomeItem=(it,i)=>'Item '+(i+1)+(it.contas.length?': '+it.contas.map(id=>rot.get(id)).join(', '):' (sem contas)');
  const invest=`<div class="bc-is"><b>Investimentos por item</b>`+(!s.invest.presente?'<div class="small">A ponte não mandou a lista de investimentos.</div>':
    s.itens.map((it,i)=>blocoItem(nomeItem(it,i),it.idade,it)).join('')+(s.semItem.investimentos.length?blocoItem('Investimentos sem item na lista de itens',null,s.semItem):'')+
    (!s.itens.length&&!s.semItem.investimentos.length?'<div class="small">A ponte mandou a lista de investimentos vazia.</div>':'')+(s.invest.mais?`<div class="hint">Mais ${s.invest.mais} investimento(s) fora desta lista.</div>`:''))+'</div>';
  $('#bc_diag_out').innerHTML=`<div id="bc_conf_box"><h3 class="bc-dt">Conferir saldos</h3><div class="small mu">Só nesta tela: nada é guardado. Diferença = número do app menos o número do banco. Cada valor do banco aparece com a idade dele. Escolha com qual número do app comparar cada conta.${s.contas.some(c=>c.tipo==='CREDIT')?' No cartão, o sinal do saldo do banco ainda é a confirmar.':''}</div>`+
    s.contas.map((c,i)=>`<div class="bc-cs"><b>${esc(rot.get(c.id))}</b><div class="kv"><span>Atualizado no banco</span><span id="bc_ci_${i}">${esc(c.idade)}</span><span>No banco</span><span>${brl(c.saldo)}</span>${c.fechamento!=null?`<span>Saldo de fechamento no banco</span><span>${brl(c.fechamento)}</span>`:''}${c.investidoAuto!=null?`<span>Investido automático no banco</span><span>${brl(c.investidoAuto)}</span>`:''}<span><label for="bc_cs_${i}">No app</label></span><span><select id="bc_cs_${i}" data-i="${i}">${opcoes(padrao(c))}</select></span><span>Diferença</span><span id="bc_cd_${i}">${dif(val(padrao(c)),c.saldo)}</span></div>${c.tipo==='CREDIT'?`<div id="bc_cc_${i}">${cartaoCmp(c,cartaoDe(padrao(c)))}</div>${camposNum(c)}`:''}</div>`).join('')+
    invest+
    `<div class="bc-cs"><b>Somas</b><div class="kv"><span>Contas do tipo BANK, somadas</span><span>${brl(soBanco)}</span><span>Caixa hoje no app</span><span>${brl(caixa)}</span><span>Diferença</span><span id="bc_cd_soma">${dif(caixa,soBanco)}</span>${s.invest.presente?`<span>Investimentos, somados (${s.invest.n} com saldo)</span><span id="bc_si">${brl(s.invest.soma)}</span><span>Contas BANK mais ${s.invest.n} investimento(s)</span><span>${brl(soBanco+s.invest.soma)}</span><span>Diferença com o Caixa hoje</span><span id="bc_cd_inv">${dif(caixa,soBanco+s.invest.soma)}</span>`:''}</div></div>`+
    (s.fora?`<div class="hint">${s.fora} conta(s) fora do formato não aparecem aqui.</div>`:'')+'</div>';
  /* o ouvinte fica na caixa nova de cada conferência: tocar de novo troca a caixa e o ouvinte antigo vai junto, sem acumular */
  $('#bc_conf_box').addEventListener('change',e=>{ const i=e.target.dataset&&e.target.dataset.i, c=i!=null&&s.contas[+i]; if(!c) return; const out=$('#bc_cd_'+i); if(out) out.textContent=dif(val(e.target.value),c.saldo); const cc=$('#bc_cc_'+i); if(cc) cc.innerHTML=cartaoCmp(c,cartaoDe(e.target.value)); });
}
/* categorias do banco: cada cat distinta com a contagem de movimentos. Sem descrição e sem valor; só nesta tela, nada guardado nem copiado. */
async function bancoCategorias(){
  const p=await bancoPedirDiag('bc_cat','Categorias do banco'); if(!p) return;
  const r=TFBanco.categorias(p.j); if(!r.ok){ bancoDiagMsg('ru',TFBanco.mensagem(r.erro)); return; }
  const mv=n=>n+(n===1?' movimento':' movimentos');
  $('#bc_diag_out').innerHTML=`<h3 class="bc-dt">Categorias do banco</h3><div class="small mu">Só nesta tela: nada é guardado nem copiado. Cada categoria que veio do banco, com quantos movimentos tem, para ligar depois às categorias do app.</div>`+
    (r.lista.length?`<div class="kv bc-cat">${r.lista.map(([c,n])=>`<span>${esc(c)}</span><span>${esc(mv(n))}</span>`).join('')}</div>`:'<div class="small bc-cat">Nenhum movimento veio com categoria.</div>')+
    `<div class="hint" id="bc_cat_res">Sem categoria: ${esc(mv(r.semCat))}. Total: ${esc(mv(r.total))}.${r.mais?' Mais '+r.mais+' categoria(s) fora desta lista.':''}</div>`;
}
const bancoVinTxt=it=>it.soNeutro?'Marcar como não é gasto':it.neutro?'Vincular conta e marcar como não é gasto':'Vincular conta';
const bancoContas=()=>{ const r=load('tf_banco_contas',[]); return Array.isArray(r)?r:[]; };
const bancoRenomes=()=>new Map(bancoContas().filter(c=>c.renome).map(c=>[c.id,c.renome]));
function bancoNomesHtml(contas,prefixo){ return contas.map((c,i)=>`<div class="field"><label for="${prefixo}${i}">Nome de ${esc(c.padrao)}</label><input id="${prefixo}${i}" type="text" maxlength="60" autocomplete="off" data-n="${i}" value="${esc(c.renome||'')}"></div>`).join(''); }
function bancoPrevia(dados0){
  let dados=dados0, lista=[]; const volta=$('#bc_atu'), inv=new Set(load('tf_banco_inv',[])), escolha=new Map(), escolhaV=new Map(), escolhaD=new Map(), renomes=bancoRenomes(), fora=[...document.querySelectorAll('nav,.col')];
  const padroes=TFBanco.rotulos(dados.contas);
  const liga=it=>it.estado==='novo'||it.estado==='existe', marcado=it=>liga(it)&&(escolha.has(it.idExterno)?escolha.get(it.idExterno):it.marcado);
  const vincula=it=>it.vinculo==='sim'&&!marcado(it)&&(escolhaV.has(it.idExterno)?escolhaV.get(it.idExterno):true);
  const juntaDup=it=>!!it.possivel&&it.possivel.alvo!=null&&!marcado(it)&&escolhaD.get(it.idExterno)===true;
  const ligs=()=>lista.filter(vincula).concat(lista.filter(juntaDup).map(it=>({...it,alvo:it.possivel.alvo,neutro:false})));
  const sentido=it=>it.direcao==='entrada'?'entrada':'saída';
  const etiqueta=it=>[it.estado==='novo'?'':`<span class="tag ne">${it.estado==='sem_valor'?'sem valor':'já existe'}</span>`,it.vinculo==='ambiguo'?'<span class="tag ne">ambíguo</span>':'',it.vinculo==='feito'?'<span class="tag ne">conta vinculada</span>':'',it.possivel&&it.possivel.ambiguo?'<span class="tag ne">ambíguo</span>':''].join('');
  const dupTxt=it=>it.possivel?`<span class="tag ne">possível duplicado</span>${it.possivel.alvo!=null?`<span class="bc-razao">Já existe: ${esc(it.possivel.desc)}</span>`:'<span class="bc-razao">Mais de um lançamento combina.</span>'}`:'';
  const marcaTxt=it=>it.marca==='cartao'?`<span class="tag ne">não é gasto</span><span class="bc-razao">${esc(TFBanco.RAZOES.cartao)}</span>`:it.marca==='fatura'?`<span class="tag ne">pagamento de fatura</span><span class="bc-razao">${esc(TFBanco.RAZOES.fatura)}</span>`:it.marca==='entre'?'<span class="tag ne">entre suas contas</span>':'';
  const linha=(it,i)=>`<div class="bc-lin"><label class="bc-it"><input type="checkbox" data-i="${i}"${marcado(it)?' checked':''}${liga(it)?'':' disabled'}><span class="bc-tx"><b>${esc(it.desc)}</b><span class="mu small">${esc(it.data.split('-').reverse().join('/'))} · ${esc(it.contaNome)}${it.pendente?' · pendente':''}</span>${marcaTxt(it)}${dupTxt(it)}</span><span class="bc-val"><b>${brl(it.valor)}</b><span class="small">${sentido(it)}</span>${etiqueta(it)}</span></label>${it.vinculo==='sim'?`<label class="bc-vin"><input type="checkbox" data-v="${i}"${escolhaV.get(it.idExterno)===false?'':' checked'}><span>${bancoVinTxt(it)}</span></label>`:''}${it.possivel&&it.possivel.alvo!=null?`<label class="bc-vin"><input type="checkbox" data-d="${i}"${escolhaD.get(it.idExterno)===true?' checked':''}><span>Vincular a este lançamento</span></label>`:''}</div>`;
  const fundo=document.createElement('div'); fundo.className='conf';
  const contasNomes=dados.contas.map(c=>({id:c.id,padrao:padroes.get(c.id),renome:renomes.get(c.id)||''}));
  fundo.innerHTML=`<div class="confc bc-prev" role="dialog" aria-modal="true" aria-labelledby="bc_t" aria-describedby="bc_d"><h2 id="bc_t">Importar do banco</h2><p id="bc_d">Confira antes de salvar. Nada é gravado até você confirmar.</p><div class="bc-res" id="bc_res" role="status"></div>
    <div id="bc_contas"></div>
    <div class="bc-cont" id="bc_cont" role="status"></div><div class="bc-lista" id="bc_lista" role="group" aria-label="Movimentos encontrados"></div>
    <details class="bc-nomes"><summary>Renomear contas</summary><div id="bc_nomes">${bancoNomesHtml(contasNomes,'bc_nm')}</div></details>
    <div class="confb"><button class="btn ghost" id="bc_cancel" type="button">Cancelar</button><button class="btn" id="bc_ok" type="button">Importar selecionados</button></div></div>`;
  const q=s=>fundo.querySelector(s);
  const resumoTopo=()=>{ const l=ligs(), N=l.length, M=l.filter(x=>x.neutro).length, K=lista.filter(x=>x.possivel).length; return (N===1?'1 lançamento será atualizado':N+' lançamentos serão atualizados')+', '+(M===1?'1 marcado':M+' marcados')+' como não é gasto, '+(K===1?'1 possível duplicado':K+' possíveis duplicados')+'.'; };
  const conta=()=>{ const n=lista.filter(marcado).length, v=ligs().length; q('#bc_cont').textContent=n+' de '+lista.length+' selecionados'+(v?' · '+v+' para vincular':''); q('#bc_res').textContent=resumoTopo(); q('#bc_ok').disabled=!n&&!v; };
  const pinta=()=>{ const rot=TFBanco.rotulos(dados.contas,renomes); q('#bc_contas').innerHTML=dados.contas.map((c,i)=>`<label class="bc-inv"><input type="checkbox" data-c="${i}"${inv.has(c.id)?' checked':''}><span>Inverter sinal de ${esc(rot.get(c.id))}</span></label>`).join(''); lista=TFBanco.montarPrevia(dados,S.st.lanc,load('tf_banco_ids',[]),[...inv],renomes); q('#bc_lista').innerHTML=lista.map(linha).join(''); conta(); };
  const fecha=()=>{ dados=null; lista=[]; escolha.clear(); escolhaV.clear(); escolhaD.clear(); fundo.remove(); fora.forEach(e=>e.removeAttribute('inert')); if(volta.isConnected) volta.focus(); };   // a resposta não fica guardada depois de fechar
  const salva=()=>{ const sel=lista.filter(marcado), lig=ligs(), rot=TFBanco.rotulos(dados.contas,renomes);
    const r=sel.length?S.importarBanco(sel):{ok:true,n:0}; if(!r.ok){ bancoAviso('ru',r.erro); fecha(); return; }
    const rv=lig.length?S.vincularBanco(lig):{ok:true,n:0}; if(!rv.ok){ bancoAviso('ru',rv.erro); fecha(); return; }
    save0('tf_banco_ids',[...new Set(load('tf_banco_ids',[]).concat(sel.map(x=>x.idExterno),lig.map(x=>x.idExterno)))]); save0('tf_banco_inv',[...inv]);
    const reg=new Map(bancoContas().map(c=>[c.id,c])); dados.contas.forEach(c=>{ reg.set(c.id,{id:c.id,padrao:padroes.get(c.id),renome:renomes.get(c.id)||''}); }); save0('tf_banco_contas',[...reg.values()]);
    fecha(); const p=[]; if(r.n||!rv.n) p.push(r.n===1?'1 lançamento importado.':r.n+' lançamentos importados.'); if(rv.n) p.push(rv.n===1?'1 lançamento vinculado à conta.':rv.n+' lançamentos vinculados à conta.'); if(rv.neutros) p.push(rv.neutros===1?'1 marcado como não é gasto.':rv.neutros+' marcados como não é gasto.'); bancoAviso('ok',p.join(' ')); };
  const resumo=()=>{ const v=ligs().length, m=ligs().filter(it=>it.neutro).length, n=lista.filter(marcado).length, f2=document.createElement('div'); f2.className='conf';
    f2.innerHTML=`<div class="confc" role="alertdialog" aria-modal="true" aria-labelledby="conf_t" aria-describedby="conf_d"><h2 id="conf_t">Confirmar</h2><p id="conf_d">Vai atualizar ${v===1?'1 lançamento existente':v+' lançamentos existentes'} só com a conta.${m?' '+(m===1?'1 será marcado como não é gasto.':m+' serão marcados como não é gasto.'):''} Nada mais muda.${n?' E vai importar '+(n===1?'1 lançamento novo.':n+' lançamentos novos.'):''}</p><div class="confb"><button class="btn ghost" id="bc_vt" type="button">Cancelar</button><button class="btn" id="bc_sim" type="button">Confirmar</button></div></div>`;
    document.body.appendChild(f2); fundo.setAttribute('inert','');
    const nao=f2.querySelector('#bc_vt'), sim=f2.querySelector('#bc_sim'), sai=()=>{ f2.remove(); fundo.removeAttribute('inert'); q('#bc_ok').focus(); };
    nao.onclick=sai; sim.onclick=()=>{ f2.remove(); fundo.removeAttribute('inert'); salva(); };
    f2.onclick=e=>{ if(e.target===f2) sai(); };
    f2.onkeydown=e=>{ if(e.key==='Escape'){ e.stopPropagation(); sai(); } else if(e.key==='Tab'){ e.preventDefault(); (document.activeElement===nao?sim:nao).focus(); } };
    nao.focus(); };
  q('#bc_lista').addEventListener('change',e=>{ const d=e.target.dataset; if(d.d!==undefined){ const it=lista[+d.d]; if(it){ escolhaD.set(it.idExterno,e.target.checked); conta(); } return; } if(d.v!==undefined){ const it=lista[+d.v]; if(it){ escolhaV.set(it.idExterno,e.target.checked); conta(); } return; } const it=lista[+d.i]; if(it){ escolha.set(it.idExterno,e.target.checked); conta(); } });
  q('#bc_contas').addEventListener('change',e=>{ const c=dados.contas[+e.target.dataset.c]; if(!c) return; if(e.target.checked) inv.add(c.id); else inv.delete(c.id); pinta(); });
  q('#bc_nomes').addEventListener('change',e=>{ const c=dados.contas[+e.target.dataset.n]; if(!c) return; const n=TFBanco.limparNome(e.target.value); if(n) renomes.set(c.id,n); else renomes.delete(c.id); pinta(); });
  q('#bc_cancel').onclick=fecha;
  q('#bc_ok').onclick=()=>{ const n=lista.filter(marcado).length, v=ligs().length; if(!n&&!v) return; if(v) resumo(); else salva(); };
  fundo.onclick=e=>{ if(e.target===fundo) fecha(); };
  fundo.onkeydown=e=>{ if(e.key==='Escape'){ e.stopPropagation(); fecha(); return; } if(e.key!=='Tab') return; const f=[...fundo.querySelectorAll('input:not([disabled]),button:not([disabled]),summary')], a=f[0], z=f[f.length-1]; if(e.shiftKey&&document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey&&document.activeElement===z){ e.preventDefault(); a.focus(); } };
  document.body.appendChild(fundo); fora.forEach(e=>e.setAttribute('inert','')); pinta(); q('#bc_cancel').focus();
}
function fecharMais(){ const n=$('#nav'); if(n&&n.classList.contains('aberto')){ n.classList.remove('aberto'); const b=$('#maisbtn'); if(b) b.setAttribute('aria-expanded','false'); } }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') fecharMais(); });
$('#main').addEventListener('click',fecharMais);
let mobAnt=MOB();
const chaveCampo=e=>e.id&&!/^auto\d+$/.test(e.id)?'#'+e.id:e.dataset&&e.dataset.k?'k:'+e.dataset.k:e.dataset&&e.dataset.ap?'ap:'+e.dataset.ap:e.dataset&&e.dataset.dep?'dep:'+e.dataset.dep:null;
function guardarEstado(){
  const st={campos:{},cat:null,forma:null,tipo:null,scroll:window.scrollY,foco:null,sel:null};
  $$('#main input,#main select,#main textarea').forEach(e=>{ const k=chaveCampo(e); if(!k) return; st.campos[k]=(e.type==='checkbox'||e.type==='radio')?{c:e.checked}:{v:e.value}; });
  const c=$('#f_cat .chip[aria-pressed="true"]'); if(c) st.cat=c.dataset.c;
  const t=$('#tipo button[aria-pressed="true"]'); if(t) st.tipo=t.dataset.t;
  const a=document.activeElement; if(a&&a.closest&&a.closest('#main')){ st.foco=chaveCampo(a); try{ st.sel=[a.selectionStart,a.selectionEnd]; }catch(e){} }
  return st;
}
function restaurarEstado(st){
  if(!st) return;
  if(st.tipo&&st.tipo!=='saida'){ const b=$('#tipo button[data-t="'+st.tipo+'"]'); if(b) b.click(); }
  if(st.cat){ const b=$('#f_cat .chip[data-c="'+st.cat+'"]'); if(b) b.click(); }
  Object.keys(st.campos).forEach(k=>{ const e=k[0]==='#'?$(k):k.indexOf('k:')===0?$('[data-k="'+k.slice(2)+'"]'):k.indexOf('ap:')===0?$('[data-ap="'+k.slice(3)+'"]'):$('[data-dep="'+k.slice(4)+'"]'); if(!e) return; const v=st.campos[k];
    if('c' in v) e.checked=v.c; else e.value=v.v; e.dispatchEvent(new Event('input',{bubbles:true})); if(e.tagName==='SELECT') e.dispatchEvent(new Event('change',{bubbles:true})); });
  if(st.foco){ const e=st.foco[0]==='#'?$(st.foco):st.foco.indexOf('k:')===0?$('[data-k="'+st.foco.slice(2)+'"]'):null; if(e&&e.focus){ e.focus({preventScroll:true}); try{ if(st.sel&&st.sel[0]!=null) e.setSelectionRange(st.sel[0],st.sel[1]); }catch(x){} } }
  window.scrollTo(0,st.scroll);
}
function redesenhar(){ if(!MODO){ ir(atual); return; } const st=guardarEstado(); ir(atual); restaurarEstado(st); }
$('#olho').onclick=()=>{ PRIV=!PRIV; save0('tf_priv',PRIV); pintaOlho(); redesenhar(); };
pintaOlho();
$('#main').addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-ir]'); if(b&&!b.onclick) ir(b.dataset.ir); });
let larguraAnt=window.innerWidth;
window.addEventListener('resize',()=>{ larguraAnt=window.innerWidth; if(MOB()!==mobAnt){ mobAnt=MOB(); redesenhar(); } else ajustarGraficos(); });
function ir(k){
  fecharMenuTema(false);
  if(k==='banco'&&!bancoLigado()) k='hoje';
  atual=k; const btnNav=([id,n,h])=>`<button data-k="${id}" aria-current="${id===k}" style="--h:${hue(h)}">${ic[id]}<span>${n}</span></button>`;
  $('#nav').innerHTML=`<div class="brand"><i>$</i>Tutor Financeiro</div>`+TELAS.filter(t=>PRIM.includes(t[0])).map(btnNav).join('')+`<button class="maisbtn${PRIM.includes(k)?'':' ativo'}" id="maisbtn" aria-expanded="false" aria-controls="secw" style="--h:var(--teal)">${ic.mais}<span>Mais</span></button><div class="secw" id="secw">`+TELAS.filter(t=>!PRIM.includes(t[0])).map(btnNav).join('')+`<div class="demo">${MODO==='real'?'<span id="ver_lin">Dados informados por você em '+new Date(DEMO.asOf+'T12:00').toLocaleDateString('pt-BR')+'.</span>'+(temTeclado()?' Tecle N para lançar.':'')+'<br><a href="#" id="reimp" style="color:var(--teal)">Reimportar dados</a>':'Dados de exemplo (fictícios). Nada aqui é seu dinheiro real.<br><a href="#" id="reimp" style="color:var(--teal)">Importar dados reais</a>'}<br>${MODO==='real'?'<button class="linkbtn" id="ver_ex" type="button">Ver exemplo</button>':MODO==='demo'?'<button class="linkbtn" id="sair_ex" type="button">Sair do exemplo</button>':''}<button class="linkbtn" id="inst_ab" type="button">Instalar no celular</button>${bancoLigado()?'<button class="linkbtn" id="banco_ab" type="button">Conexão bancária (em teste)</button>':''}<br><button class="ibtn tonal" id="tema" type="button" aria-label="Escolher tema" title="Escolher tema" aria-haspopup="menu" aria-expanded="false" style="margin-top:8px">${I.paleta}</button></div></div>`;
  $$('#nav button[data-k]').forEach(b=>b.onclick=()=>ir(b.dataset.k));
  $('#maisbtn').onclick=()=>{ const ab=$('#nav').classList.toggle('aberto'); $('#maisbtn').setAttribute('aria-expanded',ab); };
  const tm=$('#tema'); if(tm){ tm.onclick=()=>abrirMenuTema(tm); tm.onkeydown=e=>{ if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); abrirMenuTema(tm); } }; }
  const ri=$('#reimp'); if(ri) ri.onclick=e=>{ e.preventDefault(); if(MODO==='real'){ confirmarReimportar(ri); return; } S.definirModo(null); location.reload(); };
  const ve=$('#ver_ex'); if(ve) ve.onclick=()=>{ S.definirModo('demo'); location.reload(); };
  const se=$('#sair_ex'); if(se) se.onclick=sairExemplo;
  const ia=$('#inst_ab'); if(ia) ia.onclick=()=>ir('instalar');
  const vl=$('#ver_lin'); if(vl) vl.onclick=bancoToque;
  const ba=$('#banco_ab'); if(ba) ba.onclick=()=>ir('banco');
  if(!MODO){ $('#main').innerHTML=telaImportar(); bindImportar(); return; }
  const scroll=window.scrollY;
  if(telaVaziaDe(k)){ $('#main').innerHTML=telaVazia(k); fecharMais(); bindVazia(k); hjLiga(); window.scrollTo(0,0); return; }
  $('#main').innerHTML=T[k](); fecharMais();
  if(k==='instalar') bindInstalar();
  if(k==='banco') bancoBind();
  if(k==='hoje'){ if(SIMPLES()) bindHojeSimples(); else bindHoje(); }
  if(k==='lancar') bindLancar();
  if(k==='agenda') bindAgenda();
  if(k==='orcamento') bindOrc();
  if(k==='metas') bindMetas();
  if(k==='numeros'){ if(SIMPLES()) bindNumerosSimples(); else bindNumeros(); }
  if(k==='cartao'){ drawCartao(); $$('#cts .chip').forEach(b=>b.onclick=()=>{cartSel=b.dataset.c; $$('#cts .chip').forEach(x=>x.setAttribute('aria-pressed',x===b)); drawCartao();}); }
  if(k==='futuro'){ drawFuturo(); $$('#cen .chip[data-c]').forEach(b=>b.onclick=()=>{cenSel=b.dataset.c; $$('#cen .chip[data-c]').forEach(x=>x.setAttribute('aria-pressed',x===b)); drawFuturo();}); const hzb=$('#hz'); if(hzb) hzb.onclick=()=>{ HZ=HZ>=12?7:12; save0('tf_hz',HZ); ir('futuro'); }; const cmb=$('#cmp'); if(cmb) cmb.onclick=()=>{cmpAll=!cmpAll; cmb.setAttribute('aria-pressed',cmpAll); drawFuturo();}; }
  if(k==='decidir'){ drawCalc(); bindAbasCalc(); }
  window.scrollTo(0, ['agenda','orcamento','metas'].includes(k)?scroll:0);
}
if(MODO==='demo'){ const b=document.createElement('button'); b.type='button'; b.id='selo'; b.className='selo'; b.textContent='Exemplo · sair'; b.setAttribute('aria-label','Você está vendo dados de exemplo. Sair do exemplo'); b.onclick=sairExemplo; $('.topbar').prepend(b); }
const h0=(location.hash||'#hoje').slice(1); ir(Object.hasOwn(T,h0) ? h0 : 'hoje');
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')) navigator.serviceWorker.register('sw.js').then(reg=>{
  // atualização: procura sw.js novo ao voltar para o app; quando a versão nova assume, avisa em vez de recarregar sozinho (não perde o que está sendo digitado)
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) reg.update().catch(()=>{}); });
  let tinha=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!tinha){ tinha=true; return; }
    if(document.getElementById('nova_versao')) return;
    const b=document.createElement('button'); b.id='nova_versao'; b.className='btn'; b.type='button'; b.textContent='Há uma versão nova do app. Toque para atualizar.';
    b.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:50'; b.onclick=()=>location.reload(); document.body.appendChild(b);
  });
}).catch(()=>{});
