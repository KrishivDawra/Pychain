const { expect } = require("chai");

describe("SupplyChain", function () {
  let contract;

  beforeEach(async function () {
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    contract = await SupplyChain.deploy();
    await contract.waitForDeployment();
  });

  it("should register a product", async function () {
    await contract.registerProduct("iPhone", "hash123");

    const product = await contract.getProduct(1);
    expect(product[1]).to.equal("iPhone");
  });

  it("should transfer ownership", async function () {
    const [owner, user] = await ethers.getSigners();

    await contract.registerProduct("Laptop", "hash456");
    await contract.transferProduct(1, user.address);

    const product = await contract.getProduct(1);
    expect(product[3]).to.equal(user.address);
  });
});