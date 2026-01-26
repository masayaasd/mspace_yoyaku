
import { useNavigate } from "react-router-dom";
import { Badge } from "../UI";

const TableNode = ({ table, reservationCount, style, label, status, reservations }: any) => {
    const isVIP = table.name === "VIP";

    // Schedule Map Style: Always show list of reservations
    let bgClass = isVIP ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200';

    // Sort reservations by time
    const sortedRes = (reservations || [])
        .filter((r: any) => r.status !== 'CANCELLED')
        .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <div
            className={`absolute flex flex-col border shadow-sm transition-transform hover:shadow-md cursor-pointer
        ${bgClass}
      `}
            style={{
                ...style,
                borderRadius: table.name.includes("丸") || table.category.includes("丸") ? "50%" : "8px",
                overflow: 'hidden'
            }}
            title={`${table.name}`}
        >
            <div className={`font-bold text-xs text-center py-1 bg-slate-100/50 border-b border-slate-100 text-slate-700`}>
                {label || table.name}
            </div>

            <div className="flex-1 overflow-y-auto p-1 text-[10px] space-y-1 scrollbar-hide">
                {sortedRes.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-300">
                        空き
                    </div>
                ) : (
                    sortedRes.map((r: any, i: number) => {
                        const start = new Date(r.startTime);
                        const end = new Date(r.endTime);
                        return (
                            <div key={i} className="flex justify-between items-center bg-blue-50 text-blue-800 px-1 py-0.5 rounded border border-blue-100">
                                <span className="font-bold">
                                    {start.getHours()}:{String(start.getMinutes()).padStart(2, '0')}
                                </span>
                                <span className="text-slate-500 mx-0.5">-</span>
                                <span className="text-slate-600">
                                    {end.getHours()}:{String(end.getMinutes()).padStart(2, '0')}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            {reservationCount > 0 && (
                <Badge color="blue" className="absolute top-1 right-1 shadow-sm text-[9px] px-1 py-0">
                    {reservationCount}
                </Badge>
            )}
        </div>
    );
};

export const ScheduleMap = ({ tables, reservations, onTableClick }: any) => {

    // Helper to find table data
    const getTable = (id: string) => {
        return tables.find((t: any) => t.name.includes(id) || t.id.toString() === id || (id.startsWith('T') && t.name.includes(id)));
    };

    const getTableReservations = (tableId: number) =>
        reservations.filter((r: any) => r.tableId === tableId);

    // Reuse Node Layout but slightly adjusted for list view
    const nodes = [
        // --- Top Row ---
        { id: "T01", style: { top: "2%", left: "2%", width: "40%", height: "20%" }, label: "9名卓(T01)" },
        { id: "T02", style: { top: "2%", left: "44%", width: "40%", height: "20%" }, label: "9名卓(T02)" },

        // --- Middle Row ---
        { id: "T03", style: { top: "25%", left: "2%", width: "25%", height: "20%" }, label: "6名卓(T03)" },
        { id: "T04", style: { top: "24%", left: "30%", width: "25%", height: "35%" }, label: "9名卓(T04)" },
        { id: "T05", style: { top: "25%", left: "58%", width: "25%", height: "20%" }, label: "6名卓(T05)" },

        // --- Bottom Row ---
        { id: "T06", style: { top: "50%", left: "2%", width: "25%", height: "20%" }, label: "6名卓(T06)" },

        { id: "T07", style: { top: "75%", left: "2%", width: "25%", height: "20%" }, label: "6名卓(T07)" },
        // Label T07
        { id: "T07_Label", isLabel: true, style: { top: "96%", left: "2%", width: "25%", height: "5%", fontSize: "10px", color: "#333", textAlign: "center" as const }, label: "(喫煙)" },

        { id: "T08", style: { top: "75%", left: "30%", width: "25%", height: "20%" }, label: "4~6名(T08)" },
        // Label T08
        { id: "T08_Label", isLabel: true, style: { top: "96%", left: "30%", width: "25%", height: "5%", fontSize: "10px", color: "#333", textAlign: "center" as const }, label: "(喫煙)" },

        // Reception
        { id: "RECEPTION", style: { top: "62%", left: "30%", width: "25%", height: "15%", border: "2px solid #333", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }, label: "受付", isStatic: true },

        // VIP
        { id: "VIP", style: { top: "50%", left: "58%", width: "25%", height: "20%" }, label: "VIP" },
    ];

    return (
        <div className="relative w-full aspect-[4/4] bg-white border-2 border-slate-200 rounded-xl overflow-hidden p-4">
            {nodes.map((node, idx) => {
                if (node.isLabel) {
                    return (
                        <div key={`label-${idx}`} className="absolute font-bold" style={node.style}>
                            {node.label}
                        </div>
                    );
                }
                if (node.isStatic) {
                    return (
                        <div key={`static-${idx}`} className="absolute font-bold text-slate-800" style={node.style}>
                            {node.label}
                        </div>
                    );
                }

                const tableData = getTable(node.id);
                if (!tableData) return null;

                const res = getTableReservations(tableData.id);

                return (
                    <div key={node.id} onClick={() => onTableClick && onTableClick(tableData)}>
                        <TableNode
                            table={tableData}
                            label={node.label}
                            style={node.style}
                            reservationCount={res.filter((r: any) => r.status !== 'CANCELLED').length}
                            reservations={res}
                        />
                    </div>
                );
            })}
        </div>
    );
};
