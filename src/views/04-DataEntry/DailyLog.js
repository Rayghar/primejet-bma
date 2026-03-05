// src/views/Finance/DailyLog.js
import React from 'react';
import CloseWorkspace from './CloseWorkspace';

/**
 * Legacy route compatibility.
 * We replaced the old DailyLog with GL-first CloseWorkspace.
 */
export default function DailyLog() {
  return <CloseWorkspace />;
}