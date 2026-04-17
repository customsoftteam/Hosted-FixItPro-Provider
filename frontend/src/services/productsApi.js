import api from './api';

export const fetchAllProducts = async () => {
  try {
    const { data } = await api.get('/products');
    return data?.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchProductById = async (productId) => {
  try {
    const { data } = await api.get(`/products/${productId}`);
    return data?.product || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const fetchProductComponents = async (productId) => {
  try {
    const { data } = await api.get(`/products/${productId}/components`);
    return data?.components || [];
  } catch (error) {
    console.error('Error fetching product components:', error);
    throw error;
  }
};

export const fetchAllProductsWithComponents = async () => {
  try {
    const { data } = await api.get('/products/with-components/all');
    return data?.products || [];
  } catch (error) {
    console.error('Error fetching products with components:', error);
    throw error;
  }
};
