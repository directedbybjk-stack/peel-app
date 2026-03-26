# Peel — Competitive Analysis

## Competitors

### Olive (4.8★, 24K reviews, $70/yr)
- Food barcode scanner focused on toxins, seed oils, allergens
- 1M+ product database
- Includes restaurant finder and nutritionist coaching
- Built by Giga Studios, Inc

### Yuka (4.8★, 89K reviews, free + $10/yr premium)
- Food AND cosmetics barcode scanner
- Color-coded scoring (Excellent/Good/Mediocre/Bad)
- Alternative product suggestions
- More established, broader scope

---

## Competitor Weaknesses (Our Opportunities)

### Olive's Problems
| Issue | Frequency | Our Advantage |
|-------|-----------|---------------|
| **$70/yr paywall with no free tier** | 33% of negative reviews | Generous free tier + affordable premium |
| **39-step onboarding before paywall** | 20% of negative reviews | Scan your first item in under 30 seconds |
| **Inaccurate data / contradictory scores** | 18% of negative reviews | Open Food Facts + user-verified data |
| **Technical bugs (login, loading)** | 15% of negative reviews | Solid engineering, Supabase reliability |
| **Deceptive free trial charges** | 10% of negative reviews | Transparent pricing, no sneaky charges |

### Yuka's Problems
| Issue | Frequency | Our Advantage |
|-------|-----------|---------------|
| **Ignores seed oils entirely** | Top complaint | Seed oil detection is a core feature |
| **Oversimplified scoring (no nuance)** | Common | Contextual scoring with portion awareness |
| **No dark mode** | Repeated request | Dark mode from day one |
| **Camera focus issues** | Technical complaint | Modern expo-camera with macro support |
| **Binary good/bad labels cause anxiety** | Psychological concern | Gentler, educational approach |

---

## Peel's Differentiation Strategy

### 1. Instant Value (No Paywall Gate)
- Scan your first product immediately — no account required
- Free tier: 10 scans/day (enough for a grocery trip)
- Premium unlocks: unlimited scans, scan history, alternatives, custom alerts

### 2. Seed Oil + Additive Focus
- Built for the "clean eating" movement Yuka ignores
- Flag seed oils, artificial dyes, PFAS, microplastics
- Clear explanations of WHY each ingredient is flagged

### 3. Fast Onboarding
- Skip straight to scanning (no 39-step questionnaire)
- Optional dietary profile setup AFTER first scan
- User sees value before we ask for anything

### 4. Accurate, Transparent Data
- Open Food Facts as base (3M+ products, community-verified)
- Show exactly how scores are calculated
- User can report incorrect data

### 5. Pricing That Doesn't Feel Like a Scam
- Free: 10 scans/day
- Premium: $4.99/month or $29.99/year (vs Olive's $70/yr)
- No sneaky free trial auto-charges

### 6. Dark Mode + Clean UI
- Dark mode from day one (Yuka users beg for this)
- Minimalist design, fast and focused

---

## Feature Priority (MVP)

### Phase 1 (MVP)
- [ ] Barcode scanning (expo-camera)
- [ ] Product lookup (Open Food Facts API)
- [ ] Health score with ingredient breakdown
- [ ] Seed oil / additive flagging
- [ ] Dark mode
- [ ] Basic onboarding (dietary preferences)

### Phase 2
- [ ] Healthier alternative suggestions
- [ ] Scan history
- [ ] Custom allergy/sensitivity alerts
- [ ] User accounts (Supabase auth)

### Phase 3
- [ ] RevenueCat paywall (freemium)
- [ ] Cosmetics/personal care scanning
- [ ] Community data corrections
- [ ] Share scores with friends
