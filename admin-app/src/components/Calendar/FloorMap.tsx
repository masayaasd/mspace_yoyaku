import { useNavigate } from "react-router-dom";
import { Badge } from "../UI";

const TableNode = ({ table, reservationCount, style, label, status, reservations }: any) => {
    const isVIP = table.name === "VIP";

    let bgClass = isVIP ? 'bg-amber-100 border-amber-300' : 'bg-white border-slate-300';
    let ringClass = '';
    let statusLabel = null;

    if (status === 'occupied') {
        bgClass = 'bg-red-50 border-red-200'; // Make it red-ish for occupied
        // Find current active reservation to show end time
        const now = new Date();
        const activeRes = reservations?.find((r: any) => {
            const start = new Date(r.startTime);
            const end = new Date(r.endTime);
            return start <= now && end > now;
        });
        if (activeRes) {
            const s = new Date(activeRes.startTime);
            const e = new Date(activeRes.endTime);
            statusLabel = (
                <div className="text-xs font-bold text-red-600 animate-pulse">
                    稼働中 ({s.getHours()}:{String(s.getMinutes()).padStart(2, '0')}-{e.getHours()}:{String(e.getMinutes()).padStart(2, '0')})
                </div>
            );
        } else {
            statusLabel = <div className="text-xs font-bold text-red-600">稼働中</div>;
        }
    } else if (status === 'selected') {
        bgClass = 'bg-blue-600 border-blue-600 text-white';
    } else if (status === 'available') {
        bgClass = 'bg-white border-blue-300 hover:bg-blue-50 cursor-pointer';
    }

    if (reservationCount > 0 && !status) {
        ringClass = 'ring-2 ring-blue-500 ring-offset-2';
    }

    // Find next reservation
    let nextResTime = null;
    if (reservations && reservations.length > 0) {
        const now = new Date();
        const upcoming = reservations
            .map((r: any) => new Date(r.startTime))
            .filter((d: Date) => d > now)
            .sort((a: Date, b: Date) => a.getTime() - b.getTime());

        if (upcoming.length > 0) {
            const d = upcoming[0];
            nextResTime = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    }

    return (
        <div
            className={`absolute flex flex-col items-center justify-center border shadow-sm transition-transform hover:scale-105
        ${bgClass} ${ringClass}
      `}
            style={{
                ...style,
                borderRadius: table.name.includes("丸") || table.category.includes("丸") ? "50%" : "12px",
            }}
            title={`${table.name} (${table.capacityMin}-${table.capacityMax}名)`}
        >
            <span className={`font-black text-sm text-center px-1 ${status === 'selected' ? 'text-white' : 'text-slate-800'}`}>
                {label || table.name}
            </span>

            {/* Status (In Use) */}
            {statusLabel}

            {/* Show Next Reservation Time if available */}
            {nextResTime && (
                <div className="text-xs text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded mt-1 border border-blue-200">
                    次: {nextResTime}~
                </div>
            )}
            {!nextResTime && !statusLabel && (
                <div className={`text-[10px] ${status === 'selected' ? 'text-blue-100' : 'text-slate-500'}`}>
                    {table.capacityMin}-{table.capacityMax}名
                </div>
            )}

            {reservationCount > 0 && !status && (
                <Badge color="blue" className="absolute -top-2 -right-2 shadow-sm text-[10px] px-1.5 py-0.5">
                    {reservationCount}
                </Badge>
            )}
        </div>
    );
};

export const FloorMap = ({ tables, reservations, onTableClick, tableStatus, compact = false }: any) => {
    const navigate = useNavigate();

    // Helper to find table data by loose name matching or known ID
    const getTable = (id: string) => {
        return tables.find((t: any) => t.name.includes(id) || t.id.toString() === id || (id.startsWith('T') && t.name.includes(id)));
    };

    const getCount = (tableId: number) =>
        reservations.filter((r: any) => r.tableId === tableId && r.status !== 'CANCELLED').length;

    // Get reservations for specific table
    const getTableReservations = (tableId: number) =>
        reservations.filter((r: any) => r.tableId === tableId && r.status !== 'CANCELLED');

    // Ultra-Compact Map Layout (Realistic Image Based)
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
        { id: "T08", style: { top: "75%", left: "33%", width: "30%", height: "20%", borderRadius: "4px" }, label: "4~6名" },
        { id: "T08_Label", isLabel: true, style: { top: "96%", left: "33%", width: "30%", height: "5%", fontSize: "11px", color: "#333", textAlign: "center" as const }, label: "(喫煙)" },

        // Reception Node (Visual)
        { id: "RECEPTION", style: { top: "62%", left: "33%", width: "30%", height: "15%", border: "2px solid #333", background: "#fff" }, label: "受付", isStatic: true },

        // VIP (Right Side)
        { id: "VIP", style: { top: "50%", left: "67%", width: "29%", height: "20%", borderRadius: "4px", border: "2px solid #000" }, label: "VIP" },
    ];

    return (
        <div className="relative w-full aspect-[4/4] bg-white border-2 border-slate-800 rounded-none overflow-hidden p-2">

            {/* Tables using backend data */}
            {nodes.map((node, idx) => {
                if (node.isLabel) {
                    return (
                        <div key={`label-${idx}`} className="absolute font-bold flex items-center justify-center" style={node.style}>
                            {node.label}
                        </div>
                    );
                }

                if (node.isStatic) {
                    return (
                        <div key={`static-${idx}`} className="absolute flex items-center justify-center font-bold text-slate-800 text-xs" style={node.style}>
                            {node.label}
                        </div>
                    );
                }

                const tableData = getTable(node.id);
                if (!tableData) return null;

                const status = tableStatus ? tableStatus[tableData.id] : undefined;

                return (
                    <div key={node.id} onClick={() => onTableClick && onTableClick(tableData)}>
                        <TableNode
                            table={tableData}
                            label={node.label}
                            style={node.style}
                            reservationCount={getCount(tableData.id)}
                            reservations={getTableReservations(tableData.id)}
                            status={status}
                        />
                    </div>
                );
            })}
        </div>
    );
};
