
import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutGrid, PlusCircle, UserCircle } from "lucide-react";
import { useLIFF } from "../providers/LIFFProvider";

export const Layout: React.FC = () => {
    const location = useLocation();
    const { error } = useLIFF();

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 px-6 text-center">
                <div className="space-y-3">
                    <p className="text-lg font-bold text-slate-800">初期化に失敗しました</p>
                    <p className="text-sm text-slate-500">{error}</p>
                    <p className="text-xs text-slate-400">VITE_LIFF_ID などの環境変数をご確認ください。</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { path: "/", label: "マップ", icon: LayoutGrid },
        { path: "/new", label: "新規予約", icon: PlusCircle },
        { path: "/my", label: "予約確認", icon: UserCircle },
    ];

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative">
            {/* Header */}
            <header className="h-14 bg-white border-b flex items-center px-6 sticky top-0 z-40">
                <h1 className="font-black text-xl text-slate-800 tracking-tight">
                    POKER <span className="text-blue-600">RESERVE</span>
                </h1>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto pb-20 p-4">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t flex items-center justify-around safe-bottom z-40 max-w-md mx-auto">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-blue-600" : "text-slate-400"
                                }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};
