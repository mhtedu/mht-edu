#!/usr/bin/env python3
"""
SQL文件完整性验证工具
精确检查每个CREATE TABLE语句
"""

import re
import sys

def validate_sql_file(filepath):
    """验证SQL文件的完整性"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 分割CREATE TABLE语句
    tables = {}
    current_table = None
    current_def = []

    for line in content.split('\n'):
        if 'CREATE TABLE' in line:
            match = re.search(r'CREATE TABLE `([^`]+)`', line)
            if match:
                current_table = match.group(1)
                current_def = [line]
        elif current_table:
            current_def.append(line)
            if ');' in line or ') ENGINE=' in line:
                tables[current_table] = '\n'.join(current_def)
                current_table = None
                current_def = []

    # 验证每个表
    errors = []
    warnings = []

    print("=" * 80)
    print(f"检查 {len(tables)} 个表定义")
    print("=" * 80)

    for table_name, table_def in tables.items():
        # 提取所有AUTO_INCREMENT字段
        # 需要匹配字段定义行，排除表名行
        lines = table_def.split('\n')
        auto_inc_fields = []

        for line in lines:
            # 跳过CREATE TABLE行（表定义行）
            if 'CREATE TABLE' in line:
                continue
            # 匹配字段定义行
            match = re.match(r'\s*`(\w+)`\s+\w+[^,]*\bAUTO_INCREMENT\b', line)
            if match:
                auto_inc_fields.append(match.group(1))

        for field_name in auto_inc_fields:
            # 检查这个字段是否有PRIMARY KEY
            # 方式1: 字段定义中包含PRIMARY KEY
            has_pk_in_field = bool(re.search(
                rf'`{re.escape(field_name)}`[^,]*\bPRIMARY KEY\b',
                table_def
            ))

            # 方式2: 单独的PRIMARY KEY行
            has_separate_pk = bool(re.search(
                rf'PRIMARY KEY \(`{re.escape(field_name)}`\)',
                table_def
            ))

            if not has_pk_in_field and not has_separate_pk:
                errors.append(
                    f"❌ 表 {table_name}: 字段 `{field_name}` 是AUTO_INCREMENT但没有PRIMARY KEY"
                )
            else:
                print(f"✅ {table_name}: 字段 `{field_name}` AUTO_INCREMENT + PRIMARY KEY 正确")

        # 如果没有AUTO_INCREMENT，检查是否有主键
        if not auto_inc_fields:
            has_pk = 'PRIMARY KEY' in table_def
            if has_pk:
                print(f"✅ {table_name}: 有主键定义（非自增表）")
            else:
                # 可能是关联表
                if 'user_id INT PRIMARY KEY' in table_def or 'user_id` INT PRIMARY KEY' in table_def:
                    print(f"✅ {table_name}: 关联表，使用关联字段作为主键")
                else:
                    warnings.append(f"⚠️  {table_name}: 无主键定义")

    # 输出结果
    print("\n" + "=" * 80)
    if errors:
        print("❌ 发现错误（必须修复）:")
        for error in errors:
            print(error)
        return False

    if warnings:
        print("⚠️  警告:")
        for warning in warnings:
            print(warning)

    print("✅ 所有表结构验证通过！")
    print("=" * 80)
    return True

if __name__ == '__main__':
    filepath = 'mht_edu_complete.sql'
    if len(sys.argv) > 1:
        filepath = sys.argv[1]

    success = validate_sql_file(filepath)
    sys.exit(0 if success else 1)
