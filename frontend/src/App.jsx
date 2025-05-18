import './App.css'
import { Routes, Route } from 'react-router-dom';

import registerPage from './views/RegisterPage'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<RegisterPage />} />
      </Routes>
    </>
  )
}

export default App