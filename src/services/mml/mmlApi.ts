import RNFS from 'react-native-fs';
import { MML_API_KEY } from '../../constants/apikey';

/**
 * Lataa karttaruudun (tile) annetun sijainnin ja zoom-tason perusteella.
 * @param latitude Leveysaste
 * @param longitude Pituusaste
 * @param zoomLevel Zoom-taso
 * @returns Paikallisen tiedoston URI
 */
export const fetchTileImage = async (latitude: number, longitude: number, zoomLevel: number): Promise<string> => {
    try {
        // WMTS-palvelun tile-URL-malli
        const tileMatrixSet = 'WGS84_Pseudo-Mercator'; // Käytetään WGS84-koordinaattijärjestelmää
        const layer = 'maastokartta'; // Karttataso
        const style = 'default'; // Oletustyyli

        // Lasketaan tile-indeksit (TileRow ja TileCol)
        const tileX = Math.floor((longitude + 180) / 360 * Math.pow(2, zoomLevel));
        const tileY = Math.floor(
            (1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) /
                2 *
                Math.pow(2, zoomLevel)
        );

        console.log('Calculated tile indices:', { tileX, tileY, zoomLevel }); // Debug tile-indeksit

        // Muodostetaan tile-URL
        const url = `https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/${layer}/${style}/${tileMatrixSet}/${zoomLevel}/${tileY}/${tileX}.png`;
        console.log('Generated tile URL:', url); // Debug URL

        // Muodostetaan Basic Authentication -header
        const credentials = `${MML_API_KEY}:`; // API-avain + tyhjä salasana
        const encodedCredentials = btoa(credentials); // Base64-koodaus
        console.log('Encoded credentials:', encodedCredentials); // Debug Base64-koodaus

        const headers = {
            Authorization: `Basic ${encodedCredentials}`,
        };

        // Lataa kuva ja tallenna se paikallisesti
        const localPath = `${RNFS.DocumentDirectoryPath}/tile_${tileX}_${tileY}_${zoomLevel}.png`;
        const exists = await RNFS.exists(localPath);
        if (exists) {
            console.log('Tile found in cache:', localPath);
            return `file://${localPath}`;
        }
        console.log('Saving tile to:', localPath); // Debug tallennuspolku

        const response = await RNFS.downloadFile({
            fromUrl: url,
            toFile: localPath,
            headers,
        }).promise;

        if (response.statusCode !== 200) {
            throw new Error(`HTTP error! status: ${response.statusCode}`);
        }

        console.log('Tile downloaded successfully:', localPath); // Debug lataus
        return `file://${localPath}`; // Palauta paikallinen URI
    } catch (error) {
        console.error('Error fetching tile image:', error); // Debug virhe
        throw error;
    }
};
