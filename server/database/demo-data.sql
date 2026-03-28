-- 棉花糖教育平台演示数据
-- 执行前请确保基础表已创建

USE mht_edu;

-- 活动表
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL COMMENT '活动标题',
    type VARCHAR(20) NOT NULL COMMENT '类型: visit探校 training培训 lecture讲座 other其他',
    cover_image VARCHAR(255) COMMENT '封面图',
    description TEXT COMMENT '活动描述',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    address VARCHAR(255) COMMENT '地址',
    latitude DECIMAL(10,7) COMMENT '纬度',
    longitude DECIMAL(10,7) COMMENT '经度',
    online_price DECIMAL(10,2) DEFAULT 0 COMMENT '线上价格',
    offline_price DECIMAL(10,2) DEFAULT 0 COMMENT '线下价格',
    max_participants INT DEFAULT 0 COMMENT '最大参与人数(0不限)',
    current_participants INT DEFAULT 0 COMMENT '当前报名人数',
    target_roles JSON COMMENT '目标角色: [0]家长 [1]教师 [2]机构',
    status VARCHAR(20) DEFAULT 'upcoming' COMMENT '状态: upcoming即将开始 ongoing进行中 ended已结束',
    is_online SMALLINT DEFAULT 0 COMMENT '是否线上活动',
    is_active SMALLINT DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动表';

-- 活动报名表
CREATE TABLE IF NOT EXISTS activity_signups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL COMMENT '活动ID',
    user_id INT NOT NULL COMMENT '用户ID',
    signup_type SMALLINT NOT NULL COMMENT '报名类型: 1线上 2线下',
    participant_name VARCHAR(50) NOT NULL COMMENT '参与者姓名',
    participant_phone VARCHAR(20) NOT NULL COMMENT '参与者电话',
    participant_count INT DEFAULT 1 COMMENT '参与人数',
    total_amount DECIMAL(10,2) DEFAULT 0 COMMENT '总金额',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1已报名 2已取消 3已签到',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity (activity_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动报名表';

-- 活动收藏表
CREATE TABLE IF NOT EXISTS activity_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL COMMENT '活动ID',
    user_id INT NOT NULL COMMENT '用户ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_activity_user (activity_id, user_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动收藏表';

-- ==================== 演示数据 ====================

-- 清理旧演示数据（可选，谨慎使用）
-- DELETE FROM users WHERE id >= 100;

