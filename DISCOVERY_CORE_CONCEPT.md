# Discovery (DB1) — Core Concept & Implementation Plan

> เอกสารนี้ใช้เป็น context หลักให้ AI (Antigravity IDE) เข้าใจ scope, boundary
> และแผนพัฒนาของระบบ Discovery ก่อนเริ่มเขียนโค้ดทุกครั้ง

---

## 1. Core Concept (1 บรรทัดจำ)

> **Discovery ≠ Search System อย่างเดียว**
> **Discovery = Place Data + Community + UGC + Reputation + Business Ownership + Moderation + Gamification**

**Source of Truth หลัก:**

| ระบบ | หน้าที่ |
|---|---|
| `IAM_DB` | Identity / Login เท่านั้น |
| **`DB1` (Discovery)** | **Source of Truth** ของ Place, Review, Media metadata, Community, Point/League |
| Elasticsearch/OpenSearch | Search Projection (read-only, sync จาก DB1) |
| Object Storage + CDN | Binary ของรูป/วิดีโอ |
| `DB2` (Commerce) | Product / Order / Booking / Payment |
| Core Lending | Loan / Credit ไม่เกี่ยวกับ DB1 |
| Data Platform / DWH | Analytics ขนาดใหญ่ |

**กฎเหล็ก:** ห้าม Search Engine เป็น Master data, ห้าม User แก้ `places` ตรง ๆ (ต้องผ่าน `place_contributions`), ห้ามเก็บ Binary media ใน DB, ห้ามอัปเดตแต้มแบบ `UPDATE points = points+1` (ต้องผ่าน Ledger)

---

## 2. Functional Domains (12 โดเมน)

1. Place Management — จัดการสถานที่ (Master Data)
2. Search & Discovery — ค้นหา/แนะนำ
3. Geo & Map — ตำแหน่ง/รัศมี/แผนที่
4. Place Detail — หน้ารายละเอียดสถานที่
5. Review & Rating — รีวิว/คะแนน
6. Media — รูป/วิดีโอ
7. Community — Save/Follow/Check-in
8. Contribution — เพิ่ม/แก้ไขข้อมูลสถานที่ (ผ่าน workflow อนุมัติ)
9. Business Claim — เจ้าของร้าน/ผู้จัดการ
10. Moderation & Trust — ตรวจสอบเนื้อหา
11. Point / League / Reward — Gamification
12. Integration & Event — Sync Search / DB2 / Data Platform

---

## 3. Core Data Model (ย่อ)

```text
places (master)
 ├─ place_locations        GEOGRAPHY(POINT,4326)
 ├─ place_contributions    -- proposal, ไม่แก้ places ตรง
 ├─ place_claims           -- ขอเป็นเจ้าของร้าน
 ├─ place_members / place_user_roles

reviews
 ├─ review_media
 └─ rating_average / review_count  -- cached, derived จาก reviews จริง

media_assets
 ├─ place_media
 └─ media_moderation_results

community_users
 ├─ saved_places
 ├─ place_follows
 └─ check_ins

partners
 ├─ partner_users / partner_user_roles
 └─ (1 partner → many places, 1 user → many partners)

community_actions → point_rules → point_ledger → user_leagues → league_tiers → user_rewards → credit_ledger

moderation_actions / content_reports  -- คุมทุก content type

outbox_events → Search Index Consumer → Elasticsearch/OpenSearch
```

**Business rule สำคัญที่ต้อง enforce ในโค้ด:**
- Point: max 30 คะแนน/place/เดือน, แต้มไม่หมดอายุ
- `credit_ledger` ใน DB1 = Community Reward Credit เท่านั้น ไม่ใช่ Loan
- League ≠ Role (มีพร้อมกันได้ เช่น Silver IV + Business Owner)
- Place lifecycle: `Candidate → Pending Review → Published → Temporarily Closed → Permanently Closed → Archived` (+ Duplicate/Merged)

---

## 4. 7 Core User Journeys (ใช้เป็น checklist ตอน implement)

