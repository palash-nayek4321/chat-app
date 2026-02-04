export const createActiveIconSlice = (set, get) => ({
  activeIcon: "chat",
  activeFilter: "all",
  setActiveIcon: (activeIcon) => set({ activeIcon }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
});
