# 🎓 Our First Global Job - Learning App

> Plataforma inteligente de mini-cursos interativos de inglês voluntário com inteligência artificial para geração de lições, simulados de quizzes, formação de turmas combinadas e emissão simbólica de certificados.

---

## 📖 Visão Geral

O **Our First Global Job - Learning App** é uma plataforma full-stack e moderna desenvolvida com **Vue 3**, **TypeScript**, **Tailwind CSS** e **Firebase** (Authentication & Firestore). Ela foi projetada para conectar professores voluntários a alunos que querem aprender inglês através de mini-cursos estruturados de forma dinâmica.

O grande diferencial do sistema é o uso do modelo de inteligência artificial **Gemini** (através da SDK oficial `@google/genai`), que permite aos professores criarem conteúdos pedagógicos, explicações e simulados de forma automatizada e com alto padrão de qualidade em poucos segundos.

---

## 🎨 Principais Recursos (Por Nível de Acesso)

### 🧑‍🎓 Espaço do Aluno (Student Dashboard)
* **Visualização de Cursos:** Navegação por trilhas de aprendizado nos níveis *Beginner* (Iniciante), *Intermediate* (Intermediário) e *Advanced* (Avançado).
* **Leitura & Estudo Interativo:** Aulas estruturadas com suporte a conteúdo formatado em Markdown, vídeos explicativos acoplados e acompanhamento em tempo real do progresso.
* **Simulado & Quizzes:** Resolução de testes interativos com validação instantânea, pontuação dinâmica e explicações detalhadas geradas por IA para cada alternativa.
* **Emissão de Certificados:** Geração de certificados simbólicos digitais customizados para os alunos que cumprem os pré-requisitos configurados para o curso (leitura completa, visualização de vídeos ou pontuação mínima em quizzes).
* **Agendamento de Aulas Ao Vivo:** Grade de horários semanal interativa (com visualização otimizada para Desktop e Slider deslizante fluido para Mobile) que permite a inscrição em aulas de conversação em grupo limitadas por vagas.
* **Chat de Suporte (Suporte Técnico/Pedagógico):** Abertura de salas de chat individuais com os instrutores dos cursos para tirar dúvidas sobre lições.

### 🧑‍🏫 Painel de Tutores (Instructor Panel)
* **Criador de Cursos:** Interface completa para cadastro, edição e exclusão de cursos com níveis de proficiência personalizados.
* **Gerador de Lições com IA (Gemini):**
  * Geração instantânea de conteúdo completo de aula (formato Markdown rico, com tabelas, vocabulários, diálogos e exercícios).
  * Criação automática de Quizzes associados (perguntas, opções de resposta múltipla escolha e explicação para cada questão).
  * Input de objetivos pedagógicos personalizados ou tópicos específicos para a IA focar.
* **Configuração de Requisitos de Progresso:** Controle fino sobre o que é necessário para concluir o curso (Leitura obrigatória, assistir ao vídeo, pontuação mínima de aproveitamento no Quiz).
* **Agendador de Aulas Síncronas (Turmas):** Criação e acompanhamento de salas de aula virtuais integradas com links de chamada (Meet, Zoom, Teams, etc.), gerenciamento de presença e limite de alunos por turma.
* **Gestão de Dúvidas (Inbox de Chats):** Painel para responder e resolver de forma ágil as dúvidas enviadas pelos alunos em tempo real através do chat interno.

### 👑 Área Master (Admin Panel)
* **Auditoria de Usuários:** Listagem de todos os perfis de usuários cadastrados com filtros por e-mail e nível de acesso.
* **Atribuição de Cargos:** Painel administrativo para promover estudantes a tutores/professores voluntários e vice-versa de maneira segura.
* **Gerenciamento de Códigos de Convite (Invites):** Geração e acompanhamento de códigos de convite com funções pré-atribuídas (Estudante/Instrutor) para onboarding controlado de novos participantes.
* **Reset de Senha Seguro:** Mecanismo integrado direto ao Firebase Auth para disparar e-mails de redefinição de senha para qualquer usuário cadastrado no sistema em caso de perda.

