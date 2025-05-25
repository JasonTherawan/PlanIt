import React, { useEffect, useRef, useState } from 'react'
import './AddActivityModal.css'
import { closeIcon, calendarIcon } from '../../../assets'
import DailyHours from '../DailyHours'

function AddActivityModal({ onClose, onSwitchToGoal, onSaveDraft, onCancelDraft, isEditing }) {
  const dailyHoursRef = useRef()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('draftActivity')
    if (saved && !isEditing) {
      try {
        const draft = JSON.parse(saved)
        setTitle(draft.title || '')
        setDescription(draft.description || '')
        setUrgency(draft.urgency || '')
        setCategory(draft.category || '')
        setDate(draft.date || '')
        if (draft.dailyHours) {
          dailyHoursRef.current?.setValues?.(draft.dailyHours.start, draft.dailyHours.end)
        }
      } catch (err) {
        console.error('Invalid draftActivity format', err)
      }
    }
  }, [isEditing])

  const getDraftData = () => {
    const { start, end } = dailyHoursRef.current?.getValues() || {}
    return {
      title: title.trim(),
      description,
      urgency,
      category,
      date,
      dailyHours: { start, end }
    }
  }

  const handleClose = () => {
    const draft = getDraftData()
    if (onSaveDraft) {
      onSaveDraft(draft)
    }
  }

  const handleSubmit = () => {
    const draft = getDraftData()
    const errors = []

    if (!draft.title) errors.push('Activity title must be inputted')
    if (!draft.urgency) errors.push('Urgency Level must be selected')
    if (!draft.category) errors.push('Category must be selected')
    if (!draft.date) errors.push('Main Date must be selected')
    if (
      draft.dailyHours.start == null ||
      draft.dailyHours.end == null ||
      draft.dailyHours.start >= draft.dailyHours.end
    ) {
      errors.push('Hours must be valid and in range')
    }

    if (errors.length > 0) {
      alert(errors.join('\n'))
    } else {
      alert(isEditing ? 'Update successful' : 'Submit successful')
      localStorage.removeItem('draftActivity')
      onClose()
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="activity-close-btn" onClick={handleClose}>
          <img src={closeIcon} alt="Close" className="activity-close-icon" />
        </button>

        {isEditing ? (
          <div className="tab-buttons">
            <span className="tab active text-center w-full pointer-events-none">Activity</span>
          </div>
        ) : (
          <div className="tab-buttons">
            <button className="tab activity-tab active">Activity</button>
            <button className="tab goal-tab inactive" onClick={onSwitchToGoal}>Goal</button>
          </div>
        )}

        <div className="activity-form-group">
          <input
            type="text"
            placeholder="Activity Title"
            className={`activity-title ${title ? 'filled' : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        </div>

        <textarea
          placeholder="Description . . ."
          className="description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="activity-form-group">
          <select
            className={`activity-select ${urgency ? 'activity-select-active' : ''}`}
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
          >
            <option value="" disabled>Urgency Level</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        <div className="activity-form-group">
          <select
            className={`activity-select ${category ? 'activity-select-active' : ''}`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="" disabled>Category</option>
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
              className="activity-custom-date-input activity-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
  )
}

export default AddActivityModal