import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Fade,
} from '@mui/material';
import {
  PhoneOutlined as PhoneIcon,
  VpnKeyOutlined as OtpIcon,
  ArrowForwardRounded as ArrowForwardIcon,
  BuildRounded as BrandIcon,
  StarBorderRounded as StarIcon,
  ShieldOutlined as ShieldIcon,
  ScheduleRounded as ScheduleIcon,
  CheckCircleOutlineRounded as CheckIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number starting with 6-9');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/send-otp', { mobile });
      setOtpSent(true);
      setDebugOtp(data.debugOtp || '');
      setSuccess('OTP sent successfully! Check your phone.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter a valid 6-digit OTP');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-otp', { mobile, otp });
      setSuccess('✅ Verification successful! Redirecting...');
      setAuth(data.token, data.provider);
      setTimeout(() => {
        if (data.isNewUser) {
          navigate('/onboarding');
        } else {
          navigate('/app/dashboard');
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeMobile = () => {
    setOtpSent(false);
    setOtp('');
    setDebugOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f1f3f6',
      }}
    >
      <Container maxWidth={false} disableGutters>
        <Fade in timeout={600}>
          <Box
            sx={{
              minHeight: '100vh',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '0.94fr 1.06fr' },
            }}
          >
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 7,
                color: '#f8fafc',
                background:
                  'radial-gradient(circle at 68% 58%, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0) 55%), linear-gradient(165deg, #111b35 0%, #1b2845 42%, #1c4d4a 100%)',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1.6} alignItems="center" sx={{ mb: 8 }}>
                  <Box
                    sx={{
                      width: 66,
                      height: 66,
                      borderRadius: '18px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: '#13b8a6',
                    }}
                  >
                    <BrandIcon sx={{ fontSize: 34, color: '#e6fffb' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                      FixItPro
                    </Typography>
                    <Typography sx={{ color: 'rgba(226, 232, 240, 0.78)', fontSize: 29 / 2 }}>
                      Service Provider Portal
                    </Typography>
                  </Box>
                </Stack>

                <Typography sx={{ fontSize: 58 / 2, fontWeight: 800, lineHeight: 1.2, maxWidth: 460 }}>
                  Grow your business.
                  <br />
                  Serve more customers.
                </Typography>
                <Typography
                  sx={{
                    mt: 3,
                    color: 'rgba(226, 232, 240, 0.78)',
                    maxWidth: 520,
                    fontSize: 17,
                    lineHeight: 1.45,
                  }}
                >
                  Join India&apos;s fastest-growing home services platform. Get steady bookings, earn more,
                  and manage everything from one place.
                </Typography>

                <List sx={{ mt: 5, p: 0 }}>
                  {[
                    { label: 'Join 10,000+ verified service providers', icon: <StarIcon /> },
                    { label: 'Secure and on-time payments guaranteed', icon: <ShieldIcon /> },
                    { label: 'Flexible scheduling on your terms', icon: <ScheduleIcon /> },
                    { label: 'Dedicated support and training', icon: <CheckIcon /> },
                  ].map((item) => (
                    <ListItem key={item.label} disableGutters sx={{ py: 1.1 }}>
                      <ListItemIcon sx={{ minWidth: 54 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: 'rgba(148, 163, 184, 0.2)',
                            color: '#2dd4bf',
                          }}
                        >
                          {item.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          sx: { fontSize: 35 / 2, color: '#e2e8f0' },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Typography sx={{ color: 'rgba(148, 163, 184, 0.72)', fontSize: 28 / 2 }}>
                © 2026 FixItPro. All rights reserved.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 2.5, sm: 5, md: 8 },
                py: { xs: 6, md: 0 },
              }}
            >
              <Box sx={{ width: '100%', maxWidth: 560 }}>
                <Typography variant="h3" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 800, mb: 1.2 }}>
                  FixItPro
                </Typography>

                {error && (
                  <Fade in={!!error}>
                    <Alert
                      severity="error"
                      sx={{
                        mb: 2.3,
                        borderRadius: 2,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                {success && (
                  <Fade in={!!success}>
                    <Alert
                      severity="success"
                      sx={{
                        mb: 2.3,
                        borderRadius: 2,
                        background: '#ecfdf5',
                        border: '1px solid #86efac',
                      }}
                    >
                      {success}
                    </Alert>
                  </Fade>
                )}

                {!otpSent ? (
                  <Fade in={!otpSent}>
                    <Stack spacing={3.2}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                          Welcome back
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: 18, mb: 4 }}>
                          Enter your registered phone number to continue
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: '#111827', mb: 1.3 }}>
                          Phone Number
                        </Typography>

                        <TextField
                          fullWidth
                          placeholder="Enter 10-digit number"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon sx={{ color: '#64748b', mr: 0.6 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.6,
                              background: '#f8fafc',
                              fontSize: 32 / 2,
                              '&.Mui-focused': {
                                boxShadow: '0 0 0 3px rgba(20, 184, 166, 0.12)',
                              },
                            },
                            '& .MuiOutlinedInput-input': {
                              py: 2,
                            },
                          }}
                        />

                        {mobile.length > 0 && mobile.length < 10 && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.8 }}>
                            Enter {10 - mobile.length} more digit{10 - mobile.length > 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>

                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSendOtp}
                        disabled={loading || mobile.length !== 10}
                        endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
                        sx={{
                          py: 1.7,
                          fontSize: 34 / 2,
                          fontWeight: 800,
                          borderRadius: 1.6,
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #148f7d 0%, #1fb59a 100%)',
                          boxShadow: '0 10px 25px rgba(20, 143, 125, 0.24)',
                          '&:hover:not(:disabled)': {
                            boxShadow: '0 13px 30px rgba(20, 143, 125, 0.32)',
                          },
                        }}
                      >
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                      </Button>

                      <Typography sx={{ textAlign: 'center', color: '#64748b', fontSize: 16 }}>
                        By continuing, you agree to our{' '}
                        <Box component="span" sx={{ color: '#0f766e' }}>
                          Terms
                        </Box>{' '}
                        &{' '}
                        <Box component="span" sx={{ color: '#0f766e' }}>
                          Privacy Policy
                        </Box>
                      </Typography>
                    </Stack>
                  </Fade>
                ) : (
                  <Fade in={otpSent}>
                    <Stack spacing={3.1}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                          Verify your number
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: 18, mb: 4 }}>
                          We&apos;ve sent a 6-digit code to +91{mobile}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: '#111827', mb: 1.3 }}>
                          Enter OTP
                        </Typography>

                        <TextField
                          fullWidth
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          disabled={loading}
                          inputProps={{
                            maxLength: 6,
                            style: {
                              textAlign: 'center',
                              letterSpacing: '0.45em',
                              fontSize: '1.3rem',
                              fontWeight: 700,
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <OtpIcon sx={{ color: '#64748b', mr: 0.6 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.6,
                              background: '#f8fafc',
                              '&.Mui-focused': {
                                boxShadow: '0 0 0 3px rgba(20, 184, 166, 0.12)',
                              },
                            },
                            '& .MuiOutlinedInput-input': {
                              py: 1.8,
                            },
                          }}
                        />

                        {otp.length > 0 && otp.length < 6 && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.8 }}>
                            Enter {6 - otp.length} more digit{6 - otp.length > 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>

                      {debugOtp && (
                        <Alert
                          severity="info"
                          sx={{
                            borderRadius: 2,
                            background: '#eff6ff',
                            border: '1px solid #93c5fd',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f4c81' }}>
                            Dev mode OTP: <strong>{debugOtp}</strong>
                          </Typography>
                        </Alert>
                      )}

                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.length !== 6}
                        endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                        sx={{
                          py: 1.7,
                          fontSize: 34 / 2,
                          fontWeight: 800,
                          borderRadius: 1.6,
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #148f7d 0%, #1fb59a 100%)',
                          boxShadow: '0 10px 25px rgba(20, 143, 125, 0.24)',
                          '&:hover:not(:disabled)': {
                            boxShadow: '0 13px 30px rgba(20, 143, 125, 0.32)',
                          },
                        }}
                      >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                      </Button>

                      <Button
                        variant="text"
                        onClick={handleChangeMobile}
                        disabled={loading}
                        sx={{
                          py: 0.3,
                          color: '#0f766e',
                          fontWeight: 700,
                          textTransform: 'none',
                          '&:hover': { background: 'transparent', textDecoration: 'underline' },
                        }}
                      >
                        Change phone number
                      </Button>

                      <Typography sx={{ textAlign: 'center', color: '#64748b', fontSize: 16 }}>
                        By continuing, you agree to our{' '}
                        <Box component="span" sx={{ color: '#0f766e' }}>
                          Terms
                        </Box>{' '}
                        &{' '}
                        <Box component="span" sx={{ color: '#0f766e' }}>
                          Privacy Policy
                        </Box>
                      </Typography>
                    </Stack>
                  </Fade>
                )}
              </Box>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}
