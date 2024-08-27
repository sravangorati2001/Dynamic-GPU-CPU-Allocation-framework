import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Container, Box } from '@mui/material';
import axios from 'axios';

function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Fetch the task list from the backend
    axios.get('http://localhost:8080/list-tasks')
      .then(response => {
        setTasks(response.data.tasks);
      })
      .catch(error => {
        console.error('Error fetching tasks:', error);
      });
  }, []);

  const handleDeleteTask = (taskName) => {
    if (window.confirm(`Are you sure you want to delete the task: ${taskName}?`)) {
      // Send request to delete the task
      axios.delete(`http://localhost:8080/delete-task/${taskName}`)
        .then(response => {
          alert('Task deleted successfully!');
          // Remove the task from the UI
          setTasks(tasks.filter(task => task.name !== taskName));
        })
        .catch(error => {
          console.error('Error deleting task:', error);
        });
    }
  };

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Created Tasks
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Task Name</b></TableCell>
                <TableCell><b>Image Name</b></TableCell>
                <TableCell><b>CPUs Using</b></TableCell>
                <TableCell><b>GPUs Using</b></TableCell>
                <TableCell><b>Node Port</b></TableCell>
                <TableCell><b>Action</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.name}>
                  <TableCell>{task.name}</TableCell>
                  <TableCell>{task.imageName}</TableCell>
                  <TableCell>{task.cpus}</TableCell>
                  <TableCell>{task.gpus || 'None'}</TableCell>
                  <TableCell>{task.nodePort !== 0 ? task.nodePort : 'Not exposed'}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleDeleteTask(task.name)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}

export default TaskList;
