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
            // Swipe options
            swipeToNavigate: true,
            swipeThreshold: 40,
            fastSwipeThreshold: 25,
            fastSwipeTime: 250,
            showSwipeIndicators: true,
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
        this.originalScrollPosition = 0;
        this.clickedElement = null;
        this.imageCache = new Map(); // Cache for loaded images

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
                        this.open(galleryItems, itemIndex, item);
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
        if (!this.options.swipeToNavigate) return;

        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let touchStartTime = 0;
        let isSwiping = false;
        let isDragging = false;
        let swipeDirection = null;
        let initialDistance = 0;
        let currentDistance = 0;

        // Use configurable thresholds
        const SWIPE_THRESHOLD = this.options.swipeThreshold;
        const FAST_SWIPE_THRESHOLD = this.options.fastSwipeThreshold;
        const FAST_SWIPE_TIME = this.options.fastSwipeTime;
        const VERTICAL_CLOSE_THRESHOLD = 80;

        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            currentX = startX;
            currentY = startY;
            touchStartTime = Date.now();
            isSwiping = false;
            isDragging = false;
            swipeDirection = null;
            initialDistance = 0;
            currentDistance = 0;

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

            // Determine swipe direction if not already set
            if (!swipeDirection && (absX > 10 || absY > 10)) {
                if (absX > absY) {
                    swipeDirection = 'horizontal';
                } else {
                    swipeDirection = 'vertical';
                }
            }

            // Handle horizontal swipe (navigation)
            if (swipeDirection === 'horizontal') {
                isSwiping = true;
                e.preventDefault();

                // Calculate swipe progress (0 to 1)
                const maxSwipeDistance = window.innerWidth * 0.3; // 30% of screen width
                const progress = Math.min(absX / maxSwipeDistance, 1);

                // Visual feedback with scaling and opacity
                const scale = 1 - (progress * 0.1); // Slight scale down
                const opacity = Math.max(0.4, 1 - progress * 0.4);
                const translateX = deltaX * 0.8; // Damped movement

                this.lightboxContent.style.transform = `translateX(${translateX}px) scale(${scale})`;
                this.lightbox.style.backgroundColor = `rgba(0, 0, 0, ${opacity * 0.9})`;

                // Add visual indicator for next/prev image
                this.showSwipeIndicator(deltaX > 0 ? 'prev' : 'next', progress);

            } else if (swipeDirection === 'vertical' && this.options.closeOnVerticalDrag) {
                // Vertical drag to close
                isDragging = true;
                e.preventDefault();

                const maxDragDistance = window.innerHeight * 0.25; // 25% of screen height
                const progress = Math.min(absY / maxDragDistance, 1);
                const opacity = Math.max(0.2, 1 - progress * 0.6);
                const scale = Math.max(0.8, 1 - progress * 0.2);

                this.lightboxContent.style.transform = `translateY(${deltaY}px) scale(${scale})`;
                this.lightbox.style.backgroundColor = `rgba(0, 0, 0, ${opacity * 0.9})`;
            }
        };

        const handleTouchEnd = (e) => {
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            const touchTime = Date.now() - touchStartTime;
            const isFastSwipe = touchTime < FAST_SWIPE_TIME;

            this.lightboxContent.style.transition = '';
            this.hideSwipeIndicator();

            if (isSwiping) {
                // Handle horizontal swipe for navigation
                const shouldNavigate = absX > SWIPE_THRESHOLD || (isFastSwipe && absX > FAST_SWIPE_THRESHOLD);

                if (shouldNavigate) {
                    if (deltaX > 0) {
                        this.prev();
                    } else {
                        this.next();
                    }
                } else {
                    // Reset position with smooth animation
                    this.lightboxContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    this.lightboxContent.style.transform = '';
                    this.lightbox.style.backgroundColor = '';

                    // Remove transition after animation
                    setTimeout(() => {
                        this.lightboxContent.style.transition = '';
                    }, 300);
                }
            } else if (isDragging) {
                // Handle vertical drag to close
                const shouldClose = absY > VERTICAL_CLOSE_THRESHOLD || (isFastSwipe && absY > 40);

                if (shouldClose) {
                    this.close();
                } else {
                    // Reset position with smooth animation
                    this.lightboxContent.style.transition = 'transform 0.3s ease';
                    this.lightboxContent.style.transform = '';
                    this.lightbox.style.backgroundColor = '';

                    setTimeout(() => {
                        this.lightboxContent.style.transition = '';
                    }, 300);
                }
            }

            // Reset variables
            isSwiping = false;
            isDragging = false;
            swipeDirection = null;
        };

        // Add touch event listeners
        this.lightboxContent.addEventListener('touchstart', handleTouchStart, { passive: false });
        this.lightboxContent.addEventListener('touchmove', handleTouchMove, { passive: false });
        this.lightboxContent.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Mouse events for desktop drag
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

    open(items, index = 0, clickedElement = null) {
        console.log('Opening gallery with', items.length, 'items at index', index);

        this.items = items;
        this.currentIndex = index;
        this.isOpen = true;
        this.clickedElement = clickedElement;

        if (!this.lightbox) {
            console.error('Lightbox not found when trying to open');
            return;
        }

        // Store current scroll position before fixing body
        this.originalScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        // Prevent body scrolling on mobile while preserving scroll position
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this.originalScrollPosition}px`;
        document.body.style.width = '100%';

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

        // Get the current scroll position from the body's top style
        const currentScrollPosition = Math.abs(parseInt(document.body.style.top) || 0);

        // Restore body scrolling
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';

        // Restore to the exact position without any jumping
        window.scrollTo(0, currentScrollPosition);

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

        // Clear the clicked element reference
        this.clickedElement = null;
    }

    prev() {
        console.log('Previous image');
        if (!this.options.loop && this.currentIndex === 0) return;

        // Add smooth transition effect
        this.lightboxContent.style.transition = 'transform 0.3s ease';
        this.lightboxContent.style.transform = 'translateX(100px)';

        setTimeout(() => {
            this.currentIndex = this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex - 1;
            this.loadCurrentImage();
            this.updateCounter();
            this.updateNavigation();
            this.resetZoom();

            // Reset transform after loading - reduce delay since images are cached
            this.lightboxContent.style.transform = 'translateX(-100px)';
            setTimeout(() => {
                this.lightboxContent.style.transform = '';
                setTimeout(() => {
                    this.lightboxContent.style.transition = '';
                }, 200); // Reduced from 300ms
            }, 30); // Reduced from 50ms
        }, 100); // Reduced from 150ms
    }

    next() {
        console.log('Next image');
        if (!this.options.loop && this.currentIndex === this.items.length - 1) return;

        // Add smooth transition effect
        this.lightboxContent.style.transition = 'transform 0.3s ease';
        this.lightboxContent.style.transform = 'translateX(-100px)';

        setTimeout(() => {
            this.currentIndex = this.currentIndex === this.items.length - 1 ? 0 : this.currentIndex + 1;
            this.loadCurrentImage();
            this.updateCounter();
            this.updateNavigation();
            this.resetZoom();

            // Reset transform after loading - reduce delay since images are cached
            this.lightboxContent.style.transform = 'translateX(100px)';
            setTimeout(() => {
                this.lightboxContent.style.transform = '';
                setTimeout(() => {
                    this.lightboxContent.style.transition = '';
                }, 200); // Reduced from 300ms
            }, 30); // Reduced from 50ms
        }, 100); // Reduced from 150ms
    }

    loadCurrentImage() {
        const currentItem = this.items[this.currentIndex];
        console.log('Loading image:', currentItem.src);
        console.log('Cache has image:', this.imageCache.has(currentItem.src));
        console.log('Cache size:', this.imageCache.size);

        // Check if image is already cached
        if (this.imageCache.has(currentItem.src)) {
            console.log('Loading from cache (no network request):', currentItem.src);
            const cachedData = this.imageCache.get(currentItem.src);

            // Use the cached image source directly
            this.lightboxImage.src = cachedData.src;
            this.lightboxImage.style.opacity = '1';
            this.lightboxLoader.style.display = 'none';

            // Preload adjacent images
            this.preloadAdjacentImages();
            return;
        }

        // Show loader for new images
        console.log('Loading new image (network request):', currentItem.src);
        this.lightboxLoader.style.display = 'block';
        this.lightboxImage.style.opacity = '0';

        const img = new Image();
        img.onload = () => {
            // Cache the loaded image (simple caching without CORS requirements)
            this.imageCache.set(currentItem.src, {
                img: img,
                src: currentItem.src,
                loaded: true
            });

            console.log('Cached new image:', currentItem.src, 'Cache size now:', this.imageCache.size);

            this.lightboxImage.src = img.src;
            this.lightboxImage.style.opacity = '1';
            this.lightboxLoader.style.display = 'none';

            // Preload adjacent images after current image loads
            this.preloadAdjacentImages();
        };
        img.onerror = () => {
            this.lightboxLoader.style.display = 'none';
            console.error('Failed to load image:', currentItem.src);
        };
        img.src = currentItem.src;
    }

    preloadAdjacentImages() {
        // Preload next and previous images for smooth navigation
        const preloadIndexes = [];

        // Add next image
        if (this.currentIndex < this.items.length - 1) {
            preloadIndexes.push(this.currentIndex + 1);
        } else if (this.options.loop && this.items.length > 1) {
            preloadIndexes.push(0);
        }

        // Add previous image
        if (this.currentIndex > 0) {
            preloadIndexes.push(this.currentIndex - 1);
        } else if (this.options.loop && this.items.length > 1) {
            preloadIndexes.push(this.items.length - 1);
        }

        // Preload the images
        preloadIndexes.forEach(index => {
            const item = this.items[index];
            if (item && !this.imageCache.has(item.src)) {
                console.log('Preloading image:', item.src);
                const img = new Image();
                img.onload = () => {
                    // Simple caching without CORS requirements
                    this.imageCache.set(item.src, {
                        img: img,
                        src: item.src,
                        loaded: true
                    });
                    console.log('Preloaded image:', item.src, 'Cache size now:', this.imageCache.size);
                };
                img.onerror = () => {
                    console.warn('Failed to preload image:', item.src);
                };
                img.src = item.src;
            } else if (item) {
                console.log('Image already cached:', item.src);
            }
        });
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

    showSwipeIndicator(direction, progress) {
        if (!this.options.showSwipeIndicators) return;

        let indicator = this.lightbox.querySelector('.swipe-indicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'swipe-indicator';
            this.lightbox.appendChild(indicator);
        }

        const opacity = Math.min(progress * 2, 1);
        const isNext = direction === 'next';

        // Check if navigation is possible in this direction
        const canNavigate = this.options.loop ||
            (isNext && this.currentIndex < this.items.length - 1) ||
            (!isNext && this.currentIndex > 0);

        if (!canNavigate) {
            indicator.style.opacity = '0';
            return;
        }

        const nextIndex = isNext ?
            (this.currentIndex === this.items.length - 1 ? 0 : this.currentIndex + 1) :
            (this.currentIndex === 0 ? this.items.length - 1 : this.currentIndex - 1);

        indicator.innerHTML = `
            <div class="swipe-arrow ${direction}">
                ${isNext ? '→' : '←'}
            </div>
            <div class="swipe-text">
                ${isNext ? 'Next' : 'Previous'}
                ${this.items.length > 1 ? `(${nextIndex + 1}/${this.items.length})` : ''}
            </div>
        `;

        indicator.style.opacity = opacity;
        indicator.style.left = isNext ? '70%' : '30%';
        indicator.style.transform = 'translateX(-50%)';
    }

    hideSwipeIndicator() {
        const indicator = this.lightbox.querySelector('.swipe-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 200);
        }
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
                    this.open(galleryItems, itemIndex, item);
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

        // Clear image cache
        this.imageCache.clear();

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
