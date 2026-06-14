const LOCAL_API_HOST = 'http://localhost:4000';
const apiBase = window.location.protocol === 'file:' ? LOCAL_API_HOST : window.location.origin;
const AUTH_KEY = 'freshkartAuth';
const CART_KEY = 'freshkartCart';
let products = [];

if (window.location.protocol === 'file:') {
  const currentFile = window.location.pathname.split('/').pop();
  if (currentFile) {
    window.location.replace(`${LOCAL_API_HOST}/${currentFile}`);
  }
}

const sampleProducts = [
  { id: 1, name: 'Organic Tomatoes', price: 45, quantity: 120, image: 'Assests/Tomato.jpg', ownerName: 'Fresh Farm' },
  { id: 2, name: 'Fresh Beetroot', price: 55, quantity: 80, image: 'Assests/beetroot.jpg', ownerName: 'Green Leaf' },
  { id: 3, name: 'Purple Brinjal', price: 38, quantity: 60, image: 'Assests/Brinjal.webp', ownerName: 'Harvest Home' },
  { id: 4, name: 'Crisp Capsicum', price: 65, quantity: 70, image: 'Assests/Capci.jpg', ownerName: 'Garden Growers' },
  { id: 5, name: 'Bottle Gourd', price: 30, quantity: 90, image: 'Assests/bottle gourd.jpg', ownerName: 'Green Orchard' },
  { id: 6, name: 'Sweet Strawberries', price: 120, quantity: 30, image: 'Assests/Stawberry.jpg', ownerName: 'Berry Farm' },
  { id: 7, name: 'Pink Carrot', price: 48, quantity: 75, image: 'Assests/pink_carrot.jpg', ownerName: 'Root Harvest' }
];

function getAuth() {
  return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
}

function saveAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function getCurrentUser() {
  return getAuth()?.user || null;
}

