import { PropsWithChildren, useEffect } from 'react';
import { LucideTaroProvider } from 'lucide-react-taro';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { useConfigStore } from '@/stores/config';
import { Preset } from './presets';

const App = ({ children }: PropsWithChildren) => {
  const { loadSiteConfig, loaded } = useConfigStore();

  // 应用启动时加载站点配置
  useEffect(() => {
    if (!loaded) {
      loadSiteConfig();
    }
  }, [loaded, loadSiteConfig]);

  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  );
};

export default App;
