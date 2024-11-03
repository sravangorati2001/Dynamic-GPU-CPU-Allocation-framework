import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Typography, Button, Container, Box, TextField, Snackbar, Alert, 
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Link, IconButton, Paper, Chip, Tooltip, Stack, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

function TaskList() {
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [services, setServices] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchClusters();
  }, []);

  useEffect(() => {
    if (selectedCluster) {
      fetchNamespaces(selectedCluster);
      setSelectedNamespace(''); // Reset namespace selection when cluster changes
      setServices([]); // Clear services when cluster changes
    }
  }, [selectedCluster]);

  useEffect(() => {
    if (selectedCluster && selectedNamespace) {
      fetchServices(selectedCluster, selectedNamespace);
    }
  }, [selectedCluster, selectedNamespace]);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchClusters = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clusters`);
      setClusters(response.data.clusters);
    } catch (error) {
      console.error('Error fetching clusters:', error);
      showSnackbar('Error fetching clusters', 'error');
    }
  };

  const fetchNamespaces = async (clusterName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clusters/${clusterName}/namespaces`);
      setNamespaces(response.data.namespaces || []);
    } catch (error) {
      console.error('Error fetching namespaces:', error);
      showSnackbar('Error fetching namespaces', 'error');
    }
  };

  const fetchServices = async (clusterName, namespace) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clusters/${clusterName}/namespaces/${namespace}/services`);
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      showSnackbar('Error fetching services', 'error');
    }
  };

  const handleClusterChange = (event) => {
    setSelectedCluster(event.target.value);
  };

  const handleNamespaceChange = (event) => {
    setSelectedNamespace(event.target.value);
  };

  const getServiceHealthIcon = (status) => {
    switch (status) {
      case 'Healthy':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'Unhealthy':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <PendingIcon sx={{ color: 'warning.main' }} />;
    }
  };

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
          Cluster Services
        </Typography>

        {/* Cluster Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="cluster-select-label">Select Cluster</InputLabel>
          <Select
            labelId="cluster-select-label"
            id="cluster-select"
            value={selectedCluster}
            label="Select Cluster"
            onChange={handleClusterChange}
          >
            {clusters.map((cluster) => (
              <MenuItem key={cluster} value={cluster}>
                {cluster}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Namespace Selection */}
        {selectedCluster && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="namespace-select-label">Select Namespace</InputLabel>
            <Select
              labelId="namespace-select-label"
              id="namespace-select"
              value={selectedNamespace}
              label="Select Namespace"
              onChange={handleNamespaceChange}
            >
              {namespaces.map((namespace) => (
                <MenuItem key={namespace} value={namespace}>
                  {namespace}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Services Table */}
        {selectedCluster && selectedNamespace && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Services in {selectedNamespace}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="subtitle1" fontWeight="bold">Service Name</Typography></TableCell>
                    <TableCell><Typography variant="subtitle1" fontWeight="bold">Type</Typography></TableCell>
                    <TableCell><Typography variant="subtitle1" fontWeight="bold">Cluster IP</Typography></TableCell>
                    <TableCell><Typography variant="subtitle1" fontWeight="bold">External IP</Typography></TableCell>
                    <TableCell><Typography variant="subtitle1" fontWeight="bold">Ports</Typography></TableCell>
                    <TableCell><Typography variant="subtitle1" fontWeight="bold">Health</Typography></TableCell>
                    <TableCell><Typography variant="subtitle1" fontWeight="bold">Age</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.name}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={service.type} 
                          color="primary" 
                          variant="outlined" 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{service.clusterIP}</TableCell>
                      <TableCell>
                        {service.externalIP || 
                          <Typography variant="body2" color="text.secondary">
                            None
                          </Typography>
                        }
                      </TableCell>
                      <TableCell>
                        {service.ports.map((port, index) => (
                          <Chip
                            key={index}
                            label={`${port.port}${port.targetPort ? ':' + port.targetPort : ''} ${port.protocol}`}
                            size="small"
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={service.health.message || service.health.status}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getServiceHealthIcon(service.health.status)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {service.health.status}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{service.age}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default TaskList;
