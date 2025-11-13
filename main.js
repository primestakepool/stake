// main.js

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const delegateBtn = document.getElementById("delegateBtn");

  if (!connectBtn || !delegateBtn) {
    console.error("Buttons not found in DOM!");
    return;
  }

  // Example: Convert hex address to bech32 using Cardano Serialization Lib
  function hexToBech32(hexAddress) {
    if (typeof Cardano === "undefined") {
      console.error("Cardano library is not loaded!");
      return null;
    }
    try {
      const addr = Cardano.Address.from_bytes(Buffer.from(hexAddress, "hex"));
      return addr.to_bech32();
    } catch (err) {
      console.error("Invalid address hex:", hexAddress, err);
      return null;
    }
  }

  // Connect Wallet button
  connectBtn.onclick = async () => {
    try {
      // Example: request access to Yoroi
      const wallets = await window.cardano.yoroi.enable();
      const usedAddresses = await wallets.getUsedAddresses(); // returns hex addresses
      console.log("Connected addresses (hex):", usedAddresses);

      // Convert first address to bech32
      const bech32Addr = hexToBech32(usedAddresses[0]);
      console.log("Bech32 address:", bech32Addr);
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  };

  // Delegate button
  delegateBtn.onclick = async () => {
    try {
      // Placeholder: replace with your backend API call
      const response = await fetch("https://cardano-wallet-backend.vercel.app/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx: "YOUR_TX_HEX_HERE" }),
      });
      if (!response.ok) throw new Error(`Delegation failed: ${response.status}`);
      const data = await response.json();
      console.log("Delegation success:", data);
    } catch (err) {
      console.error("Delegation error:", err);
    }
  };
});
