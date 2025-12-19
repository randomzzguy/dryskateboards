import { supabaseClient } from './config.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Session
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = 'index.html'; // Protect route
        return;
    }

    currentUser = session.user;
    document.getElementById('profile-email').textContent = currentUser.email;

    // 2. Setup Listeners
    setupTabSwitching();
    setupLogout();
    setupProfileForm();

    // 3. Initial Data Load
    loadOrders();
    loadProfileDetails();
});

function setupTabSwitching() {
    window.switchTab = (tabName) => {
        const ordersTab = document.getElementById('tab-orders');
        const detailsTab = document.getElementById('tab-details');
        const ordersContent = document.getElementById('content-orders');
        const detailsContent = document.getElementById('content-details');

        if (tabName === 'orders') {
            ordersTab.classList.add('active-tab');
            detailsTab.classList.remove('active-tab');
            ordersContent.classList.remove('hidden');
            detailsContent.classList.add('hidden');
        } else {
            detailsTab.classList.add('active-tab');
            ordersTab.classList.remove('active-tab');
            detailsContent.classList.remove('hidden');
            ordersContent.classList.add('hidden');
        }
    };
}

function setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
}

// --- Orders Logic ---

async function loadOrders() {
    const container = document.getElementById('orders-list');

    // We filter orders by email because orders table uses user_email
    const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_email', currentUser.email)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<p class="text-red-500">Error loading orders.</p>`;
        console.error(error);
        return;
    }

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <i class="fas fa-shopping-cart text-3xl mb-3 opacity-50"></i>
                <p>You haven't placed any orders yet.</p>
                <a href="index.html#products" class="text-red-500 font-bold hover:underline mt-2 inline-block">Start Shopping</a>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        const statusColor = order.status === 'paid' ? 'text-green-600 bg-green-50 border-green-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200';

        let itemsHtml = '';
        if (order.items && Array.isArray(order.items)) {
            itemsHtml = order.items.map(i => `<span class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 mr-2">${i.quantity}x ${i.name}</span>`).join('');
        }

        return `
            <div class="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="font-bold text-gray-900">Order #${order.id.slice(0, 8)}</p>
                        <p class="text-xs text-gray-500">${date}</p>
                    </div>
                    <span class="px-3 py-1 text-xs font-bold uppercase rounded-full border ${statusColor}">
                        ${order.status}
                    </span>
                </div>
                <div class="mb-3">
                    ${itemsHtml}
                </div>
                <div class="flex justify-end pt-3 border-t border-gray-100">
                    <p class="font-bold text-gray-900">Total: AED ${order.total_amount}</p>
                </div>
            </div>
        `;
    }).join('');
}

// --- Profile Details Logic ---

async function loadProfileDetails() {
    const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

    if (profile) {
        document.getElementById('prof-name').value = profile.full_name || '';
        document.getElementById('prof-address').value = profile.address_line1 || '';
        document.getElementById('prof-city').value = profile.city || '';
        document.getElementById('prof-state').value = profile.state || '';
        document.getElementById('prof-zip').value = profile.zip || '';
        document.getElementById('prof-phone').value = profile.phone || '';
        // country unused in UI for now, defaulting to null
    }
}

function setupProfileForm() {
    const form = document.getElementById('profile-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Saving...';
        btn.disabled = true;

        const setMsg = document.getElementById('save-msg');

        const updates = {
            id: currentUser.id,
            email: currentUser.email,
            full_name: document.getElementById('prof-name').value,
            address_line1: document.getElementById('prof-address').value,
            city: document.getElementById('prof-city').value,
            state: document.getElementById('prof-state').value,
            zip: document.getElementById('prof-zip').value,
            phone: document.getElementById('prof-phone').value,
            updated_at: new Date(),
        };

        const { error } = await supabaseClient
            .from('profiles')
            .upsert(updates)
            .select();

        btn.textContent = originalText;
        btn.disabled = false;

        if (error) {
            alert('Error updating profile: ' + error.message);
        } else {
            // Show saved msg
            setMsg.classList.remove('hidden');
            setTimeout(() => setMsg.classList.remove('opacity-0'), 10);

            setTimeout(() => {
                setMsg.classList.add('opacity-0');
                setTimeout(() => setMsg.classList.add('hidden'), 300);
            }, 2000);
        }
    });
}
