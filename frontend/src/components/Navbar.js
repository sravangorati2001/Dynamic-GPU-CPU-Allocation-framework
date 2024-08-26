import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Dynamic GPU Allocator
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src="https://via.placeholder.com/40" alt="Logo" style={{ marginRight: 16 }} />
        </Box>
        <Button color="inherit" component={Link} to="/">
          Create Task
        </Button>
        <Button color="inherit" component={Link} to="/task-list">
          Task List
        </Button>
        <Button color="inherit" component={Link} to="/manage-gpus">
          Manage GPUs
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
