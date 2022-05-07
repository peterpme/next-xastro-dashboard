import { useEffect, useState } from "react";
import { VictoryPie } from "victory";
import { LCDClient } from "@terra-money/terra.js";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

import styles from "../styles/Home.module.css";
import * as query from "./contract/query";

const apollo_lockdrop_address = "terra120z72wqvrtfjgyxcdnhnxn5e5chxz7ruud290n"; //  apollo
const xastro_address = "terra14lpnyzc9z4g3ugr4lhm8s4nle0tq8vcltkhzh7"; //  xastro
const apollo_warchest_address = "terra1hxrd8pnqytqpelape3aemprw3a023wryw7p0xn"; //  warchest
const reactor_lockdrop_address = "terra1jnf3m3rkns52husav43zyzc857wxts00vdr8j2"; //  reactor
const orion_address = "terra18mguewx2kvmkd4xq676xgxe795hne0a4s4qte0"; //  orion
const retrograde_lockdown_address =
  "terra1amcm2gv6zqznrd2hlsgru58c4ytvl9jqwu8e8y"; //  retrograde

const addresses = {
  apollolockdropBalance: "Apollo Lockdrop",
  apolloWarchestBalance: "Apollo Warchest",
  reactorBalance: "Reactor",
  orionBalance: "Orion",
  retrogradeBalance: "Retrograde",
};

const isBrowser = () => typeof window !== "undefined";
const getWindowWidth = () => {
  if (typeof window !== "undefined") {
    return window.innerWidth;
  }

  return 300;
};

const windowWidth = getWindowWidth();

export const calculateDecimals = (amount, decimals) => {
  return amount / Math.pow(10, decimals);
};

function formatAmount(amount = "0") {
  return amount ? amount.toLocaleString("en-US") : "0";
}

function getLabel(key) {
  return addresses[key];
}

const getTotalBalance = async () => {
  let totalBalanceArray = [];
  let totalContractBalance = 0;

  const apollolockdropBalance = await getBalance(
    apollo_lockdrop_address,
    xastro_address
  );
  console.log("lockdrop: " + apollolockdropBalance);
  totalBalanceArray.push(apollolockdropBalance);

  const apolloWarchestBalance = await getBalance(
    apollo_warchest_address,
    xastro_address
  );
  console.log("warchest: " + apolloWarchestBalance);
  totalBalanceArray.push(apolloWarchestBalance);

  const reactorBalance = await getBalance(
    reactor_lockdrop_address,
    xastro_address
  );
  console.log("reactor: " + reactorBalance);
  totalBalanceArray.push(reactorBalance);

  const orionBalance = await getBalance(orion_address, xastro_address);
  console.log("orion: " + orionBalance);
  totalBalanceArray.push(orionBalance);

  const retrogradeBalance = await getBalance(
    retrograde_lockdown_address,
    xastro_address
  );
  console.log("retrograde: " + retrogradeBalance);
  totalBalanceArray.push(retrogradeBalance);

  totalContractBalance = totalBalanceArray.reduce(
    (n, s) => Number(n) + Number(s)
  );

  console.log("totalContractBalance: " + totalContractBalance);
  return {
    totalContractBalance,
    apollolockdropBalance,
    apolloWarchestBalance,
    reactorBalance,
    orionBalance,
    retrogradeBalance,
  };
};

const getBalance = async (contract_address, token_address) => {
  const { balance } = await query.getBalance(token_address, contract_address);
  return balance;
};

const fetchData = async () => {
  const { totalContractBalance, ...balances } = await getTotalBalance();
  const { decimals, total_supply } = await query.getTokenInfo(xastro_address);

  const balance = calculateDecimals(totalContractBalance, decimals);
  const supply = calculateDecimals(total_supply, decimals);

  return { balance, supply, balances: { ...balances, totalContractBalance } };
};

function StatsItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center text-white">
      <span className="text-3xl block">{value}</span>
      <span className="text-xs opacity-40">{label}</span>
    </div>
  );
}

function StatsHeader({
  totalOwnedByDaos,
  totalSupply,
  percentCirculatingSupplyOwned,
}: {
  totalOwnedByDaos: string;
  totalSupply: string;
  percentCirculatingSupplyOwned: string;
}) {
  return (
    <header className="p-8 rounded-xl bg-slate-900 border-slate-800 border">
      <div className="md:flex justify-around items-center">
        <div className="mb-6 md:mb-0 md:w-1/3">
          <StatsItem
            value={totalOwnedByDaos}
            label="Total xAstro owned by DAOs"
          />
        </div>
        <div className="mb-6 md:mb-0 md:w-1/3">
          <StatsItem value={totalSupply} label="Total supply" />
        </div>
        <div className="md:w-1/3">
          <StatsItem
            value={`${percentCirculatingSupplyOwned}%`}
            label="% of circulating supply owned"
          />
        </div>
      </div>
    </header>
  );
}

function buildData(balances) {
  return Object.keys(balances)
    .map((key, index) => {
      if (key === "totalContractBalance") {
        return false;
      }

      const value = balances[key];
      const label = getLabel(key);
      const percent =
        (parseInt(value, 10) / balances.totalContractBalance) * 100;

      return {
        x: `${label}: ${percent.toFixed(1)}%`,
        y: percent,
      };
    })
    .filter(Boolean);
}

function PieChart({ balances }) {
  const pieData = buildData(balances);
  return (
    <div className="h-96">
      <VictoryPie
        width={windowWidth < 500 ? 270 : 380}
        height={300}
        data={pieData}
        colorScale={["tomato", "orange", "gold", "cyan", "navy"]}
        style={{
          labels: { fill: "white", fontSize: windowWidth < 500 ? 16 : 24 },
        }}
      />
    </div>
  );
}

const Home: NextPage = () => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [supply, setSupply] = useState(0);
  const [balances, setBalances] = useState({});

  function updateData({ balance, supply, balances }) {
    setSupply(supply);
    setBalance(balance);
    setBalances(balances);
    setLoading(false);
  }

  useEffect(() => {
    async function fetch() {
      const { balance, supply, balances } = await fetchData();
      updateData({ balance, supply, balances });
      const percentage = (balance / supply) * 100;
    }

    fetch().catch(console.error);
  }, []);

  const percentage = (balance / supply) * 100;
  const percentCirculatingSupplyOwned = (percentage || 0).toFixed(2);

  return (
    <>
      <Head>
        <title>{percentCirculatingSupplyOwned}% Wars Tracker</title>
        <meta name="description" content="Track xAstro Pool Allocations" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <main className="h-screen bg-black p-4">
        <StatsHeader
          totalOwnedByDaos={formatAmount(Math.floor(balance))}
          totalSupply={formatAmount(Math.floor(supply))}
          percentCirculatingSupplyOwned={percentCirculatingSupplyOwned}
        />
        <PieChart balances={balances} />
        <div className="flex items-center justify-center">
          <button
            className="text-white text-sm px-8 py-2 bg-indigo-600 rounded-3xl"
            onClick={async () => {
              setLoading(true);
            }}
          >
            Refresh Data
          </button>
        </div>
      </main>
    </>
  );
};

export default Home;
