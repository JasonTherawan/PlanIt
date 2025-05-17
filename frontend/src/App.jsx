import { useState } from 'react'
import './App.css'
import AddGoalModal from './components/AddGoalModal'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="app-container">
      <h1 className="app-title">PlanIt</h1>

      <button className="add-activity-btn">
        + Add Activity
      </button>
      <button className="add-goal-btn" onClick={() => setIsModalOpen(true)}>
        + Add Goal
      </button>

      {isModalOpen && (
        <AddGoalModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}

export default App
