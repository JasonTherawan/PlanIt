import './App.css'
import { Routes, Route } from 'react-router-dom';

import RegisterPage from './views/RegisterPage';
import LoginPage from './views/LoginPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
      </Routes>
    </>
  )
}

export default App;
