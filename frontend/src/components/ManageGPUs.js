import React, { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Grid, Container, IconButton, Tooltip } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

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

    axios.get(`${API_BASE_URL}/tasks`)
      .then(response => {
        setTaskList(response.data.tasks);
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
      })
      .catch(error => {
        console.error('Error adding resources:', error);
      });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Manage GPUs and CPUs
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ mr: 1 }}>
            Available GPUs: {availableGPUs}
          </Typography>
          <Tooltip title="Total number of GPUs installed on the system." placement="right">
            <IconButton size="small">
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ mr: 1 }}>
            Free GPUs: {freeGPUs}
          </Typography>
          <Tooltip title="Number of GPUs that are currently available for assignment." placement="right">
            <IconButton size="small">
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ mr: 1 }}>
            Available CPUs: {availableCPUs}
          </Typography>
          <Tooltip title="Total number of CPUs installed on the system." placement="right">
            <IconButton size="small">
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4 }}>
          <Typography variant="h6" sx={{ mr: 1 }}>
            Free CPUs: {freeCPUs}
          </Typography>
          <Tooltip title="Number of CPUs that are currently available for assignment." placement="right">
            <IconButton size="small">
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6}>
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
            <TextField
              fullWidth
              label="Number of CPUs to Add"
              variant="outlined"
              name="cpusToAdd"
              value={cpusToAdd}
              onChange={handleCpuChange}
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
              Add Resources
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default ManageResources;