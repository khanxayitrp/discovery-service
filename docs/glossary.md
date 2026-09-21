# Glossary — Discovery Service (DB1)

เอกสารรวบรวมคำศัพท์และคำนิยามหลัก (Ubiquitous Language) ของระบบ Discovery

| คำศัพท์ (Term) | ความหมายและหน้าที่ (Definition & Responsibility) |
|---|---|
| **DB1 (Discovery DB)** | ฐานข้อมูลหลัก (Source of Truth) ของ Place, Review, Media Metadata, Community, Point Ledger |
| **Places (Master Data)** | ข้อมูลสถานที่หลัก ควบคุมสถานะวงจรชีวิต (Lifecycle) เช่น `CANDIDATE`, `ACTIVE`, `TEMPORARILY_CLOSED`, `PERMANENTLY_CLOSED`, `ARCHIVED` |
| **Place Locations** | พิกัดทางภูมิศาสตร์ของสถานที่ จัดเก็บในรูปแบบ PostGIS `geography(Point, 4326)` |
| **Reviews** | ความคิดเห็นและคะแนน (1-5 ดาว) ที่ผู้ใช้ส่งให้กับสถานที่ โดยมีสถานะ เช่น `PENDING`, `PUBLISHED`, `HIDDEN`, `REJECTED` |
| **Verified Visit** | ธงบ่งบอกว่าผู้ใช้เคยเช็คอิน (Check-in) หรือมีประวัติการใช้บริการจริงที่สถานที่นั้น ช่วยเพิ่มความน่าเชื่อถือของรีวิว |
| **Review Media** | ตารางเชื่อมโยง (Bridge) ระหว่าง Review และ Media Asset พร้อมลำดับการแสดงผล (`sort_order`) และภาพหลัก (`is_primary`) |
| **Media Assets** | ข้อมูลอภิพันธุ์ (Metadata) ของรูปภาพและวิดีโอ เช่น ขนาดไฟล์, MIME type, CDN URL, Object Key และสถานะการตรวจสอบ (ห้ามเก็บไฟล์ Binary ใน DB) |
| **Presigned Upload URL** | ลิงก์ที่เซ็นสัญญากำหนดสิทธิ์ชั่วคราวจาก Object Storage เพื่อให้ Client สามารถอัปโหลดไฟล์ตรงได้โดยไม่ต้องผ่าน Server ของแอปพลิเคชัน |
| **Transactional Outbox** | รูปแบบการบันทึก Domain Events ลงในตาราง `outbox_events` ภายใต้ Transaction เดียวกันกับ Entity เพื่อรับประกันความสอดคล้องของข้อมูล (Eventual Consistency) |
| **Rating Aggregation** | กระบวนการรวบรวมคะแนนรีวิวทั้งหมดที่เป็น `PUBLISHED` เพื่อคำนวณ `rating_average`, `rating_count`, และ `review_count` บันทึกลงในตาราง `places` |
| **Idempotency** | คุณสมบัติของการประมวลผลที่ผลลัพธ์จะไม่เปลี่ยนแปลง แม้จะได้รับการเรียกซ้ำหลายครั้งด้วยคำขอเดิม (ป้องกัน Double Calculation ใน Worker) |
| **Reconciliation Job** | งานเบื้องหลังที่รันตามรอบเวลา (Periodic Job) เพื่อตรวจสอบและแก้ไขความคลาดเคลื่อนของข้อมูลสรุป (Derived Data) เทียบกับข้อมูลจริง (Raw Data) |
