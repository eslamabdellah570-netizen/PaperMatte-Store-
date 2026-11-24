// PaperMatte Store — isolated D1/R2 preview API.
// No production secrets or Supabase credentials belong in this file.
// Bindings expected only after a separate preview Worker is provisioned:
//   env.DB (D1), env.PRODUCT_IMAGES (R2)
// Admin mutations are intentionally NOT implemented until authentication
// (Cloudflare Access or another verified admin identity) is configured.
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type"
  }
});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204 });
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    if (!env.DB) return json({ error: "D1 binding is not configured" }, 503);
    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "papermatte-preview", database: "bound" });
    }
    if (url.pathname === "/api/products") {
      const { results } = await env.DB.prepare(
        "SELECT id,name,price,category,description,image_url,is_active,product_type,created_at,updated_at FROM products WHERE is_active=1 AND product_type='product' ORDER BY CASE category WHEN 'tablets' THEN 0 WHEN 'watches' THEN 1 WHEN 'accessories' THEN 2 ELSE 3 END, price ASC, name ASC"
      ).all();
      return json({ products: results || [] });
    }
    const match = url.pathname.match(/^\/api\/products\/([0-9a-f-]{36})$/i);
    if (match) {
      const product = await env.DB.prepare(
        "SELECT id,name,price,category,description,image_url,is_active,product_type,created_at,updated_at FROM products WHERE id=? AND is_active=1 AND product_type='product'"
      ).bind(match[1]).first();
      return product ? json({ product }) : json({ error: "Not found" }, 404);
    }
    return json({ error: "Not found" }, 404);
  }
};
