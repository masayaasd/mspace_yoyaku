import { useState, useEffect } from "react";
import { Button } from "../components/UI";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { ScheduleMap } from "../components/Calendar/ScheduleMap";
import { TimelineModal } from "../components/Calendar/TimelineModal";

const apiBase = import.meta.env.VITE_API_BASE || "";
import { useNavigate, useSearchParams } from "react-router-dom";

export const Tables = () => {
    const [searchParams] = useSearchParams();
    const [tables, setTables] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [selectedTable, setSelectedTable] = useState<any>(null);
    // Initialize date from query param or default to today
    const [viewDate, setViewDate] = useState(() => {
        const d = searchParams.get("date");
        return d ? new Date(d) : new Date();
    });

    useEffect(() => {
        fetchData();
    }, [viewDate]);

    const fetchData = async () => {
        const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate()).toISOString();
        const end = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + 1).toISOString();

        try {
            const [t, r] = await Promise.all([
                axios.get(`${apiBase}/api/tables`),
                axios.get(`${apiBase}/api/reservations?start=${start}&end=${end}`)
            ]);
            setTables(t.data);
            setReservations(r.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleNextDay = () => {
        setViewDate(new Date(viewDate.setDate(viewDate.getDate() + 1)));
    };

    const handlePrevDay = () => {
        setViewDate(new Date(viewDate.setDate(viewDate.getDate() - 1)));
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarIcon className="text-blue-500" />
                        予約状況マップ
                    </h1>
                    <p className="text-slate-500">テーブルごとの本日の予約状況を一覧できます</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                    <Button variant="secondary" onClick={handlePrevDay}><ChevronLeft size={16} /></Button>
                    <div className="px-4 font-bold text-lg min-w-[140px] text-center">
                        {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月 {viewDate.getDate()}日
                    </div>
                    <Button variant="secondary" onClick={() => setViewDate(new Date())}>今日</Button>
                    <Button variant="secondary" onClick={handleNextDay}><ChevronRight size={16} /></Button>
                </div>
            </div>

            <div className="flex-1 bg-white p-4 rounded-xl border shadow-sm overflow-hidden">
                <ScheduleMap
                    tables={tables}
                    reservations={reservations}
                    onTableClick={(table: any) => setSelectedTable(table)}
                />
            </div>

            {selectedTable && (
                <TimelineModal
                    table={selectedTable}
                    reservations={reservations}
                    onClose={() => setSelectedTable(null)}
                />
            )}
        </div>
    );
};
