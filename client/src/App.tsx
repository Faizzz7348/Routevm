import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingIntro } from "@/components/loading-intro";
import { ThemeProvider } from "@/components/theme-provider";
import TablePage from "@/pages/table";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen pb-16 text-sm">
      <Switch>
        <Route path="/">
          {() => <TablePage />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  const [introComplete, setIntroComplete] = useState(false);

  const handleIntroComplete = () => {
    setIntroComplete(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          {!introComplete ? (
            <LoadingIntro onComplete={handleIntroComplete} />
          ) : (
            <Router />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
