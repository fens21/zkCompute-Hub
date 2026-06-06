const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const JobMarketplace = await hre.ethers.getContractFactory("JobMarketplace");
  const jobMarketplace = await JobMarketplace.deploy();
  await jobMarketplace.waitForDeployment();
  const jmAddress = await jobMarketplace.getAddress();
  console.log("JobMarketplace deployed to:", jmAddress);

  const RealVerifier = await hre.ethers.getContractFactory("RealVerifier");
  const realVerifier = await RealVerifier.deploy();
  await realVerifier.waitForDeployment();
  const rvAddress = await realVerifier.getAddress();
  console.log("RealVerifier deployed to:", rvAddress);

  const tx = await jobMarketplace.setVerifier(rvAddress);
  await tx.wait();
  console.log("RealVerifier set as ZK verifier on JobMarketplace");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
