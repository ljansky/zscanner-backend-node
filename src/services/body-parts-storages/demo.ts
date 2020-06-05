import { BodyPartsStorage, BodyPartsView , HEALTH_LEVEL_OK } from "../types";

export function newDemoBodyPartsStorage(
    {
    }: {
    }): BodyPartsStorage {
    return {
        initialize,
        getBodyPartsViews,
        getHealth: () => ({ level: HEALTH_LEVEL_OK, messages: [] }),
    };

    async function initialize() {
        return void 0;
    }

    async function getBodyPartsViews(): Promise<BodyPartsView[]> {
        return DEMO_BODY_PARTS_VIEWS;
    }
}

/**
 * This data is completely randomly generated.
 */

export const DEMO_BODY_PARTS_VIEWS: BodyPartsView[] = [
    {
        imageUrl: 'http://localhost/head.png',
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
        imageUrl: 'http://localhost/hand.png',
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
