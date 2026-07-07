import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHeroBanners, addHeroBanner, updateHeroBanner, deleteHeroBanner, type HeroSettings } from "./api/hero.server";

export function useHeroBanners() {
  return useQuery({
    queryKey: ["heroBanners"],
    queryFn: () => getHeroBanners(),
  });
}

export function useAddHeroBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { settings: Omit<HeroSettings, 'id'>; imageData?: string; imageExt?: string }) => 
      addHeroBanner({ data }),
    onSuccess: (newBanners) => {
      queryClient.setQueryData(["heroBanners"], newBanners);
    },
  });
}

export function useUpdateHeroBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; settings: Omit<HeroSettings, 'id'>; imageData?: string; imageExt?: string }) => 
      updateHeroBanner({ data }),
    onSuccess: (newBanners) => {
      queryClient.setQueryData(["heroBanners"], newBanners);
    },
  });
}

export function useDeleteHeroBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string }) => 
      deleteHeroBanner({ data }),
    onSuccess: (newBanners) => {
      queryClient.setQueryData(["heroBanners"], newBanners);
    },
  });
}
