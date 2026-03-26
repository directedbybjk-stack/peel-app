export interface ProductData {
  barcode: string;
  productName: string;
  brand: string;
  imageUrl?: string;
  ingredients: string;
  ingredientsList: string[];
  nutriscoreGrade?: string;
  novaGroup?: number;
  categories?: string;
  allergens: string[];
  additives: string[];
  score: number;
  scoreLabel: 'Excellent' | 'Good' | 'Limit' | 'Avoid';
  hasSeedOils: boolean;
  seedOilsFound: string[];
  hasAdditives: boolean;
  processingLevel: 'Low' | 'Medium' | 'High';
  analysis: string;
  flags: ProductFlag[];
}

export interface ProductFlag {
  type: 'seed_oil' | 'additive' | 'allergen' | 'processing' | 'sugar';
  label: string;
  severity: 'warning' | 'danger';
}

const SEED_OILS = [
  'sunflower oil', 'canola oil', 'soybean oil', 'corn oil',
  'cottonseed oil', 'safflower oil', 'rapeseed oil', 'vegetable oil',
  'palm oil', 'rice bran oil', 'grapeseed oil',
];

const BAD_ADDITIVES = [
  'high fructose corn syrup', 'hfcs', 'aspartame', 'sucralose',
  'acesulfame potassium', 'acesulfame k', 'sodium benzoate',
  'potassium sorbate', 'sodium nitrite', 'sodium nitrate',
  'bha', 'bht', 'tbhq', 'carrageenan', 'polysorbate 80',
  'artificial flavors', 'artificial colors', 'natural flavors',
  'red 40', 'yellow 5', 'yellow 6', 'blue 1', 'caramel color',
  'titanium dioxide', 'propylene glycol',
];