---

## 🛠️ Arquitetura e Estrutura do Projeto

A estrutura de pastas foi modularizada visando a reutilização de componentes e a facilidade de manutenção:

```bash
├── .devcontainer/             # Configurações de container de desenvolvimento
├── public/                    # Assets estáticos (ícones, imagens globais)
├── src/
│   ├── components/            # Componentes Vue organizados por módulo
│   │   ├── admin/             # Paineis Master e gerenciamento de usuários
│   │   ├── auth/              # Formulários de Login, Registro e Perfil
│   │   ├── chats/             # Chatrooms e inbox de atendimento de dúvidas
│   │   ├── common/            # Componentes visuais utilitários globais
│   │   ├── courses/           # Visualizadores de cursos, lições, quizzes e certificados
│   │   ├── layout/            # AppHeader e layouts de estrutura global
│   │   └── scheduler/         # Calendário semanal interativo (Mobile/Desktop)
│   ├── composables/           # Hooks para gerenciar estados reativos globais
│   ├── utils/                 # Helpers utilitários de formatação e data
│   ├── firebase.ts            # Inicialização da SDK do Firebase
│   ├── index.css              # Estilos globais carregando o Tailwind CSS
│   ├── main.ts                # Inicialização da aplicação Vue 3
│   └── types.ts               # Interfaces globais estritas TypeScript
├── vite.config.ts             # Configurações do Vite ajustadas para roteamento relativo
├── firestore.rules            # Regras de segurança robustas do Firestore
├── package.json               # Gerenciador de dependências e scripts de automação
└── README.md                  # Documentação oficial do projeto
```

---

## ⚙️ Configuração e Variáveis de Ambiente

O projeto utiliza o Firebase para autenticação e banco de dados em tempo real, além da API Key do Gemini para os recursos inteligentes.

### 1. Criar o Arquivo `.env`
Duplique o arquivo `.env.example` e preencha as credenciais correspondentes do seu projeto:

```env
VITE_FIREBASE_API_KEY=seu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain_aqui
VITE_FIREBASE_PROJECT_ID=seu_project_id_aqui
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_aqui
VITE_FIREBASE_APP_ID=seu_app_id_aqui

# API Key do Gemini (utilizada pelo tutor para geração de aulas)
VITE_GEMINI_API_KEY=sua_gemini_api_key_aqui
```

### 2. Regras do Firestore (`firestore.rules`)
Assegure que as regras contidas no arquivo `firestore.rules` sejam implantadas no painel do seu Firebase Console para garantir que apenas alunos matriculados acessem suas turmas e que apenas instrutores criem cursos.

---

## 🚀 Como Executar o Projeto Localmente

Siga o passo a passo abaixo para rodar a aplicação na sua máquina:

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Iniciar Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   *O servidor iniciará no endereço local padrão de sua preferência ou porta 3000.*

3. **Compilar para Produção:**
   ```bash
   npm run build
   ```

4. **Executar Linter de Tipos:**
   ```bash
   npm run lint
   ```

---

## 📦 Deploy no GitHub Pages (Configurado)

Este repositório já está preparado e configurado com a dependência `gh-pages` para deploy de forma automatizada.

1. **Verifique as Configurações:**
   * O `vite.config.ts` possui a propriedade `base: './'` ativada para garantir que os caminhos das pastas de build funcionem de forma relativa em subdiretórios do GitHub Pages.

2. **Como Publicar:**
   Execute o comando de publicação automática:
   ```bash
   npm run deploy
   ```
   *Esse comando compilará o projeto automaticamente através do hook `predeploy` e enviará a pasta de build `dist` diretamente para a branch `gh-pages` do seu repositório remoto.*

---

## 📄 Licença

Este projeto está licenciado sob a licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para obter mais detalhes.

---

<p align="center">Desenvolvido com carinho para a iniciativa <strong>Our First Global Job</strong>. 🇧🇷 🌍 🇺🇸</p>
