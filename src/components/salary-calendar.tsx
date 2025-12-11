'use client';

import { useState, useMemo } from 'react';

interface SalaryCalendarProps {
  onApply: (startDate: Date | null, endDate: Date | null) => void;
  onClose: () => void;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SalaryCalendar({ onApply, onClose }: SalaryCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const isSame = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  };

  const calendarDates = useMemo(() => {
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const dates: Array<{ day: number; isGrey: boolean; date: Date | null }> = [];

    // Previous month grey dates
    for (let i = offset; i > 0; i--) {
      dates.push({
        day: daysInPrevMonth - i + 1,
        isGrey: true,
        date: null,
      });
    }

    // Current month dates
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push({
        day,
        isGrey: false,
        date: new Date(selectedYear, selectedMonth, day),
      });
    }

    // Next month grey dates
    const remaining = 42 - dates.length;
    for (let d = 1; d <= remaining; d++) {
      dates.push({
        day: d,
        isGrey: true,
        date: null,
      });
    }

    return dates;
  }, [selectedMonth, selectedYear]);

  const handleChoose = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (date >= startDate) {
      setEndDate(date);
    } else {
      setStartDate(date);
      setEndDate(null);
    }
  };

  const handleApply = () => {
    if (!startDate) {
      alert("Select a date first.");
      return;
    }
    onApply(startDate, endDate);
  };

  const years = [];
  for (let y = 2017; y <= 2035; y++) {
    years.push(y);
  }

  return (
    <div id="salaryCalendarContainer" className="salary-calendar-container">
      <div className="calendar">
        <div className="calendar__opts">
          <select
            id="calendar__month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="calendar__select"
          >
            {monthNames.map((month, idx) => (
              <option key={month} value={idx}>
                {month}
              </option>
            ))}
          </select>
          <select
            id="calendar__year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="calendar__select"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="calendar__body">
          <div className="calendar__days">
            <div>M</div>
            <div>T</div>
            <div>W</div>
            <div>T</div>
            <div>F</div>
            <div>S</div>
            <div>S</div>
          </div>

          <div className="calendar__dates" id="calendar__dates">
            {calendarDates.map((item, idx) => {
              if (item.isGrey || !item.date) {
                return (
                  <div key={idx} className="calendar__date calendar__date--grey">
                    <span>{item.day}</span>
                  </div>
                );
              }

              const dateValue = item.date;
              const isStart = startDate && isSame(dateValue, startDate);
              const isEnd = endDate && isSame(dateValue, endDate);
              const isInRange = startDate && endDate && dateValue > startDate && dateValue < endDate;
              const isSelected = isStart || isEnd || isInRange;

              return (
                <div
                  key={idx}
                  className={`calendar__date ${
                    isSelected ? 'calendar__date--selected' : ''
                  } ${
                    isStart ? 'calendar__date--range-start' : ''
                  } ${
                    isEnd ? 'calendar__date--range-end' : ''
                  }`}
                  onClick={() => handleChoose(dateValue)}
                >
                  <span>{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="calendar__buttons">
          <button
            className="calendar__button calendar__button--grey"
            id="closeCalendar"
            onClick={onClose}
          >
            Back
          </button>
          <button
            className="calendar__button calendar__button--primary"
            id="applyDates"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

