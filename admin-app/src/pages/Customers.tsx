
import { useState, useEffect } from "react";
import { Card, Badge, Input } from "../components/UI";
import { Users, Search, Phone, Calendar } from "lucide-react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "";

export const Customers = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // Since we don't have a dedicated /api/customers endpoint in the mocked backend yet,
            // we will derive customers from unique reservations for now, or assume an endpoint exists.
            // Let's assume we can get reservations and aggregate them on the client side for this phase
            // as "Guest Management" often starts with "people who have reserved".
            // A real system would have a dedicated Users table.

            // Fetch all reservations (mocking a "get all" or reasonably large range)
            // Realistically we'd ask the backend for "unique customers".
            // Let's try to hit /api/reservations?limit=1000 or similar if supported, 
            // or just use a wide date range for demo.
            const start = new Date(2023, 0, 1).toISOString();
            const end = new Date(2026, 11, 31).toISOString();
            const { data } = await axios.get(`${apiBase}/api/reservations?start=${start}&end=${end}`);

            // Aggregate by phone number (or name if phone is missing)
            const map = new Map();
            data.forEach((r: any) => {
                const key = r.customerPhone || r.customerName;
                if (!map.has(key)) {
                    map.set(key, {
                        name: r.customerName,
                        phone: r.customerPhone,
                        visitCount: 0,
                        lastVisit: null,
                        totalSpent: 0 // Mock field
                    });
                }
                const c = map.get(key);
                c.visitCount++;
                if (!c.lastVisit || new Date(r.startTime) > new Date(c.lastVisit)) {
                    c.lastVisit = r.startTime;
                }
            });

            setCustomers(Array.from(map.values()));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search))
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-blue-500" />
                        顧客リスト
                    </h1>
                    <p className="text-slate-500">過去の予約履歴から生成された顧客台帳です</p>
                </div>
                <div className="w-64">
                    <Input
                        placeholder="名前・電話番号で検索..."
                        icon={<Search size={16} />}
                        value={search}
                        onChange={(e: any) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-0 shadow-sm p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-slate-500 text-sm">顧客名</th>
                            <th className="p-4 font-medium text-slate-500 text-sm">電話番号</th>
                            <th className="p-4 font-medium text-slate-500 text-sm">来店回数</th>
                            <th className="p-4 font-medium text-slate-500 text-sm">最終来店日</th>
                            <th className="p-4 font-medium text-slate-500 text-sm">ステータス</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.map((c, i) => (
                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 font-bold text-slate-700">{c.name} 様</td>
                                <td className="p-4 text-slate-600 flex items-center gap-2">
                                    <Phone size={14} className="text-slate-300" />
                                    {c.phone || "未登録"}
                                </td>
                                <td className="p-4">
                                    <Badge color="blue">{c.visitCount}回</Badge>
                                </td>
                                <td className="p-4 text-slate-600 text-sm">
                                    {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "-"}
                                </td>
                                <td className="p-4">
                                    {c.visitCount > 5 ? (
                                        <Badge color="orange">常連 (VIP)</Badge>
                                    ) : c.visitCount > 1 ? (
                                        <Badge color="green">リピーター</Badge>
                                    ) : (
                                        <Badge color="gray">新規</Badge>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                    該当する顧客は見つかりませんでした
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};
