import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

let envLoaded = false;
let pool: Pool | null = null;

// 加载环境变量
function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  try {
    dotenv.config();
    envLoaded = true;
  } catch {
    // dotenv not available
  }
}

// 获取数据库配置
function getDatabaseConfig() {
  loadEnv();

  // 优先使用 PGDATABASE_URL 环境变量
  if (process.env.PGDATABASE_URL) {
    return {
      connectionString: process.env.PGDATABASE_URL,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
  };
}

// 创建连接池
function createPoolInstance(): Pool {
  const config = getDatabaseConfig();
  
  return new Pool({
    ...config,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
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
async function query(
  sql: string,
  params?: any[]
): Promise<{ rows: any[]; rowCount: number }> {
  const poolInstance = getPool();
  const result = await poolInstance.query(sql, params);
  return {
    rows: result.rows,
    rowCount: result.rowCount || 0,
  };
}

// 执行单条查询
async function queryOne(
  sql: string,
  params?: any[]
): Promise<any | null> {
  const result = await query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

// 执行插入并返回插入ID
async function insert(sql: string, params?: any[]): Promise<number> {
  const result = await query(sql + ' RETURNING id', params);
  return result.rows[0]?.id || 0;
}

// 执行更新并返回影响行数
async function update(sql: string, params?: any[]): Promise<number> {
  const result = await query(sql, params);
  return result.rowCount;
}

// 执行删除并返回影响行数
async function remove(sql: string, params?: any[]): Promise<number> {
  const result = await query(sql, params);
  return result.rowCount;
}

// 获取连接（用于事务）
async function getConnection(): Promise<PoolClient> {
  const poolInstance = getPool();
  return poolInstance.connect();
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
