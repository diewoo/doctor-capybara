import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";

export function useChat(patientId: string) {
  const queryClient = useQueryClient();

  // Get conversation history
  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversation", patientId],
    queryFn: () => chatService.getConversation(patientId),
    enabled: !!patientId,
  });

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (message: string) => chatService.sendMessage(patientId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", patientId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Get patient info
  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => chatService.getPatient(patientId),
    enabled: !!patientId,
  });

  // Update patient mutation
  const { mutate: updatePatient, isPending: isUpdating } = useMutation({
    mutationFn: (patientInfo: any) => chatService.updatePatient(patientId, patientInfo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      toast.success("Patient information updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update patient information");
    },
  });

  return {
    conversation,
    patient,
    isLoading,
    isLoadingPatient,
    isSending,
    isUpdating,
    sendMessage,
    updatePatient,
  };
} 