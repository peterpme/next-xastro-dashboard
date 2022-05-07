import { LCDClient } from "@terra-money/terra.js";

const options = {
  lcd: "https://lcd.terra.dev",
  chainID: "columbus-5",
};

export const getBalance = async (token_address, account_address) => {
  const lcd = new LCDClient({ URL: options.lcd, chainID: options.chainID });

  return lcd.wasm.contractQuery(token_address, {
    balance: { address: account_address },
  });
};

export const getTokenInfo = async (contract_address) => {
  const lcd = new LCDClient({ URL: options.lcd, chainID: options.chainID });

  return lcd.wasm.contractQuery(contract_address, { token_info: {} });
};
