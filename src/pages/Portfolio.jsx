import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Wallet2, Copy, User, ArrowRight, Image } from 'lucide-react';
import Web3 from 'web3';

const Portfolio = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens');
  const [tokenBalances, setTokenBalances] = useState([]);
  const [nfts, setNfts] = useState([]);
  const navigate = useNavigate();

  const predefinedTokenContracts = [
    {
      name: 'Cleen Token',
      address: '0x975aE55f09d4C9c485d1D97C49C549BEF7a24504',
    }
  ];

  const nftContracts = [
    {
      name: 'Acleen NFT',
      address: '0xb7a6dDeE93EbDbC0c5398f7e370863D30e40D642',
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

    const fetchTokenBalances = async () => {
      if (profile?.wallet_address) {
        const infuraProjectId = import.meta.env.VITE_INFURA_PROJECT_ID;
        const infuraUrl = `https://sepolia.infura.io/v3/${infuraProjectId}`;
        const walletAddress = profile.wallet_address;
        const web3 = new Web3(infuraUrl);

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
            return 18;
          }
        };

        const balances = await Promise.all(
          predefinedTokenContracts.map(async (token) => {
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

            const decimals = await getTokenDecimals(token.address);
            const functionSignature = balanceOfABI[0].name + '(' + balanceOfABI[0].inputs.map(input => input.type).join(',') + ')';
            const functionHash = web3.utils.sha3(functionSignature).substring(0, 10);
            const data = functionHash + web3.utils.padLeft(walletAddress.slice(2), 64, '0');

            try {
              const response = await fetch(infuraUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  method: "eth_call",
                  params: [{
                    to: token.address,
                    data: data
                  }, "latest"],
                  id: 1
                })
              });

              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              const jsonResponse = await response.json();

              if (jsonResponse.error) {
                console.error(`Infura error for ${token.name}:`, jsonResponse.error);
                return { name: token.name, address: token.address, balance: 'Error', decimals };
              } else {
                const balance = web3.utils.hexToNumberString(jsonResponse.result);
                return { name: token.name, address: token.address, balance, decimals };
              }
            } catch (error) {
              console.error(`Error fetching balance for ${token.name}:`, error);
              return { name: token.name, address: token.address, balance: 'Error', decimals };
            }
          })
        );

        setTokenBalances(balances);
      }
    };

    const fetchNFTs = async () => {
      if (profile?.wallet_address) {
        const infuraProjectId = import.meta.env.VITE_INFURA_PROJECT_ID;
        const infuraUrl = `https://sepolia.infura.io/v3/${infuraProjectId}`;
        const walletAddress = profile.wallet_address.toLowerCase();
        const web3Instance = new Web3(infuraUrl);

        let allNFTs = [];

        for (const contract of nftContracts) {
          const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

          try {
            const response = await fetch(infuraUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_getLogs",
                params: [{
                  fromBlock: "0x0",
                  toBlock: "latest",
                  address: contract.address,
                  topics: [transferEventSignature, null, web3Instance.utils.padLeft(walletAddress, 64, '0')]
                }],
                id: 1
              })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const jsonResponse = await response.json();

            if (jsonResponse.error) {
              console.error(`Infura error for ${contract.name}:`, jsonResponse.error);
            } else {
              const logs = jsonResponse.result;
              const ownedTokenIds = logs.map(log => web3Instance.utils.hexToNumber(log.topics[3]));
              const nfts = ownedTokenIds.map(tokenId => ({
                name: contract.name,
                contractAddress: contract.address,
                tokenId: tokenId,
                title: `${contract.name} #${tokenId}`,
                description: `NFT from ${contract.name} with Token ID ${tokenId}`,
              }));
              allNFTs = allNFTs.concat(nfts);
            }
          } catch (error) {
            console.error(`Error fetching NFTs for ${contract.name}:`, error);
          }
        }
        setNfts(allNFTs);
      }
    };

    if (session?.user && profile?.wallet_address) {
      fetchTokenBalances();
      fetchNFTs();
    }

    if (session?.user) {
      fetchProfile();
    }
  }, [session, profile?.wallet_address]);

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
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy wallet address. Please try again.");
      }
    }
  };

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
              <button
                onClick={handleLogout}
                className="text-sm font-medium hover:text-blue-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl overflow-hidden">
          <div className="px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="User Avatar"
                    className="w-24 h-24 rounded-full border-4 border-white/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center">
                    <User className="text-white h-12 w-12" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-white">{profile?.full_name || 'Loading...'}</h1>
                  <p className="text-white/80 mt-1">Member since {joinDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Wallet2 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Wallet</h2>
                </div>
                <p className="text-gray-600 font-mono">{truncatedWalletAddress}</p>
                {profile?.wallet_address && (
                  <button 
                    onClick={handleCopyAddress}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 transition flex items-center"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? 'Copied!' : 'Copy address'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assets Tabs */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tokens')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tokens'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tokens
              </button>
              <button
                onClick={() => setActiveTab('nfts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nfts'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                NFTs
              </button>
            </nav>
          </div>

          {/* Token List */}
          {activeTab === 'tokens' && (
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tokenBalances.map((token, index) => {
                  const balance = token.balance === 'Error' 
                    ? 'Error' 
                    : (parseFloat(token.balance) / Math.pow(10, Number(token.decimals))).toFixed(2);
                  
                  return (
                    <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-500 transition">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{token.name}</h3>
                      <p className="text-sm text-gray-500 font-mono mb-4 truncate">{token.address}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-gray-900">{balance}</span>
                        <span className="text-gray-500">{token.name}</span>
                      </div>
                    </div>
                  );
                })}
                {tokenBalances.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No tokens found in this wallet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NFT Grid */}
          {activeTab === 'nfts' && (
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-500 transition">
                    <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                      {nft.imageUrl ? (
                        <img 
                          src={nft.imageUrl} 
                          alt={nft.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Image className="w-16 h-16 mb-2 text-blue-200" />
                          <div className="text-sm font-medium text-gray-400">NFT #{nft.tokenId}</div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">{nft.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{nft.description}</p>
                      <p className="text-xs font-mono text-gray-400 mt-2 truncate">{nft.contractAddress}</p>
                    </div>
                  </div>
                ))}
                {nfts.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No NFTs found in this wallet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;