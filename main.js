const messageEl = document.getElementById("message");
const walletButtonsDiv = document.getElementById("wallet-buttons");
const delegateSection = document.getElementById("delegate-section");

const SUPPORTED_WALLETS = ["nami", "eternl", "yoroi", "lace"];
let selectedWallet = null;
let walletApi = null;
let bech32Address = null;

// Wait utility
const sleep = ms => new Promise(res => setTimeout(res, ms));

// 1️⃣ Detect wallets
async function detectWallets() {
  messageEl.textContent = "🔍 Detecting wallets...";
  for (let i = 0; i < 10; i++) {
    if (window.cardano && Object.keys(window.cardano).length > 0) break;
    await sleep(500);
  }

  if (!window.cardano || Object.keys(window.cardano).length === 0) {
    messageEl.textContent = "⚠️ No Cardano wallets detected. Install Nami, Eternl, Yoroi, or Lace.";
    return;
  }

  renderWalletButtons();
}

// 2️⃣ Render wallet buttons
function renderWalletButtons() {
  walletButtonsDiv.innerHTML = "";
  SUPPORTED_WALLETS.forEach(name => {
    const wallet = window.cardano[name];
    if (wallet) {
      const btn = document.createElement("button");
      btn.textContent = `Connect ${wallet.name || name}`;
      btn.onclick = () => connectWallet(name);
      walletButtonsDiv.appendChild(btn);
    }
  });

  messageEl.textContent = walletButtonsDiv.innerHTML ? 
    "💡 Select your Cardano wallet to connect:" : 
    "⚠️ No supported wallets found.";
}

// 3️⃣ Connect to wallet
async function connectWallet(walletName) {
  try {
    messageEl.textContent = `🔌 Connecting to ${walletName}...`;
    const wallet = window.cardano[walletName];
    if (!wallet) throw new Error(`${walletName} not found`);

    walletApi = await wallet.enable();
    selectedWallet = walletName;

    const usedAddresses = await walletApi.getUsedAddresses();
    if (!usedAddresses || usedAddresses.length === 0) throw new Error("No used addresses found");

    const addrBytes = window.Cardano.Address.from_bytes(
      Buffer.from(usedAddresses[0], "hex")
    );
    bech32Address = addrBytes.to_bech32();

    messageEl.textContent = `✅ Wallet connected: ${bech32Address.substring(0, 15)}...`;
    console.log("Bech32 Address:", bech32Address);

    showDelegateButton();
  } catch (err) {
    console.error("Wallet connection error:", err);
    messageEl.textContent = `❌ Wallet connection failed: ${err.message}`;
  }
}

// 4️⃣ Show delegate button
function showDelegateButton() {
  delegateSection.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "delegate-btn";
  btn.textContent = "Delegate to PSP Pool";
  btn.onclick = submitDelegation;
  delegateSection.appendChild(btn);
}

// 5️⃣ Submit delegation (calls backend)
async function submitDelegation() {
  messageEl.textContent = "⏳ Preparing delegation transaction...";
  // Your backend API call logic here
}

// 6️⃣ Start
detectWallets();

