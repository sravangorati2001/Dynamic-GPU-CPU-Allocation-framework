import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box
} from '@mui/material';

import Navbar from './components/Navbar';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ClusterDetails from './components/ClusterDetails';
import ManageGPUs from './components/ManageGPUs';

// Create theme with light background
const theme = createTheme({
  palette: {
    background: {
      default: '#f5f7fa',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          // bgcolor: 'background.default',
          // backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.5) 78%, rgba(255,255,255,0) 100%)',
          
          backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      >
        <Router>
          <Navbar />
          <Box sx={{ pt: 2 }}>
            <Routes>
              <Route path="/" element={<TaskForm />} />
              <Route path="/task-list" element={<TaskList />} />
              <Route path="/clusters/:clusterName" element={<ClusterDetails />} />
              <Route path="/manage-gpus" element={<ManageGPUs />} />
            </Routes>
          </Box>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;