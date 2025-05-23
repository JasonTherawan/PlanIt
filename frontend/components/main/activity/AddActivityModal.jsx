import React, { useState, useRef, useEffect } from 'react';
import './AddActivityModal.css';
import { closeIcon, calendarIcon } from '../../../assets';
import DailyHours from '../DailyHours';

function AddActivityModal({ onClose, onSwitchToGoal, isEditing, onCancelDraft }) {
    useEffect(() => {
        document.body.classList.add("modal-open");
        return () => document.body.classList.remove("modal-open");
    }, []);

    const activityTitleRef = useRef();
    const dailyHoursRef = useRef();

    const convertTo24Hour = (hourStr, period) => {
        const h = parseFloat(hourStr);
        if (isNaN(h) || h < 1 || h >= 13) return null;
        return period === "AM" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
    };

    const handleSubmit = () => {
        const errors = [];
        const activityTitle = activityTitleRef.current?.value?.trim();
        if (!activityTitle) errors.push("Activity title must be inputted");

        const selects = document.querySelectorAll(".activity-select");
        const urgency = selects[0]?.value;
        const category = selects[1]?.value;

        if (!urgency || urgency === "Urgency Level") errors.push("Urgency Level must be selected");
        if (!category || category === "Category") errors.push("Category must be selected");

        const { startHour, startPeriod, endHour, endPeriod } = dailyHoursRef.current.getValues();
        const startFloat = parseFloat(startHour);
        const endFloat = parseFloat(endHour);

        if (!startHour || !endHour || isNaN(startFloat) || isNaN(endFloat)) {
            errors.push("Hours must be valid numbers");
        } else {
            const [startMin = '00'] = startHour.split(".")[1] || ['00'];
            const [endMin = '00'] = endHour.split(".")[1] || ['00'];

            if (startFloat < 0.01 || startFloat > 12.59 || endFloat < 0.01 || endFloat > 12.59 ||
                parseInt(startMin) >= 60 || parseInt(endMin) >= 60) {
                errors.push("Hours must be between 0.01 and 12.59 with valid minutes");
            } else {
                const start = convertTo24Hour(startHour, startPeriod);
                const end = convertTo24Hour(endHour, endPeriod);
                if (start === null || end === null || start >= end) errors.push("Hour range invalid");
            }
        }

        const mainDate = document.querySelector(".activity-date-input")?.value;
        if (!mainDate) errors.push("Main Date must be selected");

        if (errors.length > 0) {
            alert(errors.join("\n"));
        } else {
            alert("Submit successful");
        }
    };

    return (
        <div className= "modal-overlay">
            <div className="modal-box">
                <button className="activity-close-btn" onClick={onClose}>
                    <img src={closeIcon} alt="Close" className="activity-close-icon" />
                </button>

                <div className="tab-buttons">
                    <button className="tab activity-tab active">Activity</button>
                    <button className="tab goal-tab inactive" onClick={onSwitchToGoal}>Goal</button>
                </div>

                <div className="activity-form-group">
                    <input
                        type="text"
                        ref={activityTitleRef}
                        placeholder="Activity Title"
                        className="activity-title"
                    />
                </div>

                <textarea
                    placeholder="Description . . ."
                    className="description-input"
                ></textarea>

                <div className="activity-form-group">
                    <select className="activity-select">
                        <option disabled selected>Urgency Level</option>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                </div>

                <div className="activity-form-group">
                    <select className="activity-select">
                        <option disabled selected>Category</option>
                        <option>Personal</option>
                        <option>Work</option>
                        <option>Health</option>
                    </select>
                </div>

                <label className="time-label">Time</label>
                <DailyHours ref={dailyHoursRef} />

                <div className="activity-form-group">
                    <label className="activity-form-label">Date</label>
                    <div className="activity-date-wrapper">
                        <input
                            type="date"
                            className="activity-custom-date-input"
                            onFocus={(e) => e.target.select()}
                        />
                        <span className="activity-calendar-icon">
                            <img src={calendarIcon} alt="Calendar Icon" />
                        </span>
                    </div>
                </div>

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
        </div>
    );
}

export default AddActivityModal;