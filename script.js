// ================= ডাটাবেস ও ইনিশিয়ালাইজেশন =================
let products = JSON.parse(localStorage.getItem('luvella_products')) || [];
let cart = JSON.parse(localStorage.getItem('luvella_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('luvella_wishlist')) || [];

// অ্যাডমিন প্যানেলের গোপন পাসওয়ার্ড/পিন (আপনি চাইলে এটি পরিবর্তন করতে পারেন)
const ADMIN_PIN = "1234";

// পেজ লোড হলে সবকিছু চালু হবে
document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
    updateCounters();
});

// ================= প্রোডাক্ট ডিসপ্লে ফাংশন =================
function renderProducts(productList) {
    const grid = document.getElementById('productGrid');
    const countLabel = document.getElementById('totalProductCount');
    
    countLabel.innerText = `${productList.length}টি প্রোডাক্ট`;
    grid.innerHTML = '';

    if (productList.length === 0) {
        grid.innerHTML = `<div class="empty-state">এখনো কোনো প্রোডাক্ট পাওয়া যায়নি।</div>`;
        return;
    }

    productList.forEach(product => {
        const isWished = wishlist.some(item => item.id === product.id);
        const heartIcon = isWished ? 'fa-solid fa-heart' : 'fa-regular fa-heart';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="prod-img-wrap">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placeholder.com'">
                <button class="wish-icon-btn" onclick="toggleWishlist(${product.id})" title="উইশলিস্টে রাখুন">
                    <i class="${heartIcon}"></i>
                </button>
            </div>
            <div class="prod-info">
                <span class="prod-cat">${product.category}</span>
                <h3 class="prod-title">${product.name}</h3>
                <div class="prod-price-row">
                    <span class="current-price">${product.price}৳</span>
                    ${product.oldPrice ? `<span class="old-price">${product.oldPrice}৳</span>` : ''}
                </div>
                <div class="prod-actions">
                    <button class="btn-add-cart" onclick="addToCart(${product.id})">
                        <i class="fa-solid fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn-order-now" onclick="orderNow(${product.id})">
                        Order Now
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ================= ক্যাটাগরি ফিল্টার ও সার্চ =================
function filterCategory(category, btnElement = null) {
    if (btnElement) {
        document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const titleEl = document.getElementById('sectionTitle');
    if (category === 'all') {
        titleEl.innerText = 'আমাদের সেরা কালেকশন';
        renderProducts(products);
    } else {
        titleEl.innerText = category;
        const filtered = products.filter(p => p.category === category);
        renderProducts(filtered);
    }
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    document.getElementById('clearSearchBtn').style.display = query.length > 0 ? 'flex' : 'none';

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
    );
    document.getElementById('sectionTitle').innerText = query ? `সার্চ ফলাফল: "${query}"` : 'আমাদের সেরা কালেকশন';
    renderProducts(filtered);
}

// ================= কার্ট (Add to Cart & Order Now) =================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveAndRefresh();
    alert(`"${product.name}" আপনার শপিং ব্যাগে যোগ হয়েছে!`);
}

function orderNow(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (!existingItem) {
        cart.push({ ...product, qty: 1 });
        saveAndRefresh();
    }
    openModal('cartModal');
}

function updateCartQty(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += change;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    saveAndRefresh();
    renderCartModal();
}

function renderCartModal() {
    const container = document.getElementById('cartItemsContainer');
    const summary = document.getElementById('cartSummary');
    const totalEl = document.getElementById('cartTotalAmount');

    if (cart.length === 0) {
        container.innerHTML = `<p class="empty-msg" style="text-align:center; padding:20px; color:#7a666e;">আপনার শপিং ব্যাগটি বর্তমানে খালি।</p>`;
        summary.style.display = 'none';
        return;
    }

    summary.style.display = 'block';
    container.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        container.innerHTML += `
            <div class="cart-item-row">
                <div style="flex:1;">
                    <strong>${item.name}</strong><br>
                    <small>${item.price}৳ x ${item.qty} = ${itemTotal}৳</small>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <button onclick="updateCartQty(${item.id}, -1)" style="padding:2px 8px; cursor:pointer;">-</button>
                    <span>${item.qty}</span>
                    <button onclick="updateCartQty(${item.id}, 1)" style="padding:2px 8px; cursor:pointer;">+</button>
                </div>
            </div>
        `;
    });

    totalEl.innerText = `${total}৳`;
}
// ================= হোয়াটসঅ্যাপ অর্ডার ও ট্র্যাকিং =================
function checkoutViaWhatsApp() {
    if (cart.length === 0) return;

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const waNumber = document.getElementById('orderWhatsAppNumber').value;

    if (!name || !phone || !address) {
        alert("দয়া করে আপনার নাম, মোবাইল নাম্বার এবং সম্পূর্ণ ঠিকানা পূরণ করুন।");
        return;
    }

    let orderDetails = `*নতুন অর্ডার - Luvella AVENUE*\n`;
    orderDetails += `----------------------------\n`;
    orderDetails += `👤 *নাম:* ${name}\n`;
    orderDetails += `📞 *মোবাইল:* ${phone}\n`;
    orderDetails += `📍 *ঠিকানা:* ${address}\n`;
    orderDetails += `----------------------------\n`;
    orderDetails += `🛍️ *অর্ডারকৃত প্রোডাক্টসমূহ:*\n`;

    let grandTotal = 0;
    cart.forEach((item, index) => {
        const sub = item.price * item.qty;
        grandTotal += sub;
        orderDetails += `${index + 1}. ${item.name} (${item.qty}টি) - ${sub}৳\n`;
    });

    orderDetails += `----------------------------\n`;
    orderDetails += `💰 *সর্বমোট বিল:* ${grandTotal}৳\n`;
    orderDetails += `🚚 *পেমেন্ট:* ক্যাশ অন ডেলিভারি`;

    const encodedMsg = encodeURIComponent(orderDetails);
    const whatsappUrl = `https://wa.me{waNumber}?text=${encodedMsg}`;

    // অর্ডার পাঠানোর পর কার্ট খালি করা
    cart = [];
    saveAndRefresh();
    closeModal('cartModal');

    window.open(whatsappUrl, '_blank');
}

