"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.orgInviteLinks = exports.adPositions = exports.contactViewLogs = exports.teacherSchedules = exports.commissions = exports.payments = exports.products = exports.membershipPlans = exports.orderMatches = exports.orders = exports.cityAgents = exports.organizations = exports.teacherProfiles = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)().primaryKey(),
    openid: (0, pg_core_1.varchar)("openid", { length: 64 }),
    unionid: (0, pg_core_1.varchar)("unionid", { length: 64 }),
    mobile: (0, pg_core_1.varchar)("mobile", { length: 20 }),
    nickname: (0, pg_core_1.varchar)("nickname", { length: 50 }),
    avatar: (0, pg_core_1.varchar)("avatar", { length: 255 }),
    role: (0, pg_core_1.smallint)("role").notNull().default(0),
    status: (0, pg_core_1.smallint)("status").default(1),
    membership_type: (0, pg_core_1.smallint)("membership_type").default(0),
    membership_expire_at: (0, pg_core_1.timestamp)("membership_expire_at", { withTimezone: true }),
    latitude: (0, pg_core_1.numeric)("latitude", { precision: 10, scale: 7 }),
    longitude: (0, pg_core_1.numeric)("longitude", { precision: 10, scale: 7 }),
    city_code: (0, pg_core_1.varchar)("city_code", { length: 10 }),
    inviter_id: (0, pg_core_1.integer)("inviter_id"),
    inviter_2nd_id: (0, pg_core_1.integer)("inviter_2nd_id"),
    city_agent_id: (0, pg_core_1.integer)("city_agent_id"),
    affiliated_org_id: (0, pg_core_1.integer)("affiliated_org_id"),
    created_at: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("users_openid_idx").on(table.openid),
    (0, pg_core_1.index)("users_inviter_idx").on(table.inviter_id),
    (0, pg_core_1.index)("users_location_idx").on(table.latitude, table.longitude),
]);
exports.teacherProfiles = (0, pg_core_1.pgTable)("teacher_profiles", {
    user_id: (0, pg_core_1.integer)("user_id").primaryKey().references(() => exports.users.id),
    real_name: (0, pg_core_1.varchar)("real_name", { length: 20 }),
    gender: (0, pg_core_1.smallint)("gender"),
    birth_year: (0, pg_core_1.integer)("birth_year"),
    education: (0, pg_core_1.varchar)("education", { length: 50 }),
    certificates: (0, pg_core_1.jsonb)("certificates"),
    subjects: (0, pg_core_1.jsonb)("subjects"),
    max_distance: (0, pg_core_1.integer)("max_distance").default(10),
    hourly_rate_min: (0, pg_core_1.numeric)("hourly_rate_min", { precision: 10, scale: 2 }),
    hourly_rate_max: (0, pg_core_1.numeric)("hourly_rate_max", { precision: 10, scale: 2 }),
    intro: (0, pg_core_1.text)("intro"),
    photos: (0, pg_core_1.jsonb)("photos"),
    schedule_settings: (0, pg_core_1.jsonb)("schedule_settings"),
});
exports.organizations = (0, pg_core_1.pgTable)("organizations", {
    user_id: (0, pg_core_1.integer)("user_id").primaryKey().references(() => exports.users.id),
    org_name: (0, pg_core_1.varchar)("org_name", { length: 100 }).notNull(),
    license: (0, pg_core_1.varchar)("license", { length: 255 }),
    address: (0, pg_core_1.varchar)("address", { length: 255 }),
    contact_person: (0, pg_core_1.varchar)("contact_person", { length: 20 }),
    contact_phone: (0, pg_core_1.varchar)("contact_phone", { length: 20 }),
    intro: (0, pg_core_1.text)("intro"),
    status: (0, pg_core_1.smallint)("status").default(0),
});
exports.cityAgents = (0, pg_core_1.pgTable)("city_agents", {
    user_id: (0, pg_core_1.integer)("user_id").primaryKey().references(() => exports.users.id),
    city_code: (0, pg_core_1.varchar)("city_code", { length: 10 }).notNull().unique(),
    city_name: (0, pg_core_1.varchar)("city_name", { length: 50 }).notNull(),
    commission_rate: (0, pg_core_1.numeric)("commission_rate", { precision: 5, scale: 2 }).default("10.00"),
    balance: (0, pg_core_1.numeric)("balance", { precision: 12, scale: 2 }).default("0.00"),
});
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.serial)().primaryKey(),
    parent_id: (0, pg_core_1.integer)("parent_id").notNull().references(() => exports.users.id),
    subject: (0, pg_core_1.varchar)("subject", { length: 50 }).notNull(),
    hourly_rate: (0, pg_core_1.numeric)("hourly_rate", { precision: 10, scale: 2 }).notNull(),
    student_gender: (0, pg_core_1.smallint)("student_gender"),
    student_grade: (0, pg_core_1.varchar)("student_grade", { length: 20 }),
    address: (0, pg_core_1.varchar)("address", { length: 255 }).notNull(),
    latitude: (0, pg_core_1.numeric)("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: (0, pg_core_1.numeric)("longitude", { precision: 10, scale: 7 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    status: (0, pg_core_1.smallint)("status").notNull().default(0),
    matched_teacher_id: (0, pg_core_1.integer)("matched_teacher_id"),
    matched_at: (0, pg_core_1.timestamp)("matched_at", { withTimezone: true }),
    expire_at: (0, pg_core_1.timestamp)("expire_at", { withTimezone: true }),
    created_at: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("orders_parent_idx").on(table.parent_id),
    (0, pg_core_1.index)("orders_status_expire_idx").on(table.status, table.expire_at),
    (0, pg_core_1.index)("orders_location_idx").on(table.latitude, table.longitude),
]);
exports.orderMatches = (0, pg_core_1.pgTable)("order_matches", {
    id: (0, pg_core_1.serial)().primaryKey(),
    order_id: (0, pg_core_1.integer)("order_id").notNull().references(() => exports.orders.id),
    teacher_id: (0, pg_core_1.integer)("teacher_id").notNull().references(() => exports.users.id),
    status: (0, pg_core_1.smallint)("status").notNull().default(0),
    contact_unlocked: (0, pg_core_1.smallint)("contact_unlocked").default(0),
    unlocked_at: (0, pg_core_1.timestamp)("unlocked_at", { withTimezone: true }),
    created_at: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("order_matches_teacher_idx").on(table.teacher_id),
]);
exports.membershipPlans = (0, pg_core_1.pgTable)("membership_plans", {
    id: (0, pg_core_1.serial)().primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 50 }).notNull(),
    role: (0, pg_core_1.smallint)("role").notNull(),
    price: (0, pg_core_1.numeric)("price", { precision: 10, scale: 2 }).notNull(),
    duration_days: (0, pg_core_1.integer)("duration_days").notNull(),
    commission_level1_rate: (0, pg_core_1.numeric)("commission_level1_rate", { precision: 5, scale: 2 }).default("0.00"),
    commission_level2_rate: (0, pg_core_1.numeric)("commission_level2_rate", { precision: 5, scale: 2 }).default("0.00"),
    city_agent_rate: (0, pg_core_1.numeric)("city_agent_rate", { precision: 5, scale: 2 }).default("0.00"),
    is_active: (0, pg_core_1.smallint)("is_active").default(1),
});
exports.products = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.serial)().primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    cover: (0, pg_core_1.varchar)("cover", { length: 255 }),
    price: (0, pg_core_1.numeric)("price", { precision: 10, scale: 2 }).notNull(),
    stock: (0, pg_core_1.integer)("stock").default(0),
    commission_level1_rate: (0, pg_core_1.numeric)("commission_level1_rate", { precision: 5, scale: 2 }).default("0.00"),
    commission_level2_rate: (0, pg_core_1.numeric)("commission_level2_rate", { precision: 5, scale: 2 }).default("0.00"),
    city_agent_rate: (0, pg_core_1.numeric)("city_agent_rate", { precision: 5, scale: 2 }).default("0.00"),
    is_active: (0, pg_core_1.smallint)("is_active").default(1),
});
exports.payments = (0, pg_core_1.pgTable)("payments", {
    id: (0, pg_core_1.serial)().primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    target_type: (0, pg_core_1.smallint)("target_type").notNull(),
    target_id: (0, pg_core_1.integer)("target_id").notNull(),
    amount: (0, pg_core_1.numeric)("amount", { precision: 10, scale: 2 }).notNull(),
    payment_no: (0, pg_core_1.varchar)("payment_no", { length: 64 }).notNull().unique(),
    transaction_id: (0, pg_core_1.varchar)("transaction_id", { length: 64 }),
    status: (0, pg_core_1.smallint)("status").notNull().default(0),
    paid_at: (0, pg_core_1.timestamp)("paid_at", { withTimezone: true }),
    created_at: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("payments_user_idx").on(table.user_id),
]);
exports.commissions = (0, pg_core_1.pgTable)("commissions", {
    id: (0, pg_core_1.serial)().primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    from_user_id: (0, pg_core_1.integer)("from_user_id"),
    payment_id: (0, pg_core_1.integer)("payment_id").notNull().references(() => exports.payments.id),
    level_type: (0, pg_core_1.smallint)("level_type").notNull(),
    amount: (0, pg_core_1.numeric)("amount", { precision: 10, scale: 2 }).notNull(),
    rate: (0, pg_core_1.numeric)("rate", { precision: 5, scale: 2 }).notNull(),
    status: (0, pg_core_1.smallint)("status").default(0),
    settled_at: (0, pg_core_1.timestamp)("settled_at", { withTimezone: true }),
    created_at: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("commissions_user_idx").on(table.user_id),
    (0, pg_core_1.index)("commissions_payment_idx").on(table.payment_id),
]);
exports.teacherSchedules = (0, pg_core_1.pgTable)("teacher_schedules", {
    id: (0, pg_core_1.serial)().primaryKey(),
    teacher_id: (0, pg_core_1.integer)("teacher_id").notNull().references(() => exports.users.id),
    student_name: (0, pg_core_1.varchar)("student_name", { length: 50 }).notNull(),
    student_grade: (0, pg_core_1.varchar)("student_grade", { length: 20 }),
    subject: (0, pg_core_1.varchar)("subject", { length: 50 }),
    start_time: (0, pg_core_1.timestamp)("start_time", { withTimezone: true }).notNull(),
    end_time: (0, pg_core_1.timestamp)("end_time", { withTimezone: true }).notNull(),
    note: (0, pg_core_1.text)("note"),
    created_at: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("teacher_schedules_teacher_time_idx").on(table.teacher_id, table.start_time),
]);
exports.contactViewLogs = (0, pg_core_1.pgTable)("contact_view_logs", {
    id: (0, pg_core_1.serial)().primaryKey(),
    order_id: (0, pg_core_1.integer)("order_id").notNull().references(() => exports.orders.id),
    user_id: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    target_user_id: (0, pg_core_1.integer)("target_user_id").notNull().references(() => exports.users.id),
    ip: (0, pg_core_1.varchar)("ip", { length: 45 }),
    created_at: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("contact_view_logs_order_idx").on(table.order_id),
]);
exports.adPositions = (0, pg_core_1.pgTable)("ad_positions", {
    id: (0, pg_core_1.serial)().primaryKey(),
    position_key: (0, pg_core_1.varchar)("position_key", { length: 50 }).notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 100 }),
    image_url: (0, pg_core_1.varchar)("image_url", { length: 255 }).notNull(),
    link_url: (0, pg_core_1.varchar)("link_url", { length: 255 }),
    sort_order: (0, pg_core_1.integer)("sort_order").default(0),
    is_active: (0, pg_core_1.smallint)("is_active").default(1),
});
exports.orgInviteLinks = (0, pg_core_1.pgTable)("org_invite_links", {
    id: (0, pg_core_1.serial)().primaryKey(),
    org_id: (0, pg_core_1.integer)("org_id").notNull().references(() => exports.organizations.user_id),
    code: (0, pg_core_1.varchar)("code", { length: 32 }).notNull().unique(),
    qr_code_url: (0, pg_core_1.varchar)("qr_code_url", { length: 255 }),
    expire_at: (0, pg_core_1.timestamp)("expire_at", { withTimezone: true }),
    created_at: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow().notNull(),
});
exports.healthCheck = (0, pg_core_1.pgTable)("health_check", {
    id: (0, pg_core_1.serial)().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
//# sourceMappingURL=schema.js.map