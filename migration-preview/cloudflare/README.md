# PaperMatte Store — isolated Cloudflare migration preview

## Current source inventory (read-only inspection)
- Existing storefront: Cloudflare Pages, papermatte-store.pages.dev.
- Existing repository production branch: main.
- Existing catalog source: Supabase project appabnyalsnlqytnklzr.
- Latest inspected catalog count: 16 product rows, all active, product_type='product'.
- Supabase Storage bucket product-images: 16 objects, approximately 23.02 MB.
- One legacy product record contains an inline data:image/png;base64 URL; it must be decoded into a file during export and uploaded to R2 just like other images.
- Do not infer that 16 rows represent every product the store ever had; compare against historical exports/commits before final sign-off.

## Isolation guarantees
This directory is a migration draft only. Nothing here changes production.
- Do not run migrations against Supabase.
- Do not change the production Pages project, production branch, DNS, routes, or secrets.
- Create a separate D1 database, R2 bucket, and Worker for preview only.
- Do not enable paid services or upgrade a Cloudflare plan.
- Keep original Supabase data and files until post-cutover verification and an agreed retention period.

## D1
Apply schema.sql only to a newly-created preview D1 database.
Preserve product UUIDs, names, exact prices, categories, descriptions, flags, and timestamps.
Use parameterized inserts and compare row counts and stable hashes after import.

## R2 image migration
Export every object in Supabase Storage bucket product-images, preserving object keys and MIME types.
Also decode any data:image/*;base64,... value embedded in products.image_url into a file and rewrite only the preview copy to its R2 URL.
Verify every destination object by HEAD/read and compare byte size and SHA-256.
Keep a mapping file from original image URL/object key to R2 object key.
No source object should be deleted.

## Preview API
worker.js currently provides read-only product endpoints. It deliberately has no write/admin routes.
Before rebuilding the admin dashboard, configure and test an authenticated admin identity (prefer Cloudflare Access) and enforce it server-side. Never expose R2 write credentials or admin secrets in browser JavaScript.

## Remaining gated steps
1. Create the separate D1 database and R2 bucket in the Cloudflare dashboard (confirm the free plan/quotas before provisioning).
2. Obtain a client-side export of all product rows and all 16 image objects, including the legacy inline image.
3. Import to the preview D1 and R2 and verify counts, hashes, and image rendering.
4. Deploy the preview Worker and a preview Pages build only after confirming no paid feature is selected.
5. Rebuild and test admin authentication and CRUD.
6. Only after explicit approval, consider production cutover.

## Cost stop condition
Stop before any action that displays a charge, requests billing details, requires a paid plan, or exceeds the free allowance. Do not create paid resources or change production settings.
