import { Web3Provider } from '@ethersproject/providers'
import { ChainId } from '@uniswap/sdk'
import { 
  useAccount, 
  useReconnect, 
  useConfig, 
  usePublicClient, 
  useWalletClient
} from 'wagmi'
import { 
  type WalletClient, 
  type PublicClient 
} from 'viem'
import { providers } from 'ethers'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { connect } from 'wagmi/actions'
import { injected } from 'wagmi/connectors'

// Convert a viem PublicClient to an ethers.js Provider
async function publicClientToProvider(publicClient: PublicClient) {
  const { chain, transport } = publicClient
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address
  }
  
  return new providers.Web3Provider({
    request: async ({ method, params }) => {
      return transport.request({ method, params: params || [] })
    }
  }, network)
}

type Web3ReactHookReturn = {
  account: `0x${string}` | undefined
  chainId: ChainId | undefined
  active: boolean
  library: Web3Provider | undefined
  publicClient: PublicClient | undefined
  walletClient: WalletClient | undefined
  error: Error | undefined
  connector: 'injected' | undefined // Add this
}

export function useActiveWeb3React(): Web3ReactHookReturn {
  const { address, isConnected, connector } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [provider, setProvider] = useState<Web3Provider>()
  
  useEffect(() => {
    if (!publicClient) return
    
    publicClientToProvider(publicClient)
      .then(setProvider)
      .catch(err => console.error('Failed to get provider:', err))
  }, [publicClient])

  return {
    account: address,
    chainId: publicClient?.chain?.id as ChainId,
    active: isConnected,
    library: provider,
    publicClient,
    walletClient: walletClient ?? undefined,
    error: undefined,
    connector: connector?.id as 'injected' | undefined // Add this
  }
}

export function useEagerConnect() {
  const { reconnect } = useReconnect()
  const [tried, setTried] = useState(false)
  const config = useConfig()

  useEffect(() => {
    const tryConnect = async () => {
      // Check if we're on mobile and have a wallet
      if (isMobile && !window.ethereum) {
        setTried(true)
        return
      }

      try {
        await connect(config, { connector: injected() })
        await reconnect()
      } catch (error) {
        console.error('Failed to connect:', error)
      } finally {
        setTried(true)
      }
    }

    tryConnect()
  }, [config, reconnect])

  return tried
}

export function useInactiveListener(suppress = false) {
  const { isConnected } = useAccount()
  const config = useConfig()

  useEffect(() => {
    const { ethereum } = window as any

    if (ethereum?.on && !isConnected && !suppress) {
      const handleChainChanged = () => {
        connect(config, { connector: injected() })
          .catch(error => console.error('Failed to connect after chain changed:', error))
      }

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          connect(config, { connector: injected() })
            .catch(error => console.error('Failed to connect after accounts changed:', error))
        }
      }

      ethereum.on('chainChanged', handleChainChanged)
      ethereum.on('accountsChanged', handleAccountsChanged)

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged)
          ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
    return undefined
  }, [isConnected, suppress, config])
}
