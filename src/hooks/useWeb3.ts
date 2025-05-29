
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWeb3 = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [web3Provider, setWeb3Provider] = useState<any>(null);

  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          setWeb3Provider(window.ethereum);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const setupEventListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  };

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this dApp!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        setWeb3Provider(window.ethereum);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setIsConnected(false);
    setWeb3Provider(null);
  };

  return {
    account,
    isConnected,
    web3Provider,
    connect,
    disconnect
  };
};
