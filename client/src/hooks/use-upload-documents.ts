
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadDocument } from "@/lib/document-api";

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
    },
  });
}
