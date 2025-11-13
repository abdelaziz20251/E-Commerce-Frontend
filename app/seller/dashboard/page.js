'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';
import { sellersAPI } from '@/services/api';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    days: 365,
    startDate: '',
    endDate: ''
  });
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutType, setPayoutType] = useState('full');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
    } else if (isHydrated && user && user.role !== 'seller') {
      router.push('/');
    } else if (isHydrated && user && user.role === 'seller') {
      // Fetch dashboard
      fetchDashboard();
    }
  }, [user, isHydrated, router]);

  const fetchDashboard = async (customDays = null) => {
    setLoading(true);
    setError(null);
    try {
      // Build query params for date filtering
      const params = {};
      
      // Use customDays if provided, otherwise use state
      const daysToUse = customDays !== null ? customDays : dateRange.days;
      
      if (showCustomRange && dateRange.startDate && dateRange.endDate) {
        params.start_date = dateRange.startDate;
        params.end_date = dateRange.endDate;
      } else {
        params.days = daysToUse;
      }
      
      console.log('Fetching dashboard with params:', params);
      const response = await sellersAPI.getDashboard(params);
      console.log('Dashboard response:', response);
      setDashboard(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.log('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        message: err.message
      });
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        setError('profile_incomplete');
      } else if (err.response?.status === 403) {
        setError('access_denied');
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to server. Please ensure the backend is running on http://localhost:8000');
      } else {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateRangeChange = () => {
    fetchDashboard();
  };
  
  const quickDateSelect = (days) => {
    setShowCustomRange(false);
    // Update state
    setDateRange({ ...dateRange, days });
    // Fetch immediately with the new days value
    fetchDashboard(days);
  };

  const fetchProfile = async () => {
    try {
      const response = await sellersAPI.getProfile();
      setProfile(response.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleRequestPayout = async () => {
    if (!dashboard) return;
    
    const availableBalance = dashboard.payouts?.available || 0;
    let amountToRequest = 0;

    if (payoutType === 'full') {
      amountToRequest = availableBalance;
    } else {
      const parsedAmount = parseFloat(payoutAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
      }
      if (parsedAmount > availableBalance) {
        alert(`Amount exceeds available balance of $${availableBalance.toFixed(2)}`);
        return;
      }
      amountToRequest = parsedAmount;
    }

    setRequestingPayout(true);
    try {
      await sellersAPI.requestPayout({
        amount: amountToRequest,
        type: payoutType,
      });
      alert('Payout request submitted successfully!');
      setShowPayoutModal(false);
      setPayoutAmount('');
      fetchDashboard();
    } catch (err) {
      console.error('Failed to request payout:', err);
      alert(err.response?.data?.error || 'Failed to request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

  useEffect(() => {
    if (dashboard && user) {
      fetchProfile();
    }
  }, [dashboard]);

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Handle incomplete profile
  if (error === 'profile_incomplete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Seller Profile</h1>
          <p className="text-gray-600 mb-6">
            Before you can access your dashboard, please complete your seller profile with your business information.
          </p>
          <Link
            href="/seller/setup"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold transition"
          >
            Complete Profile Setup
          </Link>
        </div>
      </div>
    );
  }

  // Handle other errors
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error === 'access_denied' ? 'Access Denied' : 'Error'}
          </h1>
          <p className="text-gray-600 mb-6 text-sm whitespace-pre-wrap">
            {error === 'access_denied' 
              ? 'You must be registered as a seller to access this page.'
              : error
            }
          </p>
          <div className="space-x-4">
            <button
              onClick={fetchDashboard}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-block bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { seller_info, overview, orders_by_status, recent_performance, recent_orders, payouts, low_stock_alerts } = dashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {seller_info.business_name}</p>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => quickDateSelect(7)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    dateRange.days === 7 && !showCustomRange
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => quickDateSelect(30)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    dateRange.days === 30 && !showCustomRange
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => quickDateSelect(90)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    dateRange.days === 90 && !showCustomRange
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  90 Days
                </button>
                <button
                  onClick={() => quickDateSelect(365)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    dateRange.days === 365 && !showCustomRange
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All Time
                </button>
              </div>
              
              {showCustomRange && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleDateRangeChange}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomRange(false);
                      setDateRange({ ...dateRange, days: 365 });
                      setTimeout(fetchDashboard, 100);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {!showCustomRange && (
                <button
                  onClick={() => setShowCustomRange(true)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                >
                  Custom Range
                </button>
              )}
            </div>
          </div>
          
          {dashboard.date_range && (
            <p className="text-sm text-gray-500 mt-2">
              Showing data from {new Date(dashboard.date_range.start_date).toLocaleDateString()} to {new Date(dashboard.date_range.end_date).toLocaleDateString()}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2">
            {seller_info.is_verified ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Verified Seller
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Pending Verification
              </span>
            )}
            <span className="text-sm text-gray-600">
              Rating: {seller_info.average_rating.toFixed(1)} ⭐ ({seller_info.total_reviews} reviews)
            </span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={overview.total_revenue > 0 ? `$${overview.total_revenue.toFixed(2)}` : 'N/A'}
            icon="💰"
            color="bg-green-500"
          />
          <StatCard
            title="Orders to Fulfill"
            value={overview.orders_to_fulfill > 0 ? overview.orders_to_fulfill : 'N/A'}
            subtitle={overview.orders_to_fulfill > 0 ? `${orders_by_status.pending} pending, ${orders_by_status.processing} processing` : 'No orders yet'}
            icon="📦"
            color="bg-blue-500"
            link={overview.orders_to_fulfill > 0 ? "/seller/orders?status=pending" : null}
          />
          <StatCard
            title="Total Orders"
            value={overview.total_orders > 0 ? overview.total_orders : 'N/A'}
            subtitle={overview.total_orders > 0 ? `${orders_by_status.delivered} delivered` : 'No orders yet'}
            icon="📊"
            color="bg-purple-500"
          />
          <StatCard
            title="Active Products"
            value={overview.total_products > 0 ? `${overview.active_products}/${overview.total_products}` : 'N/A'}
            subtitle={overview.total_products > 0 ? `${overview.out_of_stock} out of stock` : 'No products yet'}
            icon="🏷️"
            color="bg-orange-500"
            link="/seller/products"
          />
        </div>

        {/* Performance and Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Last 30 Days Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recent_performance.last_30_days.revenue > 0 
                      ? `$${recent_performance.last_30_days.revenue.toFixed(2)}`
                      : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recent_performance.last_30_days.orders > 0 
                      ? recent_performance.last_30_days.orders
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {recent_performance.last_30_days.orders > 0 ? (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Week vs Last Week</span>
                    <span className={`text-sm font-medium ${
                      recent_performance.week_over_week_change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {recent_performance.week_over_week_change >= 0 ? '↑' : '↓'} 
                      {Math.abs(recent_performance.week_over_week_change).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-600">This week: {recent_performance.this_week_orders} orders</span>
                    <span className="text-gray-600">Last week: {recent_performance.last_week_orders} orders</span>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 text-center">No recent orders to compare</p>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
              <Link href="/seller/products" className="text-sm text-primary-600 hover:text-primary-700">
                View All
              </Link>
            </div>
            {low_stock_alerts.length > 0 ? (
              <div className="space-y-3">
                {low_stock_alerts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-600">${product.price}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No low stock items</p>
            )}
          </div>
        </div>

        {/* Payouts Summary */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 mb-8 text-white">
          <h2 className="text-lg font-semibold mb-4">Payout Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-green-100 text-sm">Available Balance</p>
              <p className="text-2xl font-bold">
                {payouts.available > 0 ? `$${payouts.available.toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-green-100 text-sm">Pending</p>
              <p className="text-2xl font-bold">
                {payouts.pending > 0 ? `$${payouts.pending.toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-green-100 text-sm">Total Paid Out</p>
              <p className="text-2xl font-bold">
                {payouts.completed > 0 ? `$${payouts.completed.toFixed(2)}` : 'N/A'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowPayoutModal(true)}
            className="mt-4 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={(payouts.available || 0) <= 0}
          >
            {(payouts.available || 0) > 0 ? 'Request Payout' : 'No Balance Available'}
          </button>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              {recent_orders.length > 0 && (
                <Link href="/seller/orders" className="text-sm text-primary-600 hover:text-primary-700">
                  View All Orders
                </Link>
              )}
            </div>
          </div>
          {recent_orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recent_orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                        <Link href={`/seller/orders/${order.id}`}>
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.items_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 text-lg">No orders yet</p>
              <p className="text-gray-500 mt-2">Orders will appear here once customers purchase your products</p>
            </div>
          )}
        </div>

        {/* Payout Request Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Request Payout</h2>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Business Info */}
                {profile && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Business Name:</span>
                      <span className="ml-2 text-gray-900">{profile.business_name}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Business Address:</span>
                      <span className="ml-2 text-gray-900">
                        {profile.business_address}, {profile.business_city}, {profile.business_state} {profile.business_zip}
                      </span>
                    </div>
                    {profile.bank_account_holder && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Bank Account:</span>
                        <span className="ml-2 text-gray-900">***{profile.bank_account_number?.slice(-4)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Payout Amount Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Amount
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setPayoutType('full');
                        setPayoutAmount('');
                      }}
                      className={`px-4 py-3 rounded-lg border-2 font-medium ${
                        payoutType === 'full'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Full Amount
                      <p className="text-xs mt-1 opacity-75">
                        ${(dashboard?.payouts?.available || 0).toFixed(2)}
                      </p>
                    </button>
                    <button
                      onClick={() => setPayoutType('partial')}
                      className={`px-4 py-3 rounded-lg border-2 font-medium ${
                        payoutType === 'partial'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Partial Amount
                      <p className="text-xs mt-1 opacity-75">Custom amount</p>
                    </button>
                  </div>
                </div>

                {/* Partial Amount Input */}
                {payoutType === 'partial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={dashboard?.payouts?.available || 0}
                      step="0.01"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: ${(dashboard?.payouts?.available || 0).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Payout Summary:</p>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Amount to Request:</span>
                    <span className="text-xl font-bold text-blue-700">
                      ${payoutType === 'full' ? (dashboard?.payouts?.available || 0).toFixed(2) : parseFloat(payoutAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowPayoutModal(false);
                    setPayoutAmount('');
                    setPayoutType('full');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestPayout}
                  disabled={requestingPayout || (payoutType === 'partial' && (!payoutAmount || parseFloat(payoutAmount) <= 0))}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {requestingPayout ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color, link }) {
  const Card = (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${color} rounded-full p-3 text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return link ? <Link href={link}>{Card}</Link> : Card;
}

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

