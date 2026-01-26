export const RATES = {
    DAY: { start: 6, end: 17, price: 69 },   // 06:00 - 16:59
    NIGHT: { start: 17, end: 24, price: 88 }, // 17:00 - 23:59
    LATE: { start: 0, end: 6, price: 79 }     // 24:00 - 05:59
};

export const ADMISSION_FEE = 528;
export const VIP_FEE = 1000;

export const calculatePrice = (startTime: string | Date, endTime: string | Date, partySize: number, isVip: boolean = false) => {
    let start = new Date(startTime);
    let end = new Date(endTime);

    // If end is before start, assume next day (though caller should usually handle this)
    if (end < start) {
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }

    let totalTimeCharge = 0;
    let current = new Date(start.getTime());

    // Iterate minute by minute for precision across boundaries
    // Optimize later if needed, but for <24h difference this is fast enough
    while (current < end) {
        const hour = current.getHours();

        // Find rate for this minute
        let ratePer10Min = 0;

        if (hour >= RATES.DAY.start && hour < RATES.DAY.end) {
            ratePer10Min = RATES.DAY.price;
        } else if (hour >= RATES.NIGHT.start && hour < RATES.NIGHT.end) {
            ratePer10Min = RATES.NIGHT.price;
        } else {
            // Late night (00:00 - 05:59)
            ratePer10Min = RATES.LATE.price;
        }

        // Add per-minute cost (Rate / 10)
        totalTimeCharge += ratePer10Min / 10;

        // Advance 1 minute
        current.setMinutes(current.getMinutes() + 1);
    }

    // Round total time charge per person
    const timeChargePerPerson = Math.ceil(totalTimeCharge);

    // Fees
    const admission = ADMISSION_FEE;
    const vip = isVip ? VIP_FEE : 0;

    const totalPerPerson = timeChargePerPerson + admission + vip;
    const totalAmount = totalPerPerson * partySize;

    return {
        timeChargePerPerson,
        admission,
        vip,
        totalPerPerson,
        totalAmount
    };
};
