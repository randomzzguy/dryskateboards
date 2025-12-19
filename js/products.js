import { supabaseClient } from './config.js';
import { addItemToCart } from './cart.js';

let allProducts = []; // Cache for cart retrieval


async function fetchProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching products:', error);
            return;
        }

        allProducts = data;

        // 1. Initial Render
        // Check if we are on Shop Page
        if (document.getElementById('shop-container')) {
            if (window.renderShopPage) {
                renderShopPage('all', { sale: false, featured: false });
            } else {
                console.error('renderShopPage not defined yet');
            }
        }

        // Check if we are on Home Page
        if (document.getElementById('boards-container') || document.getElementById('apparel-container')) {
            renderHomeProducts(data);
        }

        // 2. Setup Features
        setupRealtimeSubscription();
        // injectDetailModal call removed from here as it should be separate or ensure it exists
        if (typeof injectDetailModal === 'function') injectDetailModal();

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

// Exposed for shop.html interactions
window.renderShopPage = (category, filters) => {
    const container = document.getElementById('shop-container');
    if (!container) return; // Guard

    let filtered = allProducts;

    // 1. Category Filter
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }

    // 2. Attribute Filters
    if (filters.sale) {
        filtered = filtered.filter(p => p.sale_price && p.sale_price < p.price);
    }
    if (filters.featured) {
        filtered = filtered.filter(p => p.is_featured);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-20 bg-white rounded-lg"><p class="text-gray-500 text-xl font-bold bebas">No products found matching filters.</p></div>`;
        return;
    }

    // Reuse createProductCard but force viewDetails mode (if we had distinct logic, but createProductCard handles standard card)
    container.innerHTML = filtered.map(p => createProductCard(p)).join('');
};

function renderHomeProducts(products) {
    const boardsContainer = document.getElementById('boards-container');
    const apparelContainer = document.getElementById('apparel-container');

    if (boardsContainer) {
        // Show ONLY featured boards on homepage
        const featuredBoards = products.filter(p => p.category === 'boards' && p.is_featured);

        if (featuredBoards.length > 0) {
            boardsContainer.innerHTML = featuredBoards.map(p => createProductCard(p)).join('');
        } else {
            boardsContainer.innerHTML = '<div class="col-span-full text-center text-gray-400 italic">No featured boards at the moment. Check the Shop!</div>';
        }
    }

    if (apparelContainer) {
        // Trending/Apparel: Show random apparel (first 4)
        const apparel = products.filter(p => p.category === 'apparel').slice(0, 4);
        apparelContainer.innerHTML = apparel.map(p => createProductCard(p)).join('');
    }
}

function setupRealtimeSubscription() {
    supabaseClient
        .channel('public:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
            console.log('Realtime update received:', payload);
            handleRealtimeUpdate(payload);
        })
        .subscribe();
}

function handleRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
        allProducts.push(newRecord);
    } else if (eventType === 'UPDATE') {
        const index = allProducts.findIndex(p => p.id === newRecord.id);
        if (index !== -1) {
            allProducts[index] = newRecord;
        }
    } else if (eventType === 'DELETE') {
        allProducts = allProducts.filter(p => p.id !== oldRecord.id);
    }

    // Sort to keep consistent order (id-based)
    allProducts.sort((a, b) => a.id - b.id);

    // Smart Re-render
    if (document.getElementById('shop-container') && window.applyFilters) {
        window.applyFilters(); // Re-run current shop filters
    } else {
        renderHomeProducts(allProducts);
    }
}

