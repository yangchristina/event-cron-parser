import AwsCronParser, { prev, parse } from '..';
import { logger } from './logger';

test('should generate next & prev occurence for various crons', () => {
    let occurence;

    const base = new Date(Date.UTC(2020, 5 - 1, 9, 22, 30, 57));

    const crons = [
        [
            '1,24,50-55,58 * 25 MAR/4 ? 2020,2021,2023,2028',
            'Sat, 25 Jul 2020 00:01:00 GMT',
            'Wed, 25 Mar 2020 23:58:00 GMT',
        ],
        ['9 * 7,9,11 3,5,7 ? 2021', 'Sun, 07 Mar 2021 00:09:00 GMT'],
        ['9 * 7,9,11 5 ? 2021', 'Fri, 07 May 2021 00:09:00 GMT'],
        ['9 * 7,9,11 5 ? 2020', 'Sat, 09 May 2020 23:09:00 GMT', 'Sat, 09 May 2020 22:09:00 GMT'],
        ['9 8-20 7,9,11 5 ? 2020', 'Mon, 11 May 2020 08:09:00 GMT', 'Sat, 09 May 2020 20:09:00 GMT'],
        ['9 8-20 ? 5 MON-WED,FRI 2020', 'Mon, 11 May 2020 08:09:00 GMT', 'Fri, 08 May 2020 20:09:00 GMT'],
        ['3 2-5 ? 4,6,8,10 TUE,THU,SAT 2020', 'Tue, 02 Jun 2020 02:03:00 GMT', 'Thu, 30 Apr 2020 05:03:00 GMT'],
        ['9 * L 5 ? 2019,2020', 'Sun, 31 May 2020 00:09:00 GMT', 'Fri, 31 May 2019 23:09:00 GMT'],
        ['19 4 L 9 ? 2019,2020', 'Wed, 30 Sep 2020 04:19:00 GMT', 'Mon, 30 Sep 2019 04:19:00 GMT'],
        ['19 4 3W 9 ? 2019,2020', 'Thu, 03 Sep 2020 04:19:00 GMT', 'Tue, 03 Sep 2019 04:19:00 GMT'],
        ['19 4 5W 9 ? 2019,2020', 'Fri, 04 Sep 2020 04:19:00 GMT', 'Thu, 05 Sep 2019 04:19:00 GMT'],
        ['9 8-20 ? 8 5#2 2019,2020', 'Thu, 13 Aug 2020 08:09:00 GMT', 'Thu, 08 Aug 2019 20:09:00 GMT'],
        ['9 8-20 ? 8 5#3 2019,2020', 'Thu, 20 Aug 2020 08:09:00 GMT', 'Thu, 15 Aug 2019 20:09:00 GMT'],
        ['9 8-20 ? 12 3#1 2019,2020', 'Tue, 01 Dec 2020 08:09:00 GMT', 'Tue, 03 Dec 2019 20:09:00 GMT'],
        ['9 8-20 ? 12 3#5 2019,2020', 'Tue, 29 Dec 2020 08:09:00 GMT', 'Tue, 31 Dec 2019 20:09:00 GMT'],
        ['0 0 1 1 ? *', 'Fri, 01 Jan 2021 00:00:00 GMT', 'Wed, 01 Jan 2020 00:00:00 GMT'],
        ['0 1 2 3 ? *', 'Tue, 02 Mar 2021 01:00:00 GMT', 'Mon, 02 Mar 2020 01:00:00 GMT'],
        ['7 1 2 3 ? *', 'Tue, 02 Mar 2021 01:07:00 GMT', 'Mon, 02 Mar 2020 01:07:00 GMT'],
        ['* * 2 3 ? *', 'Tue, 02 Mar 2021 00:00:00 GMT', 'Mon, 02 Mar 2020 23:59:00 GMT'],
    ];

    crons.forEach(([cron, nextShouldBe, prevShouldBe]) => {
        const parser = new AwsCronParser(cron);

        occurence = parser.next(base);
        // logger.debug(cron, { label: occurence?.toUTCString() });
        expect(occurence?.toUTCString()).toBe(nextShouldBe);

        occurence = prev(parse(cron), base); // !!! prev not implemented yet in AwsCronParser
        // logger.debug(cron, { label: occurence?.toUTCString() });
        expect(occurence?.toUTCString()).toBe(prevShouldBe);
    });
});

test('test parse and next local #1', () => {
    const crons: { cron: string; should: string[] }[] = [
        {
            cron: "0 7 ? * MON,WED,FRI *",
            should: [
                new Date(Date.UTC(2022, 6, 6, 7)).toString(), // wed
                new Date(Date.UTC(2022, 6, 8, 7)).toString(), // fri
                new Date(Date.UTC(2022, 6, 11, 7)).toString(), // mon
                new Date(Date.UTC(2022, 6, 13, 7)).toString(), // wed
                new Date(Date.UTC(2022, 6, 15, 7)).toString(), // fri
                new Date(Date.UTC(2022, 6, 18, 7)).toString(), // fri
                'null'
            ],
        },
    ]

    crons.forEach(({ cron, should: theyShouldBe }) => {
        const parsed = new AwsCronParser(cron, new Date(2022, 6, 6), new Date(2022, 6, 19));
        // let occurence: Date = parsed.next(); // 'Tue Jul 05 2022 00:00:00 GMT-0700 (Pacific Daylight Time)'
        theyShouldBe.forEach((itShouldBe, i) => {
            const occurence = parsed.next();
            logger.debug(cron, { label: `${i}:${occurence?.toString()}` });
            if (itShouldBe === 'null')
                expect(occurence).toBeNull();
            else expect(occurence?.toString()).toBe(itShouldBe);
        });
    });
});