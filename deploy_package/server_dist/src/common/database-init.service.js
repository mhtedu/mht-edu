"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseInitService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../storage/database/mysql-client");
const fs = require("fs");
const path = require("path");
let DatabaseInitService = class DatabaseInitService {
    async onModuleInit() {
        try {
            const sqlPath = path.join(__dirname, '../../database/init.sql');
            const sql = fs.readFileSync(sqlPath, 'utf-8');
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));
            for (const statement of statements) {
                try {
                    await (0, mysql_client_1.query)(statement);
                }
                catch (error) {
                    if (!error.message.includes('already exists')) {
                        console.error('SQL Error:', error.message);
                    }
                }
            }
            console.log('✅ Database initialized successfully');
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error.message);
        }
    }
};
exports.DatabaseInitService = DatabaseInitService;
exports.DatabaseInitService = DatabaseInitService = __decorate([
    (0, common_1.Injectable)()
], DatabaseInitService);
//# sourceMappingURL=database-init.service.js.map