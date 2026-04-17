import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  Grid,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { useNavigate } from 'react-router-dom';
import { fetchAllProductsWithComponents } from '../services/productsApi';

const IMAGE_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22230%22 viewBox=%220 0 400 230%22%3E%3Crect width=%22400%22 height=%22230%22 fill=%22%23e2e8f0%22/%3E%3Ctext x=%22200%22 y=%22120%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2222%22 fill=%22%2364758b%22%3EImage unavailable%3C/text%3E%3C/svg%3E';

const getProductImageSrc = (product) => {
  const image = String(product?.image || product?.img || '').trim();
  return image || IMAGE_FALLBACK;
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAllProductsWithComponents();
      setProducts(data.filter((p) => p.isActive));
    } catch (err) {
      setError('Failed to load products. Please try again.');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((item) => {
      const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
      return (
        String(item.name || '').toLowerCase().includes(q)
        || String(item.category || '').toLowerCase().includes(q)
        || String(item.description || '').toLowerCase().includes(q)
        || tags.includes(q)
      );
    });
  }, [products, search]);

  const totalComponents = useMemo(
    () => products.reduce((sum, item) => sum + (Array.isArray(item.components) ? item.components.length : 0), 0),
    [products]
  );

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: '#64748b' }}>Loading products...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          borderRadius: 4,
          p: { xs: 2.2, md: 3 },
          color: '#ffffff',
          background: 'linear-gradient(130deg, #0f172a 0%, #1d4ed8 55%, #0ea5e9 100%)',
          boxShadow: '0 18px 34px rgba(15, 23, 42, 0.22)',
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 900, lineHeight: 1.12 }}>
                Products Catalog
              </Typography>
              <Typography sx={{ mt: 0.6, color: 'rgba(255,255,255,0.86)' }}>
                Tap a product to open a dedicated page with all components and pricing details.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.2}>
              <Chip
                icon={<Inventory2OutlinedIcon sx={{ color: '#ffffff !important' }} />}
                label={`${products.length} Products`}
                sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.16)', fontWeight: 700 }}
              />
              <Chip
                icon={<BuildOutlinedIcon sx={{ color: '#ffffff !important' }} />}
                label={`${totalComponents} Components`}
                sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.16)', fontWeight: 700 }}
              />
            </Stack>
          </Stack>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by product name, category or tags"
            fullWidth
            size="small"
            sx={{
              maxWidth: 560,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.96)',
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!filteredProducts.length ? (
        <Alert severity="info">No products found for your search.</Alert>
      ) : (
        <Container disableGutters maxWidth={false}>
          <Grid container spacing={2.2}>
            {filteredProducts.map((product) => {
              const componentCount = Array.isArray(product.components) ? product.components.length : 0;

              return (
                <Grid item xs={12} sm={6} lg={4} key={product._id}>
                  <Card
                    onClick={() => navigate(`/app/products/${product._id}`)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 3,
                      border: '1px solid #dbe3ef',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 18px 36px rgba(30, 41, 59, 0.15)',
                        borderColor: '#8fb8ff',
                      },
                    }}
                  >
                    <Box sx={{ height: 190, overflow: 'hidden', bgcolor: '#f1f5f9' }}>
                      <CardMedia
                        component="img"
                        image={getProductImageSrc(product)}
                        alt={product.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = IMAGE_FALLBACK;
                        }}
                        sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1.2, bgcolor: '#eef2f7' }}
                      />
                    </Box>
                    <CardContent>
                      <Stack spacing={1.3}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Typography sx={{ fontWeight: 900, fontSize: 20, color: '#0f172a' }}>
                            {product.name}
                          </Typography>
                          <Chip
                            icon={<BuildOutlinedIcon />}
                            label={`${componentCount} parts`}
                            size="small"
                            sx={{ bgcolor: '#eaf2ff', color: '#1d4ed8', fontWeight: 700 }}
                          />
                        </Stack>

                        <Typography
                          sx={{
                            color: '#475569',
                            fontSize: 14,
                            minHeight: 40,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {product.description || 'No description available'}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            icon={<CategoryOutlinedIcon />}
                            label={product.category || 'general'}
                            size="small"
                            sx={{ textTransform: 'capitalize', bgcolor: '#f8fafc', border: '1px solid #dbe3ef' }}
                          />
                          {(product.tags || []).slice(0, 2).map((tag) => (
                            <Chip
                              key={`${product._id}-${tag}`}
                              icon={<LocalOfferOutlinedIcon />}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: '#d1d5db', color: '#334155' }}
                            />
                          ))}
                        </Stack>

                        <Button
                          variant="text"
                          endIcon={<ArrowForwardRoundedIcon />}
                          sx={{
                            mt: 0.5,
                            justifyContent: 'flex-start',
                            px: 0,
                            fontWeight: 800,
                            color: '#1d4ed8',
                          }}
                        >
                          View components
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      )}
    </Stack>
  );
}
