import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const STORAGE_KEY = 'fixitpro_provider_settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    bookingAlerts: true,
    soundAlerts: true,
    weeklySummary: false,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings({ ...settings, ...JSON.parse(raw) });
      }
    } catch (_error) {
      // Ignore malformed local settings and continue with defaults.
    }
  }, []);

  const handleToggle = (key) => (event) => {
    setSettings((prev) => ({ ...prev, [key]: event.target.checked }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('provider-settings-updated', { detail: settings }));
    setMessage('Settings saved successfully');
    setTimeout(() => setMessage(''), 2200);
  };

  return (
    <Stack spacing={2.2}>
      <Box>
        <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800 }}>Settings</Typography>
        <Typography sx={{ color: '#64748b' }}>Manage your notification and app preferences</Typography>
      </Box>

      {message ? <Alert severity="success">{message}</Alert> : null}

      <Card sx={{ borderRadius: 3, border: '1px solid #d6dee8', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <SettingsOutlinedIcon sx={{ color: '#0f8f7b' }} />
            <Typography sx={{ fontWeight: 800, fontSize: 19, color: '#0f172a' }}>Preferences</Typography>
          </Stack>

          <Stack spacing={1}>
            <FormControlLabel
              control={<Switch checked={settings.bookingAlerts} onChange={handleToggle('bookingAlerts')} />}
              label="Booking alerts"
            />
            <FormControlLabel
              control={<Switch checked={settings.soundAlerts} onChange={handleToggle('soundAlerts')} />}
              label="Sound on new notification"
            />
            <FormControlLabel
              control={<Switch checked={settings.weeklySummary} onChange={handleToggle('weeklySummary')} />}
              label="Weekly performance summary"
            />
          </Stack>

          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ mt: 2, textTransform: 'none', borderRadius: 2, background: 'linear-gradient(135deg, #148f7d 0%, #1fb59a 100%)' }}
          >
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
