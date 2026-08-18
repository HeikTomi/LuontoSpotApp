import { deleteLocationCascade } from '../src/features/map/deleteLocationCascade';

describe('deleteLocationCascade', () => {
  it('deletes both note and location, then refreshes the lists', async () => {
    const deleteItem = jest.fn().mockResolvedValue(undefined);
    const deleteLocationDb = jest.fn().mockResolvedValue(undefined);
    const deleteLocation = jest.fn();
    const fetchItems = jest.fn().mockResolvedValue(undefined);
    const getLocations = jest.fn().mockResolvedValue([]);
    const setLocations = jest.fn();

    await deleteLocationCascade({
      location: { id: 9, noteId: 4, latitude: 1, longitude: 2, tagType: 'Sieni', ownership: 'user', lastUpdated: '2024-01-01' },
      deleteItem,
      deleteLocationDb,
      deleteLocation,
      fetchItems,
      getLocations,
      setLocations,
    });

    expect(deleteItem).toHaveBeenCalledWith(4);
    expect(deleteLocationDb).toHaveBeenCalledWith(9);
    expect(deleteLocation).toHaveBeenCalledWith(9);
    expect(fetchItems).toHaveBeenCalledWith();
    expect(setLocations).toHaveBeenCalledWith([]);
  });

  it('still removes only the location when there is no associated note', async () => {
    const deleteItem = jest.fn();
    const deleteLocationDb = jest.fn().mockResolvedValue(undefined);
    const deleteLocation = jest.fn();
    const fetchItems = jest.fn().mockResolvedValue(undefined);
    const getLocations = jest.fn().mockResolvedValue([]);
    const setLocations = jest.fn();

    await deleteLocationCascade({
      location: { id: 10, noteId: null, latitude: 1, longitude: 2, tagType: 'Sieni', ownership: 'user', lastUpdated: '2024-01-01' },
      deleteItem,
      deleteLocationDb,
      deleteLocation,
      fetchItems,
      getLocations,
      setLocations,
    });

    expect(deleteItem).not.toHaveBeenCalled();
    expect(deleteLocationDb).toHaveBeenCalledWith(10);
    expect(deleteLocation).toHaveBeenCalledWith(10);
  });
});
