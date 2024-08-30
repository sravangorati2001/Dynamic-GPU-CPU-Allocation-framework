import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Container, Box, TextField } from '@mui/material';
import axios from 'axios';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [link, setLink] = useState({});
  const [customPort, setCustomPort] = useState({});

  useEffect(() => {
    // Fetch the task list from the backend
    axios.get('http://149.36.1.105:8080/list-tasks')
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
      axios.delete(`http://149.36.1.105:8080/delete-task/${taskName}`)
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

  const handleGetLink = (serviceName, customPortValue) => {
    if (!customPortValue || isNaN(customPortValue)) {
      alert('Please enter a valid custom port.');
      return;
    }

    // Send request to get the Jupyter notebook link with the custom port and service name
    axios.post('http://149.36.1.105:8080/access-jupyter', { port: customPortValue, serviceName })
      .then(response => {
        const { url, token } = response.data;
        setLink((prevLinks) => ({
          ...prevLinks,
          [serviceName]: { url, token },
        }));
        alert(`Access Link: ${url}\nToken: ${token}`);
      })
      .catch(error => {
        console.error('Error fetching service link:', error);
      });
  };

  const handlePortChange = (taskName, event) => {
    const port = event.target.value;
    setCustomPort((prevPorts) => ({
      ...prevPorts,
      [taskName]: port,
    }));
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
                <TableCell><b>Service Name</b></TableCell>
                <TableCell><b>Image Name</b></TableCell>
                <TableCell><b>CPUs Using</b></TableCell>
                <TableCell><b>GPUs Using</b></TableCell>
                <TableCell><b>Node Port</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.name}>
                  <TableCell>{task.name}</TableCell>
                  <TableCell>{task.name}-service</TableCell> {/* Assuming service name is taskName + "-service" */}
                  <TableCell>{task.imageName}</TableCell>
                  <TableCell>{task.cpus}</TableCell>
                  <TableCell>{task.gpus || 'None'}</TableCell>
                  <TableCell>{task.nodePort !== 0 ? task.nodePort : 'Not exposed'}</TableCell>
                  <TableCell>
                    <TextField
                      label="Custom Port"
                      type="number"
                      value={customPort[task.name] || ''}
                      onChange={(e) => handlePortChange(task.name, e)}
                      sx={{ mr: 2 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleGetLink(`${task.name}-service`, customPort[task.name])} // Use service name dynamically
                      sx={{ mr: 2 }}
                    >
                      Get Link
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleDeleteTask(task.name)}
                    >
                      Delete
                    </Button>
                    {link[task.name] && (
                      <Typography sx={{ mt: 1 }}>
                        URL: <a href={link[task.name].url} target="_blank" rel="noopener noreferrer">{link[task.name].url}</a><br />
                        Token: {link[task.name].token}
                      </Typography>
                    )}
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

