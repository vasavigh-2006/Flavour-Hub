import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, subscribersRes, reportsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/subscribers'),
        api.get('/admin/reports'),
      ]);
      setStats(statsRes.data.stats);
      setSubscribers(subscribersRes.data.subscribers);
      setReports(reportsRes.data.reports);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async (reportId, status, notes) => {
    try {
      await api.put(`/admin/reports/${reportId}`, { status, notes });
      toast.success('Report updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Total Users</h3>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Total Recipes</h3>
            <p className="text-2xl font-bold">{stats.totalRecipes}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Subscribers</h3>
            <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Pending Reports</h3>
            <p className="text-2xl font-bold">{stats.pendingReports}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Subscribers</h2>
          <div className="space-y-2">
            {subscribers.length === 0 ? (
              <p className="text-gray-500">No subscribers</p>
            ) : (
              subscribers.map((sub) => (
                <div key={sub._id} className="border-b pb-2">
                  <p className="font-semibold">{sub.username}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {sub.subscription.planId} - {sub.subscription.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Reports</h2>
          <div className="space-y-2">
            {reports.length === 0 ? (
              <p className="text-gray-500">No reports</p>
            ) : (
              reports.map((report) => (
                <div key={report._id} className="border-b pb-2">
                  <p className="font-semibold">{report.recipeId?.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{report.reason}</p>
                  <p className="text-xs text-gray-500">Status: {report.status}</p>
                  {report.status === 'pending' && (
                    <div className="mt-2 space-x-2">
                      <button
                        onClick={() => handleUpdateReport(report._id, 'resolved')}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleUpdateReport(report._id, 'dismissed')}
                        className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

