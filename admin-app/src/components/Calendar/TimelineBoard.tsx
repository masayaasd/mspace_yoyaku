import { useRef, useEffect } from "react";
import { Badge } from "../UI";

export const TimelineBoard = ({ tables, reservations, onReservationClick }: any) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Current time line
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Board config
    // 06:00 to 30:00 (Next day 06:00) = 24 hours
    const startHour = 6;
    const totalHours = 24;
    const pixelsPerHour = 100; // Wider for better visibility
    const timelineWidth = totalHours * pixelsPerHour;

    // Helper to calculate position
    const getPosition = (dateStr: string) => {
        const d = new Date(dateStr);
        let h = d.getHours();
        const m = d.getMinutes();

        // Handle next day times (e.g., 01:00 should be 25:00 relative to 06:00 start)
        if (h < startHour) h += 24;

        const hoursFromStart = (h - startHour) + (m / 60);
        return hoursFromStart * pixelsPerHour;
    };

    const getWidth = (startStr: string, endStr: string) => {
        return getPosition(endStr) - getPosition(startStr);
    };

    // Current time position
    let currentPos = -1;
    let ch = currentHour;
    if (ch < startHour) ch += 24;
    const currentHoursFromStart = (ch - startHour) + (currentMinute / 60);
    currentPos = currentHoursFromStart * pixelsPerHour;

    // Auto-scroll to current time on mount
    useEffect(() => {
        if (scrollRef.current && currentPos >= 0) {
            // Scroll so current time is roughly centered (offset by half container width)
            const containerWidth = scrollRef.current.clientWidth;
            const scrollTarget = Math.max(0, currentPos - containerWidth / 2 + 150); // +150 for label column
            scrollRef.current.scrollLeft = scrollTarget;
        }
    }, [currentPos]);


    return (
        <div ref={scrollRef} className="w-full overflow-x-auto border rounded-xl shadow-inner bg-white">
            <div className="relative min-w-[2400px]" style={{ width: `${timelineWidth + 150}px` }}> {/* +150 for label column */}

                {/* Header (Times) */}
                <div className="flex border-b h-10 sticky top-0 bg-slate-50 z-20">
                    <div className="w-[150px] sticky left-0 bg-slate-50 border-r flex items-center justify-center font-bold text-slate-500 z-30 shadow-sm">
                        Table
                    </div>
                    <div className="flex-1 relative">
                        {Array.from({ length: totalHours + 1 }).map((_, i) => {
                            const hour = (startHour + i) % 24;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 border-l text-xs text-slate-400 pl-1 pt-2"
                                    style={{ left: `${i * pixelsPerHour}px` }}
                                >
                                    {hour}:00
                                </div>
                            );
                        })}
                        {/* Current Time Line */}
                        {currentPos >= 0 && currentPos <= timelineWidth && (
                            <div
                                className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10"
                                style={{ left: `${currentPos}px`, height: '1000px' }} // Height needs to cover rows
                            >
                                <div className="bg-red-500 text-white text-[10px] px-1 rounded absolute -top-1 -ml-6">
                                    Current
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rows */}
                <div className="relative">
                    {tables.map((table: any) => {
                        const tableRes = reservations.filter((r: any) => r.tableId === table.id && r.status !== 'CANCELLED');

                        return (
                            <div key={table.id} className="flex border-b h-16 hover:bg-slate-50 transition-colors">
                                <div className="w-[150px] sticky left-0 bg-white border-r flex flex-col items-center justify-center z-10 font-bold text-slate-700">
                                    <span>{table.name}</span>
                                    <span className="text-xs text-slate-400 font-normal">{table.category}</span>
                                </div>
                                <div className="flex-1 relative bg-slate-50/30">
                                    {/* Grid Lines */}
                                    {Array.from({ length: totalHours + 1 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute top-0 bottom-0 border-l border-slate-100"
                                            style={{ left: `${i * pixelsPerHour}px` }}
                                        />
                                    ))}

                                    {/* Reservations */}
                                    {tableRes.map((r: any) => {
                                        const left = getPosition(r.startTime);
                                        const width = getWidth(r.startTime, r.endTime);

                                        return (
                                            <div
                                                key={r.id}
                                                className="absolute top-2 h-12 bg-blue-500 rounded-md shadow-sm border border-blue-600 opacity-90 hover:opacity-100 hover:z-20 cursor-pointer overflow-hidden group"
                                                style={{ left: `${left}px`, width: `${width}px` }}
                                                title={`${r.customerName} (${r.partySize}名)`}
                                                onClick={() => onReservationClick && onReservationClick(r)}
                                            >
                                                <div className="px-2 py-1 text-white text-xs font-bold truncate">
                                                    {r.customerName}
                                                </div>
                                                <div className="px-2 text-blue-100 text-[10px] truncate">
                                                    {new Date(r.startTime).getHours()}:{String(new Date(r.startTime).getMinutes()).padStart(2, '0')} -
                                                    {new Date(r.endTime).getHours()}:{String(new Date(r.endTime).getMinutes()).padStart(2, '0')}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
