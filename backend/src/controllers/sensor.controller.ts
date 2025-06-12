import { Request, Response } from 'express';

export const getSensors = async (_req: Request, res: Response) => {
  const mockSensors = [
    { id: 1, type: 'température', location: 'Centre-ville', status: 'actif' },
    { id: 2, type: 'bruit', location: 'Nord', status: 'inactif' }
  ];
  res.json(mockSensors);
};
