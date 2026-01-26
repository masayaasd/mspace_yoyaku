
import React, { useState, useEffect } from "react";
import { FloorMap } from "../components/FloorMap";
import { Card, Button, Input, Badge } from "../components/UI";
import { api } from "../lib/api";
import { useLIFF } from "../providers/LIFFProvider";
import { Calendar, Users, Clock, Phone, User } from "lucide-react";

export const FloorMapPage = () => {
    const { profile } = useLIFF();
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [selectedTable, setSelectedTable] = useState<any>(null);
    const [bookingData, setBookingData] = useState({
        time: "19:00",
        endTime: "21:00",
        partySize: 2,
        name: profile?.displayName || "",
        phone: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            const [t, r] = await Promise.all([
                api.get("/api/tables"),
                api.get("/api/reservations?start=" + new Date().toISOString().split('T')[0])
            ]);
            setTables(t.data);
            setReservations(r.data);
        };
        fetchAll();
    }, []);

    const handleQuickBook = async () => {
        if (!selectedTable || !bookingData.name || !bookingData.phone) {
            alert("必須項目を入力してください");
            return;
        }
        setLoading(true);
        try {
            const start = new Date();
            const [sh, sm] = bookingData.time.split(':').map(Number);
            start.setHours(sh, sm, 0, 0);

            const end = new Date();
            const [eh, em] = bookingData.endTime.split(':').map(Number);
            end.setHours(eh, em, 0, 0);
            if (eh < sh) end.setDate(end.getDate() + 1);

            await api.post("/api/book", {
                tableId: selectedTable.id,
                startAt: start.toISOString(),
                endAt: end.toISOString(),
                partySize: Number(bookingData.partySize),
                name: bookingData.name,
                phone: bookingData.phone
            });
            alert("予約が完了しました！");
            setSelectedTable(null);
            // Refresh
            const r = await api.get("/api/reservations?start=" + new Date().toISOString().split('T')[0]);
            setReservations(r.data);
        } catch (e: any) {
            alert("エラー: " + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-800">フロア空席状況</h2>
                <Badge color="green">リアルタイム</Badge>
            </div>

            <FloorMap
                tables={tables}
                reservations={reservations}
                onTableClick={setSelectedTable}
                selectedTableId={selectedTable?.id}
            />

            {selectedTable ? (
                <Card className="animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg">{selectedTable.name}</h3>
                            <p className="text-xs text-slate-500">{selectedTable.capacityMin}-{selectedTable.capacityMax}名まで</p>
                        </div>
                        <Button variant="ghost" onClick={() => setSelectedTable(null)} className="w-auto h-auto p-1">
                            閉じる
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                label="開始"
                                type="time"
                                value={bookingData.time}
                                onChange={(e: any) => setBookingData({ ...bookingData, time: e.target.value })}
                            />
                            <Input
                                label="終了"
                                type="time"
                                value={bookingData.endTime}
                                onChange={(e: any) => setBookingData({ ...bookingData, endTime: e.target.value })}
                            />
                        </div>
                        <Input
                            label="人数"
                            type="number"
                            value={bookingData.partySize}
                            onChange={(e: any) => setBookingData({ ...bookingData, partySize: e.target.value })}
                            icon={<Users size={16} />}
                        />
                        <Input
                            label="お名前"
                            value={bookingData.name}
                            onChange={(e: any) => setBookingData({ ...bookingData, name: e.target.value })}
                        />
                        <Input
                            label="電話番号"
                            type="tel"
                            value={bookingData.phone}
                            onChange={(e: any) => setBookingData({ ...bookingData, phone: e.target.value })}
                            icon={<Phone size={16} />}
                        />
                        <Button onClick={handleQuickBook} disabled={loading}>
                            {loading ? "送信中..." : "この内容で予約する"}
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="bg-slate-100/50 rounded-2xl p-6 text-center border-2 border-dashed border-slate-200">
                    <p className="text-sm text-slate-400">マップ上の空いている席（白）を<br />タップしてすぐに予約できます</p>
                </div>
            )}
        </div>
    );
};