-- 插入教师用户（id 100-149）
INSERT INTO users (id, openid, mobile, nickname, avatar, role, status, membership_type, membership_expire_at, latitude, longitude, city_name, created_at) VALUES
(100, 'teacher_001', '13800138001', '张老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 39.995, 116.473, '北京', DATE_SUB(NOW(), INTERVAL 60 DAY)),
(101, 'teacher_002', '13800138002', '李老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher2', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 39.982, 116.491, '北京', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(102, 'teacher_003', '13800138003', '王老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher3', 1, 1, 0, NULL, 40.012, 116.456, '北京', DATE_SUB(NOW(), INTERVAL 30 DAY)),
(103, 'teacher_004', '13800138004', '刘老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher4', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), 39.978, 116.489, '北京', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(104, 'teacher_005', '13800138005', '陈老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher5', 1, 1, 0, NULL, 40.023, 116.467, '北京', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(105, 'teacher_006', '13800138006', '赵老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher6', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 39.989, 116.512, '北京', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(106, 'teacher_007', '13800138007', '周老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher7', 1, 1, 0, NULL, 40.034, 116.478, '北京', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(107, 'teacher_008', '13800138008', '吴老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher8', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 20 DAY), 39.967, 116.445, '北京', NOW()),
(108, 'teacher_009', '13800138009', '孙老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher9', 1, 1, 0, NULL, 40.045, 116.523, '北京', NOW()),
(109, 'teacher_010', '13800138010', '钱老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher10', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 39.991, 116.434, '北京', NOW()),
(110, 'teacher_011', '13800138011', '郑老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher11', 1, 1, 0, NULL, 40.012, 116.501, '北京', NOW()),
(111, 'teacher_012', '13800138012', '黄老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher12', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 39.978, 116.467, '北京', NOW()),
(112, 'teacher_013', '13800138013', '林老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher13', 1, 1, 0, NULL, 40.056, 116.489, '北京', NOW()),
(113, 'teacher_014', '13800138014', '何老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher14', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 39.945, 116.512, '北京', NOW()),
(114, 'teacher_015', '13800138015', '高老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher15', 1, 1, 0, NULL, 40.023, 116.534, '北京', NOW()),
(115, 'teacher_016', '13800138016', '马老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher16', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 39.967, 116.478, '北京', NOW()),
(116, 'teacher_017', '13800138017', '徐老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher17', 1, 1, 0, NULL, 40.034, 116.456, '北京', NOW()),
(117, 'teacher_018', '13800138018', '罗老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher18', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 90 DAY), 39.989, 116.523, '北京', NOW()),
(118, 'teacher_019', '13800138019', '谢老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher19', 1, 1, 0, NULL, 40.045, 116.445, '北京', NOW()),
(119, 'teacher_020', '13800138020', '唐老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher20', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 39.956, 116.501, '北京', NOW()),
(120, 'teacher_021', '13800138021', '韩老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher21', 1, 1, 0, NULL, 40.067, 116.467, '北京', NOW()),
(121, 'teacher_022', '13800138022', '冯老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher22', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 39.934, 116.534, '北京', NOW()),
(122, 'teacher_023', '13800138023', '邓老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher23', 1, 1, 0, NULL, 40.078, 116.489, '北京', NOW()),
(123, 'teacher_024', '13800138024', '曹老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher24', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 39.923, 116.512, '北京', NOW()),
(124, 'teacher_025', '13800138025', '许老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher25', 1, 1, 0, NULL, 40.089, 116.456, '北京', NOW()),
(125, 'teacher_026', '13800138026', '蒋老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher26', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 39.912, 116.478, '北京', NOW()),
(126, 'teacher_027', '13800138027', '沈老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher27', 1, 1, 0, NULL, 40.101, 116.523, '北京', NOW()),
(127, 'teacher_028', '13800138028', '韦老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher28', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 39.901, 116.445, '北京', NOW()),
(128, 'teacher_029', '13800138029', '杨老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher29', 1, 1, 0, NULL, 40.112, 116.501, '北京', NOW()),
(129, 'teacher_030', '13800138030', '朱老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher30', 1, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 39.889, 116.534, '北京', NOW());

-- 插入教师扩展信息
INSERT INTO teacher_profiles (user_id, real_name, gender, birth_year, education, subjects, teaching_years, hourly_rate_min, hourly_rate_max, intro, one_line_intro, verify_status, rating, review_count, view_count, success_count) VALUES
(100, '张明', 1, 1985, '北京大学·硕士', '["数学","物理"]', 8, 150, 200, '专注中考数学提分，8年教学经验，帮助超过100名学生考入重点高中。善于因材施教，针对不同基础的学生制定个性化学习方案。', '中考数学提分专家', 2, 4.95, 58, 1256, 45),
(101, '李芳', 2, 1990, '清华大学·本科', '["英语","语文"]', 5, 120, 180, '英语专业八级，口语流利，擅长英语口语和写作指导。曾在外企工作3年，熟悉商务英语应用场景。', '英语专八，口语流利', 2, 4.88, 42, 986, 38),
(102, '王强', 1, 1982, '北京师范大学·博士', '["化学","生物"]', 10, 200, 300, '重点中学在职教师，10年一线教学经验，熟悉高考命题趋势。多名学生考入清华北大。', '重点中学在职教师', 2, 4.92, 35, 856, 28),
(103, '刘婷', 2, 1988, '中国人民大学·硕士', '["语文","历史"]', 6, 130, 180, '擅长语文阅读写作指导，历史知识点讲解清晰。帮助学生培养良好的阅读习惯和写作能力。', '语文阅读写作指导', 2, 4.85, 29, 678, 25),
(104, '陈浩', 1, 1992, '北京航空航天大学·本科', '["数学","物理"]', 4, 100, 150, '年轻有活力，善于与中小学生沟通。注重培养学生的逻辑思维能力和解题技巧。', '年轻有活力，善于沟通', 1, 4.78, 18, 423, 15),
(105, '赵雪', 2, 1986, '北京外国语大学·硕士', '["英语"]', 7, 150, 220, '留学英国2年，纯正英式发音。擅长雅思托福备考指导，多名学生成功出国留学。', '留英硕士，纯正发音', 2, 4.90, 47, 1123, 40),
(106, '周杰', 1, 1983, '复旦大学·硕士', '["数学"]', 9, 180, 250, '奥数获奖经历，擅长竞赛数学指导。多名学生在数学竞赛中获奖。', '奥数竞赛指导', 2, 4.96, 52, 1456, 48),
(107, '吴敏', 2, 1991, '华东师范大学·本科', '["语文"]', 3, 90, 130, '应届师范生，教学方法新颖。善于激发学生语文学习兴趣。', '师范毕业，教学方法新颖', 1, 4.70, 12, 234, 8),
(108, '孙伟', 1, 1980, '浙江大学·博士', '["物理","化学"]', 12, 220, 320, '高校教师，对高中理科有深入研究。擅长将抽象概念具体化，帮助学生理解难点。', '高校教师，理科专家', 2, 4.94, 63, 1678, 55),
(109, '钱琳', 2, 1989, '南京大学·硕士', '["英语","法语"]', 5, 140, 200, '精通英语和法语，可进行双语教学。适合有留学需求的学生。', '英法双语教学', 2, 4.86, 36, 812, 30),
(110, '郑凯', 1, 1984, '武汉大学·硕士', '["地理","历史"]', 7, 120, 180, '文科综合能力强，善于构建知识体系。帮助学生在文科科目上快速提分。', '文科综合指导', 2, 4.82, 28, 567, 22),
(111, '黄丽', 2, 1993, '中山大学·本科', '["化学"]', 2, 80, 120, '化学专业毕业，基础扎实。耐心细致，适合基础薄弱的学生。', '化学专业，耐心细致', 0, 4.65, 8, 156, 5),
(112, '林峰', 1, 1987, '四川大学·硕士', '["生物","化学"]', 6, 150, 220, '医学生物背景，对生物化学有独到见解。擅长用生活实例讲解知识点。', '医学生物背景', 2, 4.89, 41, 934, 35),
(113, '何静', 2, 1990, '天津大学·本科', '["数学"]', 4, 110, 160, '数学专业毕业，善于总结解题方法。适合中等学生提分。', '数学专业，善于总结', 1, 4.75, 22, 456, 18),
(114, '高翔', 1, 1981, '同济大学·博士', '["物理"]', 11, 200, 300, '物理博士，对物理有深入研究。善于培养学生的物理思维。', '物理博士，思维培养', 2, 4.93, 55, 1345, 50),
(115, '马欣', 2, 1992, '南开大学·本科', '["语文"]', 3, 100, 150, '中文专业毕业，热爱文学。善于引导学生发现语文之美。', '中文专业，热爱文学', 1, 4.72, 15, 289, 10),
(116, '徐涛', 1, 1985, '厦门大学·硕士', '["英语"]', 7, 140, 200, '外贸工作经验丰富，擅长商务英语和口语。适合成人英语提升。', '商务英语专家', 2, 4.87, 38, 867, 32),
(117, '罗燕', 2, 1988, '山东大学·硕士', '["历史","政治"]', 6, 120, 180, '历史政治双料高手，擅长文科综合。帮助学生在高考文综中取得高分。', '文科综合高手', 2, 4.84, 31, 612, 26),
(118, '谢峰', 1, 1982, '吉林大学·博士', '["数学"]', 10, 180, 280, '数学博士，大学教师。对初高中数学有独到理解，善于培养学生的数学思维。', '数学博士，思维培养', 2, 4.91, 48, 1089, 42),
(119, '唐莉', 2, 1991, '东南大学·本科', '["物理"]', 3, 100, 150, '物理专业毕业，教学方法灵活。善于用实验演示物理原理。', '物理教学，实验演示', 1, 4.76, 19, 378, 14),
(120, '韩磊', 1, 1986, '西北大学·硕士', '["地理"]', 6, 130, 190, '地理专业出身，对地理有深入理解。善于用图表讲解地理知识。', '地理专业，图表教学', 2, 4.80, 27, 523, 20),
(121, '冯雨', 2, 1993, '兰州大学·本科', '["生物"]', 2, 90, 140, '生物专业毕业，对生物有浓厚兴趣。耐心引导学生学习生物。', '生物专业，耐心引导', 0, 4.68, 10, 198, 6),
(122, '邓超', 1, 1984, '中国科学技术大学·硕士', '["物理","数学"]', 8, 170, 250, '中科大毕业，理科基础扎实。善于培养学生的理科思维和解题能力。', '中科大毕业，理科专家', 2, 4.92, 44, 1023, 38),
(123, '曹敏', 2, 1989, '湖南大学·硕士', '["英语","日语"]', 5, 140, 200, '英语日语双语教学，适合有留学日本需求的学生。', '英日双语教学', 2, 4.85, 33, 756, 28),
(124, '许强', 1, 1983, '中南大学·博士', '["化学"]', 9, 190, 280, '化学博士，对化学有深入研究。善于将复杂的化学概念简单化。', '化学博士，概念简化', 2, 4.88, 40, 912, 35),
(125, '蒋丽', 2, 1992, '重庆大学·本科', '["语文"]', 3, 95, 145, '师范专业毕业，教学方法规范。善于培养学生的语文基础能力。', '师范毕业，基础培养', 1, 4.74, 16, 312, 12),
(126, '沈浩', 1, 1980, '电子科技大学·博士', '["数学","物理"]', 12, 210, 310, '大学教授，对数学物理有深入研究。适合尖子生拔高。', '大学教授，尖子拔高', 2, 4.95, 60, 1567, 52),
(127, '韦婷', 2, 1991, '西安交通大学·硕士', '["英语"]', 4, 130, 180, '英语专业八级，口语流利。适合英语口语提升。', '英语专八，口语流利', 2, 4.83, 25, 567, 20),
(128, '杨帆', 1, 1987, '哈尔滨工业大学·硕士', '["物理"]', 6, 160, 230, '工科背景，物理知识扎实。善于将物理与工程实践结合讲解。', '工科背景，实践结合', 2, 4.86, 37, 834, 30),
(129, '朱琳', 2, 1990, '北京理工大学·硕士', '["语文","政治"]', 5, 125, 175, '文科综合能力强，善于帮助学生构建文科知识体系。', '文科综合，体系构建', 2, 4.79, 24, 489, 18);

-- 插入家长用户（id 200-279）
INSERT INTO users (id, openid, mobile, nickname, avatar, role, status, membership_type, membership_expire_at, latitude, longitude, city_name, created_at) VALUES
(200, 'parent_001', '13900139001', '张妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent1', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 39.991, 116.478, '北京', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(201, 'parent_002', '13900139002', '李爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent2', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 40.012, 116.489, '北京', DATE_SUB(NOW(), INTERVAL 30 DAY)),
(202, 'parent_003', '13900139003', '王妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent3', 0, 1, 0, NULL, 39.978, 116.456, '北京', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(203, 'parent_004', '13900139004', '刘爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent4', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 40.023, 116.512, '北京', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(204, 'parent_005', '13900139005', '陈妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent5', 0, 1, 0, NULL, 39.967, 116.445, '北京', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(205, 'parent_006', '13900139006', '赵爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent6', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 40.034, 116.523, '北京', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(206, 'parent_007', '13900139007', '周妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent7', 0, 1, 0, NULL, 39.989, 116.467, '北京', NOW()),
(207, 'parent_008', '13900139008', '吴爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent8', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 40.045, 116.501, '北京', NOW()),
(208, 'parent_009', '13900139009', '孙妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent9', 0, 1, 0, NULL, 39.956, 116.534, '北京', NOW()),
(209, 'parent_010', '13900139010', '钱爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent10', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 40.067, 116.478, '北京', NOW()),
(210, 'parent_011', '13900139011', '郑妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent11', 0, 1, 0, NULL, 39.934, 116.489, '北京', NOW()),
(211, 'parent_012', '13900139012', '黄爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent12', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 40.078, 116.456, '北京', NOW()),
(212, 'parent_013', '13900139013', '林妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent13', 0, 1, 0, NULL, 39.923, 116.512, '北京', NOW()),
(213, 'parent_014', '13900139014', '何爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent14', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 40.089, 116.523, '北京', NOW()),
(214, 'parent_015', '13900139015', '高妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent15', 0, 1, 0, NULL, 39.901, 116.467, '北京', NOW()),
(215, 'parent_016', '13900139016', '马爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent16', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 40.101, 116.445, '北京', NOW()),
(216, 'parent_017', '13900139017', '徐妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent17', 0, 1, 0, NULL, 39.889, 116.501, '北京', NOW()),
(217, 'parent_018', '13900139018', '罗爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent18', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 40.112, 116.534, '北京', NOW()),
(218, 'parent_019', '13900139019', '谢妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent19', 0, 1, 0, NULL, 39.878, 116.478, '北京', NOW()),
(219, 'parent_020', '13900139020', '唐爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent20', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 40.123, 116.489, '北京', NOW()),
(220, 'parent_021', '13900139021', '韩妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent21', 0, 1, 0, NULL, 39.867, 116.456, '北京', NOW()),
(221, 'parent_022', '13900139022', '冯爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent22', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 40.134, 116.512, '北京', NOW()),
(222, 'parent_023', '13900139023', '邓妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent23', 0, 1, 0, NULL, 39.856, 116.523, '北京', NOW()),
(223, 'parent_024', '13900139024', '曹爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent24', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 40.145, 116.467, '北京', NOW()),
(224, 'parent_025', '13900139025', '许妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent25', 0, 1, 0, NULL, 39.845, 116.445, '北京', NOW()),
(225, 'parent_026', '13900139026', '蒋爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent26', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 60 DAY), 40.156, 116.501, '北京', NOW()),
(226, 'parent_027', '13900139027', '沈妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent27', 0, 1, 0, NULL, 39.834, 116.534, '北京', NOW()),
(227, 'parent_028', '13900139028', '韦爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent28', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 45 DAY), 40.167, 116.478, '北京', NOW()),
(228, 'parent_029', '13900139029', '杨妈妈', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent29', 0, 1, 0, NULL, 39.823, 116.489, '北京', NOW()),
(229, 'parent_030', '13900139030', '朱爸爸', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent30', 0, 1, 1, DATE_ADD(NOW(), INTERVAL 30 DAY), 40.178, 116.456, '北京', NOW());

-- 插入订单数据（id 从100开始）
INSERT INTO orders (order_no, parent_id, subject, hourly_rate, student_gender, student_grade, address, latitude, longitude, description, status, matched_teacher_id, matched_at, expire_at, view_count, created_at) VALUES
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '001'), 200, '["数学"]', 180, 1, '初三', '朝阳区望京西园四区', 39.991, 116.478, '孩子数学基础薄弱，希望找到有耐心的老师，目标是中考数学达到110分以上', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 45, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '002'), 201, '["英语"]', 150, 2, '高二', '海淀区中关村南大街', 40.012, 116.489, '英语口语需要提升，准备出国留学，希望找到有留学背景的老师', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 38, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '003'), 202, '["物理"]', 200, 1, '高一', '西城区金融街', 39.978, 116.456, '物理成绩不稳定，需要系统提升，希望老师有丰富的高中物理教学经验', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 52, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '004'), 203, '["语文"]', 130, 2, '初二', '东城区东直门', 40.023, 116.512, '语文阅读理解和作文需要提升，希望找到擅长语文教学的老师', 1, 100, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 67, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '005'), 204, '["化学"]', 160, 1, '高三', '丰台区方庄', 39.967, 116.445, '高三冲刺阶段，化学需要快速提分，目标高考化学90分以上', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 89, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '006'), 205, '["数学"]', 170, 2, '高一', '朝阳区CBD', 40.034, 116.523, '高中数学跟不上，需要从基础开始补习，希望老师有耐心', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 34, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '007'), 206, '["英语"]', 140, 1, '初三', '海淀区五道口', 39.989, 116.467, '中考英语冲刺，目标115分以上，需要加强完形填空和阅读理解', 1, 101, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 7 DAY), 56, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '008'), 207, '["生物"]', 150, 2, '高二', '西城区西单', 40.045, 116.501, '生物基础薄弱，需要系统学习，希望老师能深入浅出讲解', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 28, DATE_SUB(NOW(), INTERVAL 15 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '009'), 208, '["历史"]', 120, 1, '初一', '东城区王府井', 39.956, 116.534, '对历史感兴趣但学习方法不对，希望找到能激发兴趣的老师', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 41, DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '010'), 209, '["地理"]', 130, 2, '高三', '朝阳区三里屯', 40.067, 116.478, '高考地理冲刺，需要提高答题技巧和知识综合运用能力', 1, 110, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_ADD(NOW(), INTERVAL 7 DAY), 63, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '011'), 210, '["数学"]', 190, 1, '高二', '海淀区学院路', 39.934, 116.489, '数学竞赛准备，需要找有奥数经验的老师', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 72, DATE_SUB(NOW(), INTERVAL 25 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '012'), 211, '["物理"]', 180, 2, '初三', '西城区宣武门', 40.078, 116.456, '中考物理冲刺，目标满分，希望找到重点中学在职老师', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 55, DATE_SUB(NOW(), INTERVAL 30 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '013'), 212, '["英语"]', 160, 1, '高一', '朝阳区望京', 39.923, 116.512, '高一英语基础巩固，希望提升阅读和写作能力', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 33, DATE_SUB(NOW(), INTERVAL 35 HOUR)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '014'), 213, '["化学"]', 170, 2, '高三', '海淀区中关村', 40.089, 116.523, '高考化学冲刺，需要系统复习和重点突破', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 78, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '015'), 214, '["语文"]', 140, 1, '初二', '东城区崇文门', 39.901, 116.467, '语文作文需要提升，希望找到擅长写作指导的老师', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 29, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '016'), 215, '["数学"]', 150, 2, '初一', '丰台区丽泽', 40.101, 116.445, '初中数学入门，希望培养孩子的数学兴趣和思维', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 44, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '017'), 216, '["英语"]', 200, 1, '高三', '朝阳区国贸', 39.889, 116.501, '高考英语冲刺，目标130分以上，希望有丰富高考经验的老师', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 91, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '018'), 217, '["物理"]', 190, 2, '高二', '海淀区公主坟', 40.112, 116.534, '高中物理竞赛准备，需要有竞赛指导经验的老师', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 58, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '019'), 218, '["生物"]', 140, 1, '初三', '西城区广安门', 39.878, 116.478, '中考生物冲刺，目标是满分', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 36, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '020'), 219, '["历史"]', 130, 2, '高一', '东城区东四十条', 40.123, 116.489, '高中历史入门，希望培养学习兴趣和方法', 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY), 27, DATE_SUB(NOW(), INTERVAL 4 DAY));

