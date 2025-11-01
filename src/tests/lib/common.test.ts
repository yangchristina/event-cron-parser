
const { getDaysOfMonthFromDaysOfWeek } = require('../../../built/lib/common');

describe('getDaysOfMonthFromDaysOfWeek', () => {
  it('returns all Sundays in May 2023', () => {
    // 0: Sunday, so +1 = 1
    // May 2023 Sundays: 7, 14, 21, 28
    expect(getDaysOfMonthFromDaysOfWeek(2023, 5, [1])).toEqual([7, 14, 21, 28]);
  });

  it('returns last Monday in May 2023 (L,2)', () => {
    // 1: Monday, so +1 = 2
    // Last Monday in May 2023 is 29
    expect(getDaysOfMonthFromDaysOfWeek(2023, 5, ['L', 2])).toEqual([29]);
  });

  it('returns 2nd Tuesday in May 2023 (#,3,2)', () => {
    // 2: Tuesday, so +1 = 3, 2nd occurrence
    // May 2023 Tuesdays: 2, 9, 16, 23, 30
    expect(getDaysOfMonthFromDaysOfWeek(2023, 5, ['#', 3, 2])).toEqual([9]);
  });

  it('returns all Fridays in February 2024 (leap year)', () => {
    // 5: Friday, so +1 = 6
    // Feb 2024 Fridays: 2, 9, 16, 23
    expect(getDaysOfMonthFromDaysOfWeek(2024, 2, [6])).toEqual([2, 9, 16, 23]);
  });

  it('returns empty for no matching day', () => {
    expect(getDaysOfMonthFromDaysOfWeek(2023, 5, [8])).toEqual([]);
  });
});
