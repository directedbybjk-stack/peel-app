import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  gradientColors: [string, string];
  query: string;
  products: Product[];
  loading: boolean;
};

const INITIAL_CATEGORIES: Category[] = [
  { id: 'protein-bars', label: 'Protein Bars', icon: 'barbell-outline', iconColor: '#92400E', gradientColors: ['#FEF3C7', '#FDE68A'], query: 'protein bar', products: [], loading: true },
  { id: 'snacks', label: 'Snacks', icon: 'pizza-outline', iconColor: '#BE185D', gradientColors: ['#FFE4E6', '#FECDD3'], query: 'chips snack crackers', products: [], loading: true },
  { id: 'drinks', label: 'Water', icon: 'water-outline', iconColor: '#1D4ED8', gradientColors: ['#DBEAFE', '#BFDBFE'], query: 'water', products: [], loading: true },
  { id: 'cereals', label: 'Cereals', icon: 'cafe-outline', iconColor: '#7C3AED', gradientColors: ['#F3E8FF', '#E9D5FF'], query: 'breakfast cereal granola', products: [], loading: true },
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
        <LinearGradient colors={['#F0FDF4', '#F5F7F5']} style={styles.headerGradient}>
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
        </LinearGradient>

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
                <Pressable
                  style={({ pressed }) => [styles.resultCard, pressed && { transform: [{ scale: 0.98 }] }]}
                  onPress={() => router.push(`/product/${item.barcode}`)}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
                  ) : (
                    <View style={[styles.resultImage, styles.brandPlaceholder]}>
                      <Text style={styles.brandInitial}>
                        {(item.brand || item.productName || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
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
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={32} color="#D1D5DB" />
            </View>
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
      <ScrollView contentContainerStyle={styles.catalogContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
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

        {/* Category Icons */}
        <Text style={styles.topLabel}>Top Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPills}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryPill]}
                onPress={() => setActiveCategory(isActive ? null : cat.id)}
              >
                <View style={[styles.categoryIconCircle, isActive && styles.categoryIconCircleActive]}>
                  <LinearGradient
                    colors={isActive ? ['#DCFCE7', '#BBF7D0'] : cat.gradientColors}
                    style={styles.categoryIconGradient}
                  >
                    <Ionicons name={cat.icon} size={28} color={isActive ? brand.primary : cat.iconColor} />
                  </LinearGradient>
                </View>
                <Text style={[styles.categoryPillLabel, isActive && styles.categoryPillLabelActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Category Sections */}
        {categories
          .filter((cat) => !activeCategory || cat.id === activeCategory)
          .map((cat) => (
          <View key={cat.id} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{cat.label}</Text>
              <Pressable
                onPress={() => { setQuery(cat.label); handleSearch(cat.query); }}
                style={({ pressed }) => [styles.viewAllBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.viewAll}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
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
                      style={({ pressed }) => [styles.productCard, pressed && { transform: [{ scale: 0.97 }] }]}
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
  headerGradient: { paddingTop: 0 },
  headerArea: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 12 },
  searchBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, height: 50,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  cancelBtn: { paddingVertical: 8 },
  cancelText: { fontSize: 15, fontWeight: '600', color: brand.primary },

  // Search Bar in scroll
  searchBarWrap: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },

  // Category Icons
  topLabel: { fontSize: 20, fontWeight: '800', color: '#111827', paddingHorizontal: 20, marginBottom: 16 },
  categoryPills: { paddingHorizontal: 20, gap: 16, marginBottom: 28 },
  categoryPill: { alignItems: 'center', gap: 8 },
  categoryIconCircle: {
    width: 72, height: 72, borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  categoryIconCircleActive: {
    shadowColor: '#16A34A', shadowOpacity: 0.2, shadowRadius: 10,
  },
  categoryIconGradient: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryPillLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  categoryPillLabelActive: { color: brand.primary, fontWeight: '700' },

  // Catalog
  catalogContent: { paddingBottom: 120 },
  categorySection: { marginBottom: 28 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  categoryTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAll: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  categoryLoading: { height: 180, alignItems: 'center', justifyContent: 'center' },

  productRow: { paddingHorizontal: 20, gap: 12 },
  productCard: { width: 165 },
  productImageWrap: {
    width: 165, height: 155, borderRadius: 18, backgroundColor: '#FFFFFF', overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  productScoreDot: {
    position: 'absolute', bottom: 10, left: 10, width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 19, paddingHorizontal: 2, marginBottom: 3 },
  productBrand: { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 2 },

  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  brandPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
  brandInitial: { fontSize: 24, fontWeight: '800', color: '#16A34A' },

  // Search Results
  resultsList: { paddingHorizontal: 20, paddingBottom: 120, gap: 10 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 18, padding: 14, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  resultImage: { width: 68, height: 68, borderRadius: 14, backgroundColor: '#F0FDF4' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  resultBrand: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  resultScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },
  resultScoreNum: { fontSize: 14, fontWeight: '700', color: '#374151' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
});
