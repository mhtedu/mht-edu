#!/usr/bin/env node

/**
 * 微信小程序 CI 上传脚本（使用全局安装的 miniprogram-ci）
 * 
 * 解决 miniprogram-ci 版本兼容性问题
 * 使用全局安装的 miniprogram-ci 避免与项目依赖冲突
 */

const GLOBAL_NODE_MODULES = '/www/server/nvm/versions/node/v20.18.0/lib/node_modules'
const ci = require(`${GLOBAL_NODE_MODULES}/miniprogram-ci`)
const path = require('path')
const fs = require('fs')

const args = process.argv.slice(2)
const versionIndex = args.indexOf('-v')
const descIndex = args.indexOf('-d')
const previewMode = args.includes('--preview')

let version = '1.0.0405'
let desc = '自动构建 - ' + new Date().toLocaleString('zh-CN')

if (versionIndex > -1 && args[versionIndex + 1]) {
  version = args[versionIndex + 1]
}
if (descIndex > -1 && args[descIndex + 1]) {
  desc = args[descIndex + 1]
}

const config = {
  appid: 'wxf4539389d0d8d687',
  projectPath: path.resolve(__dirname, '../dist-weapp'),
  privateKeyPath: path.resolve(__dirname, './private.wxkey'),
  version,
  desc,
}

async function preview() {
  console.log('🔄 生成预览二维码...')
  
  const project = new ci.Project({
    appid: config.appid,
    type: 'miniProgram',
    projectPath: config.projectPath,
    privateKeyPath: config.privateKeyPath,
    ignores: ['node_modules/**/*'],
  })
  
  try {
    await ci.preview({
      project,
      desc: config.desc,
      setting: { es6: true, es7: true, minify: true },
      qrcodeFormat: 'terminal',
      onProgressUpdate: () => {},
    })
    console.log('✅ 预览二维码已生成！')
  } catch (error) {
    console.error('❌ 生成预览失败:', error.message)
    process.exit(1)
  }
}

async function upload() {
  console.log('🚀 开始上传...')
  console.log('版本:', config.version)
  console.log('描述:', config.desc)
  
  const project = new ci.Project({
    appid: config.appid,
    type: 'miniProgram',
    projectPath: config.projectPath,
    privateKeyPath: config.privateKeyPath,
    ignores: ['node_modules/**/*'],
  })
  
  try {
    await ci.upload({
      project,
      version: config.version,
      desc: config.desc,
      setting: { es6: true, es7: true, minify: true },
      onProgressUpdate: () => {},
    })
    console.log('✅ 上传成功！')
    console.log('📱 请在微信公众平台查看: https://mp.weixin.qq.com')
  } catch (error) {
    console.error('❌ 上传失败:', error.message)
    process.exit(1)
  }
}

if (previewMode) {
  preview()
} else {
  upload()
}
