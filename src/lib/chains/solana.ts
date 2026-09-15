import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import type { WalletInfo, Transaction, Token, WalletTokens } from '../../types/index';
import { getSolPriceUSD, getTokenPricesUSD } from '../price';
import { CHAINS_CONFIG } from './index';

const RPC_ENDPOINT = CHAINS_CONFIG.solana.rpcUrl;
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

export function isValidSolanaAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return pubkey.toBase58() === address;
  } catch {
    return false;
  }
}

export async function getSolanaWalletInfo(address: string): Promise<WalletInfo> {
  if (!isValidSolanaAddress(address)) {
    throw new Error('Alamat wallet Solana tidak valid');
  }

  const pubkey = new PublicKey(address);
  const [lamports, solPriceUSD, signatures] = await Promise.all([
    connection.getBalance(pubkey),
    getSolPriceUSD(),
    connection.getSignaturesForAddress(pubkey, { limit: 10 }).catch(() => []),
  ]);

  const solBalance = lamports / LAMPORTS_PER_SOL;
  const solBalanceUSD = solBalance * solPriceUSD;

  const recentTransactions: Transaction[] = signatures.map((sig) => ({
    signature: sig.signature,
    blockTime: sig.blockTime ?? null,
    type: sig.err ? 'FAILED_TX' : 'TRANSFER/INTERACTION',
    fee: 0.000005,
    status: sig.err ? 'failed' : 'success',
    slot: sig.slot,
  }));

  return {
    address,
    chain: 'solana',
    nativeSymbol: 'SOL',
    solBalance,
    solBalanceUSD,
    solPriceUSD,
    transactionCount: signatures.length,
    recentTransactions,
  };
}

export async function getSolanaWalletTokens(address: string): Promise<WalletTokens> {
  if (!isValidSolanaAddress(address)) {
    throw new Error('Alamat wallet Solana tidak valid');
  }

  const pubkey = new PublicKey(address);
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

  let parsedTokenAccounts;
  try {
    const fetchTokensPromise = connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: TOKEN_PROGRAM_ID,
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout Solana RPC getParsedTokenAccountsByOwner (5s)')), 5000)
    );
    parsedTokenAccounts = await Promise.race([fetchTokensPromise, timeoutPromise]);
  } catch (e) {
    console.warn('Gagal mengambil akun token SPL Solana / Timeout:', e);
    return { address, chain: 'solana', tokens: [], totalValueUSD: 0 };
  }

  const tokenList: Token[] = [];
  const mintAddresses: string[] = [];

  for (const item of parsedTokenAccounts.value) {
    const tokenInfo = item.account.data.parsed?.info;
    if (!tokenInfo) continue;

    const amount = Number(tokenInfo.tokenAmount?.uiAmount || 0);
    const mint = tokenInfo.mint as string;
    const decimals = Number(tokenInfo.tokenAmount?.decimals || 0);

    if (amount > 0) {
      mintAddresses.push(mint);
      tokenList.push({
        mint,
        name: `Token ${mint.slice(0, 4)}...${mint.slice(-4)}`,
        symbol: mint.slice(0, 4).toUpperCase(),
        balance: amount,
        decimals,
        priceUSD: 0,
        valueUSD: 0,
        chain: 'solana',
      });
    }
  }

  if (mintAddresses.length > 0) {
    const prices = await getTokenPricesUSD(mintAddresses);
    for (const token of tokenList) {
      if (prices[token.mint]) {
        token.priceUSD = prices[token.mint];
        token.valueUSD = token.balance * token.priceUSD;
      }
    }

    // Perkaya metadata nama dan simbol token menggunakan DexScreener multi-token API
    // Ambil maksimal 30 token teratas
    const topMints = mintAddresses.slice(0, 30);
    try {
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${topMints.join(',')}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3500),
      });

      if (dexRes.ok) {
        const dexData = await dexRes.json();
        if (Array.isArray(dexData.pairs)) {
          const metadataMap = new Map<string, { name: string; symbol: string; priceUsd?: number }>();
          for (const pair of dexData.pairs) {
            if (pair.chainId === 'solana' && pair.baseToken?.address) {
              const addr = pair.baseToken.address;
              if (!metadataMap.has(addr)) {
                metadataMap.set(addr, {
                  name: pair.baseToken.name,
                  symbol: pair.baseToken.symbol,
                  priceUsd: Number(pair.priceUsd || 0),
                });
              }
            }
          }

          for (const token of tokenList) {
            const meta = metadataMap.get(token.mint);
            if (meta) {
              if (meta.name) token.name = meta.name;
              if (meta.symbol) token.symbol = meta.symbol;
              if ((!token.priceUSD || token.priceUSD === 0) && meta.priceUsd) {
                token.priceUSD = meta.priceUsd;
                token.valueUSD = token.balance * token.priceUSD;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Gagal enrich metadata token Solana dari DexScreener:', e);
    }
  }

  tokenList.sort((a, b) => b.valueUSD - a.valueUSD);
  const totalValueUSD = tokenList.reduce((acc, t) => acc + (t.valueUSD || 0), 0);

  return {
    address,
    chain: 'solana',
    tokens: tokenList,
    totalValueUSD,
  };
}
