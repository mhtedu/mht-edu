#!/usr/bin/env node

/**
 * 微信小程序 CI 上传脚本
 * 
 * 使用前准备：
 * 1. 登录微信公众平台 https://mp.weixin.qq.com
 * 2. 开发 → 开发管理 → 开发设置 → 小程序代码上传
 * 3. 生成上传密钥并下载（保存到 scripts/private.wxkey）
 * 4. 配置 IP 白名单：添加服务器 IP 119.91.193.179
 * 5. 修改 project.config.json 中的 appid
 * 
 * 使用方法：
 * pnpm run upload           # 上传并设置体验版
 * pnpm run upload:preview   # 生成预览二维码
 */

const ci = require('miniprogram-ci')
const path = require('path')
const fs = require('fs')
const readline = require('readline')

// 配置
const config = {
  appid: process.env.WX_APPID || '',  // 小程序 AppID
  projectPath: path.resolve(__dirname, '../dist-weapp'),
  privateKeyPath: path.resolve(__dirname, './private.wxkey'),
  desc: '',  // 版本描述
  version: '',  // 版本号
}

// 从命令行参数获取版本号和描述
const args = process.argv.slice(2)
const versionIndex = args.indexOf('-v')
const descIndex = args.indexOf('-d')
const previewMode = args.includes('--preview')

if (versionIndex > -1 && args[versionIndex + 1]) {
  config.version = args[versionIndex + 1]
} else {
  // 自动生成版本号：日期格式 1.0.MMDD
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  config.version = `1.0.${month}${day}`
}

if (descIndex > -1 && args[descIndex + 1]) {
  config.desc = args[descIndex + 1]
} else {
  config.desc = `自动构建 - ${new Date().toLocaleString('zh-CN')}`
}

// 检查配置
async function checkConfig() {
  console.log('📋 检查配置...\n')
  
  // 检查 AppID
  if (!config.appid) {
    // 尝试从 project.config.json 读取
    const projectConfigPath = path.join(config.projectPath, 'project.config.json')
    if (fs.existsSync(projectConfigPath)) {
      const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf-8'))
      config.appid = projectConfig.appid || projectConfig.miniprogramRoot?.appid
    }
  }
  
  if (!config.appid) {
    console.error('❌ 错误：未配置 AppID')
    console.log('\n请在以下位置之一配置 AppID：')
    console.log('1. 设置环境变量 WX_APPID')
    console.log('2. 在 project.config.json 中配置 appid')
    process.exit(1)
  }
  console.log(`✅ AppID: ${config.appid}`)
  
  // 检查私钥文件
  if (!fs.existsSync(config.privateKeyPath)) {
    console.error('\n❌ 错误：未找到上传密钥文件')
    console.log('\n请按以下步骤操作：')
    console.log('1. 登录微信公众平台 https://mp.weixin.qq.com')
    console.log('2. 开发 → 开发管理 → 开发设置 → 小程序代码上传')
    console.log('3. 生成上传密钥并下载')
    console.log('4. 将密钥文件保存到: scripts/private.wxkey')
    console.log('5. 配置 IP 白名单：添加服务器 IP 119.91.193.179')
    process.exit(1)
  }
  console.log(`✅ 密钥文件: ${config.privateKeyPath}`)
  
  // 检查构建产物
  if (!fs.existsSync(config.projectPath)) {
    console.error('\n❌ 错误：未找到构建产物')
    console.log('\n请先运行构建命令：pnpm build:weapp')
    process.exit(1)
  }
  console.log(`✅ 构建产物: ${config.projectPath}`)
  
  console.log(`✅ 版本号: ${config.version}`)
  console.log(`✅ 版本描述: ${config.desc}\n`)
}

// 上传代码
async function upload() {
  await checkConfig()
  
  console.log('🚀 开始上传...\n')
  
  const project = new ci.Project({
    appid: config.appid,
    type: 'miniProgram',
    projectPath: config.projectPath,
    privateKeyPath: config.privateKeyPath,
    ignores: ['node_modules/**/*'],
  })
  
  try {
    const uploadResult = await ci.upload({
      project,
      version: config.version,
      desc: config.desc,
      setting: {
        es6: true,
        es7: true,
        minify: true,
        codeProtect: false,
        minifyWXML: true,
        minifyWXSS: true,
        minifyJS: true,
      },
      onProgressUpdate: () => {},
    })
    
    console.log('\n✅ 上传成功！')
    console.log(`📦 版本: ${config.version}`)
    console.log(`📝 描述: ${config.desc}`)
    console.log('\n📱 请在微信公众平台查看：')
    console.log('https://mp.weixin.qq.com → 管理 → 版本管理')
    
    return uploadResult
  } catch (error) {
    console.error('\n❌ 上传失败:', error.message)
    if (error.message.includes('IP')) {
      console.log('\n⚠️  可能是 IP 白名单未配置')
      console.log('请在微信公众平台添加服务器 IP: 119.91.193.179')
    }
    process.exit(1)
  }
}

// 生成预览二维码
async function preview() {
  await checkConfig()
  
  console.log('🔄 生成预览二维码...\n')
  
  const project = new ci.Project({
    appid: config.appid,
    type: 'miniProgram',
    projectPath: config.projectPath,
    privateKeyPath: config.privateKeyPath,
    ignores: ['node_modules/**/*'],
  })
  
  try {
    const previewResult = await ci.preview({
      project,
      desc: config.desc,
      setting: {
        es6: true,
        es7: true,
        minify: true,
      },
      qrcodeFormat: 'terminal',
      onProgressUpdate: () => {},
    })
    
    console.log('\n✅ 预览二维码已生成！')
    console.log('请使用微信扫描上方二维码体验')
    
    return previewResult
  } catch (error) {
    console.error('\n❌ 生成预览失败:', error.message)
    process.exit(1)
  }
}

// 主函数
async function main() {
  console.log('═══════════════════════════════════════')
  console.log('    棉花糖教育平台 - 小程序 CI 工具')
  console.log('═══════════════════════════════════════\n')
  
  if (previewMode) {
    await preview()
  } else {
    await upload()
  }
}

main().catch(console.error)
