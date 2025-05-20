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
  const [usernameError, setUsernameError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmCurrentPassword, setConfirmCurrentPassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEditClick = () => {
    setUsernameInput(username);
    setUsernameError('');
    setIsEditing(true);
    setIsChangingPassword(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    if (usernameInput.trim() === '') {
      setUsernameError('Username cannot be empty');
      return;
    }

    setUsername(usernameInput.trim());
    setIsEditing(false);
    setUsernameError('');
  };

  const handleChangePasswordClick = () => {
    setIsChangingPassword(true);
    setIsEditing(false);
  };

  const handlePasswordCancelClick = () => {
    setIsChangingPassword(false);
    setPasswordError('');
    setNewPassword('');
    setConfirmPassword('');
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

  const handleDeleteClick = () => {
    setIsDeletingAccount(true);
    setIsEditing(false);
    setIsChangingPassword(false);
    setDeletePasswordError('');
    setCurrentPassword('');
    setConfirmCurrentPassword('');
  };

  const handleDeleteCancelClick = () => {
    setIsDeletingAccount(false);
    setDeletePasswordError('');
    setCurrentPassword('');
    setConfirmCurrentPassword('');
  };

  const handleDeleteConfirmClick = () => {
    if (currentPassword === '' || confirmCurrentPassword === '') {
      setDeletePasswordError('Please fill in both fields');
      return;
    }
    if (currentPassword !== confirmCurrentPassword) {
      setDeletePasswordError('Passwords do not match');
      return;
    }
    setDeletePasswordError('');
    setShowDeleteConfirm(true);
  };

  const handleConfirmYes = () => {
    setShowDeleteConfirm(false);
    setIsDeletingAccount(false);

    alert('Account deleted!');
  };

  const handleConfirmNo = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="profile-sidebar">
      {!isEditing && !isChangingPassword && !isDeletingAccount && (
        <button className="icon-button back-icon" onClick={() => console.log('Back clicked')}>
          <FiArrowLeft />
        </button>
      )}

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
          <>
            <div className="username-input-wrapper">
              <input
                className="profile-name-input"
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setUsernameError('');
                }}
              />
              {usernameError && (
                <div className="field-error" style={{ marginTop: '4px' }}>
                  {usernameError}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="profile-name">{username}</div>
        )}
      </div>

      <div className="profile-fields">
        {/* Bio */}
        <div className="field-section">
          <div className="field-header">Biography</div>
          <textarea placeholder="Bio.." disabled={!isEditing || isChangingPassword || isDeletingAccount} />
        </div>

        {/* Date of Birth */}
        <div className="field-section">
          <div className="field-header">Date of Birth</div>
          <input type="date" placeholder="Date of Birth" disabled={!isEditing || isChangingPassword || isDeletingAccount} />
        </div>

        {/* Email */}
        <div className="field-section">
          <div className="field-header">Email</div>
          <input type="email" value="john.doe@example.com" disabled />
        </div>

        {/* Teams */}
        <div className="field-section">
          <div className="field-header">Teams</div>
          <textarea value="Team A - Developer\nTeam B - Designer" disabled />
        </div>

        {/* Change password section */}
        {!isChangingPassword ? (
          <button
            className={`button secondary ${isEditing || isDeletingAccount ? 'disabled-button' : ''}`}
            onClick={handleChangePasswordClick}
            disabled={isEditing || isDeletingAccount}
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
            {passwordError && <div className="field-error">{passwordError}</div>}
            <div className="profile-buttons">
              <button className="button primary" onClick={handlePasswordSaveClick} disabled={!newPassword || !confirmPassword}>
                <FiSave className="icon" /> Save
              </button>
              <button className="button secondary" onClick={handlePasswordCancelClick}>
                <FiX className="icon" /> Cancel
              </button>
            </div>
          </>
        )}
      </div>

      <div className="profile-buttons">
        {!isEditing ? (
          <button
            className={`button primary ${isChangingPassword || isDeletingAccount ? 'disabled-button' : ''}`}
            onClick={handleEditClick}
            disabled={isChangingPassword || isDeletingAccount}
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
        <button className="button danger" onClick={handleDeleteClick}>
          <FiTrash2 className="icon" /> Delete Account
        </button>


        {isDeletingAccount && (
          <div className="delete-confirmation-fields" style={{ marginTop: '12px' }}>
            <input
              type="password"
              placeholder="Current Password"
              className="password-input"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setDeletePasswordError('');
              }}
              style={{ marginBottom: '8px' }}
            />
            <input
              type="password"
              placeholder="Confirm Current Password"
              className="password-input"
              value={confirmCurrentPassword}
              onChange={(e) => {
                setConfirmCurrentPassword(e.target.value);
                setDeletePasswordError('');
              }}
              style={{ marginBottom: '8px' }}
            />
            {deletePasswordError && (
              <div className="field-error" style={{ marginBottom: '8px' }}>
                {deletePasswordError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="button danger"
                onClick={handleDeleteConfirmClick}
                disabled={!currentPassword || !confirmCurrentPassword}
                style={{ flex: 1 }}
              >
                <FiTrash2 className="icon" /> Confirm
              </button>
              <button className="button secondary" onClick={handleDeleteCancelClick} style={{ flex: 1 }}>
                <FiX className="icon" /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="confirmation-popup">
          <div className="confirmation-content">
            <p className="confirmation-text">
              Are you sure you want to delete your account?
            </p>
            <div className="confirmation-buttons">
              <button className="button danger" onClick={handleConfirmYes}>
                Yes
              </button>
              <button className="button secondary" onClick={handleConfirmNo}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileSidebar;
