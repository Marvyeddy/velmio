
import { useQuery } from "@tanstack/react-query";

import { getDocumentStatus } from "@/lib/document-api";

export function useDocumentStatus(documentId: string | null) {
  return useQuery({
    queryKey: ["documents", "status", documentId],

    queryFn: () => getDocumentStatus(documentId!),

    enabled: Boolean(documentId),

    refetchInterval: (query) => {
      const status = query.state.data?.status;

      if (status === "completed" || status === "failed") {
        return false;
      }

      return 2000;
    },

    refetchOnWindowFocus: false,
  });
}
