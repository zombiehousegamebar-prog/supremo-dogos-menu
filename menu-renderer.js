/**
 * menu-renderer.js
 * Supremo Dogos — Generador de tarjetas HTML a partir de menu-data.js
 *
 * RESPONSABILIDAD:
 *   Lee menuData (definido en menu-data.js) y genera el mismo HTML que
 *   estaba hardcodeado en index.html, insertándolo en los .product-grid
 *   correspondientes a cada sección.
 *
 * ORDEN DE CARGA (index.html):
 *   1. menu-data.js   → define window.menuData / const menuData
 *   2. menu-renderer.js (este archivo) → consume menuData, llena el DOM
 *   3. script.js       → encuentra las tarjetas ya en el DOM
 *
 * El render se ejecuta inmediatamente (IIFE), no en DOMContentLoaded,
 * porque los scripts se cargan al final del <body> cuando el DOM ya existe.
 */

(function () {
    'use strict';

    /* ------------------------------------------------------------------
       MAPA DE ÍCONOS SVG
       Claves definidas en menu-data.js → campo "icon" de cada feature.
       Cada valor es el innerHTML del <svg class="feature-icon">.
    ------------------------------------------------------------------ */
    const ICONS = {
        drumstick: `
            <path d="M12 12c-2.3 2.3-5.7 3.5-8.5 1.4A4.5 4.5 0 0 1 4 7.2c2.1-2.8 3.3-6.2 5.6-8.5C11.5.5 13.5.5 15.3 2.3c2.3 2.3 2.3 6 .8 8.5-.2.4-.4.8-.6 1.2z" />
            <path d="M18.5 18.5c1.2-1.2 3.1-1.2 4.2 0 1.2 1.2 1.2 3.1 0 4.2-1.2 1.2-3.1 1.2-4.2 0" />
            <path d="M14 14l5 5" />`,

        fries: `
            <path d="M5 10V21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
            <path d="M18 10h-2V6M14 10h-2V3M10 10H8V5M6 10H4V8" />
            <path d="M5 10c1.5 2 3.5 3 7 3s5.5-1 7-3" />`,

        sauce: `
            <path d="M12 22a8 8 0 0 0 8-8H4a8 8 0 0 0 8 8z" />
            <line x1="2" y1="14" x2="22" y2="14" />
            <path d="M12 14V6c0-1.1-.9-2-2-2H8" />`,

        nacho: `
            <polygon points="12 3 2 20 22 20" />
            <circle cx="12" cy="14" r="1" fill="currentColor"/>
            <circle cx="9" cy="17" r="1" fill="currentColor"/>
            <circle cx="15" cy="17" r="1" fill="currentColor"/>`,

        beans: `
            <path d="M12 21a9 9 0 0 0 9-9c0-5-4-9-9-9s-9 4-9 9 4 9 9 9z" opacity="0.1" fill="currentColor"/>
            <path d="M8 14c.5-1.5 2-2.5 3.5-2.5s2 1 2.5 2" />
            <path d="M10 11c.25-.75 1-1.25 1.75-1.25s1.25.5 1.5 1" />`,

        cheese: `
            <path d="M3 14L21 6V18L3 18Z" />
            <circle cx="8" cy="15" r="1" fill="currentColor"/>
            <circle cx="13" cy="13" r="1.2" fill="currentColor"/>
            <circle cx="16" cy="16" r="1" fill="currentColor"/>`,

        jalapeno: `
            <path d="M18 3c-1.2 1.2-2.5 3-3.5 5C12.5 9.5 9 12 6.5 15.5c-2.5 3.5-2.5 6.5-1 7.5s4 1.5 7.5-1c3.5-2.5 6-6 7.5-8.5c2-1 3.8-2.3 5-3.5" />
            <path d="M18 3c.5-.5 1-1.5.5-2.5s-2-.5-2.5 0L14.5 2" />`,

        meat: `
            <path d="M12 21c4.4 0 8-3.6 8-8s-3.6-8-8-8-8 3.6-8 8 3.6 8 8 8z" />
            <path d="M12 5c2 2 2 5 0 7s-5 0-7-2" />
            <path d="M14 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor"/>`,

        pico: `
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v18M3 12h18" />
            <circle cx="7.5" cy="7.5" r="1" fill="currentColor"/>
            <circle cx="16.5" cy="7.5" r="1" fill="currentColor"/>
            <circle cx="7.5" cy="16.5" r="1" fill="currentColor"/>
            <circle cx="16.5" cy="16.5" r="1" fill="currentColor"/>`
    };

    /* ------------------------------------------------------------------
       HELPERS
    ------------------------------------------------------------------ */

    /** Devuelve el SVG del ícono dado su nombre */
    function getIconSvg(iconKey) {
        const paths = ICONS[iconKey] || '';
        return `<svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    }

    /** SVG del check mark (✓) usado en combo features */
    function getCheckSvg() {
        return `<svg class="feature-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>`;
    }

    /* ------------------------------------------------------------------
       GENERADORES DE HTML POR TIPO
    ------------------------------------------------------------------ */

    /**
     * Tarjeta estándar con un solo precio.
     * Corresponde a: Clásicos y Especialidades.
     */
    function renderStandardCard(product) {
        const featuredClass = product.featured ? ' product-card-featured' : '';
        const tagHtml = product.tag
            ? `<div class="card-tag">${product.tag}</div>`
            : '';

        return `
<article class="product-card${featuredClass}">
    <span class="card-number" aria-hidden="true">${product.cardNumber}</span>
    ${tagHtml}
    <div class="product-image-container">
        <img src="${product.image}" alt="${product.imageAlt}" class="product-image" loading="lazy">
    </div>
    <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
            <span class="product-price">${product.price}</span>
        </div>
    </div>
</article>`.trim();
    }

    /**
     * Tarjeta con precios dobles (Chica / Grande).
     * Corresponde a: Papas.
     * Soporta el caso especial de Flamin Fries (solo precio Grande).
     */
    function renderPricingDoubleCard(product) {
        const priceTiersHtml = product.prices
            .map(p => `
            <div class="price-tier">
                <span class="price-label">${p.label}</span>
                <span class="product-price price-val">${p.value}</span>
            </div>`)
            .join('');

        return `
<article class="product-card">
    <span class="card-number" aria-hidden="true">${product.cardNumber}</span>
    <div class="product-image-container">
        <img src="${product.image}" alt="${product.imageAlt}" class="product-image" loading="lazy">
    </div>
    <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer pricing-double">
            ${priceTiersHtml}
        </div>
    </div>
</article>`.trim();
    }

    /**
     * Genera el HTML de un feature-item dentro de un combo-block.
     * Soporta el modo "signature" que agrega .signature-item y el badge RECETA DE LA CASA.
     */
    function renderFeatureItem(feature) {
        const itemClass = feature.signature ? ' signature-item' : '';

        let featureTextHtml;
        if (feature.signature && feature.signatureTag) {
            featureTextHtml = `
                <span class="feature-text signature-container">
                    <span class="signature-pill">${feature.text}</span>
                    <span class="signature-tag">${feature.signatureTag}</span>
                </span>`;
        } else {
            featureTextHtml = `<span class="feature-text">${feature.text}</span>`;
        }

        return `
                <div class="feature-item${itemClass}">
                    <span class="feature-icon-wrapper">
                        ${getIconSvg(feature.icon)}
                    </span>
                    ${featureTextHtml}
                    ${getCheckSvg()}
                </div>`;
    }

    /**
     * Genera el HTML de un combo-block completo (sub-opción dentro de combo-card).
     */
    function renderComboBlock(combo) {
        const featuresHtml = combo.features.map(renderFeatureItem).join('');

        return `
                        <div class="combo-block">
                            <div class="combo-header">
                                <h3 class="combo-title"><span class="combo-number">${combo.comboNumber}</span> ${combo.title}</h3>
                                <span class="combo-price">${combo.price}</span>
                            </div>
                            <div class="combo-features">
                                ${featuresHtml}
                            </div>
                        </div>`;
    }

    /**
     * Tarjeta de pantalla completa con múltiples sub-combos.
     * Corresponde a: Boneless y Nachos (product-card-full).
     */
    function renderComboCard(product) {
        const combosHtml = product.combos.map(renderComboBlock).join('\n');

        return `
<article class="product-card product-card-full">
    <span class="card-number" aria-hidden="true">${product.cardNumber}</span>
    <div class="product-image-container">
        <img src="${product.image}" alt="${product.imageAlt}" class="product-image" loading="lazy">
    </div>
    <div class="product-info">
        ${combosHtml}
    </div>
</article>`.trim();
    }

    /**
     * Despacha el renderizado al generador correcto según el tipo del producto.
     */
    function renderProduct(product) {
        switch (product.type) {
            case 'standard':
                return renderStandardCard(product);
            case 'pricing-double':
                return renderPricingDoubleCard(product);
            case 'combo-card':
                return renderComboCard(product);
            default:
                console.warn(`[menu-renderer] Tipo de producto desconocido: "${product.type}"`);
                return '';
        }
    }

    /* ------------------------------------------------------------------
       FUNCIÓN PRINCIPAL: renderMenu()
       Itera sobre menuData.categories, localiza el .product-grid de cada
       sección y le inyecta el HTML generado.
    ------------------------------------------------------------------ */
    function renderMenu() {
        if (typeof menuData === 'undefined') {
            console.error('[menu-renderer] ERROR: menuData no está definido. Asegúrate de cargar menu-data.js antes que menu-renderer.js.');
            return;
        }

        menuData.categories.forEach(function (category) {
            // Busca la sección por su id (coincide con category.id)
            const section = document.getElementById(category.id);
            if (!section) {
                console.warn(`[menu-renderer] No se encontró la sección #${category.id}`);
                return;
            }

            // Busca el .product-grid dentro de esa sección
            const grid = section.querySelector('.product-grid');
            if (!grid) {
                console.warn(`[menu-renderer] No se encontró .product-grid en la sección #${category.id}`);
                return;
            }

            // Genera el HTML de todos los productos de la categoría
            const html = category.products.map(renderProduct).join('\n\n');

            // Inyecta las tarjetas en el grid
            grid.innerHTML = html;
        });

        console.info('[menu-renderer] Menú renderizado correctamente desde menu-data.js.');
    }

    /* ------------------------------------------------------------------
       EJECUTAR
       Se llama directamente aquí (sin esperar DOMContentLoaded) porque
       este script está ubicado al final del <body>, garantizando que el
       DOM ya existe. script.js también está al final del <body> y sí usa
       DOMContentLoaded, por lo que encontrará las tarjetas ya presentes.
    ------------------------------------------------------------------ */
    renderMenu();

})();
