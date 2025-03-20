import React, { useState, useEffect } from 'react';
import { ArrowDown, Wallet2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Web3 from 'web3';
import { Link, useNavigate } from 'react-router-dom';
import Notification from './Notification';

const TokenExchange = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cleenTokenBalance, setCleenTokenBalance] = useState('0');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenTypes, setTokenTypes] = useState([]);
  const [selectedTokenType, setSelectedTokenType] = useState('');
  const [conversionRate, setConversionRate] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  const CLEEN_TOKEN_ADDRESS = '0x975aE55f09d4C9c485d1D97C49C549BEF7a24504';
  const ADMIN_WALLET_ADDRESS = Web3.utils.toChecksumAddress('0x1C85f5520Ca012d9394e5349Db223fBeab6d6d30');
  const CLEEN_TOKEN_SYMBOL = 'CLEEN';
  const CLEEN_TOKEN_NAME = 'Cleen Token';

  // Token ABI for transfer function
  const TOKEN_ABI = [
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "balance",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // Session management
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (!session) {
          navigate('/login');
        } else {
          fetchProfile(session.user.id);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/login');
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchTokenTypes();
  }, []);

  const fetchTokenTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('token_types')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching token types:', error);
        showNotification('Failed to load token types', 'error');
        return;
      }

      setTokenTypes(data || []);
    } catch (error) {
      console.error('Error fetching token types:', error);
      showNotification('Failed to load token types', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      if (data?.wallet_address) {
        fetchCleenTokenBalance(data.wallet_address);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCleenTokenBalance = async (walletAddress) => {
    if (!walletAddress) return;

    const infuraProjectId = import.meta.env.VITE_INFURA_PROJECT_ID;
    const infuraUrl = `https://sepolia.infura.io/v3/${infuraProjectId}`;
    const web3 = new Web3(infuraUrl);

    try {
      const contract = new web3.eth.Contract(TOKEN_ABI, CLEEN_TOKEN_ADDRESS);
      const balance = await contract.methods.balanceOf(walletAddress).call();
      const formattedBalance = web3.utils.fromWei(balance, 'ether');
      setCleenTokenBalance(Math.floor(parseFloat(formattedBalance)).toString());
    } catch (error) {
      console.error('Error fetching Cleen Token balance:', error);
      setCleenTokenBalance('0');
    }
  };

  const calculateConversionRate = (selectedToken) => {
    if (!selectedToken) return null;
    const rate = Math.floor(parseFloat(selectedToken.conversion_rate));
    setConversionRate(rate);
    return rate;
  };

  const updateToAmount = (fromValue, selectedToken) => {
    if (!fromValue || !selectedToken) {
      setToAmount('');
      return;
    }

    const rate = calculateConversionRate(selectedToken);
    if (rate === null) {
      setToAmount('');
      return;
    }

    const convertedAmount = Math.floor(parseInt(fromValue) * rate);
    setToAmount(convertedAmount.toString());
  };

  const handleFromAmountChange = (value) => {
    value = value.replace(/[^\d]/g, '');
    
    if (value === '') {
      setFromAmount('');
      setToAmount('');
      return;
    }

    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      setFromAmount('');
      setToAmount('');
      return;
    }

    if (numValue < 0) {
      setFromAmount('');
      setToAmount('');
      return;
    }

    if (numValue > parseInt(cleenTokenBalance)) {
      value = cleenTokenBalance;
    }

    setFromAmount(value);

    if (selectedTokenType) {
      const selectedToken = tokenTypes.find(token => token.id === selectedTokenType);
      updateToAmount(value, selectedToken);
    }
  };

  const handleTokenTypeChange = (tokenTypeId) => {
    setSelectedTokenType(tokenTypeId);
    
    if (tokenTypeId === '') {
      setConversionRate(null);
      setToAmount('');
      return;
    }

    const selectedToken = tokenTypes.find(token => token.id === tokenTypeId);
    if (selectedToken) {
      updateToAmount(fromAmount, selectedToken);
    }
  };

  const truncateHash = (hash) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  const updateUserWallet = async (userId, tokenTypeId, amount) => {
    try {
      // First, check if the user already has a wallet entry for this token type
      const { data: existingWallet, error: fetchError } = await supabase
        .from('user_wallets')
        .select('tokens')
        .eq('user_id', userId)
        .eq('token_type_id', tokenTypeId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw fetchError;
      }

      if (existingWallet) {
        // Update existing wallet entry
        const newAmount = parseFloat(existingWallet.tokens) + parseFloat(amount);
        const { error: updateError } = await supabase
          .from('user_wallets')
          .update({ tokens: newAmount })
          .eq('user_id', userId)
          .eq('token_type_id', tokenTypeId);

        if (updateError) throw updateError;
      } else {
        // Insert new wallet entry
        const { error: insertError } = await supabase
          .from('user_wallets')
          .insert([
            {
              user_id: userId,
              token_type_id: tokenTypeId,
              tokens: amount
            }
          ]);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating user wallet:', error);
      throw new Error('Failed to update user wallet');
    }
  };

  const handleExchange = async () => {
    if (!session) {
      navigate('/login');
      return;
    }

    if (!fromAmount || !toAmount || !selectedTokenType || !profile?.wallet_address) return;

    if (parseInt(fromAmount) > parseInt(cleenTokenBalance)) {
      showNotification('Insufficient balance', 'error');
      return;
    }

    setLoading(true);
    try {
      // Connect to Web3 with MetaMask
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create contract instance
      const contract = new web3.eth.Contract(TOKEN_ABI, CLEEN_TOKEN_ADDRESS);

      // Convert amount to wei
      const amountInWei = web3.utils.toWei(fromAmount.toString(), 'ether');

      // Ensure addresses are checksummed
      const fromAddress = Web3.utils.toChecksumAddress(profile.wallet_address);

      // Send transaction
      const transaction = await contract.methods
        .transfer(ADMIN_WALLET_ADDRESS, amountInWei)
        .send({ from: fromAddress });

      // Update user wallet in database
      await updateUserWallet(session.user.id, selectedTokenType, toAmount);

      const selectedToken = tokenTypes.find(token => token.id === selectedTokenType);
      showNotification(
        `Successfully exchanged ${fromAmount} CLEEN for ${toAmount} ${selectedToken?.name}! Tx: ${truncateHash(transaction.transactionHash)}`,
        'success'
      );

      // Reset form
      setFromAmount('');
      setToAmount('');
      setSelectedTokenType('');
      setConversionRate(null);

      // Refresh balance
      fetchCleenTokenBalance(profile.wallet_address);
    } catch (error) {
      console.error('Exchange error:', error);
      showNotification(error.message || 'Failed to exchange tokens. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error.message);
      showNotification('Failed to log out. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
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
            </div>
          </div>
        </nav>
      </header>

      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
      
      <main className="min-h-[calc(100vh-136px)] flex items-center justify-center py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white text-center">Exchange Tokens</h2>
              </div>

              <div className="p-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">From</label>
                    {session && (
                      <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                        <Wallet2 className="h-4 w-4 mr-1" />
                        Balance: {cleenTokenBalance} CLEEN
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex-1 px-4 py-3 bg-blue-50 rounded-xl font-medium text-blue-700 border border-blue-100">
                      {CLEEN_TOKEN_NAME} ({CLEEN_TOKEN_SYMBOL})
                    </div>
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      placeholder="0"
                      min="1"
                      step="1"
                      className="flex-1 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="flex justify-center my-8">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full shadow-lg">
                    <ArrowDown className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">To</label>
                  </div>
                  <div className="flex space-x-4">
                    <select
                      value={selectedTokenType}
                      onChange={(e) => handleTokenTypeChange(e.target.value)}
                      className="flex-1 rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    >
                      <option value="">Select Token</option>
                      {tokenTypes
                        .filter(token => token.symbol !== 'CLEEN')
                        .map(token => (
                          <option key={token.id} value={token.id}>
                            {token.name}
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      value={toAmount}
                      readOnly
                      placeholder="0"
                      className="flex-1 rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                {conversionRate !== null && (
                  <div className="mt-6 py-3 px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100/50">
                    <p className="text-sm text-gray-600 text-center font-medium">
                      Exchange Rate: 1 CLEEN = {conversionRate} {
                        tokenTypes.find(token => token.id === selectedTokenType)?.name
                      }
                    </p>
                  </div>
                )}

                <button
                  onClick={handleExchange}
                  disabled={!fromAmount || !toAmount || !selectedTokenType || loading || !session}
                  className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                >
                  {!session ? 'Connect Wallet to Exchange' : loading ? 'Exchanging...' : 'Exchange Tokens'}
                </button>

                {!session && (
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    Please log in to exchange tokens
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-6">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TokenExchange;