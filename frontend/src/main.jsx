import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient(
//   {
//   defaultOptions: {
//     queries: {
//       refetchOnWindowFocus: false,
//     //  refetchOnMount: false,
//     //  refetchOnReconnect: false,
//     //  retry: false,
//     //  staleTime: 1000 * 60, // 1 minute
//     },
//   },
// }
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
