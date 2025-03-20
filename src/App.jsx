import React from 'react';
import { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Portfolio from './pages/Portfolio';
import TokenExchange from './components/TokenExchange';

function App() {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const services = [
    {
      name: 'Limodali',
      description: 'Empowering individuals through an intuitive and engaging online learning experience. Explore a world of knowledge with our innovative platform.',
      link: 'https://dev.limodali.com/',
      image: 'https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_IldUlQnEHZAI.png',
      tags: ['Education', 'Technology']
    },
    {
      name: 'Cleen Token',
      description: 'Facilitating secure and efficient cryptocurrency exchange with a user-centric platform. Experience seamless trading and investment opportunities.',
      link: 'https://cleen-token.netlify.app/',
      image: 'https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_zkUxwypfCYMQ.png',
      tags: ['Blockchain', 'Finance']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img
                src="https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_hksQdQJp7c64.png"
                alt="YourBrand Logo"
                className="h-8 w-8 mr-2"
              />
            </Link>

            <div className="flex items-center space-x-6">
              {session?.user ? (
                <>
                  <Link 
                    to="/portfolio" 
                    className="text-sm font-medium hover:text-blue-600 transition"
                  >
                    Portfolio
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium hover:text-blue-600 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
        />
        <div className="relative z-10 container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Transform Your Business with Innovative IT Solutions
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              We deliver cutting-edge technology solutions that empower your business to thrive in the digital landscape.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="#services" 
                className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                Explore Our Services
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-16 text-center">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-10">
            {services.map((service, index) => (
              <div 
                key={index}
                className="group rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition"
              >
                <a href={service.link} target="_blank" rel="noopener noreferrer">
                  <div className="relative h-64">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 p-6">
                      <h3 className="text-2xl font-semibold text-white mb-2">{service.name}</h3>
                      <div className="flex gap-2 mb-3">
                        {service.tags.map((tag, tagIndex) => (
                          <span 
                            key={tagIndex}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600">{service.description}</p>
                    <div className="mt-4 flex items-center text-blue-600 font-medium">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Token Exchange Section */}
      <TokenExchange />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Ready to Transform Your Business?</h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of businesses that trust us with their digital transformation journey.
          </p>
          <a 
            href="#contact" 
            className="inline-flex items-center px-8 py-4 rounded-lg bg-white text-blue-600 font-semibold hover:bg-gray-100 transition"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <img
                  src="https://studio-bucket.s3-ap-southeast-2.amazonaws.com/image/profilePicture/original/Profile_hksQdQJp7c64.png"
                  alt="YourBrand Logo"
                  className="h-8 w-8"
                />
              </div>
              <p className="text-gray-600">
                Empowering businesses through innovative technology solutions.
              </p>
            </div>
            <div>
              <h3 className="text-gray-900 text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-600 hover:text-blue-600 transition">About Us</a></li>
                <li><a href="#careers" className="text-gray-600 hover:text-blue-600 transition">Careers</a></li>
                <li><a href="#contact" className="text-gray-600 hover:text-blue-600 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="#consulting" className="text-gray-600 hover:text-blue-600 transition">Consulting</a></li>
                <li><a href="#development" className="text-gray-600 hover:text-blue-600 transition">Development</a></li>
                <li><a href="#security" className="text-gray-600 hover:text-blue-600 transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 text-lg font-semibold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="#twitter" className="text-gray-600 hover:text-blue-600 transition">Twitter</a></li>
                <li><a href="#linkedin" className="text-gray-600 hover:text-blue-600 transition">LinkedIn</a></li>
                <li><a href="#github" className="text-gray-600 hover:text-blue-600 transition">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-600">
            <p>© {new Date().getFullYear()} All rights reserved.</p>
          </div>
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