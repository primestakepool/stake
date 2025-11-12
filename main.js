import { Lucid, Blockfrost } from "https://cdn.jsdelivr.net/npm/lucid-cardano@0.10.7/web/mod.js";

const BACKEND_PROXY = "https://wallet-proxy-alpha.vercel.app/api/blockfrost-proxy";
const POOL_ID = "pool1w2duw0lk7lxjpfqjguxvtp0znhaqf8l2yvzcfd72l8fuk0h77gy";

let lucid, walletApi, connectedWallet;

async function connectWallet(name) {
  try {
    messageEl.textContent = `Connecting to ${name}…`;
    walletApi = await window.cardano[name].enable();
    connectedWallet = name;

    // ✅ Initialize Lucid using backend proxy
    lucid = await Lucid.new(
      new Blockfrost(BACKEND_PROXY, ""), // empty key; backend adds it
      "Mainnet"
    );

    lucid.selectWallet(walletApi);

    const address = await lucid.wallet.address();
    messageEl.textContent = `✅ ${name.toUpperCase()} connected`;
    console.log("Connected wallet:", name, address);

    showDelegateButton(address);
  } catch (err) {
    console.error(err);
    messageEl.textContent = `❌ Failed to connect ${name}: ${err.message}`;
  }
}

// Delegation function stays the same
async function delegateToPool(address) {
  try {
    messageEl.textContent = "Building delegation transaction…";

    const delegation = await lucid.newTx()
      .delegateTo(address, POOL_ID)
      .complete();

    messageEl.textContent = "Signing transaction…";
    const signedTx = await delegation.sign().complete();

    messageEl.textContent = "Submitting to network…";
    const txHash = await signedTx.submit();

    messageEl.textContent = `🎉 Delegation submitted! Tx hash: ${txHash}`;
    console.log("Delegation transaction hash:", txHash);
  } catch (err) {
    console.error("Delegation error:", err);
    messageEl.textContent = `❌ Delegation failed: ${err.message}`;
  }
}
