const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY?.trim();
  const distributor = process.env.DISTRIBUTOR_ADDRESS?.trim();
  const wholesaler = process.env.WHOLESALER_ADDRESS?.trim();
  const retailer = process.env.RETAILER_ADDRESS?.trim();

  if (!privateKey) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  if (privateKey.length !== 64) {
    throw new Error(
      `Invalid PRIVATE_KEY length: ${privateKey.length}. Expected 64 characters without 0x.`
    );
  }

  if (!distributor || !wholesaler || !retailer) {
    throw new Error(
      "Missing DISTRIBUTOR_ADDRESS / WHOLESALER_ADDRESS / RETAILER_ADDRESS in .env"
    );
  }

  const deployer = new hre.ethers.Wallet(`0x${privateKey}`, hre.ethers.provider);
  const deployerAddress = await deployer.getAddress();

  console.log("Deployer:", deployerAddress);
  console.log("Distributor:", distributor);
  console.log("Wholesaler:", wholesaler);
  console.log("Retailer:", retailer);

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain", deployer);
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();
  const supplyAddress = await supplyChain.getAddress();
  console.log("SupplyChain:", supplyAddress);

  const Escrow = await hre.ethers.getContractFactory("Escrow", deployer);
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("Escrow:", escrowAddress);

  let tx = await escrow.setSupplyChain(supplyAddress);
  await tx.wait();

  tx = await supplyChain.setEscrow(escrowAddress);
  await tx.wait();

  console.log("✅ Contracts connected");

  const DISTRIBUTOR_ROLE = await supplyChain.DISTRIBUTOR_ROLE();
  const WHOLESALER_ROLE = await supplyChain.WHOLESALER_ROLE();
  const RETAILER_ROLE = await supplyChain.RETAILER_ROLE();

  tx = await supplyChain.grantRole(DISTRIBUTOR_ROLE, distributor);
  await tx.wait();

  tx = await supplyChain.grantRole(WHOLESALER_ROLE, wholesaler);
  await tx.wait();

  tx = await supplyChain.grantRole(RETAILER_ROLE, retailer);
  await tx.wait();

  console.log("✅ Roles assigned");

  const data = {
    network: "sepolia",
    chainId: 11155111,
    supplyChain: supplyAddress,
    escrow: escrowAddress,
    roles: {
      manufacturer: deployerAddress,
      distributor,
      wholesaler,
      retailer,
    },
  };

  const filePath = path.resolve(
    __dirname,
    "../frontend/src/utils/contract-address.json"
  );

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

  console.log("✅ Data saved to frontend");
  console.log("📁 Saved at:", filePath);
}

main().catch((error) => {
  console.error("❌ Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});