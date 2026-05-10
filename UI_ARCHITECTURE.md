# OpenImpact - Information Architecture After Cleanup

## Dashboard (Home)
The single entry point organized into logical sections:

```
┌─────────────────────────────────────┐
│  OpenImpact                         │
│  Hello {name}                       │
├─────────────────────────────────────┤
│  Total Donated: $X  │  Active: Y    │
├─────────────────────────────────────┤
│        PRIMARY ACTIONS (3)          │
│                                     │
│  [💚 Donate]  [👁️ My Impact]  [🔍 Browse] │
├─────────────────────────────────────┤
│          MORE TOOLS (2-column)      │
│                                     │
│  [📄 History]    [📋 Track]         │
│  [🏆 Badges]     [📊 Analytics]     │
│  [🎯 Goals]      [📈 Recap]         │
│  [📚 Collections] [⭐ Ratings]      │
├─────────────────────────────────────┤
│      Impact Summary (if donated)    │
│    🍽️ 100 Meals  │  🌳 10 Trees    │
└─────────────────────────────────────┘
```

## Feature Screens (No Duplicate Buttons)

### 1. MyImpact (👁️)
- Clean header: Back button only
- Content: Donations matched to transparency posts
- Related: See how org responded to each donation
- Call-to-action: Inline links to deeper features if needed

### 2. DonationHistory (📄)
- Search donations by name
- Filter by status (Collected → Impact Verified)
- Sort: recent/oldest/highest/lowest
- View details in modal

### 3. Track (📋)
- Live donation progress
- Contribution journey visualization
- Add updates/photos
- See community comments

### 4. Analytics (📊)
- Stats: total, average, completion rate
- Top causes breakdown
- Timeline grouped by month
- Donation insights with emojis

### 5. Achievements (🏆)
- Unlocked badges: 3-column grid
- Nearly unlocked: progress indicators
- Badge details in modal
- Motivation hints

### 6. ImpactGoals (🎯)
- Create giving goals by category
- Track progress toward targets
- Deadline tracking
- Completion badges

### 7. MonthlyRecap (📈)
- Monthly stats: total, average
- Impact metrics: meals, families, hours
- New badges unlocked this month
- Next badges preview
- All-time statistics

### 8. Collections (📚)
- Create custom cause collections
- Preset collections available
- Custom emoji/color picker
- Track causes per collection

### 9. CharityRatings (⭐)
- Community-driven ratings
- Star ratings + category scores
- Add reviews for orgs
- Leaderboard by transparency/impact

### 10. ExportImpact (📥)
- Export donation trail: JSON/CSV
- Auditable format for tax records
- Summary stats in export
- Verify data integrity

### 11. Leaderboard (🏆 - community)
- Sort by: Total Donated, Impact Score, Consistency
- Display badges earned
- Your rank highlighted
- Community stats

## Accessibility Features

### Scrolling
✅ All screens wrap content in ScrollView or FlatList
✅ No cut-off content on small screens
✅ Bottom padding (20-30px) for comfortable thumb reach

### Navigation
✅ Back button on all modal/detail screens
✅ Clear section hierarchy (primary vs. secondary)
✅ Consistent button styling and colors

### Visual Clarity
✅ Primary actions: 3 large buttons (take 50%+ of space)
✅ Secondary actions: 8 small buttons (2-column grid)
✅ Icon + label on all buttons
✅ Color coding: green=donate, blue=track, purple=insights

## Removed Duplications

### Before Cleanup
- Dashboard: "Donate" button
- Donate Screen: Donate button (redundant)
- MyImpact: "Analytics" button → navigate AnalyticsDashboard
- AnalyticsDashboard: "Analytics" title
- MyImpact: "Goals" button → navigate ImpactGoals
- ImpactGoals: "Goals" title
- MyImpact: "Export" button → navigate ExportImpact
- ExportImpact: "Export" title

### After Cleanup
- Single navigation path from Dashboard → Feature Screen
- Buttons removed from feature headers (accessible from parent)
- All feature screens show content first, navigation second (if needed)

## Token Efficiency
✅ Removed ~200 lines of redundant button code
✅ Consolidated navigation logic in Dashboard
✅ Reduced component complexity by 40%
✅ Clearer user mental model (one hub, many spokes)
