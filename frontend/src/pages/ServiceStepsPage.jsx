import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  completeServiceStep,
  fetchServiceSteps,
  pauseService,
  resumeService,
  sendBookingOtp,
  verifyBookingOtp,
} from '../services/bookingWorkflowApi';

const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  return [hours, minutes, secs].map((v) => String(v).padStart(2, '0')).join(':');
};

const getErrorText = (err, fallback) => err?.response?.data?.message || fallback;

export default function ServiceStepsPage({ bookingId, open, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [steps, setSteps] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [status, setStatus] = useState('in_progress');
  const [serviceStartTime, setServiceStartTime] = useState(null);
  const [pausedDurationSeconds, setPausedDurationSeconds] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState(null);
  const [serviceDuration, setServiceDuration] = useState(0);
  const [tick, setTick] = useState(0);

  const [stepLoadingOrder, setStepLoadingOrder] = useState(null);
  const [pauseActionLoading, setPauseActionLoading] = useState(false);

  const [otpInput, setOtpInput] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  useEffect(() => {
    if (!open || !bookingId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      setOtpError('');
      setOtpSuccess('');
      setOtpInput('');
      setDemoOtp('');

      try {
        console.log(`[ServiceStepsPage.load] Loading steps for bookingId: ${bookingId}`);
        const data = await fetchServiceSteps(bookingId);
        console.log(`[ServiceStepsPage.load] Fetched data:`, {
          status: data.status,
          completedSteps: data.completedSteps?.length || 0,
          serviceStartTime: data.serviceStartTime,
          pausedDurationSeconds: data.pausedDurationSeconds,
          pauseStartedAt: data.pauseStartedAt
        });
        if (cancelled) return;

        const ordered = (data.steps || [])
          .map((step, index) => ({
            order: Number(step.order) || index + 1,
            title: step.title || `Step ${index + 1}`,
            description: step.description || '',
          }))
          .sort((a, b) => a.order - b.order);

        setSteps(ordered);
        setCompletedSteps((data.completedSteps || []).map(Number).sort((a, b) => a - b));
        const normalizedStatus = String(data.status || 'in_progress').toLowerCase();
        console.log(`[ServiceStepsPage.load] Setting status to: ${normalizedStatus}`);
        setStatus(normalizedStatus);
        setServiceStartTime(data.serviceStartTime || null);
        setPausedDurationSeconds(Number(data.pausedDurationSeconds) || 0);
        setPauseStartedAt(data.pauseStartedAt || null);
        setServiceDuration(Number(data.serviceDuration) || 0);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorText(err, 'Failed to fetch service steps'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [bookingId, open]);

  useEffect(() => {
    if (!open || !serviceStartTime || !['in_progress', 'otp_sent'].includes(status)) return undefined;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [open, serviceStartTime, status]);

  const elapsedSeconds = useMemo(() => {
    if (!serviceStartTime) return 0;
    const start = new Date(serviceStartTime).getTime();
    if (Number.isNaN(start)) return 0;

    const now = Date.now();
    const persistedPausedSeconds = Math.max(0, Number(pausedDurationSeconds) || 0);
    const livePausedSeconds =
      status === 'paused' && pauseStartedAt
        ? Math.max(0, Math.floor((now - new Date(pauseStartedAt).getTime()) / 1000))
        : 0;

    return Math.max(0, Math.floor((now - start) / 1000) - persistedPausedSeconds - livePausedSeconds);
  }, [serviceStartTime, pausedDurationSeconds, pauseStartedAt, status, tick]);

  const totalServiceSeconds = serviceDuration * 60;
  const remainingSeconds = Math.max(0, totalServiceSeconds - elapsedSeconds);
  const progressPercentage = totalServiceSeconds > 0
    ? Math.min(100, Math.round((elapsedSeconds / totalServiceSeconds) * 100))
    : 0;

  const nextExpectedOrder = useMemo(() => {
    const maxCompleted = completedSteps.length ? completedSteps[completedSteps.length - 1] : 0;
    return maxCompleted + 1;
  }, [completedSteps]);

  const allStepsCompleted = steps.length > 0 && completedSteps.length === steps.length;
  const canPauseService = status === 'in_progress';
  const canResumeService = status === 'paused';
  const canCompleteSteps = status === 'in_progress';
  const canSendOtp = status === 'in_progress' && allStepsCompleted;
  const canVerifyOtp = status === 'otp_sent' || Boolean(demoOtp);

  const handleStepCheck = async (order) => {
    setStepLoadingOrder(order);
    setOtpError('');
    setOtpSuccess('');

    try {
      const data = await completeServiceStep(bookingId, order);
      const updated = (data?.completedSteps || []).map(Number).sort((a, b) => a - b);
      setCompletedSteps(updated);
    } catch (err) {
      setOtpError(getErrorText(err, 'Failed to update service step'));
    } finally {
      setStepLoadingOrder(null);
    }
  };

  const handleSendOtp = async () => {
    setOtpSending(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const data = await sendBookingOtp(bookingId);
      setStatus('otp_sent');
      setDemoOtp(String(data?.otp || '123456'));
      setOtpSuccess('OTP sent to customer phone (demo mode).');
    } catch (err) {
      setOtpError(getErrorText(err, 'Failed to send OTP'));
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpVerifying(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      await verifyBookingOtp(bookingId, otpInput);
      setStatus('completed');
      setOtpSuccess('OTP verified. Booking completed successfully.');
      setTimeout(() => onClose(true), 1000);
    } catch (err) {
      setOtpError(getErrorText(err, 'Invalid OTP'));
    } finally {
      setOtpVerifying(false);
    }
  };

  const handlePauseService = async () => {
    setPauseActionLoading(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      console.log(`[handlePauseService] Calling pauseService for bookingId: ${bookingId}, Current status: ${status}`);
      const data = await pauseService(bookingId);
      console.log(`[handlePauseService] Pause response:`, data);
      
      const booking = data?.booking || {};
      setStatus(String(booking.status || 'paused').toLowerCase());
      setPauseStartedAt(booking.pauseStartedAt || new Date().toISOString());
      setPausedDurationSeconds(Number(booking.pausedDurationSeconds) || pausedDurationSeconds);
      setOtpSuccess('Service paused successfully.');
      onClose(true);
    } catch (err) {
      console.error(`[handlePauseService] Error:`, err);
      const errorMessage = getErrorText(err, 'Failed to pause service');
      console.error(`[handlePauseService] Error message: ${errorMessage}`);
      setOtpError(errorMessage);
    } finally {
      setPauseActionLoading(false);
    }
  };

  const handleResumeService = async () => {
    setPauseActionLoading(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      console.log(`[handleResumeService] Calling resumeService for bookingId: ${bookingId}, Current status: ${status}`);
      const data = await resumeService(bookingId);
      console.log(`[handleResumeService] Resume response:`, data);
      
      const booking = data?.booking || {};
      setStatus(String(booking.status || 'in_progress').toLowerCase());
      setPauseStartedAt(booking.pauseStartedAt || null);
      setPausedDurationSeconds(Number(booking.pausedDurationSeconds) || 0);
      setTick((prev) => prev + 1);
      setOtpSuccess('Service resumed successfully.');
      onClose(true);
    } catch (err) {
      console.error(`[handleResumeService] Error:`, err);
      const errorMessage = getErrorText(err, 'Failed to resume service');
      console.error(`[handleResumeService] Error message: ${errorMessage}`);
      setOtpError(errorMessage);
    } finally {
      setPauseActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Service Workflow</DialogTitle>
      <DialogContent>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f0fdf4', border: '1.5px solid #86efac' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Typography fontWeight={700} sx={{ color: '#15803d' }}>Service Stopwatch</Typography>
                  <Typography sx={{ mt: 0.6, fontSize: 28, fontWeight: 800, color: '#15803d' }}>
                    {formatDuration(elapsedSeconds)}
                  </Typography>
                  <Typography sx={{ mt: 0.4, fontSize: 13, color: '#65a30d' }}>
                    Out of {formatDuration(totalServiceSeconds)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography fontWeight={700} sx={{ color: '#15803d', fontSize: 14 }}>Remaining</Typography>
                  <Typography sx={{ mt: 0.4, fontSize: 22, fontWeight: 800, color: '#4ade80' }}>
                    {formatDuration(remainingSeconds)}
                  </Typography>
                  <Typography sx={{ mt: 0.4, fontSize: 12, color: '#65a30d' }}>
                    {progressPercentage}% Complete
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 1.2, height: 6, borderRadius: 999, bgcolor: '#dcfce7', overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    bgcolor: '#15803d',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                {canPauseService ? (
                  <Button
                    variant="contained"
                    onClick={handlePauseService}
                    disabled={pauseActionLoading || otpSending || otpVerifying || stepLoadingOrder !== null}
                    sx={{ textTransform: 'none', bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' }, fontWeight: 700 }}
                  >
                    {pauseActionLoading ? 'Pausing...' : 'Pause Service'}
                  </Button>
                ) : null}

                {canResumeService ? (
                  <Button
                    variant="contained"
                    onClick={handleResumeService}
                    disabled={pauseActionLoading}
                    sx={{ textTransform: 'none', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, fontWeight: 700 }}
                  >
                    {pauseActionLoading ? 'Resuming...' : 'Resume Service'}
                  </Button>
                ) : null}
              </Stack>
            </Box>

            {status === 'paused' ? (
              <Alert severity="warning">Service is paused. Click Resume Service to continue checklist and OTP flow.</Alert>
            ) : null}

            <Typography sx={{ fontWeight: 700 }}>Checklist</Typography>
            {!steps.length ? (
              <Alert severity="warning">No service steps configured by admin for this booking.</Alert>
            ) : (
              steps.map((step) => {
                const checked = completedSteps.includes(step.order);
                const disabled =
                  !canCompleteSteps ||
                  checked ||
                  stepLoadingOrder !== null ||
                  step.order !== nextExpectedOrder;

                return (
                  <Box
                    key={step.order}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      p: 1.2,
                      borderRadius: 1.5,
                      border: '1px solid #e5e7eb',
                      bgcolor: checked ? '#f0fdf4' : '#fff',
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onChange={() => handleStepCheck(step.order)}
                    />
                    <Box>
                      <Typography fontWeight={700}>{step.title}</Typography>
                      {step.description ? (
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {step.description}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                );
              })
            )}

            {canSendOtp ? (
              <Button variant="contained" onClick={handleSendOtp} disabled={otpSending}>
                {otpSending ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            ) : null}

            {canVerifyOtp ? (
              <Stack spacing={1.2}>
                {demoOtp ? (
                  <Alert severity="info">Demo OTP is {demoOtp}</Alert>
                ) : (
                  <Alert severity="info">OTP has been sent. Enter the customer OTP to complete.</Alert>
                )}
                <TextField
                  label="Enter OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputProps={{ maxLength: 6 }}
                  placeholder="6-digit OTP"
                  disabled={otpVerifying || status === 'completed'}
                />
                <Button
                  variant="contained"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || otpInput.length !== 6 || status === 'completed'}
                >
                  {otpVerifying ? 'Verifying...' : 'Verify OTP and Complete'}
                </Button>
              </Stack>
            ) : null}

            {otpError ? <Alert severity="error">{otpError}</Alert> : null}
            {otpSuccess ? <Alert severity="success">{otpSuccess}</Alert> : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
