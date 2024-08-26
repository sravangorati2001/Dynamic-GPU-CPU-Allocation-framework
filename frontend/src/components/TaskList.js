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
            <TableCell>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Task Name
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Image Name
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                CPUs Using
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                GPUs Using
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Node Port
                </Typography>
            </TableCell>
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
