/**
 * menu-loader.js — Orquestador y normalizador de datos del menú
 * Supremo Dogos
 *
 * Responsabilidades:
 * 1. Consultar /api/menu con un timeout controlado (3.5 segundos con AbortController).
 * 2. Validar que la respuesta sea exitosa y contenga categorías válidas.
 * 3. Normalizar el JSON relacional de Neon DB al formato exacto que consumen
 *    menu-renderer.js y print.js (idéntico a la estructura de menu-data.js).
 * 4. Fallback transparente: si la red, timeout o Neon fallan, devuelve fallbackData.
 *
 * NO ejecuta renderizado automático ni dispara eventos DOM en esta fase.
 */

(function (root, factory) {
    const exportsObj = factory();

    // Compatibilidad CommonJS / Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObj;
    }

    // Compatibilidad Navegador global (window / globalThis)
    if (root) {
        root.normalizeMenuData = exportsObj.normalizeMenuData;
        root.loadMenuData = exportsObj.loadMenuData;
        root.formatMenuPrice = exportsObj.formatMenuPrice;
    }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function () {
    'use strict';

    /**
     * Mapeo de slugs de Neon a IDs y marcas de agua de sección esperadas por el frontend.
     *
     * NOTA TÉCNICA SOBRE CATEGORÍAS NUEVAS/DINÁMICAS:
     * - Las categorías nuevas o con slugs desconocidos pueden normalizarse (usando su slug como id),
     *   pero NO aparecerán automáticamente en el menú público mientras index.html siga usando
     *   secciones <section id="..."> y enlaces de navegación estáticos en su estructura HTML.
     * - Esto deberá resolverse en una fase posterior si se desea permitir la creación y visualización
     *   dinámica de categorías arbitrarias desde el dashboard en el menú web.
     */
    const CATEGORY_SLUG_MAP = {
        'clasicos':       { id: 'classics',    slug: 'CLASSICS' },
        'especialidades': { id: 'specialties', slug: 'SPECIALS' },
        'papas':          { id: 'fries',       slug: 'FRIES' },
        'boneless':       { id: 'boneless',    slug: 'BONELESS' },
        'nachos':         { id: 'nachos',      slug: 'NACHOS' }
    };

    /**
     * Formatea un valor numérico o string a formato de moneda (ej: 130.00 -> "$130").
     * @param {number|string} val
     * @returns {string}
     */
    function formatPrice(val) {
        if (val === null || val === undefined || val === '') return '';
        const cleaned = String(val).replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        if (isNaN(num)) return String(val).trim();
        return num % 1 === 0 ? '$' + num.toFixed(0) : '$' + num.toFixed(2);
    }

    /**
     * Normaliza los datos crudos devueltos por /api/menu al formato exacto de menu-data.js.
     * Preserva estrictamente el orden de categorías, productos, combos y features.
     *
     * @param {object} apiData - Objeto { success: true, categories: [...] }
     * @returns {{ categories: Array }}
     */
    function normalizeMenuData(apiData) {
        if (!apiData || !Array.isArray(apiData.categories)) {
            return { categories: [] };
        }

        const normalizedCategories = apiData.categories.map(function (cat) {
            const rawSlug = (cat.slug || '').toLowerCase().trim();
            const mapped = CATEGORY_SLUG_MAP[rawSlug] || {
                id: rawSlug || cat.id,
                slug: (cat.slug || '').toUpperCase()
            };

            const rawProducts = Array.isArray(cat.products) ? cat.products : [];

            const normalizedProducts = rawProducts.map(function (prod, index) {
                const cardNumber = String(index + 1).padStart(2, '0');
                const image = prod.image_url || '';
                const imageAlt = prod.name || '';
                const tag = (prod.tag && String(prod.tag).trim()) ? String(prod.tag).trim() : null;
                const featured = Boolean(prod.featured);
                const description = prod.description || '';
                const type = prod.type || 'standard';

                // Caso 1: Tarjetas estándar (precio único)
                if (type === 'standard') {
                    return {
                        type: 'standard',
                        cardNumber: cardNumber,
                        tag: tag,
                        featured: featured,
                        name: prod.name || '',
                        description: description,
                        price: formatPrice(prod.price),
                        image: image,
                        imageAlt: imageAlt
                    };
                }

                // Caso 2: Precios dobles (Papas: Chica / Grande)
                if (type === 'pricing-double') {
                    const prices = [];
                    if (prod.price_small !== null && prod.price_small !== undefined && String(prod.price_small).trim() !== '') {
                        prices.push({ label: 'Chica', value: formatPrice(prod.price_small) });
                    }
                    if (prod.price_large !== null && prod.price_large !== undefined && String(prod.price_large).trim() !== '') {
                        prices.push({ label: 'Grande', value: formatPrice(prod.price_large) });
                    }

                    return {
                        type: 'pricing-double',
                        cardNumber: cardNumber,
                        name: prod.name || '',
                        description: description,
                        image: image,
                        imageAlt: imageAlt,
                        prices: prices
                    };
                }

                // Caso 3: Tarjeta con sub-combos y features (Boneless / Nachos)
                if (type === 'combo-card') {
                    const rawCombos = Array.isArray(prod.combos) ? prod.combos : [];
                    const combos = rawCombos.map(function (c) {
                        const rawFeatures = Array.isArray(c.features) ? c.features : [];
                        const features = rawFeatures.map(function (f) {
                            const feat = {
                                icon: f.icon || '',
                                text: f.text || '',
                                signature: Boolean(f.signature)
                            };
                            if (f.signature_tag && String(f.signature_tag).trim()) {
                                feat.signatureTag = String(f.signature_tag).trim();
                            }
                            return feat;
                        });

                        return {
                            comboNumber: c.combo_number !== null && c.combo_number !== undefined ? String(c.combo_number) : '',
                            title: c.name || '',
                            price: formatPrice(c.price),
                            features: features
                        };
                    });

                    return {
                        type: 'combo-card',
                        cardNumber: cardNumber,
                        image: image,
                        imageAlt: imageAlt,
                        combos: combos
                    };
                }

                // Fallback para tipo no contemplado
                return {
                    type: type,
                    cardNumber: cardNumber,
                    name: prod.name || '',
                    description: description,
                    price: formatPrice(prod.price),
                    image: image,
                    imageAlt: imageAlt
                };
            });

            return {
                id: mapped.id,
                slug: mapped.slug,
                name: cat.name || '',
                navLabel: cat.name || '',
                products: normalizedProducts
            };
        });

        return {
            categories: normalizedCategories
        };
    }

    /**
     * Carga los datos del menú consultando /api/menu con timeout de 3.5 segundos.
     * Si la petición falla o la respuesta no es válida, retorna fallbackData sin interrumpir la UI.
     *
     * @param {object} [fallbackData] - Objeto con estructura { categories: [...] } para respaldo
     * @returns {Promise<object>} Objeto normalizado compatible con menu-renderer.js y print.js
     */
    async function loadMenuData(fallbackData) {
        // Resuelve fallbackData si fue provisto explícitamente o si existe menuData en el entorno
        const fallback = fallbackData || (typeof menuData !== 'undefined' ? menuData : null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(function () {
                controller.abort();
            }, 3500);

            const response = await fetch('/api/menu', {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ' ' + response.statusText);
            }

            const data = await response.json();

            if (!data || data.success !== true || !Array.isArray(data.categories) || data.categories.length === 0) {
                throw new Error('Respuesta inválida o lista de categorías vacía');
            }

            const normalized = normalizeMenuData(data);

            if (!normalized || !Array.isArray(normalized.categories) || normalized.categories.length === 0) {
                throw new Error('Normalización sin categorías resultantes');
            }

            return normalized;
        } catch (err) {
            console.warn('[menu-loader] Falla al obtener /api/menu (' + err.message + '). Usando fallback.');
            if (fallback) {
                return fallback;
            }
            throw err;
        }
    }

    return {
        normalizeMenuData: normalizeMenuData,
        loadMenuData: loadMenuData,
        formatMenuPrice: formatPrice
    };
});
