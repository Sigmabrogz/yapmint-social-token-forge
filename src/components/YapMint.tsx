
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Twitter, Zap, Coins } from 'lucide-react';
import { fetchYapsData, YapsData } from '@/services/kaitoApi';
import { useWeb3 } from '@/hooks/useWeb3';
import { mintYaps, getLastMintTime, getTokenBalance } from '@/services/contractService';

const YapMint = () => {
  const [twitterHandle, setTwitterHandle] = useState('');
  const [yapsData, setYapsData] = useState<YapsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [canMint, setCanMint] = useState(true);
  const [timeUntilNextMint, setTimeUntilNextMint] = useState(0);

  const { account, connect, isConnected } = useWeb3();

  useEffect(() => {
    if (account) {
      loadUserData();
    }
  }, [account]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeUntilNextMint > 0) {
      interval = setInterval(() => {
        setTimeUntilNextMint(prev => {
          if (prev <= 1) {
            setCanMint(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeUntilNextMint]);

  const loadUserData = async () => {
    if (!account) return;
    
    try {
      const balance = await getTokenBalance(account);
      setTokenBalance(balance);
      
      const lastMint = await getLastMintTime(account);
      const now = Math.floor(Date.now() / 1000);
      const cooldownPeriod = 24 * 60 * 60; // 24 hours
      const timeSinceLastMint = now - lastMint;
      
      if (timeSinceLastMint < cooldownPeriod) {
        setCanMint(false);
        setTimeUntilNextMint(cooldownPeriod - timeSinceLastMint);
      } else {
        setCanMint(true);
        setTimeUntilNextMint(0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleFetchYaps = async () => {
    if (!twitterHandle.trim()) {
      setError('Please enter a Twitter handle');
      return;
    }

    setIsLoading(true);
    setError('');
    setYapsData(null);

    try {
      const data = await fetchYapsData(twitterHandle.replace('@', ''));
      setYapsData(data);
    } catch (err) {
      setError('Failed to fetch Yaps data. Please check the username and try again.');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!yapsData || !account) {
      setError('Please fetch Yaps data first');
      return;
    }

    if (!canMint) {
      setError('You can only mint once every 24 hours');
      return;
    }

    setIsMinting(true);
    setError('');
    setSuccess('');

    try {
      const txHash = await mintYaps(twitterHandle.replace('@', ''), yapsData.yaps_l24h);
      setSuccess(`Successfully minted tokens! Transaction: ${txHash}`);
      await loadUserData(); // Refresh user data
    } catch (err: any) {
      setError(err.message || 'Failed to mint tokens');
      console.error('Mint error:', err);
    } finally {
      setIsMinting(false);
    }
  };

  const calculateMintAmount = (yaps: number): number => {
    const baseRate = 10;
    return Math.floor(baseRate * Math.log2(1 + yaps));
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              YapMint
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Mint $YAP tokens based on your Twitter attention score
          </p>
        </div>

        {/* Wallet Connection */}
        {!isConnected ? (
          <Card className="mb-6 bg-black/20 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <Button onClick={connect} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 bg-black/20 border-green-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Connected Account</p>
                  <p className="text-green-400 font-mono">{account?.slice(0, 6)}...{account?.slice(-4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">$YAP Balance</p>
                  <p className="text-cyan-400 font-bold text-lg">{tokenBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Interface */}
        <Card className="bg-black/20 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Twitter className="w-5 h-5 text-blue-400" />
              Fetch Yaps Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Twitter handle (e.g., VitalikButerin)"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="bg-black/30 border-gray-600 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleFetchYaps()}
              />
              <Button 
                onClick={handleFetchYaps}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
              </Button>
            </div>

            {error && (
              <Alert className="border-red-500/30 bg-red-900/20">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500/30 bg-green-900/20">
                <AlertDescription className="text-green-300">{success}</AlertDescription>
              </Alert>
            )}

            {yapsData && (
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/20">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">24h Yaps Score</p>
                    <p className="text-2xl font-bold text-cyan-400">{yapsData.yaps_l24h.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tokens to Mint</p>
                    <p className="text-2xl font-bold text-yellow-400">{calculateMintAmount(yapsData.yaps_l24h)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-purple-700/30 text-purple-300">
                    Rank: {yapsData.rank || 'N/A'}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-700/30 text-blue-300">
                    Score: {yapsData.score?.toFixed(2) || 'N/A'}
                  </Badge>
                </div>

                {!canMint && timeUntilNextMint > 0 && (
                  <Alert className="border-yellow-500/30 bg-yellow-900/20 mb-4">
                    <AlertDescription className="text-yellow-300">
                      Next mint available in: {formatTime(timeUntilNextMint)}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleMint}
                  disabled={!isConnected || isMinting || !canMint}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                >
                  {isMinting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Minting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Mint {calculateMintAmount(yapsData.yaps_l24h)} $YAP Tokens
                    </div>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Powered by Kaito API • Daily minting limit applies</p>
        </div>
      </div>
    </div>
  );
};

export default YapMint;
