import { useRef, useEffect, useState } from "react";
import { Button, Card, Badge, Input } from "../UI";
import { X, Clock, User, Phone, Plus } from "lucide-react";
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

    // Reset state when table changes (if modal reuses component, though it's conditional render)
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
    // Show 12:00 to 29:00 (next day 5:00)
    const timelineStart = 12;
    const timelineEnd = 30; // Until 6:00 next day
    const totalHours = timelineEnd - timelineStart;

    const modalRef = useRef<HTMLDivElement>(null);

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
        if (hours < 12) hours += 24; // Handle after midnight logic (simplified)
        // Wait, if start is 12, then 0..11 are next day?
        // Let's refine:
        // If hour < timelineStart, assume it's next day (e.g. 1am < 12pm)
        if (hours < timelineStart) hours += 24;

        const minutes = d.getMinutes();
        const time = hours + minutes / 60;

        if (time < timelineStart) return 0;
        if (time > timelineEnd) return 100;

        return ((time - timelineStart) / totalHours) * 100;
    };

    // ... (skip getDurationWidth, it uses getPosition so it logic holds)

    // ... (skip render, scroll down to select generation)

    // ... INSIDE RENDER ...

    <option value="">開始時刻</option>
    {
        Array.from({ length: (totalHours * 2) }).map((_, i) => {
            const h = Math.floor(i / 2) + timelineStart;
            const m = i % 2 === 0 ? "00" : "30";
            const displayH = h >= 24 ? h - 24 : h;

            // Disable if occupied
            // Calculate Date for this slot
            const now = new Date();
            const slotDate = new Date();
            slotDate.setHours(displayH, m === "30" ? 30 : 0, 0, 0);
            if (h >= 24) slotDate.setDate(slotDate.getDate() + 1); // fix date logic

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
        })
    }
                            </select >
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
                        </div >
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
                    </div >
                )}
            </div >
        </div >
    );
};
