import React, { useState } from 'react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi'; // RainbowKit integration for wallet connection
import logo from '@/public/logo.jpg';

// Contract Details
const contractAddress = "0x94dAe516f99882220Beb26b0CF872015B66ca9C9"; // Replace with your deployed contract address
const mantleTokenAddress = "0xDC1f593f30F533b460F092cc2AcfbCA0715A4040"; // Replace with Mantle token contract address
const contractABI = [
  [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amountInUnits",
          "type": "uint256"
        }
      ],
      "name": "donate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_mantleToken",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "donor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "DonationReceived",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "contractBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "mantleToken",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "targetAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
];
const erc20ABI = [
  // ERC20 standard ABI
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function",
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" },
    ],
    "name": "approve",
    "outputs": [{ "name": "success", "type": "bool" }],
    "type": "function",
  },
];

const Fund = () => {
  const { address, isConnected } = useAccount(); // RainbowKit connection
  const [amount, setAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check Mantle balance
  const checkBalance = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider('https://rpc.sepolia.mantle.xyz'); // Mantle mainnet RPC
      const erc20 = new ethers.Contract(mantleTokenAddress, erc20ABI, provider);
      const balance = await erc20.balanceOf(address);
      const formattedBalance = ethers.utils.formatUnits(balance, 18);

      if (Number(formattedBalance) < Number(amount)) {
        setError(`Insufficient balance. You have ${formattedBalance} WMNT.`);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error checking balance:", err.message);
      setError("Failed to fetch token balance.");
      return false;
    }
  };

  // Approve Mantle token transfer
  const approveTokens = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const erc20 = new ethers.Contract(mantleTokenAddress, erc20ABI, signer);
      const mantleAmount = ethers.utils.parseUnits(amount, 18);

      setTransactionStatus('Approving tokens...');
      const tx = await erc20.approve(contractAddress, mantleAmount);
      await tx.wait();
      setTransactionStatus('Tokens approved successfully!');
      return true;
    } catch (err) {
      console.error("Error approving tokens:", err.message);
      setError("Token approval failed! " + err.message);
      return false;
    }
  };

  // Donate Mantle tokens
  const donateMantle = async () => {
    if (!isConnected) {
      setError("Please connect your wallet to proceed.");
      return;
    }

    setLoading(true);
    setError('');
    setTransactionStatus('');

    try {
      const hasSufficientBalance = await checkBalance();
      if (!hasSufficientBalance) return;

      const isApproved = await approveTokens();
      if (!isApproved) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const mantleAmount = ethers.utils.parseUnits(amount, 18);

      setTransactionStatus('Sending transaction...');
      const tx = await contract.donate(mantleAmount, { gasLimit: 300000 });
      await tx.wait();

      setTransactionStatus('Donation successful! Thank you for your support.');
    } catch (err) {
      console.error('Error in donation transaction:', err.message);
      setError('Transaction failed! ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-20 my-28">
        <div className="grid grid-cols-2 gap-2">
          <Image src={logo} alt="Logo" height={600} width={600} />
          <div>
            <div className="mx-10 font-sans text-white text-xl font-bold my-4">
              Owned By: Ayush
            </div>
            <div className="mx-10 font-sans text-white text-xl font-bold">
              Donate
            </div>
            <div>
              <input
                className="mx-10 font-sans pb-2 text-black text-xl bg-gray-200 rounded-lg my-4 px-2"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount in MANTLE"
              />
              <div>
              <button
                className="mx-10 font-sans text-white text-xl font-bold bg-purple-400 rounded-lg my-2 px-4 py-2"
                onClick={donateMantle}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Pay 💸'}
              </button></div>
              {transactionStatus && <p className="text-green-500 mx-10">{transactionStatus}</p>}
              {error && <p className="text-red-500 mx-10">{error}</p>}
            </div>

            <div className="mx-10 font-sans text-white text-xl font-bold">
              Stake on NFT to earn rewards!
            </div>
            <div>
              <input
                className='mx-10 font-sans pb-2 text-white text-xl bg-gray-200 rounded-lg my-4'
                placeholder=' Coming soon! 🚀'
              />
            </div>
            <button
              className="mx-10 font-sans text-white text-xl font-bold bg-purple-400 rounded-lg my-2 px-4 py-2"
            >
              Stake 🔒
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Fund;
