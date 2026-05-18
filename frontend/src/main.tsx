import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime:        30_000,   // data fresh for 30s before background refetch
            retry:            1,        // one retry on failure, then show error
            refetchOnWindowFocus: false, // don't refetch when user switches tabs
        },
    },
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </StrictMode>,
)
