import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Typography, Button, Container, Box, TextField, Snackbar, Alert, 
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Link, IconButton, Paper, Chip, Tooltip,Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [links, setLinks] = useState({});
  const [customPort, setCustomPort] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, taskName: '' });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    axios.get(`${API_BASE_URL}/list-tasks`)
      .then(response => {
        setTasks(response.data.tasks);
      })
      .catch(error => {
        console.error('Error fetching tasks:', error);
        showSnackbar('Error fetching tasks. Please try again.', 'error');
      });
  };

  const handleDeleteTask = () => {
    const { taskName } = deleteDialog;
    axios.delete(`${API_BASE_URL}/delete-task/${taskName}`)
      .then(() => {
        setTasks(tasks.filter(task => task.name !== taskName));
        showSnackbar('Task deleted successfully!', 'success');
      })
      .catch(error => {
        console.error('Error deleting task:', error);
        showSnackbar('Error deleting task. Please try again.', 'error');
      })
      .finally(() => {
        setDeleteDialog({ open: false, taskName: '' });
      });
  };

  const handleGetLink = (serviceName, customPortValue) => {
    if (!customPortValue || isNaN(customPortValue)) {
      showSnackbar('Please enter a valid custom port.', 'warning');
      return;
    }

    axios.post(`${API_BASE_URL}/access-jupyter`, { port: customPortValue, serviceName })
      .then(response => {
        const { url, token } = response.data;
        setLinks(prevLinks => ({
          ...prevLinks,
          [serviceName]: { url, token },
        }));
        showSnackbar('Link generated successfully!', 'success');
      })
      .catch(error => {
        console.error('Error fetching service link:', error);
        showSnackbar('Error generating link. Please try again.', 'error');
      });
  };

  const handlePortChange = (taskName, event) => {
    const port = event.target.value;
    setCustomPort(prevPorts => ({
      ...prevPorts,
      [taskName]: port,
    }));
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showSnackbar('Copied to clipboard!', 'success');
      }).catch(() => {
        showSnackbar('Failed to copy. Please try manually.', 'error');
      });
    } else {
      let textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        showSnackbar('Copied to clipboard!', 'success');
      } catch (err) {
        showSnackbar('Failed to copy. Please try manually.', 'error');
      }

      document.body.removeChild(textArea);
    }
  };

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
          Created Tasks
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Task Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Service Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Image Name</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Resources</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Node Port</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.name}>
                  <TableCell>{task.name}</TableCell>
                  <TableCell>{`${task.name}-service`}</TableCell>
                  <TableCell>
                    <Tooltip title={task.imageName} arrow>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.imageName}
                      </Typography>
                    </Tooltip>
                  </TableCell>
		      <TableCell align="center">
                  <Tooltip title={`CPUs: ${task.cpus}, GPUs: ${task.gpus || 'None'}`} arrow>
                    <Stack spacing={1} alignItems="center">
                      <Chip
                        icon={<ComputerIcon />}
                        label={task.cpus}
                        size="small"
                        sx={{ width: '80px', justifyContent: 'flex-start' }}
                      />
                      <Chip
                        icon={<MemoryIcon />}
                        label={task.gpus || '0'}
                        size="small"
                        color={task.gpus ? "secondary" : "default"}
                        sx={{ width: '80px', justifyContent: 'flex-start' }}
                      />
                    </Stack>
                  </Tooltip>
                </TableCell>
                  <TableCell align="center">
                    <Chip label={task.nodePort !== 0 ? task.nodePort : 'Not exposed'} color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          label="Custom Port"
                          type="number"
                          size="small"
                          value={customPort[task.name] || ''}
                          onChange={(e) => handlePortChange(task.name, e)}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<LinkIcon />}
                          onClick={() => handleGetLink(`${task.name}-service`, customPort[task.name])}
                        >
                          Get Link
                        </Button>
                        <IconButton
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, taskName: task.name })}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      {links[`${task.name}-service`] && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>URL:</Box>
                            <Link href={links[`${task.name}-service`].url} target="_blank" rel="noopener noreferrer">
                              {links[`${task.name}-service`].url}
                            </Link>
                            <IconButton size="small" onClick={() => copyToClipboard(links[`${task.name}-service`].url)} sx={{ ml: 1 }}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>Token:</Box>
                            <Box component="span" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {links[`${task.name}-service`].token}
                            </Box>
                            <IconButton size="small" onClick={() => copyToClipboard(links[`${task.name}-service`].token)} sx={{ ml: 1 }}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, taskName: '' })}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the task: {deleteDialog.taskName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, taskName: '' })}>Cancel</Button>
          <Button onClick={handleDeleteTask} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TaskList;
