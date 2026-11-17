// ================= ১. আপনার প্রোডাক্টের তালিকা =================
let products = [
    {
        id: "1",
        name: "Ladies Stylish Premium Hoodie",
        price: 549,
        oldPrice: 750,
        category: "স্পেশাল অফার",
        image: "images/hoodie.jpg"
    }
];

let cart = JSON.parse(localStorage.getItem('luvella_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('luvella_wishlist')) || [];

document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
    updateCounters();
});

// ================= ২. প্রোডাক্ট ডিসপ্লে ফাংশন =================
function renderProducts(productList) {
    const grid = document.getElementById('productGrid');
    const countLabel = document.getElementById('totalProductCount');
    if (!grid) return;

    if (countLabel) {
        countLabel.innerText = `${productList.length}টি প্রোডাক্ট`;
    }
    grid.innerHTML = '';

    if (productList.length === 0) {
        grid.innerHTML = `<div class="empty-state">এখনো কোনো প্রোডাক্ট পাওয়া যায়নি।</div>`;
        return;
    }

    productList.forEach(product => {
        const isWished = wishlist.some(item => item.id === product.id);
        const heartColor = isWished ? '#e63946' : '#8c274c';
        const heartFill = isWished ? '#e63946' : 'none';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="prod-img-wrap">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placeholder.com'">
                <button class="wish-icon-btn" onclick="toggleWishlist('${product.id}')" title="উইশলিস্টে রাখুন">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="${heartFill}" stroke="${heartColor}" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
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
                    <button class="btn-add-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                    <button class="btn-order-now" onclick="orderNow('${product.id}')">Order Now</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ================= ৩. ক্যাটাগরি ফিল্টার ও সার্চ =================
function filterCategory(category, btnElement = null) {
    if (btnElement) {
        document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const titleEl = document.getElementById('sectionTitle');
    if (category === 'all') {
        if (titleEl) titleEl.innerText = 'আমাদের সেরা কালেকশন';
        renderProducts(products);
    } else {
        if (titleEl) titleEl.innerText = category;
        const filtered = products.filter(p => p.category === category);
        renderProducts(filtered);
    }
}

function searchProducts() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const query = input.value.toLowerCase().trim();

    if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
    }

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) {
        titleEl.innerText = query ? `সার্চ ফলাফল: "${query}"` : 'আমাদের সেরা কালেকশন';
    }
    renderProducts(filtered);
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) titleEl.innerText = 'আমাদের সেরা কালেকশন';
    renderProducts(products);
}

// ================= ৪. কার্ট (Add to Cart & Order Now) =================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }

    saveCartAndWishlist();
    alert(`"${product.name}" আপনার শপিং ব্যাগে যোগ হয়েছে!`);
}

function orderNow(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (!existingItem) {
        cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
        saveCartAndWishlist();
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
    saveCartAndWishlist();
    renderCartModal();
}
function renderCartModal() {
    const container = document.getElementById('cartItemsContainer');
    const summary = document.getElementById('cartSummary');
    const totalEl = document.getElementById('cartTotalAmount');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<p class="empty-msg" style="text-align:center; padding:20px; color:#7a666e;">আপনার শপিং ব্যাগটি বর্তমানে খালি।</p>`;
        if (summary) summary.style.display = 'none';
        return;
    }

    if (summary) summary.style.display = 'block';
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
                    <button onclick="updateCartQty('${item.id}', -1)" style="padding:2px 8px; cursor:pointer;">-</button>
                    <span>${item.qty}</span>
                    <button onclick="updateCartQty('${item.id}', 1)" style="padding:2px 8px; cursor:pointer;">+</button>
                </div>
            </div>
        `;
    });

    if (totalEl) totalEl.innerText = `${total}৳`;
}

// ================= ৫. হোয়াটসঅ্যাপ অর্ডার ও ট্র্যাকিং =================
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

    cart = [];
    saveCartAndWishlist();
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

// ================= ৬. উইশলিস্ট (Wishlist) =================
function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const index = wishlist.findIndex(item => item.id === productId);
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push({ id: product.id, name: product.name, price: product.price });
    }

    saveCartAndWishlist();
    renderProducts(products);
}

function renderWishlistModal() {
    const container = document.getElementById('wishlistItemsContainer');
    if (!container) return;

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
                    <button class="btn-order-now" style="padding:5px 10px;" onclick="addToCart('${item.id}'); closeModal('wishlistModal');">কিনুন</button>
                    <button class="delete-btn" onclick="toggleWishlist('${item.id}'); renderWishlistModal();">বাদ দিন</button>
                </div>
            </div>
        `;
    });
}

// ================= ৭. SMO বাটন (টিম মেম্বারদের সাথে কল ও হোয়াটসঅ্যাপ যোগাযোগ) =================
function openAdminPanel() {
    openModal('helpModal');
}

// ================= ৮. হেল্পার ও মডাল কন্ট্রোল =================
function saveCartAndWishlist() {
    localStorage.setItem('luvella_cart', JSON.stringify(cart));
    localStorage.setItem('luvella_wishlist', JSON.stringify(wishlist));
    updateCounters();
}

function updateCounters() {
    const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartEl = document.getElementById('cartCount');
    const wishEl = document.getElementById('wishlistCount');
    if (cartEl) cartEl.innerText = totalCartItems;
    if (wishEl) wishEl.innerText = wishlist.length;
}

function openModal(modalId) {
    if (modalId === 'cartModal') renderCartModal();
    if (modalId === 'wishlistModal') renderWishlistModal();
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}
