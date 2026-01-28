
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

    const [selectedReservation, setSelectedReservation] = useState<any>(null);

    const handleCancel = async (id: string) => {
        if (!window.confirm("予約をキャンセルしてもよろしいですか？")) return;
        try {
            await api.put(`/api/reservations/${id}`, { status: "CANCELLED" });
            alert("キャンセルしました");
            setSelectedReservation(null);
            fetchMy();
        } catch (e) {
            alert("キャンセルに失敗しました");
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">予約の確認</h2>
                <Button variant="ghost" className="w-auto p-0" onClick={fetchMy}>更新</Button>
            </div>

            <div className="space-y-4">
                {reservations.length > 0 ? (
                    reservations.map((res: any) => (
                        <Card
                            key={res.id}
                            className="relative overflow-hidden group active:scale-[0.98] transition-transform cursor-pointer"
                            onClick={() => setSelectedReservation(res)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <Badge color={res.status === 'CONFIRMED' ? 'green' : (res.status === 'CANCELLED' ? 'red' : 'slate')}>
                                    {res.status === 'CONFIRMED' ? '予約確定' : (res.status === 'CANCELLED' ? 'キャンセル済' : res.status)}
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

            {/* Detail Modal */}
            {selectedReservation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedReservation(null)}>
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="text-center space-y-2 border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-black text-slate-800">予約詳細</h3>
                            <Badge color={selectedReservation.status === 'CONFIRMED' ? 'green' : (selectedReservation.status === 'CANCELLED' ? 'red' : 'slate')}>
                                {selectedReservation.status === 'CONFIRMED' ? '予約確定' : (selectedReservation.status === 'CANCELLED' ? 'キャンセル済' : selectedReservation.status)}
                            </Badge>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-500 font-bold">日時</span>
                                <span className="font-bold text-slate-800">
                                    {new Date(selectedReservation.startTime).toLocaleDateString()} <br />
                                    {formatTime(selectedReservation.startTime)} 〜 {formatTime(selectedReservation.endTime)}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-500 font-bold">テーブル</span>
                                <span className="font-bold text-slate-800">{selectedReservation.table.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-500 font-bold">人数</span>
                                <span className="font-bold text-slate-800">{selectedReservation.partySize}名</span>
                            </div>
                            {selectedReservation.notes && (
                                <div className="space-y-1">
                                    <span className="text-slate-500 font-bold block">メモ</span>
                                    <p className="bg-slate-50 p-3 rounded-lg text-slate-600">{selectedReservation.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setSelectedReservation(null)}>閉じる</Button>
                            {selectedReservation.status === 'CONFIRMED' && (
                                <Button className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-red-100" onClick={() => handleCancel(selectedReservation.id)}>
                                    キャンセル
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-10 text-center">
                <p className="text-[10px] text-slate-300 uppercase tracking-widest">Poker Reserve Member Cloud</p>
            </div>
        </div>
    );
};
