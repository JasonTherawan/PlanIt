import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AddGoalModal.css';
import { closeIcon } from '../assets';
import AddTimeline from './AddTimeline';
import DailyHours from './DailyHours';

function AddGoalModal({ onClose, onSaveDraft, onCancelDraft, isEditing }) {
    useEffect(() => {
        const saved = localStorage.getItem("draftGoal");
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                setGoalTitle(draft.goalTitle || '');
                if (draft.dailyHours) {
                    dailyHoursRef.current?.setValues?.(draft.dailyHours.start, draft.dailyHours.end);
                }

                if (draft.timelines?.length > 0) {
                    setTimelines(
                        draft.timelines.map(({ id, title }) => ({
                            id,
                            title: title || ''
                        }))
                    );
                    setCounter(draft.timelines.length);

                    setTimeout(() => {
                        draft.timelines.forEach((timeline) => {
                            const ref = timelineRefs.current[timeline.id];
                            if (ref?.current?.setData) {
                                ref.current.setData({
                                    from: timeline.from,
                                    to: timeline.to,
                                    description: timeline.description
                                });
                            }
                        });
                    }, 0);
                }
            } catch (err) {
                console.error("Invalid draftGoal format", err);
            }
        }
    }, []);

    const [errorMessages, setErrorMessages] = useState([]);

    const goalTitleRef = useRef();
    const [goalTitle, setGoalTitle] = useState('');

    const dailyHoursRef = useRef();

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
        setTimelineRemoveError('');
    };

    const [timelineRemoveError, setTimelineRemoveError] = useState('');
    const handleRemoveTimeline = (idToRemove) => {
        if (timelines.length === 1) {
            setTimelineRemoveError("You must have at least one timeline.");
            return;
        }
        else {
            setTimelineRemoveError("");
        }
        setTimelines(timelines.filter(t => t.id !== idToRemove));
    };

    const [goalTitleError, setGoalTitleError] = useState('');
    const [dailyHoursError, setDailyHoursError] = useState('');
    const [timelineErrors, setTimelineErrors] = useState([]);

    const handleSubmit = () => {
        setGoalTitleError('');
        setDailyHoursError('');
        setTimelineErrors([]);
        setErrorMessages([]);

        const errors = [];

        if (!goalTitle.trim()) {
            const msg = "Goal title must be inputted";
            setGoalTitleError(msg);
            errors.push(msg);
        }

        const { start, end } = dailyHoursRef.current.getValues();
        if (start === null || end === null || start >= end) {
            const msg = "Daily Hours are invalid";
            setDailyHoursError(msg);
            errors.push(msg);
        }

        const enrichedTimelines = timelines.map((timeline, index) => {
            const ref = timelineRefs.current[timeline.id];
            const { from, to } = ref.current?.getDateRange?.() || {};
            const title = timeline.title?.trim();
            const titleText = title || `Timeline Title ${index + 1}`;
            return { id: timeline.id, index, title, titleText, from, to };
        });

        let latestEndDate = null;
        const timelineErrs = [];

        enrichedTimelines.forEach((timeline, i) => {
            const errs = [];

            if (!timeline.title) errs.push("Title must be inputted");
            if (!timeline.from || !timeline.to || timeline.from > timeline.to) {
                errs.push(`${timeline.titleText} Date Range is invalid`);
            }
            if (timeline.from && latestEndDate && timeline.from <= latestEndDate) {
                errs.push(`Must start after ${enrichedTimelines[i - 1]?.titleText}`);
            }

            if (timeline.to && (!latestEndDate || timeline.to > latestEndDate)) {
                latestEndDate = timeline.to;
            }

            timelineErrs.push(errs);
            if (errs.length > 0) errors.push(...errs);
        });

        setTimelineErrors(timelineErrs);

        if (errors.length > 0) return;

        alert("Submit successful");
        localStorage.removeItem("draftGoal");
        onClose();
    };

    const getDraftData = () => {
        const { start, end } = dailyHoursRef.current.getValues();

        const timelinesData = timelines
            .map((timeline, index) => {
                const ref = timelineRefs.current[timeline.id];
                const { from, to, description } = ref.current?.getDateRange?.() || {};
                const title = timeline.title?.trim();

                const isEmptyTimeline = !title && !description && !from && !to;
                if (isEmptyTimeline) return null;

                return {
                    id: timeline.id,
                    title,
                    description,
                    from,
                    to
                };
            })
            .filter(Boolean);

        return {
            goalTitle: goalTitle.trim(),
            dailyHours: { start, end },
            timelines: timelinesData
        };
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <button className="close-btn" onClick={() => {
                    const draft = getDraftData();

                    const isEmpty =
                        !draft.goalTitle &&
                        draft.timelines.every(t =>
                            !t.title && !t.description && !t.from && !t.to
                        ) &&
                        draft.dailyHours.start === null &&
                        draft.dailyHours.end === null;

                    if (!isEmpty && onSaveDraft) {
                        onSaveDraft(draft);
                    } else {
                        onClose();
                    }
                }}>
                    <img src={closeIcon} alt="Close" className="close-icon" />
                </button>

                {errorMessages.length > 0 && (
                    <div className="error-box">
                        <ul>
                            {errorMessages.map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="tab-buttons">
                    <button className="tab activity-tab">Activity</button>
                    <button className="tab goal-tab">Goal</button>
                </div>

                <div className="form-group">
                    <input
                        type="text"
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        placeholder="Goal Title"
                        className={`goal-title ${goalTitle ? 'filled' : ''}`}
                        autoFocus
                    />
                    {goalTitleError && <div className="error-text goal-title-error">{goalTitleError}</div>}
                </div>

                <DailyHours ref={dailyHoursRef} />
                {dailyHoursError && <div className="error-text">{dailyHoursError}</div>}

                {timelines.map((timeline, index) => {
                    const timelineRef = timelineRefs.current[timeline.id] ||= React.createRef();

                    return (
                        <div key={timeline.id}>
                            <AddTimeline
                                ref={timelineRef}
                                id={timeline.id}
                                index={index}
                                title={timeline.title}
                                onTitleChange={handleTitleChange}
                                onRemove={handleRemoveTimeline}
                            />
                            {timelineErrors[index] &&
                                timelineErrors[index].map((err, i) => (
                                    <div className="timeline-error" key={i}>{err}</div>
                                ))
                            }
                        </div>
                    );
                })}
                {timelineRemoveError && <div className="error-text">{timelineRemoveError}</div>}
                <button type="button" className="add-timeline" onClick={handleAddTimeline}>
                    + Timeline
                </button>

                {isEditing ? (
                    <div className="button-row">
                        <button className="update-btn" onClick={handleSubmit}>Update</button>
                        <button className="cancel-btn" onClick={onCancelDraft}>Cancel changes</button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button className="update-btn" onClick={handleSubmit}>Add</button>
                    </div>
                )}
            </div>
        </div >
    );
}

export default AddGoalModal;