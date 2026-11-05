# Tutor Financeiro no celular (PWA + Google Drive)

O app é um site comum (HTML + JavaScript), sem servidor seu. Os **dados** ficam em `dados.json`, numa pasta **Tutor Financeiro** do seu Google Drive. Cada aparelho guarda uma cópia local e junta tudo por item, então o PC não precisa ficar ligado.

## O que vai para a internet e o que não vai
- **Pública (GitHub Pages):** só o código do app (`index.html`, `calc.js`, `sync.js`, ícones). Não contém nenhum dado seu.
- **Só no seu Google Drive:** `dados.json` com lançamentos, metas e tetos. O app só enxerga arquivos que ele mesmo criou (permissão `drive.file`), nunca o resto do Drive.
- **Dados reais:** na primeira abertura, o app pede o arquivo `dados_reais_AAAA-MM-DD.json` (fica só na pasta Financeiro do PC, nunca no repositório). Ele é lido no próprio aparelho e vai para o Drive. O celular recebe tudo pelo Drive, sem importar de novo.
- **Planilha:** continua somente leitura e fora daqui. O Power BI ainda reflete o plano antigo (29/10) até a planilha ser atualizada.

## Passo a passo (uma vez só)

### 1. Publicar o código
Repositório novo na conta do GitHub (ex.: `tutor-financeiro`), com os arquivos desta pasta. Em *Settings → Pages*, escolher a branch `main`, pasta raiz. O endereço fica `https://SEU-USUARIO.github.io/tutor-financeiro/`.

### 2. Projeto gratuito no Google Cloud
1. Em console.cloud.google.com, criar um projeto (ex.: "Tutor Financeiro").
2. *APIs e serviços → Biblioteca*: ativar **Google Drive API**.
3. *Tela de consentimento OAuth*: tipo **Externo**, nome do app "Tutor Financeiro", seu e-mail. Adicionar o escopo `.../auth/drive.file`. Depois, em **Publicar app**, passar para "Em produção" (esse escopo não exige verificação do Google; em modo "Teste" o acesso expira a cada 7 dias).
4. *Credenciais → Criar credenciais → ID do cliente OAuth*, tipo **Aplicativo da Web**:
   - Origem JavaScript autorizada: `https://SEU-USUARIO.github.io`
   - URI de redirecionamento: `https://SEU-USUARIO.github.io/tutor-financeiro/index.html`
5. Copiar o **ID do cliente** e colocar em `config.js` (`clientId`). Ele não é segredo.

### 3. No iPhone
1. Abrir o endereço no Safari.
2. Tocar na pílula no topo ("Conectar ao Drive") e entrar com a conta Google.
3. Compartilhar → **Adicionar à Tela de Início**.

No PC, abrir o mesmo endereço (ou `index.html` localmente) e conectar com a mesma conta.

## Como a sincronização funciona
- Cada lançamento, meta, teto e conta paga é um item com ID e hora da última alteração.
- Ao juntar dois aparelhos, vale a alteração **mais recente de cada item**. Lançar nos dois ao mesmo tempo não perde nada.
- Apagar deixa uma marca de exclusão, para a remoção chegar ao outro aparelho.
- Sincroniza ao abrir, a cada minuto, ao voltar para o app e quando a internet volta. Sem internet, tudo fica salvo no aparelho.
- O acesso do Google dura 1 hora e o app renova sozinho. Se a pílula ficar amarela ("Reconectar"), um toque resolve.
- O Drive guarda o histórico de versões do `dados.json`, então dá para voltar atrás.

## Pontos de atenção
- No iPhone, o login do Google pode abrir numa janela do Safari e não voltar para o app da Tela de Início. Se isso acontecer, entrar uma vez pelo Safari e depois usar o ícone normalmente. Precisa ser testado no aparelho real.
- Dados de exemplo (fictícios) só viram itens quando você os altera; os que você não mexer não vão para o Drive.
- A projeção do Futuro é conta do app a partir do JSON (salário estimado, ajuda em casa, parcelas antigas, assinaturas, faculdade, teto de lazer). Mercado e transporte do dia a dia ainda não entram. As suposições aparecem na tela Hoje.
- O limite do cartão não veio no arquivo: o app pede na tela Cartão.

## Telas
Hoje, Lançar (com lançamento rápido por texto), Cartão, Agenda, Orçamento, Metas, Futuro, Decidir, Patrimônio e Meus números. Tema escuro e claro (botão no menu). O visual vem do design em `app/design/` (tokens verificados por contraste).

## Arquivos
- `index.html`: telas e interface. `tokens.css`: cores, espaços e tipografia do design.
- `store.js`: dados e regras (lançar, editar, apagar, metas, tetos, números, texto rápido). `real.js`: previsão a partir dos dados reais. `calc.js`: contas de empréstimo, consórcio, cartão e investimento. `sync.js`: junção entre aparelhos e Google Drive.
- `sw.js`, `manifest.webmanifest`, ícones: modo app e offline.

## Testes
```
node test_calc.js    # cálculos financeiros
node test_sync.js    # junção de dados entre aparelhos
node test_real.js    # previsão e números a partir dos dados reais
node test_store.js   # lançamentos, metas, tetos, números, texto rápido, CSV
node test_ui.js      # interface: cada tela e cada função, num navegador simulado
```
O `test_ui.js` precisa do jsdom (uma vez): `cd dev && npm install`. Os testes de dados reais e da interface ficam só no seu computador, porque usam números reais.
