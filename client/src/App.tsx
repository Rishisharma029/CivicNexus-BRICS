import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import FarmerAdvisory from "./pages/FarmerAdvisory";
import Home from "./pages/Home";
import PolicyDashboard from "./pages/PolicyDashboard";
import RequestDetail from "./pages/RequestDetail";
import SubmitRequest from "./pages/SubmitRequest";

function isGitHubPages() {
  return typeof window !== "undefined" && (window.location.hostname.includes("github.io") || window.location.hash.startsWith("#"));
}

function Routes() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/submit"} component={SubmitRequest} />
      <Route path={"/farmer"} component={FarmerAdvisory} />
      <Route path={"/signal/:requestId"} component={RequestDetail} />
      <Route path={"/policy"} component={PolicyDashboard} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const useHash = isGitHubPages();
  
  if (useHash) {
    return (
      <WouterRouter hook={useHashLocation}>
        <Routes />
      </WouterRouter>
    );
  }

  return <Routes />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
