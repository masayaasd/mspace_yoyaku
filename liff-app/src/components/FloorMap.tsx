
import React from "react";
import { Badge } from "./UI";

const TableNode = ({ table, style, label, status }: any) => {
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
            <span className={`font-bold text-[10px] text-center px-1 leading-tight ${textColor}`}>
                {label || table.name}
            </span>
            <span className={`text-[8px] opacity-70 ${textColor}`}>
                {table.capacityMin}-{table.capacityMax}
            </span>
        </div>
    );
};

export const FloorMap = ({ tables, reservations, onTableClick, selectedTableId }: any) => {

    const getTable = (id: string) => {
        return tables.find((t: any) => t.name.includes(id) || t.id.toString() === id);
    };

    const tableStatus = (tableId: string) => {
        if (selectedTableId === tableId) return 'selected';

        const now = new Date();
        const isOccupied = reservations?.some((r: any) => {
            if (r.tableId !== tableId) return false;
            if (r.status === 'CANCELLED') return false;
            const start = new Date(r.startTime);
            const end = new Date(r.endTime);
            return now >= start && now < end;
        });

        return isOccupied ? 'occupied' : 'available';
    };

    const nodes = [
        { id: "T01", style: { top: "5%", left: "5%", width: "40%", height: "18%" }, label: "9名卓(T01)" },
        { id: "T02", style: { top: "5%", left: "55%", width: "40%", height: "18%" }, label: "9名卓(T02)" },
        { id: "T03", style: { top: "28%", left: "5%", width: "25%", height: "18%" }, label: "6名卓(T03)" },
        { id: "T04", style: { top: "28%", left: "37.5%", width: "25%", height: "30%" }, label: "9名卓(T04)" },
        { id: "T05", style: { top: "28%", left: "70%", width: "25%", height: "18%" }, label: "6名卓(T05)" },
        { id: "T06", style: { top: "52%", left: "5%", width: "25%", height: "18%" }, label: "6名卓(T06)" },
        { id: "T07", style: { top: "75%", left: "5%", width: "25%", height: "18%" }, label: "6名卓(T07)" },
        { id: "T08", style: { top: "75%", left: "37.5%", width: "25%", height: "18%" }, label: "4-6名(T08)" },
        { id: "RECEPTION", style: { top: "62%", left: "70%", width: "25%", height: "12%", border: "1px dashed #ccc", background: "transparent" }, label: "受付", isStatic: true },
        { id: "VIP", style: { top: "75%", left: "70%", width: "25%", height: "18%", border: "2px solid #fbbf24", background: "#fffbeb" }, label: "VIP" },
    ];

    return (
        <div className="relative w-full aspect-square bg-slate-50 border rounded-2xl overflow-hidden p-2 shadow-inner">
            {nodes.map((node, idx) => {
                if (node.isStatic) {
                    return (
                        <div key={`static-${idx}`} className="absolute flex items-center justify-center font-bold text-slate-400 text-[10px]" style={node.style}>
                            {node.label}
                        </div>
                    );
                }

                const tableData = getTable(node.id);
                if (!tableData) return null;

                const status = tableStatus(tableData.id);

                return (
                    <div key={node.id} onClick={() => status !== 'occupied' && onTableClick && onTableClick(tableData)}>
                        <TableNode
                            table={tableData}
                            label={node.label}
                            style={node.style}
                            status={status}
                        />
                    </div>
                );
            })}
        </div>
    );
};
