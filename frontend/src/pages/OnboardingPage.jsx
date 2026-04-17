import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  Fade,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputAdornment,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Description as DocumentIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  DirectionsCar as CarIcon,
  MyLocation as MyLocationIcon,
  CloudUpload as CloudUploadIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const steps = ['Basic Details', 'Professional Details', 'Documents & Bank', 'Location'];

const stepIcons = [
  { icon: PersonIcon, color: '#2563eb' },
  { icon: WorkIcon, color: '#4338ca' },
  { icon: DocumentIcon, color: '#0f766e' },
  { icon: LocationIcon, color: '#0284c7' },
];

const AADHAR_REGEX = /^\d{4}-\d{4}-\d{4}$/;
const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{9,18}$/;

const formatAadhar = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  const parts = digits.match(/.{1,4}/g) || [];
  return parts.join('-');
};

const getFilePreview = (file, fallbackUrl) => {
  if (file) {
    return URL.createObjectURL(file);
  }
  return fallbackUrl || '';
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { provider, refreshProfile } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceOptions, setServiceOptions] = useState([]);

  const [basic, setBasic] = useState({
    name: provider?.name || '',
    email: provider?.email || '',
    dob: provider?.dob ? provider.dob.slice(0, 10) : '',
    gender: provider?.gender || 'MALE',
  });

  const [professional, setProfessional] = useState({
    expertise: provider?.expertise || [],
    experience: provider?.experience || 'NO_EXPERIENCE',
    maritalStatus: provider?.maritalStatus || 'UNMARRIED',
    emergencyContact: provider?.emergencyContact || '',
    referralName: provider?.referralName || '',
    hasVehicle: provider?.hasVehicle || false,
    vehicleDetails: {
      type: provider?.vehicleDetails?.type || '',
      model: provider?.vehicleDetails?.model || '',
      registrationNumber: provider?.vehicleDetails?.registrationNumber || '',
    },
  });

  const [documents, setDocuments] = useState({
    aadharNumber: provider?.documents?.aadharNumber || '',
    panNumber: provider?.documents?.panNumber || '',
    aadharFront: null,
    aadharBack: null,
    panImage: null,
    aadharFrontUrl: provider?.documents?.aadharFrontUrl || '',
    aadharBackUrl: provider?.documents?.aadharBackUrl || '',
    panUrl: provider?.documents?.panUrl || '',
    accountHolderName: provider?.bankDetails?.accountHolderName || '',
    bankName: provider?.bankDetails?.bankName || '',
    accountNumber: provider?.bankDetails?.accountNumber || '',
    ifscCode: provider?.bankDetails?.ifscCode || '',
    branchName: provider?.bankDetails?.branchName || '',
  });

  const [locationState, setLocationState] = useState({
    latitude: provider?.location?.latitude || '',
    longitude: provider?.location?.longitude || '',
    addressText: '',
  });

  useEffect(() => {
    let mounted = true;

    const fetchServices = async () => {
      setServicesLoading(true);
      try {
        const { data } = await api.get('/providers/services');
        if (mounted) {
          const options = (data.services || []).map((service) => ({
            value: service.name,
            label: service.name,
          }));
          setServiceOptions(options);
        }
      } catch (_err) {
        if (mounted) {
          setError('Unable to fetch services right now. Please try again.');
        }
      } finally {
        if (mounted) {
          setServicesLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      mounted = false;
    };
  }, []);

  const canContinue = useMemo(() => {
    if (activeStep === 0) {
      return (
        basic.name.trim() &&
        EMAIL_REGEX.test(basic.email.trim()) &&
        basic.dob &&
        basic.gender
      );
    }

    if (activeStep === 1) {
      const hasRequiredProfessionalFields =
        professional.expertise.length > 0 &&
        professional.experience &&
        professional.maritalStatus &&
        PHONE_REGEX.test(professional.emergencyContact) &&
        professional.referralName.trim();

      if (!hasRequiredProfessionalFields) {
        return false;
      }

      if (!professional.hasVehicle) {
        return true;
      }

      return (
        professional.vehicleDetails.type.trim() &&
        professional.vehicleDetails.model.trim() &&
        professional.vehicleDetails.registrationNumber.trim()
      );
    }

    if (activeStep === 2) {
      return (
        AADHAR_REGEX.test(documents.aadharNumber) &&
        PAN_REGEX.test(documents.panNumber) &&
        documents.accountHolderName.trim() &&
        documents.bankName.trim() &&
        ACCOUNT_REGEX.test(documents.accountNumber) &&
        IFSC_REGEX.test(documents.ifscCode.trim().toUpperCase()) &&
        documents.branchName.trim() &&
        (documents.aadharFront || documents.aadharFrontUrl) &&
        (documents.aadharBack || documents.aadharBackUrl) &&
        (documents.panImage || documents.panUrl)
      );
    }

    if (activeStep === 3) {
      return locationState.latitude !== '' && locationState.longitude !== '';
    }

    return false;
  }, [activeStep, basic, documents, locationState, professional]);

  const saveCurrentStep = async () => {
    setError('');
    setLoading(true);

    try {
      if (activeStep === 0) {
        await api.put('/providers/onboarding/basic', {
          ...basic,
          email: basic.email.trim(),
        });
      }

      if (activeStep === 1) {
        await api.put('/providers/onboarding/professional', {
          ...professional,
          emergencyContact: professional.emergencyContact.trim(),
          referralName: professional.referralName.trim(),
          vehicleDetails: {
            type: professional.vehicleDetails.type.trim(),
            model: professional.vehicleDetails.model.trim(),
            registrationNumber: professional.vehicleDetails.registrationNumber.trim().toUpperCase(),
          },
        });
      }

      if (activeStep === 2) {
        const formData = new FormData();
        formData.append('aadharNumber', documents.aadharNumber);
        formData.append('panNumber', documents.panNumber.trim().toUpperCase());
        formData.append('accountHolderName', documents.accountHolderName.trim());
        formData.append('bankName', documents.bankName.trim());
        formData.append('accountNumber', documents.accountNumber.trim());
        formData.append('ifscCode', documents.ifscCode.trim().toUpperCase());
        formData.append('branchName', documents.branchName.trim());

        if (documents.aadharFront) formData.append('aadharFront', documents.aadharFront);
        if (documents.aadharBack) formData.append('aadharBack', documents.aadharBack);
        if (documents.panImage) formData.append('panImage', documents.panImage);

        await api.put('/providers/onboarding/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (activeStep === 3) {
        await api.put('/providers/onboarding/location', {
          latitude: locationState.latitude,
          longitude: locationState.longitude,
        });
      }

      await refreshProfile();

      if (activeStep < steps.length - 1) {
        setActiveStep((prev) => prev + 1);
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save step');
    } finally {
      setLoading(false);
    }
  };

  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setError('');
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const { data } = await api.get('/providers/location/address', {
            params: { latitude, longitude },
          });

          setLocationState({
            latitude,
            longitude,
            addressText: data.address || 'Address not available',
          });
        } catch (_err) {
          setLocationState({
            latitude,
            longitude,
            addressText: 'Address not available',
          });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Unable to fetch location. Please allow location permission.');
        setLoading(false);
      }
    );
  };

  const updateDocumentImage = (key, file, previewKey) => {
    setDocuments((prev) => ({
      ...prev,
      [key]: file,
      [previewKey]: file ? getFilePreview(file, '') : prev[previewKey],
    }));
  };

  const StepIcon = stepIcons[activeStep].icon;
  const stepColor = stepIcons[activeStep].color;
  const completionPercent = Math.round(((activeStep + 1) / steps.length) * 100);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 2.5, md: 4 },
        px: 2,
        background:
          'radial-gradient(circle at 8% 12%, #e0f2fe 0, #e0f2fe 18%, transparent 18%), radial-gradient(circle at 88% 18%, #dcfce7 0, #dcfce7 16%, transparent 16%), linear-gradient(145deg, #f8fafc 0%, #f1f5f9 45%, #f0fdf4 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Fade in timeout={600}>
          <Stack spacing={2}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                boxShadow: '0 18px 46px rgba(15, 23, 42, 0.24)',
              }}
            >
              <CardContent sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 2.3, md: 3.2 } }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                  <Box>
                    <Typography sx={{ color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>
                      Provider Onboarding
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#f8fafc', fontWeight: 800, mt: 0.2 }}>
                      Complete Your Professional Profile
                    </Typography>
                    <Typography sx={{ color: '#cbd5e1', mt: 0.8, maxWidth: 720 }}>
                      Share your details to activate your service provider account and start receiving bookings.
                    </Typography>
                  </Box>
                  <Paper
                    elevation={0}
                    sx={{
                      px: 2,
                      py: 1.3,
                      borderRadius: 2,
                      alignSelf: { xs: 'flex-start', md: 'center' },
                      bgcolor: 'rgba(15, 118, 110, 0.22)',
                      border: '1px solid rgba(94, 234, 212, 0.35)',
                    }}
                  >
                    <Typography sx={{ color: '#99f6e4', fontWeight: 700, fontSize: 13 }}>Progress</Typography>
                    <Typography sx={{ color: '#f0fdfa', fontWeight: 800, fontSize: 20 }}>{completionPercent}%</Typography>
                  </Paper>
                </Stack>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.96)',
                border: '1px solid #dbe3ef',
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.09)',
              }}
            >
              <CardContent sx={{ p: { xs: 2.2, md: 3.5 } }}>
                <Stack spacing={3}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.4, gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2.2,
                        background: `linear-gradient(145deg, ${stepColor}, ${stepColor}BB)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 10px 24px ${stepColor}45`,
                      }}
                    >
                      <StepIcon sx={{ color: '#ffffff', fontSize: 27 }} />
                    </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {steps[activeStep]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Step {activeStep + 1} of {steps.length}
                        </Typography>
                      </Box>
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 1.4,
                        py: 0.8,
                        borderRadius: 2,
                        border: '1px solid #dbeafe',
                        bgcolor: '#eff6ff',
                      }}
                    >
                      <Typography sx={{ color: '#1d4ed8', fontWeight: 700, fontSize: 12 }}>
                        Profile Setup Wizard
                      </Typography>
                    </Paper>
                  </Box>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={(activeStep + 1) / steps.length * 100}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    background: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${stepColor} 0%, #0ea5e9 100%)`,
                    },
                  }}
                />

                <Stepper
                  activeStep={activeStep}
                  alternativeLabel
                  sx={{
                    pt: 1,
                    '& .MuiStepLabel-label': {
                      fontWeight: 700,
                      color: '#64748b',
                    },
                    '& .MuiStepLabel-label.Mui-active': {
                      color: '#0f172a',
                    },
                  }}
                >
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Divider />

                {error && (
                  <Fade in={!!error}>
                    <Alert
                      severity="error"
                      sx={{
                        borderRadius: 2.2,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {error}
                      </Typography>
                    </Alert>
                  </Fade>
                )}

                <Box
                  sx={{
                    '& .MuiTextField-root .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#ffffff',
                    },
                    '& .MuiFormLabel-root': {
                      fontWeight: 700,
                    },
                  }}
                >

                {activeStep === 0 && (
                  <Fade in={activeStep === 0}>
                    <Stack spacing={2.5}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <TextField
                          label="Mobile Number"
                          value={provider?.mobile || ''}
                          disabled
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon sx={{ color: stepColor, mr: 1 }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Paper>

                      <TextField
                        fullWidth
                        required
                        label="Full Name"
                        value={basic.name}
                        onChange={(e) => setBasic({ ...basic, name: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: stepColor, mr: 1 }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        required
                        label="Email Address"
                        type="email"
                        error={basic.email.length > 0 && !EMAIL_REGEX.test(basic.email.trim())}
                        helperText={basic.email.length > 0 && !EMAIL_REGEX.test(basic.email.trim()) ? 'Enter a valid email address' : ''}
                        value={basic.email}
                        onChange={(e) => setBasic({ ...basic, email: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: stepColor, mr: 1 }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        required
                        label="Date of Birth"
                        type="date"
                        value={basic.dob}
                        onChange={(e) => setBasic({ ...basic, dob: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />

                      <FormControl required>
                        <FormLabel sx={{ fontWeight: 700, mb: 1.5, color: '#1f2937' }}>Gender</FormLabel>
                        <RadioGroup
                          row
                          value={basic.gender}
                          onChange={(e) => setBasic({ ...basic, gender: e.target.value })}
                          sx={{ gap: 2 }}
                        >
                          <FormControlLabel value="MALE" control={<Radio />} label="Male" />
                          <FormControlLabel value="FEMALE" control={<Radio />} label="Female" />
                          <FormControlLabel value="OTHER" control={<Radio />} label="Other" />
                        </RadioGroup>
                      </FormControl>
                    </Stack>
                  </Fade>
                )}

                {activeStep === 1 && (
                  <Fade in={activeStep === 1}>
                    <Stack spacing={2.5}>
                      <FormControl required>
                        <FormLabel sx={{ fontWeight: 700, mb: 1.5, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <SchoolIcon sx={{ fontSize: 18 }} /> Areas of Expertise
                        </FormLabel>

                        {servicesLoading ? (
                          <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : (
                          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                            {serviceOptions.map((option) => (
                              <Paper
                                key={option.value}
                                elevation={0}
                                sx={{
                                  p: 1.1,
                                  border: '1px solid #dbe3ef',
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    borderColor: '#93c5fd',
                                    boxShadow: '0 8px 18px rgba(59, 130, 246, 0.08)',
                                  },
                                  ...(professional.expertise.includes(option.value) && {
                                    borderColor: stepColor,
                                    background: `${stepColor}14`,
                                  }),
                                }}
                                onClick={() => {
                                  if (professional.expertise.includes(option.value)) {
                                    setProfessional((prev) => ({
                                      ...prev,
                                      expertise: prev.expertise.filter((item) => item !== option.value),
                                    }));
                                  } else {
                                    setProfessional((prev) => ({ ...prev, expertise: [...prev.expertise, option.value] }));
                                  }
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Checkbox checked={professional.expertise.includes(option.value)} onChange={() => {}} sx={{ p: 0 }} />
                                  <Typography sx={{ fontWeight: 600 }}>{option.label}</Typography>
                                </Box>
                              </Paper>
                            ))}
                          </Stack>
                        )}
                      </FormControl>

                      <FormControl required>
                        <FormLabel sx={{ fontWeight: 700, mb: 1.5, color: '#1f2937' }}>Work Experience</FormLabel>
                        <RadioGroup
                          value={professional.experience}
                          onChange={(e) => setProfessional({ ...professional, experience: e.target.value })}
                        >
                          <FormControlLabel value="MORE_THAN_1_YEAR" control={<Radio />} label="More than 1 Year" />
                          <FormControlLabel value="SIX_TO_TWELVE_MONTHS" control={<Radio />} label="6–12 Months" />
                          <FormControlLabel value="LESS_THAN_6_MONTHS" control={<Radio />} label="Less than 6 Months" />
                          <FormControlLabel value="NO_EXPERIENCE" control={<Radio />} label="No Experience" />
                        </RadioGroup>
                      </FormControl>

                      <FormControl required>
                        <FormLabel sx={{ fontWeight: 700, mb: 1.5, color: '#1f2937' }}>Marital Status</FormLabel>
                        <RadioGroup
                          row
                          value={professional.maritalStatus}
                          onChange={(e) => setProfessional({ ...professional, maritalStatus: e.target.value })}
                        >
                          <FormControlLabel value="MARRIED" control={<Radio />} label="Married" />
                          <FormControlLabel value="UNMARRIED" control={<Radio />} label="Unmarried" />
                        </RadioGroup>
                      </FormControl>

                      <TextField
                        fullWidth
                        required
                        label="Emergency Contact Number"
                        value={professional.emergencyContact}
                        error={professional.emergencyContact.length > 0 && !PHONE_REGEX.test(professional.emergencyContact)}
                        helperText={professional.emergencyContact.length > 0 && !PHONE_REGEX.test(professional.emergencyContact) ? 'Enter valid 10-digit number starting with 6-9' : ''}
                        onChange={(e) =>
                          setProfessional({
                            ...professional,
                            emergencyContact: e.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon sx={{ color: stepColor, mr: 1 }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        required
                        label="Referral Name"
                        value={professional.referralName}
                        onChange={(e) => setProfessional({ ...professional, referralName: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: stepColor, mr: 1 }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <FormControl required>
                        <FormLabel sx={{ fontWeight: 700, mb: 1.5, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <CarIcon sx={{ fontSize: 18 }} /> Do you have your own vehicle?
                        </FormLabel>
                        <RadioGroup
                          row
                          value={professional.hasVehicle ? 'YES' : 'NO'}
                          onChange={(e) => {
                            const hasVehicle = e.target.value === 'YES';
                            setProfessional((prev) => ({
                              ...prev,
                              hasVehicle,
                              vehicleDetails: hasVehicle
                                ? prev.vehicleDetails
                                : { type: '', model: '', registrationNumber: '' },
                            }));
                          }}
                        >
                          <FormControlLabel value="YES" control={<Radio />} label="Yes" />
                          <FormControlLabel value="NO" control={<Radio />} label="No" />
                        </RadioGroup>
                      </FormControl>

                      {professional.hasVehicle && (
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #dbe3ef', bgcolor: '#f8fafc' }}>
                          <Stack spacing={2}>
                            <Typography sx={{ fontWeight: 700, color: '#1f2937' }}>Vehicle Details</Typography>
                            <TextField
                              required
                              label="Vehicle Type"
                              value={professional.vehicleDetails.type}
                              onChange={(e) =>
                                setProfessional((prev) => ({
                                  ...prev,
                                  vehicleDetails: { ...prev.vehicleDetails, type: e.target.value },
                                }))
                              }
                            />
                            <TextField
                              required
                              label="Vehicle Model"
                              value={professional.vehicleDetails.model}
                              onChange={(e) =>
                                setProfessional((prev) => ({
                                  ...prev,
                                  vehicleDetails: { ...prev.vehicleDetails, model: e.target.value },
                                }))
                              }
                            />
                            <TextField
                              required
                              label="Vehicle Registration Number"
                              value={professional.vehicleDetails.registrationNumber}
                              onChange={(e) =>
                                setProfessional((prev) => ({
                                  ...prev,
                                  vehicleDetails: {
                                    ...prev.vehicleDetails,
                                    registrationNumber: e.target.value.toUpperCase(),
                                  },
                                }))
                              }
                            />
                          </Stack>
                        </Paper>
                      )}
                    </Stack>
                  </Fade>
                )}

                {activeStep === 2 && (
                  <Fade in={activeStep === 2}>
                    <Stack spacing={2.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <DocumentIcon sx={{ color: stepColor }} /> Aadhaar & PAN
                      </Typography>

                      <TextField
                        fullWidth
                        required
                        label="Aadhaar Number"
                        value={documents.aadharNumber}
                        error={documents.aadharNumber.length > 0 && !AADHAR_REGEX.test(documents.aadharNumber)}
                        helperText={documents.aadharNumber.length > 0 && !AADHAR_REGEX.test(documents.aadharNumber) ? 'Use XXXX-XXXX-XXXX format' : 'Format: XXXX-XXXX-XXXX'}
                        onChange={(e) => setDocuments({ ...documents, aadharNumber: formatAadhar(e.target.value) })}
                      />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth sx={{ borderRadius: 2, py: 1.1 }}>
                            Upload Aadhaar Front
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => updateDocumentImage('aadharFront', e.target.files?.[0] || null, 'aadharFrontUrl')}
                            />
                          </Button>
                          {documents.aadharFrontUrl && (
                            <Box
                              component="img"
                              src={documents.aadharFrontUrl}
                              alt="Aadhaar Front Preview"
                              sx={{
                                mt: 1.2,
                                width: '100%',
                                height: 180,
                                objectFit: 'contain',
                                objectPosition: 'center',
                                borderRadius: 2,
                                border: '1px solid #cbd5e1',
                                bgcolor: '#f8fafc',
                                p: 0.6,
                              }}
                            />
                          )}
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth sx={{ borderRadius: 2, py: 1.1 }}>
                            Upload Aadhaar Back
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => updateDocumentImage('aadharBack', e.target.files?.[0] || null, 'aadharBackUrl')}
                            />
                          </Button>
                          {documents.aadharBackUrl && (
                            <Box
                              component="img"
                              src={documents.aadharBackUrl}
                              alt="Aadhaar Back Preview"
                              sx={{
                                mt: 1.2,
                                width: '100%',
                                height: 180,
                                objectFit: 'contain',
                                objectPosition: 'center',
                                borderRadius: 2,
                                border: '1px solid #cbd5e1',
                                bgcolor: '#f8fafc',
                                p: 0.6,
                              }}
                            />
                          )}
                        </Grid>
                      </Grid>

                      <TextField
                        fullWidth
                        required
                        label="PAN Number"
                        value={documents.panNumber}
                        error={documents.panNumber.length > 0 && !PAN_REGEX.test(documents.panNumber)}
                        helperText={documents.panNumber.length > 0 && !PAN_REGEX.test(documents.panNumber) ? 'Enter valid PAN (e.g. ABCDE1234F)' : ''}
                        onChange={(e) => setDocuments({ ...documents, panNumber: e.target.value.toUpperCase().slice(0, 10) })}
                      />

                      <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth sx={{ borderRadius: 2, py: 1.1 }}>
                        Upload PAN Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => updateDocumentImage('panImage', e.target.files?.[0] || null, 'panUrl')}
                        />
                      </Button>
                      {documents.panUrl && (
                        <Box
                          component="img"
                          src={documents.panUrl}
                          alt="PAN Preview"
                          sx={{
                            width: '100%',
                            height: 210,
                            objectFit: 'contain',
                            objectPosition: 'center',
                            borderRadius: 2,
                            border: '1px solid #cbd5e1',
                            bgcolor: '#f8fafc',
                            p: 0.7,
                          }}
                        />
                      )}

                      <Divider />

                      <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <BankIcon sx={{ color: stepColor }} /> Bank Details
                      </Typography>

                      <TextField
                        fullWidth
                        required
                        label="Account Holder Name"
                        value={documents.accountHolderName}
                        onChange={(e) => setDocuments({ ...documents, accountHolderName: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        required
                        label="Bank Name"
                        value={documents.bankName}
                        onChange={(e) => setDocuments({ ...documents, bankName: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        required
                        label="Account Number"
                        value={documents.accountNumber}
                        error={documents.accountNumber.length > 0 && !ACCOUNT_REGEX.test(documents.accountNumber)}
                        helperText={documents.accountNumber.length > 0 && !ACCOUNT_REGEX.test(documents.accountNumber) ? 'Enter valid account number (9-18 digits)' : ''}
                        onChange={(e) => setDocuments({ ...documents, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                      />
                      <TextField
                        fullWidth
                        required
                        label="IFSC Code"
                        value={documents.ifscCode}
                        error={documents.ifscCode.length > 0 && !IFSC_REGEX.test(documents.ifscCode.toUpperCase())}
                        helperText={documents.ifscCode.length > 0 && !IFSC_REGEX.test(documents.ifscCode.toUpperCase()) ? 'Enter valid IFSC code' : ''}
                        onChange={(e) => setDocuments({ ...documents, ifscCode: e.target.value.toUpperCase().slice(0, 11) })}
                      />
                      <TextField
                        fullWidth
                        required
                        label="Branch Name"
                        value={documents.branchName}
                        onChange={(e) => setDocuments({ ...documents, branchName: e.target.value })}
                      />
                    </Stack>
                  </Fade>
                )}

                {activeStep === 3 && (
                  <Fade in={activeStep === 3}>
                    <Stack spacing={2.5}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2.5 }}>
                        <Typography variant="body2" sx={{ color: '#1d4ed8', mb: 1, fontWeight: 600 }}>
                          Enable location permission to auto-fill coordinates and full address.
                        </Typography>
                      </Paper>

                      <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MyLocationIcon />}
                        onClick={getLiveLocation}
                        disabled={loading}
                        size="large"
                        sx={{
                          py: 1.5,
                          fontWeight: 700,
                          borderRadius: 2.5,
                          textTransform: 'none',
                          background: `linear-gradient(135deg, ${stepColor}, ${stepColor}99)`,
                        }}
                      >
                        {loading ? 'Fetching Location...' : 'Fetch My Location'}
                      </Button>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Latitude"
                            value={locationState.latitude}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Longitude"
                            value={locationState.longitude}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                      </Grid>

                      <TextField
                        fullWidth
                        label="Address (Text Format)"
                        value={locationState.addressText}
                        InputProps={{ readOnly: true }}
                        multiline
                        minRows={2}
                      />

                      {locationState.latitude && locationState.longitude && (
                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#ecfdf5', border: '1px solid #86efac', borderRadius: 2.5 }}>
                          <Typography sx={{ color: '#065f46', fontWeight: 600 }}>
                            Location captured in both coordinate and text format.
                          </Typography>
                        </Paper>
                      )}
                    </Stack>
                  </Fade>
                )}
                </Box>

                <Divider />

                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Button
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                    disabled={activeStep === 0 || loading}
                    onClick={() => setActiveStep((prev) => prev - 1)}
                    sx={{
                      px: 3,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '0.98em',
                      borderRadius: 1.8,
                      color: stepColor,
                      '&:hover': { background: `${stepColor}10` },
                    }}
                  >
                    Back
                  </Button>

                  <Button
                    variant="contained"
                    endIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : activeStep === steps.length - 1 ? (
                        <CheckCircleIcon />
                      ) : (
                        <ArrowForwardIcon />
                      )
                    }
                    disabled={!canContinue || loading}
                    onClick={saveCurrentStep}
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.2,
                      fontWeight: 800,
                      textTransform: 'none',
                      fontSize: '1em',
                      borderRadius: 2,
                      background: `linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%)`,
                      boxShadow: '0 10px 26px rgba(14, 116, 144, 0.3)',
                      '&:disabled': {
                        opacity: 0.5,
                      },
                    }}
                  >
                    {loading
                      ? activeStep === steps.length - 1
                        ? 'Submitting...'
                        : 'Saving...'
                      : activeStep === steps.length - 1
                      ? 'Submit Profile'
                      : 'Save and Continue'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          </Stack>
        </Fade>
      </Container>
    </Box>
  );
}
