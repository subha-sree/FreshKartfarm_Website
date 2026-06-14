const apiBase = '';
const authKey = 'freshkartAuth';
const cartKey = 'freshkartCart';
let products = [];

function getAuth() {
  return JSON.parse(localStorage.getItem(authKey) || 'null');
}

function saveAuth(auth) {
  localStorage.setItem(authKey, JSON.stringify(auth));
}

function clearAuth() {
  localStorage.removeItem(authKey);
}

function getToken() {
  return getAuth()?.token || null;
}

function getCurrentUser() {
  return getAuth()?.user || null;
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function fetchProducts() {
  try {
    const res = await fetch(`${apiBase}/api/products`);
    products = await res.json();
    renderProducts();
  } catch (error) {
    console.error('Product load failed', error);
  }
}

function renderProducts() {
  const container = document.getElementById('productContainer');
  if (!container) return;

  const searchText = document.getElementById('search')?.value.toLowerCase() || '';
  const list = products.filter(product => product.name.toLowerCase().includes(searchText));

  container.innerHTML = '';
  list.forEach((product, index) => {
    container.innerHTML += `
      <div class="col-md-4">
        <div class="card product-card mb-4">
          <img src="${product.image}" class="card-img-top" alt="${product.name}">
          <div class="card-body">
            <h3>${product.name}</h3>
            <p>₹${product.price}/kg</p>
            <button class="btn btn-success" onclick="addToCart(${index})">Add To Cart</button>
          </div>
        </div>
      </div>
    `;
  });
}

function addToCart(index) {
  const user = getCurrentUser();
  if (!user) {
    alert('Please login before adding items to cart.');
    window.location.href = 'login.html';
    return;
  }

  const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
  cart.push(products[index]);
  localStorage.setItem(cartKey, JSON.stringify(cart));
  alert('Added to cart.');
}

function loadCartItems() {
  const box = document.getElementById('cartItems');
  if (!box) return;

  const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
  if (cart.length === 0) {
    box.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  box.innerHTML = '';
  cart.forEach((item, i) => {
    box.innerHTML += `
      <div class="card p-3 mb-3">
        <h4>${item.name}</h4>
        <p>₹${item.price}</p>
        <button class="btn btn-danger" onclick="removeFromCart(${i})">Remove</button>
      </div>
    `;
  });
}

function removeFromCart(index) {
  const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
  cart.splice(index, 1);
  localStorage.setItem(cartKey, JSON.stringify(cart));
  loadCartItems();
}

async function checkout() {
  const user = getCurrentUser();
  if (!user || user.role !== 'Customer') {
    alert('Please login as a customer to place an order.');
    window.location.href = 'login.html';
    return;
  }

  const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
  if (cart.length === 0) {
    alert('Your cart is empty.');
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

    localStorage.removeItem(cartKey);
    alert('Order placed successfully.');
    window.location.href = 'order.html';
  } catch (error) {
    console.error(error);
    alert(error.message);
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
    const res = await fetch(`${apiBase}/api/orders`, {
      headers: authHeaders()
    });
    const orders = await res.json();
    if (!res.ok) {
      throw new Error(orders.error || 'Could not load orders.');
    }

    if (orders.length === 0) {
      list.innerHTML = '<li class="list-group-item">No orders yet.</li>';
      return;
    }

    list.innerHTML = orders.map(order => {
      const createdAt = new Date(order.createdAt).toLocaleString();
      const itemsHtml = order.items.map(item => `<li>${item.name} - ₹${item.price}</li>`).join('');
      return `
        <li class="list-group-item">
          <div class="d-flex justify-content-between">
            <strong>Order #${order.id}</strong>
            <small>${createdAt}</small>
          </div>
          ${user.role === 'Admin' ? `<div><small>Customer: ${order.email}</small></div>` : ''}
          <ul class="mt-2">${itemsHtml}</ul>
        </li>
      `;
    }).join('');
  } catch (error) {
    console.error(error);
    list.innerHTML = `<li class="list-group-item">${error.message}</li>`;
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const role = document.getElementById('role')?.value;

  if (!email || !password || !role) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    saveAuth(data);
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
    alert(error.message);
  }
}

async function handleSignup(event) {
  event.preventDefault();

  const name = document.getElementById('fullname')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const phone = document.getElementById('phone')?.value.trim();
  const address = document.getElementById('address')?.value.trim();
  const role = document.getElementById('role')?.value;
  const password = document.getElementById('password')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;

  if (!name || !email || !role || !password || !confirmPassword) {
    alert('Please complete all required fields.');
    return;
  }
  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, address, role, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Signup failed.');
    }

    alert('Registration successful. Please log in.');
    window.location.href = 'login.html';
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

function logout() {
  clearAuth();
  window.location.href = 'login.html';
}

function loadCustomerDashboard() {
  const user = getCurrentUser();
  if (!user || user.role !== 'Customer') {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('customerName').textContent = user.name;
  document.getElementById('customerEmail').textContent = user.email;
  document.getElementById('customerPhone').textContent = user.phone || 'Not provided';
  document.getElementById('customerAddress').textContent = user.address || 'Not provided';

  const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
  document.getElementById('cartCount').textContent = cart.length;
  document.getElementById('cartTotal').textContent = `₹${cart.reduce((sum, item) => sum + Number(item.price || 0), 0)}`;
  const cartList = document.getElementById('customerCartItems');
  if (cartList) {
    cartList.innerHTML = cart.length
      ? cart.map(item => `<li class="list-group-item">${item.name} - ₹${item.price}</li>`).join('')
      : '<li class="list-group-item">Your cart is empty.</li>';
  }

  loadOrders();
}

async function loadAdminDashboard() {
  const user = getCurrentUser();
  if (!user || user.role !== 'Admin') {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('adminName').textContent = user.name;
  document.getElementById('adminEmail').textContent = user.email;

  try {
    const res = await fetch(`${apiBase}/api/admin/metrics`, {
      headers: authHeaders()
    });
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
    alert(error.message);
  }

  await loadOrders();
}

async function addProduct(event) {
  event.preventDefault();
  const name = document.getElementById('productName')?.value.trim();
  const price = Number(document.getElementById('productPrice')?.value);
  const image = document.getElementById('productImage')?.value.trim();

  if (!name || !price || !image) {
    alert('Please fill in all product fields.');
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/products`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, price, image })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not add product.');
    }

    alert('Product added successfully.');
    document.getElementById('addProductForm').reset();
    loadAdminDashboard();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

function setupPage() {
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', renderProducts);
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

  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.addEventListener('submit', addProduct);
  }

  const productContainer = document.getElementById('productContainer');
  if (productContainer) {
    fetchProducts();
  }

  const cartItems = document.getElementById('cartItems');
  if (cartItems) {
    loadCartItems();
  }

  const ordersList = document.getElementById('orders');
  if (ordersList) {
    loadOrders();
  }

  if (document.getElementById('customerDashboard')) {
    loadCustomerDashboard();
  }

  if (document.getElementById('adminDashboard')) {
    loadAdminDashboard();
    setInterval(loadAdminDashboard, 8000);
  }
}

document.addEventListener('DOMContentLoaded', setupPage);