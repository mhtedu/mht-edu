import { PropsWithChildren, useEffect } from 'react';
import { LucideTaroProvider } from 'lucide-react-taro';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { Preset } from './presets';
import { useSiteConfig } from '@/store';

const App = ({ children }: PropsWithChildren) => {
  const loadConfig = useSiteConfig(state => state.loadConfig);

  useEffect(() => {
    // 应用启动时加载站点配置
    loadConfig();
  }, [loadConfig]);

  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  );
};

export default App;
