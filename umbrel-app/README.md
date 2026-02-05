# Financial Management - umbrelOS App

Este diretorio contem os arquivos necessarios para instalar o Financial Management como um app nativo no umbrelOS.

## Opcao 1: Community App Store (Recomendado para uso pessoal)

A forma mais simples e usar o **community-app-store** do umbrelOS.

### Passo 1: Instalar o Community App Store

1. Acesse o terminal do umbrelOS (via SSH)
2. Execute:
```bash
curl -sL https://raw.githubusercontent.com/getumbrel/umbrel-community-app-store/master/install.sh | bash
```

### Passo 2: Adicionar seu app

1. Clone este repositorio no umbrelOS:
```bash
cd ~/umbrel/app-stores/
git clone https://github.com/SEU_USUARIO/financial-management.git
```

2. Copie a pasta do app:
```bash
cp -r financial-management/umbrel-app ~/umbrel/app-stores/community/financial-management
```

3. Reinicie o umbrelOS ou atualize os apps

---

## Opcao 2: Instalacao Manual (mais simples)

### Passo 1: Buildar e publicar as imagens Docker

Primeiro, publique as imagens no GitHub Container Registry:

```bash
# Login no GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u SEU_USUARIO --password-stdin

# Build e push da API
cd server-node
docker build -t ghcr.io/SEU_USUARIO/financial-management-api:latest .
docker push ghcr.io/SEU_USUARIO/financial-management-api:latest

# Build e push do App
cd ../client
docker build -t ghcr.io/SEU_USUARIO/financial-management-app:latest .
docker push ghcr.io/SEU_USUARIO/financial-management-app:latest
```

### Passo 2: Copiar para o umbrelOS

```bash
# No umbrelOS
sudo mkdir -p /home/umbrel/umbrel/app-data/financial-management
sudo cp -r umbrel-app/* /home/umbrel/umbrel/app-data/financial-management/
```

### Passo 3: Registrar o app

Adicione ao arquivo de apps do umbrelOS ou use o Portainer/Dockge.

---

## Opcao 3: Usar Dockge/Portainer (Mais Facil)

Se voce so quer rodar o app sem aparecer na interface do umbrelOS:

1. Instale **Dockge** pela App Store do umbrelOS
2. Crie um novo stack com o conteudo do `docker-compose.yml` da raiz do projeto
3. Configure o `.env` com o IP da sua VPS
4. Clique em "Deploy"

O app estara acessivel em `http://SEU_IP:4200`

---

## Estrutura dos Arquivos

```
umbrel-app/
├── docker-compose.yml  # Configuracao dos containers
├── umbrel-app.yml      # Manifesto do app
├── icon.svg            # Icone 256x256
└── README.md           # Este arquivo
```

## Variaveis de Ambiente Disponiveis

O umbrelOS fornece automaticamente:
- `${APP_DATA_DIR}` - Diretorio de dados persistentes
- `${DEVICE_HOSTNAME}` - Hostname do dispositivo

## Portas Utilizadas

- **4200**: Frontend (Next.js)
- **3010**: API (Node.js) - exposta para o frontend acessar
- **27017**: MongoDB (apenas interno)
