
import React, { useState, useEffect } from "react";
import { FloorMap } from "../components/FloorMap";
import { Card, Button, Input, Badge } from "../components/UI";
import { api } from "../lib/api";
import { useLIFF } from "../providers/LIFFProvider";
import { calculatePrice } from "../utils/pricing";
import { Calendar, Users, Clock, Phone, User, X } from "lucide-react";

export const FloorMapPage = () => {
    const { profile, isReady } = useLIFF();
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [selectedTable, setSelectedTable] = useState<any>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [bookingData, setBookingData] = useState({
        time: "19:00",
        endTime: "",
        partySize: "", // Default empty
        name: localStorage.getItem("userName") || "",
        phone: localStorage.getItem("userPhone") || ""
    });

    // Mock data for local development if API fails or LIFF not ready
    useEffect(() => {
        if (!isReady && window.location.hostname === 'localhost') {
            // Optional: You could set mock tables here if API is also failing, 
            // but for now we rely on API proxy.
        }
    }, [isReady]);
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
        if (!selectedTable || !bookingData.name || !bookingData.phone || !bookingData.partySize) {
            alert("必須項目を入力してください");
            return;
        }

        // 1-Hour rule is proactively filtered, but safe to keep check or remove alert.
        // User asked to "注釈で小さく表示して、そもそも当日の予約は1時間後以降...選択できない"
        // So we remove the blocking alert here if the UI prevents selection.
        // But preventing backend error is good.

        setLoading(true);
        try {
            const start = new Date();
            const [sh, sm] = bookingData.time.split(':').map(Number);
            // Handle Next Day cases for start time?
            // "Real-time" usually implies current business day.
            // If user selects "01:00" and it's currently "23:00", that implies T+1 01:00.
            // If user selects "23:00" and it's "20:00", that implies T 23:00.
            // We need the "business day" logic here too.
            // Simplified: If H < 6, add 1 day to Date.

            // Re-construct start date based on today
            const now = new Date();
            start.setHours(sh, sm, 0, 0);
            if (sh < 6) start.setDate(start.getDate() + 1);

            // If start time is somehow in the past relative to "now" (e.g. now 23:00, selected 20:00), 
            // likely means next day? Or just invalid?
            // "Real-time" flow assumes "Future from Now".
            // If filtered correctly, this edge case is minimized.

            const end = new Date();
            const [eh, em] = bookingData.endTime.split(':').map(Number);
            end.setHours(eh, em, 0, 0);
            if (eh < 6) end.setDate(end.getDate() + 1);

            // Just like BookingPage, ensure end > start
            if (end <= start) end.setDate(end.getDate() + 1);

            // Client-side Capacity Check
            const size = Number(bookingData.partySize);
            // Only check MAX capacity now, as requested
            if (selectedTable && (size > selectedTable.capacityMax)) {
                alert(`人数(${size}名)がテーブル定員(${selectedTable.capacityMax}名)を超えています。\n別のテーブルを選択するか、人数を変更してください。`);
                setLoading(false);
                setConfirmModalOpen(false); // Close modal on error
                return;
            }

            // Save to localStorage for next time
            localStorage.setItem("userName", bookingData.name);
            localStorage.setItem("userPhone", bookingData.phone);

            // Use /api/book (customer endpoint) to properly save lineUserId
            await api.post("/api/book", {
                tableId: selectedTable.id,
                name: bookingData.name,
                phone: bookingData.phone,
                partySize: size,
                startAt: start.toISOString(),
                endAt: end.toISOString()
            });
            alert("予約が完了しました！");
            setSelectedTable(null);
            setConfirmModalOpen(false);
            // Refresh
            const r = await api.get("/api/reservations?start=" + new Date().toISOString().split('T')[0]);
            setReservations(r.data);
        } catch (e: any) {
            alert("エラー: " + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    // Generate 24h time slots (06:00 to 30:00) with Filtering
    const getFilteredTimeSlots = () => {
        const today = new Date();
        const currentMinutes = today.getHours() * 60 + today.getMinutes();

        return Array.from({ length: 48 }, (_, i) => {
            const totalMinutes = (6 * 60) + (i * 30);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            const displayH = h >= 24 ? h - 24 : h;

            // 1h Rule filtering (Always 'isToday' for Real-time)
            if (totalMinutes < currentMinutes + 60) return null;

            // Occupancy Check for Selected Table
            if (selectedTable) {
                const slotDate = new Date();
                slotDate.setHours(h, m, 0, 0);
                if (h < 6) slotDate.setDate(slotDate.getDate() + 1); // Logic for Next Day early morning if needed, 
                // But wait, our 'totalMinutes' starts from 6:00 today (360) to 30:00 (next day 6:00).
                // So h >= 24 means next day. 
                // However, `new Date()` defaults to today. 
                // If h=25 (01:00 next day), `setHours(25)` handles it correctly by rolling over!
                // But we must be careful about `setHours` behavior. `setHours(25)` works.

                const isOccupied = reservations.some((r: any) => {
                    if (r.tableId !== selectedTable.id || r.status === 'CANCELLED') return false;
                    const rStart = new Date(r.startTime);
                    const rEnd = new Date(r.endTime);
                    // Check if this slot [slotDate, slotDate+30m?) falls inside usage?
                    // "Start Time" selection means "Can I START at this time?"
                    // So we verify if `slotDate` is strictly inside an existing reservation? 
                    // Or if any reservation exists that overlaps [slotDate, slotDate + minDuration]?
                    // Detailed: If 19:00-21:00 is booked.
                    // Can I book 19:00? No.
                    // Can I book 18:30? Yes (until 19:00).
                    // Can I book 20:59? No.
                    // Can I book 21:00? Yes.

                    // Logic: Is slotDate inside [rStart, rEnd)?
                    return slotDate >= rStart && slotDate < rEnd;
                });

                if (isOccupied) return null;
            }

            return {
                label: `${displayH}:${String(m).padStart(2, '0')}`,
                value: `${displayH}:${String(m).padStart(2, '0')}`,
                rawH: h,
                totalMinutes
            };
        }).filter(Boolean);
    };

    const timeSlots = getFilteredTimeSlots();

    const getFilteredEndSlots = () => {
        if (!bookingData.time) return [];
        const [sh, sm] = bookingData.time.split(':').map(Number);

        // Logical start minutes (handle 25:00 etc)
        let startMinutes = sh * 60 + sm;
        if (sh < 6) startMinutes += 24 * 60; // If start time is e.g. 01:00, treat it as next day's 01:00 for comparison

        // Determine the ceiling (next reservation start time)
        let nextResStartMinutes = Infinity;
        if (selectedTable) {
            // Re-construct selected start date object to compare
            const startDate = new Date();
            startDate.setHours(sh, sm, 0, 0);
            if (sh < 6) startDate.setDate(startDate.getDate() + 1); // Adjust for 01:00 input relative to today

            // Find earliest reservation starting AFTER or AT startDate?
            // Actually strictly AFTER startDate, because if specific startDate is occupied, it was filtered out above.
            // But wait, if someone books 19:00 and there is a 20:00 res.
            // Next res start is 20:00.

            reservations.forEach((r: any) => {
                if (r.tableId !== selectedTable.id || r.status === 'CANCELLED') return;
                const rStart = new Date(r.startTime);

                if (rStart > startDate) {
                    // Convert rStart to minutes from today's 0:00 (rough approx)
                    // Better: diff in minutes
                    const diffMinutes = (rStart.getTime() - startDate.getTime()) / 60000;
                    const rStartMinutes = startMinutes + diffMinutes;
                    if (rStartMinutes < nextResStartMinutes) {
                        nextResStartMinutes = rStartMinutes;
                    }
                }
            });
        }

        // Base 24h slots logic
        return Array.from({ length: 48 }, (_, i) => {
            const totalMinutes = (6 * 60) + (i * 30);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            const displayH = h >= 24 ? h - 24 : h;
            return {
                label: `${displayH}:${String(m).padStart(2, '0')}`,
                value: `${displayH}:${String(m).padStart(2, '0')}`,
                totalMinutes
            };
        }).filter(s => {
            // must be > start
            if (s.totalMinutes <= startMinutes) return false;
            // must be <= next reservation start
            if (s.totalMinutes > nextResStartMinutes) return false;
            return true;
        });
    };

    const endSlots = getFilteredEndSlots();

    const getPrice = () => {
        if (!bookingData.partySize) return null;

        // Ensure accurate dates for price calc
        // Start
        const [sh, sm] = bookingData.time.split(':').map(Number);
        const start = new Date();
        start.setHours(sh, sm, 0, 0);
        if (sh < 6) start.setDate(start.getDate() + 1);

        // End
        const [eh, em] = bookingData.endTime.split(':').map(Number);
        const end = new Date();
        end.setHours(eh, em, 0, 0);
        if (eh < 6) end.setDate(end.getDate() + 1);
        if (end <= start) end.setDate(end.getDate() + 1);

        // Debug Log (Can verify via console if needed)
        // console.log("Calc Price:", start.toISOString(), end.toISOString(), selectedTable?.id === 'VIP');

        const p = calculatePrice(
            start,
            end,
            Number(bookingData.partySize),
            selectedTable?.name === 'VIP' // Check name, not ID
        );
        return p.totalAmount;
    };

    const estimatedTotal = getPrice();

    return (
        <div className="space-y-6 pb-24">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-black text-slate-800">フロア空席状況</h2>
                <Badge color="green">リアルタイム</Badge>
            </div>

            {/* Floor Map */}
            <div className="flex-1 relative overflow-hidden bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
                <FloorMap
                    tables={tables}
                    reservations={reservations}
                    onTableClick={(table: any) => {
                        setSelectedTable(table);
                        // Default time to next hour, but need to check if valid?
                        // Just set defaults.
                        const now = new Date();
                        const h = now.getHours() + 1;
                        setBookingData(prev => ({
                            ...prev,
                            time: `${h}:00`,
                            endTime: "", // User must select
                            partySize: "" // Ensure reset
                        }));
                    }}
                    selectedTableId={selectedTable?.id}
                />
            </div>

            {/* Bottom Sheet for Booking */}
            {selectedTable && (
                <>
                    {/* Backdrop for click-outside */}
                    <div
                        className="fixed inset-0 bg-black/30 z-[49] animate-in fade-in"
                        onClick={() => setSelectedTable(null)}
                    />

                    <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-6 animate-in slide-in-from-bottom border-t border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">{selectedTable.name}</h3>
                                <p className="text-xs text-slate-500 font-medium">{selectedTable.capacityMin}-{selectedTable.capacityMax}名まで利用可</p>
                            </div>
                            <Button variant="ghost" onClick={() => setSelectedTable(null)} className="rounded-full h-8 w-8 p-0 bg-slate-100 text-slate-500 hover:bg-slate-200">
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">来店時間</label>
                                    <select
                                        className="w-full h-10 rounded-lg border-slate-200 text-sm font-medium bg-slate-50 focus:ring-2 focus:ring-blue-500"
                                        value={bookingData.time}
                                        onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                                    >
                                        <option value="">選択</option>
                                        {timeSlots.map(t => (
                                            <option key={t?.value} value={t?.value}>{t?.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">終了時間 (目安)</label>
                                    <select
                                        className="w-full h-10 rounded-lg border-slate-200 text-sm font-medium bg-slate-50 focus:ring-2 focus:ring-blue-500"
                                        value={bookingData.endTime}
                                        onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                                        disabled={!bookingData.time}
                                    >
                                        <option value="">選択</option>
                                        {endSlots.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">人数</label>
                                    <Input
                                        type="number"
                                        className={`w-full border-slate-200 h-10 ${!bookingData.partySize ? 'bg-slate-100' : 'bg-white'}`}
                                        value={bookingData.partySize}
                                        onChange={(e: any) => setBookingData({ ...bookingData, partySize: e.target.value })}
                                        placeholder="人数を入れると金額が表示されます"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">代表者名</label>
                                    <Input
                                        className="w-full bg-slate-50 border-slate-200 h-10"
                                        value={bookingData.name}
                                        onChange={(e: any) => setBookingData({ ...bookingData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">電話番号</label>
                                    <Input
                                        className="w-full bg-slate-50 border-slate-200 h-10"
                                        type="tel"
                                        value={bookingData.phone}
                                        onChange={(e: any) => setBookingData({ ...bookingData, phone: e.target.value })}
                                        placeholder="090-0000-0000"
                                    />
                                </div>
                            </div>

                            {/* Price Estimation */}
                            {estimatedTotal ? (
                                <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center text-blue-900 border border-blue-100 animate-in fade-in">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold opacity-80">想定合計金額</span>
                                        <span className="text-[10px] opacity-60">※チャージ料・VIP料含む</span>
                                    </div>
                                    <span className="text-2xl font-black tracking-tight">¥{estimatedTotal.toLocaleString()}~</span>
                                </div>
                            ) : (
                                <div className="bg-slate-100 rounded-xl p-4 text-center border-2 border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                                    人数を入力すると金額が表示されます
                                </div>
                            )}

                            <Button
                                className="w-full h-14 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all bg-blue-600 hover:bg-blue-700"
                                onClick={() => setConfirmModalOpen(true)}
                                disabled={loading}
                            >
                                {loading ? "処理中..." : "確認へ進む"}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Confirmation Modal */}
            {confirmModalOpen && selectedTable && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-6">
                        <div className="text-center space-y-2 border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-black text-slate-800">予約内容の確認</h3>
                            <p className="text-sm text-slate-500">以下の内容で予約を確定しますか？</p>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-500 font-bold">テーブル</span>
                                <span className="font-bold text-slate-800">{selectedTable.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-500 font-bold">来店・終了</span>
                                <span className="font-bold text-slate-800 text-right">
                                    {bookingData.time} 〜 {bookingData.endTime}<br />
                                    <span className="text-xs text-slate-400 font-normal">※当日のリアルタイム予約</span>
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-500 font-bold">人数</span>
                                <span className="font-bold text-slate-800">{bookingData.partySize}名様</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-500 font-bold">お名前</span>
                                <span className="font-bold text-slate-800">{bookingData.name}様</span>
                            </div>
                            {estimatedTotal && (
                                <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center text-blue-900 font-bold">
                                    <span>概算見積</span>
                                    <span>¥{estimatedTotal.toLocaleString()}~</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="secondary"
                                className="flex-1 font-bold"
                                onClick={() => setConfirmModalOpen(false)}
                                disabled={loading}
                            >
                                戻る
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 text-white font-bold shadow-lg shadow-blue-200"
                                onClick={handleQuickBook}
                                disabled={loading}
                            >
                                {loading ? "予約中..." : "予約確定"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {!selectedTable && (
                <div className="bg-slate-100/50 rounded-2xl p-6 text-center border-2 border-dashed border-slate-200 mx-1">
                    <p className="text-xs font-medium text-slate-400">
                        マップ上の空席（白）をタップ<br />
                        <span className="text-[10px] opacity-70">24時間いつでも予約可能です</span>
                    </p>
                </div>
            )}
        </div>
    );
};
