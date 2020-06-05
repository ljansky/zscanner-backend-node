import { BodyPartsStorage, BodyPartsView, HEALTH_LEVEL_OK, ImageData } from "../types";

export function newDemoBodyPartsStorage(
    {
    }: {
    }): BodyPartsStorage {
    return {
        initialize,
        getBodyPartsViews,
        getBodyPartsViewImage,
        getHealth: () => ({ level: HEALTH_LEVEL_OK, messages: [] }),
    };

    async function initialize() {
        return void 0;
    }

    async function getBodyPartsViews(): Promise<BodyPartsView[]> {
        return DEMO_BODY_PARTS_VIEWS;
    }

    async function getBodyPartsViewImage(id: string): Promise<ImageData | null> {
        const parsedId = parseInt(id, 10);
        if (typeof DEMO_BODY_PARTS_IMAGES[parsedId] !== 'undefined') {
            return {
                data: Buffer.from(DEMO_BODY_PARTS_IMAGES[parsedId], 'base64'),
                type: 'image/png',
            };
        }

        return null;
    }
}

/**
 * This data is completely randomly generated.
 */

export const DEMO_BODY_PARTS_VIEWS: BodyPartsView[] = [
    {
        id: '0',
        bodyParts:
          [
            {
              id: 'leftEye',
              name: 'Left eye',
              coordinates: [0.2, 0.2],
            },
            {
              id: 'rightEye',
              name: 'Right eye',
              coordinates: [0.8, 0.2],
            },
          ],
      },
      {
        id: '1',
        bodyParts:
          [
            {
              id: 'finger',
              name: 'Finger',
              coordinates: [0.1, 0.1],
            },
          ],
      },
];

export const DEMO_BODY_PARTS_IMAGES: string[] = [
    'iVBORw0KGgoAAAANSUhEUgAAADIAAABQCAIAAADUYbG3AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AYFEB0bkLDwJgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAUUlEQVRo3u3OAQ0AMAgAIH0HC9k/iDFeQzdIQNZ07PNiJS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0trSutD7ycAd8tQKR+AAAAAElFTkSuQmCC',
    'iVBORw0KGgoAAAANSUhEUgAAADIAAABQCAIAAADUYbG3AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AYFECgl8+AvOwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAS0lEQVRo3u3OMQEAAAgDoGn/zhrCxwMSUJOPOlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWloHC/GUAZ8PdWxCAAAAAElFTkSuQmCC',
];
