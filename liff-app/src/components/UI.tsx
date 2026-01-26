
import React from "react";

export const Button: React.FC<any> = ({ children, variant = "primary", className = "", ...props }) => {
    const base = "w-full py-3 px-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2";
    const variants: any = {
        primary: "bg-blue-600 text-white shadow-lg shadow-blue-200 active:bg-blue-700 disabled:bg-blue-300",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        outline: "bg-transparent border-2 border-blue-600 text-blue-600",
        ghost: "bg-transparent text-slate-500",
        danger: "bg-red-50 text-red-600 border border-red-100"
    };

    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export const Card: React.FC<any> = ({ children, className = "", onClick }) => (
    <div onClick={onClick} className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ${className}`}>
        {children}
    </div>
);

export const Input: React.FC<any> = ({ label, icon, ...props }) => (
    <div className="space-y-1.5 w-full">
        {label && <label className="text-sm font-bold text-slate-600 ml-1">{label}</label>}
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
            <input
                className={`w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 ${icon ? 'pl-10' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                {...props}
            />
        </div>
    </div>
);

export const Badge: React.FC<any> = ({ children, color = "blue", className = "" }) => {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-green-50 text-green-600 border-green-100",
        red: "bg-red-50 text-red-600 border-red-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        slate: "bg-slate-50 text-slate-600 border-slate-100"
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[color]} ${className}`}>
            {children}
        </span>
    );
};
