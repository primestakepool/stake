// main.js

// 1️⃣ Backend API base URL
const BACKEND_BASE_URL = "https://cardano-wallet-backend.vercel.app/api";

// 2️⃣ Buttons in your HTML
const connectBtn = document.getElementById("connectBtn");
const delegateBtn = document.getElementById("delegateBtn");

// 3️⃣ Wallet state
let walletApi = null;
let walletAddressHex = null;

// 4️⃣ Utility: Convert hex to bech32 using Cardano Serialization Lib
function hexToBech32(hex) {
  if (!window.Cardano) {
    throw new Error("Cardano serialization library not loaded");
  }
  const Cardano = window.Cardano;
  const bytes = Cardano.from_bytes(Buffer.from(hex, "hex"));
  const addr = Cardano.Address.from_bytes(bytes);
  return addr.to_bech32();
}

// 5️⃣ Connect wallet
async function connectWallet() {
  try {
    if (!window.cardano || !window.cardano.yoroi) {
      throw new Error("Yoroi wallet not found");
    }
    walletApi = await window.cardano.yoroi.enable();
    const hexAddresses = await walletApi.getUsedAddresses();
    walletAddressHex = hexAddresses[0]; // take the first address
    console.log("Connected wallet hex address:", walletAddressHex);
  } catch (err) {
    console.error("Wallet connection error:", err);
  }
}

// 6️⃣ Fetch UTxOs from backend
async function fetchUTxOs(address) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/utxos?address=${address}`);
    if (!res.ok) throw new Error(`UTxO fetch failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching UTxOs:", err);
    throw err;
  }
}

// 7️⃣ Submit delegation tx to backend
async function submitDelegation(txHex) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tx: txHex }),
    });
    if (!res.ok) throw new Error(`Delegation submit failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Delegation error:", err);
    throw err;
  }
}

// 8️⃣ Button click handlers
connectBtn.onclick = async () => {
  await connectWallet();
};

delegateBtn.onclick = async () => {
  if (!walletAddressHex) {
    alert("Please connect your wallet first");
    return;
  }

  try {
    const bech32Address = hexToBech32(walletAddressHex);
    console.log("Wallet bech32 address:", bech32Address);

    const utxos = await fetchUTxOs(bech32Address);
    console.log("Fetched UTxOs:", utxos);

    // Build your delegation transaction here using cardano-serialization-lib
    // For demo purposes, we’ll assume you already have txHex
    const txHex = "YOUR_SERIALIZED_TX_HEX"; // TODO: replace with actual tx logic

    const result = await submitDelegation(txHex);
    console.log("Delegation result:", result);
    alert("Delegation submitted successfully!");
  } catch (err) {
    console.error(err);
    alert("Delegation failed: " + err.message);
  }
};
