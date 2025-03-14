import React, { useState, useEffect } from 'react';
import { CheckCircle, Moon, Sun, Wallet2, Book, GraduationCap, Clock, Copy, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Web3 from 'web3';

const Portfolio = () => {
  const [theme, setTheme] = useState('light');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens');
  const [tokenBalances, setTokenBalances] = useState([]);
  const [nfts, setNfts] = useState([]);

  const predefinedTokenContracts = [
    {
      name: 'Cleen Token',
      address: '0x975aE55f09d4C9c485d1D97C49C549BEF7a24504', // Replace with actual contract address
    }
  ];

  const nftContracts = [
    {
      name: 'Acleen NFT',
      address: '0xb7a6dDeE93EbDbC0c5398f7e370863D30e40D642', // Replace with actual contract address
    },
  ];

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

    const fetchTokenBalances = async () => {
      if (profile?.wallet_address) {
        const infuraProjectId = import.meta.env.VITE_INFURA_PROJECT_ID;
        const infuraUrl = `https://sepolia.infura.io/v3/${infuraProjectId}`;
        const walletAddress = profile.wallet_address;

        // Initialize web3 instance
        const web3 = new Web3(infuraUrl);

        // Function to fetch token decimals
        const getTokenDecimals = async (tokenAddress) => {
          const decimalsABI = [
            {
              "constant": true,
              "inputs": [],
              "name": "decimals",
              "outputs": [{ "name": "", "type": "uint8" }],
              "payable": false,
              "stateMutability": "view",
              "type": "function"
            }
          ];
          const contract = new web3.eth.Contract(decimalsABI, tokenAddress);
          try {
            const decimals = await contract.methods.decimals().call();
            return decimals;
          } catch (error) {
            console.error(`Error fetching decimals for ${tokenAddress}:`, error);
            return 18; // Default to 18 if fetching fails
          }
        };

        const balances = await Promise.all(
          predefinedTokenContracts.map(async (token) => {
            // ABI for balanceOf function
            const balanceOfABI = [
              {
                "constant": true,
                "inputs": [{ "name": "_owner", "type": "address" }],
                "name": "balanceOf",
                "outputs": [{ "name": "balance", "type": "uint256" }],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
              }
            ];

            // Fetch token decimals
            const decimals = await getTokenDecimals(token.address);

            // Construct the data payload for the balanceOf function call
            const functionSignature = balanceOfABI[0].name + '(' + balanceOfABI[0].inputs.map(input => input.type).join(',') + ')';
            const functionHash = web3.utils.sha3(functionSignature).substring(0, 10);
            const data = functionHash + web3.utils.padLeft(walletAddress.slice(2), 64, '0');

            const payload = {
              jsonrpc: "2.0",
              method: "eth_call",
              params: [{
                to: token.address,
                data: data
              }, "latest"],
              id: 1
            };

            try {
              const response = await fetch(infuraUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const jsonResponse = await response.json();

              if (jsonResponse.error) {
                console.error(`Infura error for ${token.name}:`, jsonResponse.error);
                return { name: token.name, address: token.address, balance: 'Error', decimals: decimals };
              } else {
                const balance = web3.utils.hexToNumberString(jsonResponse.result);
                return { name: token.name, address: token.address, balance: balance, decimals: decimals };
              }
            } catch (error) {
              console.error(`Error fetching balance for ${token.name}:`, error);
              return { name: token.name, address: token.address, balance: 'Error', decimals: decimals };
            }
          })
        );

        setTokenBalances(balances);
      } else {
        setTokenBalances([]);
      }
    };

    const fetchNFTs = async () => {
      if (profile?.wallet_address) {
        const infuraProjectId = import.meta.env.VITE_INFURA_PROJECT_ID;
        const infuraUrl = `https://sepolia.infura.io/v3/${infuraProjectId}`;
        const walletAddress = profile.wallet_address.toLowerCase(); // Convert to lowercase for comparison

        // Initialize web3 instance
        const web3Instance = new Web3(infuraUrl);

        let allNFTs = [];

        for (const contract of nftContracts) {
          // ERC-721 Transfer event signature
          const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

          const payload = {
            jsonrpc: "2.0",
            method: "eth_getLogs",
            params: [{
              fromBlock: "0x0", // Fetch from the beginning
              toBlock: "latest",
              address: contract.address,
              topics: [transferEventSignature, null, web3Instance.utils.padLeft(walletAddress, 64, '0')] // Filter for Transfer events where the 'to' address is the user's wallet
            }],
            id: 1
          };

          try {
            const response = await fetch(infuraUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonResponse = await response.json();

            if (jsonResponse.error) {
              console.error(`Infura error for ${contract.name}:`, jsonResponse.error);
            } else {
              const logs = jsonResponse.result;
              // Extract token IDs from the logs (assuming ERC-721)
              const ownedTokenIds = logs.map(log => web3Instance.utils.hexToNumber(log.topics[3]));

              // For simplicity, just store the contract address and tokenId. In a real application, you'd likely want to fetch metadata for each NFT.
              const nfts = ownedTokenIds.map(tokenId => ({
                name: contract.name,
                contractAddress: contract.address,
                tokenId: tokenId,
                title: `${contract.name} #${tokenId}`, // Create a basic title
                description: `NFT from ${contract.name} with Token ID ${tokenId}`, // Create a basic description
                imageUrl: null, // Replace with a default image or fetch from a metadata service
              }));
              allNFTs = allNFTs.concat(nfts);
            }
          } catch (error) {
            console.error(`Error fetching NFTs for ${contract.name}:`, error);
          }
        }
        setNfts(allNFTs);
      } else {
        setNfts([]);
      }
    };

    if (session?.user && profile?.wallet_address) {
      fetchTokenBalances();
      fetchNFTs();
    }

    if (session?.user) {
      fetchProfile();
      fetchCourses();
    }
  }, [session, profile?.wallet_address]);

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
    : 'Wallet not connected';

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
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="User Avatar"
                  className="rounded-full w-24 h-24 mr-6"
                />
              ) : (
                <div className="rounded-full w-24 h-24 mr-6 bg-gray-400 flex items-center justify-center">
                  <User className="text-white h-12 w-12" />
                </div>
              )}
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
                {profile?.wallet_address && (
                  <button onClick={handleCopyAddress} className="text-blue-500 text-sm flex items-center">
                    Copy address
                    {copied && <CheckCircle className="ml-1 h-4 w-4 text-green-500" />}
                  </button>
                )}
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
            <h3 className="text-lg font-semibold mb-4">Token Balances</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tokenBalances.length > 0 ? (
                tokenBalances.map((token, index) => {
                  const balance = token.balance === 'Error' ? 'Error' : (parseFloat(token.balance) / Math.pow(10, Number(token.decimals))).toFixed(2);
                  return (
                    <div key={index} className={`bg-white rounded-2xl shadow-md p-6 flex flex-col dark:bg-${backgroundColorDark} dark:border dark:border-${primaryColor}`}>
                      <h4 className={`text-xl font-semibold mb-2 dark:text-${textColorLight}`}>{token.name}</h4>
                      <p className={`text-gray-600 text-sm mb-2 dark:text-${textColorLight}`}>Address: {token.address}</p>
                      <p className={`text-gray-700 dark:text-${textColorLight}`}>
                        Balance: <span className="font-bold">{balance}</span>
                      </p>
                    </div>
                  );
                })
              ) : (
                <p>No token balances found for this wallet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nfts' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">NFTs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nfts.length > 0 ? (
                nfts.map((nft, index) => (
                  <div key={index} className={`bg-white rounded-2xl shadow-md p-4 dark:bg-${backgroundColorDark} dark:border dark:border-${primaryColor} flex flex-col`}>
                    {nft.imageUrl ? (
                      <img src={nft.imageUrl} alt={nft.title} className="w-full h-32 object-cover rounded-md mb-2" />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                        <span>No Image</span>
                      </div>
                    )}
                    <p className={`font-semibold dark:text-${textColorLight}`}>{nft.title || 'Untitled'}</p>
                    <p className={`text-sm dark:text-${textColorLight}`}>{nft.description || 'No description'}</p>
                    <p className="text-xs text-gray-500">Contract: {nft.contractAddress}</p>
                  </div>
                ))
              ) : (
                <p>No NFTs found for this wallet.</p>
              )}
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
