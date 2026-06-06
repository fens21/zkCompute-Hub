const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying RealVerifier with account:", deployer.address);

  const jobMarketplaceAddress = process.env.JOB_MARKETPLACE_ADDRESS;
  if (!jobMarketplaceAddress) {
    console.error("Set JOB_MARKETPLACE_ADDRESS env var to the existing JobMarketplace contract");
    process.exitCode = 1;
    return;
  }

  const RealVerifier = await hre.ethers.getContractFactory("RealVerifier");
  const realVerifier = await RealVerifier.deploy();
  await realVerifier.waitForDeployment();
  const rvAddress = await realVerifier.getAddress();
  console.log("RealVerifier deployed to:", rvAddress);

  const JobMarketplace = await hre.ethers.getContractFactory("JobMarketplace");
  const jobMarketplace = JobMarketplace.attach(jobMarketplaceAddress);

  const tx = await jobMarketplace.setVerifier(rvAddress);
  await tx.wait();
  console.log("RealVerifier set as ZK verifier on JobMarketplace at", jobMarketplaceAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});