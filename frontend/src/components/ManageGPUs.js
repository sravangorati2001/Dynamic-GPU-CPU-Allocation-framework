import React, { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Grid, Container, Paper, Tooltip } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const ResourceItem = ({ label, value, tooltip }) => (
  <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
    <Typography variant="h6" component="div">
      {label}
    </Typography>
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1 }}>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mr: 1 }}>
        {value}
      </Typography>
      <Tooltip title={tooltip} placement="right">
        <InfoOutlinedIcon color="action" fontSize="small" />
      </Tooltip>
    </Box>
  </Paper>
);

function ManageResources() {
  const [availableGPUs, setAvailableGPUs] = useState(0);
  const [freeGPUs, setFreeGPUs] = useState(0);
  const [availableCPUs, setAvailableCPUs] = useState(0);
  const [freeCPUs, setFreeCPUs] = useState(0);
  const [taskList, setTaskList] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [gpusToAdd, setGpusToAdd] = useState('');
  const [cpusToAdd, setCpusToAdd] = useState('');

  useEffect(() => {
    fetchResources();
    fetchTasks();
  }, []);

  const fetchResources = () => {
    axios.get(`${API_BASE_URL}/available-resources`)
      .then(response => {
        setAvailableGPUs(response.data.totalAllocatableGPUs);
        setFreeGPUs(response.data.freeGPUs);
        setAvailableCPUs(response.data.totalAllocatableCPUs);
        setFreeCPUs(response.data.freeCPUs);
      })
      .catch(error => {
        console.error('Error fetching available resources:', error);
      });
  };

  const fetchTasks = () => {
    axios.get(`${API_BASE_URL}/tasks`)
      .then(response => {
        setTaskList(response.data.tasks);
      })
      .catch(error => {
        console.error('Error fetching task list:', error);
      });
  };

  const handleTaskChange = (event, value) => {
    setSelectedTask(value);
  };

  const handleGpuChange = (e) => {
    setGpusToAdd(e.target.value);
  };

  const handleCpuChange = (e) => {
    setCpusToAdd(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      taskName: selectedTask,
      gpus: gpusToAdd,
      cpus: cpusToAdd,
    };
    axios.post(`${API_BASE_URL}/add-resources`, data)
      .then(response => {
        alert('Resources successfully added to the task!');
        fetchResources(); // Refresh resource data after adding
        setGpusToAdd('');
        setCpusToAdd('');
        setSelectedTask('');
      })
      .catch(error => {
        console.error('Error adding resources:', error);
        alert('Error adding resources. Please try again.');
      });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Manage GPUs and CPUs
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <ResourceItem
              label="Available GPUs"
              value={availableGPUs}
              tooltip="Total number of GPUs installed on the system."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ResourceItem
              label="Free GPUs"
              value={freeGPUs}
              tooltip="Number of GPUs that are currently available for assignment."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ResourceItem
              label="Available CPUs"
              value={availableCPUs}
              tooltip="Total number of CPUs installed on the system."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ResourceItem
              label="Free CPUs"
              value={freeCPUs}
              tooltip="Number of CPUs that are currently available for assignment."
            />
          </Grid>
        </Grid>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12}>
            <Autocomplete
              options={taskList}
              value={selectedTask}
              onChange={handleTaskChange}
              renderInput={(params) => (
                <TextField {...params} label="Select Task" variant="outlined" fullWidth required />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Upgrade GPU's to"
              variant="outlined"
              name="gpusToAdd"
              value={gpusToAdd}
              onChange={handleGpuChange}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Upgrade CPU's to"
              variant="outlined"
              name="cpusToAdd"
              value={cpusToAdd}
              onChange={handleCpuChange}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              type="submit"
              size="large"
            >
              Add Resources
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default ManageResources;
