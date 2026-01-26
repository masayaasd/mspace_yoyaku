import { useState, useEffect } from "react";
import { Button, Card, Input, Badge } from "../components/UI";
import { FloorMap } from "../components/Calendar/FloorMap";
import { Calendar, Clock, ChevronRight, Check, User, Phone, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { calculatePrice } from "../utils/pricing";

const apiBase = import.meta.env.VITE_API_BASE || "";

// Generate time slots (06:00 - 30:00) with 30 min intervals
const TIME_SLOTS = Array.from({ length: (24 * 2) + 1 }, (_, i) => {
    const totalMinutes = (6 * 60) + (i * 30); // Start at 06:00
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const time = `${hour >= 24 ? hour - 24 : hour}:${String(minute).padStart(2, '0')}`;
    const displayTime = `${hour >= 24 ? hour - 24 : hour}:${String(minute).padStart(2, '0')}${hour >= 24 ? ' (翌)' : ''}`;
    return { label: displayTime, value: time, rawHour: hour };
}).filter(t => t.rawHour <= 30); // Cap at 30:00

export const CreateReservation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Form Data
    const [date, setDate] = useState(searchParams.get("date") || new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [partySize, setPartySize] = useState(2);
    const [selectedTable, setSelectedTable] = useState<any>(null);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");

    // Data
    const [tables, setTables] = useState<any[]>([]);
    const [existingReservations, setExistingReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load tables initially
        axios.get(`${apiBase}/api/tables`).then(res => setTables(res.data));
    }, []);

    // Fetch availability when date changes
    useEffect(() => {
        if (date) {
            const start = new Date(date).toISOString();
            const end = new Date(new Date(date).getTime() + 86400000).toISOString();
            axios.get(`${apiBase}/api/reservations?start=${start}&end=${end}`)
                .then(res => setExistingReservations(res.data));
        }
    }, [date]);

    const isTableAvailable = (table: any) => {
        if (!time) return false;
        // Simple overlap check: Assume 2 hours duration for new reservation
        const newStart = new Date(`${date}T${time}:00`); // ISO format needs fixing for real usage
        // Fix time string for date construction
        // If time is 24+, need to add day. simplified for now.
        const [h, m] = time.split(':').map(Number);
        const reservationStart = new Date(date);
        reservationStart.setHours(h, m, 0, 0);
        // Default check duration: if endTime is set use it, else 2 hours
        let reservationEnd;
        if (endTime) {
            const [eh, em] = endTime.split(':').map(Number);
            reservationEnd = new Date(date);
            if (eh >= 24 || eh < h) reservationEnd.setDate(reservationEnd.getDate() + 1);
            else if (eh < h) reservationEnd.setDate(reservationEnd.getDate() + 1); // Handle 25:00 vs 01:00 logic if mixed? 
            // Simplified:
            reservationEnd.setHours(eh, em, 0, 0);
        } else {
            reservationEnd = new Date(reservationStart.getTime() + 2 * 60 * 60 * 1000);
        }

        return !existingReservations.some((r: any) => {
            if (r.tableId !== table.id) return false;
            // Only count ACTIVE reservations (ignore cancelled)
            if (r.status === 'CANCELLED') return false;

            const rStart = new Date(r.startTime);
            const rEnd = new Date(r.endTime);
            return (reservationStart < rEnd && reservationEnd > rStart);
        });
    };

    const availableCount = tables.filter(t => isTableAvailable(t)).length;

    const handleConfirm = async () => {
        if (!selectedTable || !guestName || !guestPhone) {
            alert("必須項目（テーブル、名前、電話番号）を入力してください");
            return;
        }
        setLoading(true);
        try {
            const [h, m] = time.split(':').map(Number);
            const start = new Date(date);
            start.setHours(h, m, 0, 0);

            // Calculate end time
            const [eh, em] = endTime.split(':').map(Number);
            const end = new Date(date);
            if (eh >= 24) {
                end.setDate(end.getDate() + 1);
                end.setHours(eh - 24, em, 0, 0);
            } else if (eh < h) {
                end.setDate(end.getDate() + 1);
                end.setHours(eh, em, 0, 0);
            } else {
                end.setHours(eh, em, 0, 0);
            }

            await axios.post(`${apiBase}/api/reservations`, {
                tableId: selectedTable.id,
                customerName: guestName,
                customerPhone: guestPhone,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                partySize: Number(partySize),
            });
            alert("予約を作成しました");
            navigate('/reservations');
        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.error || "予約作成に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">New Reservation</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <span className={step >= 1 ? "text-blue-600 font-bold" : ""}>1. 日時</span>
                        <ChevronRight size={14} />
                        <span className={step >= 2 ? "text-blue-600 font-bold" : ""}>2. 卓選択</span>
                        <ChevronRight size={14} />
                        <span className={step >= 3 ? "text-blue-600 font-bold" : ""}>3. 確定</span>
                    </div>
                </div>
                {step > 1 && (
                    <Button variant="secondary" onClick={() => setStep(step - 1)}>
                        <ArrowLeft size={16} /> 戻る
                    </Button>
                )}
            </div>

            <Card className="flex-1 flex flex-col p-0 overflow-hidden border-0 shadow-sm bg-white">
                {step === 1 && (
                    <div className="p-8 flex flex-col gap-8 h-full overflow-auto">
                        <div className="flex flex-col gap-2">
                            <label className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="text-blue-500" /> 日付を選択
                            </label>
                            <input
                                type="date"
                                className="input-field text-lg p-3"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-2 flex-1">
                                <label className="text-lg font-bold flex items-center gap-2">
                                    <Clock className="text-blue-500" /> 開始時間
                                </label>
                                <select
                                    className="input-field text-lg p-3"
                                    value={time}
                                    onChange={(e) => {
                                        setTime(e.target.value);
                                        setEndTime(""); // Reset end time when start changes
                                    }}
                                >
                                    <option value="">選択してください</option>
                                    {TIME_SLOTS.map((slot) => {
                                        const now = new Date();
                                        const selectedDate = new Date(date);
                                        // Check if date is today
                                        const isToday = selectedDate.toDateString() === now.toDateString();

                                        if (isToday) {
                                            const [h, m] = slot.value.split(':').map(Number);
                                            // Handle late night times (24+) by comparing somewhat strictly
                                            // Actually, if it's today, we just need to ensure time > now.
                                            // Let's create a date object for the slot
                                            const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
                                            if (h >= 24) slotDate.setDate(slotDate.getDate() + 1);

                                            if (slotDate < now) return null;
                                        }

                                        // Calculate availability for this slot
                                        // We reuse reuse the logic but need to pass specific time
                                        const count = tables.filter(t => {
                                            const newStart = new Date(`${date}T${slot.value}:00`);
                                            const [h, m] = slot.value.split(':').map(Number);
                                            const start = new Date(date);
                                            start.setHours(h, m, 0, 0);
                                            // Default 2 hours check for availability preview
                                            const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

                                            return !existingReservations.some((r: any) => {
                                                if (r.tableId !== t.id) return false;
                                                if (r.status === 'CANCELLED') return false;
                                                const rStart = new Date(r.startTime);
                                                const rEnd = new Date(r.endTime);
                                                return (start < rEnd && end > rStart);
                                            });
                                        }).length;

                                        return (
                                            <option key={slot.value} value={slot.value} disabled={count === 0}>
                                                {slot.label} (残{count}卓)
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2 flex-1">
                                <label className="text-lg font-bold flex items-center gap-2">
                                    <Clock className="text-blue-500" /> 終了時間
                                </label>
                                <select
                                    className="input-field text-lg p-3"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    disabled={!time}
                                >
                                    <option value="">選択してください</option>
                                    {TIME_SLOTS.filter(slot => {
                                        if (!time) return false;

                                        // Find start time slot index
                                        const startIndex = TIME_SLOTS.findIndex(t => t.value === time);
                                        const slotIndex = TIME_SLOTS.findIndex(t => t.value === slot.value);

                                        // Only show times AFTER start time (at least 30 mins? let's say at least 10 mins for flexibility)
                                        return slotIndex > startIndex;
                                    }).map((slot) => (
                                        <option key={slot.value} value={slot.value}>
                                            {slot.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="border-t pt-4 flex justify-end">
                            <Button
                                onClick={() => setStep(2)}
                                disabled={!date || !time || !endTime}
                                className="px-8 py-3 text-lg"
                            >
                                次へ (卓選択) <ChevronRight />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-4 flex flex-col h-full">
                        <div className="mb-4 flex flex-col items-center">
                            <h2 className="text-xl font-bold bg-blue-50 px-6 py-2 rounded-full text-blue-800 mb-2">
                                {date} {time} 〜
                            </h2>
                            <p className="text-slate-500 text-sm">希望のテーブルをタップしてください</p>
                        </div>

                        <div className="flex-1 relative bg-slate-100 rounded-xl border overflow-auto">
                            <div className="min-h-[500px] w-full relative">
                                <FloorMap
                                    tables={tables}
                                    reservations={existingReservations}
                                    tableStatus={tables.reduce((acc: any, t: any) => {
                                        if (selectedTable?.id === t.id) acc[t.id] = 'selected';
                                        else if (!isTableAvailable(t)) acc[t.id] = 'occupied';
                                        else acc[t.id] = 'available';
                                        return acc;
                                    }, {})}
                                    onTableClick={(table: any) => {
                                        if (isTableAvailable(table)) {
                                            setSelectedTable(table);
                                            // Auto-set party size to min capacity if current is lower
                                            if (Number(partySize) < table.capacityMin) {
                                                setPartySize(table.capacityMin);
                                            }
                                            setStep(3);
                                        } else {
                                            alert("この時間は予約済みです");
                                        }
                                    }}
                                />
                            </div>

                            <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow-sm text-xs flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-white border border-blue-300"></div>
                                    <span>空き</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></div>
                                    <span>予約済</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-blue-600"></div>
                                    <span>選択中</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-8 max-w-lg mx-auto w-full flex flex-col justify-center h-full">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">予約内容の確認</h2>
                            <p className="text-slate-500">以下の内容で予約を確定します</p>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border mb-8 space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">日時</span>
                                <span className="font-bold text-lg">{date} {time} 〜 {endTime}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">テーブル</span>
                                <div className="text-right">
                                    <span className="font-bold text-lg text-blue-600 block">{selectedTable?.name}</span>
                                    <span className="text-xs text-slate-400">{selectedTable?.category}</span>
                                </div>
                            </div>

                            {/* Price Estimation */}
                            {selectedTable && time && endTime && (
                                <div className="bg-white p-4 rounded border border-blue-100">
                                    <h3 className="text-sm font-bold text-slate-500 mb-2">概算料金</h3>
                                    {(() => {
                                        // Construct Date objects for pricing
                                        const [sh, sm] = time.split(':').map(Number);
                                        const [eh, em] = endTime.split(':').map(Number);

                                        const sDate = new Date(date);
                                        sDate.setHours(sh, sm, 0, 0);

                                        const eDate = new Date(date);
                                        // Handle next day
                                        if (eh >= 24) {
                                            eDate.setDate(eDate.getDate() + 1);
                                            eDate.setHours(eh - 24, em, 0, 0);
                                        } else if (eh < sh) {
                                            // Assume next day if end hour < start hour (e.g. 19:00 to 02:00)
                                            eDate.setDate(eDate.getDate() + 1);
                                            eDate.setHours(eh, em, 0, 0);
                                        } else {
                                            eDate.setHours(eh, em, 0, 0);
                                        }

                                        const price = calculatePrice(
                                            sDate,
                                            eDate,
                                            Number(partySize),
                                            selectedTable.category === "VIP Room"
                                        );

                                        return (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span>お一人様</span>
                                                    <span>¥{price.totalPerPerson.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-400 pl-2">
                                                    <span>(時間料金: ¥{price.timeChargePerPerson})</span>
                                                    <span>(入場料: ¥{price.admission})</span>
                                                    {price.vip > 0 && <span>(VIP: ¥{price.vip})</span>}
                                                </div>
                                                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 text-blue-800">
                                                    <span>合計 ({partySize}名)</span>
                                                    <span>¥{price.totalAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 mb-8">
                            <Input
                                label="お客様名 (必須)"
                                icon={<User size={16} />}
                                value={guestName}
                                onChange={(e: any) => setGuestName(e.target.value)}
                                placeholder="例: 山田 太郎"
                            />
                            <Input
                                label="電話番号"
                                icon={<Phone size={16} />}
                                value={guestPhone}
                                onChange={(e: any) => setGuestPhone(e.target.value)}
                                placeholder="090-0000-0000"
                            />
                            <Input
                                label="人数"
                                type="number"
                                value={partySize}
                                onChange={(e: any) => setPartySize(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={handleConfirm}
                            disabled={!guestName || !guestPhone || loading}
                            className="w-full py-4 text-lg font-bold shadow-lg shadow-blue-200"
                        >
                            {loading ? '処理中...' : '予約を確定する'}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
