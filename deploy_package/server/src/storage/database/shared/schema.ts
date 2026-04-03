import { pgTable, serial, timestamp, varchar, boolean, integer, numeric, text, jsonb, smallint, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 用户表
export const users = pgTable(
  "users",
  {
    id: serial().primaryKey(),
    openid: varchar("openid", { length: 64 }),
    unionid: varchar("unionid", { length: 64 }),
    mobile: varchar("mobile", { length: 20 }),
    nickname: varchar("nickname", { length: 50 }),
    avatar: varchar("avatar", { length: 255 }),
    role: smallint("role").notNull().default(0), // 0家长 1个体教师 2机构老板 3城市代理
    status: smallint("status").default(1), // 1正常 0封禁
    membership_type: smallint("membership_type").default(0), // 0免费 1付费会员
    membership_expire_at: timestamp("membership_expire_at", { withTimezone: true }),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    city_code: varchar("city_code", { length: 10 }),
    inviter_id: integer("inviter_id"),
    inviter_2nd_id: integer("inviter_2nd_id"),
    city_agent_id: integer("city_agent_id"),
    affiliated_org_id: integer("affiliated_org_id"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_openid_idx").on(table.openid),
    index("users_inviter_idx").on(table.inviter_id),
    index("users_location_idx").on(table.latitude, table.longitude),
  ]
);

// 教师扩展表
export const teacherProfiles = pgTable(
  "teacher_profiles",
  {
    user_id: integer("user_id").primaryKey().references(() => users.id),
    real_name: varchar("real_name", { length: 20 }),
    gender: smallint("gender"),
    birth_year: integer("birth_year"),
    education: varchar("education", { length: 50 }),
    certificates: jsonb("certificates"),
    subjects: jsonb("subjects"),
    max_distance: integer("max_distance").default(10),
    hourly_rate_min: numeric("hourly_rate_min", { precision: 10, scale: 2 }),
    hourly_rate_max: numeric("hourly_rate_max", { precision: 10, scale: 2 }),
    intro: text("intro"),
    photos: jsonb("photos"),
    schedule_settings: jsonb("schedule_settings"),
  }
);

// 机构表
export const organizations = pgTable(
  "organizations",
  {
    user_id: integer("user_id").primaryKey().references(() => users.id),
    org_name: varchar("org_name", { length: 100 }).notNull(),
    license: varchar("license", { length: 255 }),
    address: varchar("address", { length: 255 }),
    contact_person: varchar("contact_person", { length: 20 }),
    contact_phone: varchar("contact_phone", { length: 20 }),
    intro: text("intro"),
    status: smallint("status").default(0), // 0待审核 1已审核 2驳回
  }
);

// 城市代理表
export const cityAgents = pgTable(
  "city_agents",
  {
    user_id: integer("user_id").primaryKey().references(() => users.id),
    city_code: varchar("city_code", { length: 10 }).notNull().unique(),
    city_name: varchar("city_name", { length: 50 }).notNull(),
    commission_rate: numeric("commission_rate", { precision: 5, scale: 2 }).default("10.00"),
    balance: numeric("balance", { precision: 12, scale: 2 }).default("0.00"),
  }
);

// 家长需求表（订单表）
export const orders = pgTable(
  "orders",
  {
    id: serial().primaryKey(),
    order_no: varchar("order_no", { length: 32 }),
    parent_id: integer("parent_id").notNull().references(() => users.id),
    subject: varchar("subject", { length: 50 }).notNull(),
    hourly_rate: numeric("hourly_rate", { precision: 10, scale: 2 }),
    student_gender: smallint("student_gender"),
    student_grade: varchar("student_grade", { length: 20 }),
    grade: varchar("grade", { length: 20 }),
    student_info: text("student_info"),
    schedule: varchar("schedule", { length: 100 }),
    address: varchar("address", { length: 255 }).notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    budget: numeric("budget", { precision: 10, scale: 2 }),
    description: text("description"),
    requirement: text("requirement"),
    status: smallint("status").notNull().default(0), // 0待抢单 1已匹配沟通中 2试课中 3已签约 4已完成 5已解除
    matched_teacher_id: integer("matched_teacher_id"),
    matched_at: timestamp("matched_at", { withTimezone: true }),
    cancel_reason: text("cancel_reason"),
    expire_at: timestamp("expire_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_parent_idx").on(table.parent_id),
    index("orders_status_expire_idx").on(table.status, table.expire_at),
    index("orders_location_idx").on(table.latitude, table.longitude),
  ]
);

// 订单匹配记录表
export const orderMatches = pgTable(
  "order_matches",
  {
    id: serial().primaryKey(),
    order_id: integer("order_id").notNull().references(() => orders.id),
    teacher_id: integer("teacher_id").notNull().references(() => users.id),
    status: smallint("status").notNull().default(0), // 0匹配中 1已接单 2已解除 3已完成
    contact_unlocked: smallint("contact_unlocked").default(0),
    unlocked_at: timestamp("unlocked_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("order_matches_teacher_idx").on(table.teacher_id),
  ]
);

// 会员套餐表
export const membershipPlans = pgTable(
  "membership_plans",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    role: smallint("role").notNull(), // 0家长 1教师 2机构
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    duration_days: integer("duration_days").notNull(),
    commission_level1_rate: numeric("commission_level1_rate", { precision: 5, scale: 2 }).default("0.00"),
    commission_level2_rate: numeric("commission_level2_rate", { precision: 5, scale: 2 }).default("0.00"),
    city_agent_rate: numeric("city_agent_rate", { precision: 5, scale: 2 }).default("0.00"),
    is_active: smallint("is_active").default(1),
  }
);

// 商品表
export const products = pgTable(
  "products",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    cover: varchar("cover", { length: 255 }),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").default(0),
    commission_level1_rate: numeric("commission_level1_rate", { precision: 5, scale: 2 }).default("0.00"),
    commission_level2_rate: numeric("commission_level2_rate", { precision: 5, scale: 2 }).default("0.00"),
    city_agent_rate: numeric("city_agent_rate", { precision: 5, scale: 2 }).default("0.00"),
    is_active: smallint("is_active").default(1),
  }
);

// 支付记录表
export const payments = pgTable(
  "payments",
  {
    id: serial().primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id),
    target_type: smallint("target_type").notNull(), // 1会员 2商品
    target_id: integer("target_id").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    payment_no: varchar("payment_no", { length: 64 }).notNull().unique(),
    transaction_id: varchar("transaction_id", { length: 64 }),
    status: smallint("status").notNull().default(0), // 0待支付 1已支付 2已退款
    paid_at: timestamp("paid_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payments_user_idx").on(table.user_id),
  ]
);

