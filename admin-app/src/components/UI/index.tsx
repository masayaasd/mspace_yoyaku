import React from "react";

export const Card = ({ children, className = "", title, action, ...props }: any) => (
    <div className={`card ${className}`} {...props}>
        {(title || action) && (
            <div className="flex justify-between items-center mb-4">
                {title && <h3 className="text-lg font-bold">{title}</h3>}
                {action && <div>{action}</div>}
            </div>
        )}
        {children}
    </div>
);

export const Button = ({ variant = "primary", className = "", loading, children, ...props }: any) => (
    <button
        className={`btn btn-${variant} ${className}`}
        disabled={loading || props.disabled}
        {...props}
    >
        {loading && <span className="animate-spin">⌛</span>}
        {children}
    </button>
);

export const Input = ({ label, error, ...props }: any) => (
    <div className="flex-col flex gap-1 mb-4">
        {label && <label className="text-sm font-medium text-muted">{label}</label>}
        <input className="input-field" {...props} />
        {error && <span className="text-xs text-danger">{error}</span>}
    </div>
);

export const Badge = ({ color = "gray", children }: any) => {
    const styles: any = {
        green: { backgroundColor: "var(--success-bg)", color: "var(--success-text)" },
        red: { backgroundColor: "var(--danger-bg)", color: "var(--danger-text)" },
        yellow: { backgroundColor: "var(--warning-bg)", color: "var(--warning-text)" },
        gray: { backgroundColor: "#e2e8f0", color: "#64748b" },
        blue: { backgroundColor: "var(--brand-light)", color: "var(--brand-primary)" },
    };
    return <span className="badge" style={styles[color]}>{children}</span>;
};
