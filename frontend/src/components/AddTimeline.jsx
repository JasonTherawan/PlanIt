import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { binIcon } from '../assets';

const AddTimeline = forwardRef(({ id, index, title, onTitleChange, onRemove }, ref) => {
    const fromRef = useRef();
    const toRef = useRef();
    const descRef = useRef();

    useImperativeHandle(ref, () => ({
        getDateRange: () => {
            const fromVal = fromRef.current?.value;
            const toVal = toRef.current?.value;
            const descVal = descRef.current?.value;

            const from = fromVal ? new Date(fromVal) : null;
            const to = toVal ? new Date(toVal) : null;

            return { from, to, description: descVal?.trim() || '' };
        },

        setData: ({ from, to, description }) => {
            if (fromRef.current) fromRef.current.value = from ? new Date(from).toISOString().split('T')[0] : '';
            if (toRef.current) toRef.current.value = to ? new Date(to).toISOString().split('T')[0] : '';
            if (descRef.current) descRef.current.value = description || '';
        }
    }));

    return (
        <div className="timeline-section">
            <div className="timeline-header">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(id, e.target.value)}
                    className="timeline-title-input"
                    placeholder={`Timeline Title ${index + 1}`}
                />
                <button className="remove-btn" onClick={() => onRemove(id)} type="button">
                    <img src={binIcon} alt="Remove timeline" className="bin-icon" />
                </button>
            </div>

            <div className="timeline-body">
                <textarea
                    placeholder="Description . . ."
                    className="description-input"
                    ref={descRef}
                />
                <div className="row-inputs-dates">
                    <input type="date" ref={fromRef} />
                    <span className="to-label">To</span>
                    <input type="date" ref={toRef} />
                </div>
            </div>
        </div>
    );
});

export default AddTimeline;
