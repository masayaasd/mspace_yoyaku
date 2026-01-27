import { useState, useEffect } from "react";
import { Card, Badge } from "../components/UI";
import { BarChart, Activity, Database, TrendingUp, Users, Calendar } from "lucide-react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "";

// Simple CSS Bar Chart Component since we might not have a heavy charting lib
const SimpleBarChart = ({ data, color = "bg-blue-500", labelKey = "label", valueKey = "value", height = 150 }: any) => {
    const max = Math.max(...data.map((d: any) => d[valueKey]));
    return (
        <div className="flex items-end gap-2 h-full" style={{ height: `${height}px` }}>
            {data.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                        className={`w-full ${color} rounded-t-sm opacity-80 group-hover:opacity-100 transition-all relative`}
                        style={{ height: `${(d[valueKey] / max) * 100}%` }}
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {d[valueKey]}
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate w-full text-center">{d[labelKey]}</span>
                </div>
            ))}
        </div>
    );
};

// Heatmap Cell
const HeatmapCell = ({ value, max }: any) => {
    const intensity = value / max;
    let bg = "bg-slate-50";
    if (intensity > 0) bg = "bg-blue-50";
    if (intensity > 0.3) bg = "bg-blue-100";
    if (intensity > 0.6) bg = "bg-blue-300";
    if (intensity > 0.8) bg = "bg-blue-500 text-white";

    return (
        <div className={`flex-1 h-full flex items-center justify-center text-xs ${bg} rounded-sm transition-colors cursor-default`} title={`Value: ${value}`}>
            {value > 0 ? value : ""}
        </div>
    );
};