-- 插入活动数据
INSERT INTO activities (title, type, cover_image, description, start_time, end_time, address, latitude, longitude, online_price, offline_price, max_participants, current_participants, target_roles, status, is_online, created_at) VALUES
('北京四中探校活动', 'visit', 'https://api.dicebear.com/7.x/shapes/svg?seed=visit1', '走进北京四中，了解学校教学理念、师资力量和校园文化。与招生老师面对面交流，解答升学疑问。\n\n活动亮点：\n1. 参观校园环境和教学设施\n2. 了解学校招生政策和录取标准\n3. 与在校生家长交流心得\n4. 专场答疑环节', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY + INTERVAL 3 HOUR), '北京市西城区北京四中', 39.934, 116.378, 0, 99, 50, 32, '[0]', 'upcoming', 0, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('新高考政策解读讲座', 'lecture', 'https://api.dicebear.com/7.x/shapes/svg?seed=lecture1', '邀请资深教育专家，深入解读新高考改革政策，分析选科策略和升学路径。\n\n讲座内容：\n1. 新高考改革背景和意义\n2. 3+1+2选科模式详解\n3. 不同选科组合的优劣分析\n4. 如何根据孩子特点制定选科方案', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY + INTERVAL 2 HOUR), '线上直播', 0, 0, 29, 0, 200, 156, '[0,1]', 'upcoming', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('教师教学技能提升研修', 'training', 'https://api.dicebear.com/7.x/shapes/svg?seed=training1', '为期两天的教学技能研修班，由知名教育专家和优秀教师主讲，分享教学方法和课堂管理技巧。\n\n研修内容：\n1. 现代教育理念与方法\n2. 高效课堂设计技巧\n3. 学生心理与沟通技巧\n4. 教学案例分享与讨论', DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 16 DAY), '海淀区教师进修学校', 39.978, 116.312, 0, 299, 30, 28, '[1]', 'upcoming', 0, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('人大附中校园开放日', 'visit', 'https://api.dicebear.com/7.x/shapes/svg?seed=visit2', '人大附中校园开放日，全面展示学校教育教学成果，深入了解学校特色课程和社团活动。\n\n活动安排：\n1. 学校整体介绍\n2. 特色课程展示\n3. 社团活动体验\n4. 招生政策答疑', DATE_ADD(NOW(), INTERVAL 21 DAY), DATE_ADD(NOW(), INTERVAL 21 DAY + INTERVAL 4 HOUR), '北京市海淀区人大附中', 39.967, 116.312, 0, 129, 80, 45, '[0]', 'upcoming', 0, DATE_SUB(NOW(), INTERVAL 10 DAY)),
('中考志愿填报指导讲座', 'lecture', 'https://api.dicebear.com/7.x/shapes/svg?seed=lecture2', '中考志愿填报专家指导，分析北京中考录取规则，手把手教你科学填报志愿。\n\n讲座内容：\n1. 北京中考录取规则详解\n2. 志愿填报策略与技巧\n3. 常见填报误区分析\n4. 一对一答疑指导', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY + INTERVAL 2 HOUR), '线上直播', 0, 0, 49, 0, 500, 423, '[0]', 'upcoming', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('青少年学习方法研修营', 'training', 'https://api.dicebear.com/7.x/shapes/svg?seed=training2', '三天集中研修，帮助学生掌握科学学习方法，提高学习效率。\n\n研修内容：\n1. 高效记忆方法\n2. 笔记整理技巧\n3. 时间管理方法\n4. 考试应对策略', DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 33 DAY), '朝阳区青少年活动中心', 39.945, 116.456, 0, 399, 40, 18, '[0]', 'upcoming', 0, DATE_SUB(NOW(), INTERVAL 15 DAY)),
('清华北大状元学习经验分享', 'lecture', 'https://api.dicebear.com/7.x/shapes/svg?seed=lecture3', '邀请清华北大学子分享学习经验和方法，为学弟学妹答疑解惑。\n\n分享内容：\n1. 各科学习方法分享\n2. 时间管理经验\n3. 备考心态调整\n4. 现场问答互动', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY + INTERVAL 2 HOUR), '线上直播', 0, 0, 19, 0, 1000, 876, '[0]', 'upcoming', 1, NOW()),
('数学竞赛入门指导', 'training', 'https://api.dicebear.com/7.x/shapes/svg?seed=training3', '数学竞赛入门课程，由奥数获奖者主讲，帮助学生建立竞赛思维。\n\n课程内容：\n1. 数学竞赛概述\n2. 基础竞赛题型讲解\n3. 竞赛思维训练\n4. 学习路线规划', DATE_ADD(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY + INTERVAL 3 HOUR), '海淀区知春路', 39.989, 116.323, 0, 199, 25, 12, '[0,1]', 'upcoming', 0, DATE_SUB(NOW(), INTERVAL 8 DAY));

