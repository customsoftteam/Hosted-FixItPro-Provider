import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

const faqs = [
  {
    q: 'How do I start a booking workflow?',
    a: 'Go to Bookings, accept an assigned booking, click Reached Location, then click Start Service and continue all steps till OTP verification.',
  },
  {
    q: 'Why is my account showing INACTIVE?',
    a: 'Your onboarding is submitted, but document verification is pending from admin side.',
  },
  {
    q: 'How do notifications work?',
    a: 'Notifications appear in real-time from the bell icon and also in the Notifications page history.',
  },
];

export default function HelpPage() {
  return (
    <Stack spacing={2.2}>
      <Box>
        <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800 }}>Help</Typography>
        <Typography sx={{ color: '#64748b' }}>Quick answers for common provider issues</Typography>
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid #d6dee8', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
            <HelpOutlineOutlinedIcon sx={{ color: '#0f8f7b' }} />
            <Typography sx={{ fontWeight: 800, fontSize: 19, color: '#0f172a' }}>FAQs</Typography>
          </Stack>

          {faqs.map((item) => (
            <Accordion key={item.q} disableGutters elevation={0} sx={{ borderBottom: '1px solid #e2e8f0' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>{item.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: '#475569' }}>{item.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </Stack>
  );
}