export const Analysis = () => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Default: Last 30 Days
    const defaultEnd = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const defaultStart = d.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch selected range
                const startIso = new Date(startDate).toISOString();
                // Ensure end date includes the full day
                const endDateObj = new Date(endDate);
                endDateObj.setDate(endDateObj.getDate() + 1);

                const [rReq, tReq] = await Promise.all([
                    axios.get(`${apiBase}/api/reservations?start=${startIso}&end=${endDateObj.toISOString()}`),
                    axios.get(`${apiBase}/api/tables`)
                ]);

                setReservations(rReq.data);
                setTables(tReq.data);
            } catch (e) {
                console.error("Failed to fetch analysis data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate]);

    if (loading && tables.length === 0) return <div className="p-8 text-center text-slate-400">Loading Database...</div>;

    // --- Metrics Calculation ---

    // 1. Total Reservations (Last 30 days) - EXCLUDING Walk-ins for Guest Counts if we were summing them, but user said "Guest Count not needed for Walk-ins".
    // We will confirm "Booking Count" vs "Walk-in Count".
    const walkInRegex = /飛入|Walk-in/i;
    const standardReservations = reservations.filter(r => !walkInRegex.test(r.customerName) && r.status !== 'CANCELLED');
    const walkInReservations = reservations.filter(r => walkInRegex.test(r.customerName) && r.status !== 'CANCELLED');

    // 2. Table Popularity
    const tableUsage: any = {};
    reservations.filter(r => r.status !== 'CANCELLED').forEach(r => {
        const tName = r.table?.name || `T${r.tableId}`;
        tableUsage[tName] = (tableUsage[tName] || 0) + 1;
    });
    const tableData = Object.entries(tableUsage)
        .map(([k, v]) => ({ label: k, value: v }))
        .sort((a: any, b: any) => b.value - a.value);

    // 3. Hourly Heatmap (Aggregated by hour of day)
    const hourlyData = Array(24).fill(0);
    reservations.filter(r => r.status !== 'CANCELLED').forEach(r => {
        const startH = new Date(r.startTime).getHours();
        const endH = new Date(r.endTime).getHours();
        // Simple increment for start hour, or strictly duration? Let's do duration overlap
        // Loop from startH to endH-1
        let h = startH;
        let finalH = endH === 0 ? 24 : endH; // Handle midnight
        if (finalH < h) finalH += 24;

        for (let i = h; i < finalH; i++) {
            const hourIndex = i % 24;
            hourlyData[hourIndex]++;
        }
    });

    // 4. Daily Trend (Last 7 days relative to Selection or Today?)
    // Let's make it reflect the end of the selection window.
    const dailyTrend = Array(7).fill(0).map((_, i) => {
        const d = new Date(endDate);
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayRes = reservations.filter(r => r.startTime.startsWith(dateStr) && r.status !== 'CANCELLED');
        return {
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            value: dayRes.length,
            walkIns: dayRes.filter(r => walkInRegex.test(r.customerName)).length
        };
    });

    // Calculate total days in range for averages
    const dayDiff = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Database className="text-blue-600" />
                        Store Database
                    </h1>
                    <p className="text-slate-500">店舗データの分析と統計</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-none outline-none text-slate-600 font-medium cursor-pointer"
                    />
                    <span className="text-slate-400">→</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-none outline-none text-slate-600 font-medium cursor-pointer"
                    />
                </div>
            </div>

            {loading && <div className="text-center text-blue-500 text-sm">Updating metrics...</div>}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-sm shadow-blue-100 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">総予約数 (Bookings)</p>
                            <h3 className="text-2xl font-bold text-slate-800">{standardReservations.length} <span className="text-sm font-normal text-slate-400">件</span></h3>
                        </div>
                    </div>
                </Card>

                <Card className="border-0 shadow-sm shadow-emerald-100 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">飛入来店 (Walk-ins)</p>
                            <h3 className="text-2xl font-bold text-slate-800">{walkInReservations.length} <span className="text-sm font-normal text-slate-400">件</span></h3>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400 pl-14">
                        ※ 客数はカウントしていません
                    </div>
                </Card>

                <Card className="border-0 shadow-sm shadow-purple-100 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">稼働率 (Est. Utilization)</p>
                            <h3 className="text-2xl font-bold text-slate-800">
                                {tables.length > 0 ? Math.round((hourlyData.reduce((a, b) => a + b, 0) / (dayDiff * 6 * tables.length)) * 100) : 0}%
                            </h3>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400 pl-14">
                        ※ 18:00-24:00 (6h) x {dayDiff}日 ベース
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hourly Heatmap */}
                <Card className="border-0 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-slate-400" />
                        時間帯別 稼働状況 (Hourly Heatmap)
                    </h3>
                    <div className="h-40 flex items-end gap-1">
                        {hourlyData.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                <div className="w-full h-full flex items-end bg-slate-50 rounded-sm relative">
                                    <div
                                        className="w-full bg-indigo-500 rounded-sm opacity-80 group-hover:opacity-100 transition-all"
                                        style={{ height: `${(val / Math.max(...hourlyData)) * 100}%` }}
                                    />
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        {val}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400">{i}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-center text-xs text-slate-400">
                        0時〜23時の総稼働テーブル数
                    </div>
                </Card>

                {/* Table Popularity */}
                <Card className="border-0 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Database size={18} className="text-slate-400" />
                        テーブル利用ランキング (Overview)
                    </h3>
                    <div className="h-40">
                        <SimpleBarChart data={tableData.slice(0, 8)} color="bg-cyan-500" />
                    </div>
                </Card>
            </div>

            {/* Weekly Trend Table/Chart */}
            <Card className="border-0 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">週間トレンド (Last 7 Days)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Total Reservations</th>
                                <th className="px-6 py-3">Bookings</th>
                                <th className="px-6 py-3">Walk-ins</th>
                                <th className="px-6 py-3">Activity Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyTrend.slice().reverse().map((d, i) => (
                                <tr key={i} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold">{d.label}</td>
                                    <td className="px-6 py-4">{d.value}</td>
                                    <td className="px-6 py-4 text-blue-600">{d.value - d.walkIns}</td>
                                    <td className="px-6 py-4 text-emerald-600">{d.walkIns}</td>
                                    <td className="px-6 py-4">
                                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500"
                                                style={{ width: `${(d.value / Math.max(...dailyTrend.map(t => t.value), 1)) * 100}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
