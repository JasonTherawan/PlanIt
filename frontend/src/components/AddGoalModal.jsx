import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AddGoalModal.css';
import { closeIcon } from '../assets';
import AddTimeline from './AddTimeline';
import DailyHours from './DailyHours';

function AddGoalModal({ onClose }) {
    // Modal Effect: Prevent page scroll (only pop up scroll)
    useEffect(() => {
        document.body.classList.add("modal-open");
        return () => {
            document.body.classList.remove("modal-open");
        };
    }, []);

    const goalTitleRef = useRef();
    const dailyHoursRef = useRef();

    const convertTo24Hour = (hourStr, period) => {
        const h = parseFloat(hourStr);
        if (isNaN(h) || h < 1 || h >= 13) return null;

        let base = period === "AM" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
        return base;
    };

    const [timelines, setTimelines] = useState([{ id: 'T001', title: '' }]);
    const [counter, setCounter] = useState(1);
    const timelineRefs = useRef({});

    const registerRefs = useCallback((id, from, to) => {
        timelineRefs.current[id] = { from, to };
    }, []);

    const generateId = (num) => `T${num.toString().padStart(3, '0')}`;

    const handleTitleChange = (id, newTitle) => {
        setTimelines(prev =>
            prev.map(t => (t.id === id ? { ...t, title: newTitle } : t))
        );
    };

    const handleAddTimeline = () => {
        const nextId = generateId(counter + 1);
        setTimelines([...timelines, { id: nextId, title: '' }]);
        setCounter(counter + 1);
    };

    const handleRemoveTimeline = (idToRemove) => {
        if (timelines.length === 1) {
            alert("You must have a timeline");
            return;
        }
        setTimelines(timelines.filter(t => t.id !== idToRemove));
    };

    const handleSubmit = () => {
        const errors = [];

        const goalTitle = goalTitleRef.current?.value?.trim();
        if (!goalTitle) {
            errors.push("Goal title must be inputted");
        }

        const { startHour, startPeriod, endHour, endPeriod } = dailyHoursRef.current.getValues();
        const startFloat = parseFloat(startHour);
        const endFloat = parseFloat(endHour);

        if (!startHour || !endHour) {
            errors.push("Daily Hours are invalid");
        } else if (isNaN(startFloat) || isNaN(endFloat)) {
            errors.push("Daily Hours must be numbers");
        } else {
            const [startInt, startMin = '00'] = startHour.split(".");
            const [endInt, endMin = '00'] = endHour.split(".");

            if (
                startFloat < 0.01 || startFloat > 12.59 ||
                endFloat < 0.01 || endFloat > 12.59 ||
                parseInt(startMin) >= 60 ||
                parseInt(endMin) >= 60
            ) {
                errors.push("Daily Hours must be between 0.01 and 12.59, minutes < 60");
            } else {
                const start = convertTo24Hour(startHour, startPeriod);
                const end = convertTo24Hour(endHour, endPeriod);

                if (start === null || end === null || start >= end) {
                    errors.push("Daily Hours are invalid");
                }
            }
        }

        timelines.forEach((timeline, index) => {
            const titleText = timeline.title?.trim() || `Timeline Title ${index + 1}`;
            const refs = timelineRefs.current[timeline.id];

            const from = new Date(refs?.from?.current?.value);
            const to = new Date(refs?.to?.current?.value);

            if (!refs?.from?.current?.value || !refs?.to?.current?.value || isNaN(from) || isNaN(to) || from > to) {
                errors.push(`${titleText} Date is invalid`);
            }
        });

        if (errors.length > 0) {
            alert(errors.join("\n"));
        } else {
            alert("Submit successful");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <button className="close-btn" onClick={onClose}>
                    <img src={closeIcon} alt="Close" className="close-icon" />
                </button>

                <div className="tab-buttons">
                    <button className="tab activity-tab">Activity</button>
                    <button className="tab goal-tab">Goal</button>
                </div>

                <div className="form-group">
                    <input
                        type="text"
                        ref={goalTitleRef}
                        placeholder="Goal Title"
                        className="goal-title"
                    />
                </div>

                <DailyHours ref={dailyHoursRef} />

                {timelines.map((timeline, index) => (
                    <AddTimeline
                        key={timeline.id}
                        id={timeline.id}
                        index={index}
                        title={timeline.title}
                        onTitleChange={handleTitleChange}
                        onRemove={handleRemoveTimeline}
                        registerRefs={(from, to) => registerRefs(timeline.id, from, to)}
                    />
                ))}

                <button type="button" className="add-timeline" onClick={handleAddTimeline}>
                    + Timeline
                </button>

                <div className="button-row">
                    <button className="update-btn" onClick={handleSubmit}>Add / Update</button>
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default AddGoalModal;