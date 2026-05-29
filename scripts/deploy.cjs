const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const JobMarketplace = await hre.ethers.getContractFactory("JobMarketplace");
  const jobMarketplace = await JobMarketplace.deploy();

  await jobMarketplace.waitForDeployment();

  const address = await jobMarketplace.getAddress();
  console.log("JobMarketplace deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
