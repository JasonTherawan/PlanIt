import React, { useState } from 'react';
import { FiEdit, FiSave, FiX, FiLogOut, FiTrash2, FiKey } from 'react-icons/fi';
import './ProfileSidebar.css';

const ProfileSidebar = () => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => setIsEditing(true);
  const handleCancelClick = () => setIsEditing(false);
  const handleSaveClick = () => {
    //  logic save button
    setIsEditing(false);
  };

  return (
    <div className="profile-sidebar">
      <div className="profile-header">
        <div className="profile-picture"></div>
        <div className="profile-name">John Doe</div>
      </div>

      <div className="profile-fields">
        <textarea placeholder="Bio.." disabled={!isEditing} />
        <input type="email" placeholder="Email" disabled={!isEditing} />
        <input type="date" placeholder="Date of Birth" disabled={!isEditing} />
        <textarea placeholder="Teams (e.g., Team Title - Role)..." disabled={!isEditing} />
        <button className="button secondary">
          <FiKey className="icon" /> Change Password
        </button>
      </div>

      <div className="profile-buttons">
        {!isEditing ? (
          <button className="button primary" onClick={handleEditClick}>
            <FiEdit className="icon" /> Edit
          </button>
        ) : (
          <>
            <button className="button primary" onClick={handleSaveClick}>
              <FiSave className="icon" /> Save
            </button>
            <button className="button secondary" onClick={handleCancelClick}>
              <FiX className="icon" /> Cancel
            </button>
          </>
        )}
      </div>

      <div className="bottom-buttons">
        <button className="button warning">
          <FiLogOut className="icon" /> Log Out
        </button>
        <button className="button danger">
          <FiTrash2 className="icon" /> Delete Account
        </button>
      </div>
    </div>
  );
};

export default ProfileSidebar;
