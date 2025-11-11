import { Lucid } from "https://cdn.jsdelivr.net/npm/lucid-cardano@0.10.7/web/mod.js";

const messageEl = document.getElementById("message");
const buttonsContainer = document.getElementById("wallet-buttons");

async function detectWallets() {
  const wallets = [];
  if (window.cardano?.nami) wallets.push("nami");
  if (window.cardano?.yoroi) wallets.push("yoroi");
  if (window.cardano?.lace) wallets.push("lace");
  if (window.cardano?.flint) wallets.push("flint");
  return wallets;
}

async function connectWallet(name) {
  try {
    messageEl.textContent = `Connecting to ${name}…`;
    const api = await window.cardano[name].enable();
    const lucid = await Lucid.new(undefined, "Mainnet");
    lucid.selectWallet(api);

    const addr = await lucid.wallet.address();
    messageEl.textContent = `✅ Connected: ${name.toUpperCase()}`;
    console.log("Connected address:", addr);
  } catch (e) {
    messageEl.textContent = `⚠️ ${name} connection failed: ${e.message}`;
    console.error(e);
  }
}

async function main() {
  messageEl.textContent = "Detecting wallets…";

  // wait up to 3 s for the wallet objects to appear
  let wallets = [];
  for (let i = 0; i < 6; i++) {
    wallets = await detectWallets();
    if (wallets.length) break;
    await new Promise(r => setTimeout(r, 500));
  }

  if (!wallets.length) {
    messageEl.textContent =
      "No Cardano wallet found. Open this page directly (not inside Wix) and unlock your wallet.";
    return;
  }

  messageEl.textContent = "Select your wallet to delegate:";
  buttonsContainer.innerHTML = "";

  wallets.forEach(name => {
    const btn = document.createElement("button");
    btn.textContent = name.toUpperCase();
    btn.onclick = () => connectWallet(name);
    buttonsContainer.appendChild(btn);
  });

  console.log("Detected wallets:", wallets);
}

window.addEventListener("DOMContentLoaded", main);
