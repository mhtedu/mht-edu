import { useState } from 'react'
import { Upload, Eye, Package, RefreshCw } from 'lucide-react'
import { miniprogramApi } from '../services/miniprogram'

interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error'
}

export default function MiniprogramPublish() {
  const [version, setVersion] = useState('')
  const [desc, setDesc] = useState('')
  const [uploading, setUploading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])

  // 自动生成版本号
  const autoVersion = (() => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `1.0.${month}${day}`
  })()

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('zh-CN')
    setLogs(prev => [...prev, { time, message, type }])
  }

  const handleBuild = async () => {
    setLogs([])
    addLog('开始构建小程序...', 'info')
    
    try {
      const res = await miniprogramApi.build()
      if (res.success) {
        addLog('✅ 构建成功！', 'success')
      } else {
        addLog(`❌ 构建失败: ${res.message || '未知错误'}`, 'error')
      }
    } catch (error: any) {
      addLog(`❌ 构建失败: ${error.message}`, 'error')
    }
  }

  const handleUpload = async () => {
    if (!version && !desc) {
      alert('请填写版本号或描述')
      return
    }

    setUploading(true)
    addLog('开始上传小程序...', 'info')
    
    try {
      const res = await miniprogramApi.upload({
        version: version || autoVersion,
        desc: desc || `自动构建 - ${new Date().toLocaleString('zh-CN')}`
      })
      
      if (res.success) {
        addLog('✅ 上传成功！', 'success')
        addLog(`📦 版本: ${res.version}`, 'info')
        addLog('📱 请在微信公众平台查看并提交审核', 'info')
      } else {
        addLog(`❌ 上传失败: ${res.message || '未知错误'}`, 'error')
      }
    } catch (error: any) {
      addLog(`❌ 上传失败: ${error.message}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handlePreview = async () => {
    addLog('生成预览二维码...', 'info')
    
    try {
      const res = await miniprogramApi.preview()
      if (res.success) {
        addLog('✅ 预览二维码已生成', 'success')
        if (res.qrcodeUrl) {
          addLog(`📱 二维码地址: ${res.qrcodeUrl}`, 'info')
        }
      } else {
        addLog(`❌ 生成失败: ${res.message || '未知错误'}`, 'error')
      }
    } catch (error: any) {
      addLog(`❌ 生成失败: ${error.message}`, 'error')
    }
  }

  const handleClearLogs = () => {
    setLogs([])
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">小程序发布管理</h1>

      {/* 配置状态 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">配置状态</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">AppID</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">需配置 project.config.json</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">上传密钥</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">需配置 scripts/private.wxkey</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">IP白名单</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">119.91.193.179</span>
          </div>
        </div>
      </div>

      {/* 发布操作 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">发布操作</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-600 mb-1 text-sm">版本号（留空自动生成）</label>
            <input
              type="text"
              value={version}
              placeholder={autoVersion}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 text-sm">版本描述</label>
            <input
              type="text"
              value={desc}
              placeholder="如：修复订单列表问题"
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleBuild}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Package size={18} />
            构建小程序
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {uploading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload size={18} />
                上传发布
              </>
            )}
          </button>
          <button
            onClick={handlePreview}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Eye size={18} />
            预览
          </button>
        </div>
      </div>

      {/* 操作日志 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">操作日志</h2>
          <button
            onClick={handleClearLogs}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            清空日志
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4 min-h-48 max-h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">暂无日志</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`mb-1 ${
                log.type === 'success' ? 'text-green-400' :
                log.type === 'error' ? 'text-red-400' :
                'text-gray-300'
              }`}>
                <span className="text-gray-500">[{log.time}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 配置说明 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">配置说明</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>1. 登录微信公众平台 <a href="https://mp.weixin.qq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://mp.weixin.qq.com</a></p>
          <p>2. 开发 → 开发管理 → 开发设置</p>
          <p>3. 生成上传密钥并下载，保存到服务器 <code className="bg-gray-100 px-1 rounded">scripts/private.wxkey</code></p>
          <p>4. 配置 IP 白名单：添加 <code className="bg-gray-100 px-1 rounded">119.91.193.179</code></p>
          <p>5. 在 <code className="bg-gray-100 px-1 rounded">project.config.json</code> 中配置 AppID</p>
        </div>
      </div>
    </div>
  )
}
