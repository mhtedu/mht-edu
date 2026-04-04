# SSH 密钥配置说明

## 问题
您提供的私钥无法连接服务器，这是因为服务器上没有配置对应的公钥。

## 解决方案

### 方法1：将公钥添加到服务器（推荐）

1. 获取公钥内容（已生成）：
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDmG1BbPNWbnabH+9LXt6R8Icv5cF7Y8gqfhw63lHiJsyqF3AwK1Tf5jIEYncYxUsdC33EnoERpsjWTlDf3X1aV6YnZg2Usj6TRFvx2+9C0GGb1UxgZf9OwEfUOp47hkOQo1JHdd0dXJkHE6hJ5Zu5pX33qiKuLHpczUw103yKUjsA+UuancVTfTCPZBYIhINOhN3BDMFiIRgq7Ex5FyAD7gOwAa/1DzUd6scW7syLeGTJlXPWTUv2QjaqZ5dRo871M1zo6LwOH9gHCkk3uVUgfrVxfgy/lo566GJQID9ThdmoTpDdlo6WjlRls6x/B0zzIcIlE4McxcAtZgZFlPbtB
```

2. 登录宝塔面板 → 文件 → 进入 `/root/.ssh/`

3. 编辑 `authorized_keys` 文件，将上面的公钥内容添加到文件末尾（每个公钥一行）

4. 保存后即可使用私钥连接

### 方法2：使用宝塔面板终端

1. 登录宝塔面板
2. 点击左侧菜单「终端」
3. 执行以下命令：

```bash
# 进入项目目录
cd /www/wwwroot/mht-edu

# 备份并修改配置文件
cp src/app.config.ts src/app.config.ts.backup

# 修改 TabBar 配置
sed -i "s|pagePath: 'pages/mall/index'|pagePath: 'pages/activities/index'|g" src/app.config.ts
sed -i "s|text: '商城'|text: '活动'|g" src/app.config.ts
sed -i "s|iconPath: './assets/tabbar/mall.png'|iconPath: './assets/tabbar/square.png'|g" src/app.config.ts
sed -i "s|selectedIconPath: './assets/tabbar/mall-active.png'|selectedIconPath: './assets/tabbar/square-active.png'|g" src/app.config.ts

# 重新构建
pnpm build:web
```

### 方法3：手动上传构建产物

1. 下载更新包：`deploy/packages/mht-edu-dist-web-20260404_184550.tar.gz`

2. 登录宝塔面板 → 文件 → 进入 `/www/wwwroot/mht-edu/`

3. 备份 `dist-web` 目录

4. 上传更新包并解压

5. 验证文件：
```bash
ls -la /www/wwwroot/mht-edu/dist-web/
```

## 验证

访问 https://wx.dajiaopei.com 检查底部 TabBar 是否显示「活动」而非「商城」
