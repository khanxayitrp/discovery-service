import { placeRepository } from '../repositories/place.repo';
import { redisService } from './redis.service';
import { AppDataSource } from '../config/data-source';
import { Places } from '../entities/Places';
import { PlaceLocations } from '../entities/PlaceLocations';

export class PlaceService {
    async getNearbyPlaces(lat: number, lng: number, radiusMeters: number = 5000) {
        // 1. ปัดเศษทศนิยมเพื่อเพิ่มโอกาส Cache Hit (4 ตำแหน่ง = แม่นยำระดับ ~11 เมตร)
        const roundedLat = lat.toFixed(4);
        const roundedLng = lng.toFixed(4);
        const cacheKey = `places:nearby:${roundedLat}:${roundedLng}:${radiusMeters}`;

        // 2. ตรวจสอบข้อมูลใน Redis[cite: 2]
        const cachedData = await redisService.get(cacheKey);
        if (cachedData) {
            console.log(`⚡ Cache Hit for key: ${cacheKey}`);
            return JSON.parse(cachedData);
        }

        // 3. ถ้าไม่มีใน Cache ให้ Query จาก PostGIS
        console.log(`🐢 Cache Miss. Querying DB for: ${cacheKey}`);
        const places = await placeRepository.findNearby(lat, lng, radiusMeters);

        // 4. นำผลลัพธ์บันทึกลง Redis ตั้งเวลา TTL ไว้ 5 นาที (300 วินาที)[cite: 2]
        if (places.length > 0) {
            await redisService.set(cacheKey, JSON.stringify(places), 300);
        }

        return places;
    }
    async createPlace(data: { name: string; categoryId: string; lat: number; lng: number; partnerId: string }) {
        // ใช้ Transaction เพื่อรับประกันว่า Places และ PlaceLocations ต้องบันทึกสำเร็จทั้งคู่
        return await AppDataSource.transaction(async (transactionalEntityManager) => {
            // 1. สร้าง Place หลัก
            const newPlace = new Places();
            newPlace.name = data.name;
            newPlace.placeTypeId = data.categoryId; // สมมติชั่วคราวให้ตรงกับ Relation
            newPlace.slug = `${data.name.toLowerCase().replace(/ /g, '-')}-${Date.now()}`;
            // หากมีการระบุ partnerId ให้นำมาผูกเพื่อ Ownership Check ในอนาคต[cite: 2]

            const savedPlace = await transactionalEntityManager.save(newPlace);

            // 2. สร้างพิกัด Location (PostGIS)
            const newLocation = new PlaceLocations();
            newLocation.placeId = savedPlace.placeId;
            newLocation.latitude = data.lat;
            newLocation.longitude = data.lng;
            newLocation.isPrimary = true;
            // สร้าง WKT (Well-Known Text) สำหรับ PostGIS
            newLocation.geoPoint = `POINT(${data.lng} ${data.lat})`;

            await transactionalEntityManager.save(newLocation);

            // 3. เมื่อ POST ข้อมูลใหม่สำเร็จ ต้องสั่งล้าง Cache ทันที[cite: 2]
            await redisService.delByPattern('places:nearby:*');

            return savedPlace;
        });
    }

    // ตัวอย่างฟังก์ชันสำหรับล้าง Cache เมื่อมีการเพิ่ม/แก้ไขสถานที่[cite: 2]
    async clearPlaceCache() {
        await redisService.delByPattern('places:nearby:*');
    }
}

export const placeService = new PlaceService();