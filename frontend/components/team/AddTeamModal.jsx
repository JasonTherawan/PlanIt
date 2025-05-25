import React, { useRef, useState, useEffect } from 'react';
import './AddTeamModal.css';
import DailyHours from '../main/DailyHours';
import { closeIcon } from '../../assets';

function AddTeamModal({ onClose, onSaveDraft, onCancelDraft, isEditing, addTeam }) {
    const teamTitleRef = useRef();
    const dailyHoursRef = useRef();
    const descriptionRef = useRef();

    const statusStyles = {
        Accepted: { color: "green", label: "Accepted" },
        Pending: { color: "#FF4500", label: "Pending" },
        Rejected: { color: "red", label: "Rejected" },
        NotFound: { color: "gray", label: "Not Found" },
    };

    const [people, setPeople] = useState([
        {
            name: 'Revaldo',
            status: 'Accepted',
            pic: '/images/test1.jpg'
        },
        {
            name: 'Hizkia',
            status: 'Pending',
            pic: '/images/test1.jpg'
        },
        {
            name: 'Albert',
            status: 'NotFound',
            pic: '/images/test1.jpg'
        },
        {
            name: 'Jacky',
            status: 'Rejected',
            pic: '/images/test1.jpg'
        }
    ]);

    useEffect(() => {
        const saved = localStorage.getItem("draftTeam");
        if (saved && !isEditing) {
            try {
                const draft = JSON.parse(saved);
                if (teamTitleRef.current) teamTitleRef.current.value = draft.title || '';
                if (descriptionRef.current) descriptionRef.current.value = draft.description || '';
                if (draft.people?.length) setPeople(draft.people);
                if (draft.dailyHours) {
                    dailyHoursRef.current?.setValues?.(draft.dailyHours.start, draft.dailyHours.end);
                }
            } catch (err) {
                console.error("Invalid draftTeam format", err);
            }
        }
    }, []);

    const getDraftData = () => {
        const { start, end } = dailyHoursRef.current.getValues();
        return {
            title: teamTitleRef.current?.value?.trim(),
            description: descriptionRef.current?.value?.trim(),
            people,
            dailyHours: { start, end }
        };
    };

    const handleSubmit = () => {
        const draft = getDraftData();
        const errors = [];

        if (!draft.title) errors.push("Team title must be inputted");
        if (draft.dailyHours.start == null || draft.dailyHours.end == null || draft.dailyHours.start >= draft.dailyHours.end) {
            errors.push("Working hours are invalid");
        }

        if (errors.length > 0) {
            alert(errors.join("\n"));
            return;
        }

        alert(isEditing ? "Update successful" : "Add successful");
        localStorage.removeItem("draftTeam");
        onClose();
    };

    const handleClose = () => {
        const draft = getDraftData();
        if (onSaveDraft) {
            onSaveDraft(draft);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                {/* Close Button */}
                <button className="close-btn" onClick={handleClose}>
                    <img src={closeIcon} alt="Close" className="close-icon" />
                </button>

                {/* Tab Static Display */}
                <div className="tab-buttons">
                    <span className="tab active text-center w-full pointer-events-none">Team</span>
                </div>

                {/* Team Title Input */}
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Team Title"
                        className="goal-title"
                        ref={teamTitleRef}
                        autoFocus
                    />
                </div>

                {/* Email Input */}
                <label className="form-label">Invite via Email</label>
                <input
                    type="email"
                    className="goal-title"
                    placeholder="Enter email (not functional)"
                    disabled
                />

                {/* People Invited List */}
                <label className="form-label" style={{ marginTop: '20px' }}>People Invited</label>
                <div className="timeline-section">
                    {people.length === 0 ? (
                        <p className="text-gray-500 text-sm italic mb-3.5">No members yet</p>
                    ) : (
                        people.map((person, index) => (
                            <div
                                key={index}
                                className="timeline-body"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}
                            >
                                <img
                                    src={person.pic}
                                    alt={person.name}
                                    style={{
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        marginRight: '10px'
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div className="invited-name">{person.name}</div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: statusStyles[person.status]?.color || 'gray'
                                    }}>
                                        {statusStyles[person.status]?.label || person.status}
                                    </div>
                                </div>
                                <button
                                    className="remove-btn"
                                    onClick={() =>
                                        setPeople(prev => prev.filter((_, i) => i !== index))
                                    }
                                >
                                    <img src={closeIcon} alt="Remove" className="bin-icon" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Working Hours */}
                <label className="form-label">Working Hours</label>
                <DailyHours ref={dailyHoursRef} />

                {/* Description */}
                <label className="form-label" style={{ marginTop: '20px' }}>Description</label>
                <textarea
                    className="description-input"
                    placeholder="Enter team description..."
                    ref={descriptionRef}
                />

                {/* Buttons */}
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

export default AddTeamModal;