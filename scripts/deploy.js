const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, distributor, wholesaler, retailer] =
    await hre.ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Distributor:", distributor.address);
  console.log("Wholesaler:", wholesaler.address);
  console.log("Retailer:", retailer.address);

  // 🚀 Deploy SupplyChain
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();
  const supplyAddress = await supplyChain.getAddress();

  // 🚀 Deploy Escrow
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log("SupplyChain:", supplyAddress);
  console.log("Escrow:", escrowAddress);

  // 🔗 CONNECT CONTRACTS
  await escrow.setSupplyChain(supplyAddress);
  await supplyChain.setEscrow(escrowAddress);

  console.log("✅ Contracts connected");

  // 🔥 ROLES
  const DISTRIBUTOR_ROLE = await supplyChain.DISTRIBUTOR_ROLE();
  const WHOLESALER_ROLE = await supplyChain.WHOLESALER_ROLE();
  const RETAILER_ROLE = await supplyChain.RETAILER_ROLE();

  await supplyChain.grantRole(DISTRIBUTOR_ROLE, distributor.address);
  await supplyChain.grantRole(WHOLESALER_ROLE, wholesaler.address);
  await supplyChain.grantRole(RETAILER_ROLE, retailer.address);

  console.log("✅ Roles assigned");

  // 📁 SAVE TO FRONTEND
  const data = {
    supplyChain: supplyAddress,
    escrow: escrowAddress,
    roles: {
      manufacturer: deployer.address,
      distributor: distributor.address,
      wholesaler: wholesaler.address,
      retailer: retailer.address,
    },
  };

  const filePath = path.join(
    __dirname,
    "../frontend/src/utils/contract-address.json"
  );

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log("✅ Data saved to frontend");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});