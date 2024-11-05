import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    Box,
    Stack,
    CircularProgress,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Memory as MemoryIcon,
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://54.193.133.241:8080';

const ClusterDetails = () => {
    const [namespaces, setNamespaces] = useState([]);
    const [selectedNamespace, setSelectedNamespace] = useState('');
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const { clusterName } = useParams();

    const fetchNamespaces = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/clusters/${clusterName}/namespaces`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setNamespaces(data.namespaces || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch namespaces: ' + err.message);
            console.error('Error fetching namespaces:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/clusters/${clusterName}/namespaces/${selectedNamespace}/services`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setServices(data.services || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch services: ' + err.message);
            console.error('Error fetching services:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNamespaces();
    }, [clusterName]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (selectedNamespace) {
            fetchServices();
        }
    }, [selectedNamespace]); // eslint-disable-line react-hooks/exhaustive-deps

    const getServiceStatusChip = (status) => {
        const config = {
            healthy: { icon: <CheckCircleIcon />, color: 'success' },
            unhealthy: { icon: <ErrorIcon />, color: 'error' },
            pending: { icon: <WarningIcon />, color: 'warning' }
        };

        const statusConfig = config[status.toLowerCase()] || config.pending;

        return (
            <Chip
                icon={statusConfig.icon}
                label={status}
                color={statusConfig.color}
                size="small"
            />
        );
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header with gradient background */}
            <Box
                sx={{
                    mb: 4,
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <Box
                    sx={{
                        background: 'linear-gradient(90deg, #263238 0%, #37474F 100%)', // Dark gray/blue gradient
                        p: 4,
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <MemoryIcon sx={{ fontSize: 40 }} />
                        <Typography
                            variant="h3"
                            component="h1"
                            sx={{
                                fontWeight: 'bold',
                                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                        >
                            {clusterName}
                        </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                        Manage and monitor cluster resources
                    </Typography>
                </Box>
            </Box>

            {/* Main content */}
            <Paper
                elevation={2}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                }}
            >
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: 1,
                        }}
                    >
                        {error}
                    </Alert>
                )}

                <FormControl
                    fullWidth
                    sx={{
                        mb: 4,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                        },
                    }}
                >
                    <InputLabel>Select Namespace</InputLabel>
                    <Select
                        value={selectedNamespace}
                        label="Select Namespace"
                        onChange={(e) => setSelectedNamespace(e.target.value)}
                    >
                        {namespaces.map((namespace) => (
                            <MenuItem key={namespace} value={namespace}>
                                {namespace}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {loading && selectedNamespace ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    selectedNamespace && (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Service Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Cluster IP</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>External IP</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Ports</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Health</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Age</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {services.map((service) => (
                                        <TableRow
                                            key={service.name}
                                            hover
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <TableCell>{service.name}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={service.type}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ borderRadius: 1 }}
                                                />
                                            </TableCell>
                                            <TableCell>{service.clusterIP}</TableCell>
                                            <TableCell>
                                                {service.externalIP || (
                                                    <Typography variant="body2" color="text.secondary">
                                                        None
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {service.ports.map((port, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={`${port.port}${port.targetPort ? ':' + port.targetPort : ''} ${port.protocol}`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ borderRadius: 1 }}
                                                        />
                                                    ))}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                {getServiceStatusChip(service.health.status)}
                                            </TableCell>
                                            <TableCell>{service.age}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )
                )}
            </Paper>
        </Container>
    );
};

export default ClusterDetails;