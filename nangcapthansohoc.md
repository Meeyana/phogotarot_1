# Nâng Cấp Thần Số Học – Hệ Thống Freemium Dual-Tier

## 🎯 Mục Tiêu

Chuyển đổi trang Thần Số Học từ miễn phí hoàn toàn sang mô hình **Freemium 2 tầng**:
- **Tầng 1 – Credit:** Mua credit để mở khóa luận giải chuyên sâu cho **từng hồ sơ** (tên + ngày sinh). Nội dung đã unlock → xem vĩnh viễn.
- **Tầng 2 – Premium (Subscription):** Xem tất cả hồ sơ, tất cả nội dung mà không cần credit. Khi hết hạn Premium, các hồ sơ đã từng xem vẫn giữ lại vĩnh viễn.

---

## I. Đánh Giá Hiện Trạng

### ✅ Điểm Mạnh

| # | Điểm mạnh | Chi tiết |
|---|-----------|----------|
| 1 | **Hệ thống tính toán chính xác & phong phú** | `src/utils/numerology.js` có 14+ hàm: Life Path, Destiny, Soul, Personality, Attitude, Maturity, Rational Thought, Pyramid, Period Cycles, Karmic Debt/Lessons, Personality %, Career %, Forecast, Chart Data |
| 2 | **SSR đúng chuẩn** | Logic tính toán chạy server (Astro frontmatter), chỉ pass data đã lọc xuống client → SEO tốt |
| 3 | **Dữ liệu JSON đầy đặn** | `src/data/numerology-data.json` 292KB, block-based content (text/list/quote) |
| 4 | **Server-Side Filtering** | `filteredData` lọc đúng data user cần, không gửi 292KB toàn bộ |
| 5 | **Credit & Auth sẵn sàng** | DB: `credit_wallets`, `credit_transactions`, `payment_transactions`. Auth session + middleware. `nap-credit.astro` có QR VietQR |
| 6 | **UX/UI chất lượng** | Mandala hero, glass cards, Chart.js, Kim Tự Tháp SVG, TOC, Read More, fade-in |

### ❌ Điểm Yếu Chết Người

#### 1. 🔴 FILE MONOLITHIC 1,345 DÒNG

> **NGUY HIỂM:** File `src/pages/ket-qua-than-so-hoc.astro` = **1,345 dòng / 70KB** chứa tất cả: frontmatter, HTML, rendering engine JS, chart drawing, TOC, read more. Không thể gắn paywall riêng từng section.

#### 2. 🔴 DATA PREMIUM LỘ 100% TRÊN CLIENT

> **NGUY HIỂM:** Dù lọc ở server, `filteredData` vẫn pass 100% xuống client qua `define:vars` (dòng 468-486). Data được Astro serialize thành JSON literal ngay trong HTML source code.
>
> **Cách xem dữ liệu bị lộ:**
> - Ctrl+U (View Page Source) → Ctrl+F tìm `serverFilteredData` → Thấy TOÀN BỘ JSON luận giải
> - Hoặc paste vào Console:
> ```js
> const scripts = document.querySelectorAll('script:not([src])');
> scripts.forEach((s, i) => {
>   if (s.textContent.includes('serverFilteredData')) {
>     console.log('TÌM THẤY! Script thứ', i);
>     console.log(s.textContent.substring(0, 2000)); // Xem 2000 ký tự đầu
>   }
> });
> ```
>
> Ẩn bằng CSS/JS trên frontend = hoàn toàn vô dụng.

#### 3. 🔴 RENDERING 100% CLIENT-SIDE

> **CẢNH BÁO:** `renderLifePath()`, `renderCoreStatsDetails()`, `renderKarmicDebts()`... tất cả chạy bằng JS DOM manipulation. Server chỉ render placeholder "Đang tải..." → SEO kém, không kiểm soát security ở server.

#### 4. 🟡 KHÔNG CÓ METADATA PHÂN TIER

Không có cơ chế phân biệt Free/Premium trong data. Mọi content ngang hàng nhau.

#### 5. 🟡 KHÔNG YÊU CẦU LOGIN Ở TRANG KẾT QUẢ

