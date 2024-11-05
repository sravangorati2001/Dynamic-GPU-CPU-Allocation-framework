// components/TaskList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Button,
  Container,
  Alert,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  OpenInNew as OpenInNewIcon,
  Memory as MemoryIcon,
  Public as PublicIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://54.193.133.241:8080';

const TaskList = () => {
  const [clusters, setClusters] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClusters();
  }, []);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/clusters/details`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClusters(data.clusters || []);
    } catch (err) {
      setError('Failed to fetch clusters: ' + err.message);
      console.error('Error fetching clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (clusterName) => (e) => {
    e.stopPropagation(); // Prevent card click
    window.open(`/clusters/${clusterName}`, '_blank', 'noopener,noreferrer');
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'unhealthy':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <WarningIcon sx={{ color: 'warning.main' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'success';
      case 'unhealthy':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Kubernetes Clusters
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage and monitor your Kubernetes clusters
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {clusters.length === 0 && !error ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No clusters found
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {clusters.map((cluster) => (
            <Grid item xs={12} sm={6} md={4} key={cluster.name}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 6,
                    cursor: 'pointer',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => navigate(`/clusters/${cluster.name}`)}
              >
                <CardHeader
                  title={cluster.name}
                  subheader={
                    <Chip
                      icon={getStatusIcon(cluster.status)}
                      label={cluster.status}
                      color={getStatusColor(cluster.status)}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  }
                  action={
                    <IconButton size="small">
                      <MemoryIcon />
                    </IconButton>
                  }
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="body1">
                        {cluster.version}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Nodes
                      </Typography>
                      <Typography variant="body1">
                        {cluster.nodeCount}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PublicIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {cluster.region}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Age: {cluster.age}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider' }}>
                  <Button
                    endIcon={<OpenInNewIcon />}
                    size="small"
                    color="primary"
                    onClick={handleButtonClick(cluster.name)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default TaskList;