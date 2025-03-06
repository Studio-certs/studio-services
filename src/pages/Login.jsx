import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const primaryColor = '#2d3748';
  const textColorLight = '#edf2f7';
  const textColorDark = '#2d3748';
  const backgroundColorLight = '#f7fafc';
  const backgroundColorDark = '#1a202c';
  const accentColor = '#3B82F6'; // Blue accent color

  // Add theme state to Login component
  const [theme, setTheme] = useState('light');

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? `bg-${backgroundColorDark} text-${textColorLight}` : `bg-${backgroundColorLight} text-${textColorDark}`}`}>
      <div className="w-1/2 flex items-center justify-center">
        <div className="w-full max-w-md px-8 py-12">
          <div className="mb-8">
            <h2 className={`text-3xl font-semibold text-center text-${textColorDark} dark:text-${textColorLight}`}>Welcome Back</h2>
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);

            try {
              const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
              });

              if (error) {
                setError(error.message);
              } else {
                // Redirect to home page or a protected route
                navigate('/');
              }
            } catch (err) {
              setError('An unexpected error occurred.');
            } finally {
              setLoading(false);
            }
          }}>
            <div className="mb-4">
              <label className={`block text-gray-700 text-sm font-bold mb-2 dark:text-${textColorLight}`} htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-100 dark:text-gray-800"
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label className={`block text-gray-700 text-sm font-bold mb-2 dark:text-${textColorLight}`} htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ top: '50%' }} />
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-100 dark:text-gray-800"
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <button
                className={`bg-${accentColor} w-full text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:shadow-outline`}
                type="submit"
                disabled={loading}
                style={{ backgroundColor: accentColor }}
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Right side with background image */}
      <div className="w-1/2 h-screen" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1519682337058-a94d519337bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />
    </div>
  );
};

export default Login;
