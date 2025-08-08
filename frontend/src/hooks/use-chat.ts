import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";

export function useChat(patientId: string) {
  const queryClient = useQueryClient();

  // Get conversation history
  const {
    data: conversation,
    isLoading,
    refetch: refetchConversation,
  } = useQuery({
    queryKey: ["conversation", patientId],
    queryFn: async () => {
      const response = await chatService.getConversation(patientId);
      console.log("Conversation response:", response);
      return response;
    },
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

  // Streaming helper: returns unsubscribe function
  const streamMessage = (
    message: string,
    handlers: {
      onDelta: (delta: string) => void;
      onDone?: () => void;
      onError?: (err: unknown) => void;
    }
  ) => {
    return chatService.streamMessage(patientId, message, handlers);
  };

  const streamEditLastMessage = (
    message: string,
    handlers: {
      onDelta: (delta: string) => void;
      onDone?: () => void;
      onError?: (err: unknown) => void;
    }
  ) => {
    return chatService.streamEditLastMessage(patientId, message, handlers);
  };

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
    refetchConversation,
    streamMessage,
    streamEditLastMessage,
    updatePatient,
  };
}
