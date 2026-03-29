export declare class CityService {
    getAllCities(): Promise<{
        letter: string;
        cities: any[];
    }[]>;
    getHotCities(): Promise<any[]>;
    searchCities(keyword: string): Promise<any[]>;
    getNearestCity(latitude: number, longitude: number): Promise<any>;
    updateUserCity(userId: number, cityId: number): Promise<{
        success: boolean;
        cityName: any;
    }>;
    getCityDetail(cityId: number): Promise<any>;
    getCityTeachers(cityName: string, page?: number, pageSize?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
}
