import React, { useState } from 'react';
import { TextField, Button, Grid, Box, Typography, Autocomplete, Paper, InputAdornment } from '@mui/material';
import TaskIcon from '@mui/icons-material/Task';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import ImageIcon from '@mui/icons-material/Image';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const imageList = [
  "jupyter/base-notebook:latest",
  "jupyter/scipy-notebook",
  "tensorflow/tensorflow:latest-arm64",
  "pytorch/pytorch:latest",
  "scikit-learn/scikit-learn",
  "apache/spark",
  "huggingface/transformers-pytorch-cpu",
  "nvidia/cuda",
  "openai/gpt-3",
  "tensorflow/tensorflow:2.12.0-gpu",
  "tensorflow/tensorflow:2.12.0-gpu-jupyter",
  "nvcr.io/nvidia/tensorflow:22.12-tf2-py3"
];

function TaskForm() {
  const [formData, setFormData] = useState({
    taskName: '',
    cpus: '',
    gpus: '',
    selectedImage: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageSelect = (event, value) => {
    setFormData({ ...formData, selectedImage: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      taskName: formData.taskName,
      cpus: formData.cpus,
      gpus: formData.gpus,
      imageName: formData.selectedImage
    };

    fetch(`${API_BASE_URL}/create-pod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to create task');
        }
        return response.json();
      })
      .then((data) => {
        alert(`Task created successfully! Access URL: ${data.serviceURL}`);
      })
      .catch((error) => {
        alert('Failed to create task');
      });
  };

  return (
    <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom textAlign="center" sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
          Create Task
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Name"
                variant="outlined"
                name="taskName"
                value={formData.taskName}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TaskIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of CPUs"
                variant="outlined"
                name="cpus"
                value={formData.cpus}
                onChange={handleChange}
                type="number"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ComputerIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of GPUs"
                variant="outlined"
                name="gpus"
                value={formData.gpus}
                onChange={handleChange}
                type="number"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MemoryIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={imageList}
                value={formData.selectedImage}
                onChange={handleImageSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Kubernetes Image"
                    variant="outlined"
                    fullWidth
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <ImageIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            {formData.selectedImage && (
              <Grid item xs={12}>
                <Typography variant="body2" textAlign="center" color="text.secondary">
                  Selected Image: {formData.selectedImage}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                type="submit"
                size="large"
                sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
              >
                Create Task
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default TaskForm;
