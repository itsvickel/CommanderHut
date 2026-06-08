import { ReactNode } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">
    <TopBar />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  </div>
);

export default AppLayout;
