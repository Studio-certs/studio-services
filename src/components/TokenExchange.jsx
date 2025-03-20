import React, { useState, useEffect } from 'react';
import { ArrowDown, Wallet2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Web3 from 'web3';
import { useNavigate } from 'react-router-dom';
import Notification from './Notification';

const TokenExchange = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cleenTokenBalance, setCleenTokenBalance] = useState('0');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenTypes, setTokenTypes] = useState([
    { id: '1', name: 'Studio Coins', symbol: 'STUDIO', conversion_rate: '100' }
  ]);
  const [selectedTokenType, setSelectedTokenType] = useState('');
  const [conversionRate, setConversionRate] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  // Cleen Token contract details
  const CLEEN_TOKEN_ADDRESS = '0x975aE55f09d4C9c485d1D97C49C549BEF7a24504';
  const CLEEN_TOKEN_SYMBOL = 'CLEEN';
  const CLEEN_TOKEN_NAME = 'Cleen Token';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });
  }, []);

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

    try {
      const contract = new web3.eth.Contract(balanceOfABI, CLEEN_TOKEN_ADDRESS);
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
    // Remove any decimal points and non-numeric characters
    value = value.replace(/[^\d]/g, '');
    
    if (value === '') {
      setFromAmount('');
      setToAmount('');
      return;
    }

    // Convert to integer
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      setFromAmount('');
      setToAmount('');
      return;
    }

    // Ensure it's not negative
    if (numValue < 0) {
      setFromAmount('');
      setToAmount('');
      return;
    }

    // Check if exceeds balance
    if (numValue > parseInt(cleenTokenBalance)) {
      value = cleenTokenBalance;
    }

    setFromAmount(value);

    // Update the "To" amount if a token is selected
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

  const handleExchange = async () => {
    if (!session) {
      navigate('/login');
      return;
    }

    if (!fromAmount || !toAmount || !selectedTokenType) return;

    if (parseInt(fromAmount) > parseInt(cleenTokenBalance)) {
      showNotification('Insufficient balance', 'error');
      return;
    }

    setLoading(true);
    try {
      // Simulate exchange success
      setTimeout(() => {
        const selectedToken = tokenTypes.find(token => token.id === selectedTokenType);
        showNotification(`Successfully added ${toAmount} ${selectedToken?.name} to your wallet!`, 'success');
        setFromAmount('');
        setToAmount('');
        setSelectedTokenType('');
        setConversionRate(null);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Exchange error:', error);
      showNotification('Failed to exchange tokens. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
      
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Exchange Tokens</h2>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* From Token (Cleen Token) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">From</label>
                {session && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Wallet2 className="h-4 w-4 mr-1" />
                    Balance: {cleenTokenBalance} CLEEN
                  </div>
                )}
              </div>
              <div className="flex space-x-4">
                <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg text-gray-700">
                  {CLEEN_TOKEN_NAME} ({CLEEN_TOKEN_SYMBOL})
                </div>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0"
                  min="1"
                  step="1"
                  className="flex-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Arrow Icon */}
            <div className="flex justify-center my-6">
              <div className="bg-gray-100 p-3 rounded-full">
                <ArrowDown className="h-6 w-6 text-gray-400" />
              </div>
            </div>

            {/* To Token */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">To</label>
              </div>
              <div className="flex space-x-4">
                <select
                  value={selectedTokenType}
                  onChange={(e) => handleTokenTypeChange(e.target.value)}
                  className="flex-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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
                  className="flex-1 rounded-lg bg-gray-50 border-gray-300"
                />
              </div>
            </div>

            {/* Conversion Rate Display */}
            {conversionRate !== null && (
              <div className="mt-6 mb-4 py-3 px-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  Exchange Rate: 1 CLEEN = {conversionRate} {
                    tokenTypes.find(token => token.id === selectedTokenType)?.name
                  }
                </p>
              </div>
            )}

            {/* Exchange Button */}
            <button
              onClick={handleExchange}
              disabled={!fromAmount || !toAmount || !selectedTokenType || loading || !session}
              className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
    </section>
  );
};

export default TokenExchange;