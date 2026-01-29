import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, Table as TableIcon, Settings, MessageSquare, LogOut, Menu, Users, Database, X } from "lucide-react";
import { useState, useEffect } from "react";

const NavItem = ({ icon, label, path, active, onClick }: any) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => { navigate(path); onClick?.(); }}
            className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors mb-2
        ${active ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            style={active ? { backgroundColor: 'var(--brand-light)', color: 'var(--brand-primary)' } : {}}
        >
            {icon}
            <span className="text-base">{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
        </div>
    );
};

export const Layout = ({ children, onLogout, user }: any) => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setSidebarOpen(true);
            else setSidebarOpen(false);
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        { icon: <LayoutDashboard size={18} />, label: "ダッシュボード", path: "/" },
        { icon: <Calendar size={18} />, label: "予約管理", path: "/reservations" },
        { icon: <Database size={18} />, label: "データベース", path: "/analysis" },
        { icon: <TableIcon size={18} />, label: "テーブル", path: "/tables" },
        { icon: <Users size={18} />, label: "顧客", path: "/customers" },
        { icon: <MessageSquare size={18} />, label: "通知設定", path: "/templates" },
        { icon: <Settings size={18} />, label: "アクセストークン", path: "/settings" },
    ];

    const closeSidebarOnMobile = () => {
        if (isMobile) setSidebarOpen(false);
    };

    return (
        <div className="flex min-h-screen bg-gray">
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${!isMobile ? 'md:translate-x-0 md:shadow-sm' : ''}`}
            >
                <div className="flex items-center justify-between h-16 border-b px-6">
                    <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span style={{ color: 'var(--brand-primary)' }}>●</span> LINE Yoyaku
                    </h1>
                    {isMobile && (
                        <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-md md:hidden">
                            <X size={20} className="text-slate-600" />
                        </button>
                    )}
                </div>

                <div className="p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Main Menu</div>
                    <nav>
                        {menuItems.map((item) => (
                            <NavItem
                                key={item.path}
                                {...item}
                                active={location.pathname === item.path}
                                onClick={closeSidebarOnMobile}
                            />
                        ))}
                    </nav>
                </div>

                <div className="absolute bottom-0 w-full p-4 border-t bg-slate-50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {user?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-900">{user?.username || 'Admin'}</div>
                            <div className="text-xs text-slate-500">Administrator</div>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div
                className="flex-1 flex flex-col min-h-screen transition-all duration-300"
                style={{ marginLeft: isMobile ? '0' : (sidebarOpen ? '16rem' : '0') }}
            >
                <header className="h-16 bg-white border-b shadow-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-md">
                        <Menu size={20} className="text-slate-600" />
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 hidden sm:block">
                            {new Date().toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <span className="text-sm text-slate-500 sm:hidden">
                            {new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
