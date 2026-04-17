import {
  AppBar,
  Box,
  Badge,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Chip,
  Button,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const drawerWidth = 286;
const miniDrawerWidth = 92;

const menu = [
  { label: 'Dashboard', path: '/app/dashboard', icon: <DashboardOutlinedIcon /> },
  { label: 'Bookings', path: '/app/bookings', icon: <AssignmentOutlinedIcon /> },
  { label: 'Availability', path: '/app/availability', icon: <ScheduleOutlinedIcon /> },
  { label: 'Services', path: '/app/skills', icon: <BuildOutlinedIcon /> },
  { label: 'Products', path: '/app/products', icon: <CategoryOutlinedIcon /> },
  { label: 'Profile', path: '/app/profile', icon: <PersonOutlineOutlinedIcon /> },
  { label: 'Notifications', path: '/app/notifications', icon: <NotificationsActiveOutlinedIcon /> },
];

const footerMenu = [
  { label: 'Settings', path: '/app/settings', icon: <SettingsOutlinedIcon /> },
  { label: 'Help', path: '/app/help', icon: <HelpOutlineOutlinedIcon /> },
];

export default function ProviderLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerMinimized, setDrawerMinimized] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notificationFilter, setNotificationFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  const { provider, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    latestNotification,
    readNotification,
    readAllNotifications,
    dismissLatestNotification,
  } = useNotifications();

  const openNotifications = Boolean(notificationAnchor);
  const profileImageUrl = provider?.profileImage || '';

  const formatDate = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_error) {
      return '';
    }
  };

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'booking') {
      return notifications.filter((item) =>
        ['BOOKING_ASSIGNED', 'BOOKING_UPDATED'].includes(String(item?.type || ''))
      );
    }

    if (notificationFilter === 'general') {
      return notifications.filter((item) => String(item?.type || '') === 'GENERAL');
    }

    return notifications;
  }, [notifications, notificationFilter]);

  const desktopDrawerWidth = drawerMinimized ? miniDrawerWidth : drawerWidth;

  const drawerContent = (compact = false) => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#cbd5e1',
        background:
          'linear-gradient(180deg, #111a2e 0%, #111d34 42%, #111a2f 100%)',
      }}
    >
      <Box>
        <Toolbar sx={{ minHeight: '92px !important', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Stack direction="row" spacing={1.4} alignItems="center" sx={{ width: '100%', justifyContent: compact ? 'center' : 'space-between' }}>
            <Stack direction="row" spacing={1.4} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '16px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#11b9a3',
              }}
            >
              <HandymanOutlinedIcon sx={{ color: '#e8fffb' }} />
            </Box>
            {!compact ? (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
                FixItPro
              </Typography>
              <Typography sx={{ color: '#6f819f', fontSize: 14.5, mt: 0.2 }}>
                Service Provider
              </Typography>
            </Box>
            ) : null}
            </Stack>

            {!compact ? (
              <IconButton
                onClick={() => setDrawerMinimized(true)}
                sx={{ color: '#8fa6c6' }}
                aria-label="Minimize drawer"
              >
                <ChevronLeftOutlinedIcon />
              </IconButton>
            ) : (
              <IconButton
                onClick={() => setDrawerMinimized(false)}
                sx={{ color: '#8fa6c6', position: 'absolute', right: 8 }}
                aria-label="Expand drawer"
              >
                <ChevronRightOutlinedIcon />
              </IconButton>
            )}
          </Stack>
        </Toolbar>

        <List sx={{ p: compact ? 1 : 1.6, pt: 2.2 }}>
          {menu.map((item) => {
            const active = item.path === '/app/products'
              ? location.pathname.startsWith('/app/products')
              : location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                selected={active}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2.5,
                  mb: 0.8,
                  px: compact ? 1.2 : 1.8,
                  py: 1.4,
                  justifyContent: compact ? 'center' : 'flex-start',
                  color: active ? '#12d3b5' : '#97a7c1',
                  '& .MuiListItemIcon-root': {
                    color: active ? '#12d3b5' : '#5d6f90',
                    minWidth: compact ? 0 : 42,
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: active ? 700 : 600,
                    fontSize: 18.5,
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(18, 211, 181, 0.18)',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'rgba(18, 211, 181, 0.22)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                {!compact ? <ListItemText primary={item.label} /> : null}
                {active && !compact ? (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#12d3b5',
                      boxShadow: '0 0 8px rgba(18, 211, 181, 0.45)',
                    }}
                  />
                ) : null}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box sx={{ p: compact ? 1 : 1.6, borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
        <List sx={{ p: 0 }}>
          {footerMenu.map((item) => {
            const active = location.pathname === item.path;
            return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2.2,
                mb: 0.6,
                px: compact ? 1.2 : 1.8,
                py: 1.1,
                justifyContent: compact ? 'center' : 'flex-start',
                color: active ? '#12d3b5' : '#97a7c1',
                '& .MuiListItemIcon-root': {
                  color: active ? '#12d3b5' : '#7b89a1',
                  minWidth: compact ? 0 : 42,
                },
                '& .MuiListItemText-primary': {
                  fontWeight: active ? 700 : 500,
                  fontSize: 18,
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(18, 211, 181, 0.18)',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'rgba(18, 211, 181, 0.22)',
                },
                '&:hover': {
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              {!compact ? <ListItemText primary={item.label} /> : null}
            </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${desktopDrawerWidth}px)` },
          ml: { sm: `${desktopDrawerWidth}px` },
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shorter,
            }),
          bgcolor: '#ffffff',
          color: '#0f172a',
          boxShadow: 'none',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              Welcome, {provider?.name || provider?.mobile}
            </Typography>
          </Box>
          <Chip
            label={`Status: ${provider?.status || 'INACTIVE'}`}
            color={provider?.status === 'ACTIVE' ? 'success' : 'warning'}
            sx={{ mr: 2 }}
          />
          <IconButton
            color="inherit"
            onClick={(event) => setNotificationAnchor(event.currentTarget)}
            sx={{ mr: 1.2 }}
          >
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>
          <Avatar
            onClick={() => navigate('/app/profile')}
            sx={{ width: 34, height: 34, bgcolor: '#0ea5e9', mr: 1, fontSize: 14, cursor: 'pointer' }}
          >
            {profileImageUrl ? (
              <Box
                component="img"
                src={profileImageUrl}
                alt="Profile"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              (provider?.name || provider?.mobile || 'P').slice(0, 1).toUpperCase()
            )}
          </Avatar>
          <Button color="inherit" onClick={() => { logout(); navigate('/login'); }}>
            Logout
          </Button>

          <Menu
            anchorEl={notificationAnchor}
            open={openNotifications}
            onClose={() => setNotificationAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 360, maxHeight: 460, borderRadius: 2 } }}
          >
            <Box sx={{ px: 1.8, py: 1.2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontWeight: 700 }}>Notifications</Typography>
                <Button
                  size="small"
                  onClick={readAllNotifications}
                  disabled={!unreadCount}
                  sx={{ textTransform: 'none' }}
                >
                  Mark all read
                </Button>
              </Stack>
              <Button
                size="small"
                onClick={() => {
                  setNotificationAnchor(null);
                  navigate('/app/notifications');
                }}
                sx={{ mt: 0.6, textTransform: 'none', px: 0 }}
              >
                View all notifications
              </Button>
            </Box>
            <Divider />

            <Stack direction="row" spacing={0.8} sx={{ px: 1.4, py: 1.1 }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'booking', label: 'Bookings' },
                { key: 'general', label: 'General' },
              ].map((filter) => (
                <Chip
                  key={filter.key}
                  label={filter.label}
                  size="small"
                  clickable
                  onClick={() => setNotificationFilter(filter.key)}
                  color={notificationFilter === filter.key ? 'primary' : 'default'}
                  variant={notificationFilter === filter.key ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
            <Divider />

            {loading ? (
              <Box sx={{ py: 3, display: 'grid', placeItems: 'center' }}>
                <CircularProgress size={22} />
              </Box>
            ) : filteredNotifications.length ? (
              filteredNotifications.map((item) => (
                <MenuItem
                  key={item._id}
                  onClick={async () => {
                    if (!item.isRead) {
                      await readNotification(item._id);
                    }

                    const bookingTarget = item?.meta?.bookingId || item?.meta?.bookingObjectId;
                    if (bookingTarget) {
                      setNotificationAnchor(null);
                      navigate('/app/bookings', {
                        state: {
                          focusBookingId: String(bookingTarget),
                          focusStatus: String(item?.meta?.status || '').toLowerCase(),
                        },
                      });
                    }
                  }}
                  sx={{
                    alignItems: 'flex-start',
                    whiteSpace: 'normal',
                    py: 1.2,
                    px: 1.8,
                    bgcolor: item.isRead ? 'transparent' : 'rgba(14, 165, 233, 0.08)',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{item.title}</Typography>
                    <Typography sx={{ fontSize: 13.5, color: '#64748b' }}>{item.message}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 0.3 }}>{formatDate(item.createdAt)}</Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <Box sx={{ px: 1.8, py: 2.4 }}>
                <Typography sx={{ color: '#64748b', fontSize: 14 }}>No notifications yet</Typography>
              </Box>
            )}
          </Menu>

          <Snackbar
            open={Boolean(latestNotification)}
            autoHideDuration={3500}
            onClose={dismissLatestNotification}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={dismissLatestNotification}
              severity="info"
              variant="filled"
              sx={{ width: '100%', minWidth: 280 }}
            >
              {latestNotification?.title || 'New notification'}
            </Alert>
          </Snackbar>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: desktopDrawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
        >
          {drawerContent(false)}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: desktopDrawerWidth,
              borderRight: 'none',
              overflowX: 'hidden',
              transition: (theme) =>
                theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.shorter,
                }),
            },
          }}
          open
        >
          {drawerContent(drawerMinimized)}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${desktopDrawerWidth}px)` },
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shorter,
            }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
