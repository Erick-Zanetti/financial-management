# Financial Management - App no Umbrel (uso na sua VPS)

Use o app só na sua VPS/Umbrel, sem publicar imagens em nenhum registry.

## App integrado na interface do Umbrel

Para o app aparecer na App Store do Umbrel e na lista de apps, use o **Community App Store** e siga o guia:

**[INSTALAR-NO-UMBREL.md](./INSTALAR-NO-UMBREL.md)** – passos exatos (criar store, pasta do app com codigo, adicionar store no Umbrel, instalar).

### 3. Rodar manualmente na VPS (fora do app store)

Se preferir subir o stack sem passar pela loja do Umbrel:

```bash
cd /caminho/para/financial-management
docker compose -f umbrel-app/docker-compose.yml --project-directory . up -d --build
```

O frontend fica atras do proxy do Umbrel (porta 4200). A API fica exposta em `http://SEU_HOST:3010` para o browser chamar. Variaveis `${APP_DATA_DIR}` e `${DEVICE_HOSTNAME}` precisam estar definidas (no Umbrel sao injetadas automaticamente). Para rodar manualmente, crie um `.env` na pasta do projeto:

```bash
APP_DATA_DIR=./umbrel-data
DEVICE_HOSTNAME=localhost
```

Ajuste `DEVICE_HOSTNAME` para o hostname ou IP da sua VPS se acessar de outro dispositivo.

---

## Opcao alternativa: Dockge/Portainer

Para rodar como stack sem integrar na UI do Umbrel:

1. Instale **Dockge** (ou Portainer) pela App Store do Umbrel.
2. Clone o repo em algum lugar acessivel pelo Dockge.
3. Crie um novo stack e use o `docker-compose.yml` da **raiz** do projeto (nao o de umbrel-app). Esse compose usa `server-node` e `client` com build local.
4. No .env da raiz, defina por exemplo:
   - `API_URL=http://IP_DA_VPS:3000`
   - O client usa `NEXT_PUBLIC_API_URL` no build; no compose da raiz use `NEXT_PUBLIC_API_URL=http://IP_DA_VPS:3000/financial-release` (ou o IP/hostname que o browser vai usar para acessar a API).

O app fica em `http://IP_DA_VPS:4200`.

---

## Variaveis do Umbrel

O Umbrel injeta:
- `${APP_DATA_DIR}` – dados persistentes (ex.: MongoDB)
- `${DEVICE_HOSTNAME}` – hostname do dispositivo (para o frontend chamar a API)

## Portas

- **4200**: frontend (Next.js), usada pelo app_proxy do Umbrel
- **3010**: API no host (o browser acessa por aqui)
- **27017**: MongoDB (só na rede interna)
