
import React from 'react';

function App() {
  return (
    <div className="app-container">
      <h1>Collaboard React App</h1>
      <p>Welcome to Collaboard! Please use the functionality below.</p>
      
      <div className="room-creator">
        <input type="text" id="roomName" placeholder="Enter your room name..." />
        <button className="btn btn-primary" id="startBoarding">
          Start Boarding <i className="fas fa-pencil-alt"></i>
        </button>
        <p className="tip">Tip: Use a unique name or enter a 6-digit code to join an existing board</p>
      </div>

      <div className="auth-buttons" style={{ marginTop: '20px' }}>
        <a href="/frontend/auth.html?tab=login" className="btn btn-outline" style={{ marginRight: '10px' }}>Log in</a>
        <a href="/frontend/auth.html?tab=register" className="btn btn-primary">Sign up</a>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/frontend/index.html" className="btn btn-secondary">Go to Classic Collaboard</a>
      </div>
    </div>
  );
}

export default App;
