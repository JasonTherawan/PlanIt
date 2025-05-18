import React, { forwardRef, useImperativeHandle, useState } from 'react';

const DailyHours = forwardRef((props, ref) => {
    const [startHour, setStartHour] = useState('');
    const [endHour, setEndHour] = useState('');

    const handleFormat = (value, setValue) => {
        const formatted = formatDecimalTime(value);
        setValue(formatted);
    };

    const formatDecimalTime = (value) => {
        if (!value) return '';

        let [h, m] = value.split('.');

        if (m === undefined) m = '00';
        else if (m.length === 1) m = m + '0';
        else m = m.slice(0, 2);

        if (h.length === 1) h = '0' + h;

        return `${h}.${m}`;
    };

    const parseDecimal24Hour = (strHour) => {
        if (!strHour.includes('.')) return null;
        const [h, m] = strHour.split('.');
        const hour = parseInt(h);
        const minute = parseInt(m);

        if (
            isNaN(hour) || isNaN(minute) ||
            hour < 0 || hour >= 24 ||
            minute < 0 || minute >= 60
        ) {
            return null;
        }

        const decimal = hour + minute / 60;
        if (decimal < 0 || decimal >= 24) return null;

        return decimal;
    };

    useImperativeHandle(ref, () => ({
        getValues: () => ({
            start: parseDecimal24Hour(startHour),
            end: parseDecimal24Hour(endHour)
        }),
        setValues: (start, end) => {
            setStartHour(start != null ? formatDecimalTime(start.toFixed(2)) : '');
            setEndHour(end != null ? formatDecimalTime(end.toFixed(2)) : '');
        }
    }));

    return (
        <div className="form-group">
            <label className="form-label">Daily Hours</label>
            <div className="row-inputs hours">
                <input
                    type="text"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    onBlur={() => handleFormat(startHour, setStartHour)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleFormat(startHour, setStartHour);
                            e.preventDefault();
                        }
                    }}
                    className="hour-input"
                    placeholder="00.01"
                />

                <span className="to-label">to</span>

                <input
                    type="text"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    onBlur={() => handleFormat(endHour, setEndHour)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleFormat(endHour, setEndHour);
                            e.preventDefault();
                        }
                    }}
                    className="hour-input"
                    placeholder="23.59"
                />
            </div>
        </div>
    );
});

export default DailyHours;