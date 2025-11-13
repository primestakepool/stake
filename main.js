// main.js
import * as Cardano from "https://cdn.jsdelivr.net/npm/@emurgo/cardano-serialization-lib-browser@11.1.0/cardano_serialization_lib.min.js";

window.Cardano = Cardano; // make global

const walletButtonsContainer = document.getElementById("wallet-buttons");
const delegateSection = document.getElementById("delegate-section");
const messageEl = document.getElementById("message");

if (!walletButtonsContainer || !delegateSection) {
  console.error("Required DOM elements not found!");
}

// Helper: Convert hex address to Bech32
function hexToBech32(hexAddress) {
  try {
    const addr = Cardano.Address.from_bytes(Buffer.from(hexAddress, "hex"));
    return addr.to_bech32();
  } catch (err) {
    console.error("Invalid address hex:", hexAddress, err);
    return null;
  }
}

// Detect wallets
async function detectWallets() {
  if (!window.cardano) {
    messageEl.textContent = "No Cardano wallets found.";
    return;
  }

  messageEl.textContent = "Detected wallets:";
  walletButtonsContainer.innerHTML = "";

  for (const [walletName, walletApi] of Object.entries(window.cardano)) {
    if (walletApi.enable) {
      const btn = document.createElement("button");
      btn.textContent = `Connect ${walletName}`;
      btn.onclick = async () => await connectWallet(walletName, walletApi);
      walletButtonsContainer.appendChild(btn);
    }
  }
}

// Connect to a wallet
async function connectWallet(walletName, walletApi) {
  try {
    const api = await walletApi.enable();
    const usedAddresses = await api.getUsedAddresses(); // returns hex
    if (!usedAddresses || usedAddresses.length === 0) {
      messageEl.textContent = `No addresses found in ${walletName}.`;
      return;
    }

    const bech32Addr = hexToBech32(usedAddresses[0]);
    messageEl.textContent = `Connected: ${bech32Addr}`;

    // Show delegate button
    showDelegateButton(api, bech32Addr);
  } catch (err) {
    console.error("Wallet connection error:", err);
    messageEl.textContent = `Failed to connect ${walletName}`;
  }
}

// Create Delegate button
function showDelegateButton(walletApi, address) {
  delegateSection.innerHTML = ""; // clear previous
  const delegateBtn = document.createElement("button");
  delegateBtn.textContent = "Delegate ADA";
  delegateBtn.className = "delegate-btn";

  delegateBtn.onclick = async () => {
    try {
      messageEl.textContent = "Submitting delegation...";
      // TODO: Call your backend API here, e.g., fetch('/api/submit', {...})
      console.log("Delegate clicked for:", address);
      messageEl.textContent = "Delegation submitted (mock).";
    } catch (err) {
      console.error("Delegation error:", err);
      messageEl.textContent = "Delegation failed.";
    }
  };

  delegateSection.appendChild(delegateBtn);
}

// Start detecting wallets
detectWallets();
