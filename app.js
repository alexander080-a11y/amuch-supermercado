const homeBtn = document.getElementById('homeBtn');
const showListBtn = document.getElementById('showListBtn');
const mainTitle = document.getElementById('mainTitle');
const productList = document.getElementById('productList');
const addBtn = document.getElementById('addBtn');
const productNameInput = document.getElementById('productName');
const productDateInput = document.getElementById('productDate');
const categorySelect = document.getElementById('categorySelect');
const newCategory = document.getElementById('newCategory');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
const productCount = document.getElementById('productCount');
const searchInput = document.getElementById('searchInput');
const statusBanner = document.getElementById('statusBanner');

let products = [];
let categories = [];

function setStatus(message, isError = false) {
  if (!statusBanner) return;
  statusBanner.style.display = 'block';
  statusBanner.style.background = isError
    ? 'linear-gradient(90deg,#fdd 0%,#fbb 100%)'
    : 'linear-gradient(90deg,#eef 0%,#ddf 100%)';
  statusBanner.textContent = message;
  if (!isError) {
    clearTimeout(window.__statusTimer);
    window.__statusTimer = setTimeout(() => {
      statusBanner.style.display = 'none';
    }, 3000);
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || response.statusText || 'Error de red');
  }
  return response.json();
}

async function loadCategories() {
  try {
    categories = await apiRequest('/api/categories');
  } catch (err) {
    console.error('loadCategories error', err);
    setStatus('No se pudieron cargar las categorías.', true);
    categories = [];
  }
  renderCategoryOptions();
}

function renderCategoryOptions() {
  if (!categorySelect) return;
  categorySelect.innerHTML = '<option value="">Todas las categorías</option>' +
    categories.map((category) => `<option value="${category}">${category}</option>`).join('');
}

async function loadProducts() {
  try {
    products = await apiRequest('/api/products');
  } catch (err) {
    console.error('loadProducts error', err);
    setStatus('No se pudieron cargar los productos.', true);
    products = [];
  }
  renderProducts(searchInput.value, categorySelect.value);
  updateCounter();
}

function updateCounter() {
  if (!productCount) return;
  productCount.textContent = products.length;
}

function getProductColor(dateStr) {
  const today = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return '#e74c3c';
  if (diffDays <= 7) return '#f39c12';
  return '#2ecc71';
}

function renderProducts(filter = '', categoryFilter = '') {
  if (!productList) return;
  productList.innerHTML = '';
  const filteredProducts = products.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesName && matchesCategory;
  });

  if (!filteredProducts.length) {
    productList.classList.add('hidden');
    return;
  }

  filteredProducts.forEach((product) => {
    const li = document.createElement('li');
    li.style.backgroundColor = getProductColor(product.date);
    li.innerHTML = `
      <div>
        <strong>${product.name}</strong>
        <small style="margin-left:8px;opacity:0.9">Vence: ${product.date}</small>
      </div>
    `;
    if (product.category) {
      const badge = document.createElement('div');
      badge.textContent = product.category;
      badge.style.fontSize = '12px';
      badge.style.marginLeft = '6px';
      badge.style.padding = '4px 8px';
      badge.style.background = 'rgba(255,255,255,0.6)';
      badge.style.borderRadius = '8px';
      badge.style.display = 'inline-block';
      li.appendChild(badge);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', async () => {
      try {
        await apiRequest(`/api/products/${product.id}`, { method: 'DELETE' });
        await loadProducts();
        setStatus('Producto eliminado.');
      } catch (err) {
        console.error('delete product error', err);
        setStatus('No se pudo eliminar el producto.', true);
      }
    });
    li.appendChild(deleteBtn);
    productList.appendChild(li);
  });
  productList.classList.remove('hidden');
}

async function createProduct() {
  const name = productNameInput.value.trim();
  const date = productDateInput.value;
  const category = categorySelect.value || null;

  if (!name || !date) {
    setStatus('Completa el nombre y la fecha.', true);
    return;
  }

  try {
    await apiRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify({ name, date, category }),
    });
    productNameInput.value = '';
    productDateInput.value = '';
    await loadProducts();
    setStatus('Producto agregado correctamente.');
  } catch (err) {
    console.error('createProduct error', err);
    setStatus('No se pudo guardar el producto.', true);
  }
}

async function createCategory() {
  const name = newCategory.value.trim();
  if (!name) {
    setStatus('Ingresa el nombre de la categoría.', true);
    return;
  }
  try {
    await apiRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    newCategory.value = '';
    await loadCategories();
    setStatus('Categoría agregada.');
  } catch (err) {
    console.error('createCategory error', err);
    setStatus(err.message.includes('ya existe') ? 'La categoría ya existe.' : 'No se pudo agregar la categoría.', true);
  }
}

