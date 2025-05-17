import React, { useEffect, useRef } from 'react';
import { binIcon } from '../assets';

function AddTimeline({ id, index, title, onTitleChange, onRemove, registerRefs }) {
    const fromRef = useRef();
    const toRef = useRef();

    useEffect(() => {
        if (registerRefs) {
            registerRefs(id, fromRef, toRef);
        }
    }, [registerRefs, id]);

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
                <textarea placeholder="Description . . ." className="description-input"></textarea>

                <div className="row-inputs-dates">
                    <input type="date" ref={fromRef} />
                    <span className="to-label">To</span>
                    <input type="date" ref={toRef} />
                </div>
            </div>
        </div>
    );
}

export default AddTimeline;