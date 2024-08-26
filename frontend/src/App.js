import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ManageGPUs from './components/ManageGPUs';  // New import

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<TaskForm />} />
        <Route path="/task-list" element={<TaskList />} />
        <Route path="/manage-gpus" element={<ManageGPUs />} />  {/* New Route */}
      </Routes>
    </Router>
  );
}

export default App;
