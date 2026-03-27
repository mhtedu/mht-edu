import { createPool, Pool, PoolConnection, FieldPacket, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { execSync } from 'child_process';

let envLoaded = false;
let pool: Pool | null = null;

// 数据库配置接口
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

// 加载环境变量
function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  try {
    require('dotenv').config();
    envLoaded = true;
  } catch {
    // dotenv not available
  }
}

// 获取数据库配置
function getDatabaseConfig(): DatabaseConfig {
  loadEnv();

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mianhuatang_edu',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_MAX || '10', 10),
    queueLimit: 0,
  };
}

// 创建连接池
function createPoolInstance(): Pool {
  const config = getDatabaseConfig();
  
  return createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: config.waitForConnections,
    connectionLimit: config.connectionLimit,
    queueLimit: config.queueLimit,
    charset: 'utf8mb4',
    timezone: '+08:00',
  });
}

// 获取连接池
function getPool(): Pool {
  if (!pool) {
    pool = createPoolInstance();
  }
  return pool;
}

// 执行查询
async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<[T, FieldPacket[]]> {
  const poolInstance = getPool();
  return poolInstance.execute<T>(sql, params);
}

// 执行单条查询
async function queryOne<T extends RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const [rows] = await query<T[]>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// 执行插入并返回插入ID
async function insert(sql: string, params?: any[]): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result.insertId;
}

// 执行更新并返回影响行数
async function update(sql: string, params?: any[]): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result.affectedRows;
}

// 执行删除并返回影响行数
async function remove(sql: string, params?: any[]): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result.affectedRows;
}

// 获取连接（用于事务）
async function getConnection(): Promise<PoolConnection> {
  const pool = getPool();
  return pool.getConnection();
}

// 关闭连接池
async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// 导出
export {
  loadEnv,
  getDatabaseConfig,
  getPool,
  query,
  queryOne,
  insert,
  update,
  remove,
  getConnection,
  closePool,
};
