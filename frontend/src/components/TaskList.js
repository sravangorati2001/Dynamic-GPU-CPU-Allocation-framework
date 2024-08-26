import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container, Typography } from '@mui/material';
import axios from 'axios';

function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Fetch tasks from the backend
    axios.get('http://localhost:8080/list-tasks')
      .then(response => {
        setTasks(response.data.tasks);
      })
      .catch(error => {
        console.error('Error fetching tasks:', error);
      });
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Created Tasks
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task Name</TableCell>
              <TableCell>Image Name</TableCell>
              <TableCell>CPUs Using</TableCell>
              <TableCell>GPUs Using</TableCell>
              <TableCell>Node Port</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.name}>
                <TableCell>{task.name}</TableCell>
                <TableCell>{task.imageName}</TableCell>
                <TableCell>{task.cpus}</TableCell>
                <TableCell>{task.gpus || 'None'}</TableCell>
                <TableCell>{task.nodePort || 'Not exposed'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default TaskList;
