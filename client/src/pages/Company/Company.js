import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { Building2, Save, Users, Settings, DollarSign } from 'lucide-react';
import { companiesAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const Company = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: '',
    timezone: 'UTC',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contact: {
      email: '',
      phone: '',
      website: ''
    }
  });

  const [settingsData, setSettingsData] = useState({
    expenseCategories: ['Travel', 'Meals', 'Office Supplies', 'Transportation', 'Accommodation', 'Other'],
    autoApproveLimit: 0,
    maxExpenseAmount: null,
    requireReceipts: true
  });

  const countries = [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'CA', name: 'Canada', currency: 'CAD' },
    { code: 'AU', name: 'Australia', currency: 'AUD' },
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'DE', name: 'Germany', currency: 'EUR' },
    { code: 'FR', name: 'France', currency: 'EUR' },
    { code: 'JP', name: 'Japan', currency: 'JPY' }
  ];

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await companiesAPI.getCompany();
      setCompany(response.data);
      setFormData({
        name: response.data.name || '',
        country: response.data.country || '',
        currency: response.data.currency || 'USD',
        timezone: response.data.timezone || 'UTC',
        address: {
          street: response.data.address?.street || '',
          city: response.data.address?.city || '',
          state: response.data.address?.state || '',
          zipCode: response.data.address?.zipCode || '',
          country: response.data.address?.country || ''
        },
        contact: {
          email: response.data.contact?.email || '',
          phone: response.data.contact?.phone || '',
          website: response.data.contact?.website || ''
        }
      });
      setSettingsData({
        expenseCategories: response.data.settings?.expenseCategories || ['Travel', 'Meals', 'Office Supplies', 'Transportation', 'Accommodation', 'Other'],
        autoApproveLimit: response.data.settings?.autoApproveLimit || 0,
        maxExpenseAmount: response.data.settings?.maxExpenseAmount || null,
        requireReceipts: response.data.settings?.requireReceipts !== false
      });
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCountryChange = (e) => {
    const selectedCountry = countries.find(c => c.code === e.target.value);
    setFormData(prev => ({
      ...prev,
      country: e.target.value,
      currency: selectedCountry?.currency || 'USD'
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettingsData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'expenseCategories' ? value.split(',').map(cat => cat.trim()) : value)
    }));
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companiesAPI.updateCompany(formData);
      toast.success('Company information updated successfully!');
      fetchCompanyData();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companiesAPI.updateSettings(settingsData);
      toast.success('Company settings updated successfully!');
      fetchCompanyData();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-gray-600">Manage your company information and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCompany} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleCountryChange}
                      required
                      className="input"
                      disabled
                    >
                      <option value="">Select country</option>
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Country is auto-selected during registration and cannot be changed here.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    disabled
                    helperText="Auto-selected based on country"
                  />
                  <Input
                    label="Timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Street Address"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="City"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="State/Province"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="ZIP/Postal Code"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      name="contact.email"
                      type="email"
                      value={formData.contact.email}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Phone"
                      name="contact.phone"
                      value={formData.contact.phone}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Website"
                      name="contact.website"
                      value={formData.contact.website}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" loading={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Company Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Currency</span>
                  <span className="font-medium">{company?.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Country</span>
                  <span className="font-medium">{company?.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="font-medium">
                    {company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Expense Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Categories
                  </label>
                  <Input
                    name="expenseCategories"
                    value={settingsData.expenseCategories.join(', ')}
                    onChange={handleSettingsChange}
                    placeholder="Travel, Meals, Office Supplies"
                    helperText="Separate categories with commas"
                  />
                </div>

                <div>
                  <Input
                    label="Auto-approve limit"
                    name="autoApproveLimit"
                    type="number"
                    value={settingsData.autoApproveLimit}
                    onChange={handleSettingsChange}
                    helperText="Amount below which expenses are auto-approved"
                  />
                </div>

                <div>
                  <Input
                    label="Max expense amount"
                    name="maxExpenseAmount"
                    type="number"
                    value={settingsData.maxExpenseAmount || ''}
                    onChange={handleSettingsChange}
                    helperText="Maximum allowed expense amount (leave empty for no limit)"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="requireReceipts"
                    checked={settingsData.requireReceipts}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Require receipts for expenses
                  </label>
                </div>

                <Button type="submit" loading={saving} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Company;
