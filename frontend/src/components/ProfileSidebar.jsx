import React, { useState } from 'react';
import { FiArrowLeft, FiEdit, FiSave, FiX, FiLogOut, FiTrash2, FiKey } from 'react-icons/fi';

import './ProfileSidebar.css';

const ProfileSidebar = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [username, setUsername] = useState('John Doe');
  const [usernameInput, setUsernameInput] = useState(username);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');




  const handleEditClick = () => {
    setUsernameInput(username); // prefill with current username
    setIsEditing(true);
    setIsChangingPassword(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    if (usernameInput.trim() !== '') {
      setUsername(usernameInput);
    }
    setIsEditing(false);
  };

  const handleChangePasswordClick = () => {
    setIsChangingPassword(true);
    setIsEditing(false);
  };

  const handlePasswordCancelClick = () => {
    setIsChangingPassword(false);
  };

  const handlePasswordSaveClick = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    
    setPasswordError('');
    setIsChangingPassword(false);
    setNewPassword('');
    setConfirmPassword('');
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  return (
    <div className="profile-sidebar">
      <button className="icon-button back-icon" onClick={() => console.log('Back clicked')}>
        <FiArrowLeft />
      </button>

      <div className="profile-header">
        <label htmlFor="profile-picture" className="profile-picture-label">
          <div className="profile-picture-preview">
            
            {selectedImage ? (
              <img src={selectedImage} alt="Profile" className="profile-picture" />
            ) : (
              <div className="profile-picture" />
            )}
          </div>
          <input
            id="profile-picture"
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/gif"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </label>
        {isEditing ? (
          <input
            className="profile-name-input"
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
        ) : (
          <div className="profile-name">{username}</div>
        )}
      </div>

      <div className="profile-fields">
        {/* Bio */}
        <div className="field-section">
          <div className="field-header">Biography</div>
          <textarea
            placeholder="Bio.."
            disabled={!isEditing || isChangingPassword}
          />
        </div>

        {/* Date of Birth */}
        <div className="field-section">
          <div className="field-header">Date of Birth</div>
          <input
            type="date"
            placeholder="Date of Birth"
            disabled={!isEditing || isChangingPassword}
          />
        </div>

        {/* Email */}
        <div className="field-section">
          <div className="field-header">Email</div>
          <input
            type="email"
            value="john.doe@example.com"
            disabled
          />
        </div>

        {/* Teams */}
        <div className="field-section">
          <div className="field-header">Teams</div>
          <textarea
            value="Team A - Developer\nTeam B - Designer"
            disabled
          />
        </div>

        {/* Change password section */}
        {!isChangingPassword ? (
          <button
            className={`button secondary ${isEditing ? 'disabled-button' : ''}`}
            onClick={handleChangePasswordClick}
            disabled={isEditing}
          >
            <FiKey className="icon" /> Change Password
          </button>
        ) : (
          <>
            <input
              type="password"
              placeholder="New Password"
              className="password-input"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError('');
              }}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              className="password-input"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
            />
            {passwordError && (
              <div className="field-error">{passwordError}</div>
            )}
            <div className="profile-buttons">
              <button
                className="button primary"
                onClick={handlePasswordSaveClick}
                disabled={!newPassword || !confirmPassword}
              >
                <FiSave className="icon" /> Save
              </button>
              <button
                className="button secondary"
                onClick={handlePasswordCancelClick}
              >
                <FiX className="icon" /> Cancel
              </button>
            </div>
          </>
        )}

      </div>

      <div className="profile-buttons">
        {!isEditing ? (
          <button
            className={`button primary ${isChangingPassword ? 'disabled-button' : ''}`}
            onClick={handleEditClick}
            disabled={isChangingPassword}
          >
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