Data truyền qua URL query params → bất kỳ ai copy link đều xem được.

---

## II. Mô Hình Business Freemium Dual-Tier

### Quy tắc cốt lõi

| Quy tắc | Giải thích |
|---------|-----------|
| **FREE xem thoải mái** | Ai cũng xem được: Số chủ đạo (tổng quan), biểu đồ visual, kim tự tháp visual, biểu đồ tính cách/nghề nghiệp, biểu đồ sóng |
| **Credit = unlock theo từng profile** | Trả X credit → mở khóa MỌI section premium cho 1 hồ sơ (tên + ngày sinh). **Vĩnh viễn.** |
| **Premium = xem tất cả profile** | Subscription active → tự do tra bất kỳ tên nào, không tốn credit |
| **Hạ cấp giữ lại** | Premium hết hạn → chuyển về Free+Credit tier, nhưng **tất cả hồ sơ đã từng xem (qua credit hoặc premium) đều giữ vĩnh viễn** |

### User Flow

```
User nhập Tên + Ngày Sinh
    │
    ├── Chưa đăng nhập → Xem phần FREE → Thấy paywall ở Premium sections
    │
    └── Đã đăng nhập → Kiểm tra quyền:
            │
            ├── Premium active → Xem TẤT CẢ (auto-save hồ sơ vào DB)
            │
            ├── Có unlock cho hồ sơ này → Xem sections đã unlock (vĩnh viễn)
            │
            └── Chưa unlock → Xem FREE + Paywall
                    │
                    └── Click "Mở khóa"
                            │
                            ├── Đủ credit → Trừ credit → Lưu unlock → Reload full
                            │
                            └── Thiếu credit → Modal "Nạp Credit"

    Premium hết hạn → Giáng về Free+Credit → Hồ sơ đã xem = giữ vĩnh viễn
```

### Bảng phân tier nội dung

| Hạng mục | FREE | CREDIT/PREMIUM |
|----------|------|----------------|
| Số Chủ Đạo – Tổng quan + Đặc điểm | ✅ | ✅ |
| Số Chủ Đạo – Bài học cuộc đời + Tình cảm | ❌ | ✅ |
| 6 chỉ số phụ (Sứ mệnh, Linh hồn, Nhân cách, Thái độ, Tư duy, Trưởng thành) | ❌ | ✅ |
| Biểu đồ Ngày Sinh (bảng lưới 3x3) | ✅ | ✅ |
| Luận giải biểu đồ (Mũi tên, Số thiếu, Ý nghĩa từng số) | ❌ | ✅ |
| Biểu đồ Tổng hợp (visual) | ✅ | ✅ |
| Luận giải Biểu đồ Tổng hợp | ❌ | ✅ |
| Kim Tự Tháp (hình vẽ SVG) | ✅ | ✅ |
| Luận giải 4 Đỉnh cao + 4 Thử thách | ❌ | ✅ |
| Nợ Nghiệp (Karmic Debt) | ❌ | ✅ |
| Bài Học Đường Đời (Karmic Lessons) | ❌ | ✅ |
| Biểu đồ Tính cách % (Chart.js) | ✅ | ✅ |
| Luận giải Tính cách chi tiết | ❌ | ✅ |
| Biểu đồ Nghề nghiệp % (Chart.js) | ✅ | ✅ |
| Luận giải Nghề nghiệp chi tiết | ❌ | ✅ |
| Chu kỳ đường đời (3 card visual) | ✅ | ✅ |
| Luận giải chi tiết 3 chu kỳ | ❌ | ✅ |
| Biểu đồ sóng 9 năm (Chart.js) | ✅ | ✅ |
| Dự báo Năm cá nhân (3 năm) | ❌ | ✅ |
| Dự báo Tháng cá nhân (3 tháng) | ❌ | ✅ |

**Tóm lại:** FREE = tất cả visual/biểu đồ + tổng quan Life Path. PREMIUM = toàn bộ luận giải text chuyên sâu.

---

## III. Kế Hoạch Triển Khai Chi Tiết

