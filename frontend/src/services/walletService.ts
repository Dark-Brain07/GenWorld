import { GENWORLD_CONFIG } from '../config/genlayer';

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  walletName?: string;
}

export const STUDIONET_CHAIN_CONFIG = {
  chainIdHex: '0xf22f', // 61999 in hex
  chainIdDecimal: 61999,
  chainName: 'GenLayer StudioNet',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
  rpcUrls: ['https://studio.genlayer.com/api'],
  blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
};

class WalletService {
  private listeners: ((state: WalletState) => void)[] = [];
  private state: WalletState = {
    address: null,
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false,
  };

  constructor() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.initEventListeners();
      this.checkCurrentConnection();
    }
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  }

  public getEthereumProvider(): any {
    return typeof window !== 'undefined' ? (window as any).ethereum : null;
  }

  public getState(): WalletState {
    return this.state;
  }

  public subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  private initEventListeners() {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !ethereum.on) return;

    ethereum.on('accountsChanged', (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        this.state.address = null;
        this.state.isConnected = false;
      } else {
        this.state.address = accounts[0];
        this.state.isConnected = true;
      }
      this.notify();
    });

    ethereum.on('chainChanged', (chainIdHex: string) => {
      const id = parseInt(chainIdHex, 16);
      this.state.chainId = id;
      this.state.isCorrectNetwork = id === STUDIONET_CHAIN_CONFIG.chainIdDecimal;
      this.notify();
    });
  }

  public async checkCurrentConnection(): Promise<WalletState> {
    const ethereum = this.getEthereumProvider();
    if (!ethereum || !ethereum.request) return this.state;

    try {
      const [accounts, chainIdHex] = await Promise.all([
        ethereum.request({ method: 'eth_accounts' }),
        ethereum.request({ method: 'eth_chainId' }),
      ]);

      const chainId = chainIdHex ? parseInt(chainIdHex, 16) : null;
      const address = accounts && accounts.length > 0 ? accounts[0] : null;

      this.state = {
        address,
        chainId,
        isConnected: !!address,
        isCorrectNetwork: chainId === STUDIONET_CHAIN_CONFIG.chainIdDecimal,
      };
      this.notify();
    } catch (err) {
      console.warn('Error checking wallet connection:', err);
    }
    return this.state;
  }

  public async connect(): Promise<string> {
    const ethereum = this.getEthereumProvider();
    if (!ethereum || !ethereum.request) {
      throw new Error('No browser wallet detected. Please install MetaMask, Rabby, or another Web3 extension.');
    }

    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts authorized in browser wallet.');
    }

    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);

    this.state = {
      address: accounts[0],
      chainId,
      isConnected: true,
      isCorrectNetwork: chainId === STUDIONET_CHAIN_CONFIG.chainIdDecimal,
    };

    if (!this.state.isCorrectNetwork) {
      await this.switchToStudioNet();
    }

    this.notify();
    return accounts[0];
  }

  public async switchToStudioNet(): Promise<boolean> {
    const ethereum = this.getEthereumProvider();
    if (!ethereum || !ethereum.request) return false;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: STUDIONET_CHAIN_CONFIG.chainIdHex }],
      });
      this.state.chainId = STUDIONET_CHAIN_CONFIG.chainIdDecimal;
      this.state.isCorrectNetwork = true;
      this.notify();
      return true;
    } catch (switchError: any) {
      // Error 4902 indicates chain is not added to wallet
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: STUDIONET_CHAIN_CONFIG.chainIdHex,
                chainName: STUDIONET_CHAIN_CONFIG.chainName,
                nativeCurrency: STUDIONET_CHAIN_CONFIG.nativeCurrency,
                rpcUrls: STUDIONET_CHAIN_CONFIG.rpcUrls,
                blockExplorerUrls: STUDIONET_CHAIN_CONFIG.blockExplorerUrls,
              },
            ],
          });
          this.state.chainId = STUDIONET_CHAIN_CONFIG.chainIdDecimal;
          this.state.isCorrectNetwork = true;
          this.notify();
          return true;
        } catch (addError) {
          console.error('Failed to add GenLayer StudioNet network to wallet:', addError);
          throw addError;
        }
      }
      console.error('Failed to switch network in wallet:', switchError);
      throw switchError;
    }
  }

  public disconnect() {
    this.state.address = null;
    this.state.isConnected = false;
    this.notify();
  }
}

export const walletService = new WalletService();
