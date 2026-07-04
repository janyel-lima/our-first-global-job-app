# 📘 Manual de Operação: Cotas Firebase, Funcionalidades Offline e Guia de Sincronização (English Volunteer)

Este manual foi elaborado para apoiar a transição para a primeira versão **Beta Aberta** do aplicativo **English Volunteer**. Ele descreve os limites de cotas gratuitas do Firebase, os mecanismos de resiliência offline e sincronização ativa, e fornece orientações detalhadas de configuração.

---

## 📊 1. Cotas Gratuitas dos Serviços Firebase (Spark Plan)

O aplicativo utiliza dois serviços principais do Firebase: **Firebase Authentication** e **Cloud Firestore**. Abaixo estão detalhadas as cotas diárias/mensais gratuitas oficiais do plano Spark, facilitando o planejamento de uso no ambiente de produção do primeiro Beta.

### 🔐 Firebase Authentication
O Firebase Auth é responsável pelo cadastro, login de estudantes e professores voluntários e governança de acessos por claims administrativas.
*   **Contas de Usuários Ativos Mensais (MAU):** Até **10.000 usuários ativos por mês** (totalmente grátis).
*   **Limite de Login por Telefone/SMS (se ativado):** 10.000 envios/mês de verificação por SMS sem custo.
*   **Custo Excedente:** Caso passe de 10k MAUs, o custo por usuário ativo adicional em logins tradicionais e sociais (Google, etc.) continua extremamente baixo.

### 🗄️ Cloud Firestore
O banco de dados relacional NoSQL Firestore é responsável por persistir cursos, lições, turmas agendadas (Agenda), progresso de alunos e mensagens do suporte.
*   **Armazenamento de Dados (Data Stored):** Até **1 GiB** de dados no banco de dados.
*   **Leituras de Documentos (Reads):** Até **50.000 leituras por dia**.
*   **Gravações de Documentos (Writes):** Até **20.000 gravações por dia**.
*   **Exclusões de Documentos (Deletes):** Até **20.000 exclusões por dia**.
*   **Largura de Banda de Saída:** Até **10 GiB** de tráfego de rede saindo por mês.

> 💡 **Dica de Economia Inteligente:** O aplicativo foi otimizado para economizar leituras no Firestore utilizando **caching reativo local instantâneo** e reduzindo o consumo excessivo ao evitar requisições repetidas para documentos inalterados.

---

## 🌐 2. Configurando Segredos (Secrets) no Repositório de Produção

Para colocar o aplicativo no ar e conectá-lo ao seu próprio banco de dados Firebase em produção, você deve cadastrar as variáveis de ambiente necessárias.

### Nomes das Variáveis (`.env.example` atualizado)
Cadastre as seguintes chaves nas configurações do seu provedor de hospedagem (como Cloud Run, Vercel, Netlify) ou no repositório GitHub para automação de CI/CD:

```env
VITE_FIREBASE_API_KEY="SuaApiKeyDoFirebase"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="SeuSenderID"
VITE_FIREBASE_APP_ID="SeuAppID"
```

---

## 💾 3. Arquitetura Offline e Ciclo de Vida de Sincronização

Para garantir que o English Volunteer funcione perfeitamente em locais de conexão instável (escolas públicas, áreas rurais ou transporte público), implementamos uma arquitetura híbrida de persistência local redundante e sincronização limpa.

### 🛠️ Mecanismo de Cache em Duas Camadas
1.  **Firebase Firestore SDK Persistence (`persistentLocalCache`):**
    *   No arquivo `src/firebase.ts`, ativamos o cache local multi-abas oficial do Firebase. Ele salva automaticamente todas as consultas do Firestore no IndexedDB do navegador.
    *   Leituras e escritas feitas enquanto offline são registradas localmente e enviadas ao servidor de forma assíncrona assim que a conexão for restabelecida.
