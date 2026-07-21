//button
function injectButton() {
  if (document.getElementById('btn-github-sync')) return true;

  const btn = document.createElement('button');
  btn.id = 'btn-github-sync';
  btn.innerHTML = 'GitHub';
  btn.style.cssText = `
    position: fixed; top: 6px; right: 180px; z-index: 9999;
    background-color: #2da44e; color: white; border: 1px solid rgba(27,31,36,0.15);
    border-radius: 6px; padding: 5px 16px; font-size: 14px; font-weight: bold; cursor: pointer;
  `;

  btn.onclick = abrirInterfaceCommit;
  document.body.appendChild(btn);
  return true;
}

//modal logic
function abrirInterfaceCommit() {
  //check modal
  const oldModal = document.getElementById('gh-sync-modal');
  if (oldModal) oldModal.remove();

  // background
  const overlay = document.createElement('div');
  overlay.id = 'gh-sync-modal';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.5); z-index: 10000; display: flex;
    justify-content: center; align-items: center; font-family: Arial, sans-serif;
  `;

  //modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white; padding: 20px; border-radius: 8px; width: 370px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 15px;
  `;

  modal.innerHTML = `
    <h3 style="margin: 0; color: #24292f; border-bottom: 1px solid #eee; padding-bottom: 10px;">GitHub</h3>
    
    <div>
      <label style="font-size: 13px; font-weight: bold; color: #24292f; display:block; margin-bottom: 5px;">Branch:</label>
      <select id="gh-branch-select" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #d0d7de;">
        <option value="">Carregando branches...</option>
      </select>
    </div>

    <div id="gh-new-branch-container" style="display: none;">
      <label style="font-size: 13px; font-weight: bold; color: #24292f; display:block; margin-bottom: 5px;">Nome da nova branch:</label>
      <input type="text" id="gh-new-branch-name" placeholder="ex: feature/nova-secao" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #d0d7de; box-sizing: border-box;">
    </div>

    <div>
      <label style="font-size: 13px; font-weight: bold; color: #24292f; display:block; margin-bottom: 5px;">Mensagem de Commit (Para Push):</label>
      <textarea id="gh-commit-msg" rows="3" placeholder="commit message..." style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #d0d7de; box-sizing: border-box; resize: none;"></textarea>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 5px;">
      <button id="gh-btn-cancel" style="padding: 6px 12px; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; cursor: pointer;">Cancelar</button>
      <button id="gh-btn-pull" style="padding: 6px 12px; background: #0366d6; color: white; border: 1px solid rgba(27,31,36,0.15); border-radius: 6px; cursor: pointer; font-weight: bold;"> Pull (ZIP)</button>
      <button id="gh-btn-confirm" style="padding: 6px 12px; background: #2da44e; color: white; border: 1px solid rgba(27,31,36,0.15); border-radius: 6px; cursor: pointer; font-weight: bold;"> Push</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const select = document.getElementById('gh-branch-select');
  const newBranchContainer = document.getElementById('gh-new-branch-container');
  
  select.addEventListener('change', (e) => {
    newBranchContainer.style.display = e.target.value === '__new__' ? 'block' : 'none';
  });

  //kill
  document.getElementById('gh-btn-cancel').onclick = () => overlay.remove();

  //git pull
  document.getElementById('gh-btn-pull').onclick = () => {
    const branch = select.value;
    if (branch === '__new__' || !branch.trim()) {
      return alert("Selecione uma branch existente para fazer o Pull!");
    }
    overlay.innerHTML = `<h3 style="background: white; padding: 20px; border-radius: 8px;">Conectando ao GitHub para baixar a branch '${branch}'...</h3>`;
    chrome.runtime.sendMessage({ action: "pull_from_github", branch: branch });
    setTimeout(() => overlay.remove(), 2500);
  };

  //git push
  document.getElementById('gh-btn-confirm').onclick = () => {
    const isNew = select.value === '__new__';
    const branch = isNew ? document.getElementById('gh-new-branch-name').value : select.value;
    const message = document.getElementById('gh-commit-msg').value || `Overleaf Sync - ${new Date().toLocaleString('pt-BR')}`;

    if (!branch.trim()) return alert("O nome da branch não pode estar vazio!");

    overlay.innerHTML = `<h3 style="background: white; padding: 20px; border-radius: 8px;">Sincronizando... Verifique os alertas da página.</h3>`;
    chrome.runtime.sendMessage({ 
      action: "iniciar_sincronizacao", 
      branch: branch.trim(),
      criarNova: isNew,
      mensagem: message
    });
    setTimeout(() => overlay.remove(), 2500);
  };

  //branches
  chrome.runtime.sendMessage({ action: "get_branches" }, (response) => {
    if (response && response.branches) {
      select.innerHTML = response.branches.map(b => `<option value="${b}">${b}</option>`).join('');
      select.innerHTML += `<option value="__new__" style="font-weight: bold;">➕ Criar nova branch...</option>`;
    } else {
      select.innerHTML = `<option value="main">main</option><option value="__new__">➕ Criar nova branch...</option>`;
      console.error("Erro ao carregar branches: " + (response ? response.error : "Sem resposta"));
    }
  });
}

//loop 
const tryInject = setInterval(() => {
  if (injectButton()) clearInterval(tryInject);
}, 1500);