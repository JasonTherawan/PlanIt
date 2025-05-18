import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import ProfileSidebar from './components/ProfileSidebar';

function App() {
  return (
    <div className="app-container">
      <ProfileSidebar />
      {/* Your main calendar can go here */}
    </div>
  );
}


export default App
