// main.js
// =====================
// Make sure you added in index.html:
// <script src="https://unpkg.com/@emurgo/cardano-serialization-lib-browser@11.1.0/cardano_serialization_lib.min.js"></script>
// =====================

const backendUrl = "https://cardano-wallet-backend.vercel.app/api";
const walletButtonsContainer = document.getElementById("wallet-buttons");
const delegateSection = document.getElementById("delegate-section");
const messageEl = document.getElementById("message");

let walletApi = null;
let walletName = null;
let userAddress = null;

// Helper: convert hex address to bech32
function hexToBech32(hex) {
  try {
    const addr = Cardano.Address.from_bytes(Buffer.from(hex, "hex"));
    return addr.to_bech32();
  } catch (err) {
    console.error("Invalid address hex:", hex, err);
    return null;
  }
}

// Detect wallets
async function detectWallets() {
  if (!window.cardano) {
    messageEl.innerText = "No Cardano wallets detected. Install Nami, Yoroi, Flint, or Gero.";
    return;
  }

  walletButtonsContainer.innerHTML = "";

  for (const key of Object.keys(window.cardano)) {
    const wallet = window.cardano[key];
    if (wallet.enable) {
      const btn = document.createElement("button");
      btn.innerText = `Connect ${wallet.name}`;
      btn.onclick = async () => {
        try {
          walletApi = await wallet.enable();
          walletName = wallet.name;
          const usedAddresses = await walletApi.getUsedAddresses();
          userAddress = hexToBech32(usedAddresses[0]);
          messageEl.innerText = `Connected: ${userAddress}`;
          showDelegateButton();
        } catch (err) {
          console.error("Wallet connection error:", err);
          messageEl.innerText = `Failed to connect ${wallet.name}`;
        }
      };
      walletButtonsContainer.appendChild(btn);
    }
  }
}

// Show delegate button
function showDelegateButton() {
  delegateSection.innerHTML = "";
  const btn = document.createElement("button");
  btn.innerText = "Delegate ADA to PSP";
  btn.className = "delegate-btn";
  btn.onclick = submitDelegation;
  delegateSection.appendChild(btn);
}

// Fetch UTxOs from backend
async function getUtxos(address) {
  try {
    const res = await fetch(`${backendUrl}/utxos?address=${address}`);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error("Error fetching UTxOs:", err);
    throw err;
  }
}

// Fetch epoch parameters
async function getEpochParams() {
  try {
    const res = await fetch(`${backendUrl}/epoch-params`);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error("Error fetching epoch params:", err);
    throw err;
  }
}

// Submit delegation transaction
async function submitDelegation() {
  if (!walletApi || !userAddress) return alert("Wallet not connected!");

  try {
    messageEl.innerText = "Preparing delegation transaction...";

    // Fetch UTxOs & protocol params
    const utxos = await getUtxos(userAddress);
    const epochParams = await getEpochParams();

    // Call backend to build transaction
    const buildRes = await fetch(`${backendUrl}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: userAddress,
        utxos,
        epochParams,
        walletName,
      }),
    });

    if (!buildRes.ok) throw new Error(await buildRes.text());
    const data = await buildRes.json();

    messageEl.innerText = "Delegation submitted successfully!";
    console.log("Delegation response:", data);
  } catch (err) {
    console.error("Delegation error:", err);
    messageEl.innerText = `Delegation error: ${err.message || err}`;
  }
}

// Initialize
detectWallets();
