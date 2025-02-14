import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import 'inter-ui'
import React, { StrictMode } from 'react'
import { isMobile } from 'react-device-detect'
/*import ReactDOM from 'react-dom'*/
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga'
import { Provider } from 'react-redux'
import { NetworkContextName } from './constants'
import './i18n'
import App from './pages/App'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import ListsUpdater from './state/lists/updater'
import MulticallUpdater from './state/multicall/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'
import getLibrary from './utils/getLibrary'
import '@rainbow-me/rainbowkit/styles.css'
import {
  RainbowKitProvider,
  getDefaultConfig,
  Chain,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { http } from 'viem';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

const myCustomChain = {
  id: parseInt(process.env.REACT_APP_CHAIN_ID ?? '0', 10),
  name: 'My Custom Network',
  iconUrl: 'https://example.com/icon.png', // optional
  iconBackground: '#fff', // optional
  nativeCurrency: {
    name: 'MyToken',
    symbol: 'MTK',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [process.env.REACT_APP_NETWORK_URL || '']
    }
  },
  blockExplorers: {
    default: {
      name: 'My Explorer',
      url: process.env.REACT_APP_BLOCK_EXPLORER_URL || ''
    }
  },
} as const satisfies Chain;

if ('ethereum' in window) {
  ;(window.ethereum as any).autoRefreshOnNetworkChange = false
}

const GOOGLE_ANALYTICS_ID: string | undefined = process.env.REACT_APP_GOOGLE_ANALYTICS_ID
if (typeof GOOGLE_ANALYTICS_ID === 'string') {
  ReactGA.initialize(GOOGLE_ANALYTICS_ID)
  ReactGA.set({
    customBrowserType: !isMobile ? 'desktop' : 'web3' in window || 'ethereum' in window ? 'mobileWeb3' : 'mobileRegular'
  })
} else {
  ReactGA.initialize('test', { testMode: true, debug: true })
}

window.addEventListener('error', error => {
  ReactGA.exception({
    description: `${error.message} @ ${error.filename}:${error.lineno}:${error.colno}`,
    fatal: true
  })
})

function Updaters() {
  return (
    <>
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
    </>
  )
}

const container: any = document.getElementById('root')
const root = createRoot(container)

const wagmiConfig = getDefaultConfig({
  appName: process.env.REACT_APP_NAME,
  projectId: "0f83c34a5cf8bc471f0166f39841bbb4",
  chains: [myCustomChain],
})

const queryClient = new QueryClient()

root.render(<>
    <FixedGlobalStyle />

        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
                <Provider store={store}>
                  <Updaters />
                  <ThemeProvider>
                    <ThemedGlobalStyle />
                    <App />
                  </ThemeProvider>
                </Provider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider></>
)