### PHASE 1 – Refactor Kiến Trúc (Giữ nguyên trải nghiệm Free)

> Mục tiêu: Tách file monolithic, chuyển rendering lên SSR, bảo vệ data. User không thấy gì thay đổi.

---

#### 1.1 Tạo SSR Components Thay Thế Client Rendering

Chuyển toàn bộ logic `render*()` JS → Astro SSR components.

##### [NEW] `src/components/numerology/ContentBlock.astro`
- Render block content (text/list/quote) thay thế `safeBlocksToHTML()` + `processBlocks()`
- Props: `blocks[]`, `titleClass?`

##### [NEW] `src/components/numerology/NumerologySection.astro`
- Component khung cho mỗi section (header + collapsible body)
- Props: `title`, `sectionId`, `icon?`

##### [NEW] `src/components/numerology/LifePathSection.astro`
- Render SSR phần Life Path → thay thế `renderLifePath()` client JS
- Props: `lifePath`, `data`, `isLocked`

##### [NEW] `src/components/numerology/CoreStatsSection.astro`
- Render SSR 6 chỉ số phụ → thay thế `renderCoreStatsDetails()`
- Props: `stats[]`, `dataMap`, `isLocked`

##### [NEW] `src/components/numerology/ChartGridSection.astro`
- Render SSR biểu đồ lưới + luận giải → thay thế `renderNumberDetails()`
- Props: `chartData`, `arrowData`, `missingData`, `type`, `isLocked`

##### [NEW] `src/components/numerology/KarmicSection.astro`
- Render SSR Nợ Nghiệp + Bài học → thay thế `renderKarmicDebts()` + `renderKarmicLessons()`
- Props: `debts[]`, `lessons[]`, `debtData`, `lessonsData`, `isLocked`

##### [NEW] `src/components/numerology/PeriodCyclesSection.astro`
- Render SSR chu kỳ đường đời → thay thế `renderCycleInterpretations()`
- Props: `periodCycles`, `cyclesData`, `isLocked`

##### [NEW] `src/components/numerology/ForecastSection.astro`
- Render SSR dự báo năm + tháng → thay thế `renderForecastInterpretations()`
- Props: `forecast`, `yearData`, `monthData`, `isLocked`

##### [NEW] `src/components/numerology/PersonalityCareerSection.astro`
- Chart.js giữ client-side (canvas), luận giải text render SSR
- Props: `personalityStats`, `careerStats`, `pData`, `cData`, `isLocked`

---

#### 1.2 Tách Data Access Layer

##### [NEW] `src/utils/numerology-data.ts`
```ts
import fullData from '../data/numerology-data.json';

export function getLifePathData(number: number) { ... }
export function getDestinyData(number: number) { ... }
export function getSoulData(number: number) { ... }
// ... một hàm cho mỗi category

// Hàm master: trả về toàn bộ filtered data cho 1 user
export function getFilteredDataForUser(calculatedResults) {
  // Logic filter hiện tại trong frontmatter → chuyển vào đây
  // Sau này Phase 2 sẽ thêm tier filtering ở đây
}
```

---

#### 1.3 Refactor File Kết Quả

##### [MODIFY] `src/pages/ket-qua-than-so-hoc.astro`

**Từ 1,345 dòng → ~200 dòng.** Chỉ còn orchestration:

```astro
---
// 1. Nhận params, validate input
// 2. Tính toán chỉ số (giữ nguyên các hàm calculate*)
// 3. Gọi Data Access Layer lấy luận giải filtered
// 4. Xác định trạng thái lock/unlock (Phase 2)
---

<BaseLayout>
  <ReportHeader name={fullName} dob={formattedDob} nickname={nickname} />
  <HeroMandala lifePath={lifePath} />
  <SubGrid destiny={destiny} soul={soul} ... />

  <!-- Các section SSR component -->
  <LifePathSection lifePath={lifePath} data={lpData} />
  <CoreStatsSection stats={coreStats} dataMap={coreDataMap} />
  <ChartGridSection ... />
  <NumerologyPyramid ... />
  <KarmicSection ... />
  <PersonalityCareerSection ... />
  <PeriodCyclesSection ... />
  <ForecastSection ... />
  <NumerologyCTA />
</BaseLayout>

<!-- Script: chỉ còn Chart.js init + TOC + Read More toggle -->
<script src="/js/numerology-result.js"></script>
```

