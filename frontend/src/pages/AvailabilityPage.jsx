import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ClockIcon from '@mui/icons-material/Schedule';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const days = [
  { key: 'MON', label: 'Mon' },
  { key: 'TUE', label: 'Tue' },
  { key: 'WED', label: 'Wed' },
  { key: 'THU', label: 'Thu' },
  { key: 'FRI', label: 'Fri' },
  { key: 'SAT', label: 'Sat' },
  { key: 'SUN', label: 'Sun' },
];

const dayOrderMap = new Map(days.map((day, index) => [day.key, index]));

const normalizeAvailability = (availability) => {
  const incomingWorkingDays = Array.isArray(availability?.workingDays) ? availability.workingDays : [];
  const incomingSlots = Array.isArray(availability?.slots) ? availability.slots : [];

  const workingDays = [...new Set(incomingWorkingDays)]
    .filter((day) => dayOrderMap.has(day))
    .sort((a, b) => dayOrderMap.get(a) - dayOrderMap.get(b));

  const slots = incomingSlots
    .map((slot) => ({
      start: String(slot?.start || '').trim(),
      end: String(slot?.end || '').trim(),
    }))
    .filter((slot) => slot.start || slot.end);

  return {
    workingDays,
    slots: slots.length ? slots : [{ start: '', end: '' }],
  };
};

const serializeAvailability = (availability) =>
  JSON.stringify({
    workingDays: [...availability.workingDays].sort((a, b) => dayOrderMap.get(a) - dayOrderMap.get(b)),
    slots: availability.slots.map((slot) => ({
      start: slot.start,
      end: slot.end,
    })),
  });

