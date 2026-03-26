import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { brand } from '@/constants/Colors';
import { searchProducts } from '@/lib/openfoodfacts';

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
  query: string;
  products: Product[];
  loading: boolean;
};

const INITIAL_CATEGORIES: Category[] = [
  { id: 'protein-bars', label: 'Protein Bars', query: 'protein bar', products: [], loading: true },
  { id: 'snacks', label: 'Snacks', query: 'chips snack crackers', products: [], loading: true },
  { id: 'cereals', label: 'Cereals', query: 'breakfast cereal granola', products: [], loading: true },
  { id: 'drinks', label: 'Beverages', query: 'juice soda water drink', products: [], loading: true },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  // Load real products for each category on mount
  useEffect(() => {
    INITIAL_CATEGORIES.forEach(async (cat, index) => {
      const products = await searchProducts(cat.query);
      // Only keep products with images
      const withImages = products.filter((p) => p.imageUrl);
      setCategories((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], products: withImages.slice(0, 10), loading: false };
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

  const getScoreFromGrade = (grade?: string) => {
    if (!grade) return null;
    const map: Record<string, number> = { a: 90, b: 70, c: 50, d: 30, e: 10 };
    return map[grade] || null;
  };

  const getScoreColor = (s: number) => s >= 80 ? brand.score.excellent : s >= 60 ? brand.score.good : s >= 30 ? brand.score.limit : brand.score.avoid;

  // Search results view
  if (searched) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products or brands..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
              autoCorrect={false}
            />
            <Pressable onPress={clearSearch} style={styles.clearBtn}>
              <Text style={styles.clearText}>Cancel</Text>
            </Pressable>
          </View>
        </View>

        {searchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.barcode}
            contentContainerStyle={styles.resultsList}
            renderItem={({ item }) => {
              const score = getScoreFromGrade(item.nutriscoreGrade);
              return (
                <Pressable style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.7 }]} onPress={() => router.push(`/product/${item.barcode}`)}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
                  ) : (
                    <View style={[styles.resultImage, styles.placeholder]}><Text style={styles.placeholderText}>N/A</Text></View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.resultBrand}>{item.brand}</Text>
                  </View>
                  {score && (
                    <View style={styles.resultScoreContainer}>
                      <View style={[styles.scoreDot, { backgroundColor: getScoreColor(score) }]} />
                      <Text style={[styles.resultScore, { color: getScoreColor(score) }]}>{score}/100</Text>
                    </View>
                  )}
                  <Text style={styles.arrow}>›</Text>
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

  // Browse catalog view (default)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Pressable style={styles.searchBar} onPress={() => {}}>
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="Search products or brands..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCorrect={false}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.catalogContent} showsVerticalScrollIndicator={false}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{cat.label}</Text>
              <Pressable onPress={() => { setQuery(cat.label); handleSearch(cat.query); }}>
                <Text style={styles.viewAll}>View All ›</Text>
              </Pressable>
            </View>

            {cat.loading ? (
              <View style={styles.categoryLoading}>
                <ActivityIndicator color="#16A34A" />
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
                {cat.products.map((product) => {
                  const score = getScoreFromGrade(product.nutriscoreGrade);
                  return (
                    <Pressable
                      key={product.barcode}
                      style={({ pressed }) => [styles.productCard, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                      onPress={() => router.push(`/product/${product.barcode}`)}
                    >
                      {product.imageUrl ? (
                        <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                      ) : (
                        <View style={[styles.productImage, styles.placeholder]}><Text style={styles.placeholderText}>N/A</Text></View>
                      )}
                      {score && (
                        <View style={[styles.productScore, { backgroundColor: getScoreColor(score) }]}>
                          <Text style={styles.productScoreText}>{score}</Text>
                        </View>
                      )}
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: '#111827', marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingHorizontal: 16, height: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  clearBtn: { marginLeft: 10 },
  clearText: { fontSize: 15, fontWeight: '600', color: '#16A34A' },

  // Catalog
  catalogContent: { paddingBottom: 120 },
  categorySection: { marginBottom: 28 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  categoryTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  viewAll: { fontSize: 14, fontWeight: '700', color: '#16A34A' },
  categoryLoading: { height: 160, alignItems: 'center', justifyContent: 'center' },

  productRow: { paddingHorizontal: 20, gap: 12 },
  productCard: {
    width: 140, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  productImage: { width: '100%', height: 120, backgroundColor: '#F3F4F6' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 12, color: '#D1D5DB' },
  productScore: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  productScoreText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  productName: { fontSize: 13, fontWeight: '600', color: '#111827', paddingHorizontal: 10, paddingTop: 10, lineHeight: 18 },
  productBrand: { fontSize: 11, color: '#9CA3AF', paddingHorizontal: 10, paddingBottom: 12, paddingTop: 2 },

  // Search Results
  resultsList: { paddingHorizontal: 20, paddingBottom: 120, gap: 8 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 14, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  resultImage: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F3F4F6' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  resultBrand: { fontSize: 13, color: '#9CA3AF', marginTop: 3 },
  resultScoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  resultScore: { fontSize: 14, fontWeight: '800' },
  arrow: { fontSize: 24, color: '#D1D5DB' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
});
