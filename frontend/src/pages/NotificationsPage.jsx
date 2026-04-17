import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApi';
import { useNotifications } from '../context/NotificationContext';

const typeLabel = {
  BOOKING_ASSIGNED: 'Booking',
  BOOKING_UPDATED: 'Booking',
  GENERAL: 'General',
};

const typeColor = {
  BOOKING_ASSIGNED: '#2563eb',
  BOOKING_UPDATED: '#0ea5e9',
  GENERAL: '#64748b',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { loadNotifications } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadPage = async (nextPage = 1, append = false) => {
    try {
      setError('');
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const data = await fetchNotifications(nextPage, 20);
      const list = data.notifications || [];

      setNotifications((prev) => (append ? [...prev, ...list] : list));
      setPage(data?.pagination?.page || nextPage);
      setTotalPages(data?.pagination?.pages || 1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPage(1, false);
  }, []);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'booking') {
      return notifications.filter((item) => ['BOOKING_ASSIGNED', 'BOOKING_UPDATED'].includes(String(item?.type || '')));
    }

    if (activeFilter === 'general') {
      return notifications.filter((item) => String(item?.type || '') === 'GENERAL');
    }

    return notifications;
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const markOneRead = async (item) => {
    if (!item || item.isRead) return;

    try {
      await markNotificationRead(item._id);
      setNotifications((prev) => prev.map((row) => (row._id === item._id ? { ...row, isRead: true, readAt: new Date().toISOString() } : row)));
      await loadNotifications();
    } catch (_error) {
      setError('Unable to mark notification as read');
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((row) => ({ ...row, isRead: true, readAt: new Date().toISOString() })));
      setMessage('All notifications marked as read');
      setTimeout(() => setMessage(''), 2000);
      await loadNotifications();
    } catch (_error) {
      setError('Unable to mark all notifications as read');
    }
  };

  const openRelatedBooking = async (item) => {
    await markOneRead(item);
    const bookingTarget = item?.meta?.bookingId || item?.meta?.bookingObjectId;
    if (!bookingTarget) return;

    navigate('/app/bookings', {
      state: {
        focusBookingId: String(bookingTarget),
        focusStatus: String(item?.meta?.status || '').toLowerCase(),
      },
    });
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.2}>
        <Box>
          <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800 }}>Notifications</Typography>
          <Typography sx={{ color: '#64748b' }}>Track booking and system updates in one place</Typography>
        </Box>
        <Button
          onClick={markAllRead}
          disabled={!unreadCount}
          startIcon={<MarkEmailReadOutlinedIcon />}
          sx={{ textTransform: 'none', fontWeight: 700 }}
          variant="outlined"
        >
          Mark All Read
        </Button>
      </Stack>

      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack direction="row" spacing={1}>
        {[
          { key: 'all', label: 'All' },
          { key: 'booking', label: 'Bookings' },
          { key: 'general', label: 'General' },
        ].map((tab) => (
          <Chip
            key={tab.key}
            label={tab.label}
            clickable
            onClick={() => setActiveFilter(tab.key)}
            color={activeFilter === tab.key ? 'primary' : 'default'}
            variant={activeFilter === tab.key ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ mt: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}

      {!loading && !filteredItems.length ? <Alert severity="info">No notifications found.</Alert> : null}

      {filteredItems.map((item) => (
        <Card key={item._id} sx={{ borderRadius: 2.2, border: '1px solid #e2e8f0', bgcolor: item.isRead ? '#fff' : '#f8fbff' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.2}>
              <Box>
                <Stack direction="row" spacing={0.9} alignItems="center" sx={{ mb: 0.8 }}>
                  {String(item.type).startsWith('BOOKING') ? (
                    <AssignmentTurnedInOutlinedIcon sx={{ color: '#0ea5e9', fontSize: 18 }} />
                  ) : (
                    <InfoOutlinedIcon sx={{ color: '#64748b', fontSize: 18 }} />
                  )}
                  <Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>
                  <Chip
                    size="small"
                    label={typeLabel[item.type] || 'General'}
                    sx={{
                      bgcolor: '#eef2ff',
                      color: typeColor[item.type] || '#64748b',
                      fontWeight: 700,
                    }}
                  />
                  {!item.isRead ? <Chip size="small" label="New" color="primary" /> : null}
                </Stack>
                <Typography sx={{ color: '#475569' }}>{item.message}</Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: 12.5, mt: 0.8 }}>
                  {new Date(item.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="flex-start" useFlexGap flexWrap="wrap">
                {!item.isRead ? (
                  <Button
                    size="small"
                    onClick={() => markOneRead(item)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Mark Read
                  </Button>
                ) : null}
                {item?.meta?.bookingId || item?.meta?.bookingObjectId ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openRelatedBooking(item)}
                    startIcon={<NotificationsActiveOutlinedIcon />}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Open Booking
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {page < totalPages ? (
        <Stack alignItems="center" sx={{ pt: 0.8 }}>
          <Button
            onClick={() => loadPage(page + 1, true)}
            disabled={loadingMore}
            variant="outlined"
            sx={{ textTransform: 'none', minWidth: 160 }}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
