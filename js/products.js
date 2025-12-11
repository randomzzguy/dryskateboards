import { supabaseClient } from './config.js';
import { addItemToCart } from './cart.js';

let allProducts = []; // Cache for cart retrieval


async function fetchProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*');

        if (error) {
            console.error('Error fetching products:', error);
            return;
        }

        allProducts = data; // Store in cache
        renderProducts(data);
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

function renderProducts(products) {
    const boardsContainer = document.getElementById('boards-container');
    const apparelContainer = document.getElementById('apparel-container');

    // Clear loading indicators
    if (boardsContainer) boardsContainer.innerHTML = '';
    if (apparelContainer) apparelContainer.innerHTML = '';

    products.forEach(product => {
        const productCard = createProductCard(product);
        if (product.category === 'boards' && boardsContainer) {
            boardsContainer.innerHTML += productCard;
        } else if (product.category === 'apparel' && apparelContainer) {
            apparelContainer.innerHTML += productCard;
        }
    });

    // Handle empty states
    if (boardsContainer && boardsContainer.innerHTML === '') {
        boardsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">No boards available at the moment.</p>';
    }
    if (apparelContainer && apparelContainer.innerHTML === '') {
        apparelContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">No apparel available at the moment.</p>';
    }
}

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

    // Badge and button logic based on stock_status
    let badgeHtml = '';
    let buttonHtml = '';
    const stockStatus = product.stock_status || 'in_stock';

    if (stockStatus === 'sold_out') {
        badgeHtml = '<div class="absolute top-4 left-4 bg-gray-800 text-white text-xs font-bold px-3 py-1 bebas tracking-wider">SOLD OUT</div>';
        buttonHtml = '<button class="w-full bg-gray-400 text-white font-bold py-2 px-4 mt-4 cursor-not-allowed bebas tracking-wider" disabled>SOLD OUT</button>';
    } else if (stockStatus === 'coming_soon') {
        badgeHtml = '<div class="absolute top-4 left-4 bg-rad-neon text-rad-black text-xs font-bold px-3 py-1 bebas tracking-wider">COMING SOON</div>';
        buttonHtml = '<button class="w-full bg-rad-red hover:bg-red-600 text-white font-bold py-2 px-4 mt-4 transition-colors bebas tracking-wider" onclick="notifyMe(' + product.id + ')">NOTIFY ME</button>';
    } else {
        // In stock - check for other badges
        if (product.stock < 10 && product.stock > 0) {
            badgeHtml = '<div class="absolute top-4 left-4 bg-rad-red text-white text-xs font-bold px-3 py-1 bebas tracking-wider">LOW STOCK</div>';
        } else if (product.rating >= 4.9) {
            badgeHtml = '<div class="absolute top-4 left-4 bg-rad-neon text-rad-black text-xs font-bold px-3 py-1 bebas tracking-wider">BEST SELLER</div>';
        }
        buttonHtml = '<button class="w-full bg-rad-black hover:bg-gray-900 text-white font-bold py-2 px-4 mt-4 transition-colors bebas tracking-wider" onclick="addToCartHandler(' + product.id + ')">ADD TO CART</button>';
    }

    // Default image if none provided
    const imageSrc = product.image_url || 'https://placehold.co/400x300?text=Product';

    return `
    <div class="product-card bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl">
        <div class="relative">
            <div class="bg-gray-100 h-64 flex items-center justify-center overflow-hidden">
                <img src="${imageSrc}" alt="${product.name}" class="object-contain w-full h-full p-4" onerror="this.src='https://placehold.co/300x100?text=${encodeURIComponent(product.name)}'">
            </div>
            ${badgeHtml}
        </div>
        <div class="p-6">
            <h3 class="text-xl font-bold mb-2">${product.name}</h3>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || ''}</p>
            <div class="flex justify-between items-center">
                <p class="text-gray-700 font-bold text-lg">AED ${product.price}</p>
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
