# ADR 0002: Architecture for Phase 2 — Review, Media & Rating Aggregation

- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** Discovery Service (DB1) — Phase 2 Implementation (Review, Media, Rating Aggregation)

---

## 1. Context & Problem Statement
ระบบ Discovery จำเป็นต้องมีกลไกรับรีวิวและคะแนน (Reviews & Ratings) พร้อมรูปภาพ/วิดีโอ (Media Assets) จากผู้ใช้งาน โดยมีเงื่อนไขสำคัญตาม `DISCOVERY_CORE_CONCEPT.md`:
1. กฎเหล็ก: ห้ามเก็บ Binary ของรูป/วิดีโอในฐานข้อมูล DB1
2. รีวิวต้องมีการตรวจสอบคุณภาพ/ความเหมาะสม (Moderation) ก่อนการเผยแพร่
3. ค่าเฉลี่ยเรตติ้ง (`rating_average`) และจำนวนรีวิว (`review_count`) ในตาราง `places` ต้องถูกต้อง แม่นยำ ไม่เกิด race conditions หรือ double counting
4. ป้องกันการทุจริต (Anti-Fraud) เช่น เจ้าของร้านรีวิวร้านตัวเอง หรือผู้ใช้ส่งรีวิวสแปมรัวๆ

---

## 2. Decision & Architecture Strategy

### 2.1 Media Upload via Presigned URL Pattern
- **Decision:** ใช้ S3-Compatible SDK (`@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`) ออก **Presigned PUT URL** ให้ Client อัปโหลดตรงไปยัง Object Storage (AWS S3, MinIO, หรือ Cloudflare R2)
- Discovery Service รับผิดชอบเฉพาะการสร้าง Metadata ในตาราง `media_assets` พร้อมออก URL และมี Endpoint สำหรับ Confirm Upload
- หากอยู่ใน Local Development และไม่มี S3 credentials จะมี Mock Presigned URL Simulator ให้ทำงานต่อได้ทันทีโดยไม่ต้องพึ่ง Cloud

### 2.2 Review Lifecycle & Moderation (Hybrid Policy)
- **Decision:** ใช้แนวทางแบบ Hybrid:
  - รีวิวที่มีการยืนยันการเยือน (`is_verified_visit = true`) หรือผ่านการกรองคำหยาบ/สแปมพื้นฐาน จะได้รับสถานะ `PUBLISHED` ทันที
  - รีวิวที่มีความเสี่ยงหรือพบคำสุ่มเสี่ยง จะได้รับสถานะ `PENDING` เพื่อรอ Moderator อนุมัติใน Phase 5
  - เฉพาะรีวิวที่เป็น `PUBLISHED` เท่านั้นที่จะแสดงบน Public API และถูกนำไปคำนวณใน Rating Aggregation

### 2.3 Rating Aggregation Strategy (Outbox + Idempotent Worker + Incremental Aggregate + Reconciliation)
- **Decision:** นำสถาปัตยกรรมระดับ Production มาใช้งานร่วมกัน 4 ส่วน:
  1. **Transactional Outbox:** เมื่อรีวิวถูกบันทึก/แก้ไข/ลบ จะสร้าง Domain Event ที่มี Schema ชัดเจน เช่น:
     ```json
     {
       "event_id": "evt_xxx",
       "event_type": "ReviewPublished",
       "review_id": "rev_xxx",
       "place_id": "place_xxx",
       "rating": 5,
       "previous_rating": null
     }
     ```
     บันทึกลงตาราง `outbox_events` ภายใต้ Transaction เดียวกันกับ Entity รีวิว
  2. **Idempotent Outbox Consumer/Worker:**
     - ดึง event จาก `outbox_events` ด้วยสถานะ `PENDING`
     - ทำการ Lock และตรวจเช็ค `status = 'PROCESSED'` เพื่อป้องกันการประมวลผลซ้ำ (Idempotent Guarantee) แม้จะมีการส่ง Event ซ้ำ
  3. **Incremental / Aggregated Update:**
     - Worker คำนวณคะแนนเฉลี่ย (`AVG`) และจำนวนรีวิว (`COUNT`) ที่เป็น `PUBLISHED` ของสถานที่นั้น แล้วอัปเดตลง `places.rating_average`, `places.rating_count`, `places.review_count` พร้อม Invalidate Redis Cache
  4. **Periodic Reconciliation Job:**
     - มี Background Cron Job รันเป็นระยะ เพื่อ Re-aggregate ตรวจสอบความถูกต้องของ `rating_average` และ `review_count` ในตาราง `places` เทียบกับ `reviews` จริง ป้องกัน Data Drift ในระยะยาว

### 2.4 Anti-Fraud & Review Ownership Policy
- **Decision:**
  - กำหนดนโยบาย **1 Active Review ต่อ 1 User ต่อ 1 Place** (หากส่งซ้ำจะเป็นการ Update รีวิวเดิม)
  - ห้ามผู้ใช้ที่มีบทบาทเป็น Partner Owner หรือ Store Manager ของสถานที่นั้น (`place_members` / `partner_places`) ส่งรีวิวให้กับร้านตนเอง

---

## 3. Consequences

### Positive:
- Discovery Service ไม่ต้องรับโหลด I/O ขนาดใหญ่ของไฟล์มีเดีย
- รับประกัน Eventual Consistency ด้วย Transactional Outbox
- ป้องกันปัญหาคะแนนเรตติ้งเพี้ยนด้วย Idempotency และ Reconciliation Job
- ป้องกันสแปมและผลประโยชน์ทับซ้อนของเจ้าของร้าน

### Negative / Trade-offs:
- จำเป็นต้องมี Worker Loop หรือ Background Task ในการประมวลผล Outbox Events
- ฝั่ง Client ต้องทำงาน 2-step สำหรับ Media Upload (Request URL -> Upload to S3 -> Confirm)
