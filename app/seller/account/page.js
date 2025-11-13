'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';
import { sellersAPI } from '@/services/api';
import { showToast } from '@/components/Toast';

export default function SellerAccountPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
    } else if (isHydrated && user && user.role !== 'seller') {
      router.push('/');
    } else if (isHydrated && user && user.role === 'seller') {
      fetchData();
    }
  }, [user, isHydrated, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileResponse, dashboardResponse] = await Promise.all([
        sellersAPI.getProfile(),
        sellersAPI.getDashboard()
      ]);
      
      const profileData = profileResponse.data;
      const dashboardData = dashboardResponse.data;
      
      setProfile(profileData);
      setStats(dashboardData);
      
      // Initialize form data
      setFormData({
        business_name: profileData.business_name || '',
        business_description: profileData.business_description || '',
        business_email: profileData.business_email || '',
        business_phone: profileData.business_phone || '',
        business_address: profileData.business_address || '',
        business_city: profileData.business_city || '',
        business_state: profileData.business_state || '',
        business_zip: profileData.business_zip || '',
        business_country: profileData.business_country || 'US',
        tax_id: profileData.tax_id || '',
        business_license: profileData.business_license || '',
        bank_name: profileData.bank_name || '',
        bank_address: profileData.bank_address || '',
        bank_account_holder: profileData.bank_account_holder || '',
        bank_account_number: profileData.bank_account_number ? '***' + profileData.bank_account_number.slice(-4) : '',
        bank_routing_number: profileData.bank_routing_number || '',
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast.error('Failed to load account information', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updateData = {
        business_name: formData.business_name,
        business_description: formData.business_description,
        business_email: formData.business_email,
        business_phone: formData.business_phone,
        business_address: formData.business_address,
        business_city: formData.business_city,
        business_state: formData.business_state,
        business_zip: formData.business_zip,
        business_country: formData.business_country,
        tax_id: formData.tax_id,
        business_license: formData.business_license,
      };
      
      if (formData.bank_name) updateData.bank_name = formData.bank_name;
      if (formData.bank_address) updateData.bank_address = formData.bank_address;
      if (formData.bank_account_holder) updateData.bank_account_holder = formData.bank_account_holder;
      if (formData.bank_routing_number) updateData.bank_routing_number = formData.bank_routing_number;
      if (formData.bank_account_number && !formData.bank_account_number?.startsWith('***')) {
        updateData.bank_account_number = formData.bank_account_number;
      }
      
      await sellersAPI.updateProfile(updateData);
      showToast.success('Profile updated successfully!', 'Success');
      setEditing(false);
      fetchData();
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast.error(err.response?.data?.detail || 'Failed to update profile', 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">Failed to load account information</p>
          <Link
            href="/seller/dashboard"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { seller_info, overview } = stats;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Stats */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{profile.business_name}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    {profile.is_verified ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500">
                        ✓ Verified Seller
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-500">
                        Pending Verification
                      </span>
                    )}
                  </div>
                  {profile.average_rating > 0 && (
                    <div className="flex items-center text-yellow-300">
                      <span className="text-xl font-bold mr-1">★</span>
                      <span className="text-lg font-semibold">{profile.average_rating.toFixed(1)}</span>
                      <span className="text-sm ml-1">({profile.total_reviews} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
              <Link
                href="/seller/dashboard"
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-medium transition"
              >
                ← Dashboard
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            <StatCard label="Total Revenue" value={`$${overview.total_revenue.toFixed(2)}`} />
            <StatCard label="Active Products" value={overview.active_products} subvalue={`/ ${overview.total_products}`} />
            <StatCard label="Total Orders" value={overview.total_orders} />
            <StatCard label="Out of Stock" value={overview.out_of_stock} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <nav className="p-4 space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Account Overview
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('business')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'business'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Business Information
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('banking')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'banking'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Banking & Payouts
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('tax')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'tax'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Tax Information
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Account Summary Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard label="Business Name" value={profile.business_name} />
                    <InfoCard label="Business Email" value={profile.business_email} />
                    <InfoCard label="Business Phone" value={profile.business_phone} />
                    <InfoCard label="Verification Status" value={profile.is_verified ? 'Verified' : 'Pending'} status={profile.is_verified} />
                  </div>
                </div>

                {/* Business Address */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Address</h2>
                  <div className="text-gray-700">
                    <p className="font-medium">{profile.business_address}</p>
                    <p>{profile.business_city}, {profile.business_state} {profile.business_zip}</p>
                    <p>{profile.business_country}</p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Member Since</h2>
                  <p className="text-gray-600">
                    {new Date(profile.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <BusinessInfoTab 
                profile={profile}
                formData={formData}
                setFormData={setFormData}
                editing={editing}
                setEditing={setEditing}
                onSave={handleUpdate}
                saving={saving}
              />
            )}

            {activeTab === 'banking' && (
              <BankingInfoTab 
                profile={profile}
                formData={formData}
                setFormData={setFormData}
                editing={editing}
                setEditing={setEditing}
                onSave={handleUpdate}
                saving={saving}
              />
            )}

            {activeTab === 'tax' && (
              <TaxInfoTab 
                profile={profile}
                formData={formData}
                setFormData={setFormData}
                editing={editing}
                setEditing={setEditing}
                onSave={handleUpdate}
                saving={saving}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subvalue }) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}{subvalue && <span className="text-lg text-gray-500">{subvalue}</span>}
      </p>
    </div>
  );
}

function InfoCard({ label, value, status }) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-gray-900 font-medium">{value}</p>
        {status === true && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
            ✓ Verified
          </span>
        )}
        {status === false && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

function BusinessInfoTab({ profile, formData, setFormData, editing, setEditing, onSave, saving }) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your business details and contact information</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.business_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Email <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="email"
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.business_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Phone <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="tel"
                value={formData.business_phone}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.business_phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            {editing ? (
              <select
                value={formData.business_country}
                onChange={(e) => setFormData({ ...formData, business_country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-gray-900 py-2">{profile.business_country}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Address <span className="text-red-500">*</span>
          </label>
          {editing ? (
            <textarea
              value={formData.business_address}
              onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          ) : (
            <p className="text-gray-900 py-2">{profile.business_address}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.business_city}
                onChange={(e) => setFormData({ ...formData, business_city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.business_city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State/Province <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.business_state}
                onChange={(e) => setFormData({ ...formData, business_state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.business_state}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.business_zip}
                onChange={(e) => setFormData({ ...formData, business_zip: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.business_zip}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description
          </label>
          {editing ? (
            <textarea
              value={formData.business_description}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
              rows="4"
              placeholder="Describe your business..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          ) : (
            <p className="text-gray-900 py-2">{profile.business_description || 'No description provided'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BankingInfoTab({ profile, formData, setFormData, editing, setEditing, onSave, saving }) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Banking & Payout Information</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your bank account for receiving payouts</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>
        
        {profile.is_verified ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-800 font-medium">Your account is verified and ready to receive payouts</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-800">Verification required: Complete all banking information to receive payouts</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.bank_name || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Address
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.bank_address}
                onChange={(e) => setFormData({ ...formData, bank_address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.bank_address || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.bank_account_holder}
                onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.bank_account_holder || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.bank_account_number}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={formData.bank_account_number?.startsWith('***') ? 'Enter full account number' : 'Account number'}
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.bank_account_number ? '***' + profile.bank_account_number.slice(-4) : 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Routing Number <span className="text-red-500">*</span>
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.bank_routing_number}
                onChange={(e) => setFormData({ ...formData, bank_routing_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.bank_routing_number || 'Not set'}</p>
            )}
          </div>
        </div>

        {editing && (
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={() => setEditing(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TaxInfoTab({ profile, formData, setFormData, editing, setEditing, onSave, saving }) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tax & Legal Information</h2>
            <p className="text-sm text-gray-600 mt-1">Provide your tax identification details</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax ID / EIN
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.tax_id || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business License Number
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.business_license}
                onChange={(e) => setFormData({ ...formData, business_license: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.business_license || 'Not set'}</p>
            )}
          </div>
        </div>

        {editing && (
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={() => setEditing(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
