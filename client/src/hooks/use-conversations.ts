
import {
    useMutation,
    useQuery,
    useQueryClient,
  } from "@tanstack/react-query";
  
  import {
    getConversations,
    getConversation,
    renameConversation,
    deleteConversation,
  } from "@/lib/conversation";
  
  export const conversationKeys = {
    all: ["conversations"] as const,
    detail: (id: string) => ["conversations", id] as const,
  };
  
  export function useConversations() {
    return useQuery({
      queryKey: conversationKeys.all,
      queryFn: getConversations,
    });
  }
  
  export function useConversation(conversationId: string | null) {
    return useQuery({
      queryKey: conversationId
        ? conversationKeys.detail(conversationId)
        : ["conversations", "inactive"],
      queryFn: () => getConversation(conversationId!),
      enabled: Boolean(conversationId),
    });
  }
  
  export function useRenameConversation() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: ({
        id,
        title,
      }: {
        id: string;
        title: string;
      }) => renameConversation(id, { title }),
  
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: conversationKeys.all,
        });
      },
    });
  }
  
  export function useDeleteConversation() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: deleteConversation,
  
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: conversationKeys.all,
        });
      },
    });
  }
  