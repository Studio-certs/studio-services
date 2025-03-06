import React, { useState, useEffect } from 'react';
import { CheckCircle, Moon, Sun, Wallet2, Book, GraduationCap, Clock, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Portfolio = () => {
  const [theme, setTheme] = useState('light');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens');

  const [tokens, setTokens] = useState([
    { name: 'Token A', balance: 100 },
    { name: 'Token B', balance: 50 },
    { name: 'Token C', balance: 200 },
  ]);

  const [nfts, setNfts] = useState([
    { name: 'NFT 1', image: 'https://via.placeholder.com/150' },
    { name: 'NFT 2', image: 'https://via.placeholder.com/150' },
    { name: 'NFT 3', image: 'https://via.placeholder.com/150' },
  ]);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      });

    supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
    });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(profileData);
        }
      }
    };

    const fetchCourses = async () => {
      // Replace 'course_enrollments' with the actual table name if different
      const { data: courseData, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', session?.user?.id);

      if (error) {
        console.error('Error fetching courses:', error);
      } else {
        setCourses(courseData);
      }
    };

    if (session?.user) {
      fetchProfile();
      fetchCourses();
    }
  }, [session]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const primaryColor = '#2d3748';
  const secondaryColor = '#4a5568';
  const textColorLight = '#edf2f7';
  const textColorDark = '#2d3748';
  const backgroundColorLight = '#f7fafc';
  const backgroundColorDark = '#1a202c';
  const accentColor = '#7928CA';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  }) : 'Loading...';

  const truncatedWalletAddress = profile?.wallet_address
    ? `${profile.wallet_address.substring(0, 6)}...${profile.wallet_address.substring(profile.wallet_address.length - 4)}`
    : '0x...';

  const handleCopyAddress = async () => {
    if (profile?.wallet_address) {
      try {
        await navigator.clipboard.writeText(profile.wallet_address);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
        // Handle the error gracefully, e.g., show an alert to the user
        alert("Failed to copy wallet address. Please try again.");
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? `bg-${backgroundColorDark} text-${textColorLight}` : `bg-${backgroundColorLight} text-${textColorDark}`}`}>
      {/* Navigation Bar */}
      <header className={`shadow dark:bg-${backgroundColorDark} dark:border-b dark:border-${primaryColor} bg-white`}>
        <nav className="container mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className={`flex items-center text-xl font-semibold text-${textColorDark} dark:text-${textColorLight}`}>
              <img
                src="https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_hksQdQJp7c64.png"
                alt="YourBrand Logo"
                className="h-8 w-8 mr-2"
              />
            </Link>
          </div>

          {/* Login Link */}
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="focus:outline-none">
              {theme === 'light' ? <Moon className="h-5 w-5 text-gray-800 dark:text-white" /> : <Sun className="h-5 w-5 text-white" />}
            </button>
            {session?.user ? (
              <>
                <Link className={`text-${textColorDark} dark:text-${textColorLight}`} to="/portfolio">Portfolio</Link>
                <button
                  className={`text-${textColorDark} dark:text-${textColorLight}`}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link className={`text-${textColorDark} dark:text-${textColorLight}`} to="/login">Login</Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-grow">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-3xl py-12 px-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={profile?.avatar_url || "https://images.unsplash.com/photo-1570295999680-b97e19f2ca62?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80"}
                alt="User Avatar"
                className="rounded-full w-24 h-24 mr-6"
              />
              <div>
                <h2 className="text-3xl font-semibold">{profile?.full_name || 'Loading...'}</h2>
                <p className="text-gray-200">Joined {joinDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Wallet</p>
                <p className="text-sm">{truncatedWalletAddress}</p>
                <button onClick={handleCopyAddress} className="text-blue-500 text-sm flex items-center">
                  Copy address
                  {copied && <CheckCircle className="ml-1 h-4 w-4 text-green-500" />}
                </button>
              </div>
              <Wallet2 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tokens')}
              className={`py-4 px-1 border-b-2 ${activeTab === 'tokens' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap text-sm font-medium`}
            >
              Tokens
            </button>
            <button
              onClick={() => setActiveTab('nfts')}
              className={`py-4 px-1 border-b-2 ${activeTab === 'nfts' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap text-sm font-medium`}
            >
              NFTs
            </button>
          </nav>
        </div>

        {/* Display content based on active tab */}
        {activeTab === 'tokens' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Tokens</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tokens.map((token, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-md p-4">
                  <p className="font-semibold">{token.name}</p>
                  <p>Balance: {token.balance}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'nfts' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">NFTs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nfts.map((nft, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-md p-4">
                  <img src={nft.image} alt={nft.name} className="w-full h-32 object-cover rounded-md mb-2" />
                  <p className="font-semibold">{nft.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`bg-white py-6 dark:bg-${backgroundColorDark} dark:border-t dark:border-${primaryColor} w-full mt-12`}>
        <div className="container mx-auto px-6 text-center">
          <p className={`text-${secondaryColor} dark:text-${textColorLight}`}>
            © {new Date().getFullYear()} YourBrand. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
