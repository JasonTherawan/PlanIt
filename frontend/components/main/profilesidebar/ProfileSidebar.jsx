import React, { useState, useEffect } from 'react';
import {
  FiArrowLeft, FiEdit, FiSave, FiX,
  FiLogOut, FiTrash2, FiKey
} from 'react-icons/fi';
import { Link } from 'react-router-dom'
import './ProfileSidebar.css';

const ProfileSidebar = ({ onClose }) => {
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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleEditClick = () => {
    setUsernameInput(username);
    setUsernameError('');
    setIsEditing(true);
    setIsChangingPassword(false);
  };

  const handleCancelClick = () => setIsEditing(false);

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
    if (!currentPassword || !confirmCurrentPassword) {
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

  const handleConfirmNo = () => setShowDeleteConfirm(false);

  return (
    <div className="profile-sidebar-wrapper">
      <button className="icon-button back-icon" onClick={onClose}>
        <FiArrowLeft />
      </button>

      <div className="profile-header">
        <label htmlFor="profile-picture" className="profile-picture-label">
          <div className="profile-picture-preview">
            <img
              src={selectedImage || '/placeholder.svg?height=32&width=32'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <input
            id="profile-picture"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </label>
        {isEditing ? (
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
            {usernameError && <div className="field-error">{usernameError}</div>}
          </div>
        ) : (
          <div className="profile-name">{username}</div>
        )}
      </div>

      <div className="profile-fields">
        <div className="field-section">
          <div className="field-header">Biography</div>
          <textarea placeholder="Bio.." disabled={!isEditing || isChangingPassword || isDeletingAccount} />
        </div>
        <div className="field-section">
          <div className="field-header">Date of Birth</div>
          <input type="date" disabled={!isEditing || isChangingPassword || isDeletingAccount} />
        </div>
        <div className="field-section">
          <div className="field-header">Email</div>
          <input type="email" value="john.doe@example.com" disabled />
        </div>
        <div className="field-section">
          <div className="field-header">Teams</div>
          <textarea value="Team A - Developer\nTeam B - Designer" disabled />
        </div>

        {!isChangingPassword && (
          <button
            className={`button secondary ${isEditing ? 'disabled-button' : ''}`}
            onClick={handleChangePasswordClick}
            disabled={isEditing}
          >
            <FiKey className="icon" /> Change Password
          </button>
        )}
      </div>

      {isEditing && (
        <div className="profile-buttons">
          <button className="button primary" onClick={handleSaveClick}>
            <FiSave className="icon" /> Save
          </button>
          <button className="button secondary" onClick={handleCancelClick}>
            <FiX className="icon" /> Cancel
          </button>
        </div>
      )}

      {!isEditing && !isChangingPassword && !isDeletingAccount && (
        <div className="profile-buttons">
          <button className="button primary" onClick={handleEditClick}>
            <FiEdit className="icon" /> Edit
          </button>
        </div>
      )}

      {isChangingPassword && (
        <div className="profile-fields">
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
            <button className="button primary" onClick={handlePasswordSaveClick}>
              <FiSave className="icon" /> Save
            </button>
            <button className="button secondary" onClick={handlePasswordCancelClick}>
              <FiX className="icon" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bottom-buttons">
        <Link to="/landing" className="button warning">
          <FiLogOut className="icon" /> Log Out
        </Link>
        <button className="button danger" onClick={handleDeleteClick}>
          <FiTrash2 className="icon" /> Delete Account
        </button>
      </div>

      {isDeletingAccount && (
        <div className="delete-confirmation-fields">
          <input
            type="password"
            placeholder="Current Password"
            className="password-input"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setDeletePasswordError('');
            }}
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
          />
          {deletePasswordError && <div className="field-error">{deletePasswordError}</div>}
          <div className="profile-buttons">
            <button className="button danger" onClick={handleDeleteConfirmClick}>
              <FiTrash2 className="icon" /> Confirm
            </button>
            <button className="button secondary" onClick={handleDeleteCancelClick}>
              <FiX className="icon" /> Cancel
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="confirmation-popup">
          <div className="confirmation-content">
            <p className="confirmation-text">Are you sure you want to delete your account?</p>
            <div className="confirmation-buttons">
              <button className="button danger" onClick={handleConfirmYes}>Yes</button>
              <button className="button secondary" onClick={handleConfirmNo}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSidebar;