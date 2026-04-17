import api from './api';

// Get overview of earnings (total, this month, this week, today)
export const getEarningsOverview = async () => {
  try {
    const response = await api.get('/providers/earnings/overview');
    return response.data;
  } catch (error) {
    console.error('Error fetching earnings overview:', error);
    throw error;
  }
};

// Get earnings trend data (daily breakdowns for period)
export const getEarningsTrend = async (period = 'month') => {
  try {
    const response = await api.get('/providers/earnings/trend', {
      params: { period },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching earnings trend:', error);
    throw error;
  }
};

// Get revenue breakdown by service type
export const getRevenueByService = async () => {
  try {
    const response = await api.get('/providers/earnings/by-service');
    return response.data;
  } catch (error) {
    console.error('Error fetching revenue by service:', error);
    throw error;
  }
};

// Get revenue breakdown by location
export const getRevenueByLocation = async () => {
  try {
    const response = await api.get('/providers/earnings/by-location');
    return response.data;
  } catch (error) {
    console.error('Error fetching revenue by location:', error);
    throw error;
  }
};

// Get transaction history with pagination
export const getTransactionHistory = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/providers/earnings/transactions', {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};
