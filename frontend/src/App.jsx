import { useState } from 'react';
import './App.css';
import AddGoalModal from './components/AddGoalModal';
import useModal from './hooks/useModal';

function App() {
  const {
    isOpen: isGoalModalOpen,
    openModal: openGoalModal,
    closeModal: closeGoalModal
  } = useModal();

  const [isEditingGoal, setIsEditingGoal] = useState(false);

  return (
    <div className="app-container">
      <h1 className="app-title">PlanIt</h1>

      <button className="add-activity-btn">
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
    </div>
  );
}

export default App;