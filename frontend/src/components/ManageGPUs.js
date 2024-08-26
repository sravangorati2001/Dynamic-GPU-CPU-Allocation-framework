import React, { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Grid, Container, IconButton, Tooltip } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import axios from 'axios';

function ManageGPUs() {
  const [availableGPUs, setAvailableGPUs] = useState(0);
  const [freeGPUs, setFreeGPUs] = useState(0);
  const [taskList, setTaskList] = useState([]);  // Task list for the dropdown
  const [selectedTask, setSelectedTask] = useState('');
  const [gpusToAdd, setGpusToAdd] = useState('');

  useEffect(() => {
    // Fetch the number of available and free GPUs from backend
    axios.get('http://localhost:8080/available-gpus')
      .then(response => {
        setAvailableGPUs(response.data.totalAllocatableGPUs);
        setFreeGPUs(response.data.freeGPUs);
      })
      .catch(error => {
        console.error('Error fetching available GPUs:', error);
      });

    // Fetch the list of tasks (Kubernetes pods)
    axios.get('http://localhost:8080/tasks')
      .then(response => {
        setTaskList(response.data.tasks);  // Set the task names
      })
      .catch(error => {
        console.error('Error fetching task list:', error);
      });
  }, []);

  const handleTaskChange = (event, value) => {
    setSelectedTask(value);
  };

  const handleGpuChange = (e) => {
    setGpusToAdd(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // API call to add GPUs to an existing task
    const data = {
      taskName: selectedTask,
      gpus: gpusToAdd
    };
    axios.post('http://localhost:8080/add-gpus', data)
      .then(response => {
        alert('GPUs successfully added to the task!');
      })
      .catch(error => {
        console.error('Error adding GPUs:', error);
      });
  };

  return (
    <Container>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Manage GPUs
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Available GPUs: {availableGPUs}
          </Typography>
          <Tooltip title="Total number of GPUs installed on the system." placement="right">
            <IconButton>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4 }}>
          <Typography variant="h6">
            Free GPUs: {freeGPUs}
          </Typography>
          <Tooltip title="Number of GPUs that are currently available for assignment." placement="right">
            <IconButton>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={taskList}  // Dynamically fetched task list
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
              label="Number of GPUs to Add"
              variant="outlined"
              name="gpusToAdd"
              value={gpusToAdd}
              onChange={handleGpuChange}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              type="submit"
            >
              Add GPUs
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default ManageGPUs;
