const walletButtonsDiv = document.getElementById("wallet-buttons");
const message = document.getElementById("message");
const delegateSection = document.getElementById("delegate-section");

// Backend API URL
const BACKEND_URL = "https://cardano-wallet-backend.vercel.app/api";

// Supported wallets
const wallets = ["yoroi", "nami", "eternl", "flint"];

// Selected wallet
let walletApi = null;

// Hex -> Bech32
function hexToBech32(hex) {
  try {
    const bytes = Cardano.BaseAddress.from_bytes(Buffer.from(hex, "hex"));
    return bytes.to_address().to_bech32();
  } catch (err) {
    console.error("Invalid address hex:", hex, err);
    return null;
  }
}

// Create wallet buttons
wallets.forEach((walletName) => {
  const btn = document.createElement("button");
  btn.textContent = walletName.toUpperCase();
  btn.onclick = async () => {
    try {
      message.textContent = `Connecting to ${walletName}...`;
      // Enable wallet
      const wallet = await window.cardano[walletName].enable();
      walletApi = wallet;
      message.textContent = `Connected: ${walletName}`;

      // Get addresses
      const usedAddresses = await walletApi.getUsedAddresses();
      if (!usedAddresses || usedAddresses.length === 0) throw new Error("No addresses found");

      const hexAddr = usedAddresses[0];
      const bech32Addr = hexToBech32(hexAddr) || hexAddr;
      message.textContent = `Connected: ${bech32Addr}`;

      // Show delegate button
      delegateSection.innerHTML = "";
      const delegateBtn = document.createElement("button");
      delegateBtn.className = "delegate-btn";
      delegateBtn.textContent = "Delegate ADA";
      delegateBtn.onclick = () => submitDelegation(bech32Addr);
      delegateSection.appendChild(delegateBtn);
    } catch (err) {
      console.error("Wallet connection error:", err);
      message.textContent = `Wallet connection error: ${err.message}`;
    }
  };
  walletButtonsDiv.appendChild(btn);
});

// Submit delegation
async function submitDelegation(address) {
  try {
    message.textContent = "Fetching UTxOs...";
    const utxosRes = await fetch(`${BACKEND_URL}/utxos?address=${address}`);
    if (!utxosRes.ok) throw new Error(`UTxO fetch failed: ${utxosRes.status}`);
    const utxos = await utxosRes.json();

    message.textContent = "Fetching protocol parameters...";
    const paramsRes = await fetch(`${BACKEND_URL}/epoch-params`);
    if (!paramsRes.ok) throw new Error(`Protocol params fetch failed: ${paramsRes.status}`);
    const params = await paramsRes.json();

    // Prepare transaction
    message.textContent = "Building delegation transaction...";
    const txBodyHex = await fetch(`${BACKEND_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, utxos, params }),
    });

    if (!txBodyHex.ok) throw new Error(`Transaction submission failed: ${txBodyHex.status}`);
    const result = await txBodyHex.json();

    message.textContent = `Transaction submitted! TxHash: ${result.txHash}`;
  } catch (err) {
    console.error("Delegation error:", err);
    message.textContent = `Delegation error: ${err.message}`;
  }
}
