import mongoose from 'mongoose';

export const getHealth = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    success: true,
    message: 'Online Examination & Quiz Management System API is healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      readyState: mongoose.connection.readyState,
    },
    environment: process.env.NODE_ENV || 'development',
  });
};
