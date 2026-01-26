
import React, { useState, useEffect } from "react";
import { Card, Badge, Button } from "../components/UI";
import { api } from "../lib/api";
import { useLIFF } from "../providers/LIFFProvider";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react";

export const MyReservationsPage = () => {
    const { isReady } = useLIFF();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMy = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/api/my/reservations");
            setReservations(data.reservations || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isReady) fetchMy();
    }, [isReady]);

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">予約の確認</h2>
                <Button variant="ghost" className="w-auto p-0" onClick={fetchMy}>更新</Button>
            </div>

            <div className="space-y-4">
                {reservations.length > 0 ? (
                    reservations.map((res: any) => (
                        <Card key={res.id} className="relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-3">
                                <Badge color={res.status === 'CONFIRMED' ? 'green' : 'slate'}>
                                    {res.status === 'CONFIRMED' ? '予約確定' : res.status}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                    {new Date(res.startTime).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                                        <MapPin size={16} className="text-blue-500" />
                                        {res.table.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock size={16} className="text-slate-400" />
                                        {formatTime(res.startTime)} 〜 {formatTime(res.endTime)}
                                    </div>
                                    <p className="text-xs text-slate-400">人数: {res.partySize}名様 / {res.customerName}様</p>
                                </div>
                                <div className="flex items-center">
                                    <ChevronRight className="text-slate-300 group-active:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Card>
                    ))
                ) : !loading ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <Calendar size={32} />
                        </div>
                        <p className="text-slate-400 font-medium">現在、有効な予約はありません</p>
                        <Button variant="outline" className="w-40 mx-auto" onClick={() => window.location.href = "/"}>
                            席を探す
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-32 bg-slate-100 rounded-2xl"></div>
                        <div className="h-32 bg-slate-100 rounded-2xl"></div>
                    </div>
                )}
            </div>

            <div className="pt-10 text-center">
                <p className="text-[10px] text-slate-300 uppercase tracking-widest">Poker Reserve Member Cloud</p>
            </div>
        </div>
    );
};
