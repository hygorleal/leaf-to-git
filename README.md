# Leaf to Git

Uma extensão não-oficial para o Google Chrome que conecta seus projetos do Overleaf diretamente aos seus repositórios do GitHub. Faça backup, versione e sincronize seu código LaTeX sem precisar sair da tela do editor!

## Funcionalidades

*   **Push:** Envie seu código, imagens e PDFs do Overleaf direto para o seu repositório no GitHub.
*   **Pull Seguro:** Baixe o `.zip` atualizado de qualquer branch do seu repositório para restaurar ou atualizar seu projeto no Overleaf utilizando a função nativa de upload.
---

## Como Instalar

Como esta extensão não está publicada na Chrome Web Store, a instalação é feita manualmente:

1. Baixe o `.zip` deste repositório ou faça o clone para o seu computador.
2. Abra o Google Chrome e acesse `chrome://extensions/` (ou clique no ícone de quebra-cabeça > Gerenciar extensões).
3. No canto superior direito da tela, ative a chave **"Modo do desenvolvedor"**.
4. Clique no botão **"Carregar sem compactação"**.
5. Selecione a pasta onde você salvou os arquivos da extensão.
6. Pronto! A extensão aparecerá na sua lista e estará pronta para uso. Fixe o ícone na barra de tarefas para facilitar o acesso.

---

## Configuração Inicial

Para que a extensão tenha permissão de enviar arquivos para o seu repositório, você precisará gerar um Token de Acesso Pessoal (Personal Access Token) no GitHub:

1. Acesse o GitHub e vá em [Developer Settings > Personal Access Tokens (Tokens classic)](https://github.com/settings/tokens).
2. Clique em **Generate new token (classic)**.
3. Dê um nome para o token (ex: `Overleaf Sync`) e **marque a caixa `repo`** (Full control of private repositories).
4. Gere o token e **copie o código** gerado (ele geralmente começa com `ghp_...`).
5. No Chrome, clique no ícone da extensão ao lado da barra de endereços.
6. Cole o seu Token e digite o repositório de destino no formato `seu-usuario/nome-do-repositorio`.
7. Clique em **Salvar Configurações**.

---

## Como Usar

1. Abra qualquer projeto seu no [Overleaf](https://www.overleaf.com/).
2. Um botão verde **"GitHub"** aparecerá no canto superior direito do editor.
3. Clique nele para abrir o painel de sincronização.
4. **Para fazer Push:** Escolha a branch de destino (ou selecione a opção para criar uma nova), digite a mensagem do commit e clique em **Push**.
5. **Para fazer Pull:** Escolha a branch que deseja baixar e clique em **Pull (ZIP)**. O arquivo será baixado para o seu computador. Em seguida, basta usar o botão "Upload" do Overleaf para substituir os arquivos atuais do projeto.

---

## Observações e Limitações

*   **Repositório Inicializado:** O repositório de destino no GitHub **não pode estar totalmente vazio**. Ele precisa ter pelo menos um commit inicial (como um simples arquivo `README.md` criado na interface do GitHub) para que a extensão consiga localizar a branch base e criar o histórico de commits.
*   **Permissões:** A extensão requer acesso ao domínio do Overleaf e às APIs do GitHub (`api.github.com` e `codeload.github.com`).
*   **Isenção de Responsabilidade:** Este é um projeto de código aberto criado pela comunidade e não possui nenhum vínculo oficial com o Overleaf ou com o GitHub.
