import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/constants';

const smart_chainfundContext = createContext();

export const smart_chainfundProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [connectionType, setConnectionType] = useState('');

  useEffect(() => {
    loadLocalAccounts();
  }, []);

  // ================= ML FUNCTION =================
  const getPrediction = async (formData) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          goal: formData.goal,
          duration: formData.duration,
          backers: 10,
          updates: 2,
          comments: 5,
          shares: 20,
          has_video: formData.hasVideo ? 1 : 0,
          images: 2,
          words: 100
        })
      });

      const result = await response.json();

      console.log("ML Prediction Result:", result);

      return result;
    } catch (error) {
      console.error("ML Error:", error);
      return null;
    }
  };

  // ================= LOAD ACCOUNTS =================
  const loadLocalAccounts = async () => {
    try {
      const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
      const localProvider = new ethers.JsonRpcProvider(rpcUrl);

      const accounts = [];
      for (let i = 0; i < 5; i++) {
        try {
          const wallet = ethers.Wallet.createRandom().connect(localProvider);
          const balance = await localProvider.getBalance(wallet.address);

          accounts.push({
            index: i,
            address: wallet.address,
            balance: ethers.formatEther(balance),
            signer: wallet
          });
        } catch {}
      }

      setAvailableAccounts(accounts);
    } catch (error) {
      console.error(error);
    }
  };

  // ================= METAMASK =================
  const connectMetaMask = async () => {
    try {
      if (!window.ethereum) {
        alert("Install MetaMask");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      setProvider(provider);
      setSigner(signer);
      setCurrentAccount(address);
      setBalance(ethers.formatEther(balance));
      setConnectionType('metamask');

    } catch (error) {
      console.error(error);
    }
  };

  // ================= LOCAL WALLET =================
  const connectLocalWallet = async (privateKey) => {
  try {
    if (!privateKey || privateKey.length < 64) {
      alert("❌ Invalid Private Key");
      return;
    }

    let key = privateKey.trim();
    if (!key.startsWith('0x')) key = '0x' + key;

    const rpcUrl = "http://127.0.0.1:8545"; // IMPORTANT: use Hardhat
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const wallet = new ethers.Wallet(key, provider);

    setProvider(provider);
    setSigner(wallet);
    setCurrentAccount(wallet.address);
    setConnectionType('local');

    const balance = await provider.getBalance(wallet.address);
    setBalance(ethers.formatEther(balance));

    console.log("✅ Local wallet connected");

  } catch (error) {
    console.error("❌ Invalid Private Key:", error);
    alert("Invalid Private Key - connection failed");
    return; // ⛔ STOP execution
  }
};

  // ================= CREATE CAMPAIGN =================
  const createCampaign = async (form) => {
  try {
    if (!signer) {
      alert('Please connect wallet first!');
      return;
    }

    console.log('📝 Creating campaign...', form);

    // 🧠 STEP 1: ML Prediction
    const prediction = await getPrediction({
      goal: form.target,
      duration: 30,
      hasVideo: true
    });

    if (prediction) {
      alert(`
📊 Smart ChainFund Analysis

Status: ${prediction.status}
Probability: ${(prediction.probability * 100).toFixed(2)}%
Confidence: ${prediction.confidence}%

Suggestions:
${prediction.suggestions.join("\n")}
`);
    }

    // 🔗 STEP 2: Blockchain
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    const deadline = new Date(form.deadline).getTime();

    const tx = await contract.createCampaign(
      currentAccount,
      form.title,
      form.description,
      ethers.parseEther(form.target.toString()),
      deadline,
      form.image || ''
    );

    console.log('⏳ Waiting for confirmation...');
    await tx.wait();

    console.log('✅ Campaign created!');
    return tx;

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

  // ================= GET CAMPAIGNS =================
  const getCampaigns = async () => {
    try {
      const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const campaigns = await contract.getCampaigns();

      return campaigns.map((c, i) => ({
        owner: c.owner,
        title: c.title,
        description: c.description,
        target: ethers.formatEther(c.target),
        deadline: Number(c.deadline),
        amountCollected: ethers.formatEther(c.amountCollected),
        image: c.image,
        pId: i
      }));

    } catch (error) {
      console.error(error);
      return [];
    }
  };

  // ================= DONATE =================
  const donate = async (pId, amount) => {
    try {
      if (!signer) return alert("Connect wallet");

      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.donateToCampaign(pId, {
        value: ethers.parseEther(amount)
      });

      await tx.wait();
    } catch (error) {
      console.error(error);
    }
  };

  // ================= CONTEXT =================
  return (
    <smart_chainfundContext.Provider
      value={{
        connectMetaMask,
        connectLocalWallet,
        createCampaign,
        getCampaigns,
        donate,
        currentAccount,
        balance
      }}
    >
      {children}
    </smart_chainfundContext.Provider>
  );
};

export const usesmart_chainfund = () => useContext(smart_chainfundContext);