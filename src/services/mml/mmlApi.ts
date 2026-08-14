import RNFS from 'react-native-fs';
import { MML_API_KEY } from '../../constants/apikey';

const TILE_MATRIX_SET = 'WGS84_Pseudo-Mercator';
const TILE_LAYER = 'maastokartta';
const TILE_STYLE = 'default';

export const fetchTileImage = async (latitude: number, longitude: number, zoomLevel: number): Promise<string> => {
    const tileX = Math.floor((longitude + 180) / 360 * Math.pow(2, zoomLevel));
    const tileY = Math.floor(
        (1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) /
            2 * Math.pow(2, zoomLevel)
    );
    return fetchTileImageByIndices(tileX, tileY, zoomLevel);
};

export const fetchTileImageByIndices = async (tileX: number, tileY: number, zoomLevel: number): Promise<string> => {
    const url = `https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/${TILE_LAYER}/${TILE_STYLE}/${TILE_MATRIX_SET}/${zoomLevel}/${tileY}/${tileX}.png`;
    const localPath = `${RNFS.DocumentDirectoryPath}/tile_${tileX}_${tileY}_${zoomLevel}.png`;

    if (await RNFS.exists(localPath)) {
        console.log('[WMTS] cache-hit', { tileX, tileY, zoomLevel, localPath });
        return `file://${localPath}`;
    }

    const credentials = `${MML_API_KEY}:`;
    const encodedCredentials = btoa(credentials);
    console.log('[WMTS] downloading', { tileX, tileY, zoomLevel, url });
    const response = await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
        headers: { Authorization: `Basic ${encodedCredentials}` },
    }).promise;
    console.log('[WMTS] download response', { tileX, tileY, zoomLevel, statusCode: response.statusCode, bytesWritten: response.bytesWritten });
    if (response.statusCode !== 200) {
        throw new Error(`HTTP error! status: ${response.statusCode}`);
    }

    return `file://${localPath}`;
};