async function deleteCategory() {
  const category = categorySelect.value;
  if (!category) {
    setStatus('Selecciona una categoría para eliminar.', true);
    return;
  }
  if (!confirm(`¿Eliminar la categoría "${category}"?`)) {
    return;
  }
  try {
    await apiRequest(`/api/categories/${encodeURIComponent(category)}`, { method: 'DELETE' });
    await loadCategories();
    setStatus('Categoría eliminada.');
  } catch (err) {
    console.error('deleteCategory error', err);
    setStatus('No se pudo eliminar la categoría.', true);
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('show');
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
  const themeToggle = document.getElementById('themeToggle');
  const alertDays = document.getElementById('alertDays');
  const overlayRange = document.getElementById('overlayRange');
  const fontRange = document.getElementById('fontRange');
  if (!themeToggle || !alertDays || !overlayRange || !fontRange) return;
  themeToggle.checked = settings.theme === 'dark';
  alertDays.value = settings.alertDays || '14';
  overlayRange.value = settings.overlayAlpha ?? 0.45;
  fontRange.value = settings.fontSize || 16;
  document.documentElement.style.setProperty('--overlay-alpha', overlayRange.value);
  document.documentElement.style.setProperty('--app-font-size', `${fontRange.value}px`);
}

function saveSettings() {
  const themeToggle = document.getElementById('themeToggle');
  const alertDays = document.getElementById('alertDays');
  const overlayRange = document.getElementById('overlayRange');
  const fontRange = document.getElementById('fontRange');
  if (!themeToggle || !alertDays || !overlayRange || !fontRange) return;
  const settings = {
    theme: themeToggle.checked ? 'dark' : 'light',
    alertDays: Number(alertDays.value),
    overlayAlpha: Number(overlayRange.value),
    fontSize: Number(fontRange.value),
  };
  localStorage.setItem('appSettings', JSON.stringify(settings));
  loadSettings();
}

function loadProfile() {
  const profile = JSON.parse(localStorage.getItem('appProfile') || '{}');
  const avatarUrl = document.getElementById('avatarUrl');
  const profileName = document.getElementById('profileName');
  const avatarPreview = document.getElementById('avatarPreview');
  if (!avatarUrl || !profileName || !avatarPreview) return;
  avatarUrl.value = profile.avatar || '';
  profileName.value = profile.name || '';
  avatarPreview.innerHTML = profile.avatar ? `<img src="${profile.avatar}" alt="avatar">` : '';
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.innerHTML = (profile.avatar ? `<span class="avatar"><img src="${profile.avatar}"></span>` : '') + (profile.name || 'Perfil');
  }
}

function saveProfile() {
  const avatarUrl = document.getElementById('avatarUrl');
  const profileName = document.getElementById('profileName');
  const avatarPreview = document.getElementById('avatarPreview');
  if (!avatarUrl || !profileName || !avatarPreview) return;
  const profile = {
    name: profileName.value.trim(),
    avatar: avatarPreview.querySelector('img') ? avatarPreview.querySelector('img').src : avatarUrl.value.trim(),
  };
  localStorage.setItem('appProfile', JSON.stringify(profile));
  loadProfile();
}

function wireModalButtons() {
  document.addEventListener('click', (event) => {
    const id = event.target.id;
    if (!id) return;
    if (id === 'configBtn') openModal('configModal');
    if (id === 'profileBtn') openModal('profileModal');
    if (id === 'closeConfig') closeModal('configModal');
    if (id === 'saveConfig') { saveSettings(); closeModal('configModal'); setStatus('Configuración guardada.'); }
    if (id === 'closeProfile') closeModal('profileModal');
    if (id === 'saveProfile') { saveProfile(); closeModal('profileModal'); setStatus('Perfil guardado.'); }
  });
}

async function initApp() {
  wireModalButtons();
  loadSettings();
  loadProfile();
  addBtn?.addEventListener('click', (event) => { event.preventDefault(); createProduct(); });
  addCategoryBtn?.addEventListener('click', (event) => { event.preventDefault(); createCategory(); });
  deleteCategoryBtn?.addEventListener('click', (event) => { event.preventDefault(); deleteCategory(); });
  showListBtn?.addEventListener('click', () => {
    if (productList) productList.classList.remove('hidden');
    if (mainTitle) mainTitle.textContent = 'Lista de Productos';
    renderProducts(searchInput.value, categorySelect.value);
  });
  homeBtn?.addEventListener('click', () => {
    if (productList) productList.classList.add('hidden');
    if (mainTitle) mainTitle.textContent = 'Bienvenido al Control de Productos';
  });
  searchInput?.addEventListener('input', () => renderProducts(searchInput.value, categorySelect.value));
  categorySelect?.addEventListener('change', () => renderProducts(searchInput.value, categorySelect.value));
  await loadCategories();
  await loadProducts();
}

window.addEventListener('DOMContentLoaded', initApp);
