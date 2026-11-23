
import { useQuery } from "@tanstack/react-query";
import { listDocuments } from "@/lib/document-api";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