function authHeaders() {
  const token = getAuth()?.token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function isProductInCart(productId) {
  return getCart().some(item => item.id === productId);
}

function showAlert(message) {
  window.alert(message);
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function fetchProducts() {
  try {
    const res = await fetch(`${apiBase}/api/products`);
    if (!res.ok) {
      throw new Error('Could not load products');
    }
    products = await res.json();
    if (!Array.isArray(products) || products.length === 0) {
      products = sampleProducts;
    }
    renderProducts();
    renderCustomerProducts();
  } catch (error) {
    console.error(error);
    showAlert(error.message);
    products = sampleProducts;
    renderProducts();
    renderCustomerProducts();
  }
}

function renderProducts() {
  const container = document.getElementById('productContainer');
  if (!container) return;

  const searchText = document.getElementById('search')?.value?.toLowerCase() || '';
  const filtered = products.filter(product => product.name.toLowerCase().includes(searchText));

  if (filtered.length === 0) {
    container.innerHTML = '<div class="col-12"><div class="alert alert-warning">No products match your search.</div></div>';
    return;
  }

  const cart = getCart();
  container.innerHTML = filtered.map(product => {
    const outOfStock = product.quantity <= 0;
    const user = getCurrentUser();
    const inCart = cart.some(item => item.id === product.id);
    const buttonLabel = !user ? 'Login / Signup' : outOfStock ? 'Out of Stock' : inCart ? 'Added' : 'Add To Cart';
    const buttonAction = !user ? `onclick="redirectToAuth(${product.id})"` : inCart || outOfStock ? '' : `onclick="addToCart(${product.id})"`;
    const buttonDisabled = outOfStock || inCart ? 'disabled' : '';
    const cardClick = !user ? `onclick="redirectToAuth(${product.id})" style="cursor:pointer;"` : '';
    const statusBadge = inCart ? '<span class="badge bg-secondary mb-2">In Cart</span>' : '';
    return `
      <div class="col-md-4">
        <div class="card product-card mb-4 h-100 shadow-sm" ${cardClick}>
          <img src="${product.image}" class="card-img-top" alt="${product.name}">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <h5 class="card-title mb-0">${product.name}</h5>
              <span class="badge bg-success">${product.ownerName || 'Marketplace'}</span>
            </div>
            ${statusBadge}
            <p class="card-text mb-2">₹${product.price}/kg</p>
            <p class="text-muted mb-3">Stock: ${product.quantity}</p>
            <button class="btn btn-success mt-auto" ${buttonDisabled} ${buttonAction}>
              ${buttonLabel}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCustomerProducts() {
  const container = document.getElementById('customerProductList');
  if (!container) return;

  if (!products.length) {
    container.innerHTML = '<div class="col-12"><div class="alert alert-info">Loading products...</div></div>';
    return;
  }

  const cart = getCart();
  container.innerHTML = products.map(product => {
    const outOfStock = product.quantity <= 0;
    const inCart = cart.some(item => item.id === product.id);
    const statusBadge = inCart ? '<span class="badge bg-secondary mb-2">In Cart</span>' : '';
    return `
      <div class="col-lg-4 col-md-6">
        <div class="card customer-product-card h-100 shadow-sm">
          <img src="${product.image}" class="card-img-top" alt="${product.name}">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="card-title mb-0">${product.name}</h5>
              <span class="badge badge-owner">${product.ownerName || 'Local'}</span>
            </div>
            ${statusBadge}
            <p class="text-muted mb-2">Farmer: ${product.ownerName || 'Marketplace'}</p>
            <p class="mb-2 fw-semibold">₹${product.price}/kg</p>
            <p class="mb-3 small text-secondary">Available: ${product.quantity}</p>
            <button class="btn btn-success mt-auto" ${outOfStock || inCart ? 'disabled' : ''} onclick="addToCart(${product.id})">
              ${outOfStock ? 'Out of Stock' : inCart ? 'Added' : 'Add To Cart'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function redirectToAuth(productId) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  if (user.role !== 'Customer') {
    window.location.href = 'login.html';
    return;
  }
  addToCart(productId);
}

function addToCart(productId) {
  const user = getCurrentUser();
  if (!user || user.role !== 'Customer') {
    showAlert('Please login as a customer to add items to cart.');
    window.location.href = 'login.html';
    return;
  }

  const product = products.find(item => item.id === productId);
  if (!product) {
    showAlert('Product not found.');
    return;
  }
  if (product.quantity <= 0) {
    showAlert('This product is currently out of stock.');
    return;
  }

  const cart = getCart();
  if (cart.some(item => item.id === product.id)) {
    showAlert('This product is already in your cart.');
    renderProducts();
    renderCustomerProducts();
    return;
  }

  cart.push({ ...product, cartQuantity: 1 });
  saveCart(cart);
  showAlert('Added to cart.');
  renderProducts();
  renderCustomerProducts();
}

function loadCart() {
  const box = document.getElementById('cartItems');
  if (!box) return;

  const cart = getCart();
  if (cart.length === 0) {
    box.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  box.innerHTML = cart.map((item, index) => `
    <div class="card p-3 mb-3">
      <h4>${item.name}</h4>
      <p>₹${item.price}</p>
      <button class="btn btn-danger" onclick="removeCart(${index})">Remove</button>
    </div>
  `).join('');
}

function removeCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  loadCart();
}

async function checkout() {
  const user = getCurrentUser();
  if (!user || user.role !== 'Customer') {
    showAlert('Please login as a customer to place an order.');
    window.location.href = 'login.html';
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    showAlert('Your cart is empty.');
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ items: cart })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not place order.');
    }

    localStorage.removeItem(CART_KEY);
    showAlert('Order placed successfully.');
    window.location.href = 'order.html';
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

async function loadOrders() {
  const list = document.getElementById('orders');
  if (!list) return;

  const user = getCurrentUser();
  if (!user) {
    list.innerHTML = '<li class="list-group-item">Please login to see orders.</li>';
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/orders`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not load orders.');
    }

    if (data.length === 0) {
      list.innerHTML = '<li class="list-group-item">No orders yet.</li>';
    } else {
      list.innerHTML = data.map(order => {
        const created = new Date(order.createdAt).toLocaleString();
        const itemsHtml = order.items.map(item => `<li>${item.name} - ₹${item.price}</li>`).join('');
        return `
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <strong>Order #${order.id}</strong><br>
                <small>${created}</small>
                ${user.role === 'Admin' ? `<div><small>Customer: ${order.email}</small></div>` : ''}
              </div>
            </div>
            <ul class="mt-2">${itemsHtml}</ul>
          </li>
        `;
      }).join('');
    }

    const orderCountElement = document.getElementById('orderCount');
    const orderCountSummaryElement = document.getElementById('orderCountSummary');
    if (orderCountElement) {
      orderCountElement.textContent = data.length;
    }
    if (orderCountSummaryElement) {
      orderCountSummaryElement.textContent = data.length;
    }
  } catch (error) {
    console.error(error);
    list.innerHTML = `<li class="list-group-item">${error.message}</li>`;
    const orderCountElement = document.getElementById('orderCount');
    if (orderCountElement) {
      orderCountElement.textContent = '0';
    }
    const orderCountSummaryElement = document.getElementById('orderCountSummary');
    if (orderCountSummaryElement) {
      orderCountSummaryElement.textContent = '0';
    }
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email')?.value?.trim();
  const password = document.getElementById('password')?.value;
  const role = document.getElementById('role')?.value;

  if (!email || !password || !role) {
    showAlert('Please enter email, password, and role.');
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data?.error || 'Login failed.');
    }

    saveAuth(data);
    showAlert('Login successful.');

    if (data.user.role === 'Customer') {
      window.location.href = 'customer.html';
    } else if (data.user.role === 'Admin') {
      window.location.href = 'admin.html';
    } else if (data.user.role === 'Farmer') {
      window.location.href = 'farmer.html';
    } else {
      window.location.href = 'products.html';
    }
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

async function handleSignup(event) {
  event.preventDefault();

  const name = document.getElementById('fullname')?.value?.trim();
  const email = document.getElementById('email')?.value?.trim();
  const phone = document.getElementById('phone')?.value?.trim();
  const address = document.getElementById('address')?.value?.trim();
  const role = document.getElementById('role')?.value;
  const password = document.getElementById('password')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;

  if (!name || !email || !role || !password || !confirmPassword) {
    showAlert('Please complete all required fields.');
    return;
  }
  if (password !== confirmPassword) {
    showAlert('Passwords do not match.');
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, address, role, password })
    });

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data?.error || 'Signup failed.');
    }

    if (data?.token && data?.user) {
      saveAuth(data);
      showAlert('Registration successful and logged in.');
      if (data.user.role === 'Customer') {
        window.location.href = 'customer.html';
      } else if (data.user.role === 'Admin') {
        window.location.href = 'admin.html';
      } else if (data.user.role === 'Farmer') {
        window.location.href = 'farmer.html';
      } else {
        window.location.href = 'products.html';
      }
      return;
    }

    showAlert('Registration successful. Please log in.');
    window.location.href = 'login.html';
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

function logout() {
  clearAuth();
  window.location.href = 'login.html';
}

function renderCustomerDashboard() {
  const user = getCurrentUser();
  if (!user || user.role !== 'Customer') {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('customerName').textContent = user.name;
  document.getElementById('customerEmail').textContent = user.email;
  document.getElementById('customerPhone').textContent = user.phone || 'Not provided';
  document.getElementById('customerAddress').textContent = user.address || 'Not provided';

  const cart = getCart();
  document.getElementById('cartCount').textContent = cart.length;
  document.getElementById('cartTotal').textContent = `₹${cart.reduce((sum, item) => sum + Number(item.price || 0), 0)}`;

  const cartList = document.getElementById('customerCartItems');
  if (cartList) {
    cartList.innerHTML = cart.length
      ? cart.map(item => `<li class="list-group-item">${item.name} - ₹${item.price}</li>`).join('')
      : '<li class="list-group-item">Your cart is empty.</li>';
  }
}

async function renderAdminDashboard() {
  const user = getCurrentUser();
  if (!user || user.role !== 'Admin') {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('adminName').textContent = user.name;
  document.getElementById('adminEmail').textContent = user.email;

  try {
    const res = await fetch(`${apiBase}/api/admin/metrics`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not load metrics.');
    }

    document.getElementById('adminCustomers').textContent = data.customers;
    document.getElementById('adminFarmers').textContent = data.farmers;
    document.getElementById('adminOrders').textContent = data.orders;
    document.getElementById('adminProducts').textContent = data.products;
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

async function renderFarmerDashboard() {
  const user = getCurrentUser();
  if (!user || user.role !== 'Farmer') {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('farmerName').textContent = user.name;
  document.getElementById('farmerEmail').textContent = user.email;

  try {
    const res = await fetch(`${apiBase}/api/farmer/metrics`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not load farmer metrics.');
    }

    document.getElementById('farmerProductsCount').textContent = data.products;
    document.getElementById('farmerStock').textContent = data.stock;
    document.getElementById('farmerOrdersCount').textContent = data.orders;
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }

  await fetchFarmerProducts();
  await fetchFarmerOrders();
}

async function fetchFarmerProducts() {
  const body = document.getElementById('farmerProductsTableBody');
  if (!body) return;

  try {
    const res = await fetch(`${apiBase}/api/products/mine`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not load farmer products.');
    }

    if (!Array.isArray(data) || data.length === 0) {
      body.innerHTML = '<tr><td colspan="5">No products found. Add your first product.</td></tr>';
      return;
    }

    body.innerHTML = data.map(product => `
      <tr>
        <td><img src="${product.image}" alt="${product.name}"></td>
        <td>${product.name}</td>
        <td>₹${product.price}</td>
        <td>${product.quantity}</td>
        <td>
          <button class="btn btn-warning btn-sm me-2" disabled>Edit</button>
          <button class="btn btn-danger btn-sm" disabled>Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error(error);
    body.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

async function fetchFarmerOrders() {
  const list = document.getElementById('farmerOrdersList');
  if (!list) return;

  try {
    const res = await fetch(`${apiBase}/api/orders/farmer`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not load farmer orders.');
    }

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<div class="list-group-item">No orders for your products yet.</div>';
      return;
    }

    list.innerHTML = data.map(order => {
      const created = new Date(order.createdAt).toLocaleString();
      const items = order.items.map(item => `<li>${item.name} - ₹${item.price} (${item.quantity || 1})</li>`).join('');
      return `
        <div class="list-group-item mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-1">Order #${order.id}</h5>
              <small>${created}</small>
            </div>
            <span class="badge bg-success">${order.items.length} items</span>
          </div>
          <p class="mb-1"><strong>Customer:</strong> ${order.email}</p>
          <ul>${items}</ul>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error(error);
    list.innerHTML = `<div class="list-group-item text-danger">${error.message}</div>`;
  }
}

async function addProduct(event) {
  event.preventDefault();
  const name = document.getElementById('productName')?.value.trim();
  const price = Number(document.getElementById('productPrice')?.value);
  const quantity = Number(document.getElementById('productQuantity')?.value);
  const image = document.getElementById('productImage')?.value.trim();

  if (!name || !price || !quantity || !image) {
    showAlert('Please provide name, price, quantity, and image.');
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/products`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, price, quantity, image })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not add product.');
    }

    showAlert('Product added successfully.');
    document.getElementById('addProductForm').reset();
    await fetchProducts();
    await renderAdminDashboard();
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

async function addFarmerProduct(event) {
  event.preventDefault();

  const name = document.getElementById('farmerProductName')?.value.trim();
  const price = Number(document.getElementById('farmerProductPrice')?.value);
  const quantity = Number(document.getElementById('farmerProductQuantity')?.value);
  const image = document.getElementById('farmerProductImage')?.value.trim();

  if (!name || !price || !quantity || !image) {
    showAlert('Please enter name, price, quantity, and image URL.');
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/products`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, price, quantity, image })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not add product.');
    }

    showAlert('Product added successfully.');
    document.getElementById('farmerProductForm').reset();
    await renderFarmerDashboard();
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

function setupPage() {
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', renderProducts);
  }

  const productContainer = document.getElementById('productContainer');
  if (productContainer) {
    fetchProducts();
  }

  const cartItems = document.getElementById('cartItems');
  if (cartItems) {
    loadCart();
  }

  const ordersList = document.getElementById('orders');
  if (ordersList) {
    loadOrders();
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  const logoutButtons = document.querySelectorAll('[data-logout]');
  logoutButtons.forEach(btn => btn.addEventListener('click', logout));

  const customerPage = document.getElementById('customerDashboard');
  if (customerPage) {
    renderCustomerDashboard();
    loadOrders();
    fetchProducts();
  }

  const adminPage = document.getElementById('adminDashboard');
  if (adminPage) {
    renderAdminDashboard();
    loadOrders();
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
      addProductForm.addEventListener('submit', addProduct);
    }
    setInterval(() => {
      renderAdminDashboard();
      loadOrders();
    }, 5000);
  }

  const farmerPage = document.getElementById('farmerDashboard');
  if (farmerPage) {
    const farmerProductForm = document.getElementById('farmerProductForm');
    if (farmerProductForm) {
      farmerProductForm.addEventListener('submit', addFarmerProduct);
    }
    renderFarmerDashboard();
  }
}

document.addEventListener('DOMContentLoaded', setupPage);
