import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RealEstateModule = buildModule("RealEstateModule", (m) => {
  const realEstate = m.contract("RealEstate");

  return { realEstate };
});

export default RealEstateModule;
