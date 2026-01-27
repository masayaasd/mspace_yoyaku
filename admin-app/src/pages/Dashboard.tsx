import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/UI";
import { Users, Calendar, CheckCircle, TrendingUp } from "lucide-react";
import { FloorMap } from "../components/Calendar/FloorMap";
import { TimelineModal } from "../components/Calendar/TimelineModal";
import { TimelineBoard } from "../components/Calendar/TimelineBoard";
import { ReservationActionModal } from "../components/Calendar/ReservationActionModal";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "";

const StatCard = ({ title, value, icon, trend, color = "blue" }: any) => {
    const bgColors: any = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
        orange: "bg-orange-50 text-orange-600"
    };

    return (
        <Card className="flex flex-col border-0 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div className={`p-3 rounded-lg ${bgColors[color]}`}>
                    {icon}
                </div>
                {trend && (
                    <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <TrendingUp size={12} className="mr-1" /> {trend}
                    </span>
                )}
            </div>
            <div className="mt-2">
                <h4 className="text-sm font-medium text-slate-500">{title}</h4>
                <div className="text-2xl font-bold mt-1 text-slate-800">{value}</div>
            </div>
        </Card>
    );
};

export const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [tables, setTables] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [selectedTable, setSelectedTable] = useState<any>(null);
    const [selectedReservation, setSelectedReservation] = useState<any>(null);

    const fetchAll = async () => {
        const [s, t, r] = await Promise.all([
            axios.get(`${apiBase}/api/dashboard`),
            axios.get(`${apiBase}/api/tables`),
            axios.get(`${apiBase}/api/reservations?start=${new Date().toISOString().split('T')[0]}&end=${new Date(Date.now() + 86400000).toISOString().split('T')[0]}`)
        ]);
        setStats(s.data);
        setTables(t.data);
        setReservations(r.data);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    if (!stats) return <div className="p-10 text-center text-slate-400">Loading stats...</div>;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500">本日の予約状況とステータスの概要です</p>
                </div>
                <div className="mb-2">
                    <Link to="/reservations/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm inline-flex items-center">
                        ＋ 新規予約
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="本日の予約"
                    value={stats.todayReservations}
                    icon={<Calendar size={20} />}
                    color="blue"
                    trend="+12% vs昨日"
                />
                <StatCard
                    title="今月の累計"
                    value={stats.totalReservations}
                    icon={<CheckCircle size={20} />}
                    color="purple"
                />
                <StatCard
                    title="只今の空数"
                    value={`${tables.filter(t => {
                        const now = new Date();
                        const isOccupied = reservations.some((r: any) => {
                            if (r.tableId !== t.id) return false;
                            if (r.status === 'CANCELLED') return false;
                            const start = new Date(r.startTime);
                            const end = new Date(r.endTime);
                            return now >= start && now < end;
                        });
                        return !isOccupied;
                    }).length}卓`}
                    icon={<Users size={20} />}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Floor Map Section */}
                    <Card className="border-0 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">フロア予約状況 (マップ)</h3>
                        </div>

                        <FloorMap
                            tables={tables}
                            reservations={reservations}
                            compact={true}
                            tableStatus={tables.reduce((acc: any, t: any) => {
                                const now = new Date();
                                const isOccupied = reservations.some((r: any) => {
                                    if (r.tableId !== t.id) return false;
                                    const start = new Date(r.startTime);
                                    const end = new Date(r.endTime);
                                    return now >= start && now < end && r.status !== 'CANCELLED';
                                });
                                acc[t.id] = isOccupied ? 'occupied' : 'available';
                                return acc;
                            }, {})}
                            onTableClick={(t: any) => setSelectedTable(t)}
                        />
                    </Card>

                    {/* Timeline Section */}
                    <Card className="border-0 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">予約タイムライン (24H)</h3>
                        </div>
                        <div className="overflow-hidden">
                            <TimelineBoard
                                tables={tables}
                                reservations={reservations}
                                onReservationClick={(r: any) => setSelectedReservation(r)}
                            />
                        </div>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <h3 className="text-lg font-bold mb-4">週間予約推移</h3>
                        <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                            Chart Graph Placeholder
                        </div>
                    </Card>
                </div>
                <Card className="border-0 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">最近のアクティビティ</h3>
                    <div className="space-y-4">
                        {(stats.recentActivity || []).map((r: any) => {
                            const statusColors: any = {
                                'CONFIRMED': 'bg-blue-500',
                                'PENDING': 'bg-yellow-500',
                                'CANCELLED': 'bg-red-500'
                            };
                            const statusLabels: any = {
                                'CONFIRMED': '予約',
                                'PENDING': '仮予約',
                                'CANCELLED': 'キャンセル'
                            };
                            return (
                                <div key={r.id} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                                    <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${statusColors[r.status] || 'bg-gray-400'}`}></div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">
                                            <span className={r.status === 'CANCELLED' ? 'line-through text-slate-400' : ''}>{statusLabels[r.status] || r.status}: {r.customerName}様</span>
                                        </p>
                                        <div className="text-xs text-slate-500 flex flex-col">
                                            <span>{new Date(r.startTime).toLocaleDateString()} {new Date(r.startTime).getHours()}:{String(new Date(r.startTime).getMinutes()).padStart(2, '0')}〜</span>
                                            <span>{r.table?.name} ({r.partySize}名)</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                            <div className="text-sm text-slate-400 text-center py-4">まだアクティビティはありません</div>
                        )}
                    </div>
                </Card>
            </div>
            {selectedTable && (
                <TimelineModal
                    table={selectedTable}
                    reservations={reservations}
                    onClose={() => setSelectedTable(null)}
                    onReservationClick={(r: any) => {
                        setSelectedTable(null);
                        setSelectedReservation(r);
                    }}
                />
            )}
            {selectedReservation && (
                <ReservationActionModal
                    reservation={selectedReservation}
                    reservations={reservations}
                    onClose={() => setSelectedReservation(null)}
                    onUpdate={fetchAll}
                />
            )}
        </div >
    );
};