// 分佣记录表
export const commissions = pgTable(
  "commissions",
  {
    id: serial().primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id),
    from_user_id: integer("from_user_id"),
    payment_id: integer("payment_id").notNull().references(() => payments.id),
    level_type: smallint("level_type").notNull(), // 1一级 2二级 3城市代理 4机构
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
    status: smallint("status").default(0), // 0待结算 1已结算 2已提现
    settled_at: timestamp("settled_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("commissions_user_idx").on(table.user_id),
    index("commissions_payment_idx").on(table.payment_id),
  ]
);

// 教师排课记录表
export const teacherSchedules = pgTable(
  "teacher_schedules",
  {
    id: serial().primaryKey(),
    teacher_id: integer("teacher_id").notNull().references(() => users.id),
    student_name: varchar("student_name", { length: 50 }).notNull(),
    student_grade: varchar("student_grade", { length: 20 }),
    subject: varchar("subject", { length: 50 }),
    start_time: timestamp("start_time", { withTimezone: true }).notNull(),
    end_time: timestamp("end_time", { withTimezone: true }).notNull(),
    note: text("note"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("teacher_schedules_teacher_time_idx").on(table.teacher_id, table.start_time),
  ]
);

// 联系方式查看日志
export const contactViewLogs = pgTable(
  "contact_view_logs",
  {
    id: serial().primaryKey(),
    order_id: integer("order_id").notNull().references(() => orders.id),
    user_id: integer("user_id").notNull().references(() => users.id),
    target_user_id: integer("target_user_id").notNull().references(() => users.id),
    ip: varchar("ip", { length: 45 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("contact_view_logs_order_idx").on(table.order_id),
  ]
);

// 广告位表
export const adPositions = pgTable(
  "ad_positions",
  {
    id: serial().primaryKey(),
    position_key: varchar("position_key", { length: 50 }).notNull(), // home_top, home_middle
    title: varchar("title", { length: 100 }),
    image_url: varchar("image_url", { length: 255 }).notNull(),
    link_url: varchar("link_url", { length: 255 }),
    sort_order: integer("sort_order").default(0),
    is_active: smallint("is_active").default(1),
  }
);

// 机构邀请链接表
export const orgInviteLinks = pgTable(
  "org_invite_links",
  {
    id: serial().primaryKey(),
    org_id: integer("org_id").notNull().references(() => organizations.user_id),
    code: varchar("code", { length: 32 }).notNull().unique(),
    qr_code_url: varchar("qr_code_url", { length: 255 }),
    expire_at: timestamp("expire_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

// 保留系统表
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
