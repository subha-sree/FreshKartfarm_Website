const apiBase = '';
const cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('freshkartUser')) || null;
}

function saveCurrentUser(user) {
  localStorage.setItem('freshkartUser', JSON.stringify(user));
}

function showAlert(message) {
  window.alert(message);
}

async function fetchProducts() {
  try {
    const res = await fetch(`${apiBase}/api/products`);
    if (!res.ok) {
      throw new Error('Could not load products');
    }
    products = await res.json();
    loadProducts();
  } catch (error) {
    console.error(error);
  }
}

function loadProducts() {
  const container = document.getElementById('productContainer');
  if (!container) return;

  const searchText = document.getElementById('search')?.value?.toLowerCase() || '';
  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(searchText)
  );

  container.innerHTML = '';
  filtered.forEach((p, index) => {
    container.innerHTML += `
      <div class="col-md-4">
        <div class="card product-card">
          <img src="${p.image}" class="card-img-top" alt="${p.name}">
          <div class="card-body">
            <h3>${p.name}</h3>
            <p>₹${p.price}/kg</p>
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
    showAlert('Please login before adding items to cart.');
    window.location.href = 'login.html';
    return;
  }

  cart.push(products[index]);
  localStorage.setItem('cart', JSON.stringify(cart));
  showAlert('Added To Cart');
}

function loadCart() {
  const box = document.getElementById('cartItems');
  if (!box) return;

  box.innerHTML = '';
  if (cart.length === 0) {
    box.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  cart.forEach((item, i) => {
    box.innerHTML += `
      <div class="card p-3 mb-3">
        <h4>${item.name}</h4>
        <p>₹${item.price}</p>
        <button class="btn btn-danger" onclick="removeCart(${i})">Remove</button>
      </div>
    `;
  });
}

function removeCart(i) {
  cart.splice(i, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

async function checkout() {
  const user = getCurrentUser();
  if (!user) {
    showAlert('Please login before placing an order.');
    window.location.href = 'login.html';
    return;
  }
  if (cart.length === 0) {
    showAlert('Your cart is empty.');
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, items: cart })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Could not place order.');
    }

    localStorage.removeItem('cart');
    cart.length = 0;
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
    showAlert('Please login to view orders.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/orders?email=${encodeURIComponent(user.email)}`);
    if (!res.ok) {
      throw new Error('Could not load orders.');
    }

    const orders = await res.json();
    if (orders.length === 0) {
      list.innerHTML = '<li class="list-group-item">No orders yet.</li>';
      return;
    }

    list.innerHTML = '';
    orders.forEach(order => {
      const created = new Date(order.createdAt).toLocaleString();
      const itemsHtml = order.items.map(item => `<li>${item.name} - ₹${item.price}</li>`).join('');
      list.innerHTML += `
        <li class="list-group-item">
          <strong>Order #${order.id}</strong><br>
          <small>${created}</small>
          <ul class="mt-2">${itemsHtml}</ul>
        </li>
      `;
    });
  } catch (error) {
    console.error(error);
    list.innerHTML = '<li class="list-group-item">Unable to load orders.</li>';
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

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    saveCurrentUser(data);
    showAlert('Login successful.');
    window.location.href = 'products.html';
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

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Signup failed.');
    }

    showAlert('Registration successful. Please log in.');
    window.location.href = 'login.html';
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

function setupPage() {
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

  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', loadProducts);
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  const showPasswordInput = document.getElementById('showPassword');
  if (showPasswordInput) {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    showPasswordInput.addEventListener('change', () => {
      const type = showPasswordInput.checked ? 'text' : 'password';
      if (passwordInput) passwordInput.type = type;
      if (confirmPasswordInput) confirmPasswordInput.type = type;
    });
  }
}

setupPage();