export async function lookupProduct(barcode: string): Promise<ProductData | null> {
  // Try multiple barcode formats — USDA uses 14-digit GTIN, OFF uses 13-digit EAN
  const codesToTry = [barcode];
  const normalized = normalizeBarcode(barcode);
  if (normalized !== barcode) codesToTry.push(normalized);
  // Also try without leading zeros
  const stripped = barcode.replace(/^0+/, '');
  if (stripped !== barcode && stripped !== normalized) codesToTry.push(stripped);

  for (const code of codesToTry) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${code}.json`
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== 1 || !data.product) continue;

      // Found it — use this code
      barcode = code;
      return parseOFFProduct(barcode, data.product);
    } catch {}
  }
  return null;
}

function parseOFFProduct(barcode: string, p: any): ProductData {
    const ingredientsText = (p.ingredients_text || '').toLowerCase();
    const ingredientsList: string[] = (p.ingredients || []).map(
      (i: any) => i.text || i.id || ''
    );

    // Detect seed oils
    const seedOilsFound = SEED_OILS.filter((oil) =>
      ingredientsText.includes(oil)
    );
    const hasSeedOils = seedOilsFound.length > 0;

    // Detect bad additives
    const additivesFound = BAD_ADDITIVES.filter((add) =>
      ingredientsText.includes(add)
    );
    const hasAdditives = additivesFound.length > 0;

    // Get additives from OFF data
    const offAdditives: string[] = (p.additives_tags || []).map((t: string) =>
      t.replace('en:', '').replace(/-/g, ' ')
    );

    // Allergens
    const allergens: string[] = (p.allergens_tags || []).map((t: string) =>
      t.replace('en:', '').replace(/-/g, ' ')
    );

    // Processing level from NOVA
    const novaGroup = p.nova_group || p.nova_groups || 0;
    let processingLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (novaGroup >= 4) processingLevel = 'High';
    else if (novaGroup >= 3) processingLevel = 'Medium';

    // Calculate score (0-100)
    let score = 70; // Base score
    if (hasSeedOils) score -= seedOilsFound.length * 15;
    if (hasAdditives) score -= additivesFound.length * 5;
    if (processingLevel === 'High') score -= 20;
    else if (processingLevel === 'Medium') score -= 10;
    if (novaGroup === 1) score += 15;
    // Nutri-Score bonus
    if (p.nutriscore_grade === 'a') score += 10;
    else if (p.nutriscore_grade === 'b') score += 5;
    else if (p.nutriscore_grade === 'd') score -= 10;
    else if (p.nutriscore_grade === 'e') score -= 20;
    score = Math.max(0, Math.min(100, score));

    // Score label
    let scoreLabel: ProductData['scoreLabel'] = 'Good';
    if (score >= 80) scoreLabel = 'Excellent';
    else if (score >= 60) scoreLabel = 'Good';
    else if (score >= 30) scoreLabel = 'Limit';
    else scoreLabel = 'Avoid';

    // Build flags
    const flags: ProductFlag[] = [];
    if (hasSeedOils) {
      flags.push({
        type: 'seed_oil',
        label: `Contains seed oils: ${seedOilsFound.join(', ')}`,
        severity: 'danger',
      });
    }
    if (hasAdditives) {
      flags.push({
        type: 'additive',
        label: `Contains additives`,
        severity: 'warning',
      });
    }
    if (processingLevel === 'High') {
      flags.push({
        type: 'processing',
        label: 'Ultra-processed',
        severity: 'danger',
      });
    }
    allergens.forEach((a) => {
      flags.push({
        type: 'allergen',
        label: `Contains ${a}`,
        severity: 'warning',
      });
    });

    // Generate analysis text
    const analysis = generateAnalysis(
      p.product_name || 'This product',
      score,
      scoreLabel,
      hasSeedOils,
      seedOilsFound,
      hasAdditives,
      additivesFound,
      processingLevel,
      ingredientsText
    );

    return {
      barcode,
      productName: p.product_name || p.product_name_en || 'Unknown Product',
      brand: p.brands || 'Unknown Brand',
      imageUrl: p.image_front_url || p.image_url,
      ingredients: p.ingredients_text || 'No ingredient data available',
      ingredientsList:
        ingredientsList.length > 0
          ? ingredientsList
          : (p.ingredients_text || '').split(',').map((s: string) => s.trim()),
      nutriscoreGrade: p.nutriscore_grade,
      novaGroup: novaGroup || undefined,
      categories: p.categories,
      allergens,
      additives: [...new Set([...offAdditives, ...additivesFound])],
      score,
      scoreLabel,
      hasSeedOils,
      seedOilsFound,
      hasAdditives,
      processingLevel,
      analysis,
      flags,
    };
}

function generateAnalysis(
  name: string,
  score: number,
  label: string,
  hasSeedOils: boolean,
  seedOils: string[],
  hasAdditives: boolean,
  additives: string[],
  processing: string,
  ingredients: string
): string {
  const parts: string[] = [];

  if (score >= 80) {
    parts.push(
      `${name} is an excellent choice.`
    );
  } else if (score >= 60) {
    parts.push(
      `${name} is a solid choice with some minor concerns.`
    );
  } else if (score >= 30) {
    parts.push(
      `${name} has some ingredients worth being mindful of.`
    );
  } else {
    parts.push(
      `${name} has several ingredients that may not align with clean eating goals.`
    );
  }

  if (hasSeedOils) {
    parts.push(
      `It contains ${seedOils.join(' and ')}, which are processed seed oils linked to inflammation.`
    );
  }

  if (processing === 'High') {
    parts.push(
      'This is an ultra-processed product with a high level of industrial processing.'
    );
  }

  if (hasAdditives && additives.length > 0) {
    const top = additives.slice(0, 3).join(', ');
    parts.push(`Notable additives include ${top}.`);
  }

  if (!hasSeedOils && processing === 'Low' && !hasAdditives) {
    parts.push(
      'No seed oils, minimal processing, and no concerning additives were detected.'
    );
  }

  return parts.join(' ');
}

// Normalize barcode — strip leading zeros beyond 13 digits, ensure minimum length
function normalizeBarcode(barcode: string): string {
  // Remove non-digit characters
  const digits = barcode.replace(/\D/g, '');
  // USDA sometimes returns 14-digit GTINs — strip leading zero to get 13-digit EAN
  if (digits.length === 14 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

// Quick image lookup from Open Food Facts by barcode (returns url or undefined)
async function getOFFImage(barcode: string): Promise<string | undefined> {
  const normalized = normalizeBarcode(barcode);
  if (normalized.length < 8) return undefined;

  // Try both the normalized barcode and original
  const codesToTry = [normalized];
  if (normalized !== barcode.replace(/\D/g, '')) {
    codesToTry.push(barcode.replace(/\D/g, ''));
  }

  for (const code of codesToTry) {
    try {
      const controller = new AbortController();
      const tm = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=image_front_url,image_front_small_url`,
        { signal: controller.signal }
      );
      clearTimeout(tm);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== 1) continue;
      const img = data.product?.image_front_small_url || data.product?.image_front_url;
      if (img && img.startsWith('http') && img.includes('/images/')) return img;
    } catch {}
  }
  return undefined;
}