2.  **Backup em LocalStorage Clássico (`useAppState.ts`):**
    *   Para garantir recuperação instantânea antes mesmo da inicialização do Firebase SDK, todos os conjuntos de dados cruciais (cursos, lições, progresso de certificados e turmas da agenda) são convertidos para JSON e cacheados em strings no LocalStorage.
    *   Ao abrir o app, a renderização inicial ocorre em menos de **100ms** utilizando esses dados locais, evitando telas de carregamento em branco.

### 🔄 Ciclo de Vida de Sincronização de Progresso Offline
Ao concluir lições, questionários (quizzes) ou desbloquear certificados offline, o aplicativo adota um ciclo de vida estruturado e seguro para impedir perda de dados e colisões:

```
[Progresso Criado Offline]
        │
        ▼
[Salvo no LocalStorage do Navegador] (Instantâneo)
        │
        ▼
[Enfileirado em 'offline_progress_queue'] (Fila Local Segura)
        │
        ├─► [Usuário permanece offline] ──► Navega normalmente pelo app usando cache
        │
        ▼ (Evento: window.onLine acionado ou Inicialização com Rede)
[Função syncOfflineProgress() Disparada]
        │
        ├─► [Verifica Usuário Autenticado]
        ├─► [Exclui UID de demonstração para evitar poluição]
        ▼
[Upload individual via setDoc() ao Firestore]
        │
        ├─► [Sucesso] ──► Remove item da fila / Mostra Toast notificando sucesso
        └─► [Falha]   ──► Mantém na fila local para nova tentativa automática
```

### 📅 Agenda de Aulas e Eventos Offline
*   **Visualização:** O calendário completo de agendamentos de aulas ao vivo é lido a partir do cache local, permitindo que estudantes saibam as datas e horas de encontros futuros mesmo sem internet.
*   **Presença e Matrícula:** Alunos podem clicar para se matricular ou marcar presença em aulas. O aplicativo atualiza o estado em memória localmente e agenda a escrita offline no Firebase para consolidação segura ao reconectar.

### 👥 Modo de Demonstração (Demo Play)
Se um voluntário preferir testar o aplicativo offline sem criar conta, o **Modo Demo** provê uma sandbox simulada local:
*   Dados de cursos e chats de suporte funcionam por mock inteligente.
*   Um **bot pedagógico automatizado** responde no chat após 1.5 segundos para simular a interação em tempo real com professores voluntários.

---

## 🔑 4. Guia de Administração: Criando Administradores via CLI (`set-admin-claims.js`)

Para promover um usuário recém-cadastrado ao cargo de **Administrador Master** com total controle pedagógico, use o script de Claims Customizadas do Firebase Admin SDK que desenvolvemos.

### Requisitos Prévios
1. Baixe o arquivo de credenciais privadas em formato `.json` do Console do Firebase.
2. Renomeie este arquivo baixado para `our-first-global-job-firebase-adminsdk.json` e coloque-o na raiz do seu projeto.
3. Certifique-se de que ele não será rastreado pelo controle de versão (o arquivo já está configurado no `.gitignore` para sua total segurança).

### Executando a Promoção
Abra o terminal na raiz do projeto e execute o comando abaixo, alterando para o e-mail do usuário cadastrado e especificando o ambiente (`prod` para produção):

```bash
node set-admin-claims.js seu-email-admin@outlook.com prod
```

### O que o Script Executa de Forma Segura?
*   Conecta ao Firebase de produção utilizando a chave privada certificada.
*   Busca o UID do usuário por e-mail no painel de Autenticação.
*   **Claims Customizadas:** Configura o token JWT do usuário de forma inviolável com `{ admin: true, role: "admin" }`.
*   **Consistência do Firestore:** Localiza o registro do usuário nas coleções `users` e `profiles` atualizando de forma sincronizada o campo `role` para `"admin"` e `isAdmin` para `true`.
*   A partir do próximo login, o usuário terá acesso total ao painel administrativo Master e de Instrutores.

---
🚀 *O aplicativo está totalmente preparado para o primeiro Beta Aberto. Que essa jornada traga grande impacto no ensino de inglês voluntário!*
