export interface DeleteLocationCascadeInput {
  location: {
    id: number;
    noteId: number | null;
    latitude: number;
    longitude: number;
    tagType: string;
    ownership: string;
    lastUpdated: string;
  };
  deleteItem?: (noteId: number) => Promise<void> | void;
  deleteLocationDb?: (locationId: number) => Promise<void> | void;
  deleteLocation?: (locationId: number) => void;
  fetchItems?: () => Promise<void> | void;
  getLocations?: () => Promise<any[]> | any[];
  setLocations?: (locations: any[]) => void;
}

export async function deleteLocationCascade({
  location,
  deleteItem,
  deleteLocationDb,
  deleteLocation,
  fetchItems,
  getLocations,
  setLocations,
}: DeleteLocationCascadeInput): Promise<void> {
  if (location.noteId && deleteItem) {
    await deleteItem(location.noteId);
  }

  if (deleteLocationDb) {
    await deleteLocationDb(location.id);
  }

  if (deleteLocation) {
    deleteLocation(location.id);
  }

  if (fetchItems) {
    await fetchItems();
  }

  if (getLocations && setLocations) {
    const refreshedLocations = await getLocations();
    setLocations(refreshedLocations);
  }
}
