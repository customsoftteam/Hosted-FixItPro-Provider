import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const statusColor = (status) => {
  if (status === 'VERIFIED') return 'success';
  if (status === 'UNDER_REVIEW') return 'warning';
  if (status === 'REJECTED') return 'error';
  return 'default';
};

const statusLabel = (status) => {
  if (status === 'VERIFIED') return 'Verified';
  if (status === 'UNDER_REVIEW') return 'Under Review';
  if (status === 'REJECTED') return 'Rejected';
  return 'Not Applied';
};

export default function SkillsPage() {
  const { provider, refreshProfile } = useAuth();

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [activeServiceId, setActiveServiceId] = useState('');
  const [checklistState, setChecklistState] = useState([]);
  const [documentFiles, setDocumentFiles] = useState({});
  const [serviceSubmitting, setServiceSubmitting] = useState(false);

  const [skills, setSkills] = useState(provider?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [skillsSaving, setSkillsSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchServices = async () => {
    setServicesLoading(true);
    try {
      const { data } = await api.get('/providers/services');
      setServices(Array.isArray(data?.services) ? data.services : []);
    } catch (_err) {
      setError('Unable to load services right now');
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    setSkills(provider?.skills || []);
  }, [provider]);

  const activeService = useMemo(
    () => services.find((item) => String(item._id) === String(activeServiceId)) || null,
    [services, activeServiceId]
  );

  const verifiedCount = useMemo(() => {
    return services.filter((item) => item?.providerSubmission?.status === 'VERIFIED').length;
  }, [services]);

  const allocatedExpertise = useMemo(() => {
    const expertise = Array.isArray(provider?.expertise) ? provider.expertise : [];
    const fallbackSkills = Array.isArray(provider?.skills) ? provider.skills : [];
    const merged = [...expertise, ...fallbackSkills]
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    return [...new Set(merged)];
  }, [provider?.expertise, provider?.skills]);

  const openServiceDialog = (service) => {
    const submission = service?.providerSubmission;
    const nextChecklist = (service?.checklist || []).map((item) => {
      const matched = (submission?.checklist || []).find(
        (entry) => normalizeName(entry?.item) === normalizeName(item)
      );
      return {
        item,
        satisfied: Boolean(matched?.satisfied),
        note: String(matched?.note || ''),
      };
    });

    setChecklistState(nextChecklist);
    setDocumentFiles({});
    setActiveServiceId(String(service?._id || ''));
    setError('');
    setMessage('');
  };

  const closeServiceDialog = () => {
    setActiveServiceId('');
    setChecklistState([]);
    setDocumentFiles({});
  };

  const setChecklistValue = (index, key, value) => {
    setChecklistState((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const setDocumentFile = (index, file) => {
    setDocumentFiles((prev) => ({
      ...prev,
      [index]: file || null,
    }));
  };

  const submitService = async () => {
    if (!activeService) return;

    const requiredChecklist = Array.isArray(activeService.checklist) ? activeService.checklist : [];
    const requiredDocuments = Array.isArray(activeService.requiredDocuments)
      ? activeService.requiredDocuments
      : [];

    const unsatisfied = checklistState.find(
      (item) => requiredChecklist.includes(item.item) && !item.satisfied
    );

    if (unsatisfied) {
      setError(`Please mark checklist item as satisfied: ${unsatisfied.item}`);
      return;
    }

    for (let i = 0; i < requiredDocuments.length; i += 1) {
      if (!documentFiles[i]) {
        setError(`Please upload required document: ${requiredDocuments[i]}`);
        return;
      }
    }

    try {
      setServiceSubmitting(true);
      setError('');
      setMessage('');

      const formData = new FormData();
      formData.append('checklist', JSON.stringify(checklistState));

      requiredDocuments.forEach((_docName, index) => {
        formData.append('documents', documentFiles[index]);
      });

      await api.post(`/providers/services/${activeService._id}/submit`, formData);
      await refreshProfile();
      await fetchServices();

      setMessage(`${activeService.name} submitted for admin verification`);
      closeServiceDialog();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit service for verification');
    } finally {
      setServiceSubmitting(false);
    }
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) {
      setError('Skill cannot be empty');
      return;
    }

    if (skills.some((item) => normalizeName(item) === normalizeName(value))) {
      setError('This skill already exists');
      return;
    }

    setSkills((prev) => [...prev, value]);
    setSkillInput('');
    setError('');
  };

  const removeSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((item) => item !== skillToRemove));
  };

  const skillsDirty = useMemo(() => {
    const a = [...(provider?.skills || [])].sort();
    const b = [...skills].sort();
    return JSON.stringify(a) !== JSON.stringify(b);
  }, [provider?.skills, skills]);

  const saveSkills = async () => {
    try {
      setSkillsSaving(true);
      setError('');
      setMessage('');

      await api.put('/providers/skills', { skills });
      await refreshProfile();

      setMessage('Skills updated successfully');
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update skills');
    } finally {
      setSkillsSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: 17, sm: 26 } }}>
            Services & Skills
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 0.2, fontSize: 17 }}>
            Apply for services, complete checklist, and upload required documents
          </Typography>
        </Box>
        <Chip
          label={`Verified Services: ${verifiedCount}`}
          color="success"
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {servicesLoading ? (
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ color: '#64748b' }}>
          <CircularProgress size={18} />
          <Typography>Loading services...</Typography>
        </Stack>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        }}
      >
        <Card
          sx={{
            gridColumn: '1 / -1',
            borderRadius: 2,
            border: '1px solid #d6dde6',
            boxShadow: 'none',
          }}
        >
          <CardContent sx={{ p: 1.8 }}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 18.5 }}>
              Allocated Expertise
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: 14.5, mt: 0.2 }}>
              Expertise assigned to this service provider profile
            </Typography>

            {allocatedExpertise.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.2, gap: 1 }}>
                {allocatedExpertise.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    size="small"
                    icon={<BuildOutlinedIcon />}
                    sx={{
                      bgcolor: '#e6f6f3',
                      color: '#0f766e',
                      border: '1px solid #b7e3db',
                      '& .MuiChip-label': {
                        fontWeight: 600,
                      },
                    }}
                  />
                ))}
              </Stack>
            ) : (
              <Typography sx={{ color: '#94a3b8', mt: 1.1 }}>
                No expertise has been allocated yet.
              </Typography>
            )}
          </CardContent>
        </Card>

        {services.map((service) => {
          const submission = service?.providerSubmission;
          const status = submission?.status || '';

          return (
            <Card
              key={service._id}
              sx={{
                borderRadius: 2,
                border: '1px solid #d6dde6',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 1.8 }}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: 21 }}>
                      {service.name}
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: 15, mt: 0.4 }}>
                      {service.description || 'No description available'}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                      <Chip
                        size="small"
                        label={statusLabel(status)}
                        color={statusColor(status)}
                      />
                      <Chip
                        size="small"
                        label={`Checklist: ${(service?.checklist || []).length}`}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`Docs: ${(service?.requiredDocuments || []).length}`}
                        variant="outlined"
                      />
                    </Stack>
                  </Box>

                  <Stack spacing={1} alignItems="flex-end">
                    <Button
                      variant={status === 'VERIFIED' ? 'contained' : 'outlined'}
                      disabled={status === 'UNDER_REVIEW' || status === 'VERIFIED'}
                      onClick={() => openServiceDialog(service)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      {status === 'VERIFIED'
                        ? 'Verified'
                        : status === 'UNDER_REVIEW'
                          ? 'Under Review'
                          : status === 'REJECTED'
                            ? 'Re-Submit'
                            : 'Apply'}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => openServiceDialog(service)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      View Details
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Dialog open={Boolean(activeService)} onClose={closeServiceDialog} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          {activeService?.name || 'Service'}
        </DialogTitle>
        <DialogContent dividers>
          {activeService ? (
            <Stack spacing={2}>
              <Typography sx={{ color: '#64748b' }}>
                {activeService.description || 'No description available'}
              </Typography>

              <Divider />

              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                  Admin Checklist
                </Typography>
                {checklistState.length ? (
                  <Stack spacing={1}>
                    {checklistState.map((item, index) => (
                      <Card key={`${item.item}-${index}`} variant="outlined">
                        <CardContent sx={{ p: 1.5 }}>
                          <FormControlLabel
                            control={(
                              <Checkbox
                                checked={Boolean(item.satisfied)}
                                onChange={(event) =>
                                  setChecklistValue(index, 'satisfied', event.target.checked)
                                }
                              />
                            )}
                            label={item.item}
                            sx={{ alignItems: 'flex-start', m: 0 }}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Note (optional)"
                            value={item.note}
                            onChange={(event) =>
                              setChecklistValue(index, 'note', event.target.value)
                            }
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={{ color: '#94a3b8' }}>
                    No checklist required for this service.
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                  Required Documents
                </Typography>
                {(activeService.requiredDocuments || []).length ? (
                  <Stack spacing={1.2}>
                    {activeService.requiredDocuments.map((docName, index) => {
                      const existingDoc = (activeService.providerSubmission?.documents || []).find(
                        (doc) => normalizeName(doc?.name) === normalizeName(docName)
                      );

                      return (
                        <Card key={`${docName}-${index}`} variant="outlined">
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography sx={{ fontWeight: 700 }}>{docName}</Typography>
                            {existingDoc?.url ? (
                              <Link
                                href={existingDoc.url}
                                target="_blank"
                                rel="noreferrer"
                                underline="hover"
                                sx={{ display: 'inline-block', mt: 0.5 }}
                              >
                                Previously uploaded file
                              </Link>
                            ) : null}
                            <Button
                              component="label"
                              variant="outlined"
                              size="small"
                              startIcon={<UploadFileOutlinedIcon />}
                              sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
                            >
                              {documentFiles[index]?.name || 'Upload Document'}
                              <input
                                type="file"
                                hidden
                                accept="image/*,application/pdf"
                                onChange={(event) => setDocumentFile(index, event.target.files?.[0])}
                              />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography sx={{ color: '#94a3b8' }}>
                    No documents required for this service.
                  </Typography>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.2 }}>
          <Button onClick={closeServiceDialog} sx={{ textTransform: 'none' }}>Close</Button>
          <Button
            variant="contained"
            onClick={submitService}
            disabled={serviceSubmitting || activeService?.providerSubmission?.status === 'VERIFIED'}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {serviceSubmitting ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </DialogActions>
      </Dialog>

      <Divider />

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: 18, sm: 24 } }}>
            Custom Skills
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 0.2, fontSize: 17 }}>
            Add specific skills for better matching
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={skillsSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={saveSkills}
          disabled={skillsSaving || !skillsDirty}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 1.8,
            px: 3,
            py: 1.1,
            bgcolor: '#14967f',
            '&:hover': { bgcolor: '#117d6a' },
          }}
        >
          {skillsSaving ? 'Saving...' : 'Save Skills'}
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ xs: 'stretch', md: 'center' }}>
        <TextField
          fullWidth
          placeholder="e.g., PCB Repair, Thermostat Replacement"
          value={skillInput}
          onChange={(event) => {
            setSkillInput(event.target.value);
            if (error) setError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addSkill();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.8,
              bgcolor: '#ffffff',
            },
            '& .MuiInputBase-input': {
              fontSize: 17,
              py: 1.6,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BuildOutlinedIcon sx={{ color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          onClick={addSkill}
          startIcon={<AddIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 1.8,
            px: 3,
            py: 1.2,
            minWidth: 120,
            bgcolor: '#14967f',
            '&:hover': { bgcolor: '#117d6a' },
          }}
        >
          Add
        </Button>
      </Stack>

      <Stack direction="row" spacing={1.1} flexWrap="wrap" sx={{ gap: 1.1 }}>
        {skills.map((skill) => (
          <Chip
            key={skill}
            label={skill}
            onDelete={() => removeSkill(skill)}
            icon={<BuildOutlinedIcon />}
            sx={{
              bgcolor: '#d7ece9',
              color: '#0f766e',
              border: '1px solid #a4d6ce',
              borderRadius: 1.6,
              px: 1,
              py: 2.2,
              '& .MuiChip-label': {
                fontSize: 18,
                fontWeight: 600,
              },
              '& .MuiChip-deleteIcon': {
                color: '#0f766e',
              },
            }}
          />
        ))}
      </Stack>

      {skills.length === 0 ? (
        <Typography sx={{ color: '#94a3b8', fontSize: 15 }}>
          No custom skills added yet.
        </Typography>
      ) : null}
    </Stack>
  );
}
