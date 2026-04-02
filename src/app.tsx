import { PropsWithChildren, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { LucideTaroProvider } from 'lucide-react-taro';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { useConfigStore } from '@/stores/config';
import { Preset } from './presets';

const App = ({ children }: PropsWithChildren) => {
  const { loadSiteConfig, loaded, getSiteName } = useConfigStore();

  // 应用启动时加载站点配置
  useEffect(() => {
    if (!loaded) {
      loadSiteConfig();
    }
  }, [loaded, loadSiteConfig]);

  // H5端动态设置页面标题
  useEffect(() => {
    if (loaded) {
      const siteName = getSiteName();
      if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
        document.title = siteName;
      }
    }
  }, [loaded, getSiteName]);

  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  );
};

export default App;
