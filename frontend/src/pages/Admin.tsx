import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Users,
  History,
  BarChart3,
  TrendingUp,
  Calendar,
  Globe,
  Trash2,
  Shield,
  HardDrive,
  Check,
  X,
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import GlassNav from '../components/GlassNav';
import api, { storageRequestApi } from '../lib/api';

interface User {
  id: string;
  username: string;
  role: string;
  quotaMb: number;
  storageUsed: number;
  storagePercent: number;
  createdAt: string;
}

interface Log {
  id: string;
  user: { username: string };
  action: string;
  details: string | null;
  createdAt: string;
}

interface VisitorStats {
  today: number;
  week: number;
  month: number;
  total: number;
  dailyData: number[];
  dailyLabels: string[];
}

interface StorageRequest {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    quotaMb: number;
  };
  requestedMb: number;
  reason: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const statCards = [
  { key: 'users', label: 'Total Users', icon: Users, gradient: 'from-violet-500 to-purple-600' },
  { key: 'admins', label: 'Admins', icon: Shield, gradient: 'from-fuchsia-500 to-pink-600' },
  { key: 'regular', label: 'Regular Users', icon: Users, gradient: 'from-emerald-500 to-teal-600' },
  { key: 'visits', label: 'Total Visits', icon: Globe, gradient: 'from-amber-500 to-orange-600' },
  { key: 'requests', label: 'Pending Requests', icon: HardDrive, gradient: 'from-blue-500 to-cyan-600' },
] as const;

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    today: 0, week: 0, month: 0, total: 0, dailyData: [], dailyLabels: [],
  });
  const [storageRequests, setStorageRequests] = useState<StorageRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'analytics' | 'storage'>('users');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
    fetchLogs();
    fetchVisitorStats();
    fetchStorageRequests();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get('/admin/logs');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const fetchVisitorStats = async () => {
    try {
      const response = await api.get('/admin/visitor-stats');
      setVisitorStats(response.data);
    } catch (error) {
      console.error('Failed to fetch visitor stats:', error);
    }
  };

  const fetchStorageRequests = async () => {
    try {
      const response = await storageRequestApi.getAllRequests();
      setStorageRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch storage requests:', error);
    }
  };

  const handleUpdateQuota = async (username: string, newQuota: number) => {
    try {
      await api.put(`/admin/users/${username}/quota`, { quota: newQuota });
      await fetchUsers();
    } catch {
      alert('Failed to update quota');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Delete user ${username}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${username}`);
      await fetchUsers();
    } catch {
      alert('Failed to delete user');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!confirm('Approve this storage request?')) return;
    try {
      await storageRequestApi.approve(requestId);
      await fetchStorageRequests();
      await fetchUsers();
    } catch {
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm('Reject this storage request?')) return;
    try {
      await storageRequestApi.reject(requestId);
      await fetchStorageRequests();
    } catch {
      alert('Failed to reject request');
    }
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;
  const pendingRequests = storageRequests.filter((r) => r.status === 'pending').length;
  const statValues: Record<string, number> = {
    users: users.length,
    admins: adminCount,
    regular: userCount,
    visits: visitorStats.total,
    requests: pendingRequests,
  };

  const tabs = [
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'logs' as const, label: 'Logs', icon: History },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'storage' as const, label: 'Storage Requests', icon: HardDrive },
  ];

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground />
      <GlassNav title="ANY CLOUD Admin" username={user?.username} onLogout={logout} showAuth={false} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map(({ key, label, icon: Icon, gradient }) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">{label}</p>
                    <p className="text-3xl font-bold text-white">{statValues[key]}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`tab-btn flex items-center gap-2 ${activeTab === id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage accounts and storage quotas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="file-row">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{u.username}</p>
                        {u.role === 'admin' && (
                          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
                            admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/40">
                        {u.storageUsed.toFixed(2)} MB / {u.quotaMb} MB ({u.storagePercent.toFixed(1)}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={u.quotaMb}
                        className="w-24"
                        onBlur={(e) => {
                          const newQuota = parseInt(e.target.value);
                          if (newQuota !== u.quotaMb) handleUpdateQuota(u.username, newQuota);
                        }}
                      />
                      <span className="text-sm text-white/40">MB</span>
                      {u.role !== 'admin' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.username)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Recent system activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="py-8 text-center text-white/40">No activity logs yet</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="file-row">
                      <div>
                        <p className="font-medium text-white">{log.user.username}</p>
                        <p className="text-sm text-white/40">
                          {log.action}
                          {log.details && ` — ${log.details}`}
                        </p>
                      </div>
                      <p className="text-sm text-white/30">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Today', value: visitorStats.today, icon: Calendar, gradient: 'from-cyan-500 to-blue-600' },
                { label: 'This Week', value: visitorStats.week, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600' },
                { label: 'This Month', value: visitorStats.month, icon: BarChart3, gradient: 'from-violet-500 to-purple-600' },
                { label: 'All Time', value: visitorStats.total, icon: Globe, gradient: 'from-amber-500 to-orange-600' },
              ].map(({ label, value, icon: Icon, gradient }) => (
                <Card key={label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/50">{label}</p>
                        <p className="text-3xl font-bold text-white">{value}</p>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daily Visits (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-end justify-around gap-2">
                  {visitorStats.dailyData.length === 0 ? (
                    <p className="w-full py-16 text-center text-white/40">No visit data yet</p>
                  ) : (
                    visitorStats.dailyData.map((count, index) => (
                      <div key={index} className="flex flex-1 flex-col items-center">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-cyan-400 transition-all hover:brightness-110"
                          style={{
                            height: `${Math.max((count / Math.max(...visitorStats.dailyData, 1)) * 100, 5)}%`,
                          }}
                        />
                        <p className="mt-2 text-xs text-white/40">
                          {visitorStats.dailyLabels[index]}
                        </p>
                        <p className="text-sm font-medium text-white">{count}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'storage' && (
          <Card>
            <CardHeader>
              <CardTitle>Storage Requests</CardTitle>
              <CardDescription>Manage user storage quota requests</CardDescription>
            </CardHeader>
            <CardContent>
              {storageRequests.length === 0 ? (
                <p className="py-8 text-center text-white/40">No storage requests yet</p>
              ) : (
                <div className="space-y-3">
                  {storageRequests.map((request) => (
                    <div key={request.id} className="file-row">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{request.user.username}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            request.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-white/40">
                          Requested: {request.requestedMb} MB
                          {request.reason && ` — ${request.reason}`}
                        </p>
                        <p className="text-xs text-white/30">
                          Current quota: {request.user.quotaMb} MB • {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApproveRequest(request.id)}
                            className="hover:bg-green-500/20 hover:text-green-400"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRejectRequest(request.id)}
                            className="hover:bg-red-500/20 hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;
