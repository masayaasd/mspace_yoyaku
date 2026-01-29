
import React from "react";
import { Badge } from "./UI";

const TableNode = ({ table, style, label, status, reservations, conflictTime, checkTime }: any) => {
    let bgClass = 'bg-white border-slate-200';
    let ringClass = '';
    let textColor = 'text-slate-800';

    if (status === 'occupied') {
        bgClass = 'bg-red-50 border-red-100 opacity-60';
        textColor = 'text-red-500';
    } else if (status === 'selected') {
        bgClass = 'bg-blue-600 border-blue-600';
        textColor = 'text-white';
    } else if (status === 'available') {
        bgClass = 'bg-white border-blue-400 ring-2 ring-blue-50 active:scale-95';
        textColor = 'text-blue-900';
    }

    const getStatusText = () => {
        if (status === 'occupied') {
            return conflictTime ? `稼働中(${conflictTime})` : '稼働中';
        }
        if (status === 'available') {
            if (reservations) {
                // Use the checked time (for booking or realtime look) as baseline
                const baseline = checkTime ? new Date(checkTime) : new Date();

                const upcoming = reservations
                    .filter((r: any) => r.tableId === table.id && r.status !== 'CANCELLED')
                    .map((r: any) => ({ ...r, start: new Date(r.startTime) }))
                    .filter((r: any) => r.start > baseline)
                    .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());

                if (upcoming.length > 0) {
                    const next = upcoming[0];
                    const now = new Date();
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const isToday = next.start.toDateString() === now.toDateString();
                    const isTomorrow = next.start.toDateString() === tomorrow.toDateString();

                    const h = next.start.getHours();
                    const m = next.start.getMinutes();
                    const timeStr = `${h}:${String(m).padStart(2, '0')}`;

                    if (isToday) {
                        return `空席(次${timeStr})`;
                    } else if (isTomorrow) {
                        return `空席(翌${timeStr})`;
                    }
                    // Hide if after tomorrow
                    return '空席';
                }
            }
            return '空席';
        }
        return '';
    };

    return (
        <div
            className={`absolute flex flex-col items-center justify-center border shadow-sm transition-all duration-200 
        ${bgClass} ${ringClass}
      `}
            style={{
                ...style,
                borderRadius: table.name.includes("丸") ? "50%" : "8px",
            }}
        >
            <span className={`font-black text-sm text-center px-1 leading-tight ${textColor}`}>
                {label || table.name}
            </span>

            <span className={`text-xs font-bold mt-0.5 ${textColor} bg-white/50 px-1 rounded text-center`}>
                {getStatusText()}
            </span>
        </div>
    );
};

