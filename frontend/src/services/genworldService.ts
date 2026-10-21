import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { GENWORLD_CONFIG } from '../config/genlayer';
import { WorldSession } from '../types/genworld';

function generatePrivateKey(): `0x${string}` {
  const bytes = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

function getSessionAccount() {
  const STORAGE_KEY = 'genworld_session_signer_key';
  let privateKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

  if (!privateKey || !privateKey.startsWith('0x') || privateKey.length !== 66) {
    privateKey = generatePrivateKey();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, privateKey);
    }
  }

  try {
    return createAccount(privateKey as `0x${string}`);
  } catch {
    const freshKey = generatePrivateKey();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, freshKey);
    }
    return createAccount(freshKey);
  }
}

export interface LiveTxResult {
  txHash: string;
  explorerUrl: string;
  methodName: string;
  stage: 'preparing' | 'submitted' | 'proposing' | 'finalized' | 'error';
  receipt?: any;
  error?: string;
}

export type TxUpdateCallback = (result: LiveTxResult) => void;

class GenWorldService {
  private client: any;
  private sessionAccount: any;
  private activeAddress: string;
  private walletMode: 'browser' | 'session' = 'session';

  constructor() {
    this.sessionAccount = getSessionAccount();
    this.activeAddress = this.sessionAccount.address;
    this.initClient();
  }

  private initClient(browserAddress?: string | null) {
    if (this.walletMode === 'browser' && browserAddress && typeof window !== 'undefined' && (window as any).ethereum) {
      this.activeAddress = browserAddress;
      this.client = createClient({
        chain: studionet,
        account: browserAddress as `0x${string}`,
        provider: (window as any).ethereum,
      });
    } else {
      this.activeAddress = this.sessionAccount.address;
      this.client = createClient({
        chain: studionet,
        account: this.sessionAccount,
      });
    }
  }

  public setWalletMode(mode: 'browser' | 'session', browserAddress?: string | null) {
    this.walletMode = mode;
    this.initClient(browserAddress);
  }

  public getWalletMode(): 'browser' | 'session' {
    return this.walletMode;
  }

  public getActiveAddress(): string {
    return this.activeAddress;
  }

  public getSessionAddress(): string {
    return this.sessionAccount.address;
  }

  public setCustomPrivateKey(key: string) {
    const formatted = (key.startsWith('0x') ? key : `0x${key}`) as `0x${string}`;
    this.sessionAccount = createAccount(formatted);
    if (this.walletMode === 'session') {
      this.activeAddress = this.sessionAccount.address;
      this.client = createClient({
        chain: studionet,
        account: this.sessionAccount,
      });
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('genworld_session_signer_key', formatted);
    }
  }

  public async getProtocol(): Promise<any> {
    try {
      const raw = await this.client.readContract({
        address: GENWORLD_CONFIG.contractAddress,
        functionName: 'get_protocol',
        args: [],
      });
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (err) {
      console.error('Failed to read get_protocol:', err);
      return null;
    }
  }

  public async getSession(sessionId: string): Promise<WorldSession | null> {
    try {
      const raw = await this.client.readContract({
        address: GENWORLD_CONFIG.contractAddress,
        functionName: 'get_session',
        args: [sessionId],
      });
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (err) {
      console.warn(`Session ${sessionId} not found or read error:`, err);
      return null;
    }
  }

  public async getStateHash(sessionId: string): Promise<string> {
    return await this.client.readContract({
      address: GENWORLD_CONFIG.contractAddress,
      functionName: 'get_state_hash',
      args: [sessionId],
    });
  }

  public async listSessions(offset: number = 0, limit: number = 20): Promise<string[]> {
    try {
      return await this.client.readContract({
        address: GENWORLD_CONFIG.contractAddress,
        functionName: 'list_sessions',
        args: [offset, limit],
      });
    } catch (err) {
      console.warn('Failed to list sessions:', err);
      return [];
    }
  }

  public async sendTransaction(
    functionName: string,
    args: any[] = [],
    onProgress?: TxUpdateCallback
  ): Promise<LiveTxResult> {
    const result: LiveTxResult = {
      txHash: '',
      explorerUrl: '',
      methodName: functionName,
      stage: 'preparing',
    };

    try {
      if (onProgress) onProgress({ ...result, stage: 'preparing' });

      const txHash = await this.client.writeContract({
        address: GENWORLD_CONFIG.contractAddress,
        functionName,
        args,
      });

      result.txHash = txHash;
      result.explorerUrl = `${GENWORLD_CONFIG.explorerBaseUrl}/tx/${txHash}`;
      result.stage = 'submitted';
      if (onProgress) onProgress({ ...result });

      // Poll until FINALIZED
      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: 'FINALIZED',
        interval: 3000,
        retries: 90,
      });

      result.receipt = receipt;
      result.stage = 'finalized';
      if (onProgress) onProgress({ ...result });
      return result;
    } catch (err: any) {
      result.stage = 'error';
      result.error = err?.message || String(err);
      if (onProgress) onProgress({ ...result });
      throw err;
    }
  }
}

export const genworldService = new GenWorldService();
