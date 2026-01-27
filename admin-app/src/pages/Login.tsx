import { useState } from "react";
import { Button, Input, Card } from "../components/UI";
import axios from "axios";

const apiBase = window.__ENV__?.VITE_API_BASE || import.meta.env.VITE_API_BASE || "";

export const Login = ({ onLoginSuccess }: any) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const form = e.target as HTMLFormElement;
        const username = (form.elements.namedItem("username") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        try {
            const { data } = await axios.post(`${apiBase}/api/login`, { username, password });
            onLoginSuccess(data.token, data.user);
        } catch (err: any) {
            setError(err.response?.data?.error || "ログインに失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">LINE Yoyaku Admin</h1>
                    <p className="text-muted text-sm">管理画面へサインインしてください</p>
                </div>
                <Card className="bg-white shadow-lg border-0">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100 flex items-center gap-2">
                                ⚠️ {error}
                            </div>
                        )}
                        <Input name="username" label="ユーザーID" placeholder="admin" required />
                        <Input name="password" label="パスワード" type="password" placeholder="••••••••" required />
                        <Button type="submit" loading={loading} className="w-full mt-2">
                            サインイン
                        </Button>
                    </form>
                </Card>
                <div className="text-center mt-6 text-xs text-muted">
                    &copy; 2026 LINE Yoyaku System
                </div>
            </div>
        </div>
    );
};
