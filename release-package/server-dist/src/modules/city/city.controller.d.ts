import { CityService } from './city.service';
export declare class CityController {
    private readonly cityService;
    constructor(cityService: CityService);
    getAllCities(): Promise<{
        letter: string;
        cities: any[];
    }[]>;
    getHotCities(): Promise<any[]>;
    searchCities(keyword: string): Promise<any[]>;
    getNearestCity(latitude: string, longitude: string): Promise<any>;
    updateUserCity(body: {
        cityId: number;
    }, req: any): Promise<{
        success: boolean;
        cityName: any;
    }>;
    getCityDetail(id: string): Promise<any>;
    getCityTeachers(cityName: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
}
