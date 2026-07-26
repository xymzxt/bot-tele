class RuntimeStateService {
  private maintenanceMode = false;

  isMaintenanceMode(): boolean {
    return this.maintenanceMode;
  }

  setMaintenanceMode(value: boolean): void {
    this.maintenanceMode = value;
  }
}

export const runtimeState = new RuntimeStateService();