const hasSlotOverlap = (slots) => {
  const validSlots = slots
    .filter((slot) => slot.start && slot.end)
    .map((slot) => {
      const [startH, startM] = slot.start.split(':').map(Number);
      const [endH, endM] = slot.end.split(':').map(Number);
      return {
        ...slot,
        startMinutes: startH * 60 + startM,
        endMinutes: endH * 60 + endM,
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  for (let i = 1; i < validSlots.length; i += 1) {
    if (validSlots[i].startMinutes < validSlots[i - 1].endMinutes) {
      return true;
    }
  }

  return false;
};

const calculateDuration = (start, end) => {
  if (!start || !end) return '';
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const diff = (endH * 60 + endM) - (startH * 60 + startM);
  if (diff <= 0) return 'Invalid';
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins}m`;
};

const SlotCard = ({ slot, index, onSlotChange, onRemoveSlot, theme }) => {
  const duration = calculateDuration(slot.start, slot.end);
  const isValid = slot.start && slot.end && duration !== 'Invalid';

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${isValid ? alpha(theme.palette.primary.main, 0.32) : alpha(theme.palette.divider, 0.7)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[4],
          borderColor: theme.palette.primary.main,
        },
        bgcolor: isValid ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
      }}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <AccessTimeIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Slot {index + 1}
          </Typography>
          {isValid && <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.primary.main, ml: 'auto' }} />}
        </Stack>

        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={5}>
            <TextField
              fullWidth
              type="time"
              size="small"
              label="Start"
              value={slot.start}
              onChange={(e) => onSlotChange(index, 'start', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ '& input': { fontSize: '0.875rem' } }}
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              fullWidth
              type="time"
              size="small"
              label="End"
              value={slot.end}
              onChange={(e) => onSlotChange(index, 'end', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ '& input': { fontSize: '0.875rem' } }}
            />
          </Grid>
          <Grid item xs={2} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => onRemoveSlot(index)}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.dark,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
              }}
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Grid>
        </Grid>

        {isValid && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              icon={<ClockIcon />}
              label={`${slot.start} - ${slot.end}`}
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip
              label={duration}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                borderColor: alpha(theme.palette.primary.main, 0.4),
                color: theme.palette.primary.dark,
              }}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default function AvailabilityPage() {
  const theme = useTheme();
  const { provider, refreshProfile } = useAuth();
  const [workingDays, setWorkingDays] = useState(() => normalizeAvailability(provider?.availability).workingDays);
  const [slots, setSlots] = useState(() => normalizeAvailability(provider?.availability).slots);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialAvailability = useMemo(() => normalizeAvailability(provider?.availability), [provider?.availability]);

  useEffect(() => {
    setWorkingDays(initialAvailability.workingDays);
    setSlots(initialAvailability.slots);
  }, [initialAvailability]);

  const handleSlotChange = (index, key, value) => {
    setSlots((prev) => prev.map((slot, idx) => (idx === index ? { ...slot, [key]: value } : slot)));
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { start: '', end: '' }]);
    setOpenDialog(false);
  };

  const removeSlot = (index) => {
    setSlots((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length ? next : [{ start: '', end: '' }];
    });
  };

  const resetChanges = () => {
    setWorkingDays(initialAvailability.workingDays);
    setSlots(initialAvailability.slots);
    setError('');
    setMessage('');
  };

  const handleSave = async () => {
    try {
      setError('');
      setMessage('');
      setSaving(true);
      const orderedWorkingDays = [...new Set(workingDays)]
        .filter((day) => dayOrderMap.has(day))
        .sort((a, b) => dayOrderMap.get(a) - dayOrderMap.get(b));

      if (orderedWorkingDays.length === 0) {
        setError('Please select at least one working day');
        return;
      }

      const validSlots = slots.filter((slot) => slot.start && slot.end);

      if (validSlots.length === 0) {
        setError('Please add at least one valid time slot');
        return;
      }

      const hasInvalidOrder = validSlots.some((slot) => calculateDuration(slot.start, slot.end) === 'Invalid');
      if (hasInvalidOrder) {
        setError('End time must be later than start time for each slot');
        return;
      }

      if (hasSlotOverlap(validSlots)) {
        setError('Time slots overlap. Please adjust the schedule.');
        return;
      }

      await api.put('/providers/availability', { workingDays: orderedWorkingDays, slots: validSlots });
      await refreshProfile();
      setMessage('✅ Availability updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = useMemo(() => {
    const current = {
      workingDays,
      slots,
    };
    return serializeAvailability(current) !== serializeAvailability(initialAvailability);
  }, [initialAvailability, slots, workingDays]);

  const validSlots = slots.filter((s) => s.start && s.end);
  const totalWeeklyHours = validSlots.reduce((sum, slot) => {
    const [startH, startM] = slot.start.split(':').map(Number);
    const [endH, endM] = slot.end.split(':').map(Number);
    const diff = (endH * 60 + endM) - (startH * 60 + startM);
    return sum + (diff > 0 ? diff : 0);
  }, 0) * workingDays.length / 60;

  return (
    <Stack spacing={2}>
      {/* HEADER */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
          borderRadius: 3,
          p: { xs: 2, sm: 2.5 },
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.3, letterSpacing: '-0.01em' }}>
              Availability Schedule
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage your working days and available time slots
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.dark,
              borderRadius: 2,
              p: 1.5,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', display: 'block' }}>
              Weekly Hours
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {totalWeeklyHours.toFixed(1)}h
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* ALERTS */}
      {message && (
        <Alert
          severity="success"
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
          }}
        >
          {message}
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
          }}
        >
          {error}
        </Alert>
      )}

      {/* SECTION 1: WORKING DAYS */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, fontSize: '1rem' }}>
            Working Days
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            {days.map((day) => (
              <Chip
                key={day.key}
                label={day.label}
                onClick={() => {
                  if (workingDays.includes(day.key)) {
                    setWorkingDays((prev) => prev.filter((d) => d !== day.key));
                  } else {
                    setWorkingDays((prev) => [...prev, day.key]);
                  }
                }}
                variant={workingDays.includes(day.key) ? 'filled' : 'outlined'}
                color={workingDays.includes(day.key) ? 'primary' : 'default'}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[2],
                  },
                }}
              />
            ))}
          </Stack>
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Selected: <strong>{workingDays.length} days</strong>
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(workingDays.length / 7) * 100}
              sx={{
                mt: 0.8,
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* SECTION 2: TIME SLOTS */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                Available Time Slots
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {validSlots.length} valid slot{validSlots.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Chip
              icon={<AddIcon />}
              label="New Slot"
              onClick={() => setOpenDialog(true)}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          {slots.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.4), mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No time slots added yet
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={1.5} sx={{ mt: 0 }}>
              {slots.map((slot, index) => (
                <Grid item xs={12} sm={6} md={4} key={`${slot.start}-${slot.end}-${index}`}>
                  <SlotCard
                    slot={slot}
                    index={index}
                    onSlotChange={handleSlotChange}
                    onRemoveSlot={removeSlot}
                    theme={theme}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          <Divider sx={{ my: 2 }} />

          {/* ACTION BUTTONS */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="flex-end">
            <Button variant="text" onClick={resetChanges} disabled={!isDirty || saving} sx={{ borderRadius: 2 }}>
              Reset
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              disabled={saving}
              sx={{ borderRadius: 2 }}
            >
              Add Another Slot
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving || !isDirty}
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              {saving ? 'Saving...' : 'Save Availability'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* SLOT INFO CARDS */}
      {validSlots.length > 0 && (
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.06), border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Total Hours (Weekly)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.dark }}>
                  {totalWeeklyHours.toFixed(1)}h
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {workingDays.length} days × {(totalWeeklyHours / (workingDays.length || 1)).toFixed(1)}h per day
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card sx={{ borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.04), border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Valid Slots
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.dark }}>
                  {validSlots.length}/{slots.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {slots.length - validSlots.length} incomplete slot{slots.length - validSlots.length !== 1 ? 's' : ''}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ADD SLOT DIALOG */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Time Slot</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            New slots will be added as empty. Fill them with your preferred times.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={addSlot} variant="contained">
            Add Slot
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
