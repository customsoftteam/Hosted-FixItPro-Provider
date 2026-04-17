import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  SaveOutlined as SaveIcon,
  StarBorderRounded as StarIcon,
  WorkOutlineRounded as WorkIcon,
  CheckCircleOutlineRounded as CheckCircleIcon,
  CurrencyRupeeRounded as RupeeIcon,
  PersonOutlineRounded as PersonIcon,
  LocationOnOutlined as LocationIcon,
  DescriptionOutlined as DocumentIcon,
  VerifiedUserOutlined as VerifiedIcon,
  CameraAltOutlined as CameraIcon,
  AccountBalanceOutlined as BankIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'MORE_THAN_1_YEAR', label: 'More than 1 year' },
  { value: 'SIX_TO_TWELVE_MONTHS', label: '6 to 12 months' },
  { value: 'LESS_THAN_6_MONTHS', label: 'Less than 6 months' },
  { value: 'NO_EXPERIENCE', label: 'No experience' },
];

const MARITAL_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'UNMARRIED', label: 'Unmarried' },
];

const getExperienceLabel = (value) =>
  EXPERIENCE_OPTIONS.find((item) => item.value === value)?.label || 'Not specified';

const getShortAddress = (locationAddress) => {
  if (!locationAddress || locationAddress === 'Location not set') {
    return 'Location not set';
  }
  const parts = locationAddress.split(',').map((item) => item.trim());
  return parts.slice(0, 2).join(', ');
};

