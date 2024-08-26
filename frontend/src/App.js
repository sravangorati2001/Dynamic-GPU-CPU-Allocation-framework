import React from 'react';
import TaskForm from './components/TaskForm';
import Navbar from './components/Navbar';
import { Container } from '@mui/material';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Container>
        <TaskForm />
      </Container>
    </div>
  );
}

export default App;

