import { neon } from '@neondatabase/serverless';

/**
 * Vercel Serverless Function — Endpoint público de lectura del menú.
 * 
 * Responsabilidades:
 * - Consulta directa de solo lectura a Neon Postgres usando DATABASE_URL.
 * - Filtra únicamente categorías y productos activos (active = true).
 * - Excluye categorías sin productos activos.
 * - Respeta estrictamente los sort_order en todos los niveles (categorías, productos, combos, features).
 * - No expone credenciales, secretos, emails ni datos de neon_auth.
 * - Cache-Control configurado a 'no-store' para verificación inmediata.
 */
export default async function handler(req, res) {
  // 1. Validar método HTTP
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Cabeceras de respuesta y caché
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 3. Verificar configuración de DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.trim()) {
    return res.status(500).json({
      error: 'DATABASE_URL no está configurada en las variables de entorno del servidor.'
    });
  }

  try {
    const sql = neon(databaseUrl.trim());

    // 4. Consulta relacional agrupada en un solo viaje de red (Single Round-Trip)
    const rows = await sql`
      WITH active_combos AS (
        SELECT 
          pc.id,
          pc.product_id,
          pc.combo_number,
          pc.name,
          pc.price,
          pc.sort_order,
          COALESCE(
            json_agg(
              json_build_object(
                'id', cf.id,
                'text', cf.text,
                'icon', cf.icon,
                'signature', cf.signature,
                'signature_tag', cf.signature_tag,
                'sort_order', cf.sort_order
              ) ORDER BY cf.sort_order ASC
            ) FILTER (WHERE cf.id IS NOT NULL),
            '[]'::json
          ) AS features
        FROM product_combos pc
        LEFT JOIN combo_features cf ON cf.combo_id = pc.id
        GROUP BY pc.id, pc.product_id, pc.combo_number, pc.name, pc.price, pc.sort_order
      ),
      active_products AS (
        SELECT 
          p.id,
          p.category_id,
          p.name,
          p.slug,
          p.type,
          p.description,
          p.price,
          p.price_small,
          p.price_large,
          p.image_url,
          p.tag,
          p.featured,
          p.sort_order,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ac.id,
                'combo_number', ac.combo_number,
                'name', ac.name,
                'price', ac.price,
                'sort_order', ac.sort_order,
                'features', ac.features
              ) ORDER BY ac.sort_order ASC
            ) FILTER (WHERE ac.id IS NOT NULL),
            '[]'::json
          ) AS combos
        FROM products p
        LEFT JOIN active_combos ac ON ac.product_id = p.id
        WHERE p.active = true
        GROUP BY p.id, p.category_id, p.name, p.slug, p.type, p.description, p.price, p.price_small, p.price_large, p.image_url, p.tag, p.featured, p.sort_order
      )
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.sort_order,
        json_agg(
          json_build_object(
            'id', ap.id,
            'name', ap.name,
            'slug', ap.slug,
            'type', ap.type,
            'description', ap.description,
            'price', ap.price,
            'price_small', ap.price_small,
            'price_large', ap.price_large,
            'image_url', ap.image_url,
            'tag', ap.tag,
            'featured', ap.featured,
            'sort_order', ap.sort_order,
            'combos', ap.combos
          ) ORDER BY ap.sort_order ASC
        ) AS products
      FROM categories c
      JOIN active_products ap ON ap.category_id = c.id
      WHERE c.active = true
      GROUP BY c.id, c.name, c.slug, c.sort_order
      HAVING count(ap.id) > 0
      ORDER BY c.sort_order ASC;
    `;

    return res.status(200).json({
      success: true,
      categories: rows
    });

  } catch (error) {
    console.error('[API /api/menu] Database query exception:', error.message);
    return res.status(500).json({
      error: 'Error al consultar los datos del menú.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
