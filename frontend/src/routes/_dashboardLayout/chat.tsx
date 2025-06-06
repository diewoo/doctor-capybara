import React, { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import ChatComponent from "@/components/ChatComponent";
import { chatService } from "@/services/chatService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  const [patientDescription, setPatientDescription] = useState<string | null>(
    null
  );
  const [showChat, setShowChat] = useState(false);

  const handlePatientInfoSubmit = async (patientInfo: any) => {
    try {
      setIsProcessing(true);
      setError(null);
      const response = await chatService.processPatientInfo(patientInfo);
      setPatientId(response.id);
      setPatientDescription(response.htmlDescription);
    } catch (err) {
      setError(
        "Error al procesar la información del paciente. Por favor, intente nuevamente."
      );
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center p-4 ">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Información del Paciente</CardTitle>
            <CardDescription>
              Por favor, complete la información del paciente para iniciar la
              consulta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const patientInfo = `Paciente ${formData.get("name")}, ${formData.get("age")} años, ${formData.get("symptoms")}, historial: ${formData.get("medicalHistory") || "no especificado"}.`;
                handlePatientInfoSubmit(patientInfo);
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Paciente</Label>
                <Input
                  type="text"
                  name="name"
                  id="name"
                  required
                  placeholder="Ingrese el nombre completo"
                  value="Juan Perez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input
                  type="number"
                  name="age"
                  id="age"
                  required
                  placeholder="Ingrese la edad"
                  value="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms">Síntomas</Label>
                <Textarea
                  name="symptoms"
                  id="symptoms"
                  required
                  placeholder="Describa los síntomas del paciente"
                  className="min-h-[100px]"
                  value="me duele la cabeza"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Historial Médico</Label>
                <Textarea
                  name="medicalHistory"
                  id="medicalHistory"
                  placeholder="Describa el historial médico relevante"
                  className="min-h-[100px]"
                  value="tengo una hernia"
                />
              </div>
              <Button type="submit" disabled={isProcessing} className="w-full">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Iniciar Consulta"
                )}
              </Button>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (patientDescription && !showChat) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Resumen del Paciente</CardTitle>
            <CardDescription>
              Revisa la información procesada antes de iniciar el chat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="text-sm leading-relaxed space-y-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>h1]:text-xl [&>h1]:font-bold [&>h2]:text-lg [&>h2]:font-semibold [&>h3]:text-base [&>h3]:font-medium"
              dangerouslySetInnerHTML={{ __html: patientDescription }}
            />
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowChat(true)}
                className="w-full sm:w-auto"
              >
                Continuar al Chat
              </Button>
            </div>
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
          <ChatComponent patientId={patientId || ""} userName="User" />
        </main>
      </div>
    </QueryClientProvider>
  );
}
