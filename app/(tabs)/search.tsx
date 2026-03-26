import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { brand } from '@/constants/Colors';
import { searchProducts } from '@/lib/openfoodfacts';

type SearchResult = {
  barcode: string;
  productName: string;
  brand: string;
  imageUrl?: string;
  nutriscoreGrade?: string;
};

type FilterType = 'all' | 'excellent' | 'good' | 'limit' | 'avoid';

const CATEGORIES = [
  { id: 'protein-bars', label: 'Protein Bars', query: 'protein bar', color: '#DCFCE7' },
  { id: 'snacks', label: 'Snacks', query: 'organic snacks', color: '#FEF3C7' },
  { id: 'cereals', label: 'Cereals', query: 'breakfast cereal', color: '#DBEAFE' },
  { id: 'drinks', label: 'Drinks', query: 'natural juice', color: '#F3E8FF' },
  { id: 'dairy', label: 'Dairy', query: 'organic milk yogurt', color: '#FEE2E2' },
  { id: 'baby-food', label: 'Baby Food', query: 'organic baby food', color: '#E0E7FF' },
  { id: 'condiments', label: 'Condiments', query: 'organic sauce condiment', color: '#DCFCE7' },
  { id: 'bread', label: 'Bread', query: 'whole grain bread', color: '#FEF3C7' },
];

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'excellent', label: 'Excellent' },
  { key: 'good', label: 'Good' },
  { key: 'limit', label: 'Limit' },
  { key: 'avoid', label: 'Avoid' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    const res = await searchProducts(q);
    setResults(res);
    setLoading(false);
  }, [query]);

  const handleCategoryTap = (cat: typeof CATEGORIES[0]) => {
    setActiveCategory(cat.id);
    setQuery(cat.label);
    handleSearch(cat.query);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setActiveCategory(null);
  };

  const getScoreFromGrade = (grade?: string) => {
    if (!grade) return null;
    const map: Record<string, number> = { a: 90, b: 70, c: 50, d: 30, e: 10 };
    return map[grade] || null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return brand.score.excellent;
    if (score >= 60) return brand.score.good;
    if (score >= 30) return brand.score.limit;
    return brand.score.avoid;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>Q</Text>
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
          {query.length > 0 && (
            <Pressable onPress={clearSearch} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Filter Chips */}
        {searched && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>Searching products...</Text>
        </View>
      )}

      {/* Search Results */}
      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.barcode}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const score = getScoreFromGrade(item.nutriscoreGrade);
            return (
              <Pressable
                style={({ pressed }) => [styles.resultItem, pressed && styles.resultItemPressed]}
                onPress={() => router.push(`/product/${item.barcode}`)}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
                ) : (
                  <View style={[styles.resultImage, styles.resultPlaceholder]}>
                    <Text style={styles.placeholderText}>N/A</Text>
                  </View>
                )}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={2}>{item.productName}</Text>
                  <Text style={styles.resultBrand}>{item.brand}</Text>
                </View>
                {score && (
                  <View style={[styles.resultScore, { backgroundColor: getScoreColor(score) + '18' }]}>
                    <View style={[styles.resultScoreDot, { backgroundColor: getScoreColor(score) }]} />
                    <Text style={[styles.resultScoreNum, { color: getScoreColor(score) }]}>{score}</Text>
                  </View>
                )}
                <Text style={styles.resultArrow}>›</Text>
              </Pressable>
            );
          }}
        />
      )}

      {/* No Results */}
      {!loading && searched && results.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>?</Text></View>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try a different search term{'\n'}or scan the barcode directly</Text>
        </View>
      )}

      {/* Browse Categories (shown when not searching) */}
      {!searched && !loading && (
        <ScrollView contentContainerStyle={styles.browseContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.browseTitle}>Browse by Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [styles.categoryCard, { backgroundColor: cat.color }, pressed && styles.categoryCardPressed]}
                onPress={() => handleCategoryTap(cat)}
              >
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryArrow}>→</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.browseTitle, { marginTop: 28 }]}>Popular Searches</Text>
          <View style={styles.popularRow}>
            {['Chips Ahoy', 'Lays', 'Coca Cola', 'Annie\'s', 'Kind Bar', 'Fairlife'].map((term) => (
              <Pressable
                key={term}
                style={styles.popularChip}
                onPress={() => { setQuery(term); handleSearch(term); }}
              >
                <Text style={styles.popularChipText}>{term}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
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
  searchIcon: { fontSize: 16, fontWeight: '800', color: '#9CA3AF', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  clearBtn: { padding: 6 },
  clearText: { fontSize: 16, color: '#9CA3AF', fontWeight: '600' },

  filterRow: { marginTop: 12, marginBottom: 4 },
  filterContent: { gap: 8, paddingRight: 20 },
  filterChip: {
    paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#9CA3AF' },

  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 8 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 14, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  resultItemPressed: { transform: [{ scale: 0.98 }], backgroundColor: '#F9FAFB' },
  resultImage: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F3F4F6' },
  resultPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 11, color: '#D1D5DB', fontWeight: '600' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  resultBrand: { fontSize: 13, color: '#9CA3AF', marginTop: 3 },
  resultScore: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, gap: 6 },
  resultScoreDot: { width: 8, height: 8, borderRadius: 4 },
  resultScoreNum: { fontSize: 16, fontWeight: '800' },
  resultArrow: { fontSize: 24, color: '#D1D5DB', fontWeight: '300' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyIconText: { fontSize: 24, color: '#D1D5DB', fontWeight: '700' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },

  browseContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  browseTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '47%', borderRadius: 16, padding: 18, minHeight: 80,
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  categoryCardPressed: { transform: [{ scale: 0.97 }] },
  categoryLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  categoryArrow: { fontSize: 18, color: '#6B7280', alignSelf: 'flex-end', marginTop: 8 },

  popularRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  popularChip: {
    backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 18,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  popularChipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