-- 插入一些匹配记录
INSERT INTO order_matches (order_id, teacher_id, status, contact_unlocked, created_at) VALUES
(4, 100, 1, 1, NOW()),
(7, 101, 1, 1, NOW()),
(10, 110, 1, 0, NOW());

-- 插入评价数据
INSERT INTO reviews (order_id, parent_id, teacher_id, rating, content, tags, is_anonymous, created_at) VALUES
(4, 203, 100, 5, '张老师非常有耐心，孩子很喜欢他的教学方式。经过一段时间的学习，数学成绩有了明显提升。', '["耐心","专业","认真负责"]', 0, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7, 205, 101, 5, '李老师英语水平很高，口语纯正，教学方法很好。孩子英语成绩进步很大。', '["口语纯正","教学方法好"]', 0, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- 插入教师动态
INSERT INTO teacher_moments (teacher_id, content, images, like_count, comment_count, created_at) VALUES
(100, '今天上课很顺利，学生掌握了解方程的新方法，进步很大！继续加油💪', '["https://api.dicebear.com/7.x/shapes/svg?seed=moment1"]', 28, 5, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(101, '分享一个英语学习方法：每天坚持背诵20个单词，一个月就能积累600个词汇量！', '[]', 45, 12, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(102, '刚刚结束今天的课程，学生对化学实验很感兴趣，动手能力越来越强了', '["https://api.dicebear.com/7.x/shapes/svg?seed=moment2"]', 32, 8, NOW());

-- 插入会员套餐数据（如果未初始化）
INSERT IGNORE INTO membership_plans (name, role, price, original_price, duration_days, features, is_active, sort_order) VALUES
('家长月卡', 0, 29.90, 59.00, 30, '["查看教师联系方式","无限发布需求","优先匹配"]', 1, 1),
('家长季卡', 0, 79.00, 177.00, 90, '["查看教师联系方式","无限发布需求","优先匹配","专属客服"]', 1, 2),
('家长年卡', 0, 199.00, 708.00, 365, '["查看教师联系方式","无限发布需求","优先匹配","专属客服","推荐奖励翻倍"]', 1, 3),
('教师月卡', 1, 39.90, 79.00, 30, '["查看家长联系方式","无限抢单","优先展示"]', 1, 1),
('教师季卡', 1, 99.00, 237.00, 90, '["查看家长联系方式","无限抢单","优先展示","专属客服"]', 1, 2),
('教师年卡', 1, 259.00, 948.00, 365, '["查看家长联系方式","无限抢单","优先展示","专属客服","推荐奖励翻倍"]', 1, 3);

-- 更新活动表的current_participants为实际报名人数
UPDATE activities SET current_participants = (
    SELECT COALESCE(SUM(participant_count), 0) 
    FROM activity_signups 
    WHERE activity_id = activities.id AND status = 1
) WHERE id > 0;

SELECT '演示数据初始化完成' as message;
