import { supabaseClient } from './config.js';

// DOM Elements
const orderItemsContainer = document.getElementById('order-items');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryShipping = document.getElementById('summary-shipping');
const summaryTotal = document.getElementById('summary-total');
const placeOrderBtn = document.getElementById('place-order-btn');
const checkoutForm = document.getElementById('checkout-form');
const checkoutMessage = document.getElementById('checkout-message');
const successModal = document.getElementById('success-modal');
const orderIdEl = document.getElementById('order-id');

// State
let cart = JSON.parse(localStorage.getItem('dry_cart')) || [];
const SHIPPING_COST = 0.00; // Free shipping for now

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (cart.length === 0) {
        window.location.href = 'index.html'; // Redirect text if empty
        return;
    }
    renderOrderSummary();
    setupListeners();
});

function setupListeners() {
    placeOrderBtn.addEventListener('click', handlePlaceOrder);
}

function renderOrderSummary() {
    orderItemsContainer.innerHTML = cart.map(item => `
        <div class="flex items-center gap-4">
            <div class="relative">
                <img src="${item.image_url || 'https://placehold.co/60'}" class="w-16 h-16 object-contain bg-gray-50 border border-gray-200 rounded">
                <span class="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">${item.quantity}</span>
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-sm">${item.name}</h4>
                <p class="text-gray-500 text-xs">Size: Default</p>
            </div>
            <div class="text-right">
                <p class="font-bold">$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + SHIPPING_COST;

    summarySubtotal.textContent = '$' + subtotal.toFixed(2);
    summaryShipping.textContent = '$' + SHIPPING_COST.toFixed(2);
    summaryTotal.textContent = '$' + total.toFixed(2);
}

async function handlePlaceOrder(e) {
    e.preventDefault();

    // Basic Validation - Shipping
    const fname = document.getElementById('fname').value;
    const lname = document.getElementById('lname').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zip = document.getElementById('zip').value;

    if (!fname || !lname || !email || !address || !city || !state || !zip) {
        showMessage('Please fill in all shipping details.', 'error');
        return;
    }

    // Basic Validation - Payment
    const cardNumber = document.getElementById('card-number').value;
    const cardExpiry = document.getElementById('card-expiry').value;
    const cardCvc = document.getElementById('card-cvc').value;

    if (!cardNumber || !cardExpiry || !cardCvc) {
        showMessage('Please fill in all payment details.', 'error');
        return;
    }

    // Simple card number validation (just check length)
    if (cardNumber.replace(/\s/g, '').length < 13) {
        showMessage('Please enter a valid card number.', 'error');
        return;
    }

    // Simple expiry validation (MM/YY format)
    if (!/^\d{2}\s?\/\s?\d{2}$/.test(cardExpiry)) {
        showMessage('Please enter expiry in MM/YY format.', 'error');
        return;
    }

    // Simple CVC validation
    if (cardCvc.length < 3) {
        showMessage('Please enter a valid CVC.', 'error');
        return;
    }

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'PROCESSING...';
    showMessage('');

    // Prepare Order Data
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + SHIPPING_COST;

    // Create Order in Supabase
    const orderData = {
        user_email: email,
        total_amount: total,
        status: 'paid', // Simulating successful payment
        items: cart
        // Note: shipping details are collected but not stored in this version
        // created_at is auto
    };

    console.log('📦 Attempting to create order:', orderData);

    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([orderData])
            .select();

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        // Success
        console.log('✅ Order created:', data);
        const orderId = data[0].id;

        // Clear Cart
        localStorage.removeItem('dry_cart');

        // Show Success Modal
        orderIdEl.textContent = '#' + orderId;
        successModal.classList.remove('hidden');

    } catch (err) {
        console.error('❌ Order error:', err);

        // Show detailed error message
        let errorMsg = 'Failed to place order. ';
        if (err.message) {
            errorMsg += err.message;
        }
        if (err.hint) {
            errorMsg += ' Hint: ' + err.hint;
        }

        showMessage(errorMsg, 'error');
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'PLACE ORDER';
    }
}

function showMessage(msg, type = 'error') {
    checkoutMessage.textContent = msg;
    checkoutMessage.classList.remove('hidden', 'text-red-500', 'text-green-500');
    if (msg) {
        checkoutMessage.classList.add(type === 'error' ? 'text-red-500' : 'text-green-500');
    } else {
        checkoutMessage.classList.add('hidden');
    }
}
