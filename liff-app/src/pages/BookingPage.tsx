
import React, { useState, useEffect } from "react";
import { FloorMap } from "../components/FloorMap";
import { Card, Button, Input, Badge } from "../components/UI";
import { api } from "../lib/api";
import { useLIFF } from "../providers/LIFFProvider";
import { calculatePrice } from "../utils/pricing";
import { Calendar, Users, Clock, Check, AlertCircle } from "lucide-react";

export const BookingPage = () => {
    const { profile } = useLIFF();
    const [step, setStep] = useState(1);
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [bookingData, setBookingData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: "",
        endTime: "",
        partySize: "",
        tableId: null,
        name: localStorage.getItem("userName") || "",
        phone: localStorage.getItem("userPhone") || ""
    });
    const [loading, setLoading] = useState(false);

    // Initial Fetch (Tables & Reservations for Date)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [t, r] = await Promise.all([
                    api.get("/api/tables"),
                    api.get("/api/reservations?start=" + bookingData.date)
                ]);
                setTables(t.data);
                setReservations(r.data);
            } catch (e) {
                console.error("Failed to fetch data", e);
            }
        };
        fetchData();
    }, [bookingData.date]);

    // Generate Time Slots with Availability
    const getAvailableTimeSlots = () => {
        if (!bookingData.date) return [];
        const today = new Date();
        const selectedDate = new Date(bookingData.date);
        const isToday = selectedDate.toDateString() === today.toDateString();
        const currentMinutes = today.getHours() * 60 + today.getMinutes();

        return Array.from({ length: 48 }, (_, i) => {
            const totalMinutes = (6 * 60) + (i * 30); // Start from 06:00 (360 minutes)
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;

            // 1-Hour Rule Filtering for today
            if (isToday) {
                if (totalMinutes < currentMinutes + 60) return null;
            }

            const displayH = h >= 24 ? h - 24 : h;
            const timeString = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            // Availability Count
            const slotDate = new Date(selectedDate);
            slotDate.setHours(h, m, 0, 0); // Date object handles h > 23 by incrementing day

            let occupiedCount = 0;
            reservations.forEach((r: any) => {
                if (r.status === 'CANCELLED') return; // Skip cancelled reservations
                const rStart = new Date(r.startTime);
                const rEnd = new Date(r.endTime);
                // Check if the slot's start time falls within an existing reservation
                if (rStart <= slotDate && slotDate < rEnd) {
                    occupiedCount++;
                }
            });

            const availCount = tables.length - occupiedCount;

            return {
                value: timeString,
                label: `${timeString} (${Math.max(0, availCount)}卓)`,
                minutes: totalMinutes,
                rawH: h, // Keep raw H (e.g. 25) for sort comparison
                availCount
            };
        }).filter(Boolean); // Filter out nulls from 1-hour rule
    };

    const timeSlots = getAvailableTimeSlots();

    // End Time Options: Only > Start Time
    const getEndTimeOptions = () => {
        if (!bookingData.time) return [];
        const [sh, sm] = bookingData.time.split(':').map(Number);

        // Find logical start minutes
        const timeSlot = timeSlots.find(s => s.value === bookingData.time);
        if (!timeSlot) return [];
        const startTotalMinutes = timeSlot.minutes;

        const startDate = new Date(bookingData.date);
        startDate.setHours(sh, sm, 0, 0);
        // Correct date if start hour < 6 (Next Day)
        if (sh < 6) startDate.setDate(startDate.getDate() + 1);

        const allPossibleEndSlots = Array.from({ length: 48 }, (_, i) => {
            const totalMinutes = (6 * 60) + (i * 30);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            const displayH = h >= 24 ? h - 24 : h;
            const timeString = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            return {
                value: timeString,
                totalMinutes,
                h, m
            };
        });

        return allPossibleEndSlots
            .filter(s => s.totalMinutes > startTotalMinutes)
            .map(s => {
                // Calculate Availability for [Start, End)
                const endDate = new Date(bookingData.date);
                endDate.setHours(s.h, s.m, 0, 0);
                if (s.h >= 24) endDate.setDate(endDate.getDate() + 1); // Logic for > 24h
                else if (s.h < 6) endDate.setDate(endDate.getDate() + 1); // Logic for Next Day early morning

                // Fallback for date correction if end < start in value
                if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);

                let occupiedCount = 0;
                // Check every reservation against this proposed interval [startDate, endDate)
                // If ANY reservation overlaps, the table is busy for this FULL duration.
                // We need to check how many UNIQUE tables are blocked.
                const blockedTableIds = new Set();

                reservations.forEach((r: any) => {
                    if (r.status === 'CANCELLED') return; // Skip cancelled reservations
                    const rStart = new Date(r.startTime);
                    const rEnd = new Date(r.endTime);

                    // Overlap check: (StartA < EndB) and (EndA > StartB)
                    if (startDate < rEnd && endDate > rStart) {
                        blockedTableIds.add(r.tableId);
                    }
                });

                occupiedCount = blockedTableIds.size;
                const availCount = Math.max(0, tables.length - blockedTableIds.size);

                return {
                    value: s.value,
                    label: `${s.value} (${availCount}卓)`,
                    availCount
                };
            });
    };

    const endTimeOptions = getEndTimeOptions();

    // Validation for Step 1
    const handleStep1Next = () => {
        if (!bookingData.date) { alert("来店日を選択してください"); return; }
        if (!bookingData.time) { alert("開始時間を選択してください"); return; }
        if (!bookingData.endTime) { alert("終了時間を選択してください"); return; }

        // Basic Time Validation
        const [sh, sm] = bookingData.time.split(':').map(Number);
        const [eh, em] = bookingData.endTime.split(':').map(Number);
        const startVal = sh * 60 + sm;
        let endVal = eh * 60 + em;
        if (endVal < startVal) endVal += 24 * 60; // Next day handling

        if (endVal <= startVal) {
            alert("終了時間は開始時間より後に設定してください");
            return;
        }
        // 1-hour advance notice rule for today is now handled by filtering `timeSlots`
        // Same-day check is also handled by `timeSlots` filtering.

        setStep(2);
    };

    // Table Selection Logic (Step 2)
    const handleTableSelect = (tableId: string, isOccupied: boolean) => {
        if (isOccupied) {
            alert("その時間は既に予約が入っています");
            return;
        }
        setBookingData(prev => ({ ...prev, tableId: tableId }));
        setStep(3);
    };

    // Final Submission
    const handleComplete = async () => {
        setLoading(true);
        try {
            const start = new Date(bookingData.date);
            const [sh, sm] = bookingData.time.split(':').map(Number);
            start.setHours(sh, sm, 0, 0);

            const end = new Date(bookingData.date);
            const [eh, em] = bookingData.endTime.split(':').map(Number);
            end.setHours(eh, em, 0, 0);

            // Midnight handling: If the hour is before 6 AM, it's considered the next day for our business logic.
            // This ensures correct date assignment for times like 01:00 (which is 25:00 in our 24h+ model).
            if (sh < 6) start.setDate(start.getDate() + 1);
            if (eh < 6) end.setDate(end.getDate() + 1);

            // Fallback for linear wrap (e.g., Start 23:00, End 01:00)
            // This handles cases where the end time is numerically smaller than start time,
            // but represents a later time on the next day, and wasn't caught by the <6 AM rule.
            if (end <= start) end.setDate(end.getDate() + 1);

            await api.post("/api/book", {
                tableId: bookingData.tableId,
                startAt: start.toISOString(),
                endAt: end.toISOString(),
                partySize: Number(bookingData.partySize),
                name: bookingData.name,
                phone: bookingData.phone
            });
            setStep(4); // Success Step
        } catch (e: any) {
            alert("エラー: " + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    // Pricing Calculation
    const getPrice = () => {
        if (!bookingData.time || !bookingData.endTime || !bookingData.partySize) return null;

        const start = new Date(`${bookingData.date}T${bookingData.time}`);
        const end = new Date(`${bookingData.date}T${bookingData.endTime}`);

        // Ensure midnight crossing logic
        const [sh, sm] = bookingData.time.split(':').map(Number);
        const [eh, em] = bookingData.endTime.split(':').map(Number);
        if (eh < sh && eh < 6) end.setDate(end.getDate() + 1); // Only for logical next day
        else if (bookingData.endTime <= bookingData.time) end.setDate(end.getDate() + 1); // Fallback

        const selectedTableObj = tables.find((t: any) => t.id === bookingData.tableId);
        const isVip = selectedTableObj?.name === 'VIP';

        const p = calculatePrice(start, end, Number(bookingData.partySize), isVip);
        const perPerson = p.totalAmount / Number(bookingData.partySize);
        return { total: p.totalAmount, perPerson, isVip };
    };

    const priceInfo = getPrice();

    if (step === 4) {
        return (
            <div className="py-20 text-center space-y-6 animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                    <Check size={48} strokeWidth={3} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">予約完了！</h2>
                    <p className="text-slate-500 text-sm font-medium">ご予約ありがとうございます。<br />当日のお越しをお待ちしております。</p>
                </div>
                <Button className="w-48 mx-auto h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-200" onClick={() => window.location.href = "/my"}>予約を確認する</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            {/* Header Steps */}
            <div className="flex gap-2 mb-6">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            </div>

            {/* Step 1: Time Selection */}
            {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Calendar size={18} className="text-blue-600" /> 来店日
                        </label>
                        <Input
                            type="date"
                            className="bg-white border-slate-200 h-14 text-lg font-medium shadow-sm"
                            value={bookingData.date}
                            min={new Date().toISOString().split('T')[0]} // Disable past dates
                            onChange={(e: any) => setBookingData({ ...bookingData, date: e.target.value, tableId: null })} // Reset table
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Clock size={18} className="text-blue-600" /> 開始
                            </label>
                            <select
                                className={`w-full h-14 rounded-xl border-2 px-3 font-bold text-lg shadow-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all ${!bookingData.time ? 'bg-slate-100 text-slate-400 border-slate-100' : 'bg-white border-blue-500 text-slate-900'}`}
                                value={bookingData.time}
                                onChange={(e) => setBookingData({ ...bookingData, time: e.target.value, tableId: null })}
                            >
                                <option value="">未選択</option>
                                {timeSlots.map(t => (
                                    <option key={t.value} value={t.value} disabled={t.availCount === 0} className={t.availCount === 0 ? "text-slate-300" : ""}>
                                        {t?.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Clock size={18} className="text-slate-400" /> 終了
                            </label>
                            <select
                                className={`w-full h-14 rounded-xl border-2 px-3 font-bold text-lg shadow-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all ${!bookingData.endTime ? 'bg-slate-100 text-slate-400 border-slate-100' : 'bg-white border-blue-500 text-slate-900'}`}
                                value={bookingData.endTime}
                                onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value, tableId: null })}
                                disabled={!bookingData.time}
                            >
                                <option value="">未選択</option>
                                {endTimeOptions.map(t => (
                                    <option key={t.value} value={t.value} disabled={t.availCount === 0} className={t.availCount === 0 ? "text-slate-300" : ""}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl text-blue-900 text-sm border border-blue-100 flex gap-3 items-start">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <div className="opacity-90 leading-relaxed">
                            <span className="font-bold">まずは日時を選択してください。</span><br />
                            次の画面で空いているテーブルが表示されます。
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-blue-200 mt-4 active:scale-[0.98] transition-all"
                        onClick={handleStep1Next}
                    >
                        空席を確認する
                    </Button>
                </div>
            )}

            {/* Step 2: Table Selection */}
            {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg">
                        <p className="text-xs opacity-60 font-bold uppercase tracking-wider mb-1">選択中の日時</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black">{bookingData.time}</span>
                            <span className="text-lg opacity-60">~</span>
                            <span className="text-2xl font-black">{bookingData.endTime}</span>
                        </div>
                    </div>

                    <div className="text-center py-2">
                        <h3 className="text-lg font-black text-slate-800">テーブルを選択</h3>
                        <p className="text-xs text-slate-400">ご希望の座席をタップしてください</p>
                    </div>

                    <div className="bg-white border rounded-xl overflow-hidden shadow-sm p-2">
                        <FloorMap
                            tables={tables}
                            reservations={reservations}
                            onTableClick={(t: any, isOccupied: boolean) => handleTableSelect(t.id, isOccupied)} // Occupied check handled inside FloorMap logic or visually?
                            // Ideally FloorMap should expose occupation status.
                            // Current FloorMap logic checks `checkTime`. 
                            // We need to ensure FloorMap marks "occupied" based on our time range.
                            selectedTableId={bookingData.tableId}
                            checkTime={new Date(`${bookingData.date}T${bookingData.time}`)} // This validates START time availability. 
                            checkEndTime={new Date(`${bookingData.date}T${bookingData.endTime}`)}
                        // Does it check DURATION?
                        // Standard FloorMap only checks if occupied AT checkTime.
                        // We need to implement FULL DURATION check override?
                        // OR we rely on FloorMap visual + logic upgrade.
                        // To support range verification, we might need to modify FloorMap or process filtering here.
                        // For now, let's pass the checkTime.
                        />
                        {/* Note: Standard FloorMap checkTime only checks a single point in time. 
                             We need to check overlap. 
                             If FloorMap component doesn't support range check, we can rely on `reservations` prop
                             and visual cues, but we need to BLOCK selection logic here. 
                             
                             I will update FloorMap.tsx next to support `checkEndTime` range check if needed,
                             OR I can filter logic here. 
                             
                             Let's add a helper here to check overlap just for the click handler.
                         */}
                    </div>

                    <Button variant="secondary" className="w-full h-12" onClick={() => setStep(1)}>日時を変更する</Button>
                </div>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <Card className="p-5 space-y-6 border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 pb-4 space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">予約内容</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{bookingData.date}</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{bookingData.time} - {bookingData.endTime}</span>
                                <span className="font-bold text-slate-600 bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-100 text-sm">
                                    {tables.find((t: any) => t.id === bookingData.tableId)?.name}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">お名前</label>
                                <Input
                                    className="bg-slate-50 border-slate-200 h-12"
                                    value={bookingData.name}
                                    onChange={(e: any) => {
                                        setBookingData({ ...bookingData, name: e.target.value });
                                        localStorage.setItem("userName", e.target.value);
                                    }}
                                    placeholder="お名前を入力"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">電話番号</label>
                                <Input
                                    type="tel"
                                    className="bg-slate-50 border-slate-200 h-12"
                                    value={bookingData.phone}
                                    onChange={(e: any) => {
                                        setBookingData({ ...bookingData, phone: e.target.value });
                                        localStorage.setItem("userPhone", e.target.value);
                                    }}
                                    placeholder="090-0000-0000"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">人数</label>
                                <Input
                                    type="number"
                                    className={`bg-slate-50 border-slate-200 h-12 text-lg transition-colors ${!bookingData.partySize ? 'bg-slate-100' : 'bg-white'}`}
                                    value={bookingData.partySize}
                                    onChange={(e: any) => setBookingData({ ...bookingData, partySize: e.target.value })}
                                    placeholder="人数を入力 (名)"
                                />
                            </div>
                        </div>

                        <Button variant="outline" className="w-full text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 h-10 text-sm" onClick={() => setStep(2)}>
                            予約内容・座席を変更
                        </Button>
                    </Card>

                    {/* Price Display */}
                    {bookingData.partySize && priceInfo ? (
                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-blue-900">お一人様</span>
                                    {priceInfo.isVip && <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full w-fit">VIP料込</span>}
                                </div>
                                <span className="text-3xl font-black text-blue-900 tracking-tight">約 ¥{Math.round(priceInfo.perPerson).toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-blue-700 opacity-70">※チャージ料・VIP料含む</p>
                        </div>
                    ) : (
                        <div className="bg-slate-100 rounded-2xl p-6 text-center border-2 border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                            人数を入力すると<br />金額が表示されます
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" className="flex-1 h-14 font-bold" onClick={() => setStep(2)}>戻る</Button>
                        <Button
                            className="flex-[2] h-14 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 bg-blue-600 hover:bg-blue-700"
                            onClick={handleComplete}
                            disabled={loading || !bookingData.partySize || !bookingData.name || !bookingData.phone}
                        >
                            {loading ? "送信中..." : "予約を確定する"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
