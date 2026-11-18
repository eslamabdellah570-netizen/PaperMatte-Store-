const SUPABASE_URL = "https://appabnyalsnlqytnklzr.supabase.co";
const SUPABASE_KEY = "sb_publishable_GUeyao4IsHv8G25Pfnx8nQ_bTDfah9N";

function xmlEscape(value) {
  return String(value ?? "").replace(/[<>&"']/g, ch => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;"
  }[ch]));
}

export async function onRequest() {
  const endpoint = new URL("/rest/v1/products", SUPABASE_URL);
  endpoint.search = new URLSearchParams({
    select: "id,updated_at",
    product_type: "eq.product",
    is_active: "eq.true",
    order: "updated_at.desc"
  }).toString();

  let products;
  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY
      }
    });
    if (!response.ok) {
      return new Response("Unable to load product URLs for sitemap.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
    products = await response.json();
    if (!Array.isArray(products)) throw new Error("Unexpected products response");
  } catch (error) {
    return new Response("Unable to generate sitemap.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
    });
  }

  const base = "https://papermatte-store.pages.dev";
  const urls = [
    { loc: base + "/", lastmod: new Date().toISOString().slice(0, 10) },
    ...products.map(product => ({
      loc: base + "/product?id=" + encodeURIComponent(product.id),
      lastmod: product.updated_at ? new Date(product.updated_at).toISOString().slice(0, 10) : null
    }))
  ];

  const entries = urls.map(item =>
    "  <url>\n    <loc>" + xmlEscape(item.loc) + "</loc>" +
    (item.lastmod ? "\n    <lastmod>" + xmlEscape(item.lastmod) + "</lastmod>" : "") +
    "\n  </url>"
  ).join("\n");

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries + "\n</urlset>";

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
