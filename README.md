# Recuring Events AWS Schedule Expressions Parser

<p align="left">
  <a href="https://www.npmjs.com/package/event-cron-parser"><img src="https://img.shields.io/npm/v/event-cron-parser" alt="Stable Release" /></a>
  <a href="./LICENSE"><img allt="MIT License" src="https://badgen.now.sh/badge/license/MIT"/></a>
</p>

Expanded [@aws-cron-parser](https://github.com/beemhq/aws-cron-parser.git) to support rate expressions, durations, date ranges, and more.

Using aws cron/rate expression syntax, with a few additional features, to schedule recurring events.
Supports events with durations, and can pass a time interval into parser that specifies the time range the cron can occur in.

Typescript support.

Syntax: `min hr dayOfMonth month dayOfWeek year *duration* ` OR `rate(value unit, *duration*)`
values in ** are optional, can be omitted

Hours: 0-23
Day-of-month: 1-31
Month: 1-12 or JAN-DEC
Day-of-week: 1-7 or SUN-SAT

This utility was built to process AWS Cron Expressions used by Amazon CloudWatch. It can support all the specs listed in the link below, including the special wildcards L W and #.

## Specs

[AWS Schedule Expression specs](https://docs.aws.amazon.com/lambda/latest/dg/services-cloudwatchevents-expressions.html)
[AWS Cron Expression specs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions)
[AWS Rate Expression specs](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rate-expressions.html)

## Installation

```sh
npm install event-cron-parser
```

## Usage

Methods so far: `parse`, `next`, `range`, `isInRange`, `desc`, `getLocalDays`, `setUTCHours` , `setDaysOfWeek`, `getCron`, `validate`
`prev` will (probably) be added at a later date

`validate` throws error when called if the cron is invalid
```js
import EventCronParser from "event-cron-parser";

const duration = 3600000 // in milliseconds

// first we need to parse the cron expression, can also include an earliest possible date and a latest possible date
const cronParser = new EventCronParser(`9 * 7,9,11 5 ? 2020,2022,2024-2099 ${duration}`, new Date(), new Date(Date.now() + 5 * 86400000)) // default tz is 'local', can use setTimezone to change, or pass into constructor, only timezones currently supported are local and utc (default)

// to get the first occurrence that ends after or at the same time as now
let occurrence: Date | null = cronParser.next(new Date());

// use without parameter to get the next occurrence following the previous one,
// or the first possible occurence of the cron expression if next has not been called yet
occurrence = cronParser.next();

// prev not completed yet, not in use
// // and use prev to get the previous occurrence
// occurrence = cronParser.prev();

// and use isInRange to see whether event will occur within given time frame, can pass in either number or date for start and end
const isInRange: boolean = cronParser.isInRange(new Date(), Date.now() + 86400000);

// use range to get dates of all events within range, includes everything that ends after start, and starts before end
const occurences: Date[] = cronParser.range(new Date(), Date.now() + 86400000);


const cronParser2 = new EventCronParser(`0 15 ? * 2,4,6 * 3600000`, new Date(), new Date(Date.now() + 5 * 86400000))

// use desc to get a simple description of the cron
console.log(cronParser.desc()); // default will give description in UTC
console.log(cronParser.desc('utc'));
// output: 'every Monday, Wednesday, and Friday from 3:00 PM - 4:00 PM'
console.log(cronParser.desc('local')); // gives description in local time, day of week depends on first hour and minute given if multiple values are given for hours and minutes in cron
// output: 'every Monday, Wednesday, and Friday from 8:00 AM - 9:00 AM'

```
