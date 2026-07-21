importScripts('jszip.min.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // 1. Retorna a lista de branches para o Modal
  if (request.action === "get_branches") {
    chrome.storage.local.get(['githubToken', 'githubRepo'], async (data) => {
      if (!data.githubToken || !data.githubRepo) {
        sendResponse({ error: "Token/Repo não configurados no popup." });
        return;
      }
      const repoLimpo = data.githubRepo.replace(/https?:\/\/github\.com\//, '').trim();
      try {
        const res = await fetch(`https://api.github.com/repos/${repoLimpo}/branches`, {
          headers: { "Authorization": `token ${data.githubToken}`, "Accept": "application/vnd.github.v3+json" }
        });
        if (!res.ok) throw new Error("Repositório não encontrado ou sem permissão.");
        const branches = await res.json();
        sendResponse({ branches: branches.map(b => b.name) });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    });
    return true; 
  }

  // 2. Fazer PULL do GitHub
  if (request.action === "pull_from_github") {
    chrome.storage.local.get(['githubToken', 'githubRepo'], async (data) => {
      try {
        const repoLimpo = data.githubRepo.replace(/https?:\/\/github\.com\//, '').trim();
        enviarMensagemParaAba(sender.tab.id, `Baixando o código da branch '${request.branch}'...`);

        const zipUrl = `https://api.github.com/repos/${repoLimpo}/zipball/${request.branch}`;
        const res = await fetch(zipUrl, {
          headers: { "Authorization": `token ${data.githubToken}` }
        });

        if (!res.ok) throw new Error("Falha ao baixar o arquivo do GitHub. Verifique a branch e as permissões.");
        const blob = await res.blob();

        const reader = new FileReader();
        reader.onloadend = () => {
          chrome.downloads.download({
            url: reader.result,
            filename: `${repoLimpo.replace('/', '-')}-${request.branch}.zip`,
            saveAs: true 
          });
          enviarMensagemParaAba(sender.tab.id, "✅ Pull concluído!\n\nAgora use o botão 'Upload' do Overleaf para substituir os arquivos atuais por este ZIP.");
        };
        reader.readAsDataURL(blob);

      } catch (error) {
        console.error(error);
        enviarMensagemParaAba(sender.tab.id, `❌ Erro no Pull: ${error.message}`);
      }
    });
  }

  // 3. Fazer PUSH para o GitHub
  if (request.action === "iniciar_sincronizacao") {
    const url = sender.tab.url;
    const projectId = url.split('/project/')[1].split('?')[0].split('#')[0]; 

    chrome.storage.local.get(['githubToken', 'githubRepo'], async (data) => {
      try {
        const repoLimpo = data.githubRepo.replace(/https?:\/\/github\.com\//, '').trim();
        
        enviarMensagemParaAba(sender.tab.id, "1/4 Baixando projeto do Overleaf...");
        const zipUrl = `https://www.overleaf.com/project/${projectId}/download/zip`;
        const response = await fetch(zipUrl);
        if (!response.ok) throw new Error("Falha ao baixar o ZIP do Overleaf");
        const blob = await response.blob();

        enviarMensagemParaAba(sender.tab.id, "2/4 Extraindo arquivos...");
        const jszip = new JSZip();
        const zip = await jszip.loadAsync(blob);
        
        const arquivos = [];
        for (const [filename, fileData] of Object.entries(zip.files)) {
          if (!fileData.dir) {
            const base64Content = await fileData.async("base64");
            arquivos.push({ path: filename, content: base64Content });
          }
        }

        enviarMensagemParaAba(sender.tab.id, `3/4 Enviando para o GitHub (Branch: ${request.branch})...`);
        await enviarParaGitHub(arquivos, data.githubToken, repoLimpo, request.branch, request.criarNova, request.mensagem);

        enviarMensagemParaAba(sender.tab.id, "✅ Sucesso! Código sincronizado no GitHub!");
      } catch (error) {
        console.error(error);
        enviarMensagemParaAba(sender.tab.id, `❌ Erro: ${error.message}`);
      }
    });
  }
});

function enviarMensagemParaAba(tabId, mensagem) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (msg) => alert(msg),
    args: [mensagem]
  }).catch(() => {});
}

async function enviarParaGitHub(arquivos, token, repo, branch, criarNova, commitMessage) {
  const headers = {
    "Authorization": `token ${token}`,
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
  };
  const baseUrl = `https://api.github.com/repos/${repo}`;

  if (criarNova) {
    let baseRes = await fetch(`${baseUrl}/git/refs/heads/main`, { headers });
    if (!baseRes.ok) baseRes = await fetch(`${baseUrl}/git/refs/heads/master`, { headers });
    if (!baseRes.ok) throw new Error("Não foi possível encontrar a branch base (main/master) para ramificar.");
    
    const baseData = await baseRes.json();
    const baseSha = baseData.object.sha;

    const createRes = await fetch(`${baseUrl}/git/refs`, {
      method: "POST", headers,
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha })
    });
    if (!createRes.ok) throw new Error("Falha ao criar a nova branch no GitHub.");
  }

  const refRes = await fetch(`${baseUrl}/git/refs/heads/${branch}`, { headers });
  if (!refRes.ok) throw new Error(`Branch '${branch}' não encontrada.`);
  const refData = await refRes.json();
  const latestCommitSha = refData.object.sha;

  const commitRes = await fetch(`${baseUrl}/git/commits/${latestCommitSha}`, { headers });
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  const treeItems = [];
  for (const arquivo of arquivos) {
    const blobRes = await fetch(`${baseUrl}/git/blobs`, {
      method: "POST", headers,
      body: JSON.stringify({ content: arquivo.content, encoding: "base64" })
    });
    const blobData = await blobRes.json();
    treeItems.push({ path: arquivo.path, mode: "100644", type: "blob", sha: blobData.sha });
  }

  const newTreeRes = await fetch(`${baseUrl}/git/trees`, {
    method: "POST", headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
  });
  const newTreeData = await newTreeRes.json();
  const newTreeSha = newTreeData.sha;

  const newCommitRes = await fetch(`${baseUrl}/git/commits`, {
    method: "POST", headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: newTreeSha,
      parents: [latestCommitSha]
    })
  });
  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
    method: "PATCH", headers,
    body: JSON.stringify({ sha: newCommitSha })
  });
}