// Ensure Detail Modal Injection exists (it was missing from file view, adding it now)
function injectDetailModal() {
    if (document.getElementById('prod-detail-modal')) return; // Already exists

    const modalHTML = `
    <div id="prod-detail-modal" class="fixed inset-0 bg-black bg-opacity-90 hidden flex items-center justify-center z-[60] p-4">
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row max-h-[90vh]">
            <button onclick="closeProductDetails()" class="absolute top-4 right-4 text-gray-500 hover:text-black z-10 bg-white rounded-full p-2 shadow-sm">
                <i class="fas fa-times text-2xl"></i>
            </button>
            
            <div class="w-full md:w-1/2 bg-gray-100 flex items-center justify-center relative overflow-hidden group cursor-zoom-in" id="zoom-container">
                <img id="detail-img" src="" class="max-h-[500px] object-contain p-8 transition-transform duration-200 origin-center">
            </div>

            <div class="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                <div id="detail-badge" class="mb-4"></div>
                <h2 id="detail-name" class="text-4xl font-bold bebas mb-2"></h2>
                <div id="detail-price" class="mb-6"></div>
                <p id="detail-desc" class="text-gray-600 mb-8 leading-relaxed"></p>
                <div class="mb-8">
                     <span class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 block">Stock Status</span>
                     <span id="detail-stock" class="text-sm"></span>
                </div>
                <div id="detail-actions"></div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const container = document.getElementById('zoom-container');
    const img = document.getElementById('detail-img');

    if (container && img) {
        container.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = container.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;
            img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
            img.style.transform = 'scale(2)';
        });
        container.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
        });
    }
}

window.openProductDetails = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const modal = document.getElementById('prod-detail-modal');
    if (!modal) return;

    document.getElementById('detail-img').src = product.image_url || 'https://placehold.co/600x600';
    document.getElementById('detail-name').textContent = product.name;
    document.getElementById('detail-desc').textContent = product.description || 'No description available.';

    // Price
    const priceDiv = document.getElementById('detail-price');
    if (product.sale_price && product.sale_price < product.price) {
        priceDiv.innerHTML = `
            <span class="text-gray-500 line-through text-lg mr-2">AED ${product.price}</span>
            <span class="text-rad-red font-bold text-3xl">AED ${product.sale_price}</span>
        `;
    } else {
        priceDiv.innerHTML = `<span class="text-gray-900 font-bold text-3xl">AED ${product.price}</span>`;
    }

    // Stock & Actions
    const isSoldOut = product.stock_status === 'sold_out' || product.stock <= 0;
    const stockDiv = document.getElementById('detail-stock');
    const actionsDiv = document.getElementById('detail-actions');

    if (isSoldOut) {
        stockDiv.innerHTML = '<span class="text-red-600 font-bold"><i class="fas fa-times-circle"></i> Sold Out</span>';
        actionsDiv.innerHTML = `<button disabled class="w-full bg-gray-300 text-gray-500 font-bold py-4 rounded cursor-not-allowed bebas tracking-widest text-xl">SOLD OUT</button>`;
    } else {
        stockDiv.innerHTML = `<span class="text-green-600 font-bold"><i class="fas fa-check-circle"></i> In Stock (${product.stock} available)</span>`;
        // Pass event to not propagate? No, here we are inside modal, so simple call is fine.
        actionsDiv.innerHTML = `<button onclick="addToCartHandler(${product.id}); closeProductDetails()" class="w-full bg-rad-black hover:bg-rad-red text-white font-bold py-4 rounded transition-colors bebas tracking-widest text-xl shadow-lg hover:shadow-xl">ADD TO CART</button>`;
    }

    modal.classList.remove('hidden');
};

window.closeProductDetails = () => {
    document.getElementById('prod-detail-modal').classList.add('hidden');
};

function createProductCard(product) {
    // Generate star rating HTML
    let starsHtml = '';
    const fullStars = Math.floor(product.rating || 0);
    const hasHalfStar = (product.rating || 0) % 1 !== 0;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<span class="text-yellow-500"><i class="fas fa-star"></i></span>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<span class="text-yellow-500"><i class="fas fa-star-half-alt"></i></span>';
        } else {
            starsHtml += '<span class="text-gray-300"><i class="fas fa-star"></i></span>';
        }
    }

    // Badge and button logic
    let badgeHtml = '';
    let buttonHtml = '';

    // Check stock status OR stock count
    const isSoldOut = product.stock_status === 'sold_out' || product.stock <= 0;
    const isComingSoon = product.stock_status === 'coming_soon';

    if (isSoldOut) {
        badgeHtml = '<div class="absolute top-4 left-4 bg-gray-800 text-white text-xs font-bold px-3 py-1 bebas tracking-wider">SOLD OUT</div>';
        buttonHtml = '<button class="w-full bg-gray-400 text-white font-bold py-2 px-4 mt-4 cursor-not-allowed bebas tracking-wider" disabled>SOLD OUT</button>';
    } else if (isComingSoon) {
        badgeHtml = '<div class="absolute top-4 left-4 bg-rad-neon text-rad-black text-xs font-bold px-3 py-1 bebas tracking-wider">COMING SOON</div>';
        buttonHtml = '<button class="w-full bg-rad-red hover:bg-red-600 text-white font-bold py-2 px-4 mt-4 transition-colors bebas tracking-wider" onclick="notifyMe(' + product.id + ')">NOTIFY ME</button>';
    } else {
        // In stock - check for other badges
        if (product.stock < 10 && product.stock > 0) {
            badgeHtml = '<div class="absolute top-4 left-4 bg-rad-red text-white text-xs font-bold px-3 py-1 bebas tracking-wider">LOW STOCK</div>';
        } else if (product.sale_price && product.sale_price < product.price) {
            badgeHtml = '<div class="absolute top-4 left-4 bg-rad-neon text-rad-black text-xs font-bold px-3 py-1 bebas tracking-wider">ON SALE</div>';
        } else if (product.rating >= 4.9) {
            badgeHtml = '<div class="absolute top-4 left-4 bg-rad-neon text-rad-black text-xs font-bold px-3 py-1 bebas tracking-wider">BEST SELLER</div>';
        }
        buttonHtml = '<button class="w-full bg-rad-black hover:bg-gray-900 text-white font-bold py-2 px-4 mt-4 transition-colors bebas tracking-wider" onclick="addToCartHandler(' + product.id + ')">ADD TO CART</button>';
    }

    // Price Display Logic
    let priceHtml = '';
    if (product.sale_price && product.sale_price < product.price) {
        priceHtml = `
            <div class="flex flex-col items-start">
                <span class="text-gray-500 line-through text-sm">AED ${product.price}</span>
                <span class="text-rad-red font-bold text-xl">AED ${product.sale_price}</span>
            </div>
        `;
    } else {
        priceHtml = `<p class="text-gray-700 font-bold text-lg">AED ${product.price}</p>`;
    }

    // Default image if none provided
    const imageSrc = product.image_url || 'https://placehold.co/400x300?text=Product';

    return `
    <div onclick="openProductDetails(${product.id})" class="product-card bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl cursor-pointer group">
        <div class="relative">
            <div class="bg-gray-100 h-64 flex items-center justify-center overflow-hidden">
                <img src="${imageSrc}" alt="${product.name}" class="object-contain w-full h-full p-4 transition-transform duration-500 group-hover:scale-110" onerror="this.src='https://placehold.co/300x100?text=${encodeURIComponent(product.name)}'">
            </div>
            ${badgeHtml}
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                <span class="text-white font-bold border-2 border-white px-4 py-2 bebas tracking-widest">QUICK VIEW</span>
            </div>
        </div>
        <div class="p-6">
            <h3 class="text-xl font-bold mb-2">${product.name}</h3>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || ''}</p>
            <div class="flex justify-between items-center">
                ${priceHtml}
                <div class="flex">${starsHtml}</div>
            </div>
            ${buttonHtml}
        </div>
    </div>
    `;
}

// Global handler for the onclick attribute
window.addToCartHandler = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (product) {
        addItemToCart(product);
    } else {
        console.error('Product not found:', id);
    }
};

// Handler for "Notify Me" on coming soon products
window.notifyMe = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (product) {
        // TODO: Implement email collection for notifications
        alert(`We'll notify you when ${product.name} is available! 🔔`);
        console.log('Notify me clicked for:', product.name);
    }
};

// Make fetchProducts globally available if needed, or run on load
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});
