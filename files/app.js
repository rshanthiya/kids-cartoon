const KIDS_VIDEOS = [
  { title: 'Milo and the Moon', genre: 'Cartoon', duration: '12 min', badge: 'Kids' },
  { title: 'Little Jungle Adventures', genre: 'Animated', duration: '15 min', badge: 'Family' },
  { title: 'Sunny Bunny Show', genre: 'Comedy', duration: '10 min', badge: 'Funny' },
  { title: 'Rainbow Rockets', genre: 'Adventure', duration: '14 min', badge: 'New' },
  { title: 'Tiny Tunes', genre: 'Music', duration: '8 min', badge: 'Songs' },
  { title: 'Doodle Town', genre: 'Learning', duration: '11 min', badge: 'Creative' }
];

const PARENT_VIDEOS = [
  { title: 'World Documentary', genre: 'Documentary', duration: '42 min', badge: 'HD' },
  { title: 'City Stories', genre: 'Drama', duration: '51 min', badge: 'Top pick' },
  { title: 'Action Night', genre: 'Action', duration: '38 min', badge: 'Thriller' },
  { title: 'The Business Lens', genre: 'Business', duration: '29 min', badge: 'Insight' },
  { title: 'Culinary Escape', genre: 'Lifestyle', duration: '34 min', badge: 'Food' },
  { title: 'Deep Space', genre: 'Sci‑Fi', duration: '46 min', badge: 'Epic' }
];

const USERS_KEY = 'streamverse_users_v1';
const SESSION_KEY = 'streamverse_session_v1';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
}

function showMessage(text, type = 'error') {
  const box = document.getElementById('form-message');
  if (!box) return;
  box.textContent = text;
  box.className = `form-message ${type}`;
}

function getUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return getUsers().find((user) => String(user.email || '').trim().toLowerCase() === normalized);
}

function validatePasswordStrength(password) {
  return String(password || '').length >= 6;
}

function validateKidLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = String(form.email.value || '').trim();
  const password = String(form.password.value || '');

  const user = getUserByEmail(email);

  if (!user || user.role !== 'kid') {
    showMessage('Unauthorized: this account is not registered as a kid user.', 'error');
    return;
  }

  if (user.password !== password) {
    showMessage('Invalid password for this kid account.', 'error');
    return;
  }

  setCurrentUser(user);
  window.location.href = '/kids.html';
}

function validateParentLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = String(form.email.value || '').trim();
  const password = String(form.password.value || '');

  const user = getUserByEmail(email);

  if (!user || user.role !== 'parent') {
    showMessage('Unauthorized: this account is not registered as a parent user.', 'error');
    return;
  }

  if (Number(user.age) < 18) {
    showMessage('Parent access is restricted to users aged 18 or above.', 'error');
    return;
  }

  if (user.password !== password) {
    showMessage('Invalid password for this parent account.', 'error');
    return;
  }

  setCurrentUser(user);
  window.location.href = '/parent.html';
}

function validateRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const role = String(form.role.value || '').trim().toLowerCase();
  const name = String(form.name.value || '').trim();
  const email = String(form.email.value || '').trim();
  const age = Number(form.age.value);
  const password = String(form.password.value || '');
  const confirmPassword = String(form.confirmPassword.value || '');

  if (!['kid', 'parent'].includes(role)) {
    showMessage('Please choose a valid role.', 'error');
    return;
  }

  if (!name || !email || !Number.isFinite(age)) {
    showMessage('Please fill in all registration fields correctly.', 'error');
    return;
  }

  if (role === 'kid' && (age < 1 || age > 17)) {
    showMessage('Kid accounts must be under 18 years old.', 'error');
    return;
  }

  if (role === 'parent' && age < 18) {
    showMessage('Parent access requires age 18 or above.', 'error');
    return;
  }

  if (!validatePasswordStrength(password)) {
    showMessage('Password must be at least 6 characters long.', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match.', 'error');
    return;
  }

  const users = getUsers();
  if (users.some((user) => String(user.email || '').trim().toLowerCase() === email.toLowerCase())) {
    showMessage('This email is already registered. Please log in instead.', 'error');
    return;
  }

  const newUser = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    name,
    email,
    age,
    password
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);

  window.location.href = role === 'kid' ? '/kids.html' : '/parent.html';
}

function initSelectorPage() {
  const kidsBtn = document.getElementById('select-kids');
  const parentBtn = document.getElementById('select-parent');

  if (kidsBtn) {
    kidsBtn.addEventListener('click', () => {
      window.location.href = '/kids-login.html';
    });
  }

  if (parentBtn) {
    parentBtn.addEventListener('click', () => {
      window.location.href = '/parent-login.html';
    });
  }

  const registerBtn = document.getElementById('register-link');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      window.location.href = '/register.html';
    });
  }
}

function bindRegisterLink() {
  const registerBtn = document.getElementById('register-link');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      window.location.href = '/register.html';
    });
  }
}

function renderCards(list, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = list.map((video) => `
    <article class="video-card">
      <div class="thumbnail">
        <span>${video.badge}</span>
      </div>
      <div class="video-body">
        <h3>${video.title}</h3>
        <div class="meta-row">
          <span>${video.genre}</span>
          <span>${video.duration}</span>
        </div>
      </div>
    </article>
  `).join('');
}

function loadUserPage() {
  const page = document.body.dataset.page;
  const user = getCurrentUser();

  if (!user) {
    window.location.href = '/index.html';
    return;
  }

  const userName = document.getElementById('welcome-name');
  if (userName) {
    userName.textContent = `Welcome, ${user.name || (user.role === 'parent' ? 'Parent' : 'Kid')}`;
  }

  if (page === 'kids' && user.role !== 'kid') {
    window.location.href = '/index.html';
    return;
  }

  if (page === 'parent' && (user.role !== 'parent' || Number(user.age) < 18)) {
    window.location.href = '/index.html';
    return;
  }

  const videosToRender = page === 'kids' ? KIDS_VIDEOS : PARENT_VIDEOS;
  renderCards(videosToRender, 'video-list');

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearCurrentUser();
      window.location.href = '/index.html';
    });
  }
}

function initAuthPage() {
  const kidsForm = document.getElementById('kids-form');
  const parentForm = document.getElementById('parent-form');

  bindRegisterLink();

  if (kidsForm) kidsForm.addEventListener('submit', validateKidLogin);
  if (parentForm) parentForm.addEventListener('submit', validateParentLogin);
}

function initRegisterPage() {
  const form = document.getElementById('register-form');
  if (form) {
    form.addEventListener('submit', validateRegister);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'login-kid') {
    initAuthPage();
    return;
  }

  if (page === 'login-parent') {
    initAuthPage();
    return;
  }

  if (page === 'register') {
    initRegisterPage();
    return;
  }

  if (page === 'kids' || page === 'parent') {
    loadUserPage();
    return;
  }

  initSelectorPage();
});


