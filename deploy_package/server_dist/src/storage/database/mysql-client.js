"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
exports.getDatabaseConfig = getDatabaseConfig;
exports.getPool = getPool;
exports.query = query;
exports.queryOne = queryOne;
exports.insert = insert;
exports.update = update;
exports.remove = remove;
exports.getConnection = getConnection;
exports.closePool = closePool;
const promise_1 = require("mysql2/promise");
let envLoaded = false;
let pool = null;
function loadEnv() {
    if (envLoaded) {
        return;
    }
    try {
        require('dotenv').config();
        envLoaded = true;
    }
    catch {
    }
}
function getDatabaseConfig() {
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
function createPoolInstance() {
    const config = getDatabaseConfig();
    return (0, promise_1.createPool)({
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
function getPool() {
    if (!pool) {
        pool = createPoolInstance();
    }
    return pool;
}
async function query(sql, params) {
    const poolInstance = getPool();
    return poolInstance.execute(sql, params);
}
async function queryOne(sql, params) {
    const [rows] = await query(sql, params);
    return rows.length > 0 ? rows[0] : null;
}
async function insert(sql, params) {
    const pool = getPool();
    const [result] = await pool.execute(sql, params);
    return result.insertId;
}
async function update(sql, params) {
    const pool = getPool();
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
}
async function remove(sql, params) {
    const pool = getPool();
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
}
async function getConnection() {
    const pool = getPool();
    return pool.getConnection();
}
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
//# sourceMappingURL=mysql-client.js.map