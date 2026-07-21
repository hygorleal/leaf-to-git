document.getElementById('btn-save').addEventListener('click', () => {
  const token = document.getElementById('gh-token').value;
  const repo = document.getElementById('gh-repo').value;

  //save
  chrome.storage.local.set({ githubToken: token, githubRepo: repo }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Salvo com sucesso! ✔️';
    
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
});

//load saves
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['githubToken', 'githubRepo'], (data) => {
    if (data.githubToken) document.getElementById('gh-token').value = data.githubToken;
    if (data.githubRepo) document.getElementById('gh-repo').value = data.githubRepo;
  });
});