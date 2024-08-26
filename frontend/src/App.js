import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import Navbar from './components/Navbar';
import { Container } from '@mui/material';

function App() {
  return (
    <Router>
      <Navbar />
      <Container>
        <Routes>
          <Route path="/" element={<TaskForm />} />
          <Route path="/task-list" element={<TaskList />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
