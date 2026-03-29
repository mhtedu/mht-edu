"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let CityService = class CityService {
    async getAllCities() {
        const cities = await executeQuery(`
      SELECT * FROM cities WHERE is_active = 1 ORDER BY sort_order ASC, name ASC
    `);
        const grouped = {};
        for (const city of cities) {
            const firstLetter = city.first_letter?.toUpperCase() || '#';
            if (!grouped[firstLetter]) {
                grouped[firstLetter] = [];
            }
            grouped[firstLetter].push(city);
        }
        const result = Object.entries(grouped)
            .map(([letter, cities]) => ({ letter, cities }))
            .sort((a, b) => a.letter.localeCompare(b.letter));
        return result;
    }
    async getHotCities() {
        const cities = await executeQuery(`
      SELECT * FROM cities WHERE is_hot = 1 AND is_active = 1
      ORDER BY sort_order ASC LIMIT 20
    `);
        return cities;
    }
    async searchCities(keyword) {
        const cities = await executeQuery(`
      SELECT * FROM cities 
      WHERE is_active = 1 
      AND (name LIKE ? OR pinyin LIKE ?)
      ORDER BY sort_order ASC
      LIMIT 50
    `, [`%${keyword}%`, `%${keyword}%`]);
        return cities;
    }
    async getNearestCity(latitude, longitude) {
        const cities = await executeQuery(`
      SELECT *,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(latitude))
          )
        ) as distance
      FROM cities
      WHERE is_active = 1
      ORDER BY distance ASC
      LIMIT 1
    `, [latitude, longitude, latitude]);
        if (cities.length > 0) {
            const city = cities[0];
            return {
                ...city,
                distance: Math.round(city.distance * 10) / 10,
            };
        }
        return null;
    }
    async updateUserCity(userId, cityId) {
        const cities = await executeQuery(`
      SELECT id, name FROM cities WHERE id = ?
    `, [cityId]);
        if (cities.length === 0) {
            throw new Error('城市不存在');
        }
        const city = cities[0];
        await executeQuery(`
      UPDATE users SET city_name = ? WHERE id = ?
    `, [city.name, userId]);
        return { success: true, cityName: city.name };
    }
    async getCityDetail(cityId) {
        const cities = await executeQuery(`
      SELECT * FROM cities WHERE id = ?
    `, [cityId]);
        if (cities.length === 0) {
            throw new Error('城市不存在');
        }
        const city = cities[0];
        const stats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE city_name = ? AND role = 2) as teacher_count,
        (SELECT COUNT(*) FROM orders WHERE city = ? AND status = 0) as pending_order_count
    `, [city.name, city.name]);
        return {
            ...city,
            stats: stats[0] || { teacher_count: 0, pending_order_count: 0 },
        };
    }
    async getCityTeachers(cityName, page = 1, pageSize = 20) {
        const offset = (page - 1) * pageSize;
        const teachers = await executeQuery(`
      SELECT u.id, u.nickname, u.avatar, u.membership_type,
        tp.real_name, tp.subjects, tp.hourly_rate_min, tp.hourly_rate_max,
        tp.rating, tp.review_count, tp.success_count, tp.view_count,
        tp.one_line_intro, tp.cover_photo
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.city_name = ? AND u.role = 2 AND u.membership_type = 1
      ORDER BY tp.rating DESC, tp.view_count DESC
      LIMIT ? OFFSET ?
    `, [cityName, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM users 
      WHERE city_name = ? AND role = 2 AND membership_type = 1
    `, [cityName]);
        return {
            list: teachers,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
};
exports.CityService = CityService;
exports.CityService = CityService = __decorate([
    (0, common_1.Injectable)()
], CityService);
//# sourceMappingURL=city.service.js.map