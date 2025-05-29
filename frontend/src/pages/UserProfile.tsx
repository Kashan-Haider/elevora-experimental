import { useEffect, useState } from 'react';

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('access_token') || '';

      try {
        // Get user details
        const userRes = await fetch('http://localhost:8000/current-user', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error('Failed to load user');
        const userData = await userRes.json();
        setUser(userData.user);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-primary text-primaryText flex items-center justify-center px-4">
      <div className="max-w-3xl w-full bg-surface p-8 rounded-2xl shadow-xl border border-border">
        <h1 className="text-3xl font-semibold mb-4 text-primaryAccent">User Profile</h1>

        {error && <p className="text-error text-sm mb-4">{error}</p>}

        {user && (
          <div className="mb-6">
            <p><span className="text-secondaryText">Username:</span> {user.username}</p>
            <p><span className="text-secondaryText">Email:</span> {user.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}