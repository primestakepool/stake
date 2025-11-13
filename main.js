import { Lucid } from "https://cdn.jsdelivr.net/npm/lucid-cardano@0.10.7/web/mod.js";

// 🔹 Your backend API root
const BACKEND_ROOT = "https://cardano-wallet-backend.vercel.app/api";

let lucid;
let wallet;
let selectedWalletName = "";

// DOM references
const walletButtonsDiv = document.getElementById("wallet-buttons");
const message = document.getElementById("message");
const delegateSection = document.getElementById("delegate-section");

//
// ---- Custom Lucid provider using your backend ----
//
class BackendProvider {
  async getProtocolParameters() {
    const res = await fetch(`${BACKEND_ROOT}/epoch-params`);
    if (!res.ok) throw new Error("Failed to fetch protocol parameters");

    const data = await res.json();
    // ✅ Validate key fields to avoid .toString() crash
    if (!data.min_fee_a || !data.min_fee_b || !data.key_deposit) {
      console.error("Invalid protocol parameters from backend:", data);
      throw new Error("Invalid protocol parameters received from backend");
    }
    return data;
  }

  async getUtxos(address) {
    const res = await fetch(`${BACKEND_ROOT}/utxos/${address}`);
    if (!res.ok) throw new Error("Failed to fetch UTxOs");
    return res.json();
  }

  async submitTx(tx) {
    const res = await fetch(`${BACKEND_ROOT}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/cbor" },
      body: tx,
    });
    if (!res.ok) throw new Error("Failed to submit transaction");
    return res.text(); // return tx hash
  }
}

//
// ---- Detect wallets and show buttons ----
//
function detectWallets() {
  if (!window.cardano) {
    message.textContent =
      "No Cardano wallets detected. Please install one (Nami, Eternl, Yoroi, Lace).";
    return;
  }

  const wallets = Object.keys(window.cardano).filter(
    (name) => window.cardano[name]?.enable
  );

  if (wallets.length === 0) {
    message.textContent = "No supported wallets detected.";
    return;
  }

  message.textContent = "Detected wallets:";
  walletButtonsDiv.innerHTML = "";

  wallets.forEach((name) => {
    const btn = document.createElement("button");
    btn.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    btn.onclick = () => connectWallet(name);
    walletButtonsDiv.appendChild(btn);
  });
}

//
// ---- Connect selected wallet ----
//
async function connectWallet(walletName) {
  try {
    message.textContent = `🔗 Connecting to ${walletName}...`;
    wallet = window.cardano[walletName];
    selectedWalletName = walletName;

    await wallet.enable();
    console.log(`✅ ${walletName} wallet enabled.`);

    // 🔹 Fetch protocol parameters first
    const provider = new BackendProvider();
    const params = await provider.getProtocolParameters();
    console.log("Protocol parameters:", params);

    // 🔹 Initialize Lucid safely
    lucid = await Lucid.new(provider, "Mainnet");
    lucid.selectWallet(wallet);

    // 🔹 Get and log user address
    const usedAddresses = await lucid.wallet.addresses();
    const address = usedAddresses[0];
    console.log("Connected address:", address);

    message.textContent = `✅ Connected to ${walletName}`;
    showDelegateButton();
  } catch (err) {
    console.error("Connect wallet error:", err);
    message.textContent = `❌ Connection failed: ${err.message}`;
  }
}

//
// ---- Show Delegate button ----
//
function showDelegateButton() {
  delegateSection.innerHTML = "";

  const delegateBtn = document.createElement("button");
  delegateBtn.className = "delegate-btn";
  delegateBtn.textContent = "Delegate ADA";

  delegateBtn.onclick = async () => {
    const poolId = prompt("Enter pool ID to delegate to:");
    if (!poolId) return;

    try {
      await delegateToPool(poolId);
      alert("Delegation submitted!");
    } catch (err) {
      console.error("Delegation error:", err);
      alert("Delegation failed: " + err.message);
    }
  };

  delegateSection.appendChild(delegateBtn);
}

//
// ---- Delegate ADA ----
//
async function delegateToPool(poolId) {
  if (!lucid) throw new Error("Wallet not connected");

  const address = (await lucid.wallet.addresses())[0];
  console.log("Delegating from address:", address);
  console.log("Pool ID:", poolId);

  // 🔹 Build and submit delegation transaction
  const tx = await lucid
    .newTx()
    .delegateTo(address, poolId)
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  console.log("Delegation submitted, tx hash:", txHash);
  message.textContent = `✅ Delegation submitted! TX hash: ${txHash}`;
}

//
// ---- Initialize ----
//
detectWallets();
