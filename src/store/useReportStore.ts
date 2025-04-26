import { create } from 'zustand';

interface Image {
  id: string;
  data: string;
  containerId: string;
  fonte: string;
}

interface ChartFonte {
  containerId: string;
  fonte: string;
}

interface VisibilityConfig {
  colheita: {
    disponibilidadeMecanica: boolean;
    eficienciaEnergetica: boolean;
    motorOcioso: boolean;
    horaElevador: boolean;
    usoGPS: boolean;
    mediaVelocidade: boolean;
  };
  transbordo: {
    disponibilidadeMecanica: boolean;
    eficienciaEnergetica: boolean;
    motorOcioso: boolean;
    faltaApontamento: boolean;
    usoGPS: boolean;
    mediaVelocidade: boolean;
  };
}

// Key-value store for per-report visibility settings
interface ReportVisibilityConfigs {
  [reportId: string]: VisibilityConfig;
}

interface ReportState {
  images: Image[];
  chartFontes: ChartFonte[];
  isReportGenerated: boolean;
  visibilityConfig: VisibilityConfig;
  currentReportId: string | null;
  reportVisibilityConfigs: ReportVisibilityConfigs;
  addImage: (image: Omit<Image, 'id'>) => void;
  removeImage: (containerId: string) => void;
  clearImages: () => void;
  setReportGenerated: (status: boolean) => void;
  updateImageFonte: (containerId: string, fonte: string) => void;
  setChartFonte: (containerId: string, fonte: string) => void;
  clearChartFontes: () => void;
  setVisibilityConfig: (config: Partial<VisibilityConfig>) => void;
  resetVisibilityConfig: () => void;
  setCurrentReportId: (reportId: string | null) => void;
  setReportVisibilityConfig: (reportId: string, config: VisibilityConfig) => void;
  getReportVisibilityConfig: (reportId: string) => VisibilityConfig;
}

const defaultVisibilityConfig: VisibilityConfig = {
  colheita: {
    disponibilidadeMecanica: true,
    eficienciaEnergetica: true,
    motorOcioso: true,
    horaElevador: true,
    usoGPS: true,
    mediaVelocidade: true
  },
  transbordo: {
    disponibilidadeMecanica: true,
    eficienciaEnergetica: true,
    motorOcioso: true,
    faltaApontamento: true,
    usoGPS: true,
    mediaVelocidade: true
  }
};

export const useReportStore = create<ReportState>((set, get) => ({
  images: [],
  chartFontes: [],
  isReportGenerated: false,
  visibilityConfig: defaultVisibilityConfig,
  currentReportId: null,
  reportVisibilityConfigs: {},

  addImage: (image) => set((state) => ({
    images: [
      ...state.images.filter(img => img.containerId !== image.containerId),
      { ...image, id: Date.now().toString() }
    ]
  })),

  removeImage: (containerId) => set((state) => ({
    images: state.images.filter(img => img.containerId !== containerId)
  })),

  clearImages: () => set({ images: [] }),

  setReportGenerated: (status) => set({ isReportGenerated: status }),

  updateImageFonte: (containerId, fonte) => set((state) => ({
    images: state.images.map(img =>
      img.containerId === containerId
        ? { ...img, fonte }
        : img
    )
  })),

  setChartFonte: (containerId, fonte) => set((state) => ({
    chartFontes: [
      ...state.chartFontes.filter(f => f.containerId !== containerId),
      { containerId, fonte }
    ]
  })),

  clearChartFontes: () => set({ chartFontes: [] }),

  setVisibilityConfig: (config) => {
    const { currentReportId } = get();
    
    // Update global config
    set((state) => ({
      visibilityConfig: { 
        ...state.visibilityConfig, 
        ...config 
      }
    }));
    
    // If we have a current report ID, also update the per-report config
    if (currentReportId) {
      set((state) => {
        const currentConfig = state.reportVisibilityConfigs[currentReportId] || { ...defaultVisibilityConfig };
        return {
          reportVisibilityConfigs: {
            ...state.reportVisibilityConfigs,
            [currentReportId]: { ...currentConfig, ...config }
          }
        };
      });
    }
  },

  resetVisibilityConfig: () => {
    const { currentReportId } = get();
    
    // Reset global config
    set({ visibilityConfig: defaultVisibilityConfig });
    
    // If we have a current report ID, also reset the per-report config
    if (currentReportId) {
      set((state) => ({
        reportVisibilityConfigs: {
          ...state.reportVisibilityConfigs,
          [currentReportId]: { ...defaultVisibilityConfig }
        }
      }));
    }
  },
  
  // Methods for managing per-report visibility
  setCurrentReportId: (reportId) => set({ currentReportId: reportId }),
  
  setReportVisibilityConfig: (reportId, config) => set((state) => ({
    reportVisibilityConfigs: {
      ...state.reportVisibilityConfigs,
      [reportId]: config
    }
  })),
  
  getReportVisibilityConfig: (reportId) => {
    const { reportVisibilityConfigs } = get();
    return reportVisibilityConfigs[reportId] || defaultVisibilityConfig;
  }
})); 