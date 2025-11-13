// main.js
const backendBaseUrl = "https://cardano-wallet-backend.vercel.app/api";

const walletButtonsContainer = document.getElementById("wallet-buttons");
const delegateSection = document.getElementById("delegate-section");
const message = document.getElementById("message");

let wallet; // Yoroi wallet instance
let userAddress; // Bech32 address

// 1️⃣ Detect wallets
function detectWallets() {
  walletButtonsContainer.innerHTML = ""; // Clear previous buttons

  if (window.cardano?.yoroi) {
    const btn = document.createElement("button");
    btn.innerText = "Connect Yoroi Wallet";
    btn.onclick = connectWallet;
    walletButtonsContainer.appendChild(btn);
    message.innerText = "Yoroi wallet detected. Connect to continue.";
  } else {
    message.innerHTML = 'No Yoroi wallet found. Please install it from <a href="https://yoroi-wallet.com/">here</a>.';
  }
}

// 2️⃣ Connect Yoroi Wallet
async function connectWallet() {
  try {
    wallet = await window.cardano.yoroi.enable();
    const usedAddresses = await wallet.getUsedAddresses();

    if (!usedAddresses || usedAddresses.length === 0) {
      message.innerText = "No addresses found in wallet.";
      return;
    }

    userAddress = usedAddresses[0]; // Using the first used address
    message.innerText = `✅ Wallet connected: ${userAddress.slice(0, 10)}...`;
    showDelegateButton();
  } catch (err) {
    console.error(err);
    message.innerText = "❌ Failed to connect wallet: " + err.message;
  }
}

// 3️⃣ Show delegate button
function showDelegateButton() {
  delegateSection.innerHTML = "";

  const btn = document.createElement("button");
  btn.className = "delegate-btn";
  btn.innerText = "Fetch My UTXOs";
  btn.onclick = fetchUtxos;
  delegateSection.appendChild(btn);
}

// 4️⃣ Fetch UTXOs via backend
async function fetchUtxos() {
  if (!userAddress) {
    message.innerText = "⚠️ Connect wallet first.";
    return;
  }

  message.innerText = "Fetching UTXOs...";
  try {
    const res = await fetch(`${backendBaseUrl}/utxos/${userAddress}`);
    const utxos = await res.json();

    console.log("UTXOs:", utxos);
    message.innerText = `✅ UTXOs fetched: ${utxos.length} found.`;
    
    // Optionally, show a submit transaction button
    showSubmitButton(utxos);
  } catch (err) {
    console.error(err);
    message.innerText = "❌ Failed to fetch UTXOs: " + err.message;
  }
}

// 5️⃣ Show submit transaction button
function showSubmitButton(utxos) {
  const btn = document.createElement("button");
  btn.className = "delegate-btn";
  btn.innerText = "Submit Dummy Transaction";
  btn.onclick = async () => {
    const txCborHex = prompt("Enter transaction CBOR hex (for testing):");
    if (txCborHex) {
      await submitTx(txCborHex);
    }
  };

  delegateSection.appendChild(btn);
}

// 6️⃣ Submit transaction via backend
async function submitTx(txCborHex) {
  try {
    const res = await fetch(`${backendBaseUrl}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txCbor: txCborHex })
    });

    const result = await res.json();
    console.log("Transaction submission result:", result);
    message.innerText = `✅ Transaction submitted. Tx ID: ${result.txId || "unknown"}`;
  } catch (err) {
    console.error(err);
    message.innerText = "❌ Failed to submit transaction: " + err.message;
  }
}

// Initialize
detectWallets();