export default function ProfilePage() {
  const { provider, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef('');

  const [personalEdit, setPersonalEdit] = useState(false);
  const [professionalEdit, setProfessionalEdit] = useState(false);

  const [locationAddress, setLocationAddress] = useState('Loading location...');

  const [personalForm, setPersonalForm] = useState({
    name: provider?.name || '',
    email: provider?.email || '',
    mobile: provider?.mobile || '',
    emergencyContact: provider?.emergencyContact || '',
  });

  const [professionalForm, setProfessionalForm] = useState({
    experience: provider?.experience || '',
    maritalStatus: provider?.maritalStatus || '',
    referralName: provider?.referralName || '',
    hasVehicle: Boolean(provider?.hasVehicle),
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState('');

  useEffect(() => {
    setPersonalForm({
      name: provider?.name || '',
      email: provider?.email || '',
      mobile: provider?.mobile || '',
      emergencyContact: provider?.emergencyContact || '',
    });

    setProfessionalForm({
      experience: provider?.experience || '',
      maritalStatus: provider?.maritalStatus || '',
      referralName: provider?.referralName || '',
      hasVehicle: Boolean(provider?.hasVehicle),
    });
  }, [provider]);

  const fetchAddress = async () => {
    if (!provider?.location?.latitude || !provider?.location?.longitude) {
      setLocationAddress('Location not set');
      return;
    }

    try {
      const response = await api.get('/providers/location/address', {
        params: {
          latitude: provider.location.latitude,
          longitude: provider.location.longitude,
        },
      });

      setLocationAddress(response.data.address || 'Address not available');
    } catch (_err) {
      setLocationAddress('Location coordinates available but address could not be retrieved');
    }
  };

  useEffect(() => {
    fetchAddress();
  }, [provider?.location?.latitude, provider?.location?.longitude]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }
    };
  }, []);

  const handleProfileImagePick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must be less than 2MB');
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setProfileImagePreview(previewUrl);

    try {
      setError('');
      setMessage('');

      const formData = new FormData();
      formData.append('profileImage', file);

      await api.put('/providers/profile/image', formData);
      await refreshProfile();

      setProfileImagePreview('');
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }

      setMessage('Profile picture updated successfully');
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      event.target.value = '';
    }
  };

  const handleSavePersonal = async () => {
    try {
      setError('');
      setMessage('');

      await api.put('/providers/me', {
        name: personalForm.name.trim(),
        email: personalForm.email.trim(),
        emergencyContact: personalForm.emergencyContact.trim(),
      });

      await refreshProfile();
      setPersonalEdit(false);
      setMessage('Personal information updated successfully');
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update personal information');
    }
  };

  const handleSaveProfessional = async () => {
    try {
      setError('');
      setMessage('');

      await api.put('/providers/me', {
        experience: professionalForm.experience,
        maritalStatus: professionalForm.maritalStatus,
        referralName: professionalForm.referralName.trim(),
        hasVehicle: professionalForm.hasVehicle,
      });

      await refreshProfile();
      setProfessionalEdit(false);
      setMessage('Professional information updated successfully');
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update professional information');
    }
  };

  const initials = (provider?.name || 'SP')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const profileImageUrl = profileImagePreview || provider?.profileImage || '';

  const shortLocation = useMemo(() => getShortAddress(locationAddress), [locationAddress]);

  const documents = provider?.documents || {};
  const documentItems = [
    { title: 'Aadhaar Front', url: documents.aadharFrontUrl },
    { title: 'Aadhaar Back', url: documents.aadharBackUrl },
    { title: 'PAN Card', url: documents.panUrl },
  ];

  const uploadedCount = documentItems.filter((item) => Boolean(item.url)).length;

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: '#f8fafc',
      '& fieldset': {
        borderColor: '#e6edf5',
      },
    },
    '& .MuiInputBase-input': {
      fontSize: 17,
    },
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontSize: { xs: 18, md: 26 }, fontWeight: 800, color: '#0f172a' }}>Profile</Typography>
        <Typography sx={{ color: '#64748b', mt: 0.2, fontSize: 17 }}>Manage your provider profile</Typography>
      </Box>

      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card sx={{ borderRadius: 3.2, border: '1px solid #d6dee8', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}>
        <Box
          sx={{
            p: { xs: 2.2, md: 3 },
            borderRadius: '14px 14px 0 0',
            background:
              'radial-gradient(circle at 76% 38%, rgba(16, 185, 129, 0.26) 0%, rgba(16, 185, 129, 0) 45%), linear-gradient(135deg, #101b35 0%, #1a2f56 50%, #1d4e4a 100%)',
            minHeight: 148,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Chip
            icon={<VerifiedIcon sx={{ fontSize: 20 }} />}
            label={provider?.status === 'ACTIVE' ? 'Verified' : 'Pending Verification'}
            sx={{
              bgcolor: 'rgba(226, 232, 240, 0.2)',
              color: '#f8fafc',
              fontWeight: 700,
            }}
          />
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 2.5 }, pt: 0 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2.2}>
            <Box sx={{ mt: -6, position: 'relative' }}>
              <Box
                onClick={handleProfileImagePick}
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: 3,
                  border: '6px solid #f8fafc',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  bgcolor: '#12b5a4',
                  color: '#e6fffb',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: 21,
                }}
              >
                {profileImageUrl ? (
                  <Box
                    component="img"
                    src={profileImageUrl}
                    alt="Profile"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  initials
                )}
              </Box>
              <Box
                onClick={handleProfileImagePick}
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  border: '1px solid #d1d5db',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                <CameraIcon sx={{ fontSize: 18 }} />
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                style={{ display: 'none' }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: { xs: 21, md: 25 }, fontWeight: 800, color: '#0f172a' }}>
                {provider?.name || 'Service Provider'}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: 17 }}>{shortLocation}</Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              mt: 2.2,
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
            }}
          >
            {[
              { icon: <StarIcon sx={{ color: '#0f8f7b' }} />, value: 'N/A', label: 'Reviews' },
              { icon: <WorkIcon sx={{ color: '#0f8f7b' }} />, value: getExperienceLabel(provider?.experience), label: 'Experience' },
              { icon: <CheckCircleIcon sx={{ color: '#0f8f7b' }} />, value: provider?.onboardingCompleted ? '100%' : '70%', label: 'Profile completion' },
              { icon: <RupeeIcon sx={{ color: '#0f8f7b' }} />, value: provider?.status || 'INACTIVE', label: 'Account status' },
            ].map((item) => (
              <Box
                key={`${item.label}-${item.value}`}
                sx={{
                  borderRadius: 2.2,
                  bgcolor: '#f4f6f9',
                  border: '1px solid #e5e7eb',
                  px: 2,
                  py: 1.6,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ mb: 0.4 }}>{item.icon}</Box>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 19 }}>{item.value}</Typography>
                <Typography sx={{ color: '#64748b', fontSize: 15 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ borderRadius: 3.2, border: '1px solid #d6dee8', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <BankIcon sx={{ color: '#0f8f7b' }} />
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 18.5 }}>Bank Details</Typography>
          </Stack>

          {provider?.bankDetails ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography sx={{ color: '#475569', mb: 0.8, fontSize: 14, fontWeight: 600 }}>Account Holder Name</Typography>
                <TextField
                  fullWidth
                  value={provider.bankDetails.accountHolderName || ''}
                  disabled
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ color: '#475569', mb: 0.8, fontSize: 14, fontWeight: 600 }}>Bank Name</Typography>
                <TextField
                  fullWidth
                  value={provider.bankDetails.bankName || ''}
                  disabled
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ color: '#475569', mb: 0.8, fontSize: 14, fontWeight: 600 }}>Account Number</Typography>
                <TextField
                  fullWidth
                  value={provider.bankDetails.accountNumber || ''}
                  disabled
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ color: '#475569', mb: 0.8, fontSize: 14, fontWeight: 600 }}>IFSC Code</Typography>
                <TextField
                  fullWidth
                  value={provider.bankDetails.ifscCode || ''}
                  disabled
                  sx={inputSx}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ color: '#475569', mb: 0.8, fontSize: 14, fontWeight: 600 }}>Branch Name</Typography>
                <TextField
                  fullWidth
                  value={provider.bankDetails.branchName || ''}
                  disabled
                  sx={inputSx}
                />
              </Grid>
            </Grid>
          ) : (
            <Typography sx={{ color: '#94a3b8' }}>Bank details not added yet</Typography>
          )}
        </CardContent>
      </Card>


      <Card sx={{ borderRadius: 3.2, border: '1px solid #d6dee8', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonIcon sx={{ color: '#0f8f7b' }} />
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 18.5 }}>Personal Information</Typography>
            </Stack>
            <Button
              variant="text"
              startIcon={<EditIcon />}
              onClick={() => (personalEdit ? handleSavePersonal() : setPersonalEdit(true))}
              sx={{ color: '#0f172a', textTransform: 'none', fontWeight: 700 }}
            >
              {personalEdit ? 'Save' : 'Edit'}
            </Button>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ color: '#475569', mb: 0.8 }}>Full Name</Typography>
              <TextField
                fullWidth
                value={personalForm.name}
                disabled={!personalEdit}
                onChange={(e) => setPersonalForm((prev) => ({ ...prev, name: e.target.value }))}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ color: '#475569', mb: 0.8 }}>Phone</Typography>
              <TextField fullWidth value={personalForm.mobile} disabled sx={inputSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ color: '#475569', mb: 0.8 }}>Email</Typography>
              <TextField
                fullWidth
                value={personalForm.email}
                disabled={!personalEdit}
                onChange={(e) => setPersonalForm((prev) => ({ ...prev, email: e.target.value }))}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ color: '#475569', mb: 0.8 }}>Emergency Contact</Typography>
              <TextField
                fullWidth
                value={personalForm.emergencyContact}
                disabled={!personalEdit}
                onChange={(e) =>
                  setPersonalForm((prev) => ({
                    ...prev,
                    emergencyContact: e.target.value.replace(/\D/g, '').slice(0, 10),
                  }))
                }
                sx={inputSx}
              />
            </Grid>
          </Grid>

          {personalEdit ? (
            <Stack direction="row" justifyContent="flex-end" spacing={1.2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => setPersonalEdit(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePersonal}
                sx={{ textTransform: 'none', borderRadius: 2, background: 'linear-gradient(135deg, #148f7d 0%, #1fb59a 100%)' }}
              >
                Save Changes
              </Button>
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3.2, border: '1px solid #d6dee8', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <WorkIcon sx={{ color: '#0f8f7b' }} />
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 18.5 }}>Professional Information</Typography>
            </Stack>
            <Button
              variant="text"
              startIcon={<EditIcon />}
              onClick={() => (professionalEdit ? handleSaveProfessional() : setProfessionalEdit(true))}
              sx={{ color: '#0f172a', textTransform: 'none', fontWeight: 700 }}
            >
              {professionalEdit ? 'Save' : 'Edit'}
            </Button>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ color: '#475569', mb: 0.8 }}>Experience</Typography>
              <FormControl fullWidth disabled={!professionalEdit}>
                <Select
                  value={professionalForm.experience}
                  onChange={(e) => setProfessionalForm((prev) => ({ ...prev, experience: e.target.value }))}
                  displayEmpty
                  sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}
                >
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ color: '#475569', mb: 0.8 }}>Marital Status</Typography>
              <FormControl fullWidth disabled={!professionalEdit}>
                <Select
                  value={professionalForm.maritalStatus}
                  onChange={(e) => setProfessionalForm((prev) => ({ ...prev, maritalStatus: e.target.value }))}
                  displayEmpty
                  sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}
                >
                  {MARITAL_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ color: '#475569', mb: 0.8 }}>Referral Name</Typography>
              <TextField
                fullWidth
                value={professionalForm.referralName}
                disabled={!professionalEdit}
                onChange={(e) => setProfessionalForm((prev) => ({ ...prev, referralName: e.target.value }))}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ color: '#475569', mb: 0.8 }}>Own Vehicle</Typography>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  borderRadius: 2,
                  px: 1.6,
                  py: 0.9,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e6edf5',
                  minHeight: 56,
                }}
              >
                <Typography sx={{ color: '#334155', fontWeight: 600 }}>
                  {professionalForm.hasVehicle ? 'Yes' : 'No'}
                </Typography>
                <Switch
                  checked={professionalForm.hasVehicle}
                  disabled={!professionalEdit}
                  onChange={(e) => setProfessionalForm((prev) => ({ ...prev, hasVehicle: e.target.checked }))}
                />
              </Stack>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 2,
              p: 1.8,
              borderRadius: 2.2,
              border: '1px solid #e6edf5',
              bgcolor: '#f8fafc',
            }}
          >
            <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 1.2, fontSize: 16.5 }}>
              Vehicle Details
            </Typography>

            {provider?.hasVehicle ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography sx={{ color: '#475569', mb: 0.6 }}>Vehicle Type</Typography>
                  <TextField
                    fullWidth
                    value={provider?.vehicleDetails?.type || 'Not specified'}
                    disabled
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography sx={{ color: '#475569', mb: 0.6 }}>Vehicle Model</Typography>
                  <TextField
                    fullWidth
                    value={provider?.vehicleDetails?.model || 'Not specified'}
                    disabled
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography sx={{ color: '#475569', mb: 0.6 }}>Registration Number</Typography>
                  <TextField
                    fullWidth
                    value={provider?.vehicleDetails?.registrationNumber || 'Not specified'}
                    disabled
                    sx={inputSx}
                  />
                </Grid>
              </Grid>
            ) : (
              <Typography sx={{ color: '#64748b', fontSize: 14.5 }}>
                No vehicle added for this provider.
              </Typography>
            )}
          </Box>

          {professionalEdit ? (
            <Stack direction="row" justifyContent="flex-end" spacing={1.2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => setProfessionalEdit(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProfessional}
                sx={{ textTransform: 'none', borderRadius: 2, background: 'linear-gradient(135deg, #148f7d 0%, #1fb59a 100%)' }}
              >
                Save Professional Info
              </Button>
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3.2, border: '1px solid #d6dee8', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationIcon sx={{ color: '#0f8f7b' }} />
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 18.5 }}>Service Area</Typography>
            </Stack>
            <Button
              variant="text"
              startIcon={<LocationIcon />}
              onClick={fetchAddress}
              sx={{ color: '#0f172a', textTransform: 'none', fontWeight: 700 }}
            >
              Refresh
            </Button>
          </Stack>

          <Typography sx={{ color: '#475569', mb: 0.8 }}>Location</Typography>
          <TextField fullWidth value={shortLocation} disabled sx={inputSx} />
          {provider?.location?.latitude && provider?.location?.longitude ? (
            <Typography sx={{ color: '#64748b', mt: 1, fontSize: 14 }}>
              Coordinates: {provider.location.latitude.toFixed(4)}, {provider.location.longitude.toFixed(4)}
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3.2, border: '1px solid #d6dee8', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <DocumentIcon sx={{ color: '#0f8f7b' }} />
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 18.5 }}>Documents</Typography>
            </Stack>
            <Chip
              label={`${uploadedCount}/${documentItems.length} Uploaded`}
              sx={{ bgcolor: '#eaf8f3', color: '#0f8f7b', fontWeight: 700 }}
            />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 1.6,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            {documentItems.map((item) => (
              <Box
                key={item.title}
                sx={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: 2.2,
                  px: 2.2,
                  py: 1.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.4,
                  bgcolor: '#ffffff',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: 18 }}>{item.title}</Typography>
                  <Typography sx={{ fontSize: 14.5, color: item.url ? '#1f9d62' : '#94a3b8' }}>
                    {item.url ? 'Uploaded' : 'Not uploaded'}
                  </Typography>
                </Box>
                {item.url ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                    sx={{ textTransform: 'none' }}
                  >
                    View
                  </Button>
                ) : null}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
