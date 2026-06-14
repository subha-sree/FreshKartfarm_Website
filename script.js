let products = [

{
name:"Tomato",
price:40,
image:"Assests/Tomato.jpg"
},

{
name:"Beetroot",
price:50,
image:"Assests/beetroot.jpg"
},

{
name:"Brinjal",
price:35,
image:"Assests/Brinjal.webp"
}

];

let cart =
JSON.parse(
localStorage.getItem("cart")
) || [];

let orders =
JSON.parse(
localStorage.getItem("orders")
) || [];

function loadProducts(){

const container =
document.getElementById(
"productContainer"
);

if(!container)
return;

container.innerHTML="";

products.forEach((p,index)=>{

container.innerHTML+=`

<div class="col-md-4">

<div class="card product-card">

<img
src="${p.image}"
class="card-img-top">

<div class="card-body">

<h3>
${p.name}
</h3>

<p>
₹${p.price}/kg
</p>

<button
class="btn btn-success"
onclick="addToCart(${index})">

Add To Cart

</button>

</div>

</div>

</div>

`;

});

}

function addToCart(index){

cart.push(products[index]);

localStorage.setItem(
"cart",
JSON.stringify(cart)
);

alert(
"Added To Cart"
);

}

function loadCart(){

const box =
document.getElementById(
"cartItems"
);

if(!box)
return;

box.innerHTML="";

cart.forEach((item,i)=>{

box.innerHTML+=`

<div
class="card p-3 mb-3">

<h4>
${item.name}
</h4>

<p>
₹${item.price}
</p>

<button
class="btn btn-danger"
onclick="removeCart(${i})">

Remove

</button>

</div>

`;

});

}

function removeCart(i){

cart.splice(i,1);

localStorage.setItem(
"cart",
JSON.stringify(cart)
);

location.reload();

}

function checkout(){

orders=[...orders,...cart];

localStorage.setItem(
"orders",
JSON.stringify(orders)
);

cart=[];

localStorage.setItem(
"cart",
JSON.stringify(cart)
);

alert(
"Order Placed"
);

location.href=
"orders.html";

}

function loadOrders(){

const list=
document.getElementById(
"orders"
);

if(!list)
return;

orders.forEach(o=>{

list.innerHTML+=`

<li
class="list-group-item">

${o.name}
-
₹${o.price}

</li>

`;

});

}

document
.getElementById(
"loginForm"
)
?.addEventListener(
"submit",
function(e){

e.preventDefault();

let role=
document.getElementById(
"role"
).value;

if(role==="Customer")
location.href=
"customer.html";

else if(
role==="Farmer"
)
location.href=
"farmer.html";

else
location.href=
"admin.html";

}
);

function addProduct(){

let name=
prompt(
"Product Name"
);

let price=
prompt(
"Price"
);

products.push({

name,
price,
image:
"Assests/Tomato.jpg"

});

alert(
"Product Added"
);

}

loadProducts();
loadCart();
loadOrders();