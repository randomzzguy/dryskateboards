import { supabaseClient } from './config.js';
// Cart State
let cart = JSON.parse(localStorage.getItem('dry_cart')) || [];
let isCartOpen = false;

// DOM Elements
const cartDrawer = document.getElementById('cart-drawer');
const cartBackdrop = document.getElementById('cart-backdrop');
const cartContent = document.getElementById('cart-content');
const closeCartBtn = document.getElementById('close-cart-drawer');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountBadges = document.querySelectorAll('.fa-shopping-cart + span'); // Select all cart badges
const cartIcons = document.querySelectorAll('.fa-shopping-cart'); // Select all cart icons
const checkoutBtn = document.getElementById('checkout-btn');

console.log('🛒 Cart.js module loaded');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛒 Cart DOMContentLoaded fired');
    initCartListeners();
    renderCart();
});

function initCartListeners() {
    console.log('🛒 initCartListeners called');

    // Open Cart - attach to the main cart button
    const openCartBtn = document.getElementById('open-cart-btn');
    console.log('🛒 Cart button element:', openCartBtn);

    if (openCartBtn) {
        openCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🛒 Cart button clicked!');
            openCart();
        });
        console.log('🛒 Click listener attached to cart button');
    } else {
        console.error('❌ Cart button not found!');
    }

    // Close Cart
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

    // Checkout
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);

    // Make cart control functions global for inline onclick handlers
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.closeCart = closeCart;
    window.openCart = openCart;
}

async function handleCheckout(e) {
    e.preventDefault();

    // Check if cart is empty
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }

    // Check auth
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        // Logged in -> Go to checkout
        window.location.href = 'checkout.html';
    } else {
        // Not logged in -> Show auth modal with Guest Option
        // Close cart first? Maybe not needed as modal is z-indexed higher?
        // Let's close cart to be clean
        closeCart();

        if (window.openAuthModal) {
            window.openAuthModal(true); // true = forCheckout
        } else {
            // Fallback if auth.js didn't load properly
            console.warn('openAuthModal not found, redirecting to checkout anyway');
            window.location.href = 'checkout.html';
        }
    }
}

function openCart() {
    console.log('🛒 openCart() called');
    console.log('🛒 cartDrawer:', cartDrawer);
    console.log('🛒 cartContent:', cartContent);

    cartDrawer.classList.remove('hidden');
    // Small delay to allow display:block to apply before transform
    setTimeout(() => {
        cartContent.classList.remove('translate-x-full');
    }, 10);
    document.body.style.overflow = 'hidden';
    isCartOpen = true;

    console.log('🛒 Cart should now be open');
}

function closeCart() {
    cartContent.classList.add('translate-x-full');
    setTimeout(() => {
        cartDrawer.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
    isCartOpen = false;
}

function addToCart(productId) {
    // We need to get the product details. 
    // Since we don't have a global product map easily accessible yet without refactoring products.js,
    // We will cheat slightly and assume products.js caches them or we look them up from the DOM ?
    // Better way: products.js should export a way to get product, OR we dispatch an event.
    // Simplest for now: The window.addToCart function in products.js will handle the lookup and call `cart.add(product)`.

    // Actually, let's change the architecture slightly. 
    // `products.js` will define `window.addToCart` which looks up the product and calls our internal `addItemToCart`.
    // But wait, `products.js` is a module. It can't easily export to window unless we explicitly do so.
    // Let's rely on a custom event or a shared state.

    // Temporary Hack: We'll implement `addItemToCart` here and expect `products.js` to call it with the full object.
    console.warn("Use addItemToCart(product) instead of addToCart(id)");
}

export function addItemToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    openCart();

    // Optional: Show toast
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            renderCart();
        }
    }
}

function saveCart() {
    localStorage.setItem('dry_cart', JSON.stringify(cart));
}

function renderCart() {
    // Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadges.forEach(badge => {
        badge.textContent = totalItems;
        badge.classList.toggle('hidden', totalItems === 0);
    });

    // Update Totals
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalEl.textContent = '$' + totalAmount.toFixed(2);

    // Render Items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center text-gray-500 mt-10">
                <p class="mb-4">Your cart is empty.</p>
                <button onclick="closeCart()" class="text-rad-red font-bold hover:underline">Start Shopping</button>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="flex items-center gap-4 bg-gray-50 p-3 rounded-lg animate-fade-in">
            <img src="${item.image_url || 'https://placehold.co/100'}" alt="${item.name}" class="w-20 h-20 object-contain bg-white rounded-md border border-gray-200">
            <div class="flex-1">
                <h3 class="font-bold text-sm leading-tight mb-1">${item.name}</h3>
                <p class="text-rad-red font-bold">$${item.price}</p>
                <div class="flex items-center mt-2 gap-3">
                    <div class="flex items-center border border-gray-300 rounded overflow-hidden">
                        <button onclick="updateQuantity(${item.id}, -1)" class="px-2 py-1 hover:bg-gray-200">-</button>
                        <span class="px-2 text-sm font-bold">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)" class="px-2 py-1 hover:bg-gray-200">+</button>
                    </div>
                    <button onclick="removeFromCart(${item.id})" class="text-gray-400 hover:text-rad-red text-sm underline">Remove</button>
                </div>
            </div>
        </div>
    `).join('');
}
