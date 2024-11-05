import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Container,
  useScrollTrigger,
  Slide,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Memory as MemoryIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

// Hide AppBar on scroll
function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function Navbar() {
  const grafanaUrl = process.env.REACT_APP_GRAFANA_URL || '#';
  const prometheusUrl = process.env.REACT_APP_PROMETHEUS_URL || '#';
  const location = useLocation();
  const [monitoringAnchor, setMonitoringAnchor] = useState(null);

  const handleMonitoringClick = (event) => {
    setMonitoringAnchor(event.currentTarget);
  };

  const handleMonitoringClose = () => {
    setMonitoringAnchor(null);
  };

  const isCurrentPath = (path) => location.pathname === path;

  const NavButton = ({ to, icon, children, external }) => {
    const buttonProps = external
      ? {
        href: to,
        target: "_blank",
        rel: "noopener noreferrer",
      }
      : {
        component: Link,
        to: to,
      };

    return (
      <Button
        {...buttonProps}
        color="inherit"
        startIcon={icon}
        sx={{
          mx: 0.5,
          px: 2,
          py: 1,
          borderRadius: 1,
          textTransform: 'none',
          fontSize: '0.95rem',
          position: 'relative',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          ...(isCurrentPath(to) && {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: '#90CAF9',
              borderTopLeftRadius: '2px',
              borderTopRightRadius: '2px',
            },
          }),
        }}
      >
        {children}
      </Button>
    );
  };

  return (
    <HideOnScroll>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(90deg, #1A237E 0%, #1976D2 100%)', // Deep blue to lighter blue gradient
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: '64px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <MemoryIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, fontSize: '2rem' }} />
              <Typography
                variant="h5"
                noWrap
                sx={{
                  fontWeight: 900,
                  letterSpacing: '.1rem',
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                KubeAI
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  ml: 1,
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: { xs: 'none', md: 'block' },
                }}
              >
                GPU/CPU Orchestration Framework
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <NavButton to="/task-list" icon={<DashboardIcon />}>
                Cluster's Dashboard
              </NavButton>
              <NavButton to="/" icon={<AddIcon />}>
                Create Task
              </NavButton>
              <NavButton to="/manage-gpus" icon={<MemoryIcon />}>
                Manage GPUs
              </NavButton>

              <Button
                color="inherit"
                onClick={handleMonitoringClick}
                endIcon={<KeyboardArrowDownIcon />}
                startIcon={<TimelineIcon />}
                sx={{
                  mx: 0.5,
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Monitoring
              </Button>
            </Box>

            <Menu
              anchorEl={monitoringAnchor}
              open={Boolean(monitoringAnchor)}
              onClose={handleMonitoringClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  borderRadius: 1,
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                    fontSize: '0.95rem',
                    '&:hover': {
                      backgroundColor: '#F5F9FF',
                    },
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleMonitoringClose} component="a" href={grafanaUrl} target="_blank">
                <AnalyticsIcon sx={{ mr: 2, color: '#1976D2' }} /> Grafana
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem onClick={handleMonitoringClose} component="a" href={prometheusUrl} target="_blank">
                <TimelineIcon sx={{ mr: 2, color: '#1976D2' }} /> Prometheus
              </MenuItem>
            </Menu>

            {/* Mobile menu icon */}
            <IconButton
              color="inherit"
              aria-label="menu"
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
    </HideOnScroll>
  );
}

export default Navbar;