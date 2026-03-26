import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { brand } from '@/constants/Colors';
import { searchProducts } from '@/lib/openfoodfacts';
import { FALLBACK_CATALOG } from '@/lib/fallback-products';

type Product = {
  barcode: string;
  productName: string;
  brand: string;
  imageUrl?: string;
  nutriscoreGrade?: string;
};

type Category = {
  id: string;
  label: string;
  icon: string;
  query: string;
  products: Product[];
  loading: boolean;
};

const INITIAL_CATEGORIES: Category[] = [
  { id: 'protein-bars', label: 'Protein Bars', icon: 'barbell-outline', query: 'protein bar', products: [], loading: true },
  { id: 'snacks', label: 'Snacks', icon: 'pizza-outline', query: 'chips snack crackers', products: [], loading: true },
  { id: 'drinks', label: 'Water', icon: 'water-outline', query: 'water', products: [], loading: true },
  { id: 'cereals', label: 'Cereals', icon: 'cafe-outline', query: 'breakfast cereal granola', products: [], loading: true },
];

const getScoreFromGrade = (grade?: string) => {
  if (!grade) return null;
  const map: Record<string, number> = { a: 90, b: 70, c: 50, d: 30, e: 10 };
  return map[grade] || null;
};

const getScoreColor = (s: number) =>
  s >= 80 ? brand.score.excellent : s >= 60 ? brand.score.good : s >= 30 ? brand.score.limit : brand.score.avoid;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    INITIAL_CATEGORIES.forEach(async (cat, index) => {
      try {
        const products = await searchProducts(cat.query);
        const withImages = products.filter((p) => p.imageUrl);
        if (withImages.length > 0) {
          setCategories((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], products: withImages.slice(0, 10), loading: false };
            return updated;
          });
          return;
        }
      } catch {}
      const fallback = FALLBACK_CATALOG[cat.id] || [];
      setCategories((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], products: fallback, loading: false };
        return updated;
      });
    });
  }, []);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) return;
    setSearchLoading(true);
    setSearched(true);
    const res = await searchProducts(q);
    setSearchResults(res);
    setSearchLoading(false);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setSearched(false);
  };

  // Search results view
  if (searched) {
    return (
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <View style={styles.searchBarRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleSearch()}
                returnKeyType="search"
                autoCorrect={false}
              />
            </View>
            <Pressable onPress={clearSearch} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>

        {searchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brand.primary} />
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.barcode}
            contentContainerStyle={styles.resultsList}
            renderItem={({ item }) => {
              const score = getScoreFromGrade(item.nutriscoreGrade);
              return (
                <Pressable style={({ pressed }) => [styles.resultCard, pressed && { opacity: 0.8 }]} onPress={() => router.push(`/product/${item.barcode}`)}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
                  ) : (
                    <View style={[styles.resultImage, styles.placeholder]}><Text style={styles.placeholderText}>N/A</Text></View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.resultBrand}>{item.brand}</Text>
                    {score != null && (
                      <View style={styles.resultScoreRow}>
                        <View style={[styles.scoreDot, { backgroundColor: getScoreColor(score) }]} />
                        <Text style={styles.resultScoreNum}>{score}/100</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </Pressable>
              );
            }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try a different search term</Text>
          </View>
        )}
      </View>
    );
  }

  // Browse catalog view
  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.catalogContent} showsVerticalScrollIndicator={false}>
        {/* Category Icons */}
        <Text style={styles.topLabel}>Top Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPills}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.categoryPill, activeCategory === cat.id && styles.categoryPillActive]}
              onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            >
              <View style={[styles.categoryIconCircle, activeCategory === cat.id && styles.categoryIconCircleActive]}>
                <Ionicons name={cat.icon as any} size={28} color={activeCategory === cat.id ? brand.primary : '#6B7280'} />
              </View>
              <Text style={[styles.categoryPillLabel, activeCategory === cat.id && styles.categoryPillLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Category Sections */}
        {categories
          .filter((cat) => !activeCategory || cat.id === activeCategory)
          .map((cat) => (
          <View key={cat.id} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{cat.label}</Text>
              <Pressable onPress={() => { setQuery(cat.label); handleSearch(cat.query); }}>
                <Text style={styles.viewAll}>View All  ›</Text>
              </Pressable>
            </View>

            {cat.loading ? (
              <View style={styles.categoryLoading}>
                <ActivityIndicator color={brand.primary} />
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
                {cat.products.map((product) => {
                  const score = getScoreFromGrade(product.nutriscoreGrade);
                  return (
                    <Pressable
                      key={product.barcode}
                      style={({ pressed }) => [styles.productCard, pressed && { opacity: 0.8 }]}
                      onPress={() => router.push(`/product/${product.barcode}`)}
                    >
                      <View style={styles.productImageWrap}>
                        <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                        {score != null && (
                          <View style={[styles.productScoreDot, { backgroundColor: getScoreColor(score) }]} />
                        )}
                      </View>
                      <Text style={styles.productName} numberOfLines={2}>{product.productName}</Text>
                      <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  headerArea: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 8 },
  searchBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 16, height: 48,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  cancelBtn: { paddingVertical: 8 },
  cancelText: { fontSize: 15, fontWeight: '600', color: brand.primary },

  // Category Icons
  topLabel: { fontSize: 20, fontWeight: '800', color: '#111827', paddingHorizontal: 20, marginTop: 12, marginBottom: 14 },
  categoryPills: { paddingHorizontal: 20, gap: 16, marginBottom: 24 },
  categoryPill: { alignItems: 'center', gap: 6 },
  categoryPillActive: {},
  categoryIconCircle: {
    width: 68, height: 68, borderRadius: 20, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  categoryIconCircleActive: { borderColor: brand.primary, backgroundColor: '#F0FDF4' },
  categoryPillLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  categoryPillLabelActive: { color: brand.primary },

  // Catalog
  catalogContent: { paddingBottom: 120 },
  categorySection: { marginBottom: 28 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  categoryTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  viewAll: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  categoryLoading: { height: 180, alignItems: 'center', justifyContent: 'center' },

  productRow: { paddingHorizontal: 20, gap: 12 },
  productCard: { width: 160 },
  productImageWrap: {
    width: 160, height: 150, borderRadius: 16, backgroundColor: '#FFFFFF', overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  productScoreDot: { position: 'absolute', bottom: 10, left: 10, width: 12, height: 12, borderRadius: 6 },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 19, paddingHorizontal: 2, marginBottom: 2 },
  productBrand: { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 2 },

  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  placeholderText: { fontSize: 12, color: '#D1D5DB' },

  // Search Results
  resultsList: { paddingHorizontal: 20, paddingBottom: 120, gap: 10 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 14, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
  resultImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F3F4F6' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  resultBrand: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  resultScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },
  resultScoreNum: { fontSize: 14, fontWeight: '700', color: '#374151' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
});