function trackOrderWhatsApp() {
    const info = document.getElementById('trackInput').value.trim();
    if (!info) {
        alert("দয়া করে আপনার অর্ডার আইডি বা মোবাইল নাম্বার লিখুন।");
        return;
    }
    const msg = encodeURIComponent(`আসসালামু আলাইকুম, আমি আমার অর্ডারটি ট্র্যাক করতে চাই।\nতথ্য: ${info}`);
    window.open(`https://wa.me{msg}`, '_blank');
}

// ================= উইশলিস্ট (Wishlist) =================
function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const index = wishlist.findIndex(item => item.id === productId);
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(product);
    }

    saveAndRefresh();
    renderProducts(products);
}

function renderWishlistModal() {
    const container = document.getElementById('wishlistItemsContainer');
    if (wishlist.length === 0) {
        container.innerHTML = `<p class="empty-msg" style="text-align:center; padding:20px; color:#7a666e;">উইশলিস্টে কোনো প্রোডাক্ট নেই।</p>`;
        return;
    }

    container.innerHTML = '';
    wishlist.forEach(item => {
        container.innerHTML += `
            <div class="cart-item-row">
                <div>
                    <strong>${item.name}</strong><br>
                    <small style="color:#8c274c; font-weight:bold;">${item.price}৳</small>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="btn-order-now" style="padding:5px 10px;" onclick="addToCart(${item.id}); closeModal('wishlistModal');">কিনুন</button>
                    <button class="delete-btn" onclick="toggleWishlist(${item.id}); renderWishlistModal();">বাদ দিন</button>
                </div>
            </div>
        `;
    });
}

// ================= অ্যাডমিন প্যানেল (প্রোডাক্ট যোগ ও মুছে ফেলা) =================
function openAdminPanel() {
    const pin = prompt("অ্যাডমিন পিন দিন (ডিফল্ট পিন: 1234):");
    if (pin === ADMIN_PIN) {
        renderAdminProducts();
        openModal('adminModal');
    } else if (pin !== null) {
        alert("ভুল পিন দিয়েছেন!");
    }
}

function addNewProduct(event) {
    event.preventDefault();

    const name = document.getElementById('prodName').value.trim();
    const price = Number(document.getElementById('prodPrice').value);
    const oldPrice = document.getElementById('prodOldPrice').value ? Number(document.getElementById('prodOldPrice').value) : null;
    const category = document.getElementById('prodCategory').value;
    const image = document.getElementById('prodImage').value.trim();

    const newProduct = {
        id: Date.now(),
        name,
        price,
        oldPrice,
        category,
        image
    };

    products.unshift(newProduct);
    saveAndRefresh();
    renderProducts(products);
    renderAdminProducts();
    document.getElementById('addProductForm').reset();
    alert("নতুন প্রোডাক্ট সফলভাবে যুক্ত হয়েছে!");
}

function deleteProduct(productId) {
    if (confirm("আপনি কি নিশ্চিতভাবে এই প্রোডাক্টটি মুছে ফেলতে চান?")) {
        products = products.filter(p => p.id !== productId);
        cart = cart.filter(c => c.id !== productId);
        wishlist = wishlist.filter(w => w.id !== productId);
        saveAndRefresh();
        renderProducts(products);
        renderAdminProducts();
    }
}

function renderAdminProducts() {
    const list = document.getElementById('adminProductList');
    if (products.length === 0) {
        list.innerHTML = `<p style="font-size:13px; color:#7a666e;">কোনো প্রোডাক্ট যোগ করা নেই।</p>`;
        return;
    }

    list.innerHTML = '';
    products.forEach(p => {
        list.innerHTML += `
            <div class="admin-prod-item">
                <span><strong>${p.name}</strong> (${p.price}৳)</span>
                <button class="delete-btn" onclick="deleteProduct(${p.id})">মুছে ফেলুন</button>
            </div>
        `;
    });
}

// ================= হেল্পার ও মডাল কন্ট্রোল =================
function saveAndRefresh() {
    localStorage.setItem('luvella_products', JSON.stringify(products));
    localStorage.setItem('luvella_cart', JSON.stringify(cart));
    localStorage.setItem('luvella_wishlist', JSON.stringify(wishlist));
    updateCounters();
}

function updateCounters() {
    const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').innerText = totalCartItems;
    document.getElementById('wishlistCount').innerText = wishlist.length;
}

function openModal(modalId) {
    if (modalId === 'cartModal') renderCartModal();
    if (modalId === 'wishlistModal') renderWishlistModal();
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function scrollToCategories() {
    document.querySelector('.category-section').scrollIntoView({ behavior: 'smooth' });
}

function scrollToProducts() {
    document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
}
// সার্চ মার্ক ক্লিয়ার করার ফাংশন
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    document.getElementById('sectionTitle').innerText = 'আমাদের সেরা কালেকশন';
    renderProducts(products);
}
