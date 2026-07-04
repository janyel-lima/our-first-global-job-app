# 🔑 Guia: Configurando Acesso SSH do Git no Dev Container

Se você está recebendo o erro `Permission denied (publickey)` ao tentar fazer `git push` de dentro do seu Dev Container, isso acontece porque o container isolado não possui acesso às suas chaves SSH privadas armazenadas na sua máquina local (hospedeira).

A forma mais limpa, elegante e segura de resolver isso é utilizando o **SSH Agent Forwarding** (Redirecionamento de Agente SSH), que permite ao container usar temporariamente as chaves da sua máquina local sem precisar copiá-las para dentro do container.

Abaixo estão os passos rápidos para configurar isso em cada sistema operacional.

---

## 🛠️ Método Principal: Ativar SSH Agent na Máquina Hospedeira (Local)

Para que o VS Code e o Dev Container consigam redirecionar suas chaves, o agente SSH precisa estar rodando localmente com a sua chave carregada **antes** de você iniciar o Dev Container.

### 🍎 No macOS ou 🐧 Linux Tradicional (Na sua máquina local)

1. **Abra o terminal na sua máquina local** (não dentro do Dev Container).
2. Verifique se o agente SSH está rodando e adicione sua chave privada:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```
   *(Substitua `id_ed25519` pelo nome do seu arquivo de chave privada SSH, caso seja diferente, como `id_rsa`).*

3. No VS Code, abra a Paleta de Comandos (`Ctrl+Shift+P` ou `Cmd+Shift+P`) e selecione:
   **"Dev Containers: Rebuild Container"** (Reconstruir Container) ou reinicie a sessão para que a variável `SSH_AUTH_SOCK` seja injetada.

---

### 🚀 Configuração Nativa e Elegante no 🐧 CachyOS / Arch Linux (Com Systemd)

Como o **CachyOS** é baseado no Arch Linux e utiliza o `systemd` por padrão para gerenciar a sessão do usuário, a melhor forma de manter o `ssh-agent` rodando de forma persistente e transparente no seu sistema hospedeiro é utilizando o serviço do systemd para o usuário:

1. **Ative o serviço do SSH Agent do systemd no seu CachyOS (Hospedeiro local):**
   ```bash
   systemctl --user enable --now ssh-agent
   ```

2. **Configure as variáveis de ambiente no seu arquivo de configuração do Shell local:**
   O CachyOS costuma usar `zsh` ou `fish` como padrão de terminal, ou o tradicional `bash`. Adicione a linha abaixo ao seu arquivo de configuração (`~/.zshrc`, `~/.bashrc` ou correspondente do fish):

   * Para **Zsh** ou **Bash** (`~/.zshrc` ou `~/.bashrc`):
     ```bash
     export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/ssh-agent.socket"
     ```
   * Para **Fish** (`~/.config/fish/config.fish`):
     ```fish
     set -x SSH_AUTH_SOCK "$XDG_RUNTIME_DIR/ssh-agent.socket"
     ```

3. **Adicione sua chave ao agente (execute uma vez ou coloque no seu profile):**
   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

4. **Reabra o seu Dev Container no VS Code:**
   O VS Code detectará automaticamente o soquete do seu `ssh-agent` no host através da variável `SSH_AUTH_SOCK` e fará o redirecionamento perfeito para dentro do container!

---

### 🪟 No Windows (Na sua máquina local)

Se você utiliza Windows com OpenSSH, o serviço do agente SSH costuma vir desativado por padrão.

1. **Abra o PowerShell como Administrador** no seu Windows.
2. Ative e inicie o serviço do Agente SSH:
   ```powershell
   # Configura o serviço para iniciar automaticamente
   Get-Service ssh-agent | Set-Service -StartupType Automatic

   # Inicia o serviço
   Start-Service ssh-agent
   ```
3. Adicione sua chave SSH privada ao agente local:
   ```powershell
   ssh-add $env:USERPROFILE\.ssh\id_ed25519
   ```
   *(Substitua pelo nome correspondente da sua chave, como `id_rsa` se necessário).*

4. Reinicie o VS Code e reconecte ao seu Dev Container.

---

## 🔌 Método Alternativo: Trocar para HTTPS + Personal Access Token (PAT)

Se você preferir não configurar o SSH Agent ou estiver enfrentando problemas de permissões no Windows/macOS, você pode alternar o repositório remoto para usar **HTTPS** em vez de SSH:

1. **Gere um Token de Acesso Pessoal (Classic ou Fine-grained) no GitHub:**
   * Vá em *GitHub > Settings > Developer Settings > Personal Access Tokens*.
   * Garanta que o token tenha a permissão `repo` (para ler e escrever).

2. **Altere a URL do repositório remoto dentro do terminal do Dev Container:**
   ```bash
   git remote set-url origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   ```

3. **Realize o Push:**
   ```bash
   git push -u origin main
   ```
4. Quando o terminal solicitar seu **Username**, digite seu usuário do GitHub.
5. Quando solicitar **Password**, **não digite sua senha tradicional**, cole o **Token de Acesso Pessoal (PAT)** que você gerou no passo 1.

---

## 🔍 Como Testar se Funcionou?

Dentro do terminal do seu **Dev Container**, execute:
```bash
ssh -T git@github.com
```

* Se responder: `Hi username! You've successfully authenticated, but GitHub does not provide shell access.` -> **Sucesso absoluto!** Você já pode rodar `git push`.
