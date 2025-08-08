import React, { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import ChatComponent from "@/components/ChatComponent";
import { chatService } from "@/services/chatService";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { dashboardLayoutRoute } from "../_dashboardLayout";

const queryClient = new QueryClient();

export const chatRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  component: ChatPage,
});

function ChatPage() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientDescription, setPatientDescription] = useState<string | null>(null);

  // Crear paciente vacío al entrar, para iniciar chat directo
  useEffect(() => {
    let mounted = true;
    const createPatient = async () => {
      try {
        setIsProcessing(true);
        setError(null);
        const response = await chatService.processPatientInfo({});
        if (!mounted) return;
        setPatientId(response.id);
        setPatientDescription(response.htmlDescription);
      } catch (err) {
        if (!mounted) return;
        setError("No se pudo iniciar la consulta. Intenta recargar o vuelve más tarde.");
        console.error(err);
      } finally {
        if (mounted) setIsProcessing(false);
      }
    };
    createPatient();
    return () => {
      mounted = false;
    };
  }, []);

  if (!patientId || isProcessing) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Preparando tu chat…</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <div className="flex flex-col h-full">
        <main
          className="relative h-full bg-white
  flex divide-y divide-gray-200 flex-col
  justify-between gap-2"
        >
          <ChatComponent
            patientId={patientId}
            userName="User"
            initialHtml={patientDescription || undefined}
          />
        </main>
      </div>
    </QueryClientProvider>
  );
}
