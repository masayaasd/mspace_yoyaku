
import React, { useState, useEffect } from "react";
import { Card, Button, Input, Badge } from "../components/UI";
import { api } from "../lib/api";
import { useLIFF } from "../providers/LIFFProvider";
import { Calendar, Users, Clock, Check } from "lucide-react";

export const BookingPage = () => {
    const { profile } = useLIFF();
    const [step, setStep] = useState(1);
    const [tables, setTables] = useState([]);
    const [bookingData, setBookingData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: "19:00",
        endTime: "21:00",
        partySize: 2,
        tableId: "",
        name: profile?.displayName || "",
        phone: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTables = async () => {
            const { data } = await api.get("/api/tables");
            setTables(data);
        };
        fetchTables();
    }, []);

    const handleComplete = async () => {
        setLoading(true);
        try {
            const start = new Date(bookingData.date);
            const [sh, sm] = bookingData.time.split(':').map(Number);
            start.setHours(sh, sm, 0, 0);

            const end = new Date(bookingData.date);
            const [eh, em] = bookingData.endTime.split(':').map(Number);
            end.setHours(eh, em, 0, 0);
            if (eh < sh) end.setDate(end.getDate() + 1);

            await api.post("/api/book", {
                tableId: bookingData.tableId,
                startAt: start.toISOString(),
                endAt: end.toISOString(),
                partySize: Number(bookingData.partySize),
                name: bookingData.name,
                phone: bookingData.phone
            });
            setStep(3);
        } catch (e: any) {
            alert("エラー: " + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <div className="py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto scale-110 shadow-lg shadow-green-100 animate-in zoom-in duration-500">
                    <Check size={40} strokeWidth={3} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">予約完了！</h2>
                    <p className="text-slate-500 text-sm">ご予約を承りました。<br />当日のお越しをお待ちしております。</p>
                </div>
                <Button className="w-48 mx-auto" onClick={() => window.location.href = "/my"}>予約を確認する</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="space-y-1">
                <h2 className="text-2xl font-black text-slate-800">新規予約</h2>
                <div className="flex gap-2">
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                </div>
            </header>

            {step === 1 ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <Card className="space-y-4">
                        <Input
                            label="来店日"
                            type="date"
                            value={bookingData.date}
                            onChange={(e: any) => setBookingData({ ...bookingData, date: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                label="開始時間"
                                type="time"
                                value={bookingData.time}
                                onChange={(e: any) => setBookingData({ ...bookingData, time: e.target.value })}
                            />
                            <Input
                                label="終了時間"
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
                    </Card>

                    <p className="text-sm font-bold text-slate-600 ml-1">席を選択</p>
                    <div className="grid grid-cols-2 gap-2">
                        {tables.map((t: any) => (
                            <div
                                key={t.id}
                                onClick={() => setBookingData({ ...bookingData, tableId: t.id })}
                                className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${bookingData.tableId === t.id
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-slate-100 bg-white'
                                    }`}
                            >
                                <p className="font-bold text-sm">{t.name}</p>
                                <p className="text-[10px] text-slate-400">{t.capacityMin}-{t.capacityMax}名</p>
                            </div>
                        ))}
                    </div>

                    <Button
                        disabled={!bookingData.tableId}
                        onClick={() => setStep(2)}
                        className="mt-4"
                    >
                        次へ進む
                    </Button>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <Card className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">予約内容の確認</p>
                            <p className="text-sm font-bold">{bookingData.date} / {bookingData.time}-{bookingData.endTime}</p>
                            <p className="text-sm">{tables.find((t: any) => t.id === bookingData.tableId)?.name} / {bookingData.partySize}名様</p>
                        </div>

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
                        />
                    </Card>

                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setStep(1)}>戻る</Button>
                        <Button className="flex-[2]" onClick={handleComplete} disabled={loading}>
                            {loading ? "送信中..." : "予約を確定する"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
