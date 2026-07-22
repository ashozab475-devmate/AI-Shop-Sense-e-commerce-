"""
Applies the matched dataset images to the shopping page products.
- Updates lib/mockData.js imageUrl fields
- Updates the Product table in the database

Run from project root after match_products_to_dataset.py:
    python search_service/apply_matches.py
"""

import sys, json, re
from pathlib import Path

BASE_DIR     = Path(__file__).parent
PROJECT_ROOT = BASE_DIR.parent
MATCHES_FILE = BASE_DIR / "product_image_matches.json"
MOCK_DATA    = PROJECT_ROOT / "lib" / "mockData.js"

def main():
    if not MATCHES_FILE.exists():
        print("ERROR: Run match_products_to_dataset.py first")
        return

    with open(MATCHES_FILE, encoding='utf-8') as f:
        matches = json.load(f)

    matched   = {k: v for k, v in matches.items() if v['matched']}
    unmatched = {k: v for k, v in matches.items() if not v['matched']}

    print(f"Matched: {len(matched)}, Unmatched (keeping local): {len(unmatched)}\n")

    if not matched:
        print("No matches found — nothing to update.")
        return

    # ── Update mockData.js ────────────────────────────────────────────────────
    content = MOCK_DATA.read_text(encoding='utf-8')
    updated = 0

    for product_id, info in matched.items():
        new_url = info['imageUrl']
        # Find the product block by id and replace its imageUrl
        # Pattern: id: 'mock-sh-7', ... imageUrl: '...'
        # We use a two-step approach: find the id, then replace the next imageUrl
        pattern = rf"(id:\s*['\"]){re.escape(product_id)}(['\"].*?imageUrl:\s*['\"])([^'\"]+)(['\"])"
        replacement = rf"\g<1>{product_id}\g<2>{new_url}\g<4>"
        new_content, n = re.subn(pattern, replacement, content, flags=re.DOTALL)
        if n > 0:
            content = new_content
            updated += 1
            print(f"  Updated {product_id}: {new_url}")
        else:
            print(f"  WARN: Could not find {product_id} in mockData.js")

    MOCK_DATA.write_text(content, encoding='utf-8')
    print(f"\nmockData.js updated: {updated} products")

    # ── Update database via Node.js ───────────────────────────────────────────
    print("\nUpdating database...")
    update_script = PROJECT_ROOT / "update_product_images.cjs"
    update_data = {k: v['imageUrl'] for k, v in matched.items()}

    script = f"""
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();
const updates = {json.dumps(update_data, indent=2)};

async function main() {{
  let count = 0;
  for (const [mockId, imageUrl] of Object.entries(updates)) {{
    // Products are identified by their mock id stored in the name pattern
    // We match by the seeded id field
    const r = await prisma.product.updateMany({{
      where: {{ id: mockId }},
      data: {{ imageUrl }}
    }});
    if (r.count > 0) {{ count++; console.log('Updated:', mockId, '->', imageUrl.slice(-40)); }}
  }}
  console.log('\\nDatabase updated:', count, 'products');
  await prisma.$disconnect();
}}
main().catch(console.error);
"""
    update_script.write_text(script, encoding='utf-8')

    import subprocess
    result = subprocess.run(['node', str(update_script)], capture_output=True, text=True, cwd=str(PROJECT_ROOT))
    print(result.stdout)
    if result.stderr: print("STDERR:", result.stderr[:500])
    update_script.unlink()

    print("\nDone! Reseed the database to apply all changes:")
    print("  npx prisma db seed")


if __name__ == "__main__":
    main()
