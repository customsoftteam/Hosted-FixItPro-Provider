import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import CurrencyRupeeOutlinedIcon from '@mui/icons-material/CurrencyRupeeOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import HomeRepairServiceOutlinedIcon from '@mui/icons-material/HomeRepairServiceOutlined';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductById, fetchProductComponents } from '../services/productsApi';

const IMAGE_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22230%22 viewBox=%220 0 400 230%22%3E%3Crect width=%22400%22 height=%22230%22 fill=%22%23e2e8f0%22/%3E%3Ctext x=%22200%22 y=%22120%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2222%22 fill=%22%2364758b%22%3EImage unavailable%3C/text%3E%3C/svg%3E';

const getImageSrc = (value) => {
  const image = String(value || '').trim();
  return image || IMAGE_FALLBACK;
};

export default function ProductComponentsPage() {
  const navigate = useNavigate();
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [productData, componentsData] = await Promise.all([
          fetchProductById(productId),
          fetchProductComponents(productId),
        ]);

        setProduct(productData);
        setComponents(componentsData || []);
      } catch (loadError) {
        console.error('Error loading product details:', loadError);
        setError('Unable to load product details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId]);

  const totalPrice = useMemo(
    () => components.reduce((sum, item) => sum + Number(item?.price || 0), 0),
    [components]
  );

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: '#64748b' }}>Loading product details...</Typography>
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!product) {
    return <Alert severity="warning">Product not found.</Alert>;
  }

  return (
    <Stack spacing={2.2}>
      <Breadcrumbs separator={<NavigateNextRoundedIcon fontSize="small" />} sx={{ color: '#64748b' }}>
        <Link underline="hover" color="inherit" onClick={() => navigate('/app/products')} sx={{ cursor: 'pointer' }}>
          Products
        </Link>
        <Typography color="#0f172a" sx={{ fontWeight: 700 }}>
          {product.name}
        </Typography>
      </Breadcrumbs>

      <Card
        sx={{
          borderRadius: 4,
          color: '#ffffff',
          background: 'linear-gradient(130deg, #022c22 0%, #0f766e 50%, #14b8a6 100%)',
          boxShadow: '0 18px 34px rgba(6, 95, 70, 0.22)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          <Stack spacing={2.2}>
            <Button
              onClick={() => navigate('/app/products')}
              startIcon={<ArrowBackRoundedIcon />}
              variant="outlined"
              sx={{
                alignSelf: 'flex-start',
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.45)',
                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Back to products
            </Button>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.2} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Box
                sx={{
                  width: { xs: '100%', md: 220 },
                  height: { xs: 180, md: 150 },
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.42)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                }}
              >
                <CardMedia
                  component="img"
                  image={getImageSrc(product.image || product.img)}
                  alt={product.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = IMAGE_FALLBACK;
                  }}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1, bgcolor: '#e6edf6' }}
                />
              </Box>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: 28, md: 34 }, lineHeight: 1.1 }}>
                  {product.name}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.88)' }}>
                  {product.description || 'No product description available'}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<CategoryOutlinedIcon sx={{ color: '#ffffff !important' }} />}
                    label={product.category || 'general'}
                    sx={{
                      textTransform: 'capitalize',
                      color: '#ffffff',
                      bgcolor: 'rgba(255,255,255,0.18)',
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    icon={<HomeRepairServiceOutlinedIcon sx={{ color: '#ffffff !important' }} />}
                    label={`${components.length} Components`}
                    sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.18)', fontWeight: 700 }}
                  />
                  <Chip
                    icon={<CurrencyRupeeOutlinedIcon sx={{ color: '#ffffff !important' }} />}
                    label={`Rs ${totalPrice}`}
                    sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.18)', fontWeight: 700 }}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {(product.tags || []).length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {(product.tags || []).map((tag) => (
            <Chip
              key={`${product._id}-${tag}`}
              icon={<LocalOfferOutlinedIcon />}
              label={tag}
              variant="outlined"
              sx={{ borderColor: '#c8d5e6', bgcolor: '#f8fafc' }}
            />
          ))}
        </Stack>
      ) : null}

      <Divider />

      {!components.length ? (
        <Alert severity="info">No active components available for this product.</Alert>
      ) : (
        <Grid container spacing={2}>
          {components.map((component) => (
            <Grid item xs={12} sm={6} md={4} key={component._id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid #dbe3ef',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.06)',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ height: 190, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={getImageSrc(component.img)}
                    alt={component.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = IMAGE_FALLBACK;
                    }}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1.2, bgcolor: '#eef2f7' }}
                  />
                </Box>
                <CardContent>
                  <Stack spacing={1.1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
                        {component.name}
                      </Typography>
                      <Chip
                        icon={<BuildCircleOutlinedIcon />}
                        label="Component"
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#c8d5e6' }}
                      />
                    </Stack>

                    <Typography
                      sx={{
                        color: '#64748b',
                        minHeight: 40,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {component.description || 'No description available'}
                    </Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pt: 0.5 }}>
                      <CurrencyRupeeOutlinedIcon sx={{ color: '#0f766e', fontSize: 18 }} />
                      <Typography sx={{ color: '#0f766e', fontWeight: 900, fontSize: 18 }}>
                        {Number(component?.price || 0)}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
