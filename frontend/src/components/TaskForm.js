import React, { useState } from 'react';
import { TextField, Button, Grid, Box, Typography, Autocomplete } from '@mui/material';

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

    fetch('http://149.36.1.88:8080/create-pod', {
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
    <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom textAlign="center">
        Create Task
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Task Name"
              variant="outlined"
              name="taskName"
              value={formData.taskName}
              onChange={handleChange}
              required
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
            />
          </Grid>
          <Grid item xs={12} sm={6}>
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
                />
              )}
            />
          </Grid>
          {formData.selectedImage && (
            <Grid item xs={12}>
              <Typography variant="body1" textAlign="center">
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
            >
              Create Task
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default TaskForm;
