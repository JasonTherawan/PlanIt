import React from 'react';
import './AddGoalModal.css';
import { closeIcon } from '../assets';

function AddGoalModal({ onClose }) {
    return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}>
            <img src={closeIcon} className="close-icon"/>
        </button>

        <div className="tab-buttons">
          <button className="tab activity-tab">Activity</button>
          <button className="tab goal-tab">Goal</button>
        </div>

        <h2 className="modal-title">Add Goal</h2>

        <div className="form-group">
          <label>Goal Title</label>
          <input type="text" placeholder="Enter goal title..." />
        </div>

        <div className="form-group">
          <label>Daily Hours</label>
          <div className="row-inputs">
            <input type="text" placeholder="9.00 PM" />
            <span>to</span>
            <input type="text" placeholder="11.00 PM" />
          </div>
        </div>

        <div className="form-group">
          <label>Timeline Title 1</label>
          <input type="text" placeholder="Description..." />
          <div className="row-inputs">
            <input type="date" />
            <span>to</span>
            <input type="date" />
          </div>
        </div>

        <button className="add-timeline">+ Timeline</button>

        <input type="text" className="progress-input" placeholder="Progress" />

        <div className="button-row">
          <button className="update-btn">Add / Update</button>
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
    );
}

export default AddGoalModal