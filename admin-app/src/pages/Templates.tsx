import { useState, useEffect } from "react";
import { Card, Input, Button } from "../components/UI";
import { Save } from "lucide-react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export const Templates = () => {
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get(`${apiBase}/api/templates/reminder`).then(res => setTemplate(res.data || { title: "", body: "", enabled: true }));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(`${apiBase}/api/templates/reminder`, template);
            alert("テンプレートを保存しました");
        } catch (err) {
            alert("保存に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    if (!template) return <div>Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Templates</h1>
                <p className="text-slate-500">自動通知メッセージの編集</p>
            </div>

            <form onSubmit={handleSave}>
                <Card className="border-0 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                        予約リマインダー通知
                    </h3>

                    <Input
                        label="通知タイトル (プッシュ通知用)"
                        value={template.title}
                        onChange={(e: any) => setTemplate({ ...template, title: e.target.value })}
                    />

                    <div className="flex-col flex gap-1 mb-4">
                        <label className="text-sm font-medium text-slate-500">本文</label>
                        <textarea
                            className="input-field min-h-[200px]"
                            value={template.body}
                            onChange={e => setTemplate({ ...template, body: e.target.value })}
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-6">
                        <strong>利用可能な変数:</strong><br />
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{customerName}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{startTime}}"}</code>
                        <code className="bg-white px-1 py-0.5 rounded border mr-2">{"{{tableName}}"}</code>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" loading={loading}>
                            <Save size={18} /> テンプレートを保存
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};
