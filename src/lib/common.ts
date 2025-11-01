import { ParsedCron, ParsedRule } from './parse';

const isWeekday = (year: number, month: number, day: number): boolean => {
    if (day < 1 || day > 31) {
        return false;
    }
    const thisDate = new Date(year, month - 1, day);
    if (thisDate.getMonth() !== month - 1) {
        return false;
    }
    return thisDate.getDay() > 0 && thisDate.getDay() < 6;
};

export const getDaysOfMonthFromDaysOfWeek = (
    year: number,
    month: number,
    daysOfWeek: ParsedRule,
    { latestDate }: { latestDate?: Date } = {},
) => {
    const daysOfMonth = [];
    let index = 0; // only for "#" use case
    // Find the last day of the month with a single Date object
    const lastDayDate = new Date(year, month, 0); // day 0 of next month is last day of this month
    let lastDay = lastDayDate.getDate();
    if (latestDate && latestDate.getTime() < lastDayDate.getTime()) {
        lastDay = latestDate.getDate();
    }
    // Reuse a single Date object for iteration
    const thisDate = new Date(year, month - 1, 1);
    for (let i = 1; i <= lastDay; i += 1) {
        thisDate.setDate(i);
        const dayOfWeek = thisDate.getDay() + 1;
        if (daysOfWeek[0] === 'L') {
            if (daysOfWeek[1] === dayOfWeek) {
                // Check if same day next week is in next month
                thisDate.setDate(i + 7);
                if (thisDate.getMonth() !== month - 1) {
                    thisDate.setDate(i); // reset
                    return [i];
                }
                thisDate.setDate(i); // reset
            }
        } else if (daysOfWeek[0] === '#') {
            if (daysOfWeek[1] === dayOfWeek) {
                index += 1;
            }
            if (daysOfWeek[2] === index) {
                return [i];
            }
        } else if (daysOfWeek.includes(dayOfWeek)) {
            daysOfMonth.push(i);
        }
    }
    return daysOfMonth;
};

export const getDaysOfMonthForL = (year: number, month: number, daysBefore: number): number[] => {
    for (let i = 31; i >= 28; i -= 1) {
        const thisDate = new Date(year, month - 1, i);
        if (thisDate.getMonth() === month - 1) {
            return [i - daysBefore];
        }
    }
    throw new Error('getDaysOfMonthForL - should not happen');
};

export const getDaysOfMonthForW = (year: number, month: number, day: number): number[] => {
    const offset = [0, 1, -1, 2, -2].find((c) => isWeekday(year, month, day + c));
    if (offset === undefined) throw new Error('getDaysOfMonthForW - should not happen');
    return [day + offset];
};

export const arrayFindFirst = (a: any[], f: any) => {
    return a.find(f);
};

export const arrayFindLast = (a: any[], f: any) => {
    // note: a.slice().reverse().find(f) is less efficient
    for (let i = a.length - 1; i >= 0; i--) {
        const e = a[i];
        if (f(e)) {
            return e;
        }
    }
};

export const adjustDateForDST = (date: Date, parsedCron: ParsedCron, timezone: string) => {
    if (timezone === 'local') {
        // check for difference in daylight savings
        let offsetDiff = date.getTimezoneOffset() - new Date(parsedCron.start).getTimezoneOffset();
        if (offsetDiff !== 0) {
            date.setMinutes(date.getMinutes() + offsetDiff);
            return offsetDiff;
        }
    }
    return 0;
};
