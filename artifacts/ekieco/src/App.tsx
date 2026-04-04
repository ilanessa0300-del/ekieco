import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { getAuthToken } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Profile from "@/pages/profile";
import CreateListing from "@/pages/listings/new";
import ListingsPage from "@/pages/listings/index";
import CreateRequest from "@/pages/requests/new";

const queryClient = new QueryClient();

const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = getAuthToken();
  if (token) {
    init = init ?? {};
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return originalFetch(input, init);
};

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const [, setLocation] = useLocation();
  const token = getAuthToken();

  useEffect(() => {
    if (!token) {
      setLocation("/auth");
    }
  }, [token, setLocation]);

  if (!token) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/listings" component={ListingsPage} />
      <Route path="/listings/new">
        <ProtectedRoute component={CreateListing} />
      </Route>
      <Route path="/requests/new">
        <ProtectedRoute component={CreateRequest} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