---

#### 1.4 Gom Client Scripts

##### [NEW] `public/js/numerology-result.js`
- Chart.js initialization (personalityChart, careerChart, waveChart)
- TOC initialization
- Read More toggle (collapsible sections)
- **Xóa sạch:** Tất cả DOM rendering logic (đã chuyển SSR)
- **Xóa sạch:** `globalNumerologyData` / `serverFilteredData` không còn tồn tại trên client

> **SAU PHASE 1:** `define:vars` sẽ chỉ còn truyền dữ liệu SỐ (statsData, chartCounts) cho Chart.js. Không còn JSON luận giải text nào trên client. View Page Source → không tìm thấy `serverFilteredData`.

---

### PHASE 2 – Freemium Content Gating

> Mục tiêu: Phân tier, ẩn/hiện content, paywall UI, API unlock.

---

#### 2.1 Tier Configuration

##### [NEW] `src/config/numerology-tiers.ts`
```ts
export const SECTION_TIERS = {
  // === FREE ===
  'lifepath-overview': 'free',
  'chart-strength-visual': 'free',
  'chart-synthesis-visual': 'free',
  'pyramid-visual': 'free',
  'personality-chart': 'free',
  'career-chart': 'free',
  'cycles-visual': 'free',
  'wave-chart': 'free',

  // === PREMIUM ===
  'lifepath-details': 'premium',
  'destiny': 'premium',
  'soul': 'premium',
  'personality': 'premium',
  'attitude': 'premium',
  'rational': 'premium',
  'maturity': 'premium',
  'chart-strength-text': 'premium',
  'chart-synthesis-text': 'premium',
  'pyramid-text': 'premium',
  'karmic-debt': 'premium',
  'karmic-lessons': 'premium',
  'personality-text': 'premium',
  'career-text': 'premium',
  'cycles-text': 'premium',
  'forecast-year': 'premium',
  'forecast-month': 'premium',
} as const;

export const UNLOCK_CREDIT_COST = 3;
```

---

#### 2.2 Server-Side Access Control

##### [MODIFY] `src/pages/ket-qua-than-so-hoc.astro` (frontmatter)

```ts
const user = Astro.locals.user;
const db = Astro.locals.runtime?.env?.DB;
const reportKey = generateReportKey(fullName, dobStr); // hash(name+dob)

let accessLevel: 'free' | 'unlocked' | 'premium' = 'free';

if (user && db) {
  const isPremium = await checkPremiumStatus(db, user.id);
  if (isPremium) {
    accessLevel = 'premium';
    await saveUnlockedReport(db, user.id, reportKey, 'premium_auto');
  } else {
    const isUnlocked = await checkUnlockedReport(db, user.id, reportKey);
    if (isUnlocked) accessLevel = 'unlocked';
  }
}

const showPremiumContent = (accessLevel === 'premium' || accessLevel === 'unlocked');

// CHỈ lấy data premium NẾU user có quyền
// Nếu không → data = null → component render paywall
```

**Key:** Nếu `showPremiumContent = false`, server KHÔNG gửi data premium xuống. Hacker mở DevTools / View Source = thấy ZERO premium content.

---

#### 2.3 Paywall UI Component

##### [NEW] `src/components/numerology/PremiumLock.astro`

