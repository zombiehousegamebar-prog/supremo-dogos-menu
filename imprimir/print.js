/**
 * print.js — Supremo Dogos / Módulo de Impresión
 * Fase 3: /imprimir
 *
 * Responsabilidades:
 *   1. Leer menuData (definido en ../menu-data.js como fuente única de verdad)
 *   2. Generar un arreglo de "páginas" distribuyendo categorías y productos
 *      de forma inteligente (sin cortar tarjetas, sin dejar títulos solos)
 *   3. Renderizar cada página como una <hoja carta> en el DOM
 *   4. Manejar la vista previa: mostrar una página a la vez con escala
 *   5. Navegación anterior / siguiente
 *   6. window.print() al presionar IMPRIMIR MENÚ
 *
 * FLUJO DE DATOS:
 *   menu-data.js → menuData (global)
 *       └──> print.js → construye páginas → DOM
 *
 * NO importa nada desde menu-renderer.js.
 * NO modifica nada en index.html principal.
 *
 * ──────────────────────────────────────────────
 * CORRECCIONES APLICADAS (Fase 3 Fix):
 *
 * CORRECCIÓN 1 — GAP:
 *   Se eliminó el gap CSS del flex container (.sheet-body { gap: 10mm }).
 *   En su lugar, cada bloque del DOM lleva su propio margin-bottom declarado
 *   en CSS (.sheet-section-block { margin-bottom: 10mm }).
 *   El último bloque de la página NO lleva margin-bottom (clase .last-block).
 *   Esto hace que el motor pueda contabilizar el espaciado de forma exacta:
 *   cada bloque suma su altura + 10mm de separación, EXCEPTO el último.
 *
 * CORRECCIÓN 2 — OVERFLOW:
 *   Se eliminó overflow: hidden del .sheet-body.
 *   En su lugar, .menu-sheet tiene overflow: hidden (para recorte decorativo)
 *   pero el motor garantiza que ninguna página exceda pageUsableHeight.
 *   Se agrega la clase .overflow-safe al sheet para debugging visual.
 *
 * CORRECCIÓN 3 — CLÁSICOS (CONT.):
 *   Cuando una categoría se divide entre páginas, la página siguiente
 *   recibe un bloque { type: 'category-header', isContinuation: true }
 *   que renderiza "CLÁSICOS (CONT.)" con el mismo estilo visual.
 *   El motor contabiliza esta altura dentro del cálculo de paginación.
 * ──────────────────────────────────────────────
 */

