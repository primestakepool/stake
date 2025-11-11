import { Lucid, Blockfrost } from "https://cdn.jsdelivr.net/npm/lucid-cardano@0.9.8/dist/lucid.js";

const messageEl = document.getElementById("message");
const buttonsContainer = document.getElementById("wallet-buttons");

const wallets = [];
if (window.cardano?.nami) wallets.push("nami");
if (window.cardano?.yoroi) wallets.push("yoroi");
if (window.cardano?.lace) wallets.push("lace");
if (window.cardano?.flint) wallets.push("flint");

if (wallets.length === 0) {
    messageEl.textContent = "No Cardano wallet found. Please unlock or install Nami, Yoroi, Lace, or Flint.";
} else {
    messageEl.textContent = "Select your wallet to delegate:";

    wallets.forEach(walletName => {
        const btn = document.createElement("button");
        btn.textContent = walletName.toUpperCase();
        btn.onclick = async () => {
            try {
                messageEl.textContent = `Connecting to ${walletName}...`;

                const walletApi = await window.cardano[walletName].enable();

                const lucid = await Lucid.new(
                    new Blockfrost("https://cardano-mainnet.blockfrost.io/api/v0", ""), // Empty string, we'll use backend for secure calls
                    "Mainnet"
                );
                lucid.selectWallet(walletApi);

                messageEl.textContent = `${walletName} connected. Fetching network parameters...`;

                // Fetch epoch params securely from backend
                const epochParams = await fetch("https://wallet-proxy-five.vercel.app/api/epoch-params").then(r => r.json());
                if (epochParams.error) {
                    messageEl.textContent = "❌ Could not fetch network parameters.";
                    console.error(epochParams.error);
                    return;
                }

                messageEl.textContent = "Ready to delegate!";

                // Replace with your pool ID
                const poolId = "pool1w2duw0lk7lxjpfqjguxvtp0znhaqf8l2yvzcfd72l8fuk0h77gy";

                const delegationTx = await lucid.newTx()
                    .delegateTo(poolId)
                    .complete();

                const signedTx = await lucid.signTx(delegationTx);
                const txHash = await lucid.submitTx(signedTx);

                messageEl.textContent = `✅ Delegation submitted! TxHash: ${txHash}`;
                console.log("Transaction hash:", txHash);

            } catch (err) {
                console.error(err);
                messageEl.textContent = `Failed to connect or delegate: ${err.message}`;
            }
        };
        buttonsContainer.appendChild(btn);
    });
}
