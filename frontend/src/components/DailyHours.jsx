import React, { forwardRef, useImperativeHandle, useState } from 'react';

const DailyHours = forwardRef((props, ref) => {
    const [startHour, setStartHour] = useState('');
    const [startPeriod, setStartPeriod] = useState('AM');
    const [endHour, setEndHour] = useState('');
    const [endPeriod, setEndPeriod] = useState('AM');

    useImperativeHandle(ref, () => ({
        getValues: () => ({
            startHour,
            startPeriod,
            endHour,
            endPeriod,
        })
    }));

    return (
        <div className="form-group">
            <label className="form-label">Daily Hours</label>
            <div className="row-inputs hours">
                <input
                    type="text"
                    value={startHour}
                    onChange={e => setStartHour(e.target.value)}
                    className="hour-input"
                    placeholder="H.MM"
                    pattern="^(1[0-2]|[1-9])(\.[0-5][0-9])?$"
                    title="Use format H.MM, example: 9.00 or 12.30"
                />
                <select value={startPeriod} onChange={e => setStartPeriod(e.target.value)} className="meridiem-select">
                    <option>AM</option>
                    <option>PM</option>
                </select>

                <span className="to-label">to</span>

                <input
                    type="text"
                    value={endHour}
                    onChange={e => setEndHour(e.target.value)}
                    className="hour-input"
                    placeholder="H.MM"
                    pattern="^(1[0-2]|[1-9])(\.[0-5][0-9])?$"
                    title="Use format H.MM, example: 9.00 or 12.30"
                />
                <select value={endPeriod} onChange={e => setEndPeriod(e.target.value)} className="meridiem-select">
                    <option>AM</option>
                    <option>PM</option>
                </select>
            </div>
        </div>
    );
});

export default DailyHours;