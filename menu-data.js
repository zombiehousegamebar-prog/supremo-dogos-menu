/**
 * menu-data.js — ÚNICA FUENTE DE VERDAD
 * Supremo Dogos | Datos del Menú
 *
 * Estructura de categorías:
 *   - id          : coincide con el id del <section> en index.html
 *   - slug        : texto del watermark de fondo (section-watermark)
 *   - name        : nombre visible de la categoría
 *   - navLabel    : etiqueta del enlace en la navegación
 *   - products    : array de tarjetas
 *
 * Tipos de producto (campo "type" en cada producto):
 *   'standard'       → tarjeta con un solo precio
 *   'pricing-double' → tarjeta con precios Chica/Grande
 *   'combo-card'     → tarjeta tipo product-card-full con sub-combos
 */

const menuData = {

  categories: [

    /* ============================================================
       CATEGORÍA 1: CLÁSICOS
       Tipo: standard (precio único $130 en todos)
    ============================================================ */
    {
      id: 'classics',
      slug: 'CLASSICS',
      name: 'Clásicos',
      navLabel: 'Clásicos',
      products: [
        {
          type: 'standard',
          cardNumber: '01',
          tag: null,
          featured: false,
          name: 'Dogo Original',
          description: 'Pan blanco artesanal estilo Baguette de 20cm relleno de queso philadelphia y mozzarella, con salchicha envuelta en tocino crujiente, bañado en queso amarillo acompañado de chile, tomate, cebolla y pepinillos con mayonesa, moztasa y catsup.',
          price: '$130',
          image: './images/dogooriginal.png',
          imageAlt: 'Hotdog Chicago Style'
        },
        {
          type: 'standard',
          cardNumber: '02',
          tag: null,
          featured: false,
          name: 'Dogo Cheese n Cheese',
          description: 'Pan italiano artesanal estilo Baguette de 20cm relleno de queso philadelphia y mozzarella, con salchicha envuelta en tocino crujiente, frijoles en chipotle, bañado en queso amarillo con Bistec y un toque de parmesano.',
          price: '$130',
          image: './images/dogocheese.png',
          imageAlt: 'Hotdog Clásico Alemán'
        },
        {
          type: 'standard',
          cardNumber: '02',
          tag: null,
          featured: false,
          name: 'Dogo Mexicano',
          description: 'Pan parmesano artesanal estilo Baguette de 20cm relleno de queso philadelphia y mozzarella, con salchicha envuelta en tocino crujiente, con frijoles enteros, Bistec y una salsa serrana con un toque de parmesano.',
          price: '$130',
          image: './images/dogomexicano.png',
          imageAlt: 'Hotdog Clásico Alemán'
        },
        {
          type: 'standard',
          cardNumber: '02',
          tag: null,
          featured: false,
          name: 'Dogo Italiano',
          description: 'Pan italiano artesanal estilo Baguette de 20cm relleno de queso philadelphia y mozzarella, con salchicha envuelta en tocino crujiente, salsa italiana, con peperoni y parmesano.',
          price: '$130',
          image: './images/dogoitaliano.png',
          imageAlt: 'Hotdog Clásico Alemán'
        },
        {
          type: 'standard',
          cardNumber: '02',
          tag: null,
          featured: false,
          name: 'Dogo Boneless',
          description: 'Pan italiano artesanal estilo Baguette de 20cm relleno de queso philadelphia y mozzarella, con salchicha envuelta en tocino crujiente boneles en salsa a elegir (bufalo ó BBQ) con aderezo ranch.',
          price: '$130',
          image: './images/dogoboneless.png',
          imageAlt: 'Hotdog Clásico Alemán'
        },
        {
          type: 'standard',
          cardNumber: '02',
          tag: null,
          featured: false,
          name: 'Dogo Doritos',
          description: 'Pan parmesano artesanal estilo Baguette de 20cm relleno de queso philadelphia y mozzarella, con salchicha envuelta en tocino crujiente, frijoles enteros, acompañado de Doritos bañados en queso amarillo.',
          price: '$130',
          image: './images/dogodoritos.png',
          imageAlt: 'Hotdog Clásico Alemán'
        },
        {
          type: 'standard',
          cardNumber: '02',
          tag: null,
          featured: false,
          name: 'Dogo Trompo',
          description: 'Pan italiano artesanal estilo Baguette de 20cm relleno de queso philadelphia y mozzarella, con salchicha envuelta en tocino crujiente, Trompo con cebolla caramelizada y con salsa de árbol.',
          price: '$130',
          image: './images/dogotrompo.png',
          imageAlt: 'Hotdog Clásico Alemán'
        }
      ]
    },

    /* ============================================================
       CATEGORÍA 2: ESPECIALIDADES
       Tipo: standard con tag (TOP / HOT!) y featured
    ============================================================ */
    {
      id: 'specialties',
      slug: 'SPECIALS',
      name: 'Especialidades',
      navLabel: 'Especialidades',
      products: [
        {
          type: 'standard',
          cardNumber: '03',
          tag: 'TOP',
          featured: true,
          name: 'Dogo Chorreado',
          description: 'Hot Dog a elegir del menú, acompañado de papitas a elegir (Cheetos Flamin Hot, Doritos rojos o Doritos Flamin Hot), bañado de queso amarillo.',
          price: '$160',
          image: './images/dogochorreadodoritos.png',
          imageAlt: 'Hotdog Supremo Bacon & Cheese'
        },
        {
          type: 'standard',
          cardNumber: '04',
          tag: 'HOT!',
          featured: false,
          name: 'Dogo Flamin',
          description: 'Pan blanco artesanal estilo Baguette de 20cm relleno de queso philadelphia y mozzarella, con salchicha envuelta en tocino crujiente, frijoles en chipotle, con chetos flamin bañado en queso amarillo y un toque de parmesano.',
          price: '$130',
          image: './images/dogoflamin.png',
          imageAlt: 'Hotdog Infierno Chipotle'
        }
      ]
    },

    /* ============================================================
       CATEGORÍA 3: PAPAS
       Tipo: pricing-double (Chica/Grande)
       Excepción: Flamin Fries solo tiene precio Grande
    ============================================================ */
    {
      id: 'fries',
      slug: 'FRIES',
      name: 'Papas',
      navLabel: 'Papas',
      products: [
        {
          type: 'pricing-double',
          cardNumber: '01',
          name: 'French Fries',
          description: 'Papas a la francesa clásicas, doradas y crujientes, sazonadas a la perfección.',
          image: './images/FRENCHFRIES.png',
          imageAlt: 'Papas Fritas Clásicas',
          prices: [
            { label: 'Chica',  value: '$50' },
            { label: 'Grande', value: '$80' }
          ]
        },
        {
          type: 'pricing-double',
          cardNumber: '02',
          name: 'Bistec Fries',
          description: 'Papas fritas crujientes con carne de bistec asada, bañadas en queso amarillo y queso parmesano.',
          image: './images/FRENCHFRIESCARNE.png',
          imageAlt: 'Papas con Bistec',
          prices: [
            { label: 'Chica',  value: '$90' },
            { label: 'Grande', value: '$120' }
          ]
        },
        {
          type: 'pricing-double',
          cardNumber: '03',
          name: 'Búfalo Fries',
          description: 'Papas fritas bañadas en salsa búfalo picante y queso parmesano, acompañadas de aderezo ranch.',
          image: './images/FRENCHBUFALO.png',
          imageAlt: 'Papas Búfalo',
          prices: [
            { label: 'Chica',  value: '$90' },
            { label: 'Grande', value: '$120' }
          ]
        },
        {
          type: 'pricing-double',
          cardNumber: '04',
          name: 'Salchi Fries',
          description: 'Rodajas fritas de salchicha seleccionada y papas fritas bañadas en queso amarillo y parmesano.',
          image: './images/FRENCHSALCHICHA.png',
          imageAlt: 'Salchipapas',
          prices: [
            { label: 'Chica',  value: '$90' },
            { label: 'Grande', value: '$120' }
          ]
        },
        {
          type: 'pricing-double',
          cardNumber: '05',
          name: 'Flamin Fries',
          description: 'Cheetos Flamin Hot crujientes, carne de bistec asada y queso parmesano bañados en delicioso queso amarillo.',
          image: './images/FRENCHFLAMIN.png',
          imageAlt: 'Papas Flamin Hot',
          // Solo precio Grande (sin precio Chica)
          prices: [
            { label: 'Grande', value: '$130' }
          ]
        }
      ]
    },

    /* ============================================================
       CATEGORÍA 4: BONELESS
       Tipo: combo-card (product-card-full)
       Una tarjeta con imagen compartida y 4 sub-opciones:
         ★ BONELESS 6 PIEZAS — orden individual (sin combo)
         01 COMBO CLÁSICO
         02 COMBO GRANDE
         03 COMBO DOBLE
       Íconos usados: 'drumstick' | 'fries' | 'sauce'
    ============================================================ */
    {
      id: 'boneless',
      slug: 'BONELESS',
      name: 'Boneless',
      navLabel: 'Boneless',
      products: [
        {
          type: 'combo-card',
          cardNumber: '01',
          image: './images/BONELESSSUPREMOS.png',
          imageAlt: 'Premium Combo Boneless',
          combos: [
            {
              comboNumber: '★',
              title: 'BONELESS (6 PIEZAS)',
              price: '$100',
              features: [
                { icon: 'drumstick', text: '6 Boneless crujientes', signature: false }
              ]
            },
            {
              comboNumber: '01',
              title: 'COMBO CLÁSICO',
              price: '$149',
              features: [
                { icon: 'drumstick', text: '6 Boneless',  signature: false },
                { icon: 'fries',     text: 'Papas chicas', signature: false },
                { icon: 'sauce',     text: '1 Aderezo',   signature: false }
              ]
            },
            {
              comboNumber: '02',
              title: 'COMBO GRANDE',
              price: '$199',
              features: [
                { icon: 'drumstick', text: '9 Boneless',   signature: false },
                { icon: 'fries',     text: 'Papas grandes', signature: false },
                { icon: 'sauce',     text: '1 Aderezo',    signature: false }
              ]
            },
            {
              comboNumber: '03',
              title: 'COMBO DOBLE',
              price: '$269',
              features: [
                { icon: 'drumstick', text: '15 Boneless',  signature: false },
                { icon: 'fries',     text: 'Papas grandes', signature: false },
                { icon: 'sauce',     text: '1 Aderezo',    signature: false }
              ]
            }
          ]
        }
      ]
    },

    /* ============================================================
       CATEGORÍA 5: NACHOS
       Tipo: combo-card (product-card-full)
       Una tarjeta con imagen compartida y 3 sub-opciones:
         01 NACHOS ORIGINALES
         02 NACHOS BISTEC
         03 NACHOS MEXICANOS
       Íconos usados: 'nacho' | 'beans' | 'cheese' | 'jalapeno' |
                      'meat' | 'pico' | 'sauce'
       signature: true → agrega .signature-item + signatureTag badge
    ============================================================ */
    {
      id: 'nachos',
      slug: 'NACHOS',
      name: 'Nachos',
      navLabel: 'Nachos',
      products: [
        {
          type: 'combo-card',
          cardNumber: '01',
          image: './images/NACHOSUPREMOS.png',
          imageAlt: 'Premium Loaded Nachos',
          combos: [
            {
              comboNumber: '01',
              title: 'NACHOS ORIGINALES',
              price: '$100',
              features: [
                { icon: 'nacho',    text: 'Totopos crujientes',    signature: false },
                { icon: 'beans',    text: 'Frijoles enteros',       signature: false },
                {
                  icon: 'cheese',
                  text: 'Queso amarillo cremoso',
                  signature: true,
                  signatureTag: 'RECETA DE LA CASA'
                },
                { icon: 'jalapeno', text: 'Rodajas de jalapeños',   signature: false }
              ]
            },
            {
              comboNumber: '02',
              title: 'NACHOS BISTEC',
              price: '$120',
              features: [
                { icon: 'nacho',    text: 'Totopos crujientes',     signature: false },
                { icon: 'beans',    text: 'Frijoles en chipotle',   signature: false },
                { icon: 'cheese',   text: 'Queso mozzarella',       signature: false },
                { icon: 'meat',     text: 'Carne de bistec asada',  signature: false },
                {
                  icon: 'cheese',
                  text: 'Queso amarillo cremoso',
                  signature: true,
                  signatureTag: 'RECETA DE LA CASA'
                },
                { icon: 'jalapeno', text: 'Salsa serrana',          signature: false }
              ]
            },
            {
              comboNumber: '03',
              title: 'NACHOS MEXICANOS',
              price: '$120',
              features: [
                { icon: 'nacho',    text: 'Totopos crujientes',          signature: false },
                { icon: 'meat',     text: 'Carne de trompo asada',       signature: false },
                { icon: 'beans',    text: 'Frijoles enteros',             signature: false },
                { icon: 'pico',     text: 'Chile, tomate y cebolla',      signature: false },
                {
                  icon: 'cheese',
                  text: 'Queso amarillo cremoso',
                  signature: true,
                  signatureTag: 'RECETA DE LA CASA'
                },
                { icon: 'sauce',    text: 'Salsa picante de chile de árbol', signature: false }
              ]
            }
          ]
        }
      ]
    }

  ] // end categories

}; // end menuData

// Compatibilidad dual: navegador (variable global) y Node.js / bundler
if (typeof module !== 'undefined' && module.exports) {
  module.exports = menuData;
}
