import React, { useState } from 'react';
import { TextField, Button, Grid, Box, Typography, Autocomplete } from '@mui/material';

const imageList = [
  "jupyter/base-notebook",
  "jupyter/scipy-notebook",
  "tensorflow/tensorflow:latest",
  "pytorch/pytorch:latest",
  "scikit-learn/scikit-learn",
  "apache/spark",
  "huggingface/transformers-pytorch-cpu",
  "nvidia/cuda",
  "openai/gpt-3",
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
    console.log(formData);
    // API call to backend goes here
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom textAlign="center">
        Create Task
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3} justifyContent="center">
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
                />
              )}
            />
          </Grid>
          {formData.selectedImage && (
            <Grid item xs={12}>
              <Typography variant="body1">
                Selected Image: {formData.selectedImage}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
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

