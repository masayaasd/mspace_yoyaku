import { useState, useEffect } from "react";
import { Card, Input, Button } from "../components/UI";
import { Save, AlertCircle, Copy } from "lucide-react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export const LineSettings = () => {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get(`${apiBase}/api/settings`).then(res => setSettings(res.data));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(`${apiBase}/api/settings`, settings);
            alert("設定を保存しました");
        } catch (err) {
            alert("保存に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">LINE Settings</h1>
                <p className="text-slate-500">Messaging APIおよびログインチャネルの設定</p>
            </div>

            <form onSubmit={handleSave}>
                <Card className="mb-6 border-0 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                        <AlertCircle size={20} />
                        <div>
                            これらの設定は LINE Developers コンソールから取得してください。<br />
                            変更後はバックエンドの再起動が必要な場合があります。
                        </div>
                    </div>

                    <h3 className="text-lg font-bold mb-4 border-b pb-2">Messaging API (Bot)</h3>
                    <div className="space-y-4 mb-8">
                        <Input
                            label="Channel Secret"
                            type="password"
                            value={settings.LINE_CHANNEL_SECRET || ""}
                            onChange={(e: any) => setSettings({ ...settings, LINE_CHANNEL_SECRET: e.target.value })}
                        />
                        <div className="flex-col flex gap-1 mb-4">
                            <label className="text-sm font-medium text-slate-500">Channel Access Token</label>
                            <textarea
                                className="input-field min-h-[100px] font-mono text-xs"
                                value={settings.LINE_CHANNEL_ACCESS_TOKEN || ""}
                                onChange={(e) => setSettings({ ...settings, LINE_CHANNEL_ACCESS_TOKEN: e.target.value })}
                            />
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Webhook URL (LINE Developersに設定してください)</label>
                            <div className="flex gap-2 mt-1">
                                <code className="flex-1 bg-white border border-slate-200 p-2 rounded text-xs select-all text-blue-600 font-mono">
                                    {`${window.location.origin.replace('5173', '3000')}/api/line/webhook`}
                                </code>
                                <Button
                                    variant="secondary"
                                    className="h-auto py-2 px-3"
                                    onClick={(e: any) => {
                                        e.preventDefault();
                                        navigator.clipboard.writeText(`${window.location.origin.replace('5173', '3000')}/api/line/webhook`);
                                    }}
                                >
                                    <Copy size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold mb-4 border-b pb-2">LINE Login</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Channel ID"
                            value={settings.LINE_LOGIN_CHANNEL_ID || ""}
                            onChange={(e: any) => setSettings({ ...settings, LINE_LOGIN_CHANNEL_ID: e.target.value })}
                        />
                        <Input
                            label="Channel Secret"
                            type="password"
                            value={settings.LINE_LOGIN_CHANNEL_SECRET || ""}
                            onChange={(e: any) => setSettings({ ...settings, LINE_LOGIN_CHANNEL_SECRET: e.target.value })}
                        />
                    </div>

                    <h3 className="text-lg font-bold mt-8 mb-4 border-b pb-2">LIFF (Customer App)</h3>
                    <div className="space-y-6">
                        <Input
                            label="LIFF ID"
                            placeholder="2008272520-YekBxV2k"
                            value={settings.LINE_LIFF_ID || ""}
                            onChange={(e: any) => setSettings({ ...settings, LINE_LIFF_ID: e.target.value })}
                        />

                        {settings.LINE_LIFF_ID && (
                            <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 mb-2">LINEリッチメニュー設定用URL</h4>
                                <p className="text-xs text-slate-500">LINE Official Account Managerのリッチメニュー設定で以下を指定してください:</p>

                                <div className="space-y-3">
                                    {[
                                        { label: "フロアマップ (マップから予約)", path: "" },
                                        { label: "新規予約 flow", path: "/new" },
                                        { label: "予約確認 (マイページ)", path: "/my" }
                                    ].map((item) => {
                                        const url = `https://liff.line.me/${settings.LINE_LIFF_ID}${item.path}`;
                                        return (
                                            <div key={item.path} className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</label>
                                                <div className="flex gap-2">
                                                    <code className="flex-1 bg-white border border-slate-200 p-2 rounded text-xs select-all text-blue-600 font-mono">
                                                        {url}
                                                    </code>
                                                    <Button
                                                        variant="secondary"
                                                        className="h-auto py-2 px-3"
                                                        onClick={(e: any) => {
                                                            e.preventDefault();
                                                            navigator.clipboard.writeText(url);
                                                        }}
                                                    >
                                                        <Copy size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" loading={loading} className="px-8">
                        <Save size={18} /> 設定を保存
                    </Button>
                </div>
            </form>
        </div>
    );
};
