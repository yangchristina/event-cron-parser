import * as n2w from 'number-to-words';
import { nextUTCDay } from './local';
import { ParsedCron, ParsedRate, } from './parse';

const monthNumberToWord = (n: number) => {
    return [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ][n - 1];
};

const weekdayNumberToWord = (n: number) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][n - 1];
};

const joinMultipleWords = (words: string[]) => {
    if (words.length === 1) return words[0];
    if (words.length === 2) return `${words[0]} and ${words[1]}`;
    let rs = '';
    words.forEach((w, i, a) => {
        if (i === 0) rs += `${w},`;
        else if (i < a.length - 1) rs += ` ${w},`;
        else rs += ` and ${w}`;
    });
    return rs;
};

const checkCurrentlyUnsupported = (p: ParsedCron) => {
    for (const part of ['months', 'daysOfMonth', 'daysOfWeek']) {
        const found = p[part].find((e: string | number) => typeof e !== 'number');
        if (found) return true;
    }
    return false;
};

const handleDaysOfMonth = (p: ParsedCron) => {
    if (checkCurrentlyUnsupported(p)) return '';
    // N N * * ? * = every day
    // N N * 4,5 ? * = every day in April and May
    // N N 1,3,5 * ? * = on the 1st, 3rd, and 5th of every month
    // N N 1,3,5 4,5 ? * = on the 1st, 3rd, and 5th of April and May
    let desc = '';
    if (p.daysOfMonth.length === 31) {
        desc += 'every day';
        if (p.months.length < 12) desc += ` in ${joinMultipleWords((p.months as number[]).map(monthNumberToWord))}`;
    } else {
        desc += `on the ${joinMultipleWords((p.daysOfMonth as number[]).map(n2w.toOrdinal))}`;
        if (p.months.length === 12) desc += ' of every month';
        else desc += ` of ${joinMultipleWords((p.months as number[]).map(monthNumberToWord))}`;
    }
    return desc;
};

const handleDaysOfWeek = (p: ParsedCron) => {
    if (checkCurrentlyUnsupported(p)) return '';
    // N N ? * MON * = every Monday
    // N N ? * MON,FRI * = every Monday and Friday
    // N N ? 4,5 MON,FRI * = every Monday and Friday in April and May
    let desc = '';
    desc += `every ${joinMultipleWords((p.daysOfWeek as number[]).map(weekdayNumberToWord))}`;
    if (p.months.length < 12) desc += ` in ${joinMultipleWords((p.months as number[]).map(monthNumberToWord))}`;
    return desc;
};

const handleOncePerDay = (p: ParsedCron) => {
    const { hours, minutes } = p;
    const h = Math.round(+hours[0] % 12 || 12);
    const m = Math.round(+minutes[0]);
    const mm = m < 10 ? `0${m}` : `${m}`;
    const am = +hours[0] < 12 ? 'AM' : 'PM';
    return `${h}:${mm} ${am}`;
};

function ruleAsNumber(x: string | number): number {
    return (typeof x === 'string' ? parseInt(x) : x)
}

export function getRateDesc(p0: ParsedRate) {
    return "Every " + formatDuration(p0.duration) + ' starting from ' + new Date(p0.start).toDateString()
}

export function getScheduleDescription(p0: ParsedCron | ParsedRate, isRateExpression = false, tz = 'utc' as 'local' | 'utc'): string {
    if (isRateExpression) return getRateDesc(<ParsedRate>p0)
    return getCronDesc(<ParsedCron>p0, tz)
}

/**
 * @param {*} p the value returned by "parse" function of this module
 */
export function getCronDesc(p0: ParsedCron, tz = 'utc' as 'local' | 'utc'): string {
    const p = { ...p0 }
    let desc = '';

    // const 
    if (tz == 'local') {
        // won't work a lot if there are multiple hours and minutes, only follows first hour and first minute
        p.daysOfWeek = p.daysOfWeek.map(dow => {
            dow = ruleAsNumber(dow)

            const date = nextUTCDay(Date.now(), dow - 1)
            date.setUTCHours(ruleAsNumber(p.hours[0]), ruleAsNumber(p.minutes[0]))

            return date.getDay() + 1
            // const min = (typeof p.hours[0] === 'string' ? parseInt(p.hours[0]) : p.hours[0]) * 60 + (typeof p.minutes[0] === 'string' ? parseInt(p.minutes[0]) : p.minutes[0])
            // const offsetInMinutes = new Date().getTimezoneOffset()
            // const newMin = min + offsetInMinutes
            // if (newMin < 0) return (dow - 1) || 7
            // if (newMin < MIN_PER_DAY) return dow
            // return dow == 7 ? 1 : dow + 1
        })
        p.hours = p.hours.map(h => {
            h = typeof h === 'string' ? parseInt(h) : h
            const date1 = new Date()
            date1.setUTCHours(h)
            return date1.getHours()
        })
        p.minutes.map(m => {
            m = typeof m === 'string' ? parseInt(m) : m
            const date2 = new Date()
            date2.setUTCMinutes(m)
            return date2.getMinutes()
        })
    }

    const perDay = p.minutes.length * p.hours.length;
    if (perDay === 2) desc += 'twice a day, ';
    else if (perDay > 2) desc += `${n2w.toWords(perDay)} times a day, `;

    if (p.daysOfMonth.length > 0) desc += handleDaysOfMonth(p); // don't think timezone has large effect so shall just ignore for now
    else if (p.daysOfWeek.length > 0) desc += handleDaysOfWeek(p);

    const durationInMinutes = p.duration / 1000 / 60

    const durationHours = Math.floor(durationInMinutes / 60)
    const durationMinutes = durationInMinutes % 60

    // @ts-expect-error
    if (perDay === 1) desc += p.duration ? ` from ${handleOncePerDay(p)} - ${handleOncePerDay({ ...p, minutes: p.minutes.map(x => x + durationMinutes), hours: p.hours.map(x => x + durationHours) })}` : ` at ${handleOncePerDay(p)}`;

    return desc;
}

export default function formatDuration( duration: number ): string {
    const time = {
        week: Math.floor(duration / 86400 / 7),
        day: Math.floor(duration / 86400) % 7,
        hour: Math.floor(duration / 3600) % 24,
        minute: Math.floor(duration / 60) % 60,
        second: Math.floor(duration / 1) % 60,
    };
    return Object.entries(time)
    .filter(val => val[1] !== 0)
    .map(([key, val]) => `${val} ${key}${val !== 1 ? 's' : ''}`)
    .join(', ');
}