
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteDocument } from "@/lib/document-api";

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,

    onSuccess: async (_, documentId) => {
      await queryClient.invalidateQueries({
        queryKey: ["documents"],
      });

      queryClient.removeQueries({
        queryKey: ["documents", "status", documentId],
      });
    },
  });
}
