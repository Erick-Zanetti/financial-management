# Instalar como app integrado no Umbrel

Para o app aparecer na interface do Umbrel (App Store, lista de apps, etc.) você usa o **Community App Store**. O Umbrel não instala um app direto por URL de um repo; ele instala apps que estão dentro de um **store** (outro repo).

Resumo: você cria um repositório que é o seu “store” com um único app (este). Dentro desse store, a pasta do app contém o código para build local. Depois você adiciona a URL desse store no Umbrel e instala o app por lá.

---

## Passo 1: Criar o repositório do seu store

1. No GitHub: **Use this template** no [umbrel-community-app-store](https://github.com/getumbrel/umbrel-community-app-store).
2. Crie um repo novo (ex.: `meu-umbrel-store`) no seu usuário.

---

## Passo 2: Configurar o store e a pasta do app

1. No repo do store, edite **`umbrel-app-store.yml`** na raiz:
   - `id`: um id só do seu store (ex.: `erick`). Só letras e hífens.
   - `name`: nome que aparece no Umbrel (ex.: `Meus Apps`).

2. Renomeie a pasta de exemplo:
   - De `sparkles-hello-world` para **`<seu-store-id>-financial-management`**  
   - Ex.: se `id` é `erick`, a pasta deve ser **`erick-financial-management`**.

3. Dentro dessa pasta (**`erick-financial-management`**), deixe só o que for do Financial Management:
   - Apague o que veio do template (conteúdo do hello-world).
   - Copie para dentro dessa pasta:
     - **`umbrel-app/umbrel-app.yml`** → renomeie/copie como **`umbrel-app.yml`** na pasta do app.
     - **`umbrel-app/docker-compose.standalone.yml`** → copie como **`docker-compose.yml`** na pasta do app.
     - As pastas **`client/`** e **`server-node/`** inteiras (da raiz do projeto financial-management) para dentro da pasta do app.

   Estrutura final da pasta do app (ex.: `erick-financial-management/`):

   ```
   erick-financial-management/
   ├── umbrel-app.yml
   ├── docker-compose.yml
   ├── client/
   │   └── ... (todo o conteúdo do client)
   └── server-node/
       └── ... (todo o conteúdo do server-node)
   ```

4. No **`umbrel-app.yml`** que está dentro dessa pasta, o `id` pode continuar `financial-management` ou você pode alinhar com o nome da pasta (não é obrigatório ser igual ao id do store).

5. Faça commit e push do repo do store.

---

## Passo 3: No Umbrel, adicionar o store e instalar o app

1. Abra o **Umbrel** na sua VPS (pelo navegador).
2. Vá em **App Store**.
3. Aba ou seção **Community App Store**.
4. Clique nos **três pontinhos** (⋮) ou em “Add store” / “Adicionar store”.
5. Cole a **URL do repositório do store** (ex.: `https://github.com/SEU_USUARIO/meu-umbrel-store`).
6. Confirme. O store deve aparecer (ex.: “Meus Apps”) e o app **Financial Management** na lista.
7. Clique em **Install** no Financial Management.
8. Espere o build (pode demorar alguns minutos na primeira vez).
9. O app passa a aparecer na lista de apps e você acessa por lá.

---

## Atualizar o app depois

Quando você mudar o código do financial-management:

1. Atualize no repo do **store**: dentro da pasta do app, atualize `client/` e `server-node/` (copiando de novo do repo principal ou usando submodule/script).
2. Dê push no repo do store.
3. No Umbrel, no app Financial Management, use **Update** (se existir) ou desinstale e instale de novo para pegar o novo código e rebuild.

---

## Resumo rápido

| Onde | O quê |
|------|--------|
| Repo **financial-management** | Código que você desenvolve (client, server-node, umbrel-app). |
| Repo **meu-umbrel-store** | Store com uma pasta (ex. `erick-financial-management`) que tem umbrel-app.yml, docker-compose.yml, client/, server-node/. |
| Umbrel → App Store → Community → Add store | URL do repo **meu-umbrel-store**. |
| Umbrel → Install no Financial Management | Build e instalação a partir do código que está na pasta do app no store. |

Nada precisa ser publicado em registry de imagens; o build é feito na sua VPS a partir do código que está no store.
