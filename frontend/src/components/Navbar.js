import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function Navbar() {
  const grafanaUrl = process.env.REACT_APP_GRAFANA_URL || '#';
  const prometheusUrl = process.env.REACT_APP_PROMETHEUS_URL || '#';

  return (
	  <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          KubeAI: GPU/CPU Orchestration Framework
        </Typography>
        <Button color="inherit" component={Link} to="/">
          Create Task
        </Button>
        <Button color="inherit" component={Link} to="/task-list">
          Task List
        </Button>
        <Button color="inherit" component={Link} to="/manage-gpus">
          Manage GPUs
        </Button>
        <Button color="inherit" href={grafanaUrl} target="_blank" rel="noopener noreferrer">
          Grafana
        </Button>
        <Button color="inherit" href={prometheusUrl} target="_blank" rel="noopener noreferrer">
          Prometheus
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
