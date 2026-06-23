import "./App.css";
import FlowPayDashboard from "@/pages/FlowPayDashboard";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <LoginPage />,
    },
    {
      path: "/payment",
      element: <FlowPayDashboard />,
    },
    // {
    //   path: "/wallet",
    //   element: <WalletPage />,
    // },
    // {
    //   path: "/company",
    //   element: <CompanyPage />,
    // },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