| # | Journey | Flow ย่อ |
|---|---|---|
| 1 | **Discover** | Search/Nearby/Category → Place Detail |
| 2 | **Engage** | Review/Rating/Photo/Video → Like/Comment |
| 3 | **Community** | Save/Follow/Check-in → Community Activity |
| 4 | **Contribute** | Add/Correct Data → Moderation → Publish |
| 5 | **Business** | Claim → Verify → Partner → Multi-place → Role |
| 6 | **Gamification** | Action → Point Ledger → League → Reward |
| 7 | **Commerce** | Place → Product/Service (DB2) → Booking/Order/Payment |

---

## 5. Key Workflows (สรุปสั้น สำหรับ implement)

**5.1 Guest Search**
`keyword → Search API → Elasticsearch → filter (geo/category/rating) → rank → list → detail`

**5.2 Nearby/Map**
`user location → Geo search (PostGIS/ES geo) → radius filter → rank → nearby places → map/list`

**5.3 Review**
`write review → validate → moderation → publish → update rating (cached) → community_actions → point_ledger → league update → sync search index`

**5.4 Media**
`request upload → Object Storage → process (resize/transcode/thumbnail) → moderation → approve → attach to review/place → point award`

**5.5 Save/Follow/Check-in**
- Save → `saved_places`
- Follow → `place_follows` → notification
- Check-in → validate location → anti-abuse rule → `check_ins` → community_actions → point

**5.6 Contribution (แก้ไขข้อมูลสถานที่)**
`propose change → place_contributions → validation → moderation → approve → update places master → point award → sync search index`

**5.7 Business Claim**
`find place → claim → submit evidence → place_claims → verify → approve → create/update partner → link partner↔place → assign role → business workspace`

**5.8 Moderation**
`content created → validation → auto rules → moderation queue → moderator action (approve/reject/hide/remove) → audit log → update content state`

**5.9 Point/League**
`action → community_actions → validate against point_rules → point_ledger → balance cache → league calculation → reward issuance`

**5.10 Search Index Sync**
`DB1 transaction → outbox_event → consumer → Elasticsearch/OpenSearch update` (event ตัวอย่าง: PlaceCreated, ReviewPublished, RatingUpdated, MediaPublished, PlaceClosed)

**5.11 DB1 → DB2 (Commerce reference)**
`place_id → DB2 product.place_id → quotation → order → booking/payment` — DB1 ไม่เป็นเจ้าของ Product/Order/Payment/Booking

---

## 6. API Structure (แนะนำ)

```
/api/discovery
  # Public
  GET  /places  /places/:id  /places/:id/reviews  /places/:id/media
  GET  /search  /search/suggestions  /nearby  /categories

  # Member (auth required)
  POST/DELETE /places/:id/save
  POST/DELETE /places/:id/follow
  POST /places/:id/reviews
  POST /reviews/:id/media
  POST /places/:id/check-ins
  POST /contributions
  GET  /me/contributions /me/saved-places /me/check-ins

  # Business
  POST /places/:id/claims
  GET  /me/partners  /partners/:id  /partners/:id/places
  POST /partners/:id/users
  POST /places/:id/members

  # Moderation/Admin
  GET  /moderation/queue
  POST /moderation/:id/approve|reject|hide
  POST /reports/:id/resolve
```

---

## 7. Role & Permission Model

```
Community Member  → Review / Save / Follow / Check-in
Partner Owner     → Partner Management
Store Manager     → Place Management (scoped ต่อ place)
Moderator         → Content Moderation
Admin             → Platform Management
```

ทุก request ต้อง check: `User + Resource + Scope + Role + Permission`
- League **ไม่ใช่** Role — ห้ามใช้ league เป็นตัวกำหนดสิทธิ์
- "Reviewer/Contributor" เป็น **Activity** ไม่ใช่ Global Role

---

## 8. Boundary — สิ่งที่ห้ามอยู่ใน DB1

