import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Attendance from "@/pages/Attendance";
import Scanner from "@/pages/Scanner";
import Users from "@/pages/Users";
import Classes from "@/pages/Classes";
import AddClass from "@/pages/AddClass";
import ClassAttendance from "@/pages/ClassAttendance";
import IDCards from "@/pages/IDCards";
import APIKeys from "@/pages/APIKeys";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={Dashboard} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/users" component={Users} />
      <Route path="/classes" component={Classes} />
      <Route path="/classes/add" component={AddClass} />
      <Route path="/classes/:classId/attendance" component={ClassAttendance} />
      <Route path="/id-cards" component={IDCards} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings/api-keys" component={APIKeys} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="attendance-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-4">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <h1 className="font-semibold text-lg">AttendanceTracker</h1>
                    </div>
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto p-6">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
