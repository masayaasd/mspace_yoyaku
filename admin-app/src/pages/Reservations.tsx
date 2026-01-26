import { useState, useEffect } from "react";
import { Button, Card, Badge } from "../components/UI";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { ReservationActionModal } from "../components/Calendar/ReservationActionModal";
import axios from "axios";

import { useNavigate } from "react-router-dom";

const apiBase = import.meta.env.VITE_API_BASE || "";

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];

export const Reservations = () => {
    const navigate = useNavigate();
    const [viewDate, setViewDate] = useState(new Date());
    const [reservations, setReservations] = useState<any[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [selectedReservation, setSelectedReservation] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch Tables
        axios.get(`${apiBase}/api/tables`).then(res => setTables(res.data));
    }, []);

    useEffect(() => {
        fetchReservations();
    }, [viewDate]);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString();
            const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).toISOString();
            const { data } = await axios.get(`${apiBase}/api/reservations?start=${start}&end=${end}`);
            setReservations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const getReservationsForDate = (day: number) => {
        return reservations.filter(r => {
            const d = new Date(r.startTime);
            return d.getDate() === day &&
                d.getMonth() === viewDate.getMonth() &&
                d.getFullYear() === viewDate.getFullYear() &&
                r.status !== 'CANCELLED';
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] pb-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <CalendarIcon size={24} className="text-blue-500" />
                    {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
                </h2>
                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => navigate('/reservations/new')}>＋ 新規予約</Button>
                    <div className="w-4"></div>
                    <Button variant="secondary" onClick={handlePrevMonth}><ChevronLeft size={16} /></Button>
                    <Button variant="secondary" onClick={() => setViewDate(new Date())}>今日</Button>
                    <Button variant="secondary" onClick={handleNextMonth}><ChevronRight size={16} /></Button>
                </div>
            </div>

            <Card className="flex-1 p-0 overflow-hidden flex flex-col shadow-md border-0">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b bg-slate-50">
                    {DAYS.map(d => (
                        <div key={d} className="p-3 text-center text-sm font-bold text-slate-500">
                            {d}
                        </div>
                    ))}
                </div>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-white overflow-y-auto">
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`emp-${i}`} className="border-b border-r p-2 bg-slate-50/30"></div>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const resForDay = getReservationsForDate(day);
                        const isToday = new Date().getDate() === day &&
                            new Date().getMonth() === viewDate.getMonth() &&
                            new Date().getFullYear() === viewDate.getFullYear();

                        return (
                            <div
                                key={day}
                                className={`
                                    border-b border-r p-2 transition-colors relative min-h-[140px] hover:bg-slate-50 cursor-pointer flex flex-col
                                    ${isToday ? 'bg-blue-50/30' : ''}
                                `}
                                onClick={() => {
                                    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    navigate(`/tables?date=${dateStr}`);
                                }}
                            >
                                <div className="flex justify-between items-start mb-1 shrink-0">
                                    <span className={`
                                        text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                                        ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}
                                    `}>
                                        {day}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 pr-1 h-full">
                                    {resForDay.slice(0, 3).map(r => (
                                        <div
                                            key={r.id}
                                            className="text-[10px] rounded px-1.5 py-1 truncate border-l-2 shadow-sm cursor-pointer hover:bg-opacity-80 bg-green-50 text-green-700 border-green-500"
                                            title={`${new Date(r.startTime).getHours()}:${String(new Date(r.startTime).getMinutes()).padStart(2, '0')} ${r.customerName}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedReservation(r);
                                            }}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold">
                                                    {new Date(r.startTime).getHours()}:{String(new Date(r.startTime).getMinutes()).padStart(2, '0')}
                                                </span>
                                                <div className="flex-1 truncate font-medium">
                                                    {r.customerName}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5 text-[9px] text-slate-500">
                                                <span className="truncate max-w-[60%]">
                                                    {tables.find((t: any) => t.id === r.tableId)?.name || "Unknown"}
                                                </span>
                                                <span>{r.partySize}名</span>
                                            </div>
                                        </div>
                                    ))}
                                    {resForDay.length > 3 && (
                                        <div
                                            className="text-[10px] text-center text-blue-600 font-bold bg-blue-50 rounded py-1 cursor-pointer hover:bg-blue-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                navigate(`/tables?date=${dateStr}`);
                                            }}
                                        >
                                            他 {resForDay.length - 3} 件...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {selectedReservation && (
                <ReservationActionModal
                    reservation={selectedReservation}
                    onClose={() => setSelectedReservation(null)}
                    onUpdate={fetchReservations}
                />
            )}
        </div>
    );
};
