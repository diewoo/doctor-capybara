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
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const queryClient = new QueryClient();

export const chatRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  component: ChatPage,
});

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  age: z.string().min(1, "La edad es requerida"),
  symptoms: z.string().min(1, "Los síntomas son requeridos"),
  medicalHistory: z.string().optional(),
});

function ChatPage() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientDescription, setPatientDescription] = useState<string | null>(
    null
  );
  const [showChat, setShowChat] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const handlePatientInfoSubmit = async (
    values: z.infer<typeof formSchema>
  ) => {
    try {
      setIsProcessing(true);
      setError(null);
      const patientInfo = `Paciente ${values.name}, ${values.age} años, ${values.symptoms}, historial: ${values.medicalHistory || "no especificado"}.`;
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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handlePatientInfoSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Paciente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ingrese el nombre completo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Edad</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ingrese la edad"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Síntomas</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describa los síntomas del paciente"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Historial Médico</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describa el historial médico relevante"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isProcessing || !form.formState.isValid}
                  className="w-full"
                >
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
            </Form>
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