export const FloorMap = ({ tables, reservations, onTableClick, selectedTableId, checkTime, checkEndTime }: any) => {

    const getTable = (id: string) => {
        return tables.find((t: any) => t.name.includes(id) || t.id.toString() === id);
    };

    const getTableStatusAndConflict = (tableId: string) => {
        if (selectedTableId === tableId) return { status: 'selected', conflict: null };

        const checkStart = checkTime ? new Date(checkTime) : new Date();
        const checkEnd = checkEndTime ? new Date(checkEndTime) : new Date(checkStart.getTime() + 60 * 60 * 1000); // Default 1h if not set

        let conflictRes = null;

        const isOccupied = reservations?.some((r: any) => {
            if (r.tableId !== tableId) return false;
            if (r.status === 'CANCELLED') return false;

            const rStart = new Date(r.startTime);
            const rEnd = new Date(r.endTime);

            // Overlap check
            // (StartA < EndB) and (EndA > StartB)
            if (checkStart < rEnd && checkEnd > rStart) {
                conflictRes = r;
                return true;
            }
            return false;
        });

        let conflictStr = null;
        if (conflictRes) {
            const s = new Date(conflictRes.startTime);
            const e = new Date(conflictRes.endTime);
            const sStr = `${s.getHours()}:${String(s.getMinutes()).padStart(2, '0')}`;
            const eStr = `${e.getHours()}:${String(e.getMinutes()).padStart(2, '0')}`;
            conflictStr = `${sStr}-${eStr}`;
        }

        return {
            status: isOccupied ? 'occupied' : 'available',
            conflict: conflictStr
        };
    };

    // Unified Node Layout (Expanded to reduce right whitespace)
    const nodes = [
        // --- Top Row ---
        // Left: 9名卓
        { id: "T01", style: { top: "2%", left: "2%", width: "47%", height: "20%" }, label: "9名卓(T01)" },
        // Right: 9名卓
        { id: "T02", style: { top: "2%", left: "51%", width: "47%", height: "20%" }, label: "9名卓(T02)" },

        // --- Middle Row ---
        // Left: 6名卓
        { id: "T03", style: { top: "25%", left: "2%", width: "29%", height: "20%", borderRadius: "4px" }, label: "6名卓(T03)" },
        // Center: 9名卓 (Vertical)
        { id: "T04", style: { top: "24%", left: "33%", width: "32%", height: "35%", borderRadius: "4px" }, label: "9名卓(T04)" },
        // Right: 6名卓
        { id: "T05", style: { top: "25%", left: "67%", width: "29%", height: "20%", borderRadius: "4px" }, label: "6名卓(T05)" },

        // --- Bottom Row ---
        // Left: 6名卓 (Smoking)
        { id: "T06", style: { top: "50%", left: "2%", width: "29%", height: "20%", borderRadius: "4px" }, label: "6名卓(T06)" },

        // T07 (Bottom Left Smoking):
        { id: "T07", style: { top: "75%", left: "2%", width: "29%", height: "20%", borderRadius: "4px" }, label: "6名卓(T07)" },
        { id: "T07_Label", isLabel: true, style: { top: "96%", left: "2%", width: "29%", height: "5%", fontSize: "11px", color: "#333", textAlign: "center" as const }, label: "(喫煙)" },

        // T08 (Bottom Center Smoking):
        { id: "T08", style: { top: "75%", left: "33%", width: "30%", height: "20%", borderRadius: "4px" }, label: "4~6名(T08)" },
        { id: "T08_Label", isLabel: true, style: { top: "96%", left: "33%", width: "30%", height: "5%", fontSize: "11px", color: "#333", textAlign: "center" as const }, label: "(喫煙)" },

        // Reception Node (Visual)
        { id: "RECEPTION", style: { top: "62%", left: "33%", width: "30%", height: "15%", border: "2px solid #333", background: "#fff" }, label: "受付", isStatic: true },

        // VIP (Right Side)
        { id: "VIP", style: { top: "50%", left: "67%", width: "29%", height: "20%", borderRadius: "4px", border: "2px solid #000" }, label: "VIP" },
    ];

    return (
        <div className="relative w-full aspect-[4/4] bg-white border-2 border-slate-800 rounded-none overflow-hidden p-2">
            {nodes.map((node: any, idx) => {
                if (node.isLabel) {
                    return (
                        <div key={`label-${idx}`} className="absolute font-bold items-center justify-center flex" style={node.style}>
                            {node.label}
                        </div>
                    );
                }

                if (node.isStatic) {
                    return (
                        <div key={`static-${idx}`} className="absolute flex items-center justify-center font-bold text-slate-400 text-xs" style={node.style}>
                            {node.label}
                        </div>
                    );
                }

                const tableData = getTable(node.id);
                if (!tableData) return null;

                const { status, conflict } = getTableStatusAndConflict(tableData.id);

                return (
                    <div key={node.id} onClick={() => status !== 'occupied' && onTableClick && onTableClick(tableData, status === 'occupied')}>
                        <TableNode
                            table={tableData}
                            label={node.label}
                            style={node.style}
                            status={status}
                            reservations={reservations}
                            conflictTime={conflict}
                            checkTime={checkTime}
                        />
                    </div>
                );
            })}
        </div>
    );
};
