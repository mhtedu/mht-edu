/**
 * H5 端特殊样式注入
 * 如无必要，请勿修改本文件
 */

import { IS_H5_ENV } from './env';

const H5_BASE_STYLES = `
/* H5 端隐藏 TabBar 空图标（只隐藏没有 src 的图标） */
.weui-tabbar__icon:not([src]),
.weui-tabbar__icon[src=''] {
  display: none !important;
}

.weui-tabbar__item:has(.weui-tabbar__icon:not([src])) .weui-tabbar__label,
.weui-tabbar__item:has(.weui-tabbar__icon[src='']) .weui-tabbar__label {
  margin-top: 0 !important;
}

/* Vite 错误覆盖层无法选择文本的问题 */
vite-error-overlay {
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-user-select: text !important;
}

vite-error-overlay::part(window) {
  max-width: 90vw;
  padding: 10px;
}

.taro_page {
  overflow: auto;
}

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* H5 导航栏页面自动添加顶部间距 */
body.h5-navbar-visible .taro_page {
  padding-top: 44px;
}

body.h5-navbar-visible .toaster[data-position^="top"] {
  top: 44px !important;
}

/* Sheet 组件在 H5 导航栏下的位置修正 */
body.h5-navbar-visible .sheet-content:not([data-side="bottom"]) {
    top: 44px !important;
}

/*
 * H5 端 rem 适配：与小程序 rpx 缩放一致
 * 375px 屏幕：1rem = 16px，小程序 32rpx = 16px
 */
html {
    font-size: 4vw !important;
}

/* H5 端组件默认样式修复 */
taro-view-core {
    display: block;
}

taro-text-core {
    display: inline;
}

taro-input-core {
    display: block;
    width: 100%;
}

taro-input-core input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
}

taro-input-core.taro-otp-hidden-input input {
    color: transparent;
    caret-color: transparent;
    -webkit-text-fill-color: transparent;
}

/* 全局按钮样式重置 */
taro-button-core,
button {
    margin: 0 !important;
    padding: 0 !important;
    line-height: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
}

taro-button-core::after,
button::after {
    border: none;
}

taro-textarea-core > textarea,
.taro-textarea,
textarea.taro-textarea {
    resize: none !important;
}
`;

const PC_WIDESCREEN_STYLES = `
/* PC 宽屏适配 - 基础布局 */
/* 通过 JS 检测触摸设备，只在非触摸设备（PC）上应用 */
body.is-pc-device {
  background-color: #f3f4f6 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  min-height: 100vh !important;
}

body.is-pc-device html,
body.is-pc-device {
  font-size: 15px !important;
}
`;

const PC_WIDESCREEN_PHONE_FRAME = `
/* PC 宽屏适配 - 手机框样式（有 TabBar 页面） */
/* 通过 JS 检测触摸设备，只在非触摸设备（PC）上应用 */
body.is-pc-device .taro-tabbar__container {
  width: 375px !important;
  max-width: 375px !important;
  height: calc(100vh - 40px) !important;
  max-height: 900px !important;
  background-color: #fff !important;
  transform: translateX(0) !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
  border-radius: 20px !important;
  overflow: hidden !important;
  position: relative !important;
}

body.is-pc-device .taro-tabbar__panel {
  height: 100% !important;
  overflow: auto !important;
}

/* PC 宽屏适配 - Toast 定位到手机框范围内 */
body.is-pc-device .toaster {
  left: 50% !important;
  right: auto !important;
  width: 375px !important;
  max-width: 375px !important;
  transform: translateX(-50%) !important;
  box-sizing: border-box !important;
}

/* PC 宽屏适配 - 手机框样式（无 TabBar 页面） */
body.is-pc-device.no-tabbar #app {
  width: 375px !important;
  max-width: 375px !important;
  height: calc(100vh - 40px) !important;
  max-height: 900px !important;
  background-color: #fff !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
  border-radius: 20px !important;
  overflow: hidden !important;
  position: relative !important;
  transform: translateX(0) !important;
}

body.is-pc-device.no-tabbar #app .taro_router {
  height: 100% !important;
  overflow: auto !important;
}
`;

function injectStyles() {
  const style = document.createElement('style');
  style.innerHTML =
    H5_BASE_STYLES + PC_WIDESCREEN_STYLES + PC_WIDESCREEN_PHONE_FRAME;
  document.head.appendChild(style);
}

/**
 * 检测是否为真正的 PC 设备（非触摸设备）
 * 使用多种方式综合判断，避免误判
 */
function isPCDevice(): boolean {
  // 如果有触摸点，肯定是触摸设备
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    return false;
  }

  // 检测屏幕宽度，移动设备通常宽度较小
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const minDimension = Math.min(screenWidth, screenHeight);

  // 如果最小尺寸小于 768px，很可能是移动设备
  if (minDimension < 768) {
    return false;
  }

  // 检测 User Agent 中的移动设备标识
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipad', 'ipod',
    'blackberry', 'windows phone', 'webos', 'opera mini'
  ];

  for (const keyword of mobileKeywords) {
    if (userAgent.includes(keyword)) {
      return false;
    }
  }

  // 检测是否支持精确指针（鼠标）
  // 但需要结合触摸点检测，因为一些支持触控笔的设备也可能报告支持
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const hasHover = window.matchMedia('(hover: hover)').matches;

  // 只有在没有触摸点、支持精确指针、支持悬停的情况下才认为是 PC
  return hasFinePointer && hasHover;
}

function setupTabbarDetection() {
  const checkTabbar = () => {
    const hasTabbar = !!document.querySelector('.taro-tabbar__container');
    document.body.classList.toggle('no-tabbar', !hasTabbar);
  };

  checkTabbar();

  const observer = new MutationObserver(checkTabbar);
  observer.observe(document.body, { childList: true, subtree: true });
}

function setupDeviceDetection() {
  const checkDevice = () => {
    const isPC = isPCDevice();
    document.body.classList.toggle('is-pc-device', isPC);
  };

  checkDevice();

  // 监听窗口大小变化（如旋转屏幕）
  window.addEventListener('resize', checkDevice);
}

export function injectH5Styles() {
  if (!IS_H5_ENV) return;

  injectStyles();
  setupTabbarDetection();
  setupDeviceDetection();
}