```astro
---
interface Props {
  sectionName: string;
  previewLines?: string;
}
const { sectionName, previewLines } = Astro.props;
---

<div class="premium-lock-wrapper">
  {previewLines && (
    <div class="preview-blur-mask">
      <p class="preview-text">{previewLines}</p>
    </div>
  )}
  
  <div class="lock-overlay glass-card">
    <div class="lock-icon-ring">
      <i class="fas fa-lock"></i>
    </div>
    <h4 class="lock-title">🔒 Nội Dung Chuyên Sâu</h4>
    <p class="lock-desc">
      Mở khóa luận giải <strong class="text-gold">{sectionName}</strong> 
      và toàn bộ hồ sơ Premium
    </p>
    
    <div class="lock-actions">
      <button class="btn-unlock-credit" data-action="unlock-report">
        <i class="fas fa-coins"></i> Mở khóa (3 Credits)
      </button>
      <span class="lock-or">hoặc</span>
      <a href="/nap-credit" class="btn-go-premium">
        <i class="fas fa-crown"></i> Nâng cấp Premium
      </a>
    </div>
    
    <a href="/nap-credit" class="link-no-credit">Chưa có credit? Nạp ngay →</a>
  </div>
</div>
```

Mỗi SSR section component sẽ check `isLocked`:
```astro
{isLocked ? (
  <PremiumLock sectionName="Số Sứ Mệnh" />
) : (
  <ContentBlock blocks={data.blocks} />
)}
```

---

#### 2.4 API Endpoints

##### [NEW] `src/pages/api/numerology/unlock.ts`

```
POST /api/numerology/unlock
Headers: Cookie (session)
Body: { name: string, dob: string }

Response 200: { success: true, remainingCredits: number }
Response 401: { error: "Chưa đăng nhập" }
Response 402: { error: "Không đủ credit", currentBalance: number, required: 3 }
Response 409: { error: "Đã unlock rồi" }

Logic:
1. Validate session → lấy userId
2. Tạo reportKey = hash(normalize(name) + dob)
3. Check unlocked_reports: nếu đã có → return 409
4. Check credit_wallets.balance >= UNLOCK_CREDIT_COST
5. BEGIN TRANSACTION:
   a. UPDATE credit_wallets SET balance = balance - 3
   b. INSERT credit_transactions (type='spend', description='Unlock TSH: {name}')
   c. INSERT unlocked_reports (userId, reportKey, source='credit', creditSpent=3)
6. COMMIT
7. Return 200 + remainingCredits
```

##### [NEW] `src/pages/api/numerology/check-access.ts`

```
GET /api/numerology/check-access?name=...&dob=...
Headers: Cookie (session)

Response 200: { 
  accessLevel: 'free' | 'unlocked' | 'premium',
  creditBalance: number,
  unlockCost: number
}
```

---

#### 2.5 Database Schema Mở Rộng

##### [MODIFY] `src/db/schema.ts`

```ts
// Bảng lưu hồ sơ đã mở khóa (VĨNH VIỄN)
export const unlockedReports = sqliteTable('unlocked_reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  reportType: text('report_type').default('numerology'),
  reportKey: text('report_key').notNull(),         // hash(name + dob)
  reportName: text('report_name'),                 // Tên hiển thị
  reportDob: text('report_dob'),                   // DOB gốc
  source: text('source').notNull(),                // 'credit' | 'premium_auto'
  creditSpent: integer('credit_spent').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
});
// UNIQUE constraint: (userId, reportType, reportKey)

// Bảng Premium Subscription
export const premiumSubscriptions = sqliteTable('premium_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planType: text('plan_type').notNull(),           // 'monthly' | 'yearly'
  status: text('status').default('active'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`),
});
```

##### [NEW] `src/utils/numerology-access.ts`
```ts
export function generateReportKey(name: string, dob: string): string { ... }
export async function checkPremiumStatus(db, userId): Promise<boolean> { ... }
export async function checkUnlockedReport(db, userId, reportKey): Promise<boolean> { ... }
export async function saveUnlockedReport(db, userId, reportKey, source, creditSpent): Promise<void> { ... }
export async function unlockWithCredit(db, userId, reportKey, name, dob): Promise<Result> { ... }
```

---

### PHASE 3 – Business Integration & Polish

---

#### 3.1 Client-Side Unlock Flow

##### [NEW] `public/js/numerology-unlock.js`

```
User click "Mở khóa (3 Credits)":