(function () {
    'use strict';

    /* ============================================================
       CONSTANTES DE LAYOUT
       Medidas en mm calibradas contra el CSS real.

       La hoja carta tiene 11in = 279.4mm.

       Estructura real del .menu-sheet (flex column):
         1. .sheet-header     → 18mm  (padding 10px+8px + contenido logo/texto)
         2. .sheet-header-bar → 1mm   (height: 3px ≈ 0.79mm, redondeo a 1mm)
         3. .sheet-body       → área útil (ver abajo)
         4. .sheet-footer     → 8mm   (padding 4px top/bottom + border 2px + texto)

       .sheet-body:
         padding-top:    10mm
         padding-bottom: 15mm
         → padding total sheet-body: 25mm

       Área útil del body (donde viven los bloques de contenido):
         279.4 - 18 - 1 - 8 - 25 = 227.4mm → redondeamos a 227mm

       Estrategia de espaciado (CORRECCIÓN 1):
         Cada bloque de contenido (header de categoría o grilla de productos)
         lleva margin-bottom: 10mm en CSS, EXCEPTO el último bloque de la
         página. El motor suma este margen en la contabilización de altura,
         sin sumar el margen del último bloque.

       Resumen de alturas de bloque (SIN el margin-bottom de separación):
         categoryHeaderH:  12mm  (título Bebas Neue 1.55rem + sch-line + margin-bottom: 2mm)
         BLOQUE_GAP:       10mm  (margin-bottom entre bloques, controlado por JS)
         standardCardH:    68mm  (tarjeta estándar, 2 columnas)
         pricingCardH:     68mm  (tarjeta de precios dobles, 3 columnas)
         comboCardH:       95mm  (tarjeta combo, 1 columna, min-height: 80mm + paddings)

       Notas:
         · Un "bloque de layout" es: un category-header O una grilla completa.
         · El JS agrupa todas las filas consecutivas del mismo tipo en una grilla.
         · Un bloque de grilla tiene altura = N_filas × cardH + (N_filas-1) × gridGap.
         · El gridGap (gap interno de la grilla CSS: 6mm) ya está incluido en cardH
           estimado, pues las filas son independientes para el motor y solo hay
           1 row por bloque product-row, entonces la grilla renderizada tiene
           siempre 1 sola fila de tarjetas con N cols y NO hay gap vertical.
    ============================================================ */
    var LAYOUT = {
        pageUsableHeight: 227,   // mm disponibles en el body de la hoja (calibrado)
        categoryHeaderH:  12,    // mm que ocupa el título de categoría (sin margin separador)
        blockGap:         10,    // mm de separación entre bloques (margin-bottom en CSS)
        standardCardH:    68,    // mm de una tarjeta estándar (2col, 1 fila)
        pricingCardH:     68,    // mm de una tarjeta de precios dobles (3col, 1 fila)
        comboCardH:       95,    // mm de una tarjeta de combo (1col, full-width)
    };

    /* Cuántos productos caben por fila en cada tipo de tarjeta */
    var COLS = {
        'standard':       2,
        'pricing-double': 3,
        'combo-card':     1,
    };

    /* ============================================================
       ÍCONOS SVG (igual que menu-renderer.js pero para contexto de impresión)
    ============================================================ */
    var ICONS = {
        drumstick: '<path d="M12 12c-2.3 2.3-5.7 3.5-8.5 1.4A4.5 4.5 0 0 1 4 7.2c2.1-2.8 3.3-6.2 5.6-8.5C11.5.5 13.5.5 15.3 2.3c2.3 2.3 2.3 6 .8 8.5-.2.4-.4.8-.6 1.2z" /><path d="M18.5 18.5c1.2-1.2 3.1-1.2 4.2 0 1.2 1.2 1.2 3.1 0 4.2-1.2 1.2-3.1 1.2-4.2 0" /><path d="M14 14l5 5" />',
        fries:     '<path d="M5 10V21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /><path d="M18 10h-2V6M14 10h-2V3M10 10H8V5M6 10H4V8" /><path d="M5 10c1.5 2 3.5 3 7 3s5.5-1 7-3" />',
        sauce:     '<path d="M12 22a8 8 0 0 0 8-8H4a8 8 0 0 0 8 8z" /><line x1="2" y1="14" x2="22" y2="14" /><path d="M12 14V6c0-1.1-.9-2-2-2H8" />',
        nacho:     '<polygon points="12 3 2 20 22 20" /><circle cx="12" cy="14" r="1" fill="currentColor"/><circle cx="9" cy="17" r="1" fill="currentColor"/><circle cx="15" cy="17" r="1" fill="currentColor"/>',
        beans:     '<path d="M12 21a9 9 0 0 0 9-9c0-5-4-9-9-9s-9 4-9 9 4 9 9 9z" opacity="0.1" fill="currentColor"/><path d="M8 14c.5-1.5 2-2.5 3.5-2.5s2 1 2.5 2" /><path d="M10 11c.25-.75 1-1.25 1.75-1.25s1.25.5 1.5 1" />',
        cheese:    '<path d="M3 14L21 6V18L3 18Z" /><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="13" cy="13" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/>',
        jalapeno:  '<path d="M18 3c-1.2 1.2-2.5 3-3.5 5C12.5 9.5 9 12 6.5 15.5c-2.5 3.5-2.5 6.5-1 7.5s4 1.5 7.5-1c3.5-2.5 6-6 7.5-8.5c2-1 3.8-2.3 5-3.5" /><path d="M18 3c.5-.5 1-1.5.5-2.5s-2-.5-2.5 0L14.5 2" />',
        meat:      '<path d="M12 21c4.4 0 8-3.6 8-8s-3.6-8-8-8-8 3.6-8 8 3.6 8 8 8z" /><path d="M12 5c2 2 2 5 0 7s-5 0-7-2" /><path d="M14 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor"/>',
        pico:      '<circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /><circle cx="7.5" cy="7.5" r="1" fill="currentColor"/><circle cx="16.5" cy="7.5" r="1" fill="currentColor"/><circle cx="7.5" cy="16.5" r="1" fill="currentColor"/><circle cx="16.5" cy="16.5" r="1" fill="currentColor"/>'
    };

    function getIconSvg(iconKey) {
        var paths = ICONS[iconKey] || '';
        return '<svg class="pi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
    }

    /* ============================================================
       MOTOR DE PAGINACIÓN
       Distribuye categorías y productos en páginas, respetando:
         - No cortar tarjetas entre páginas
         - No dejar título de categoría solo al final de una página
         - Respetar el límite de altura calibrado (pageUsableHeight)
         - Mantener el orden de categorías y productos
         - Contabilizar el blockGap (margin-bottom entre bloques)
         - Agregar encabezado de continuación cuando una categoría
           se divide entre páginas

       LÓGICA DE CONTABILIZACIÓN DE ALTURAS:
         Al añadir cada bloque se suma: altura_bloque + LAYOUT.blockGap
         El último bloque de la página NO suma el gap (no hay nada debajo).
         Al verificar si "cabe" un bloque, se evalúa si:
           usedH + altura_bloque + LAYOUT.blockGap ≤ pageUsableHeight
         ...pero si sería el último bloque (sin nada más), no sumamos el gap.
         Para seguridad, siempre sumamos el gap en la verificación (conservador),
         excepto cuando sabemos que es el único bloque pendiente en la categoría.
    ============================================================ */

    /**
     * Devuelve la altura en mm que ocupa una fila de N productos del tipo dado.
     * Esta altura NO incluye el blockGap; el gap se suma por separado.
     */
    function cardRowHeight(type) {
        switch (type) {
            case 'standard':       return LAYOUT.standardCardH;
            case 'pricing-double': return LAYOUT.pricingCardH;
            case 'combo-card':     return LAYOUT.comboCardH;
            default:               return LAYOUT.standardCardH;
        }
    }

    /**
     * Construye el arreglo de páginas.
     * Cada página es un arreglo de "bloques":
     *   { type: 'category-header', categoryId, categoryName, isContinuation }
     *   { type: 'product-row', products: [...], productType }
     *
     * El algoritmo avanza por categorías y, dentro de cada categoría,
     * por filas de productos, empujando todo a la página actual y
     * creando una página nueva cuando no cabe el siguiente elemento.
     *
     * CONTABILIZACIÓN DE ALTURA:
     *   - usedH representa el espacio consumido incluyendo los gaps intermedios.
     *   - Al añadir un bloque: usedH += bloque_h + LAYOUT.blockGap
     *   - Al terminar la página, el último bloque "devuelve" su gap (no tiene nada debajo),
     *     pero el motor NO hace ese ajuste porque trabaja de forma conservadora
     *     (la página siempre tendrá al menos blockGap mm de espacio libre al final).
     *     Esto es intencional: garantiza margen de seguridad.
     */
    function buildPages(categories) {
        var pages   = [];
        var current = [];    // bloques de la página actual
        var usedH   = 0;     // mm usados en la página actual

        /** Cierra la página actual y abre una nueva. */
        function newPage() {
            if (current.length > 0) {
                pages.push(current);
            }
            current = [];
            usedH   = 0;
        }

        /**
         * Añade un bloque a la página actual.
         * Siempre suma altura + blockGap (conservador).
         */
        function addBlock(block, blockH) {
            current.push(block);
            usedH += blockH + LAYOUT.blockGap;
        }

        categories.forEach(function (category) {
            var cols       = COLS[category.products[0] && category.products[0].type] || 2;
            var products   = category.products;

            /* ---- HEADER DE CATEGORÍA ---- */
            var headerH    = LAYOUT.categoryHeaderH;
            var firstRowH  = cardRowHeight(products[0] ? products[0].type : 'standard');

            /*
             * Regla anti-huérfano: no dejar el header solo.
             * Verificamos si caben: header + gap + primera fila + gap.
             * Si no cabe, iniciamos nueva página.
             * NOTA: Si el header se mueve a una página nueva, NO es una
             * continuación — es la primera apertura de esa categoría.
             */
            var headerPlusFirstRow = headerH + LAYOUT.blockGap + firstRowH + LAYOUT.blockGap;
            if (usedH > 0 && usedH + headerPlusFirstRow > LAYOUT.pageUsableHeight) {
                newPage();
            }

            addBlock(
                {
                    type:           'category-header',
                    categoryId:     category.id,
                    categoryName:   category.name,
                    isContinuation: false   // el header de apertura NUNCA es continuación
                },
                headerH
            );

            /* ---- FILAS DE PRODUCTOS ---- */
            for (var i = 0; i < products.length; i += cols) {
                var row     = products.slice(i, i + cols);
                var rHeight = cardRowHeight(row[0].type);

                /*
                 * Si esta fila no cabe, creamos nueva página y añadimos
                 * un encabezado de continuación antes de la fila.
                 */
                var needed = rHeight + LAYOUT.blockGap;
                if (usedH + needed > LAYOUT.pageUsableHeight) {
                    newPage();

                    /* Encabezado de continuación en la nueva página */
                    addBlock(
                        {
                            type:           'category-header',
                            categoryId:     category.id,
                            categoryName:   category.name,
                            isContinuation: true
                        },
                        headerH
                    );
                }

                addBlock(
                    { type: 'product-row', products: row, productType: row[0].type },
                    rHeight
                );
            }
        });

        /* Guardar la última página si tiene contenido */
        if (current.length > 0) {
            pages.push(current);
        }

        return pages;
    }

    /* ============================================================
       GENERADORES DE HTML PARA TARJETAS DE IMPRESIÓN
    ============================================================ */

    /** Tarjeta estándar (Clásicos, Especialidades) */
    function renderPrintStandard(product) {
        var tagHtml = product.tag
            ? '<span class="spc-tag">' + product.tag + '</span>'
            : '';
        var imgSrc = product.image.replace('./images/', '../images/');

        return [
            '<article class="spc spc-dogo">',
            '  <div class="spc-img-wrap">',
            '    <img src="' + imgSrc + '" alt="' + escHtml(product.imageAlt) + '" class="spc-img">',
            '  </div>',
            '  <div class="spc-body">',
            '    <div class="spc-name">' + escHtml(product.name) + '</div>',
            '    <div class="spc-desc">' + escHtml(product.description) + '</div>',
            '    <div class="spc-footer">',
            '      <span class="spc-price">' + escHtml(product.price) + '</span>',
            '      ' + tagHtml,
            '    </div>',
            '  </div>',
            '</article>'
        ].join('\n');
    }

    /** Tarjeta de precios dobles (Papas) */
    function renderPrintPricingDouble(product) {
        var imgSrc = product.image.replace('./images/', '../images/');
        var tiersHtml = product.prices.map(function (p) {
            return [
                '<div class="spc-price-tier">',
                '  <span class="spc-price-label">' + escHtml(p.label) + '</span>',
                '  <span class="spc-price-val">' + escHtml(p.value) + '</span>',
                '</div>'
            ].join('');
        }).join('');

        return [
            '<article class="spc spc-papa">',
            '  <div class="spc-img-wrap">',
            '    <img src="' + imgSrc + '" alt="' + escHtml(product.imageAlt) + '" class="spc-img">',
            '  </div>',
            '  <div class="spc-body">',
            '    <div class="spc-name">' + escHtml(product.name) + '</div>',
            '    <div class="spc-desc">' + escHtml(product.description) + '</div>',
            '    <div class="spc-footer">',
            '      <div class="spc-prices-row">' + tiersHtml + '</div>',
            '    </div>',
            '  </div>',
            '</article>'
        ].join('\n');
    }

    /** Feature item de un combo block */
    function renderPrintFeature(feature) {
        var dotHtml = '<span class="spc-feature-dot"></span>';
        var textHtml;

        if (feature.signature && feature.signatureTag) {
            textHtml = '<span class="spc-signature-pill">' + escHtml(feature.text) + '</span>' +
                       '<span class="spc-signature-tag">' + escHtml(feature.signatureTag) + '</span>';
        } else {
            textHtml = escHtml(feature.text);
        }

        var sigClass = feature.signature ? ' is-signature' : '';
        return [
            '<div class="spc-feature-item' + sigClass + '">',
            '  ' + dotHtml,
            '  ' + textHtml,
            '</div>'
        ].join('');
    }

    /** Un bloque de combo dentro de la tarjeta combo */
    function renderPrintComboBlock(combo) {
        var featuresHtml = combo.features.map(renderPrintFeature).join('');
        return [
            '<div class="spc-combo-block">',
            '  <div class="spc-combo-header">',
            '    <span class="spc-combo-number">' + escHtml(combo.comboNumber) + '</span>',
            '    <span class="spc-combo-title">' + escHtml(combo.title) + '</span>',
            '    <span class="spc-combo-price">' + escHtml(combo.price) + '</span>',
            '  </div>',
            '  <div class="spc-combo-features">',
            '    ' + featuresHtml,
            '  </div>',
            '</div>'
        ].join('\n');
    }

    /** Tarjeta de combos (Boneless, Nachos) */
    function renderPrintComboCard(product) {
        var imgSrc   = product.image.replace('./images/', '../images/');
        var combosHtml = product.combos.map(renderPrintComboBlock).join('\n');

        return [
            '<article class="spc-combo">',
            '  <div class="spc-combo-img-col">',
            '    <img src="' + imgSrc + '" alt="' + escHtml(product.imageAlt) + '" class="spc-combo-img">',
            '  </div>',
            '  <div class="spc-combo-content">',
            '    ' + combosHtml,
            '  </div>',
            '</article>'
        ].join('\n');
    }

    /** Despacha al renderizador correcto */
    function renderPrintProduct(product) {
        switch (product.type) {
            case 'standard':       return renderPrintStandard(product);
            case 'pricing-double': return renderPrintPricingDouble(product);
            case 'combo-card':     return renderPrintComboCard(product);
            default:
                console.warn('[print.js] Tipo desconocido:', product.type);
                return '';
        }
    }

    /* ============================================================
       GENERADOR DE HTML DE UNA HOJA CARTA COMPLETA
    ============================================================ */

    /**
     * Devuelve el HTML completo de una hoja carta a partir de sus bloques.
     * pageNum y totalPages se usan para el badge del header.
     */
    function renderSheet(blocks, pageNum, totalPages) {

        /* ----------------------------------------------------------
           PORTADA (página especial)
           Se detecta cuando blocks es el centinela de portada.
        ---------------------------------------------------------- */
        if (blocks === 'cover') {
            return [
                '<div class="menu-sheet cover-sheet">',

                /* Imagen de fondo */
                '  <div class="cs-bg">',
                '    <img src="../images/BONELESSSUPREMOS.png" alt="" class="cs-bg-img">',
                '    <div class="cs-bg-overlay"></div>',
                '  </div>',

                /* Contenido central */
                '  <div class="cs-content">',

                '    <div class="cs-logo-wrap">',
                '      <img src="../images/logo.png" alt="Supremo Dogos" class="cs-logo">',
                '    </div>',

                '    <div class="cs-brand">',
                '      <span class="cs-brand-accent">SUPREMO</span>DOGOS',
                '    </div>',

                '    <div class="cs-divider"></div>',

                '    <div class="cs-menu-label">MENÚ</div>',

                '    <div class="cs-cats">DOGOS · PAPAS · NACHOS · BONELESS</div>',

                '    <div class="cs-tagline">EL SABOR QUE CONQUISTA</div>',

                '  </div>',

                /* Barra dorada inferior */
                '  <div class="cs-bottom-bar"></div>',

                '</div>'
            ].join('\n');
        }

        /* ----------------------------------------------------------
           PÁGINAS DE CONTENIDO (comportamiento original sin cambios)
        ---------------------------------------------------------- */
        var bodyHtml = '';

        /* Precalcular segmentos: category-header ó grupo de product-rows del mismo tipo */
        var segments = [];
        var j = 0;
        while (j < blocks.length) {
            var b = blocks[j];
            if (b.type === 'category-header') {
                segments.push({ kind: 'header', startIdx: j });
                j++;
            } else if (b.type === 'product-row') {
                var start = j;
                var pType = b.productType;
                while (j < blocks.length && blocks[j].type === 'product-row' && blocks[j].productType === pType) {
                    j++;
                }
                segments.push({ kind: 'grid', startIdx: start, endIdx: j - 1, productType: pType });
            } else {
                j++;
            }
        }

        var lastSegIdx = segments.length - 1;

        /*
         * FASE 4 — DETECCIÓN DE PÁGINA HÉROE:
         * Una página es "héroe" cuando contiene ÚnicAMENTE un header de categoría
         * seguido de un bloque de tarjetas combo (Boneless o Nachos solos en la página).
         * En ese caso se aplica .sheet-body--hero que activa el layout vertical:
         * imagen full-width arriba + combos en columnas horizontales abajo.
         */
        var isHeroPage = (
            segments.length === 2 &&
            segments[0].kind === 'header' &&
            segments[1].kind === 'grid' &&
            segments[1].productType === 'combo-card'
        );
        var bodyClass = 'sheet-body' + (isHeroPage ? ' sheet-body--hero' : '');

        segments.forEach(function (seg, segIdx) {
            var isLastSeg = (segIdx === lastSegIdx);
            var blockClass = 'sheet-section-block' + (isLastSeg ? ' last-block' : '');

            if (seg.kind === 'header') {
                var block = blocks[seg.startIdx];
                var titleText = block.isContinuation
                    ? escHtml(block.categoryName) + ' <span class="sch-cont">(CONT.)</span>'
                    : escHtml(block.categoryName);

                /* En páginas hero el header recibe clase adicional para estilos más prominentes */
                var heroHeaderClass = isHeroPage ? ' hero-header' : '';

                bodyHtml += [
                    '<div class="sheet-category-header ' + blockClass + heroHeaderClass + '">',
                    '  <span class="sch-title">' + titleText + '</span>',
                    '  <div class="sch-line"></div>',
                    '</div>'
                ].join('\n') + '\n';

            } else if (seg.kind === 'grid') {
                var colsCount = COLS[seg.productType] || 2;
                var gridMod   = '';
                if (colsCount === 1) gridMod = ' grid-1col';
                if (colsCount === 3) gridMod = ' grid-3col';

                var productsHtml = '';
                for (var k = seg.startIdx; k <= seg.endIdx; k++) {
                    blocks[k].products.forEach(function (p) {
                        productsHtml += renderPrintProduct(p) + '\n';
                    });
                }

                bodyHtml += '<div class="sheet-product-grid' + gridMod + ' ' + blockClass + '">\n' +
                            productsHtml +
                            '</div>\n';
            }
        });

        /* Hoja completa */
        return [
            '<div class="menu-sheet">',

            /* Header de la hoja */
            '  <div class="sheet-header">',
            '    <div class="sh-brand">',
            '      <img src="../images/logo.png" alt="Supremo Dogos" class="sh-logo">',
            '      <div class="sh-text">',
            '        <div class="sh-name"><span class="sh-name-accent">SUPREMO</span>DOGOS</div>',
            '        <div class="sh-tagline">DOGOS · PAPAS · NACHOS · BONELESS</div>',
            '      </div>',
            '    </div>',
            '    <div class="sh-page-badge">PÁG ' + pageNum + ' / ' + totalPages + '</div>',
            '  </div>',
            '  <div class="sheet-header-bar"></div>',

            /* Cuerpo */
            '  <div class="' + bodyClass + '">',
            bodyHtml,
            '  </div>',

            /* Footer */
            '  <div class="sheet-footer">',
            '    <span class="sf-tagline">SUPREMO DOGOS · EL SABOR QUE CONQUISTA</span>',
            '    <span class="sf-dots">DOGOS · PAPAS · NACHOS · BONELESS</span>',
            '  </div>',

            '</div>'
        ].join('\n');
    }



    /* ============================================================
       REPORTE DE PAGINACIÓN (consola)
       Imprime un resumen detallado para validación.
    ============================================================ */
    function reportPages(pages) {
        console.info('═══════════════════════════════════════════════');
        console.info('[print.js] REPORTE DE PAGINACIÓN');
        console.info('  pageUsableHeight : ' + LAYOUT.pageUsableHeight + ' mm');
        console.info('  blockGap         : ' + LAYOUT.blockGap + ' mm');
        console.info('  Páginas generadas: ' + pages.length);
        console.info('═══════════════════════════════════════════════');

        pages.forEach(function (blocks, idx) {
            var pageNum = idx + 1;

            if (blocks === 'cover') {
                console.info('PÁGINA ' + pageNum + ' · [PORTADA DE IMPRESIÓN]');
                console.info('─────────────────────────────────────────────');
                return;
            }

            var usedH   = 0;
            var lines   = [];
            var blockCount = 0;


            /* Reconstruir cálculo de altura para el reporte */
            var segs = [];
            var j = 0;
            while (j < blocks.length) {
                var b = blocks[j];
                if (b.type === 'category-header') {
                    segs.push({ kind: 'header', block: b });
                    j++;
                } else if (b.type === 'product-row') {
                    var start = j;
                    var pType = b.productType;
                    while (j < blocks.length && blocks[j].type === 'product-row' && blocks[j].productType === pType) {
                        j++;
                    }
                    segs.push({ kind: 'grid', startIdx: start, endIdx: j - 1, pType: pType, blocks: blocks });
                } else {
                    j++;
                }
            }

            var lastSegIdx = segs.length - 1;

            segs.forEach(function (seg, segIdx) {
                var isLast    = (segIdx === lastSegIdx);
                var blockH    = 0;
                var gapH      = isLast ? 0 : LAYOUT.blockGap;
                var label     = '';

                if (seg.kind === 'header') {
                    blockH = LAYOUT.categoryHeaderH;
                    label  = (seg.block.isContinuation ? '  [HEADER CONT.] ' : '  [HEADER] ') +
                             seg.block.categoryName +
                             (seg.block.isContinuation ? ' (CONT.)' : '');
                } else if (seg.kind === 'grid') {
                    var firstBlock = seg.blocks[seg.startIdx];
                    blockH = cardRowHeight(firstBlock.productType);
                    var rowCount = seg.endIdx - seg.startIdx + 1;
                    var productNames = [];
                    for (var k = seg.startIdx; k <= seg.endIdx; k++) {
                        seg.blocks[k].products.forEach(function(p) { productNames.push(p.name); });
                    }
                    label = '  [GRID ' + firstBlock.productType + ' ' + rowCount + ' fila(s)] ' + productNames.join(', ');
                }

                usedH += blockH + gapH;
                blockCount++;
                lines.push(label + ' → bloque=' + blockH + 'mm + gap=' + gapH + 'mm (acum=' + usedH + 'mm)');
            });

            var overflow = usedH > LAYOUT.pageUsableHeight;
            console.info('─────────────────────────────────────────────');
            console.info('PÁGINA ' + pageNum + ' · usedH=' + usedH + 'mm · libre=' + (LAYOUT.pageUsableHeight - usedH) + 'mm' + (overflow ? ' ⚠ OVERFLOW!' : ' ✓'));
            lines.forEach(function (l) { console.info(l); });
        });

        console.info('═══════════════════════════════════════════════');
    }

    /* ============================================================
       ESTADO DE LA APLICACIÓN
    ============================================================ */
    var state = {
        pages:       [],     // arreglo de páginas (cada una = arreglo de bloques)
        currentPage: 0,      // índice 0-based
    };

    /* ============================================================
       REFERENCIAS DOM
    ============================================================ */
    var elPreviewViewport = document.getElementById('preview-viewport');
    var elPreviewLoading  = document.getElementById('preview-loading');
    var elPrintAllPages   = document.getElementById('print-all-pages');
    var elPageIndicator   = document.getElementById('page-indicator');
    var elBtnPrev         = document.getElementById('btn-prev');
    var elBtnNext         = document.getElementById('btn-next');
    var elBtnPrint        = document.getElementById('btn-print');

    /* ============================================================
       RENDER DE LA VISTA PREVIA (UNA SOLA PÁGINA A LA VEZ)
    ============================================================ */

    /**
     * Calcula la escala para que la hoja carta quepa en el viewport
     * con algo de padding, sin desbordarse.
     */
    function calcScale() {
        var SHEET_W = 816; // px (8.5in @ 96dpi)
        var SHEET_H = 1056; // px (11in @ 96dpi)
        var vw = Math.min(window.innerWidth - 40, 1100);
        var vh = window.innerHeight - 200; // aprox altura del header+controles

        var scaleW = vw / SHEET_W;
        var scaleH = vh / SHEET_H;
        var scale  = Math.min(scaleW, scaleH, 1); // nunca mayor a 1:1
        return Math.max(scale, 0.3);
    }

    function renderPreview() {
        if (state.pages.length === 0) return;

        var idx   = state.currentPage;
        var total = state.pages.length;
        var scale = calcScale();

        /* Generar HTML de la hoja */
        var sheetHtml = renderSheet(state.pages[idx], idx + 1, total);

        /* Montar wrapper escalado */
        var wrapper = document.createElement('div');
        wrapper.className = 'sheet-scale-wrapper';
        wrapper.style.transform = 'scale(' + scale + ')';
        wrapper.style.width      = '816px';
        wrapper.style.height     = (1056 * scale) + 'px';
        /* Aunque el wrapper se escala, le damos la altura visual correcta */
        wrapper.style.marginBottom = (1056 * scale - 1056) + 'px';
        wrapper.innerHTML = sheetHtml;

        /* Reemplazar contenido del viewport */
        elPreviewViewport.innerHTML = '';
        elPreviewViewport.appendChild(wrapper);

        /* Actualizar indicador */
        elPageIndicator.textContent = 'PÁGINA ' + (idx + 1) + ' DE ' + total;

        /* Actualizar botones */
        elBtnPrev.disabled = (idx === 0);
        elBtnNext.disabled = (idx === total - 1);
    }

    /* ============================================================
       RENDER DE TODAS LAS PÁGINAS PARA IMPRESIÓN
    ============================================================ */
    function renderAllForPrint() {
        elPrintAllPages.innerHTML = '';
        var total = state.pages.length;

        state.pages.forEach(function (pageBlocks, idx) {
            var sheetHtml = renderSheet(pageBlocks, idx + 1, total);
            var wrapper   = document.createElement('div');
            wrapper.className = 'print-sheet-wrapper';
            wrapper.innerHTML = sheetHtml;
            elPrintAllPages.appendChild(wrapper);
        });
    }

    /* ============================================================
       INICIALIZACIÓN
    ============================================================ */
    function init() {
        /* Verificar que menuData existe */
        if (typeof menuData === 'undefined') {
            console.error('[print.js] ERROR: menuData no está definido. ¿Cargaste ../menu-data.js?');
            elPreviewLoading.innerHTML = '<p style="color:#e55;">⚠ Error: menu-data.js no encontrado.</p>';
            return;
        }

        /* Construir páginas de contenido */
        var contentPages = buildPages(menuData.categories);

        /* Anteponer la portada como página 0.
           El centinela 'cover' es detectado por renderSheet() para
           generar el HTML de portada en lugar de una hoja de contenido.
           buildPages() y LAYOUT no se modifican. */
        state.pages = ['cover'].concat(contentPages);
        state.currentPage = 0;

        /* Reporte de validación en consola */
        reportPages(state.pages);

        if (state.pages.length === 0) {
            elPreviewLoading.innerHTML = '<p style="color:#e55;">⚠ No se generaron páginas.</p>';
            return;
        }

        /* Ocultar loading, mostrar vista previa */
        elPreviewLoading.style.display = 'none';

        /* Renderizar vista previa inicial */
        renderPreview();

        /* Renderizar todas las páginas para impresión */
        renderAllForPrint();
    }

    /* ============================================================
       EVENTOS
    ============================================================ */

    /* Anterior */
    elBtnPrev.addEventListener('click', function () {
        if (state.currentPage > 0) {
            state.currentPage--;
            renderPreview();
            /* Scroll suave al tope del área de vista previa */
            var area = document.getElementById('preview-area');
            if (area) area.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    /* Siguiente */
    elBtnNext.addEventListener('click', function () {
        if (state.currentPage < state.pages.length - 1) {
            state.currentPage++;
            renderPreview();
            var area = document.getElementById('preview-area');
            if (area) area.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    /* Imprimir */
    elBtnPrint.addEventListener('click', function () {
        window.print();
    });

    /* Re-escalar al cambiar tamaño de ventana */
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (state.pages.length > 0) renderPreview();
        }, 120);
    });

    /* ============================================================
       UTILIDADES
    ============================================================ */

    /** Escapa caracteres HTML especiales para uso en atributos y texto */
    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#39;');
    }

    /* ============================================================
       ARRANQUE
       Se ejecuta inmediatamente porque los scripts están al final
       del <body> y el DOM ya existe.
    ============================================================ */
    init();

})();
