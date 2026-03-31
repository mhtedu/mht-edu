import { Pool, PoolConnection, FieldPacket, RowDataPacket } from 'mysql2/promise';
interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    waitForConnections: boolean;
    connectionLimit: number;
    queueLimit: number;
}
declare function loadEnv(): void;
declare function getDatabaseConfig(): DatabaseConfig;
declare function getPool(): Pool;
declare function query<T extends RowDataPacket[]>(sql: string, params?: any[]): Promise<[T, FieldPacket[]]>;
declare function queryOne<T extends RowDataPacket>(sql: string, params?: any[]): Promise<T | null>;
declare function insert(sql: string, params?: any[]): Promise<number>;
declare function update(sql: string, params?: any[]): Promise<number>;
declare function remove(sql: string, params?: any[]): Promise<number>;
declare function getConnection(): Promise<PoolConnection>;
declare function closePool(): Promise<void>;
export { loadEnv, getDatabaseConfig, getPool, query, queryOne, insert, update, remove, getConnection, closePool, };
