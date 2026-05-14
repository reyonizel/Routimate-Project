import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PRODUCTS, CATEGORIES } from '../../lib/products';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 16 * 2 - 12) / 2;

const BG = '#FFFFFF'; const CARD = '#F4F4F4';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const GREEN = '#00bf63';

export const useCart = () => {
  const [cart, setCart] = useState<string[]>([]);
  const addToCart = (id: string) => setCart(prev => prev.includes(id) ? prev : [...prev, id]);
  const total = cart.reduce((sum, id) => sum + (PRODUCTS.find(p => p.id === id)?.price ?? 0), 0);
  return { cart, addToCart, total };
};

export default function StoreScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [cart, setCart] = useState<string[]>([]);

  const filtered = activeCategory === 'Tümü' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);
  const cartCount = cart.length;
  const cartTotal = cart.reduce((sum, id) => sum + (PRODUCTS.find(p => p.id === id)?.price ?? 0), 0);

  const addToCart = (id: string) => setCart(prev => prev.includes(id) ? prev : [...prev, id]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>RoutinMate</Text>
          <Text style={s.headerTitle}>Mağaza</Text>
        </View>
        <TouchableOpacity style={s.cartBtn} activeOpacity={0.8}>
          <Ionicons name="bag-outline" size={22} color={TEXT} />
          {cartCount > 0 && (
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeTxt}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.catChip, activeCategory === cat && s.catChipOn]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[s.catChipTxt, activeCategory === cat && s.catChipTxtOn]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.grid}>
        {Array.from({ length: Math.ceil(filtered.length / 2) }, (_, row) => (
          <View key={row} style={s.gridRow}>
            {filtered.slice(row * 2, row * 2 + 2).map(product => {
              const inCart = cart.includes(product.id);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={s.productCard}
                  onPress={() => router.push(`/product-detail?id=${product.id}`)}
                  activeOpacity={0.9}
                >
                  {product.badge && (
                    <View style={s.badge}>
                      <Text style={s.badgeTxt}>{product.badge}</Text>
                    </View>
                  )}
                  <View style={[s.productImg, { backgroundColor: product.bg }]}>
                    <Text style={s.productEmoji}>{product.emoji}</Text>
                  </View>
                  <View style={s.productBody}>
                    <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
                    <View style={s.productFooter}>
                      <Text style={s.productPrice}>₺{product.price}</Text>
                      <TouchableOpacity
                        style={[s.addBtn, inCart && s.addBtnDone]}
                        onPress={e => { e.stopPropagation?.(); addToCart(product.id); }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name={inCart ? 'checkmark' : 'add'} size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerSub: { fontSize: 12, color: TEXT3, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 26, color: TEXT, fontWeight: '900', letterSpacing: -0.5 },
  cartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: 7, right: 7, backgroundColor: GREEN, width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cartBadgeTxt: { fontSize: 9, fontWeight: '900', color: '#fff' },
  catScroll: { flexGrow: 0, marginBottom: 12 },
  catRow: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  catChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: CARD },
  catChipOn: { backgroundColor: TEXT },
  catChipTxt: { fontSize: 13, fontWeight: '600', color: TEXT2 },
  catChipTxtOn: { color: '#fff' },
  grid: { paddingHorizontal: 16, gap: 12, paddingTop: 4 },
  gridRow: { flexDirection: 'row', gap: 12 },
  productCard: { width: CARD_W, backgroundColor: CARD, borderRadius: 16, overflow: 'hidden' },
  badge: { position: 'absolute', top: 8, left: 8, zIndex: 10, backgroundColor: GREEN, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },
  productImg: { width: '100%', height: CARD_W * 0.75, alignItems: 'center', justifyContent: 'center' },
  productEmoji: { fontSize: 44 },
  productBody: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '700', color: TEXT, lineHeight: 17, marginBottom: 8 },
  productFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productPrice: { fontSize: 15, fontWeight: '900', color: TEXT },
  addBtn: { width: 28, height: 28, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  addBtnDone: { backgroundColor: TEXT3 },
});