type SearchResult = {
  barcode: string;
  productName: string;
  brand: string;
  imageUrl?: string;
  nutriscoreGrade?: string;
};

export async function searchProducts(query: string): Promise<SearchResult[]> {
  // Primary: USDA FoodData Central — always available, every US food product
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
      query
    )}&api_key=8sTE38pHlkajrsNAj5davWIJRsfgGkte19fBIgh4&dataType=Branded&pageSize=25&sortBy=dataType.keyword&sortOrder=desc`;
    console.log('[Search] USDA query:', query, url);
    const usdaRes = await fetch(url);
    console.log('[Search] USDA status:', usdaRes.status);
    if (usdaRes.ok) {
      const usdaData = await usdaRes.json();
      const foods = usdaData.foods || [];
      if (foods.length > 0) {
        // Deduplicate aggressively by brand — only keep one product per brand
        // so we don't show 6 "Core Power" variants
        const seenBrands = new Set<string>();
        const candidates: Array<{ barcode: string; rawName: string; brand: string }> = [];

        for (const f of foods) {
          const rawName = f.description || 'Unknown';
          const brandName = f.brandName || f.brandOwner || 'Unknown';
          const brandKey = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');

          // Allow max 2 products per brand
          const brandCount = candidates.filter(
            (c) => c.brand.toLowerCase().replace(/[^a-z0-9]/g, '') === brandKey
          ).length;
          if (brandCount >= 2) continue;

          // Skip exact duplicates
          const exactKey = `${brandKey}|${rawName}`.toLowerCase();
          if (seenBrands.has(exactKey)) continue;
          seenBrands.add(exactKey);

          const barcode = f.gtinUpc || f.fdcId?.toString() || '';
          candidates.push({ barcode, rawName, brand: brandName });
          if (candidates.length >= 20) break;
        }

        // Fetch images from Open Food Facts in parallel
        const results: SearchResult[] = candidates.map((c) => {
          const productName = c.rawName
            .split(',')
            .slice(0, 2)
            .join(',')
            .trim()
            .replace(/\b\w+/g, (w: string) =>
              w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            );
          return { barcode: c.barcode, productName, brand: c.brand };
        });

        const imagePromises = results
          .filter((r) => r.barcode.length >= 8)
          .slice(0, 12)
          .map(async (r) => {
            const img = await getOFFImage(r.barcode);
            if (img) r.imageUrl = img;
          });
        await Promise.allSettled(imagePromises);

        // Only return results that have images
        return results.filter((r) => r.imageUrl).slice(0, 15);
      }
    }
  } catch (e) {
    console.log('[Search] USDA error:', e);
  }

  // Fallback: Open Food Facts search (when USDA is unavailable)
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&search_simple=1&action=process&json=1&page_size=20`
    );
    if (!res.ok) return [];
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('json')) return [];
    const data = await res.json();
    return (data.products || []).map((p: any) => ({
      barcode: p.code || p._id,
      productName: p.product_name || 'Unknown',
      brand: p.brands || 'Unknown',
      imageUrl: p.image_front_small_url || p.image_front_url,
      nutriscoreGrade: p.nutriscore_grade,
    }));
  } catch {
    return [];
  }
}
