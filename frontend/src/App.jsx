import { useState } from 'react';
import './App.css';
import AddGoalModal from './components/AddGoalModal';
import AddActivityModal from './components/AddActivityModal'; // ← make sure this exists
import useModal from './hooks/useModal';

function App() {
  const {
    isOpen: isGoalModalOpen,
    openModal: openGoalModal,
    closeModal: closeGoalModal
  } = useModal();

  const {
    isOpen: isActivityModalOpen,
    openModal: openActivityModal,
    closeModal: closeActivityModal
  } = useModal();

  const [isEditingGoal, setIsEditingGoal] = useState(false);

  return (
    <div className="app-container">
      <h1 className="app-title">PlanIt</h1>

      <button className="add-activity-btn" onClick={openActivityModal}>
        + Add Activity
      </button>

      <button
        className="add-goal-btn"
        onClick={() => {
          setIsEditingGoal(false);
          openGoalModal();
        }}
      >
        + Add Goal
      </button>

      {isGoalModalOpen && (
        <AddGoalModal
          isEditing={isEditingGoal}
          onClose={closeGoalModal}
          onSaveDraft={(draft) => {
            localStorage.setItem("draftGoal", JSON.stringify(draft));
            closeGoalModal();
          }}
          onCancelDraft={() => {
            localStorage.removeItem("draftGoal");
            closeGoalModal();
          }}
        />
      )}

      {isActivityModalOpen && (
        <AddActivityModal
          onClose={closeActivityModal}
        />
      )}
    </div>
  );
}

export default App;
