import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AddActivityModal.css';
import { closeIcon } from '../assets';
import DailyHours from './DailyHours';
import { calendarIcon } from '../assets';

function AddActivityModal({ onClose }) {
    // Modal Effect: Prevent page scroll (only pop up scroll)
    useEffect(() => {
        document.body.classList.add("modal-open");
        return () => {
            document.body.classList.remove("modal-open");
        };
    }, []);

    const activityTitleRef = useRef();
    const dailyHoursRef = useRef();

    const convertTo24Hour = (hourStr, period) => {
        const h = parseFloat(hourStr);
        if (isNaN(h) || h < 1 || h >= 13) return null;

        let base = period === "AM" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
        return base;
    };


    const handleSubmit = () => {
        const errors = [];

        const activityTitle = activityTitleRef.current?.value?.trim();
        if (!activityTitle) {
            errors.push("Activity title must be inputted");
        }

        const selects = document.querySelectorAll(".activity-select");
        const urgency = selects[0]?.value;
        const category = selects[1]?.value;

        if (!urgency || urgency === "Urgency Level") {
            errors.push("Urgency Level must be selected");
        }

        if (!category || category === "Category") {
            errors.push("Category must be selected");
        }
        const { startHour, startPeriod, endHour, endPeriod } = dailyHoursRef.current.getValues();
        const startFloat = parseFloat(startHour);
        const endFloat = parseFloat(endHour);

        if (!startHour || !endHour) {
            errors.push("Hours are invalid");
        } else if (isNaN(startFloat) || isNaN(endFloat)) {
            errors.push("Hours must be numbers");
        } else {
            const [startInt, startMin = '00'] = startHour.split(".");
            const [endInt, endMin = '00'] = endHour.split(".");

            if (
                startFloat < 0.01 || startFloat > 12.59 ||
                endFloat < 0.01 || endFloat > 12.59 ||
                parseInt(startMin) >= 60 ||
                parseInt(endMin) >= 60
            ) {
                errors.push("Hours must be between 0.01 and 12.59, minutes < 60");
            } else {
                const start = convertTo24Hour(startHour, startPeriod);
                const end = convertTo24Hour(endHour, endPeriod);

                if (start === null || end === null || start >= end) {
                    errors.push("Hours are invalid");
                }
            }
        }
        const mainDate = document.querySelector(".custom-date-input")?.value;
        if (!mainDate) {
            errors.push("Main Date must be selected");
        }
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
                        ref={activityTitleRef}
                        placeholder="Activity Title"
                        className="activity-title centered-title"
                    />
                </div>
                <div className="modal-content-container">
                    <div className="left-section">

                        <div className="form-group">
                            <textarea
                                placeholder="Description . . ."
                                className="description-input"
                            />
                        </div>

                        <div className="form-group">
                            <select className="activity-select">
                                <option disabled selected>Urgency Level</option>
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <select className="activity-select">
                                <option disabled selected>Category</option>
                                <option>Personal</option>
                                <option>Work</option>
                                <option>Health</option>
                            </select>
                        </div>

                        <DailyHours ref={dailyHoursRef} />
                    </div>

                    <div className="right-section">
                        <div className="calendar-card">
                            <div className="calendar-header">Date</div>
                            <div className="date-wrapper">
                                <input
                                    type="date"
                                    className="custom-date-input"
                                    onFocus={(e) => e.target.click()} // opens calendar on focus
                                />
                                <span className="calendar-icon">
                                    <img src={calendarIcon} alt="Calendar Icon" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="button-row">
                    <button className="update-btn" onClick={handleSubmit}>Add / Update</button>
                    <button className="cancel-btn" onClick={onClose}>Cancel Changes</button>
                </div>

            </div>
        </div>
    );
}

export default AddActivityModal;