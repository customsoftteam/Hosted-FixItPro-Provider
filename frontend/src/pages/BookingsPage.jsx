import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import NavigationOutlinedIcon from '@mui/icons-material/NavigationOutlined';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import { useLocation } from 'react-router-dom';
import {
  acceptBooking,
  fetchProviderBookings,
  pauseService,
  rejectBooking,
  resumeService,
  startService,
} from '../services/bookingWorkflowApi';
import ServiceStepsPage from './ServiceStepsPage';

const statusTabs = [
  { key: 'all', label: 'All', icon: <AssignmentIndOutlinedIcon fontSize="small" /> },
  { key: 'assigned', label: 'Assigned', icon: <AssignmentIndOutlinedIcon fontSize="small" /> },
  { key: 'accepted', label: 'Accepted', icon: <VerifiedUserOutlinedIcon fontSize="small" /> },
  { key: 'paused', label: 'Paused', icon: <PauseCircleOutlineRoundedIcon fontSize="small" /> },
  { key: 'completed', label: 'Completed', icon: <DoneAllOutlinedIcon fontSize="small" /> },
  { key: 'rejected', label: 'Rejected', icon: <HighlightOffRoundedIcon fontSize="small" /> },
];

const statusStyle = {
  pending: { bgcolor: '#fff7e8', color: '#b45309', border: '1.5px solid #fcd9a5' },
  assigned: { bgcolor: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe' },
  accepted: { bgcolor: '#ecfeff', color: '#0e7490', border: '1.5px solid #bae6fd' },
  in_progress: { bgcolor: '#eef2ff', color: '#4338ca', border: '1.5px solid #c7d2fe' },
  paused: { bgcolor: '#fff7ed', color: '#c2410c', border: '1.5px solid #fed7aa' },
  otp_sent: { bgcolor: '#fef3c7', color: '#92400e', border: '1.5px solid #fde68a' },
  completed: { bgcolor: '#ecfdf3', color: '#15803d', border: '1.5px solid #bbf7d0' },
  rejected: { bgcolor: '#fef2f2', color: '#b91c1c', border: '1.5px solid #fecaca' },
  cancelled: { bgcolor: '#f8fafc', color: '#475569', border: '1.5px solid #cbd5e1' },
};

const statusIconStyle = { fontSize: 18 };
const statusIcons = {
  pending: <HourglassEmptyOutlinedIcon sx={{ ...statusIconStyle, color: '#b45309' }} />,
  assigned: <AssignmentIndOutlinedIcon sx={{ ...statusIconStyle, color: '#1d4ed8' }} />,
  accepted: <VerifiedUserOutlinedIcon sx={{ ...statusIconStyle, color: '#0e7490' }} />,
  in_progress: <PlayArrowRoundedIcon sx={{ ...statusIconStyle, color: '#4338ca' }} />,
  paused: <PauseCircleOutlineRoundedIcon sx={{ ...statusIconStyle, color: '#c2410c' }} />,
  otp_sent: <TaskAltRoundedIcon sx={{ ...statusIconStyle, color: '#92400e' }} />,
  completed: <DoneAllOutlinedIcon sx={{ ...statusIconStyle, color: '#15803d' }} />,
  rejected: <HighlightOffRoundedIcon sx={{ ...statusIconStyle, color: '#b91c1c' }} />,
  cancelled: <CancelOutlinedIcon sx={{ ...statusIconStyle, color: '#475569' }} />,
};

const statusLabels = {
  pending: 'Pending Approval',
  assigned: 'Assigned',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  paused: 'Paused',
  otp_sent: 'OTP Sent',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const getErrorText = (err, fallback) => err?.response?.data?.message || fallback;
const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const formatServiceType = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const formatAmount = (booking) => {
  const pricing = booking?.pricing;
  if (pricing && typeof pricing === 'object') {
    const options = ['totalAmount', 'total', 'finalAmount', 'amount'];
    for (const key of options) {
      if (pricing[key] !== undefined && pricing[key] !== null) return Number(pricing[key]) || 0;
    }
  }

  return Number(booking?.amount) || 0;
};

const formatSchedule = (booking) => {
  const dateSource = booking?.scheduledDate || booking?.scheduledAt;
  const date = dateSource ? new Date(dateSource) : null;
  const dateText = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-CA') : 'Date unavailable';

  const start = booking?.timeSlot?.start || booking?.timeSlot?.startTime;
  const end = booking?.timeSlot?.end || booking?.timeSlot?.endTime;
  const timeText = start && end ? `${start} - ${end}` : 'Time unavailable';

  return `${dateText} at ${timeText}`;
};

const getCustomerName = (booking) => {
  if (booking?.customerName) return booking.customerName;
  if (booking?.userId?.name) return booking.userId.name;
  if (booking?.userName) return booking.userName;
  if (booking?.userId?.mobile) return booking.userId.mobile;
  return 'Customer';
};

const getServiceName = (booking) => {
  if (booking?.serviceId?.name) return booking.serviceId.name;
  if (booking?.serviceType) return formatServiceType(booking.serviceType);
  return 'General Service';
};

const getAddress = (booking) => {
  if (booking?.customerAddress) return booking.customerAddress;
  if (booking?.address?.fullAddress) return booking.address.fullAddress;

  const fields = [
    booking?.address?.line1,
    booking?.address?.line2,
    booking?.address?.area,
    booking?.address?.city,
    booking?.address?.state,
    booking?.address?.pincode,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return fields.length ? fields.join(', ') : 'Address unavailable';
};

const toSeconds = (dateValue) => {
  if (!dateValue) return 0;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
};

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatCurrency = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Rs 0';
  return `Rs ${numeric.toLocaleString('en-IN')}`;
};

const getBookingCoordinates = (booking) => {
  const bookingCoordinates = booking?.address?.location?.coordinates;
  const userCoordinates = booking?.userId?.location?.coordinates;
  const coordinates = Array.isArray(bookingCoordinates) && bookingCoordinates.length >= 2
    ? bookingCoordinates
    : userCoordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

const buildMapEmbedUrl = (coordinates, mapsApiKey, zoom = 15) => {
  if (!coordinates || !mapsApiKey) return null;
  return `https://www.google.com/maps/embed/v1/view?key=${mapsApiKey}&center=${coordinates.lat},${coordinates.lng}&zoom=${zoom}`;
};

const getDestinationAddress = (booking) => {
  if (booking?.address?.fullAddress) return booking.address.fullAddress;
  if (booking?.customerAddress) return booking.customerAddress;
  if (booking?.userId?.location?.address) return booking.userId.location.address;
  return '';
};

export default function BookingsPage() {
  const location = useLocation();
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [actionBookingId, setActionBookingId] = useState('');
  const [directionsLoadingBookingId, setDirectionsLoadingBookingId] = useState('');
  const [dialogDirectionsLoading, setDialogDirectionsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [stepsBookingId, setStepsBookingId] = useState(null);
  const [reachedLocationBookingIds, setReachedLocationBookingIds] = useState(() => new Set());

  const [timerTick, setTimerTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadBookings = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const bookingList = await fetchProviderBookings();
      setBookings(bookingList);
      setError('');
    } catch (err) {
      setError(getErrorText(err, 'Failed to fetch bookings'));
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    setReachedLocationBookingIds((prev) => {
      if (!prev.size) return prev;

      const acceptedIds = new Set(
        bookings
          .filter((booking) => normalizeStatus(booking?.status) === 'accepted')
          .map((booking) => String(booking?._id || ''))
          .filter(Boolean)
      );

      let changed = false;
      const next = new Set();

      prev.forEach((bookingId) => {
        if (acceptedIds.has(bookingId)) {
          next.add(bookingId);
        } else {
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [bookings]);

  useEffect(() => {
    const state = location.state || {};
    const focusBookingId = String(state.focusBookingId || '').trim();
    const focusStatus = String(state.focusStatus || '').trim();

    if (!focusBookingId && !focusStatus) return;

    const hasStatus = statusTabs.some((tab) => tab.key === focusStatus);
    if (hasStatus) {
      setActiveTab(focusStatus);
    } else {
      setActiveTab('all');
    }

    if (focusBookingId) {
      setSearchText(focusBookingId);
      setMessage(`Showing booking results for ${focusBookingId}`);
      setTimeout(() => setMessage(''), 2500);
    }
  }, [location.state]);

  const runAction = async (bookingId, action, successText, fallbackError, options = {}) => {
    setActionBookingId(bookingId);
    setError('');
    setMessage('');

    try {
      await action();
      setMessage(successText);
      await loadBookings({ silent: true });
      if (options.openStepsAfterAction) {
        setStepsBookingId(bookingId);
      }
    } catch (err) {
      setError(getErrorText(err, fallbackError));
    } finally {
      setActionBookingId('');
    }
  };

  const handleAccept = (bookingId) =>
    runAction(bookingId, () => acceptBooking(bookingId), 'Booking accepted', 'Failed to accept booking');

  const handleReject = (bookingId) =>
    runAction(bookingId, () => rejectBooking(bookingId), 'Booking rejected', 'Failed to reject booking');

  const handleStartService = (bookingId) =>
    runAction(
      bookingId,
      () => startService(bookingId),
      'Service started',
      'Failed to start service',
      { openStepsAfterAction: true }
    );

  const handlePauseService = (bookingId) =>
    runAction(bookingId, () => pauseService(bookingId), 'Service paused', 'Failed to pause service');

  const handleResumeService = (bookingId) =>
    runAction(bookingId, () => resumeService(bookingId), 'Service resumed', 'Failed to resume service');

  const handleReachedLocation = (bookingId) => {
    const normalizedBookingId = String(bookingId || '').trim();
    if (!normalizedBookingId) return;

    setReachedLocationBookingIds((prev) => {
      if (prev.has(normalizedBookingId)) return prev;
      const next = new Set(prev);
      next.add(normalizedBookingId);
      return next;
    });

    setError('');
    setMessage('Reached location marked. Click on Start Service Button to follow the steps.');
  };

  const openDirections = (booking, options = {}) => {
    const { fromDialog = false } = options;
    if (fromDialog) {
      setDialogDirectionsLoading(true);
    } else {
      setDirectionsLoadingBookingId(String(booking?._id || ''));
    }

    const destinationCoords = getBookingCoordinates(booking);
    const destinationAddress = getDestinationAddress(booking);

    const resetLoading = () => {
      if (fromDialog) {
        setDialogDirectionsLoading(false);
      } else {
        setDirectionsLoadingBookingId('');
      }
    };

    if (!destinationCoords && !destinationAddress) {
      setError('Destination location is not available for this booking');
      resetLoading();
      return;
    }

    const openGoogleMaps = (origin) => {
      const destination = destinationCoords
        ? `${destinationCoords.lat},${destinationCoords.lng}`
        : encodeURIComponent(destinationAddress);

      const baseUrl = 'https://www.google.com/maps/dir/?api=1';
      const destinationQuery = `destination=${destination}`;
      const travelModeQuery = 'travelmode=driving';
      const originQuery = origin ? `&origin=${origin}` : '';
      window.open(`${baseUrl}&${destinationQuery}${originQuery}&${travelModeQuery}`, '_blank', 'noopener,noreferrer');
      resetLoading();
    };

    if (!navigator.geolocation) {
      openGoogleMaps('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;
        openGoogleMaps(origin);
      },
      () => {
        openGoogleMaps('');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const normalizedBookings = useMemo(
    () =>
      bookings.map((booking, index) => {
        const status = normalizeStatus(booking.status);
        const amount = formatAmount(booking);
        const startTime = booking.serviceStartTime || null;

        return {
          ...booking,
          status,
          displayId: booking.bookingId || `BK-${String(booking._id || index).slice(-6).toUpperCase()}`,
          customerName: getCustomerName(booking),
          serviceName: getServiceName(booking),
          addressText: getAddress(booking),
          amount,
          scheduleText: formatSchedule(booking),
          elapsedText: formatDuration(toSeconds(startTime)),
        };
      }),
    [bookings, timerTick]
  );

  const tabCounts = useMemo(() => {
    const counts = { all: normalizedBookings.length };
    statusTabs.forEach((tab) => {
      if (tab.key !== 'all') counts[tab.key] = 0;
    });

    normalizedBookings.forEach((booking) => {
      if (counts[booking.status] !== undefined) counts[booking.status] += 1;
    });

    return counts;
  }, [normalizedBookings]);

  const visibleBookings = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return normalizedBookings.filter((booking) => {
      const tabMatch = activeTab === 'all' || booking.status === activeTab;
      if (!tabMatch) return false;
      if (!q) return true;

      return [
        booking.displayId,
        booking._id,
        booking.customerName,
        booking.serviceName,
        booking.addressText,
        booking.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [activeTab, normalizedBookings, searchText]);

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ mt: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800 }}>Bookings</Typography>
          <Typography sx={{ color: '#64748b' }}>Service workflow for assigned bookings</Typography>
        </Box>
        <Button
          onClick={() => loadBookings({ silent: true })}
          disabled={refreshing}
          startIcon={refreshing ? <CircularProgress color="inherit" size={16} /> : <RefreshRoundedIcon />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Stack>

      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box
        sx={{
          display: 'flex',
          gap: 0.8,
          flexWrap: 'wrap',
          p: 0.7,
          borderRadius: 2,
          bgcolor: '#edf2f7',
        }}
      >
        {statusTabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              startIcon={tab.icon}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: active ? 800 : 600,
                color: active ? '#1d4ed8' : '#334155',
                bgcolor: active ? '#fff' : 'transparent',
                border: active ? '2px solid #1d4ed8' : '1.5px solid #e2e8f0',
                boxShadow: active ? '0 2px 8px 0 #e0e7ef' : 'none',
                px: 2,
                py: 1,
                mb: 0.5,
              }}
            >
              {tab.label} ({tabCounts[tab.key] || 0})
            </Button>
          );
        })}
      </Box>

      <TextField
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search by customer, service, booking ID or status"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: '#64748b' }} />
            </InputAdornment>
          ),
        }}
      />

      {!visibleBookings.length ? <Alert severity="info">No bookings found for current filter.</Alert> : null}

      {visibleBookings.map((booking) => {
        const isActionLoading = actionBookingId === booking._id;
        const canAcceptReject = booking.status === 'assigned';
        const canReject = ['assigned', 'accepted', 'paused'].includes(booking.status);
        const showAcceptButton = ['assigned', 'accepted'].includes(booking.status);
        const acceptDisabled = booking.status === 'accepted' || Boolean(actionBookingId);
        const hasReachedLocation = reachedLocationBookingIds.has(String(booking._id));
        const showReachedLocationButton = booking.status === 'accepted';
        const canStart = booking.status === 'accepted';
        const startDisabled = Boolean(actionBookingId) || !hasReachedLocation;
        const canPause = booking.status === 'in_progress';
        const canResume = booking.status === 'paused';
        const canContinueFlow = ['in_progress', 'paused', 'otp_sent'].includes(booking.status);
        const bookingCoordinates = getBookingCoordinates(booking);
        const bookingPreviewMapUrl = buildMapEmbedUrl(bookingCoordinates, mapsApiKey, 14);

        return (
          <Card key={booking._id} sx={{ borderRadius: 2, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px 0 #f1f5f9', mb: 1 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                    <Typography sx={{ color: '#64748b', fontWeight: 700 }}>{booking.displayId}</Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.2,
                        py: 0.4,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: 14,
                        ...statusStyle[booking.status],
                        border: statusStyle[booking.status]?.border,
                        bgcolor: statusStyle[booking.status]?.bgcolor,
                        color: statusStyle[booking.status]?.color,
                        minWidth: 120,
                        textTransform: 'capitalize',
                      }}
                    >
                      {statusIcons[booking.status] || null}
                      {statusLabels[booking.status] || booking.status.replace('_', ' ')}
                    </Box>
                  </Stack>

                  <Typography sx={{ mt: 0.5, fontWeight: 800, fontSize: 19 }}>{booking.customerName}</Typography>
                  <Typography sx={{ color: '#475569', fontWeight: 600 }}>{booking.serviceName}</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: 14 }}>{booking.scheduleText}</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: 14 }}>{booking.addressText}</Typography>

                  {['in_progress', 'otp_sent'].includes(booking.status) ? (
                    <Typography sx={{ mt: 1, color: '#1d4ed8', fontWeight: 700 }}>
                      Timer: {booking.elapsedText}
                    </Typography>
                  ) : null}

                  {bookingPreviewMapUrl ? (
                    <Box sx={{ mt: 1.25 }}>
                      <Typography sx={{ color: '#334155', fontWeight: 700, fontSize: 13, mb: 0.6 }}>
                        Location Preview
                      </Typography>
                      <Box
                        sx={{
                          width: { xs: '100%', md: 320 },
                          height: 140,
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        <Box
                          component="iframe"
                          title={`Booking map ${booking.displayId}`}
                          src={bookingPreviewMapUrl}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          sx={{ width: '100%', height: '100%', border: 0 }}
                        />
                      </Box>
                    </Box>
                  ) : null}
                </Box>

                <Stack direction="column" alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={1.1}>
                  <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#0f172a' }}>Rs {booking.amount}</Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {showAcceptButton ? (
                      <Button
                        onClick={() => handleAccept(booking._id)}
                        disabled={acceptDisabled}
                        startIcon={isActionLoading ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutlineRoundedIcon />}
                        sx={{ textTransform: 'none', bgcolor: '#2563eb', color: '#fff', '&:hover': { bgcolor: '#1d4ed8' }, fontWeight: 700 }}
                      >
                        Accept
                      </Button>
                    ) : null}

                    {canReject ? (
                      <Button
                        onClick={() => handleReject(booking._id)}
                        disabled={Boolean(actionBookingId)}
                        startIcon={isActionLoading ? <CircularProgress size={14} color="inherit" /> : <HighlightOffRoundedIcon />}
                        sx={{ textTransform: 'none', bgcolor: '#dc2626', color: '#fff', '&:hover': { bgcolor: '#b91c1c' }, fontWeight: 700 }}
                      >
                        Reject
                      </Button>
                    ) : null}

                    {canStart ? (
                      <Button
                        onClick={() => handleReachedLocation(booking._id)}
                        disabled={Boolean(actionBookingId) || hasReachedLocation || !showReachedLocationButton}
                        startIcon={<RoomOutlinedIcon />}
                        variant={hasReachedLocation ? 'outlined' : 'contained'}
                        sx={{
                          textTransform: 'none',
                          bgcolor: hasReachedLocation ? 'transparent' : '#f59e0b',
                          color: hasReachedLocation ? '#a16207' : '#fff',
                          borderColor: '#facc15',
                          '&:hover': {
                            bgcolor: hasReachedLocation ? '#fef9c3' : '#d97706',
                            borderColor: '#facc15',
                          },
                          fontWeight: 700,
                        }}
                      >
                        {hasReachedLocation ? 'Reached Location' : 'Mark Reached Location'}
                      </Button>
                    ) : null}

                    {canStart ? (
                      <Button
                        onClick={() => handleStartService(booking._id)}
                        disabled={startDisabled}
                        startIcon={isActionLoading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowRoundedIcon />}
                        sx={{ textTransform: 'none', bgcolor: '#0ea5e9', color: '#fff', '&:hover': { bgcolor: '#0284c7' }, fontWeight: 700 }}
                      >
                        Start Service
                      </Button>
                    ) : null}

                    {canContinueFlow ? (
                      <Button
                        onClick={() => setStepsBookingId(booking._id)}
                        startIcon={<TaskAltRoundedIcon />}
                        sx={{ textTransform: 'none', bgcolor: '#4338ca', color: '#fff', '&:hover': { bgcolor: '#3730a3' }, fontWeight: 700 }}
                      >
                        Continue Workflow
                      </Button>
                    ) : null}

                    {canPause ? (
                      <Button
                        onClick={() => handlePauseService(booking._id)}
                        disabled={Boolean(actionBookingId)}
                        startIcon={isActionLoading ? <CircularProgress size={14} color="inherit" /> : <PauseCircleOutlineRoundedIcon />}
                        sx={{ textTransform: 'none', bgcolor: '#ea580c', color: '#fff', '&:hover': { bgcolor: '#c2410c' }, fontWeight: 700 }}
                      >
                        Pause Service
                      </Button>
                    ) : null}

                    {canResume ? (
                      <Button
                        onClick={() => handleResumeService(booking._id)}
                        disabled={Boolean(actionBookingId)}
                        startIcon={isActionLoading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowRoundedIcon />}
                        sx={{ textTransform: 'none', bgcolor: '#2563eb', color: '#fff', '&:hover': { bgcolor: '#1d4ed8' }, fontWeight: 700 }}
                      >
                        Resume Service
                      </Button>
                    ) : null}

                    <Button
                      onClick={() => setSelectedBooking(booking)}
                      startIcon={<VisibilityOutlinedIcon />}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                      variant="text"
                    >
                      Details
                    </Button>

                    <Button
                      onClick={() => openDirections(booking)}
                      disabled={directionsLoadingBookingId === booking._id}
                      startIcon={
                        directionsLoadingBookingId === booking._id
                          ? <CircularProgress size={14} color="inherit" />
                          : <NavigationOutlinedIcon />
                      }
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                      variant="outlined"
                    >
                      {directionsLoadingBookingId === booking._id ? 'Opening...' : 'Directions'}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={Boolean(selectedBooking)} onClose={() => setSelectedBooking(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>Booking Details</DialogTitle>
        <DialogContent>
          {selectedBooking ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              {(() => {
                const coordinates = getBookingCoordinates(selectedBooking);
                const mapUrl = buildMapEmbedUrl(coordinates, mapsApiKey, 15);

                return (
                  <>
                    <Stack spacing={1}>
                      <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>Booking Location</Typography>
                      {mapUrl ? (
                        <Box
                          sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0',
                            height: { xs: 220, sm: 280 },
                          }}
                        >
                          <Box
                            component="iframe"
                            title="Booking location map"
                            src={mapUrl}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            sx={{ width: '100%', height: '100%', border: 0 }}
                          />
                        </Box>
                      ) : (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          {!coordinates
                            ? 'Location coordinates are not available for this booking.'
                            : 'Google Maps API key is missing. Set VITE_GOOGLE_MAPS_API_KEY in frontend .env.local.'}
                        </Alert>
                      )}

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          onClick={() => openDirections(selectedBooking, { fromDialog: true })}
                          disabled={dialogDirectionsLoading}
                          startIcon={
                            dialogDirectionsLoading
                              ? <CircularProgress size={16} color="inherit" />
                              : <NavigationOutlinedIcon />
                          }
                          variant="contained"
                          sx={{ textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start' }}
                        >
                          {dialogDirectionsLoading ? 'Opening Map...' : 'Navigate From My Location'}
                        </Button>
                        <Typography sx={{ color: '#64748b', fontSize: 13, alignSelf: 'center' }}>
                          Uses your current GPS location and opens turn-by-turn route in Google Maps.
                        </Typography>
                      </Stack>
                    </Stack>
                    <Divider />
                  </>
                );
              })()}

              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                <Box>
                  <Typography sx={{ color: '#64748b', fontWeight: 700 }}>Booking ID</Typography>
                  <Typography sx={{ fontWeight: 800 }}>{selectedBooking.displayId}</Typography>
                </Box>
                <Chip
                  icon={statusIcons[selectedBooking.status] || <AssignmentIndOutlinedIcon fontSize="small" />}
                  label={statusLabels[selectedBooking.status] || selectedBooking.status}
                  sx={{
                    alignSelf: { xs: 'flex-start', sm: 'center' },
                    fontWeight: 700,
                    ...statusStyle[selectedBooking.status],
                  }}
                />
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>Customer Details</Typography>
                <Typography><strong>Name:</strong> {selectedBooking.customerName}</Typography>
                <Typography><strong>Mobile:</strong> {selectedBooking?.userId?.mobile || 'Not available'}</Typography>
                <Typography><strong>Email:</strong> {selectedBooking?.userId?.email || 'Not available'}</Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>Service Details</Typography>
                <Typography><strong>Service:</strong> {selectedBooking.serviceName}</Typography>
                <Typography><strong>Product:</strong> {selectedBooking?.productId?.name || 'Not available'}</Typography>
                <Typography><strong>Schedule:</strong> {selectedBooking.scheduleText}</Typography>
                <Typography><strong>Address:</strong> {selectedBooking.addressText}</Typography>
                <Typography><strong>Notes:</strong> {selectedBooking?.notes || 'No notes provided'}</Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>Provider Details</Typography>
                <Typography><strong>Name:</strong> {selectedBooking?.providerId?.name || 'Not assigned yet'}</Typography>
                <Typography><strong>Mobile:</strong> {selectedBooking?.providerId?.mobile || 'Not available'}</Typography>
                <Typography><strong>Email:</strong> {selectedBooking?.providerId?.email || 'Not available'}</Typography>
                <Typography><strong>Status:</strong> {selectedBooking?.providerId?.status || 'Not available'}</Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>Pricing And Payment</Typography>
                <Typography><strong>Service Price:</strong> {formatCurrency(selectedBooking?.pricing?.servicePrice)}</Typography>
                <Typography><strong>Convenience Fee:</strong> {formatCurrency(selectedBooking?.pricing?.convenienceFee)}</Typography>
                <Typography><strong>Discount:</strong> {formatCurrency(selectedBooking?.pricing?.discount)}</Typography>
                <Typography><strong>Total:</strong> {formatCurrency(selectedBooking?.pricing?.totalAmount ?? selectedBooking.amount)}</Typography>
                <Typography><strong>Payment Method:</strong> {selectedBooking?.payment?.method || 'Not available'}</Typography>
                <Typography><strong>Payment Status:</strong> {selectedBooking?.payment?.status || 'Not available'}</Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>Timeline</Typography>
                <Typography><strong>Created:</strong> {formatDateTime(selectedBooking?.createdAt)}</Typography>
                <Typography><strong>Service Start:</strong> {formatDateTime(selectedBooking?.serviceStartTime)}</Typography>
                <Typography><strong>Service End:</strong> {formatDateTime(selectedBooking?.serviceEndTime)}</Typography>
                <Typography><strong>OTP Requested:</strong> {formatDateTime(selectedBooking?.otpRequestedAt)}</Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>Rating</Typography>
                <Typography><strong>Stars:</strong> {selectedBooking?.rating?.stars ?? 'Not rated'}</Typography>
                <Typography><strong>Review:</strong> {selectedBooking?.rating?.review || 'No review yet'}</Typography>
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedBooking(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <ServiceStepsPage
        bookingId={stepsBookingId}
        open={Boolean(stepsBookingId)}
        onClose={(refresh) => {
          setStepsBookingId(null);
          if (refresh) loadBookings({ silent: true });
        }}
      />
    </Stack>
  );
}
