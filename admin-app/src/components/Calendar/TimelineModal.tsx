import { useRef, useEffect, useState } from "react";
import { Button, Card, Badge, Input } from "../UI";
import { X, Clock, User, Phone, Plus, LogOut } from "lucide-react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "";

export const TimelineModal = ({ table, reservations, onClose, onReservationClick, onUpdate }: any) => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newRes, setNewRes] = useState({
        name: "",
        phone: "",
        time: "",
        endTime: "",
        partySize: table ? table.capacityMin : 2,
        phoneUnknown: false
    });
    const [loading, setLoading] = useState(false);

    const currentActiveRes = reservations.find((r: any) => {
        if (r.tableId !== table.id || r.status === 'CANCELLED') return false;
        const now = new Date();
        const start = new Date(r.startTime);
        const end = new Date(r.endTime);
        return now >= start && now < end;
    });

    const handleWalkIn = async () => {
        if (!confirm("飛び入り来店として登録しますか？\n(原則12時間、または次の予約まで稼働中となります)")) return;
        setLoading(true);
        try {
            const start = new Date();
            let end = new Date(start.getTime() + 12 * 60 * 60 * 1000); // 12 Hours default

            // Check for next reservation to clamp end time
            const nextRes = reservations
                .filter((r: any) => r.tableId === table.id && r.status !== 'CANCELLED')
                .map((r: any) => ({ ...r, start: new Date(r.startTime) }))
                .filter((r: any) => r.start > start)
                .sort((a: any, b: any) => a.start.getTime() - b.start.getTime())[0];

            if (nextRes) {
                if (nextRes.start < end) {
                    end = nextRes.start; // Clamp to next reservation start
                }
            }

            await axios.post(`${apiBase}/api/reservations`, {
                tableId: table.id,
                customerName: "Walk-in (飛入)",
                customerPhone: "00000",
                partySize: table.capacityMin,
                startTime: start.toISOString(),
                endTime: end.toISOString()
            });

            alert("飛入来店を登録しました");
            if (onUpdate) onUpdate();
            onClose(); // Close modal on success? Or keep open? Maybe close to see map update.
        } catch (e: any) {
            console.error(e);
            alert("登録失敗: " + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!currentActiveRes) return;
        if (!confirm("退店・席を解放しますか？\n(現在の予約は現在時刻で終了します)")) return;
        setLoading(true);
        try {
            const now = new Date();
            // Ensure end > start (if checking out instantly after verify? practically mostly ok)
            // If now < start (impossible if active), but if created 1ms ago?
            // Just force now.

            await axios.put(`${apiBase}/api/reservations/${currentActiveRes.id}`, {
                endTime: now.toISOString()
            });

            alert("席を解放しました");
            if (onUpdate) onUpdate();
            onClose();
        } catch (e: any) {
            console.error(e);
            alert("更新失敗: " + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    // Reset state when table changes
    useEffect(() => {
        if (table) {
            setNewRes(prev => ({ ...prev, partySize: table.capacityMin }));
        }
    }, [table]);

    const handleCreate = async () => {
        if (!newRes.name || !newRes.time || !newRes.endTime || (!newRes.phone && !newRes.phoneUnknown)) {
            alert("必須項目を入力してください");
            return;
        }
        setLoading(true);
        try {
            const now = new Date();
            const [h, m] = newRes.time.split(':').map(Number);

            const start = new Date();
            start.setHours(h, m, 0, 0);

            // If hours < 6, add 1 day (next day early morning)
            if (h < 6) {
                start.setDate(start.getDate() + 1);
            }

            let end;
            if (newRes.endTime) {
                const [eh, em] = newRes.endTime.split(':').map(Number);
                end = new Date(start);
                // Handle crossing midnight for end time
                if (eh < h) {
                    end.setDate(end.getDate() + 1);
                }
                end.setHours(eh, em, 0, 0);
            } else {
                end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
            }

            await axios.post(`${apiBase}/api/reservations`, {
                tableId: table.id,
                customerName: newRes.name,
                customerPhone: newRes.phoneUnknown ? "00000" : newRes.phone,
                partySize: Number(newRes.partySize),
                startTime: start.toISOString(),
                endTime: end.toISOString()
            });

            alert("予約を作成しました");
            setShowCreateForm(false);
            setNewRes({ name: "", phone: "", time: "", endTime: "", partySize: table.capacityMin, phoneUnknown: false });
            if (onUpdate) onUpdate();
        } catch (e: any) {
            console.error(e);
            const msg = e.response?.data?.error || e.message || "予約作成に失敗しました";
            alert(`予約作成失敗: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    // Show 06:00 to 30:00 (next day 6:00) - Full 24h
    const timelineStart = 6;
    const timelineEnd = 30;
    const totalHours = timelineEnd - timelineStart;

    const modalRef = useRef<HTMLDivElement>(null);

    // Set default time to current hour (or next hour)
    useEffect(() => {
        if (table) {
            const now = new Date();
            let h = now.getHours();
            // If late night (0-5), treat as 24+
            if (h < 6) h += 24;

            // Default to next hour
            const nextH = h + 1;
            const displayH = nextH >= 24 ? nextH - 24 : nextH;

            setNewRes(prev => ({
                ...prev,
                partySize: table.capacityMin,
                time: `${displayH}:00`,
                endTime: `${displayH + 2}:00`
            }));
        }
    }, [table]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const getPosition = (dateStr: string) => {
        const d = new Date(dateStr);
        let hours = d.getHours();

        // Handle logic for "next day" hours in our timeline (e.g. 0-5 AM is 24-29)
        // If hour < timelineStart, assume it's next day (e.g. 1am < 12pm)
        if (hours < timelineStart) hours += 24;

        const minutes = d.getMinutes();
        const time = hours + minutes / 60;

        if (time < timelineStart) return 0;
        if (time > timelineEnd) return 100;

        return ((time - timelineStart) / totalHours) * 100;
    };

    const getDurationWidth = (startStr: string, endStr: string) => {
        const start = getPosition(startStr);
        const end = getPosition(endStr);
        return Math.max(end - start, 1); // Minimum width
    };

    // Filter reservations for this table
    const tableReservations = reservations
        .filter((r: any) => r.tableId === table.id)
        .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div ref={modalRef} className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            {table.name}
                            <Badge color={table.isSmoking ? 'red' : 'green'}>{table.category}</Badge>
                        </h3>
                        <p className="text-sm text-slate-500">本日の予約スケジュール ({tableReservations.length}件)</p>
                    </div>
                    <Button variant="secondary" onClick={onClose}><X size={20} /></Button>
                </div>

                <div className="p-6 overflow-x-auto">
                    {/* Time Scale */}
                    <div className="relative h-8 border-b mb-4 min-w-[600px]">
                        {Array.from({ length: totalHours + 1 }).map((_, i) => {
                            const hour = timelineStart + i;
                            const label = hour >= 24 ? `${hour - 24}:00` : `${hour}:00`;

                            // Show label every 2 hours (e.g. 6, 8, 10...)
                            const showLabel = hour % 2 === 0;

                            return (
                                <div
                                    key={hour}
                                    className={`absolute text-xs text-slate-400 border-l border-slate-200 h-2 pl-1 top-0`}
                                    style={{ left: `${(i / totalHours) * 100}%` }}
                                >
                                    {showLabel && <span>{label}</span>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Timeline Bar */}
                    <div className="relative h-16 bg-slate-50 rounded-lg min-w-[600px] border">
                        {tableReservations.map((res: any) => (
                            <div
                                key={res.id}
                                className="absolute top-2 bottom-2 bg-blue-500 rounded-md shadow-sm text-white text-xs flex items-center px-2 overflow-hidden whitespace-nowrap cursor-pointer hover:bg-blue-600 transition-colors"
                                style={{
                                    left: `${getPosition(res.startTime)}%`,
                                    width: `${getDurationWidth(res.startTime, res.endTime)}%`
                                }}
                                title={`${res.customerName}様 (${res.partySize}名)`}
                                onClick={() => onReservationClick && onReservationClick(res)}
                            >
                                <span className="font-bold mr-1">{new Date(res.startTime).getHours()}:{String(new Date(res.startTime).getMinutes()).padStart(2, '0')}</span>
                                {res.customerName}
                            </div>
                        ))}

                        {tableReservations.length === 0 && (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                                予約はありません
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-between items-center gap-2">
                    <div className="flex gap-2">
                        {!currentActiveRes ? (
                            <>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleWalkIn} disabled={loading}>
                                    <Clock size={16} className="mr-1" /> 飛入来店 (12H稼働)
                                </Button>
                                {!showCreateForm && (
                                    <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                                        <Plus size={16} className="mr-1" /> 詳細予約
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCheckout} disabled={loading}>
                                <LogOut size={16} className="mr-1" /> 退店・席解放
                            </Button>
                        )}
                    </div>

                    {showCreateForm && (
                        <Button variant="secondary" onClick={() => setShowCreateForm(false)}>キャンセル</Button>
                    )}
                    <Button variant="ghost" onClick={onClose}>閉じる</Button>
                </div>

                {showCreateForm && (
                    <div className="p-4 bg-blue-50 border-t space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <h4 className="font-bold text-blue-800 text-sm">簡易新規予約 (本日)</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newRes.time}
                                onChange={(e: any) => setNewRes({ ...newRes, time: e.target.value, endTime: "" })}
                            >
                                <option value="">開始時刻</option>
                                {Array.from({ length: (totalHours * 2) }).map((_, i) => {
                                    const h = Math.floor(i / 2) + timelineStart;
                                    const m = i % 2 === 0 ? "00" : "30";
                                    const displayH = h >= 24 ? h - 24 : h;

                                    // Disable if occupied
                                    // Calculate Date for this slot
                                    const now = new Date();
                                    const slotDate = new Date();
                                    slotDate.setHours(displayH, m === "30" ? 30 : 0, 0, 0);
                                    if (h >= 24) slotDate.setDate(slotDate.getDate() + 1);

                                    // Check if this slot falls within any existing reservation
                                    const isOccupied = tableReservations.some((r: any) => {
                                        const rStart = new Date(r.startTime);
                                        const rEnd = new Date(r.endTime);
                                        // Occupied if: rStart <= slot < rEnd
                                        return slotDate >= rStart && slotDate < rEnd;
                                    });

                                    return (
                                        <option key={i} value={`${displayH}:${m}`} disabled={isOccupied}>
                                            {displayH}:{m} {isOccupied ? '(予約済)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newRes.endTime}
                                onChange={(e: any) => setNewRes({ ...newRes, endTime: e.target.value })}
                                disabled={!newRes.time}
                            >
                                <option value="">終了時刻 (必須)</option>
                                {Array.from({ length: (totalHours * 2) }).map((_, i) => {
                                    const h = Math.floor(i / 2) + timelineStart;
                                    const m = i % 2 === 0 ? "00" : "30";
                                    const displayH = h >= 24 ? h - 24 : h;
                                    const val = `${displayH}:${m}`;

                                    if (!newRes.time) return null;

                                    const [sh, sm] = newRes.time.split(':').map(Number);
                                    let sVal = sh + sm / 60;
                                    if (sh < 6) sVal += 24;

                                    let cVal = h + (m === "30" ? 0.5 : 0);
                                    if (h < 6) cVal += 24;

                                    // 1. Must be after start time
                                    if (cVal <= sVal) return null;

                                    // 2. Identify Next Reservation
                                    // Find all reservations for this table today/tonight
                                    // Sort by time. Find the first one that starts >= sVal

                                    // Calculate selected start Date object for comparison
                                    const now = new Date();
                                    const startDate = new Date();
                                    startDate.setHours(sh, sm, 0, 0);
                                    if (sh < 6) startDate.setDate(startDate.getDate() + 1);

                                    const nextRes = tableReservations.find((r: any) => {
                                        const rStart = new Date(r.startTime);
                                        return rStart.getTime() >= startDate.getTime();
                                    });

                                    if (nextRes) {
                                        const nr = new Date(nextRes.startTime);
                                        let nh = nr.getHours();
                                        let nm = nr.getMinutes();
                                        let nVal = nh + nm / 60;
                                        if (nh < 6) nVal += 24;

                                        // If this option (cVal) is > next reservation start (nVal), disable or hide it.
                                        // We allow cVal == nVal (End time = Next Start time is allowed gapless)
                                        if (cVal > nVal) return null;
                                    }

                                    return (
                                        <option key={i} value={val}>
                                            {displayH}:{m}
                                        </option>
                                    );
                                })}
                            </select>
                            <Input
                                placeholder="人数"
                                type="number"
                                value={newRes.partySize}
                                onChange={(e: any) => setNewRes({ ...newRes, partySize: e.target.value })}
                                icon={<User size={14} />}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                placeholder="お名前"
                                value={newRes.name}
                                onChange={(e: any) => setNewRes({ ...newRes, name: e.target.value })}
                            />
                            <div className="space-y-1">
                                <Input
                                    placeholder="電話番号"
                                    value={newRes.phone}
                                    onChange={(e: any) => setNewRes({ ...newRes, phone: e.target.value })}
                                    icon={<Phone size={14} />}
                                    disabled={newRes.phoneUnknown}
                                />
                                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newRes.phoneUnknown}
                                        onChange={(e) => setNewRes({ ...newRes, phoneUnknown: e.target.checked })}
                                    />
                                    電話番号不明/なし
                                </label>
                            </div>
                        </div>
                        <Button className="w-full" onClick={handleCreate} disabled={loading}>
                            {loading ? '作成中...' : '予約を確定する'}
                        </Button>
                    </div>
                )}
            </div>
        </div >
    );
};
