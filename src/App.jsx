import React from 'react';
import { useState, useEffect } from 'react';
import { Moon, Sun, ArrowRight } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Portfolio from './pages/Portfolio';
import { CheckCircle } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState('light');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800');
  };

  const primaryColor = '#2d3748';
  const secondaryColor = '#4a5568';
  const textColorLight = '#edf2f7';
  const textColorDark = '#2d3748';
  const backgroundColorLight = '#f7fafc';
  const backgroundColorDark = '#1a202c';

  const services = [
    {
      name: 'Limodali',
      description: 'Empowering individuals through an intuitive and engaging online learning experience. Explore a world of knowledge with our innovative platform.',
      link: 'https://dev.limodali.com/',
      image: 'https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_IldUlQnEHZAI.png',
    },
    {
      name: 'Cleen Token',
      description: 'Facilitating secure and efficient cryptocurrency exchange with a user-centric platform. Experience seamless trading and investment opportunities.',
      link: 'https://cleen-token.netlify.app/',
      image: 'https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_zkUxwypfCYMQ.png',
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? `bg-${backgroundColorDark} text-${textColorLight}` : `bg-${backgroundColorLight} text-${textColorDark}`}`}>
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

      {/* Hero Section */}
      <section
        className="w-full"
        style={{
          backgroundImage: `url('https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_8pspIAZxQVyu.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '50vh',
        }}
      >
        <div className="container mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-white mb-6">
                Transform Your Business with Innovative IT Solutions
              </h1>
              <p className="text-lg text-gray-200 mb-8">
                We deliver cutting-edge technology solutions that empower your business to thrive in the digital landscape.
              </p>
              <a href="/services" className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-4 px-8 rounded-xl shadow-md inline-flex items-center">
                Explore Our Services <ArrowRight className="inline-block ml-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto mt-20 px-6">
        <h2 className={`text-3xl font-semibold mb-8 dark:text-${textColorLight}`}>Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {services.map((service, index) => (
            <div key={index} className={`bg-white rounded-2xl shadow-lg dark:bg-${backgroundColorDark}`}>
              <a href={service.link} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={service.image}
                  alt={service.name}
                  className="rounded-t-2xl h-48 w-full object-cover"
                />
                <div className="p-8">
                  <h3 className={`text-2xl font-semibold mb-4 dark:text-${textColorLight}`}>{service.name}</h3>
                  <p className={`text-${textColorDark} dark:text-${textColorLight}`}>{service.description}</p>
                </div>
              </a>
            </div>
          ))}
        </div>
      </section>

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
}

function Root() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<App />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
    </Router>
  );
}

export default Root;
