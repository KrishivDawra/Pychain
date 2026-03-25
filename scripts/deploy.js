const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Deploy SupplyChain
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();

  const supplyAddress = await supplyChain.getAddress();

  // Deploy Escrow
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();

  console.log("SupplyChain:", supplyAddress);
  console.log("Escrow:", escrowAddress);

  // ✅ Prepare data
  const data = {
    supplyChain: supplyAddress,
    escrow: escrowAddress,
  };

  // ✅ Correct absolute path (FIXED)
  const filePath = path.join(
    __dirname,
    "../frontend/src/utils/contract-address.json"
  );

  // ✅ Ensure directory exists (extra safety)
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  // ✅ Write file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log("✅ Addresses saved to frontend:", filePath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});