1. Check login → Chưa login → redirect /login?redirect=...
2. GET /api/numerology/check-access → Đã unlocked → reload
3. Show Confirm Modal: "Mở khóa hồ sơ? Chi phí: 3 Credits. Số dư: X"
4. POST /api/numerology/unlock { name, dob }
   ├── 200 → Success toast + reload (server render full content)
   ├── 402 → Modal "Không đủ credit" + link nạp credit
   └── Error → Error toast
```

#### 3.2 Cập Nhật Trang Nạp Credit

##### [MODIFY] `src/pages/nap-credit.astro`
- Thêm mô tả Credit dùng cho cả Tarot + Thần Số Học
- Nếu `from=tsh` → highlight "3 credits = mở khóa 1 hồ sơ TSH trọn đời"

#### 3.3 Middleware

##### [MODIFY] `src/middleware.ts`
- KHÔNG thêm `/ket-qua-than-so-hoc` vào `protectedRoutes`
- Trang kết quả vẫn public → phần FREE ai cũng xem → tối đa hóa SEO + conversion

#### 3.4 Analytics Events

| Event | Trigger |
|-------|---------|
| `numerology_result_view` | Load trang kết quả |
| `premium_paywall_seen` | Scroll đến section locked |
| `unlock_button_clicked` | Click "Mở khóa" |
| `unlock_success` | API trả 200 |
| `unlock_insufficient_credit` | API trả 402 |
| `premium_upsell_clicked` | Click "Nâng cấp Premium" |

---

## IV. Verification Plan

### Build & Dev Check
```bash
npm run build
npm run dev
```

### Manual Verification Checklist

#### Phase 1 (Refactor)
- [ ] Kết quả render giống hệt phiên bản cũ
- [ ] Ctrl+U → tìm `serverFilteredData` → KHÔNG TÌM THẤY
- [ ] Chart.js biểu đồ vẫn render đúng
- [ ] TOC + Read More vẫn hoạt động
- [ ] Mobile responsive giữ nguyên

#### Phase 2 (Gating)
- [ ] Guest (chưa login): Xem FREE, thấy paywall ở premium
- [ ] Logged in, chưa unlock: Xem FREE, thấy paywall, click → confirm
- [ ] Logged in, đủ credit: Unlock → full content → reload vẫn thấy
- [ ] Logged in, thiếu credit: Click → modal nạp credit
- [ ] Premium active: Xem mọi hồ sơ, không paywall
- [ ] Premium hết hạn: Hồ sơ cũ = vẫn thấy. Hồ sơ mới = paywall
- [ ] Ctrl+U / DevTools: KHÔNG tìm thấy data premium khi chưa unlock
- [ ] Unlock cùng hồ sơ 2 lần: API 409, không trừ credit

#### Phase 3 (Business)
- [ ] Flow nạp credit → unlock → xem content → end-to-end OK
- [ ] URL share: người khác mở = chỉ thấy FREE
- [ ] Analytics events fire đúng

---

## V. Thứ Tự & Ước Lượng

| # | Task | Phase | Ước lượng |
|---|------|-------|-----------|
| 1 | ContentBlock + NumerologySection | P1 | ~1 session |
| 2 | 8 SSR section components | P1 | ~3 sessions |
| 3 | numerology-data.ts | P1 | ~1 session |
| 4 | Refactor ket-qua-than-so-hoc.astro | P1 | ~2 sessions |
| 5 | numerology-result.js | P1 | ~1 session |
| 6 | numerology-tiers.ts | P2 | ~0.5 session |
| 7 | numerology-access.ts + DB schema | P2 | ~1 session |
| 8 | Server-side access control | P2 | ~1 session |
| 9 | PremiumLock.astro + CSS | P2 | ~1 session |
| 10 | API endpoints | P2 | ~1.5 sessions |
| 11 | Cập nhật components thêm isLocked | P2 | ~1 session |
| 12 | numerology-unlock.js | P3 | ~1 session |
| 13 | Cập nhật nap-credit + middleware | P3 | ~1 session |
| 14 | Testing + polish | P3 | ~2 sessions |

**Tổng: ~17-18 coding sessions**

Phase 1 có thể bắt đầu ngay – không ảnh hưởng business. User cuối không thấy gì thay đổi.
