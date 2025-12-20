import { supabaseClient } from './config.js';

// DOM Elements
const authModal = document.getElementById('auth-modal');
const authBackdrop = document.getElementById('auth-backdrop');
const closeAuthModalBtn = document.getElementById('close-auth-modal');
const loginTab = document.getElementById('tab-login');
const signupTab = document.getElementById('tab-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('auth-message');
const userIcon = document.getElementById('nav-user-icon');
const guestCheckoutOption = document.getElementById('guest-checkout-option');
const guestCheckoutBtn = document.getElementById('guest-checkout-btn');

// State
let user = null;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    initAuthListeners();
    checkUserSession();
});

function initAuthListeners() {
    // Open Modal
    if (userIcon) {
        userIcon.addEventListener('click', (e) => {
            e.preventDefault();
            if (user) {
                // If logged in, go to profile
                window.location.href = 'profile.html';
            } else {
                openModal();
            }
        });
    }

    // Close Modal
    if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', closeModal);
    if (authBackdrop) authBackdrop.addEventListener('click', closeModal);

    // Tab Switching
    if (loginTab && signupTab) {
        loginTab.addEventListener('click', () => switchTab('login'));
        signupTab.addEventListener('click', () => switchTab('signup'));
    }

    // Form Submission
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    // Guest Checkout
    if (guestCheckoutBtn) guestCheckoutBtn.addEventListener('click', handleGuestCheckout);

    // Expose openModal globally
    window.openAuthModal = openModal;
}

function openModal(forCheckout = false) {
    authModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling

    // Show/Hide Guest Checkout Option
    if (guestCheckoutOption) {
        if (forCheckout) {
            guestCheckoutOption.classList.remove('hidden');
        } else {
            guestCheckoutOption.classList.add('hidden');
        }
    }
}

function closeModal() {
    authModal.classList.add('hidden');
    document.body.style.overflow = '';
    // Reset forms
    loginForm.reset();
    signupForm.reset();
    clearMessage();
}

function switchTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('text-rad-black', 'border-b-2', 'border-rad-red');
        loginTab.classList.remove('text-gray-400', 'border-transparent');
        signupTab.classList.remove('text-rad-black', 'border-b-2', 'border-rad-red');
        signupTab.classList.add('text-gray-400');

        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTab.classList.add('text-rad-black', 'border-b-2', 'border-rad-red');
        signupTab.classList.remove('text-gray-400');
        loginTab.classList.remove('text-rad-black', 'border-b-2', 'border-rad-red');
        loginTab.classList.add('text-gray-400');

        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
    clearMessage();
}

function showMessage(msg, type = 'error') {
    authMessage.textContent = msg;
    authMessage.classList.remove('hidden', 'text-red-500', 'text-green-500');
    authMessage.classList.add(type === 'error' ? 'text-red-500' : 'text-green-500');
}

function clearMessage() {
    authMessage.textContent = '';
    authMessage.classList.add('hidden');
}

async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateUserState(session?.user);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        updateUserState(session?.user);
    });
}

function updateUserState(currentUser) {
    user = currentUser;
    if (user) {
        // Update UI to show logged in state
        console.log('User is logged in:', user.email);
        userIcon.innerHTML = `<i class="fas fa-user-check text-rad-neon"></i>`;
        userIcon.title = user.email;
    } else {
        // Update UI to show logged out state
        console.log('User is logged out');
        userIcon.innerHTML = `<i class="fas fa-user"></i>`;
        userIcon.title = 'Login / Sign Up';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    showMessage('Logging in...', 'success');

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        showMessage(error.message, 'error');
    } else {
        showMessage('Login successful!', 'success');
        setTimeout(closeModal, 1000);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    // Verify hCaptcha
    const captchaToken = hcaptcha.getResponse();
    if (!captchaToken) {
        showMessage('Please complete the security check.', 'error');
        return;
    }

    showMessage('Creating account...', 'success');

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { captchaToken }
    });

    if (error) {
        showMessage(error.message, 'error');
    } else {
        showMessage('Account created! Please check your email.', 'success');
        // setTimeout(closeModal, 2000); // Wait longer so they read the message
    }
}

async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error('Error signing out:', error);
}

function handleGuestCheckout(e) {
    if (e) e.preventDefault();
    // Mark as guest checkout if needed
    sessionStorage.setItem('guest_checkout', 'true');
    closeModal();
    window.location.href = 'checkout.html';
}
