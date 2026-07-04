import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AdminLayout() {
  // ✅ Fixed: initial state seedha useState mein, useEffect nahi
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);

  return (
    <div className="h-screen bg-[#f7f5f1] flex flex-col font-['Inter',sans-serif] overflow-hidden">
      <Header
        sidebarCollapsed={collapsed}
        onToggleSidebar={() => setCollapsed((v) => !v)}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar collapsed={collapsed} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}