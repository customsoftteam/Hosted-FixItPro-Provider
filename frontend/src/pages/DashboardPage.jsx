import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getEarningsOverview,
  getEarningsTrend,
  getRevenueByService,
  getRevenueByLocation,
  getTransactionHistory,
} from '../services/earningsApi';

const numberFmt = new Intl.NumberFormat('en-IN');
const rupee = (value) => `₹${numberFmt.format(value)}`;

const periodTabs = ['This Week', 'This Month', 'This Quarter'];
const periodMap = { 'This Week': 'week', 'This Month': 'month', 'This Quarter': 'quarter' };

const cardSx = {
  borderRadius: 2.8,
  border: '1px solid #d7dde6',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
  height: '100%',
};

function MetricCard({ item, loading }) {
  return (
    <Card sx={{ ...cardSx, boxShadow: '0 2px 10px rgba(16, 24, 40, 0.04)' }}>
      <CardContent sx={{ p: { xs: 1.6, sm: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.2 }}>
          <Typography sx={{ fontSize: 13, sm: 14, color: '#6f7783', lineHeight: 1.2 }}>{item.title}</Typography>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: item.iconBg,
              color: item.iconColor,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {item.icon}
          </Box>
        </Stack>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <Typography sx={{ fontSize: { xs: 26, sm: 30 }, lineHeight: 1, fontWeight: 700, color: '#1d2939' }}>
              {item.value}
            </Typography>
            <Typography sx={{ mt: 0.6, fontSize: 13, fontWeight: 600, color: item.deltaColor }}>{item.delta}</Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Panel({ title, subtitle, right, icon, children }) {
  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: { xs: 1.25, sm: 1.6, md: 1.8 }, '&:last-child': { pb: { xs: 1.25, sm: 1.6, md: 1.8 } } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={0.6}
          sx={{ mb: 1.2 }}
        >
          <Box>
            <Stack direction="row" spacing={0.9} alignItems="center">
              {icon ? icon : null}
              <Typography sx={{ fontWeight: 700, fontSize: { xs: 18, sm: 20, md: 22 }, color: '#111827', lineHeight: 1.2 }}>
                {title}
              </Typography>
            </Stack>
            {subtitle ? <Typography sx={{ color: '#6b7280', mt: 0.1, fontSize: { xs: 12, sm: 13 } }}>{subtitle}</Typography> : null}
          </Box>
          {right}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }) {
  const isPaid = status === 'paid';
  return (
    <Chip
      size="small"
      label={status}
      sx={{
        textTransform: 'lowercase',
        borderRadius: 2,
        bgcolor: isPaid ? '#e6f7ee' : '#fff4df',
        color: isPaid ? '#198754' : '#af7a17',
        fontWeight: 600,
      }}
    />
  );
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [kpiData, setKpiData] = useState({
    totalBookings: 0,
    completed: 0,
    cancelled: 0,
    totalEarnings: 0,
    todayEarnings: 0,
  });
  const [earningsTrendData, setEarningsTrendData] = useState([]);
  const [bookingStatusData, setBookingStatusData] = useState([]);
  const [serviceRevenueData, setServiceRevenueData] = useState([]);
  const [locationRevenueData, setLocationRevenueData] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch earnings overview
        const overviewData = await getEarningsOverview();
        setKpiData({
          totalBookings:
            overviewData.bookingStats.completed +
            overviewData.bookingStats.cancelled +
            overviewData.bookingStats.rejected,
          completed: overviewData.bookingStats.completed,
          cancelled: overviewData.bookingStats.cancelled,
          totalEarnings: overviewData.earnings.total,
          todayEarnings: overviewData.earnings.today,
        });

        // Fetch earnings trend
        const trendData = await getEarningsTrend(periodMap[selectedPeriod]);
        const formattedTrend = trendData.trend.map((item) => ({
          date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          value: item.earnings,
          bookings: item.bookings,
        }));
        setEarningsTrendData(formattedTrend);

        // Format booking status
        setBookingStatusData([
          { name: 'Completed', value: overviewData.bookingStats.completed, fill: '#1f8a4d' },
          { name: 'Pending', value: overviewData.bookingStats.pending, fill: '#f0ad29' },
          { name: 'Cancelled', value: overviewData.bookingStats.cancelled, fill: '#d9534f' },
          { name: 'Rejected', value: overviewData.bookingStats.rejected, fill: '#999' },
        ]);

        // Fetch service analytics
        const serviceData = await getRevenueByService();
        const formattedServices = (serviceData.serviceRevenue || []).slice(0, 4).map((item) => ({
          service: item.service || 'Unknown',
          bookings: item.bookings,
          revenue: item.totalRevenue,
          rating:
            item.avgRating > 0 ? parseFloat(item.avgRating.toFixed(1)) : 4.5,
        }));
        setServiceRevenueData(formattedServices);

        // Fetch location analytics
        const locationData = await getRevenueByLocation();
        const formattedLocations = (locationData.locationRevenue || []).map((item) => ({
          area: item.location || 'Unknown',
          bookings: item.bookings,
          revenue: item.totalRevenue,
        }));
        setLocationRevenueData(formattedLocations);

        // Fetch transaction history
        const txData = await getTransactionHistory(1, 10);
        const formattedTx = (txData.transactions || []).map((item) => ({
          id: item.bookingId,
          booking: item.bookingId,
          amount: item.amount,
          date: new Date(item.date).toLocaleDateString('en-IN'),
          method: item.method,
          status: item.status,
        }));
        setTransactionsData(formattedTx);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPeriod]);

  const kpiItems = [
    {
      title: 'Total Bookings',
      value: kpiData.totalBookings.toString(),
      delta: '+12%',
      deltaColor: '#1f8a4d',
      icon: <CalendarMonthRoundedIcon fontSize="small" />,
      iconBg: '#d9f7ee',
      iconColor: '#138b52',
    },
    {
      title: 'Completed',
      value: kpiData.completed.toString(),
      delta: '+8%',
      deltaColor: '#1f8a4d',
      icon: <CheckCircleRoundedIcon fontSize="small" />,
      iconBg: '#e6f6ed',
      iconColor: '#23935a',
    },
    {
      title: 'Cancelled',
      value: kpiData.cancelled.toString(),
      delta: '-5%',
      deltaColor: '#c44545',
      icon: <CancelRoundedIcon fontSize="small" />,
      iconBg: '#fff2e5',
      iconColor: '#d58c1f',
    },
    {
      title: 'Total Earnings',
      value: rupee(kpiData.totalEarnings),
      delta: '+15%',
      deltaColor: '#1f8a4d',
      icon: <CurrencyRupeeRoundedIcon fontSize="small" />,
      iconBg: '#e8f5f2',
      iconColor: '#13785d',
    },
    {
      title: "Today's Earnings",
      value: rupee(kpiData.todayEarnings),
      delta: `${kpiData.completed} jobs`,
      deltaColor: '#6f7783',
      icon: <TrendingUpRoundedIcon fontSize="small" />,
      iconBg: '#eef4ff',
      iconColor: '#4576c9',
    },
  ];

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 1.2, md: 1.6, lg: 1.8 },
        bgcolor: '#f4f6f8',
        minHeight: '100%',
      }}
    >
      <Stack spacing={{ xs: 1.1, sm: 1.4 }}>
        {error && (
          <Alert severity="warning">
            {error}
          </Alert>
        )}

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', lg: 'center' }}
          spacing={0.8}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: 26, sm: 30, md: 34 }, fontWeight: 700, color: '#101828', lineHeight: 1.05 }}>
              Dashboard
            </Typography>
            <Typography sx={{ color: '#6b7280', mt: 0.2, fontSize: { xs: 13, sm: 14 } }}>
              Welcome back. Here&apos;s your performance overview.
            </Typography>
          </Box>

          <Box sx={{ p: 0.7, borderRadius: 2.4, bgcolor: '#e5e8ee' }}>
            <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', rowGap: 0.8 }}>
              {periodTabs.map((tab, index) => (
                <Button
                  key={tab}
                  variant={selectedPeriod === tab ? 'contained' : 'text'}
                  size="small"
                  onClick={() => setSelectedPeriod(tab)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 2.1,
                    py: 0.6,
                    minWidth: 106,
                    fontWeight: 600,
                    color: selectedPeriod === tab ? '#111827' : '#667085',
                    bgcolor: selectedPeriod === tab ? '#ffffff' : 'transparent',
                    boxShadow: selectedPeriod === tab ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
                    '&:hover': {
                      bgcolor: selectedPeriod === tab ? '#ffffff' : '#dde3ea',
                    },
                  }}
                >
                  {tab}
                </Button>
              ))}
            </Stack>
          </Box>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1, sm: 1.2 },
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(5, minmax(0, 1fr))',
            },
          }}
        >
          {kpiItems.map((item) => (
            <MetricCard key={item.title} item={item} loading={loading} />
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1.1, sm: 1.4 },
            gridTemplateColumns: {
              xs: '1fr',
              lg: '1fr 1fr',
            },
          }}
        >
          <Box>
            <Panel title="Earnings Trend" subtitle={`Daily earnings - ${selectedPeriod}`}>
              <Box sx={{ height: { xs: 210, sm: 230, md: 250 } }}>
                {earningsTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={earningsTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e6ebf2" strokeDasharray="4 4" />
                      <XAxis dataKey="date" tick={{ fill: '#7b8794', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#7b8794', fontSize: 11 }} width={40} />
                      <Tooltip formatter={(v) => rupee(v)} />
                      <Line type="monotone" dataKey="value" stroke="#14946f" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                    <Typography color="textSecondary">No data available</Typography>
                  </Box>
                )}
              </Box>
            </Panel>
          </Box>

          <Box>
            <Panel title="Booking Status" subtitle="Distribution of booking outcomes">
              <Box sx={{ height: { xs: 210, sm: 230, md: 250 } }}>
                {bookingStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingStatusData} margin={{ top: 4, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid stroke="#edf1f7" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#7b8794', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#7b8794', fontSize: 11 }} width={34} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {bookingStatusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                    <Typography color="textSecondary">No data available</Typography>
                  </Box>
                )}
              </Box>
            </Panel>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1.1, sm: 1.4 },
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
            },
          }}
        >
          <Box>
            <Panel title="Service Analytics" subtitle="Performance by service type">
              <Box sx={{ overflowX: 'auto' }}>
                {serviceRevenueData.length > 0 ? (
                  <Table size="small" sx={{ minWidth: 520 }}>
                    <TableHead>
                      <TableRow sx={{ '& .MuiTableCell-root': { bgcolor: '#f1f5f9', color: '#667085', fontWeight: 600 } }}>
                        <TableCell>Service</TableCell>
                        <TableCell align="right">Bookings</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Rating</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {serviceRevenueData.map((row) => (
                        <TableRow key={row.service} hover>
                          <TableCell sx={{ color: '#1f2937', fontWeight: 500 }}>{row.service}</TableCell>
                          <TableCell align="right">{row.bookings}</TableCell>
                          <TableCell align="right">{rupee(row.revenue)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="flex-end">
                              <StarRoundedIcon sx={{ fontSize: 16, color: '#f0ad29' }} />
                              <Typography sx={{ fontSize: 14 }}>{row.rating}</Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="textSecondary">No service data available</Typography>
                )}
              </Box>
            </Panel>
          </Box>

          <Box>
            <Panel title="Location Analytics" subtitle="Top performing areas">
              <Box sx={{ overflowX: 'auto' }}>
                {locationRevenueData.length > 0 ? (
                  <Table size="small" sx={{ minWidth: 460 }}>
                    <TableHead>
                      <TableRow sx={{ '& .MuiTableCell-root': { bgcolor: '#f1f5f9', color: '#667085', fontWeight: 600 } }}>
                        <TableCell>Area</TableCell>
                        <TableCell align="right">Bookings</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {locationRevenueData.map((row) => (
                        <TableRow key={row.area} hover>
                          <TableCell sx={{ color: '#1f2937', fontWeight: 500 }}>{row.area}</TableCell>
                          <TableCell align="right">{row.bookings}</TableCell>
                          <TableCell align="right">{rupee(row.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="textSecondary">No location data available</Typography>
                )}
              </Box>
            </Panel>
          </Box>
        </Box>

        <Box>
          <Panel title="Recent Transactions" subtitle="Your latest payment transactions">
            <Box sx={{ overflowX: 'auto' }}>
              {transactionsData.length > 0 ? (
                <Table sx={{ minWidth: 760 }}>
                  <TableHead>
                    <TableRow sx={{ '& .MuiTableCell-root': { bgcolor: '#f1f5f9', color: '#667085', fontWeight: 600 } }}>
                      <TableCell>Booking ID</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactionsData.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.booking}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#101828' }}>{rupee(row.amount)}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.method}</TableCell>
                        <TableCell>
                          <StatusChip status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="textSecondary">No transactions yet</Typography>
              )}
            </Box>
          </Panel>
        </Box>
      </Stack>
    </Box>
  );
}