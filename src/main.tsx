import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import './index.css';
import './globals.css';
import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} maxSnack={3}>
      <App />
    </SnackbarProvider>
  </QueryClientProvider>,
);
