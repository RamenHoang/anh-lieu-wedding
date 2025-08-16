/**
 * Custom Gallery Library
 * Replaces PhotoSwipe with lazy loading and custom lightbox functionality
 */

class CustomGallery {
    constructor(options = {}) {
        this.options = {
            gallery: '.photoset',
            children: 'a',
            loop: true,
            counter: true,
            zoom: true,
            escKey: true,
            wheelToZoom: true,
            closeOnVerticalDrag: true,
            lazyLoadOffset: 100,
            ...options
        };

        this.currentIndex = 0;
        this.items = [];
        this.isOpen = false;
        this.isDragging = false;
        this.startY = 0;
        this.currentY = 0;
        this.zoomLevel = 1;
        this.maxZoom = 3;
        this.minZoom = 1;

        this.intersectionObserver = null;
        this.galleries = [];
        this.originalViewport = null;

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeGallery();
            });
        } else {
            this.initializeGallery();
        }
    }

    initializeGallery() {
        this.createLightboxHTML();
        this.setupIntersectionObserver();
        this.bindEvents();
        this.findGalleries();
        this.setupLazyLoading();
    }

    createLightboxHTML() {
        // Check if lightbox already exists
        const existingLightbox = document.getElementById('custom-lightbox');
        if (existingLightbox) {
            existingLightbox.remove();
        }

        const lightboxHTML = `
            <div class="custom-lightbox" id="custom-lightbox">
                <div class="lightbox-backdrop"></div>
                <div class="lightbox-container">
                    <button class="lightbox-close" aria-label="Close">&times;</button>
                    <button class="lightbox-prev" aria-label="Previous">&#8249;</button>
                    <button class="lightbox-next" aria-label="Next">&#8250;</button>
                    <div class="lightbox-content">
                        <img class="lightbox-image" src="" alt="">
                        <div class="lightbox-loader">
                            <div class="loader-spinner"></div>
                        </div>
                    </div>
                    <div class="lightbox-counter">
                        <span class="current-index">1</span> / <span class="total-count">1</span>
                    </div>
                    <div class="lightbox-zoom-controls">
                        <button class="zoom-in" aria-label="Zoom In">+</button>
                        <button class="zoom-out" aria-label="Zoom Out">-</button>
                        <button class="zoom-reset" aria-label="Reset Zoom">Reset</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        this.lightbox = document.getElementById('custom-lightbox');
        this.lightboxImage = this.lightbox.querySelector('.lightbox-image');
        this.lightboxLoader = this.lightbox.querySelector('.lightbox-loader');
        this.currentIndexEl = this.lightbox.querySelector('.current-index');
        this.totalCountEl = this.lightbox.querySelector('.total-count');
        this.lightboxContent = this.lightbox.querySelector('.lightbox-content');

        // Debug log
        console.log('Custom lightbox created:', this.lightbox ? 'Success' : 'Failed');
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: `${this.options.lazyLoadOffset}px`,
            threshold: 0.1
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, options);
    }

    findGalleries() {
        const galleryElements = document.querySelectorAll(this.options.gallery);

        galleryElements.forEach((gallery, galleryIndex) => {
            const items = gallery.querySelectorAll(this.options.children);
            const galleryItems = [];

            items.forEach((item, itemIndex) => {
                const img = item.querySelector('img');
                const href = item.getAttribute('href');

                if (img && href) {
                    const galleryItem = {
                        element: item,
                        img: img,
                        src: href,
                        ratio: parseFloat(img.getAttribute('data-ratio')) || 1,
                        width: parseInt(img.getAttribute('data-pswp-width')) || 800,
                        height: parseInt(img.getAttribute('data-pswp-height')) || 600,
                        galleryIndex: galleryIndex,
                        itemIndex: itemIndex
                    };

                    galleryItems.push(galleryItem);

                    // Add click event
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.open(galleryItems, itemIndex);
                    });
                }
            });

            this.galleries.push(galleryItems);
        });
    }

    setupLazyLoading() {
        const images = document.querySelectorAll(`${this.options.gallery} img[data-src]`);

        images.forEach(img => {
            // Set placeholder while loading
            if (!img.src || img.src.includes('placeholder')) {
                this.intersectionObserver.observe(img);
            }
        });
    }

    loadImage(img) {
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
            const tempImg = new Image();
            tempImg.onload = () => {
                img.src = dataSrc;
                img.classList.add('loaded');
            };
            tempImg.onerror = () => {
                img.classList.add('error');
            };
            tempImg.src = dataSrc;
        }
    }

    bindEvents() {
        // Ensure lightbox elements exist before binding
        if (!this.lightbox) {
            console.error('Lightbox not found. Cannot bind events.');
            return;
        }

        // Close button
        const closeBtn = this.lightbox.querySelector('.lightbox-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
            // Add touch event for mobile
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            });
        }

        // Navigation buttons
        const prevBtn = this.lightbox.querySelector('.lightbox-prev');
        const nextBtn = this.lightbox.querySelector('.lightbox-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prev();
            });
            prevBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.prev();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.next();
            });
            nextBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.next();
            });
        }

        // Zoom controls
        const zoomInBtn = this.lightbox.querySelector('.zoom-in');
        const zoomOutBtn = this.lightbox.querySelector('.zoom-out');
        const zoomResetBtn = this.lightbox.querySelector('.zoom-reset');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.zoomIn();
            });
            zoomInBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.zoomIn();
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.zoomOut();
            });
            zoomOutBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.zoomOut();
            });
        }

        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.resetZoom();
            });
            zoomResetBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.resetZoom();
            });
        }

        // Backdrop click to close
        const backdrop = this.lightbox.querySelector('.lightbox-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.close();
            });
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch(e.key) {
                case 'Escape':
                    if (this.options.escKey) this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
                case '+':
                case '=':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
                case '0':
                    this.resetZoom();
                    break;
            }
        });

        // Touch/Mouse events for drag to close and swipe navigation
        this.setupTouchEvents();

        // Wheel zoom
        this.lightboxContent.addEventListener('wheel', (e) => {
            if (!this.options.wheelToZoom) return;

            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
    }

    setupTouchEvents() {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let touchStartTime = 0;
        let isSwiping = false;
        let isDragging = false;

        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            currentX = startX;
            currentY = startY;
            touchStartTime = Date.now();
            isSwiping = false;
            isDragging = false;

            this.lightboxContent.style.transition = 'none';
        };

        const handleTouchMove = (e) => {
            if (!e.touches[0]) return;

            const touch = e.touches[0];
            currentX = touch.clientX;
            currentY = touch.clientY;

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            // Determine if this is a swipe or drag
            if (absX > 20 || absY > 20) {
                if (absX > absY) {
                    // Horizontal swipe
                    isSwiping = true;
                    e.preventDefault();

                    // Visual feedback for swipe
                    const opacity = Math.max(0.3, 1 - absX / 300);
                    this.lightboxContent.style.transform = `translateX(${deltaX}px)`;
                    this.lightbox.style.backgroundColor = `rgba(0, 0, 0, ${opacity * 0.9})`;
                } else if (this.options.closeOnVerticalDrag) {
                    // Vertical drag to close
                    isDragging = true;
                    e.preventDefault();

                    const opacity = Math.max(0.3, 1 - absY / 300);
                    this.lightboxContent.style.transform = `translateY(${deltaY}px)`;
                    this.lightbox.style.backgroundColor = `rgba(0, 0, 0, ${opacity * 0.9})`;
                }
            }
        };

        const handleTouchEnd = (e) => {
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            const touchTime = Date.now() - touchStartTime;

            this.lightboxContent.style.transition = '';

            if (isSwiping) {
                // Handle horizontal swipe for navigation
                if (absX > 50 || (absX > 30 && touchTime < 300)) {
                    if (deltaX > 0) {
                        this.prev();
                    } else {
                        this.next();
                    }
                } else {
                    // Reset position
                    this.lightboxContent.style.transform = '';
                    this.lightbox.style.backgroundColor = '';
                }
            } else if (isDragging) {
                // Handle vertical drag to close
                if (absY > 100 || (absY > 50 && touchTime < 300)) {
                    this.close();
                } else {
                    // Reset position
                    this.lightboxContent.style.transform = '';
                    this.lightbox.style.backgroundColor = '';
                }
            }

            // Reset variables
            isSwiping = false;
            isDragging = false;
        };

        // Add touch event listeners
        this.lightboxContent.addEventListener('touchstart', handleTouchStart, { passive: false });
        this.lightboxContent.addEventListener('touchmove', handleTouchMove, { passive: false });
        this.lightboxContent.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Mouse events for desktop
        this.lightboxContent.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));
    }

    handleStart(e) {
        if (!this.options.closeOnVerticalDrag) return;

        this.isDragging = true;
        this.startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        this.currentY = this.startY;

        this.lightboxContent.style.transition = 'none';
    }

    handleMove(e) {
        if (!this.isDragging || !this.options.closeOnVerticalDrag) return;

        e.preventDefault();
        this.currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        const deltaY = this.currentY - this.startY;

        if (Math.abs(deltaY) > 50) {
            const opacity = Math.max(0.3, 1 - Math.abs(deltaY) / 300);
            this.lightboxContent.style.transform = `translateY(${deltaY}px)`;
            this.lightbox.style.backgroundColor = `rgba(0, 0, 0, ${opacity * 0.9})`;
        }
    }

    handleEnd(e) {
        if (!this.isDragging || !this.options.closeOnVerticalDrag) return;

        this.isDragging = false;
        const deltaY = this.currentY - this.startY;

        this.lightboxContent.style.transition = '';

        if (Math.abs(deltaY) > 100) {
            this.close();
        } else {
            this.lightboxContent.style.transform = '';
            this.lightbox.style.backgroundColor = '';
        }
    }

    open(items, index = 0) {
        console.log('Opening gallery with', items.length, 'items at index', index);

        this.items = items;
        this.currentIndex = index;
        this.isOpen = true;

        if (!this.lightbox) {
            console.error('Lightbox not found when trying to open');
            return;
        }

        // Prevent body scrolling on mobile
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';

        // Add mobile viewport handling
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            this.originalViewport = viewport.getAttribute('content');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }

        this.lightbox.classList.add('active');

        this.loadCurrentImage();
        this.updateCounter();
        this.updateNavigation();
    }

    close() {
        console.log('Closing gallery');
        this.isOpen = false;
        this.lightbox.classList.remove('active');

        // Restore body scrolling
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';

        // Restore original viewport
        if (this.originalViewport) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', this.originalViewport);
            }
        }

        this.resetZoom();

        // Reset transforms
        this.lightboxContent.style.transform = '';
        this.lightbox.style.backgroundColor = '';
    }

    prev() {
        console.log('Previous image');
        if (!this.options.loop && this.currentIndex === 0) return;

        this.currentIndex = this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex - 1;
        this.loadCurrentImage();
        this.updateCounter();
        this.updateNavigation();
        this.resetZoom();
    }

    next() {
        console.log('Next image');
        if (!this.options.loop && this.currentIndex === this.items.length - 1) return;

        this.currentIndex = this.currentIndex === this.items.length - 1 ? 0 : this.currentIndex + 1;
        this.loadCurrentImage();
        this.updateCounter();
        this.updateNavigation();
        this.resetZoom();
    }

    loadCurrentImage() {
        const currentItem = this.items[this.currentIndex];

        this.lightboxLoader.style.display = 'block';
        this.lightboxImage.style.opacity = '0';

        const img = new Image();
        img.onload = () => {
            this.lightboxImage.src = currentItem.src;
            this.lightboxImage.style.opacity = '1';
            this.lightboxLoader.style.display = 'none';
        };
        img.onerror = () => {
            this.lightboxLoader.style.display = 'none';
            console.error('Failed to load image:', currentItem.src);
        };
        img.src = currentItem.src;
    }

    updateCounter() {
        if (this.options.counter) {
            this.currentIndexEl.textContent = this.currentIndex + 1;
            this.totalCountEl.textContent = this.items.length;
        }
    }

    updateNavigation() {
        const prevBtn = this.lightbox.querySelector('.lightbox-prev');
        const nextBtn = this.lightbox.querySelector('.lightbox-next');

        if (!this.options.loop) {
            prevBtn.style.display = this.currentIndex === 0 ? 'none' : 'block';
            nextBtn.style.display = this.currentIndex === this.items.length - 1 ? 'none' : 'block';
        }
    }

    zoomIn() {
        if (!this.options.zoom) return;

        this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel * 1.2);
        this.applyZoom();
    }

    zoomOut() {
        if (!this.options.zoom) return;

        this.zoomLevel = Math.max(this.minZoom, this.zoomLevel / 1.2);
        this.applyZoom();
    }

    resetZoom() {
        this.zoomLevel = this.minZoom;
        this.applyZoom();
    }

    applyZoom() {
        this.lightboxImage.style.transform = `scale(${this.zoomLevel})`;

        // Update zoom control states
        const zoomInBtn = this.lightbox.querySelector('.zoom-in');
        const zoomOutBtn = this.lightbox.querySelector('.zoom-out');

        zoomInBtn.disabled = this.zoomLevel >= this.maxZoom;
        zoomOutBtn.disabled = this.zoomLevel <= this.minZoom;
    }

    // Public method to refresh lazy loading (useful if content is added dynamically)
    refreshLazyLoading() {
        this.setupLazyLoading();
    }

    // Public method to add new gallery items
    addGallery(galleryElement) {
        const items = galleryElement.querySelectorAll(this.options.children);
        const galleryItems = [];
        const galleryIndex = this.galleries.length;

        items.forEach((item, itemIndex) => {
            const img = item.querySelector('img');
            const href = item.getAttribute('href');

            if (img && href) {
                const galleryItem = {
                    element: item,
                    img: img,
                    src: href,
                    ratio: parseFloat(img.getAttribute('data-ratio')) || 1,
                    width: parseInt(img.getAttribute('data-pswp-width')) || 800,
                    height: parseInt(img.getAttribute('data-pswp-height')) || 600,
                    galleryIndex: galleryIndex,
                    itemIndex: itemIndex
                };

                galleryItems.push(galleryItem);

                // Add click event
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.open(galleryItems, itemIndex);
                });

                // Setup lazy loading for new images
                if (img.getAttribute('data-src')) {
                    this.intersectionObserver.observe(img);
                }
            }
        });

        this.galleries.push(galleryItems);
        return galleryIndex;
    }

    // Destroy the gallery and clean up
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }

        if (this.lightbox) {
            this.lightbox.remove();
        }

        // Remove event listeners
        this.galleries.forEach(gallery => {
            gallery.forEach(item => {
                const newElement = item.element.cloneNode(true);
                item.element.parentNode.replaceChild(newElement, item.element);
            });
        });

        this.galleries = [];
    }
}

// Auto-initialize if not using module system
if (typeof window !== 'undefined' && !window.CustomGallery) {
    window.CustomGallery = CustomGallery;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomGallery;
}
