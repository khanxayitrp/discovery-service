import { AppDataSource } from '../config/data-source';
import { Places } from '../entities/Places';

export class PlaceRepository {
    private repo = AppDataSource.getRepository(Places);

    // ฟังก์ชันค้นหาสถานที่รอบตัว พร้อมคำนวณระยะทาง
    async findNearby(lat: number, lng: number, radiusMeters: number = 5000): Promise<Places[]> {
        return await this.repo.createQueryBuilder('place')
            // JOIN ไปหาพิกัดหลัก
            .innerJoinAndSelect('place.placeLocations', 'location', 'location.isPrimary = true')
            // กรองเฉพาะสถานที่ที่เปิดใช้งาน
            .where('place.isActive = :isActive', { isActive: true })
            .andWhere('place.status = :status', { status: 'ACTIVE' })
            // ใช้ฟังก์ชัน PostGIS ในการหารัศมี (ต้อง Cast เป็น geography เพื่อให้หน่วยเป็นเมตร)
            .andWhere('ST_DWithin(location.geoPoint, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)')
            .setParameters({ lng, lat, radius: radiusMeters })
            .getMany();
    }
}

export const placeRepository = new PlaceRepository();