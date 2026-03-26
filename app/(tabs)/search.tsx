import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
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

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await searchProducts(query.trim());
    setResults(res);
    setLoading(false);
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>Search</Text>
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="Search by product or brand..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Text style={styles.clearButton}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      )}

      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.barcode}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.resultItem}
              onPress={() => router.push(`/product/${item.barcode}`)}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
              ) : (
                <View style={[styles.resultImage, styles.resultPlaceholder]}>
                  <Text style={{ color: '#9CA3AF', fontSize: 12 }}>N/A</Text>
                </View>
              )}
              <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={2}>{item.productName}</Text>
                <Text style={styles.resultBrand}>{item.brand}</Text>
              </View>
              <Text style={styles.resultArrow}>›</Text>
            </Pressable>
          )}
        />
      )}

      {!loading && searched && results.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>--</Text>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try a different search term or scan the barcode directly</Text>
        </View>
      )}

      {!searched && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>Search</Text>
          <Text style={styles.emptyTitle}>Find any product</Text>
          <Text style={styles.emptySubtitle}>Search by product name or brand</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 14, paddingHorizontal: 14, height: 50,
  },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  clearButton: { fontSize: 18, color: '#9CA3AF', padding: 4 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 8 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 14, padding: 12, gap: 12,
  },
  resultImage: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#E5E7EB' },
  resultPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  resultBrand: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  resultArrow: { fontSize: 24, color: '#D1D5DB' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
});