| ห้ามเก็บ | ต้องอยู่ที่ |
|---|---|
| Password, OTP, Session, Token | IAM_DB |
| Product, SKU, Inventory, Cart, Order, Payment, Booking | DB2 |
| Loan, Interest, Repayment, Credit Risk, CIB | Core Lending |
| Binary รูป/วิดีโอ | Object Storage / CDN |
| Analytics/Behavior warehouse ขนาดใหญ่ | Data Platform / DWH |

---

## 9. Implementation Plan (แนะนำลำดับ Phase)

### Phase 0 — Foundation
- [ ] Setup DB1 schema: `places`, `place_locations`, `community_users`
- [ ] Integrate IAM (auth middleware, user_id mapping)
- [ ] Setup Object Storage + CDN สำหรับ media
- [ ] Setup outbox_events + event bus (สำหรับ sync ในอนาคต)

### Phase 1 — Core Place & Search (Journey 1)
- [ ] CRUD `places` (master data, ไม่เปิดให้ user แก้ตรง)
- [ ] Place Detail API (รวม location, hours, amenities)
- [ ] Elasticsearch/OpenSearch index + sync consumer จาก outbox
- [ ] Search API: keyword, category, geo/nearby, filter, sort, pagination
- [ ] Autocomplete / suggestion / trending

### Phase 2 — Review, Media, Rating (Journey 2)
- [ ] `reviews`, `review_media` schema + API
- [ ] Media upload pipeline (request URL → storage → process → moderate)
- [ ] Rating aggregation (cached `rating_average`/`review_count`)
- [ ] Sync review/media events ไป search index

### Phase 3 — Community Engagement (Journey 3)
- [ ] Save / Unsave place
- [ ] Follow / Unfollow place + notification hook
- [ ] Check-in + anti-abuse rule (duplicate/daily limit)

### Phase 4 — Contribution Workflow (Journey 4)
- [ ] `place_contributions` schema + submit API
- [ ] Moderation queue สำหรับ contribution
- [ ] Approve flow → update `places` master → sync index

### Phase 5 — Moderation & Trust (cross-cutting)
- [ ] `moderation_actions`, `content_reports` schema
- [ ] Moderation queue UI/API (review, media, contribution, claim, report)
- [ ] Audit log

### Phase 6 — Gamification (Journey 6)
- [ ] `community_actions`, `point_rules`, `point_ledger`
- [ ] Point calculation service (enforce max 30/place/month)
- [ ] `league_tiers`, `user_leagues` calculation
- [ ] `league_rewards`, `user_rewards`, `credit_ledger`

### Phase 7 — Business Claim & Partner (Journey 5)
- [ ] `place_claims` + verify workflow
- [ ] `partners`, `partner_users`, `partner_user_roles`
- [ ] `place_members`, `place_user_roles`
- [ ] Business workspace API (switch context, multi-store)

### Phase 8 — Commerce Bridge (Journey 7)
- [ ] Expose `place_id` reference API ให้ DB2 ใช้
- [ ] ไม่สร้าง Product/Order/Payment ใน DB1 (แค่ reference)

### Phase 9 — Hardening
- [ ] Role & Permission middleware ครบทุก endpoint
- [ ] Rate limit / anti-abuse ทั่วระบบ
- [ ] Data Platform event export (DWH)
- [ ] Load test search + geo query

---

## 10. หมายเหตุสำหรับ AI เวลาช่วย implement

- ก่อนเขียนโค้ดใหม่ ให้เช็คว่า feature นั้นอยู่ domain ไหนใน 12 domains (ข้อ 2)
- ถ้าเป็นการแก้ `places` ให้ผ่าน `place_contributions` เสมอ ห้าม direct update จาก user
- ถ้าเป็นแต้ม/point ให้ผ่าน ledger pattern เสมอ ห้าม increment ตรง ๆ
- Media binary → ไปที่ Object Storage เท่านั้น DB1 เก็บแค่ metadata/URL
- ทุก mutation ที่กระทบ search ต้อง publish `outbox_events` ให้ consumer sync index
- อย่าสร้าง Order/Payment/Booking logic ใน DB1 — ใช้ `place_id` เป็น reference ไป DB2 เท่านั้น
