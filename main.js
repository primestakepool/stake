// ----------------------------------------------------------
// STOP running inside the Yoroi iframe
// ----------------------------------------------------------
if (window.location.pathname.includes("wallet-connect")) {
  console.warn("⛔ Blocking script execution inside Yoroi iframe");
  throw new Error("Stop execution in injected iframe");
}

// Safety checks
if (!window.Cardano) {
  console.error("CSL NOT LOADED!");
  document.getElementById("message").innerText =
    "⚠️ Serialization library not loaded!";
}

// API backend
const API_BASE = "https://cardano-wallet-backend.vercel.app/api/";

const messageEl = document.getElementById("message");
const walletButtonsDiv = document.getElementById("wallet-buttons");
const delegateSection = document.getElementById("delegate-section");

const SUPPORTED = ["nami", "eternl", "yoroi", "lace"];
let walletApi = null;
let bech32Address = null;

// Wait helper
const sleep = ms => new Promise(res => setTimeout(res, ms));

// Detect wallets
async function detectWallets() {
  messageEl.textContent = "🔍 Detecting wallets...";

  for (let i = 0; i < 10; i++) {
    if (window.cardano && Object.keys(window.cardano).length > 0) break;
    await sleep(300);
  }

  if (!window.cardano) {
    messageEl.textContent = "⚠️ No Cardano wallets found.";
    return;
  }

  renderWalletButtons();
}

// Render connect buttons
function renderWalletButtons() {
  walletButtonsDiv.innerHTML = "";

  SUPPORTED.forEach(name => {
    const w = window.cardano[name];
    if (!w) return;

    const btn = document.createElement("button");
    btn.textContent = `Connect ${w.name || name}`;
    btn.onclick = () => connectWallet(name);
    walletButtonsDiv.appendChild(btn);
  });

  if (walletButtonsDiv.innerHTML === "") {
    messageEl.textContent = "⚠️ Wallets detected but unsupported.";
  } else {
    messageEl.textContent = "💡 Select your wallet:";
  }
}

// Connect to wallet
async function connectWallet(walletName) {
  try {
    const wallet = window.cardano[walletName];
    if (!wallet) throw new Error(`${walletName} not installed`);

    messageEl.textContent = `🔌 Connecting to ${walletName}...`;

    walletApi = await wallet.enable();

    const used = await walletApi.getUsedAddresses();
    if (!used.length) throw new Error("No used addresses found");

    const addrHex = used[0];

    // Convert using CSL
    const addrBytes = window.Cardano.Address.from_bytes(
      Uint8Array.from(Buffer.from(addrHex, "hex"))
    );
    bech32Address = addrBytes.to_bech32();

    messageEl.textContent = `✅ Connected: ${bech32Address.substring(0, 15)}...`;
    console.log("Wallet Address:", bech32Address);

    showDelegateButton();
  } catch (err) {
    console.error("Wallet connection error:", err);
    messageEl.textContent = `❌ Wallet connection failed: ${err.message}`;
  }
}

// Show delegation button
function showDelegateButton() {
  delegateSection.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "delegate-btn";
  btn.textContent = "Delegate to PSP Pool";
  btn.onclick = submitDelegation;
  delegateSection.appendChild(btn);
}

// Submit delegation
async function submitDelegation() {
  try {
    messageEl.textContent = "⏳ Preparing delegation...";

    const utxosRes = await fetch(`${API_BASE}utxos?address=${bech32Address}`);
    if (!utxosRes.ok) throw new Error("UTxO fetch failed");
    const utxos = await utxosRes.json();

    const paramsRes = await fetch(`${API_BASE}epoch-params`);
    const params = await paramsRes.json();

    const body = {
      address: bech32Address,
      poolId: "pool1w2duw0lk7lxjpfqjguxvtp0znhaqf8l2yvzcfd72l8fuk0h77gy"
    };

    const submitRes = await fetch(`${API_BASE}submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = await submitRes.json();
    if (!submitRes.ok) throw new Error(result.error);

    messageEl.textContent = `🎉 Delegation submitted! TxHash: ${result.txHash}`;
  } catch (err) {
    console.error("Delegation error:", err);
    messageEl.textContent = `❌ Delegation failed: ${err.message}`;
  }
}

// Start app
detectWallets();

