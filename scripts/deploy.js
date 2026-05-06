const hre = require("hardhat");

async function main() {

  const SmartChainFund = await hre.ethers.getContractFactory("SmartChainFund");

  const smartChainFund = await SmartChainFund.deploy();

  await smartChainFund.waitForDeployment();

  console.log("Contract deployed to:", await smartChainFund.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});