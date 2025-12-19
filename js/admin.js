import { supabaseClient } from './config.js';

// ==========================================
// Auth & Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Determine current page
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/admin/');
    const isDashboard = window.location.pathname.includes('dashboard.html');

    // Check Session
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (isLoginPage) {
        if (session) {
            // Already logged in, check if admin
            checkAdminAndRedirect(session);
        } else {
            initLogin();
        }
    } else if (isDashboard) {
        if (!session) {
            window.location.href = 'index.html';
        } else {
            // Verify admin status
            const isAdmin = await verifyAdmin(session.user.email);
            if (!isAdmin) {
                await supabaseClient.auth.signOut();
                alert('Access Denied. You are not an administrator.');
                window.location.href = 'index.html';
            } else {
                initDashboard(session);
            }
        }
    }
});

async function verifyAdmin(email) {
    const { data, error } = await supabaseClient
        .from('admins')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    return data && !error;
}

async function checkAdminAndRedirect(session) {
    const isAdmin = await verifyAdmin(session.user.email);
    if (isAdmin) {
        window.location.href = 'dashboard.html';
    } else {
        await supabaseClient.auth.signOut();
        alert('Access Denied. This account is not an administrator.');
    }
}

// ==========================================
// Login Logic
// ==========================================

function initLogin() {
    const form = document.getElementById('admin-login-form');
    const msg = document.getElementById('login-message');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email-address').value;
            const btn = form.querySelector('button');
            const originalText = btn.innerHTML;

            btn.disabled = true;
            btn.innerHTML = 'SENDING...';

            try {
                const { error } = await supabaseClient.auth.signInWithOtp({
                    email: email,
                    options: {
                        emailRedirectTo: window.location.href.replace('index.html', 'dashboard.html').replace(/\/$/, '/dashboard.html')
                    }
                });

                if (error) throw error;

                msg.textContent = 'Check your email for the magic link!';
                msg.classList.remove('hidden', 'text-red-500');
                msg.classList.add('text-green-400');
                form.reset();

            } catch (error) {
                console.error('Login error:', error);
                msg.textContent = error.message;
                msg.classList.remove('hidden', 'text-green-400');
                msg.classList.add('text-red-500');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
}

// ==========================================
// Dashboard Logic
// ==========================================

function initDashboard(session) {
    // Set user info
    const emailEl = document.getElementById('admin-email');
    if (emailEl) emailEl.textContent = session.user.email;

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    // Make loadModule global so UI can access it
    window.loadModule = loadModule;

    // Load initial module
    loadModule('overview');
}

async function loadModule(moduleName) {
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');

    // Show Loading
    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
    `;

    // Highlight Sidebar
    // (Logic to toggle active class on sidebar items can go here)

    try {
        switch (moduleName) {
            case 'overview':
                pageTitle.textContent = 'Dashboard Overview';
                await renderOverview(contentArea);
                break;
            case 'orders':
                pageTitle.textContent = 'Order Management';
                await renderOrders(contentArea);
                break;
            case 'products':
                pageTitle.textContent = 'Product Inventory';
                await renderProducts(contentArea);
                break;
            case 'customers':
                pageTitle.textContent = 'Customer Base';
                contentArea.innerHTML = '<p class="text-gray-400">Customer module coming soon...</p>';
                break;
            case 'discounts':
                pageTitle.textContent = 'Discount Codes';
                await renderDiscounts(contentArea);
                break;
            case 'live-carts':
                pageTitle.textContent = 'Live Active Carts';
                await renderLiveCarts(contentArea);
                break;
            case 'newsletter':
                pageTitle.textContent = 'Newsletter Subscribers';
                await renderNewsletter(contentArea);
                break;
            default:
                contentArea.innerHTML = '<p class="text-red-500">Module not found.</p>';
        }
    } catch (error) {
        console.error(`Error loading ${moduleName}:`, error);
        contentArea.innerHTML = `<div class="p-4 bg-red-900/50 text-red-200 rounded">Error loading module: ${error.message}</div>`;
    }
}

// ==========================================
// Module Renderers (Placeholder / Basic)
// ==========================================

async function renderOverview(container) {
    // Fetch stats in parallel
    const [subscribers, orders] = await Promise.all([
        supabaseClient.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
        supabaseClient.from('orders').select('total_amount')
    ]);

    const subscriberCount = subscribers.count || 0;
    const orderCount = orders.data ? orders.data.length : 0;
    const totalRevenue = orders.data ? orders.data.reduce((sum, o) => sum + (o.total_amount || 0), 0) : 0;

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Stat Card 1 -->
            <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-gray-400 text-sm font-medium">Total Revenue</h3>
                    <span class="p-2 bg-green-900/50 text-green-400 rounded-lg"><i class="fas fa-dollar-sign"></i></span>
                </div>
                <p class="text-3xl font-bold text-white">AED ${totalRevenue.toFixed(2)}</p>
                <!-- <p class="text-sm text-green-400 mt-2 flex items-center"><i class="fas fa-arrow-up mr-1"></i> 12% from last month</p> -->
            </div>

             <!-- Stat Card 2 -->
             <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-gray-400 text-sm font-medium">Total Orders</h3>
                    <span class="p-2 bg-blue-900/50 text-blue-400 rounded-lg"><i class="fas fa-shopping-bag"></i></span>
                </div>
                <p class="text-3xl font-bold text-white">${orderCount}</p>
            </div>

             <!-- Stat Card 3 -->
             <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-gray-400 text-sm font-medium">Subscribers</h3>
                    <span class="p-2 bg-purple-900/50 text-purple-400 rounded-lg"><i class="fas fa-envelope"></i></span>
                </div>
                <p class="text-3xl font-bold text-white">${subscriberCount}</p>
            </div>
            
             <!-- Stat Card 4 -->
             <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-gray-400 text-sm font-medium">Active Carts</h3>
                    <span class="p-2 bg-red-900/50 text-red-400 rounded-lg"><i class="fas fa-shopping-cart"></i></span>
                </div>
                <p class="text-3xl font-bold text-white" id="stat-active-carts">...</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 class="text-lg font-bold text-white mb-4">Recent Activity</h3>
                <p class="text-gray-400 text-sm">Real-time activity feed coming soon.</p>
            </div>
        </div>
    `;

    // Lazy load active carts count
    updateActiveCartsStat();
}

async function updateActiveCartsStat() {
    // This assumes carts table exists. If not, it might error, but we catch it.
    try {
        const { count } = await supabaseClient.from('carts').select('*', { count: 'exact', head: true });
        const el = document.getElementById('stat-active-carts');
        if (el) el.textContent = count || 0;
    } catch (e) { console.error(e); }
}


// --- Module Stubs (Will Implement specifics in next steps) ---

async function renderOrders(container) {
    const { data: orders } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="text-gray-400">No orders found.</p>';
        return;
    }

    const rows = orders.map(order => `
        <tr class="border-b border-gray-700 hover:bg-gray-750">
            <td class="py-4 text-sm font-mono text-gray-300">#${order.id.slice(0, 8)}</td>
            <td class="py-4 text-sm text-white">${new Date(order.created_at).toLocaleDateString()}</td>
            <td class="py-4 text-sm text-white">${order.user_email}</td>
            <td class="py-4 text-sm text-white font-bold">AED ${order.total_amount}</td>
            <td class="py-4 text-sm">
                <span class="px-2 py-1 text-xs rounded-full ${order.status === 'paid' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}">
                    ${order.status.toUpperCase()}
                </span>
            </td>
            <td class="py-4 text-sm text-right">
                <button class="text-gray-400 hover:text-white"><i class="fas fa-ellipsis-v"></i></button>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-gray-750 border-b border-gray-700 text-xs uppercase text-gray-400">
                    <tr>
                        <th class="px-6 py-3">Order ID</th>
                        <th class="px-6 py-3">Date</th>
                        <th class="px-6 py-3">Customer</th>
                        <th class="px-6 py-3">Total</th>
                        <th class="px-6 py-3">Status</th>
                        <th class="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700 px-6">
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

async function renderProducts(container) {
    // Reusing products table structure
    const { data: products } = await supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: true });

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-white">Inventory</h3>
            <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold">ADD PRODUCT</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${products.map(p => `
                <div class="bg-gray-800 border border-gray-700 rounded-lg p-4 flex gap-4">
                     <img src="${p.image_url}" class="w-20 h-20 object-contain bg-white rounded">
                     <div>
                        <h4 class="font-bold text-white">${p.name}</h4>
                        <p class="text-sm text-gray-400 mb-2">Stock: ${p.stock}</p>
                        <span class="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">${p.category}</span>
                     </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function renderDiscounts(container) {
    const { data: codes } = await supabaseClient
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-white">Active Codes</h3>
            <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold">NEW CODE</button>
        </div>
        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
             <table class="w-full text-left">
                <thead class="bg-gray-750 border-b border-gray-700 text-xs uppercase text-gray-400">
                    <tr>
                        <th class="px-6 py-3">Code</th>
                        <th class="px-6 py-3">Type</th>
                        <th class="px-6 py-3">Value</th>
                        <th class="px-6 py-3">Uses</th>
                        <th class="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700 px-6">
                    ${codes ? codes.map(c => `
                        <tr>
                            <td class="px-6 py-4 font-mono font-bold text-white">${c.code}</td>
                            <td class="px-6 py-4 text-sm text-gray-300">${c.type}</td>
                            <td class="px-6 py-4 text-sm text-white">${c.type === 'percentage' ? c.value + '%' : 'AED ' + c.value}</td>
                            <td class="px-6 py-4 text-sm text-gray-300">${c.uses} / ${c.max_uses || '∞'}</td>
                             <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs rounded-full ${c.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">
                                    ${c.active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </td>
                        </tr>
                    `).join('') : '<tr><td colspan="5" class="p-4 text-center">No codes found</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

async function renderLiveCarts(container) {
    const { data: carts } = await supabaseClient
        .from('carts')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20);

    if (!carts || carts.length === 0) {
        container.innerHTML = '<p class="text-gray-400">No active carts right now.</p>';
        return;
    }

    container.innerHTML = `
        <div class="grid gap-4">
            ${carts.map(cart => {
        const items = cart.items || [];
        const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        const lastActive = new Date(cart.updated_at).toLocaleTimeString();

        return `
                <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-sm font-bold text-white">${cart.user_email || 'Anonymous Guest'}</p>
                            <p class="text-xs text-gray-500">Session: ${cart.session_id.slice(0, 8)}... • Last active: ${lastActive}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-green-400">AED ${total.toFixed(2)}</p>
                            <p class="text-xs text-gray-400">${itemCount} items</p>
                        </div>
                    </div>
                    <div class="space-y-2">
                        ${items.map(item => `
                            <div class="flex items-center gap-3 text-sm bg-gray-900/50 p-2 rounded">
                                <img src="${item.image_url}" class="w-8 h-8 object-contain">
                                <span class="text-gray-300 flex-1 truncate">${item.name}</span>
                                <span class="text-gray-400">x${item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `;
    }).join('')}
        </div>
    `;
}

async function renderNewsletter(container) {
    const { data: subs } = await supabaseClient
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

    container.innerHTML = `
        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
             <table class="w-full text-left">
                <thead class="bg-gray-750 border-b border-gray-700 text-xs uppercase text-gray-400">
                    <tr>
                        <th class="px-6 py-3">Email</th>
                        <th class="px-6 py-3">Date Subscribed</th>
                        <th class="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700 px-6">
                    ${subs ? subs.map(s => `
                        <tr>
                            <td class="px-6 py-4 text-white">${s.email}</td>
                            <td class="px-6 py-4 text-sm text-gray-300">${new Date(s.subscribed_at).toLocaleDateString()}</td>
                             <td class="px-6 py-4">
                                <span class="px-2 py-1 text-xs rounded-full bg-green-900 text-green-300">SUBSCRIBED</span>
                            </td>
                        </tr>
                    `).join('') : ''}
                </tbody>
            </table>
        </div>
    `;
}
