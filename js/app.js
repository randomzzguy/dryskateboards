// Loading Screen Logic
document.addEventListener('DOMContentLoaded', function () {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingPercent = document.getElementById('loading-percent');
    const loadingBar = document.getElementById('loading-bar');
    let percent = 0;

    function animateLoading() {
        percent += Math.random() * 2 + 0.5; // slower increment for realism
        if (percent > 100) percent = 100;
        if (loadingPercent) loadingPercent.textContent = Math.floor(percent) + '%';
        if (loadingBar) loadingBar.style.width = percent + '%';
        if (percent < 100) {
            setTimeout(animateLoading, 60);
        } else {
            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.classList.add('hide');
                    setTimeout(() => loadingScreen.style.display = 'none', 700);
                }
            }, 350);
        }
    }
    animateLoading();

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenu = document.getElementById('close-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
    }

    if (closeMenu && mobileMenu) {
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    }

    // Back to Top Button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTop.classList.remove('hidden');
            } else {
                backToTop.classList.add('hidden');
            }
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Instagram Carousel Functionality
    const carousels = document.querySelectorAll('.ig-carousel');

    carousels.forEach(carousel => {
        const images = carousel.querySelectorAll('.carousel-img');
        const parent = carousel.closest('a');
        const prevBtn = parent.querySelector('.carousel-prev');
        const nextBtn = parent.querySelector('.carousel-next');
        const counter = parent.querySelector('.absolute.top-2.right-2');
        let currentIndex = 0;

        function updateCarousel() {
            images.forEach((img, index) => {
                if (index === currentIndex) {
                    img.classList.add('active');
                } else {
                    img.classList.remove('active');
                }
            });

            // Update counter
            if (counter) {
                counter.innerHTML = `<i class="fas fa-clone"></i> ${currentIndex + 1}/${images.length}`;
            }
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                updateCarousel();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentIndex = (currentIndex + 1) % images.length;
                updateCarousel();
            });
        }
    });
});
