/* ==========================================================================
   SUPREME MENU - LOGIC DE INTERACCIÓN (JS) - VERSIÓN MEJORADA SCROLL SPY
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. SELECTORES DE ELEMENTOS
    const sections = document.querySelectorAll('.menu-section');
    const navLinks = document.querySelectorAll('.nav-link');
    const navContainer = document.querySelector('.nav-categories');
    const header = document.querySelector('.main-header');

    // 3. FUNCIÓN DE CENTRADO HORIZONTAL DEL NAVBAR (SIN BRINCOS VERTICALES)
    // Desplaza de manera segura únicamente el contenedor horizontal del navbar
    function centerActiveLink(activeLink) {
        if (!navContainer || !activeLink) return;
        
        const containerWidth = navContainer.offsetWidth;
        const linkOffset = activeLink.offsetLeft;
        const linkWidth = activeLink.offsetWidth;
        
        // Centra el enlace sumando la mitad del contenedor y restando la mitad de la anchura del link
        navContainer.scrollTo({
            left: linkOffset - (containerWidth / 2) + (linkWidth / 2),
            behavior: 'smooth'
        });
    }

    // 4. FUNCIÓN SCROLL SPY (CONTROL DEL SCROLL Y MENÚ ACTIVO)
    function scrollSpy() {
        const headerHeight = header ? header.offsetHeight : 140;
        const threshold = headerHeight + 50; // Threshold boundary (sticky header + 50px buffer)
        
        let activeSection = null;

        // Special check: omitir secciones ocultas (display: none por categoría inactiva)
        const visibleSections = Array.from(sections).filter(s => s.style.display !== 'none');

        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 60) {
            activeSection = visibleSections[visibleSections.length - 1];
        } else {
            // Find the active section based on scroll position.
            // The active section is the last one whose top boundary has crossed the threshold.
            visibleSections.forEach(section => {
                const sectionTop = section.getBoundingClientRect().top;
                if (sectionTop <= threshold) {
                    activeSection = section;
                }
            });
        }

        // Fallback to the first section if none crossed the threshold (e.g. at the top of the page)
        if (!activeSection && visibleSections.length > 0) {
            activeSection = visibleSections[0];
        }

        // Apply active class and center nav link
        if (activeSection) {
            const currentSectionId = activeSection.getAttribute('id');
            navLinks.forEach(link => {
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    if (!link.classList.contains('active')) {
                        link.classList.add('active');
                        centerActiveLink(link);
                    }
                } else {
                    link.classList.remove('active');
                }
            });
        }
    }

    // 5. ESCUCHAR EVENTO SCROLL CON RENDIMIENTO OPTIMIZADO (requestAnimationFrame)
    let scrollTimeout = null;
    function handleScroll() {
        if (!scrollTimeout) {
            window.requestAnimationFrame(() => {
                scrollSpy();
                checkHeaderScroll();
                scrollTimeout = null;
            });
            scrollTimeout = true;
        }
    }

    window.addEventListener('scroll', handleScroll);
    scrollSpy(); // Initial call to set active tab on load

    // 5.1 CONTROL DE SCROLLED HEADER (Colapsar logo al hacer scroll hacia abajo)
    // Implementa un sistema de histéresis (buffer de scroll) para evitar bucles de temblor (bouncing)
    let isScrolled = false;
    function checkHeaderScroll() {
        if (header) {
            const scrollY = window.scrollY;
            if (!isScrolled && scrollY > 80) {
                isScrolled = true;
                header.classList.add('scrolled');
            } else if (isScrolled && scrollY < 20) {
                isScrolled = false;
                header.classList.remove('scrolled');
            }
        }
    }
    checkHeaderScroll(); // Initial call to set header scrolled state

    // 6. DESPLAZAMIENTO SUAVE PROGRAMÁTICO AL HACER CLIC
    // Evita interferencias y ciclos infinitos entre scrollSpy y el scroll del navegador
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Removemos temporalmente el listener para evitar colisiones visuales de selección
                window.removeEventListener('scroll', handleScroll);
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                centerActiveLink(link);

                // Calcular posición de scroll de forma segura (ir al inicio absoluto 0 si es el primer bloque 'Clásicos')
                let offsetPosition;
                if (targetId === '#classics') {
                    offsetPosition = 0;
                } else {
                    const headerOffset = (header ? header.offsetHeight : 120) + 20; 
                    const elementPosition = targetSection.getBoundingClientRect().top;
                    offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                }

                // Desplazamiento nativo suave del viewport principal
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Volver a habilitar el listener una vez completado el scroll suave
                setTimeout(() => {
                    window.addEventListener('scroll', handleScroll);
                }, 800);
            }
        });
    });

    // 7. POPUP PROMOCIONAL AUTOMÁTICO (UNA VEZ POR SESIÓN DE USUARIO)
    const promoPopup = document.getElementById('promo-popup');
    const closePopupBtn = document.getElementById('close-popup');

    if (promoPopup && closePopupBtn) {
        // Función para abrir la ventana modal
        const showPopup = () => {
            promoPopup.classList.add('show');
            document.body.style.overflow = 'hidden'; // Bloquea el scroll de fondo
        };

        // Función para cerrar la ventana modal
        const closePopup = () => {
            promoPopup.classList.remove('show');
            document.body.style.overflow = ''; // Habilita el scroll nuevamente
        };

        // Mostrar el popup con retardo de 1.5 segundos si no se ha mostrado en la sesión actual
        if (!sessionStorage.getItem('promoShown')) {
            setTimeout(() => {
                showPopup();
                sessionStorage.setItem('promoShown', 'true');
            }, 1500);
        }

        // Asignar controladores de eventos
        closePopupBtn.addEventListener('click', closePopup);
        
        // Cerrar al hacer click fuera del contenido (en el fondo oscuro translúcido)
        promoPopup.addEventListener('click', (e) => {
            if (e.target === promoPopup) {
                closePopup();
            }
        });

        // Cerrar al presionar la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && promoPopup.classList.contains('show')) {
                closePopup();
            }
        });
    }

    // ==========================================================================
    // INTERACCIONES DEPENDIENTES DE PRODUCTOS (SE EJECUTAN TRAS EL RENDER)
    // ==========================================================================
    let productInteractionsInitialized = false;

    function initProductInteractions() {
        if (productInteractionsInitialized) return;
        productInteractionsInitialized = true;

        // A. TARJETAS INTERACTIVAS EN MÓVIL AL HACER SCROLL (EFECTO HOVER AUTOMÁTICO)
        const cardObserverOptions = {
            root: null,
            rootMargin: '-25% 0px -25% 0px', // Franja del centro de la pantalla
            threshold: 0.4                  // 40% de la tarjeta dentro de la franja para activarse
        };

        const cardObserverCallback = (entries) => {
            // En pantallas grandes (desktop), la interacción es por hover normal (CSS)
            if (window.innerWidth >= 900) {
                entries.forEach(entry => entry.target.classList.remove('active-mobile'));
                return;
            }

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active-mobile');
                } else {
                    entry.target.classList.remove('active-mobile');
                }
            });
        };

        const cardObserver = new IntersectionObserver(cardObserverCallback, cardObserverOptions);
        const cards = document.querySelectorAll('.product-card');
        cards.forEach(card => cardObserver.observe(card));

        // B. LÓGICA DEL MODAL DE DETALLE DE PRODUCTO (QUICK VIEW)
        const qvModal = document.getElementById('quickview-modal');
        const qvImage = document.getElementById('qv-image');
        const qvName = document.getElementById('qv-name');
        const qvPrice = document.getElementById('qv-price');
        const qvDescription = document.getElementById('qv-description');
        const qvCloseBtn = document.getElementById('qv-close-btn');
        const qvPrevBtn = document.getElementById('qv-prev-btn');
        const qvNextBtn = document.getElementById('qv-next-btn');
        const qvBox = qvModal ? qvModal.querySelector('.qv-modal-box') : null;
        const qvContentGrid = qvModal ? qvModal.querySelector('.qv-content-grid') : null;

        // Selectores de precio para soporte de papas (doble precio)
        const qvPriceSingleContainer = document.getElementById('qv-price-single-container');
        const qvPriceDoubleContainer = document.getElementById('qv-price-double-container');
        const qvPriceSmall = document.getElementById('qv-price-small');
        const qvPriceLarge = document.getElementById('qv-price-large');

        const productCards = Array.from(document.querySelectorAll('.product-card:not(.product-card-full)'));
        let currentProductIndex = -1;

        function loadProduct(index, isArrowNavigation = false) {
            if (index < 0 || index >= productCards.length) return;
            
            currentProductIndex = index;
            const card = productCards[index];
            
            // Extraer información dinámicamente de la tarjeta original
            const imgEl = card.querySelector('.product-image');
            const titleEl = card.querySelector('.product-title');
            const descEl = card.querySelector('.product-description');
            
            const priceEls = card.querySelectorAll('.product-price');
            const isDouble = priceEls.length === 2;
            
            const imgSrc = imgEl ? imgEl.src : '';
            const imgAlt = imgEl ? imgEl.alt : '';
            const nameText = titleEl ? titleEl.textContent : '';
            const descText = descEl ? descEl.innerHTML : '';
            
            let priceText = '';
            let priceSmallText = '';
            let priceLargeText = '';
            
            if (isDouble) {
                priceSmallText = priceEls[0].textContent;
                priceLargeText = priceEls[1].textContent;
            } else {
                priceText = priceEls[0] ? priceEls[0].textContent : '';
            }
            
            // Función auxiliar para poblar los elementos del modal
            function updateDOMContent() {
                if (qvImage) {
                    qvImage.src = imgSrc;
                    qvImage.alt = imgAlt;
                }
                if (qvName) qvName.textContent = nameText;
                if (qvDescription) qvDescription.innerHTML = descText;
                
                // Alternar la visualización del bloque de precios según corresponda
                if (isDouble) {
                    if (qvPriceSingleContainer) qvPriceSingleContainer.style.display = 'none';
                    if (qvPriceDoubleContainer) qvPriceDoubleContainer.style.display = 'flex';
                    if (qvPriceSmall) qvPriceSmall.textContent = priceSmallText;
                    if (qvPriceLarge) qvPriceLarge.textContent = priceLargeText;
                } else {
                    if (qvPriceDoubleContainer) qvPriceDoubleContainer.style.display = 'none';
                    if (qvPriceSingleContainer) qvPriceSingleContainer.style.display = 'block';
                    if (qvPrice) qvPrice.textContent = priceText;
                }
                
                if (qvContentGrid) qvContentGrid.scrollTop = 0;
            }
            
            if (isArrowNavigation) {
                // Animación de desvanecimiento sutil y rápida para evitar parpadeos bruscos
                const animElements = [qvImage, qvName, qvPrice, qvDescription, qvPriceSmall, qvPriceLarge];
                animElements.forEach(el => {
                    if (el) el.classList.add('switching');
                });
                
                setTimeout(() => {
                    updateDOMContent();
                    
                    animElements.forEach(el => {
                        if (el) el.classList.remove('switching');
                    });
                }, 150);
            } else {
                // Carga instantánea al abrir el modal por primera vez
                updateDOMContent();
            }
        }

        function openModal(index) {
            loadProduct(index, false);
            if (qvModal) {
                qvModal.classList.add('show');
                qvModal.setAttribute('aria-hidden', 'false');
            }
            document.body.classList.add('modal-open');
            
            // Reiniciar transformaciones de arrastre previas
            if (qvBox) {
                qvBox.style.transform = '';
            }
        }

        function closeModal() {
            if (qvModal) {
                qvModal.classList.remove('show');
                qvModal.setAttribute('aria-hidden', 'true');
            }
            document.body.classList.remove('modal-open');
        }

        // Configurar activadores de clics en las tarjetas
        productCards.forEach((card, index) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('a')) return; // Evitar conflictos con enlaces internos
                openModal(index);
            });
            
            // Accesibilidad por teclado
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(index);
                }
            });
        });

        // Controladores de eventos de cierre y navegación
        if (qvCloseBtn) {
            qvCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeModal();
            });
        }

        if (qvPrevBtn) {
            qvPrevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (productCards.length === 0) return;
                const prevIndex = (currentProductIndex - 1 + productCards.length) % productCards.length;
                loadProduct(prevIndex, true);
            });
        }

        if (qvNextBtn) {
            qvNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (productCards.length === 0) return;
                const nextIndex = (currentProductIndex + 1) % productCards.length;
                loadProduct(nextIndex, true);
            });
        }

        if (qvModal) {
            qvModal.addEventListener('click', (e) => {
                // Cerrar al hacer clic en el backdrop de fondo oscuro
                if (e.target === qvModal || e.target.classList.contains('qv-modal-wrapper') || e.target.classList.contains('qv-modal-backdrop')) {
                    closeModal();
                }
            });
        }

        // Navegación por teclado global cuando el modal está activo
        document.addEventListener('keydown', (e) => {
            if (!qvModal || !qvModal.classList.contains('show')) return;
            
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                if (productCards.length === 0) return;
                const prevIndex = (currentProductIndex - 1 + productCards.length) % productCards.length;
                loadProduct(prevIndex, true);
            } else if (e.key === 'ArrowRight') {
                if (productCards.length === 0) return;
                const nextIndex = (currentProductIndex + 1) % productCards.length;
                loadProduct(nextIndex, true);
            }
        });

        // SOPORTE DE GESTOS TÁCTILES PARA MÓVILES (DESLIZAMIENTO E INCLINACIÓN)
        let touchStartX = 0;
        let touchStartY = 0;
        let isDraggingDown = false;
        let activeDrag = false;

        if (qvBox) {
            qvBox.addEventListener('touchstart', (e) => {
                if (window.innerWidth >= 600) return; // Solo gestos en móviles
                
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                isDraggingDown = false;
                activeDrag = false;

                // Verificar si el arrastre vertical es válido (iniciado en jalador, imagen o parte superior del scroll)
                const target = e.target;
                const isOnHandle = target.closest('.qv-swipe-handle');
                const isOnImage = target.closest('.qv-image-section');
                const isOnContent = target.closest('.qv-content-grid');
                
                if (isOnHandle || isOnImage || (isOnContent && qvContentGrid.scrollTop === 0)) {
                    isDraggingDown = true;
                }
            }, { passive: true });

            qvBox.addEventListener('touchmove', (e) => {
                if (window.innerWidth >= 600) return;
                
                const touch = e.touches[0];
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;

                // Si el movimiento es hacia abajo y predominantemente vertical
                if (isDraggingDown && deltaY > 0 && deltaY > Math.abs(deltaX)) {
                    activeDrag = true;
                    if (e.cancelable) e.preventDefault();
                    
                    qvBox.classList.add('no-transition');
                    qvBox.style.transform = `translateY(${deltaY}px)`;
                } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                    // Prevenir el scroll por defecto si es deslizamiento horizontal
                    if (e.cancelable) e.preventDefault();
                }
            }, { passive: false });

            qvBox.addEventListener('touchend', (e) => {
                if (window.innerWidth >= 600) return;
                
                const touch = e.changedTouches[0];
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;

                qvBox.classList.remove('no-transition');

                if (activeDrag) {
                    // Si se arrastró hacia abajo más del umbral (120px), se cierra
                    if (deltaY > 120) {
                        closeModal();
                    } else {
                        // Si no supera el umbral, regresa con transición suave a su posición inicial
                        qvBox.style.transform = '';
                    }
                } else {
                    // Evaluar gestos de navegación horizontal (swipe left/right)
                    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
                        if (productCards.length > 0) {
                            if (deltaX > 0) {
                                // Swipe hacia la derecha -> Producto anterior
                                const prevIndex = (currentProductIndex - 1 + productCards.length) % productCards.length;
                                loadProduct(prevIndex, true);
                            } else {
                                // Swipe hacia la izquierda -> Producto siguiente
                                const nextIndex = (currentProductIndex + 1) % productCards.length;
                                loadProduct(nextIndex, true);
                            }
                        }
                    }
                }
                
                isDraggingDown = false;
                activeDrag = false;
            }, { passive: true });
        }

        // Actualizar scrollSpy con las tarjetas ya renderizadas
        scrollSpy();
    }

    // Escuchar el evento emitido tras el renderizado de tarjetas
    document.addEventListener('supremo:dom-rendered', initProductInteractions);
});

