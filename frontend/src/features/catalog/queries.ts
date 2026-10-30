import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { Category, City, CountItem } from "@/types/api"

// Danh mục ít thay đổi: giữ trong bộ nhớ suốt phiên
export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: () => api.get<Category[]>("/categories"), staleTime: Infinity })

export const useCities = () => useQuery({ queryKey: ["cities"], queryFn: () => api.get<City[]>("/cities"), staleTime: Infinity })

export const usePublicStats = () =>
  useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => Object.fromEntries((await api.get<CountItem[]>("/stats")).map((i) => [i.label, i.value])),
  })
