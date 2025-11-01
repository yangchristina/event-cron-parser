import { getDaysOfMonthFromDaysOfWeek, getDaysOfMonthForL, getDaysOfMonthForW, arrayFindFirst as find, adjustDateForDST } from './common';
import { ParsedCron, ParsedRate } from './parse';
import { DateInput } from './types';


interface FindOnceOptions {
    latestDate?: Date;
}

const findOnce = (parsed: ParsedCron, from: Date, iter = 0, options?: FindOnceOptions): Date | null => {
    if (iter > 10) {
        throw new Error("AwsCronParser : this shouldn't happen, but iter > 10");
    }
    iter += 1;

    from = getLatestDate(from, parsed.start)

    // Early termination if from is after latestDate
    if (options?.latestDate && from.getTime() > options.latestDate.getTime()) {
        return null;
    }

    const cYear = from.getUTCFullYear();
    const cMonth = from.getUTCMonth() + 1;
    const cDayOfMonth = from.getUTCDate();
    const cHour = from.getUTCHours();
    const cMinute = from.getUTCMinutes();

    const year = find(parsed.years, (c: number) => c >= cYear);
    if (!year) {
        return null;
    }

    const month = find(parsed.months, (c: number) => c >= (year === cYear ? cMonth : 1));
    if (!month) {
        return findOnce(parsed, getDate(year + 1, 1), iter, options);
    }

    const isSameMonth = year === cYear && month === cMonth;

    let pDaysOfMonth = parsed.daysOfMonth;
    if (pDaysOfMonth.length === 0) {
        pDaysOfMonth = getDaysOfMonthFromDaysOfWeek(year, month, parsed.daysOfWeek);
    } else if (pDaysOfMonth[0] === 'L') {
        pDaysOfMonth = getDaysOfMonthForL(year, month, pDaysOfMonth[1] as number);
    } else if (pDaysOfMonth[0] === 'W') {
        pDaysOfMonth = getDaysOfMonthForW(year, month, pDaysOfMonth[1] as number);
    }

    const dayOfMonth = find(pDaysOfMonth, (c: number) => c >= (isSameMonth ? cDayOfMonth : 1));
    if (!dayOfMonth) {
        return findOnce(parsed, getDate(year, month + 1), iter, options);
    }

    const isSameDate = isSameMonth && dayOfMonth === cDayOfMonth;

    const hour = find(parsed.hours, (c: number) => c >= (isSameDate ? cHour : 0));
    if (typeof hour === 'undefined') {
        return findOnce(parsed, getDate(year, month, dayOfMonth + 1), iter, options);
    }

    const minute = find(parsed.minutes, (c: number) => c >= (isSameDate && hour === cHour ? cMinute : 0));
    if (typeof minute === 'undefined') {
        return findOnce(parsed, getDate(year, month, dayOfMonth, hour + 1, minute), iter, options);
    }
    const result = getDate(year, month, dayOfMonth, hour, minute);
    if (options?.latestDate && result.getTime() > options.latestDate.getTime()) {
        return null;
    }
    return result;
};

// function getEarliestDate(date1: Date, date2: Date) {
//     return date1.getTime() <= date2.getTime() ? date1 : date2
// }

function getLatestDate(date1: Date, date2: Date) {
    return date1.getTime() >= date2.getTime() ? date1 : date2
}

function getDate(year = 0, month = 1, dayOfMonth = 1, hour = 0, minute = 0) {
    try {
        return new Date(Date.UTC(year, month - 1, dayOfMonth, hour, minute))
    } catch (e) {
        console.error('get date error')
        console.error(e)
        return new Date(0)
    }
}

/**
 * generate the next occurrence which ends after or at the same time as the "from" date value,
 * includes occurences that start before the "from" date, but end after
 * NOTE: does not deal with durations, only start
 * returns NULL when there is no more future occurrence
 * @param {*} parsed the value returned by "parse" function of this module
 * @param {*} from the Date to start from
 */
interface NextCronOptions {
    inclusive?: boolean;
    tz?: 'local' | 'utc';
    latestDate?: Date;
}

export function nextCron(parsed: ParsedCron, from: Date, duration: number, options?: NextCronOptions) {
    const { inclusive = false, tz = 'utc' as 'local' | 'utc', latestDate } = options || {}
    // iter is just a safety net to prevent infinite recursive calls
    // because I'm not 100% sure this won't happen

    const findFrom = (from: Date) => {
        return findOnce(
            parsed,
            new Date(((from.getTime() - duration + (inclusive ? -60000 : 60000)) / 60000) * 60000),
            0,
            { latestDate }
        )
    }
    let nextOccurence = findFrom(from)

    const adjustAmountMin = nextOccurence ? adjustDateForDST(nextOccurence, parsed, tz) : 60

    if (adjustAmountMin !== 0) {
        const newNextOccurence = findFrom(new Date(from.getTime() - adjustAmountMin * 60000))
        if (newNextOccurence && adjustAmountMin === adjustDateForDST(newNextOccurence, parsed, tz)) {
            nextOccurence = newNextOccurence
        }
    }

    if (
        nextOccurence === null
        || parsed.end === null
        || nextOccurence.getTime() < parsed.end.getTime()
    ) return nextOccurence
    return null
    // new Date((Math.floor(from.getTime() / 60000) + 1) * 60000)
}

export function nextRate(rate: ParsedRate, from: DateInput | null, inclusive = false) {
    if (from == null) return null
    const fromTime = new Date(from).getTime()
    const startTime = rate.start.getTime()

    let time = startTime;
    while (inclusive ? time < fromTime : time <= fromTime) {
        time += rate.rate * 1000
    }

    if (rate.end && time + rate.duration > rate.end.getTime()) return null
    return new Date(time)
}
