
import { useState } from "react";
import { Button, Card, Input } from "../UI";
import { X, Clock, User, Phone } from "lucide-react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "";

// Generate time slots (06:00 - 30:00) with 30 min intervals
const TIME_SLOTS = Array.from({ length: (24 * 2) + 1 }, (_, i) => {
    const totalMinutes = (6 * 60) + (i * 30); // Start at 06:00
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const displayH = hour >= 24 ? hour - 24 : hour;
    const time = `${String(displayH).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { label: time, value: time, rawHour: hour };
}).filter(t => t.rawHour <= 30);

export const ReservationActionModal = ({ reservation, reservations = [], onClose, onUpdate }: any) => {
    const [isEditing, setIsEditing] = useState(false);

    // Helper to format time from Date string
    const fmtTime = (d: string) => {
        const date = new Date(d);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const [editData, setEditData] = useState({
        name: reservation.customerName,
        phone: reservation.customerPhone || "",
        partySize: reservation.partySize,
        time: fmtTime(reservation.startTime),
        endTime: fmtTime(reservation.endTime)
    });

    const handleCancel = async () => {
        if (confirm("本当にこの予約をキャンセルしますか？")) {
            try {
                await axios.put(`${apiBase}/api/reservations/${reservation.id}`, { status: "CANCELLED" });
                alert("キャンセルしました");
                await onUpdate();
                onClose();
            } catch (e) {
                console.error(e);
                alert("キャンセルに失敗しました");
            }
        }
    };

    const handleSave = async () => {
        try {
            // Calculate new times
            const [h, m] = editData.time.split(':').map(Number);
            const start = new Date(reservation.startTime);
            start.setHours(h, m, 0, 0);

            // End Time from editData
            const [eh, em] = editData.endTime.split(':').map(Number);
            const end = new Date(reservation.startTime);
            end.setHours(eh, em, 0, 0);

            // Handle date crossing (if end time is earlier than start time, assume next day)
            if (eh < h || (eh === h && em <= m)) {
                end.setDate(end.getDate() + 1);
            }

            await axios.put(`${apiBase}/api/reservations/${reservation.id}`, {
                customerName: editData.name,
                customerPhone: editData.phone,
                partySize: Number(editData.partySize),
                startTime: start.toISOString(),
                endTime: end.toISOString()
            });

            alert("予約を更新しました");
            setIsEditing(false);
            onUpdate();
        } catch (e) {
            console.error(e);
            alert("更新に失敗しました");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={onClose}>
            <Card className="w-full max-w-md bg-white p-6 relative shadow-xl" onClick={(e: any) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
                <h2 className="text-xl font-bold mb-6 border-b pb-2">予約詳細・操作</h2>

                {!isEditing ? (
                    <div className="space-y-4 text-slate-700">
                        <div className="flex items-center gap-3">
                            <User className="text-blue-500" />
                            <div>
                                <div className="text-xs text-slate-400">お名前</div>
                                <div className="font-bold text-lg">{reservation.customerName} 様</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Phone className="text-blue-500" />
                            <div>
                                <div className="text-xs text-slate-400">電話番号</div>
                                <div className="font-medium text-lg">{reservation.customerPhone || "未登録"}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Clock className="text-blue-500" />
                            <div>
                                <div className="text-xs text-slate-400">日時</div>
                                <div className="font-medium text-lg">
                                    {new Date(reservation.startTime).toLocaleDateString()} <br />
                                    {new Date(reservation.startTime).getHours()}:{String(new Date(reservation.startTime).getMinutes()).padStart(2, '0')} -
                                    {new Date(reservation.endTime).getHours()}:{String(new Date(reservation.endTime).getMinutes()).padStart(2, '0')}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-6 text-center text-blue-500 font-bold">
                                {reservation.partySize}
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">人数</div>
                                <div className="font-medium text-lg">{reservation.partySize}名</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                            日時などを変更できます
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">開始時間</label>
                                <select
                                    className="input-field h-10"
                                    value={editData.time}
                                    onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                                >
                                    {TIME_SLOTS.map((slot) => {
                                        // Check overlaps with OTHER reservations for this table
                                        const [h, m] = slot.value.split(':').map(Number);
                                        const resDate = new Date(reservation.startTime);
                                        const slotStart = new Date(resDate);
                                        slotStart.setHours(h, m, 0, 0);

                                        // Simple instantaneous check: Is this time inside another reservation?
                                        const isOccupied = reservations.some((r: any) => {
                                            if (r.id === reservation.id) return false; // Ignore self
                                            if (r.tableId !== reservation.tableId) return false;
                                            if (r.status === 'CANCELLED') return false;
                                            const rStart = new Date(r.startTime);
                                            const rEnd = new Date(r.endTime);
                                            return slotStart >= rStart && slotStart < rEnd;
                                        });

                                        return (
                                            <option key={slot.value} value={slot.value} disabled={isOccupied}>
                                                {slot.label} {isOccupied ? '(予約済)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">終了時間</label>
                                <select
                                    className="input-field h-10"
                                    value={editData.endTime}
                                    onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                                >
                                    {TIME_SLOTS.map((slot) => {
                                        return (
                                            <option key={slot.value} value={slot.value}>
                                                {slot.label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="お名前"
                                value={editData.name}
                                onChange={(e: any) => setEditData({ ...editData, name: e.target.value })}
                            />
                            <Input
                                label="電話番号"
                                value={editData.phone}
                                onChange={(e: any) => setEditData({ ...editData, phone: e.target.value })}
                            />
                        </div>
                        <Input
                            label="人数"
                            type="number"
                            value={editData.partySize}
                            onChange={(e: any) => setEditData({ ...editData, partySize: e.target.value })}
                        />
                    </div>
                )}

                <div className="flex items-center gap-3 mt-8 pt-4 border-t">
                    <Button variant="danger" className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-red-200 h-10" onClick={handleCancel}>
                        取消
                    </Button>
                    {!isEditing ? (
                        <Button variant="primary" className="flex-1 h-10" onClick={() => setIsEditing(true)}>
                            予約変更
                        </Button>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>キャンセル</Button>
                            <Button variant="primary" className="flex-1" onClick={handleSave}>保存する</Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
