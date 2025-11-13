const BACKEND_URL = "https://cardano-wallet-backend.vercel.app/api";

let wallet = null;
let walletName = null;
let userAddress = null;

const message = document.getElementById("message");
const walletButtonsDiv = document.getElementById("wallet-buttons");
const delegateSection = document.getElementById("delegate-section");

const SUPPORTED_WALLETS = Object.keys(window.cardano || {});

function detectWallets() {
  walletButtonsDiv.innerHTML = "";

  if (SUPPORTED_WALLETS.length === 0) {
    message.innerHTML = 'No wallets found. Install <a href="https://yoroi-wallet.com/">Yoroi</a> or <a href="https://namiwallet.io/">Nami</a>.';
    return;
  }

  message.innerText = "Select a wallet to connect:";

  SUPPORTED_WALLETS.forEach(name => {
    const btn = document.createElement("button");
    btn.innerText = name.charAt(0).toUpperCase() + name.slice(1);
    btn.onclick = () => connectWallet(name);
    walletButtonsDiv.appendChild(btn);
  });
}

async function connectWallet(name) {
  if (!window.cardano?.[name]) {
    message.innerText = `${name} wallet not found!`;
    return;
  }

  try {
    // Always call enable() on user interaction (button click)
    wallet = await window.cardano[name].enable();
    walletName = name;

    message.innerText = `✅ ${name} connected. Fetching address...`;

    // Small delay to ensure wallet is fully ready
    await new Promise(resolve => setTimeout(resolve, 300));

    const usedAddresses = await wallet.getUsedAddresses();

    if (!usedAddresses || usedAddresses.length === 0) {
      message.innerText = "No addresses found in wallet.";
      return;
    }

    userAddress = usedAddresses[0];
    message.innerText = `✅ Connected: ${userAddress.slice(0, 12)}...`;
    showDelegateButton();

  } catch (err) {
    console.error("Wallet connection error:", err);
    message.innerText = `❌ Failed to connect ${name}. Make sure you approve the wallet prompt.`;
  }
}

function showDelegateButton() {
  delegateSection.innerHTML = "";
  const btn = document.createElement("button");
  btn.innerText = "Delegate ADA to PSP";
  btn.className = "delegate-btn";
  btn.onclick = submitDelegation;
  delegateSection.appendChild(btn);
}

async function submitDelegation() {
  if (!wallet || !userAddress) {
    message.innerText = "Wallet not connected!";
    return;
  }

  try {
    message.innerText = "Preparing delegation transaction...";

    const utxoResp = await fetch(`${BACKEND_URL}/utxos?address=${userAddress}`);
    const utxos = await utxoResp.json();

    if (!utxos || utxos.length === 0) {
      message.innerText = "No UTXOs found.";
      return;
    }

    const paramsResp = await fetch(`${BACKEND_URL}/epoch-params`);
    const protocolParams = await paramsResp.json();

    const txPayload = {
      address: userAddress,
      utxos,
      protocolParams,
      stakePool: "pool1w2duw0lk7lxjpfqjguxvtp0znhaqf8l2yvzcfd72l8fuk0h77gy"
    };

    const submitResp = await fetch(`${BACKEND_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(txPayload)
    });

    const result = await submitResp.json();

    if (result.success) {
      message.innerText = `🎉 Delegation successful! Tx Hash: ${result.txHash}`;
    } else {
      message.innerText = `❌ Delegation failed: ${result.error || "Unknown error"}`;
    }

  } catch (err) {
    console.error("Delegation error:", err);
    message.innerText = "❌ Error during delegation. Check console.";
  }
}

detectWallets();
