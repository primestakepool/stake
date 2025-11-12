// main.js

import { Lucid } from "https://cdn.jsdelivr.net/npm/lucid-cardano@0.10.7/web/mod.js";

let lucid;
let wallet;

// Your backend URL for epoch parameters
const BACKEND_URL = "https://wallet-proxy-pi.vercel.app/api/epoch-params";

// DOM elements
const btn = document.getElementById("connectWalletBtn");
const delegateBtn = document.getElementById("delegateBtn");

// Helper: fetch protocol parameters from backend
async function getProtocolParams() {
    const res = await fetch(BACKEND_URL);
    if (!res.ok) throw new Error("Failed to fetch protocol parameters");
    return res.json();
}

// Connect wallet
async function connectWallet() {
    // Detect wallets
    const wallets = Object.keys(window.cardano || {});
    console.log("Detected wallets:", wallets);

    if (!window.cardano.yoroi) throw new Error("Yoroi wallet not found");

    wallet = window.cardano.yoroi;

    // Enable wallet
    await wallet.enable();

    // Initialize Lucid
    lucid = await Lucid.new(
        new Lucid.Blockfrost(wallet, "mainnet") // adjust for testnet if needed
    );

    lucid.selectWallet(wallet);

    // Fetch protocol params from backend and set in Lucid
    const protocolParams = await getProtocolParams();
    lucid.setProtocolParams(protocolParams);

    // Show connected address
    const usedAddresses = await lucid.wallet.getUsedAddresses();
    console.log("Connected wallet:", usedAddresses[0]);
}

// Delegate to pool
async function delegateToPool(poolId) {
    if (!lucid) throw new Error("Wallet not connected");

    // Build and submit delegation transaction
    const tx = await lucid.newTx()
        .delegateTo( (await lucid.wallet.getUsedAddresses())[0], poolId )
        .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    console.log("Delegation submitted, tx hash:", txHash);
}

// Button events
btn.onclick = async () => {
    try {
        await connectWallet();
        alert("Wallet connected!");
    } catch (err) {
        console.error("Connect wallet error:", err);
        alert("Failed to connect wallet: " + err.message);
    }
};

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
